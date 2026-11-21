using System;
using System.Threading.Tasks;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using UnityEngine;
using UnityEngine.SceneManagement;
using MultiplayerRacing.Networking;

namespace MultiplayerRacing.Core
{
    /// <summary>
    /// Master Connection Orchestrator coordinating NGO NetworkManager across
    /// Local LAN (Wi-Fi) and Online (Unity Services: Lobby + Relay) modes.
    /// </summary>
    public class ConnectionManager : MonoBehaviour
    {
        public static ConnectionManager Instance { get; private set; }

        [Header("Components")]
        [SerializeField] private LocalNetworkManager localNetworkManager;
        [SerializeField] private OnlineNetworkManager onlineNetworkManager;
        [SerializeField] private RoomManager roomManager;
        [SerializeField] private DisconnectionHandler disconnectionHandler;

        public NetworkMode CurrentMode { get; private set; } = NetworkMode.None;
        public bool IsHost => NetworkManager.Singleton != null && NetworkManager.Singleton.IsHost;
        public bool IsClient => NetworkManager.Singleton != null && NetworkManager.Singleton.IsClient;
        public bool IsConnected => NetworkManager.Singleton != null && NetworkManager.Singleton.IsConnectedClient;

        public event Action<bool, string> OnConnectionStatusChanged;

        private void Awake()
        {
            if (Instance != null && Instance != parent)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            ConfigureNetworkManagerCallbacks();
        }

        private void ConfigureNetworkManagerCallbacks()
        {
            if (NetworkManager.Singleton == null)
            {
                Debug.LogError("[ConnectionManager] NetworkManager.Singleton not found in scene!");
                return;
            }

            NetworkManager.Singleton.OnClientConnectedCallback += HandleClientConnected;
            NetworkManager.Singleton.OnClientDisconnectCallback += HandleClientDisconnected;
            NetworkManager.Singleton.OnServerStarted += HandleServerStarted;
        }

        private void OnDestroy()
        {
            if (NetworkManager.Singleton != null)
            {
                NetworkManager.Singleton.OnClientConnectedCallback -= HandleClientConnected;
                NetworkManager.Singleton.OnClientDisconnectCallback -= HandleClientDisconnected;
                NetworkManager.Singleton.OnServerStarted -= HandleServerStarted;
            }
        }

        #region Local LAN Flow

        public async Task<bool> StartLocalHost(string roomName, int maxPlayers = GameConstants.MAX_PLAYERS, ushort port = GameConstants.DEFAULT_LAN_PORT)
        {
            CurrentMode = NetworkMode.LocalLAN;
            UnityTransport transport = NetworkManager.Singleton.GetComponent<UnityTransport>();
            if (transport != null)
            {
                transport.SetConnectionData("0.0.0.0", port);
            }

            bool success = NetworkManager.Singleton.StartHost();
            if (success)
            {
                localNetworkManager.StartBroadcasting(roomName, port, maxPlayers);
                OnConnectionStatusChanged?.Invoke(true, "Local Host started on port " + port);
                Debug.Log($"[ConnectionManager] Local LAN Host started on port {port}");
            }
            else
            {
                CurrentMode = NetworkMode.None;
                OnConnectionStatusChanged?.Invoke(false, "Failed to start local host");
            }
            return success;
        }

        public async Task<bool> JoinLocalClient(string ipAddress, ushort port = GameConstants.DEFAULT_LAN_PORT)
        {
            CurrentMode = NetworkMode.LocalLAN;
            localNetworkManager.StopDiscovery();

            UnityTransport transport = NetworkManager.Singleton.GetComponent<UnityTransport>();
            if (transport != null)
            {
                transport.SetConnectionData(ipAddress, port);
            }

            bool success = NetworkManager.Singleton.StartClient();
            if (success)
            {
                OnConnectionStatusChanged?.Invoke(true, $"Connecting to {ipAddress}:{port}...");
                Debug.Log($"[ConnectionManager] Connecting to LAN host at {ipAddress}:{port}");
            }
            else
            {
                CurrentMode = NetworkMode.None;
                OnConnectionStatusChanged?.Invoke(false, "Failed to initiate client connection");
            }
            return success;
        }

        #endregion

        #region Online Lobby & Relay Flow

        public async Task<string> StartOnlineHost(string lobbyName, int maxPlayers = GameConstants.MAX_PLAYERS)
        {
            CurrentMode = NetworkMode.OnlineRelay;
            string relayJoinCode = await onlineNetworkManager.CreateLobbyAndRelayHost(lobbyName, maxPlayers);
            if (!string.IsNullOrEmpty(relayJoinCode))
            {
                bool hostStarted = NetworkManager.Singleton.StartHost();
                if (hostStarted)
                {
                    OnConnectionStatusChanged?.Invoke(true, $"Online Host running. Code: {relayJoinCode}");
                    Debug.Log($"[ConnectionManager] Online Host started with Relay Join Code: {relayJoinCode}");
                    return relayJoinCode;
                }
            }

            CurrentMode = NetworkMode.None;
            OnConnectionStatusChanged?.Invoke(false, "Failed to start Online Host");
            return null;
        }

        public async Task<bool> JoinOnlineClientByCode(string relayJoinCode)
        {
            CurrentMode = NetworkMode.OnlineRelay;
            bool setupOk = await onlineNetworkManager.JoinRelayClient(relayJoinCode);
            if (!setupOk)
            {
                CurrentMode = NetworkMode.None;
                OnConnectionStatusChanged?.Invoke(false, "Invalid Room Code or Relay Allocation Failed");
                return false;
            }

            bool clientStarted = NetworkManager.Singleton.StartClient();
            if (clientStarted)
            {
                OnConnectionStatusChanged?.Invoke(true, $"Joining room {relayJoinCode}...");
                Debug.Log($"[ConnectionManager] Online Client connected to Relay with Code: {relayJoinCode}");
                return true;
            }

            CurrentMode = NetworkMode.None;
            OnConnectionStatusChanged?.Invoke(false, "Failed to start Netcode Client");
            return false;
        }

        #endregion

        #region Session Teardown

        public void DisconnectAndShutdown()
        {
            localNetworkManager.StopDiscovery();
            localNetworkManager.StopBroadcasting();

            if (CurrentMode == NetworkMode.OnlineRelay)
            {
                onlineNetworkManager.LeaveLobby();
            }

            if (NetworkManager.Singleton != null && (NetworkManager.Singleton.IsClient || NetworkManager.Singleton.IsServer))
            {
                NetworkManager.Singleton.Shutdown();
            }

            CurrentMode = NetworkMode.None;
            OnConnectionStatusChanged?.Invoke(false, "Disconnected");

            if (SceneManager.GetActiveScene().name != GameConstants.SCENE_LOBBY)
            {
                SceneManager.LoadScene(GameConstants.SCENE_LOBBY);
            }
        }

        #endregion

        #region Callbacks

        private void HandleServerStarted()
        {
            Debug.Log("[ConnectionManager] Server/Host initialized.");
        }

        private void HandleClientConnected(ulong clientId)
        {
            Debug.Log($"[ConnectionManager] Client connected with ID: {clientId}");
            if (NetworkManager.Singleton.IsServer)
            {
                roomManager.RegisterPlayer(clientId);
            }
        }

        private void HandleClientDisconnected(ulong clientId)
        {
            Debug.Log($"[ConnectionManager] Client disconnected: {clientId}");
            disconnectionHandler.HandlePlayerDisconnected(clientId);
        }

        #endregion
    }
}

