using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using Unity.Networking.Transport.Relay;
using Unity.Services.Authentication;
using Unity.Services.Core;
using Unity.Services.Lobby;
using Unity.Services.Lobby.Models;
using Unity.Services.Relay;
using Unity.Services.Relay.Models;
using UnityEngine;
using MultiplayerRacing.Core;

namespace MultiplayerRacing.Networking
{
    /// <summary>
    /// Manages Online Multiplayer using Unity Gaming Services:
    /// Unity Authentication, Unity Lobby (matchmaking/room listing), and Unity Relay (NAT traversal).
    /// </summary>
    public class OnlineNetworkManager : MonoBehaviour
    {
        private Lobby currentLobby;
        private string activeRelayJoinCode;
        private float heartbeatTimer;

        public bool IsInitialized => UnityServices.State == ServicesInitializationState.Initialized;

        private async void Start()
        {
            await InitializeServicesAsync();
        }

        public async Task<bool> InitializeServicesAsync()
        {
            try
            {
                if (UnityServices.State != ServicesInitializationState.Initialized)
                {
                    await UnityServices.InitializeAsync();
                }

                if (!AuthenticationService.Instance.IsSignedIn)
                {
                    await AuthenticationService.Instance.SignInAnonymouslyAsync();
                    Debug.Log($"[OnlineNetworkManager] Signed in anonymously. Player ID: {AuthenticationService.Instance.PlayerId}");
                }
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[OnlineNetworkManager] UGS Initialization failed: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Creates a Relay allocation for up to 4 players and registers the room in Unity Lobby.
        /// </summary>
        public async Task<string> CreateLobbyAndRelayHost(string lobbyName, int maxPlayers = GameConstants.MAX_PLAYERS)
        {
            try
            {
                if (!IsInitialized)
                {
                    bool init = await InitializeServicesAsync();
                    if (!init) return null;
                }

                // 1. Allocate Relay
                Allocation allocation = await RelayService.Instance.CreateAllocationAsync(maxPlayers - 1);
                activeRelayJoinCode = await RelayService.Instance.GetJoinCodeAsync(allocation.AllocationId);

                // 2. Configure UnityTransport with Relay Server Data
                UnityTransport transport = NetworkManager.Singleton.GetComponent<UnityTransport>();
                RelayServerData relayServerData = new RelayServerData(allocation, "dtls");
                transport.SetRelayServerData(relayServerData);

                // 3. Create Lobby with Relay Code stored in custom data
                CreateLobbyOptions options = new CreateLobbyOptions
                {
                    IsPrivate = false,
                    Data = new Dictionary<string, DataObject>
                    {
                        { "RelayCode", new DataObject(DataObject.VisibilityOptions.Public, activeRelayJoinCode) }
                    }
                };

                currentLobby = await LobbyService.Instance.CreateLobbyAsync(lobbyName, maxPlayers, options);
                Debug.Log($"[OnlineNetworkManager] Lobby '{lobbyName}' created with Relay Code: {activeRelayJoinCode}");
                return activeRelayJoinCode;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[OnlineNetworkManager] CreateLobbyAndRelayHost failed: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Joins an existing Relay host via 6-character room code.
        /// </summary>
        public async Task<bool> JoinRelayClient(string relayJoinCode)
        {
            try
            {
                if (!IsInitialized)
                {
                    bool init = await InitializeServicesAsync();
                    if (!init) return false;
                }

                JoinAllocation joinAllocation = await RelayService.Instance.JoinAllocationAsync(relayJoinCode);
                UnityTransport transport = NetworkManager.Singleton.GetComponent<UnityTransport>();
                RelayServerData relayServerData = new RelayServerData(joinAllocation, "dtls");
                transport.SetRelayServerData(relayServerData);

                Debug.Log($"[OnlineNetworkManager] Joined Relay allocation with code {relayJoinCode}");
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[OnlineNetworkManager] JoinRelayClient failed: {ex.Message}");
                return false;
            }
        }

        public async void LeaveLobby()
        {
            try
            {
                if (currentLobby != null)
                {
                    if (currentLobby.HostId == AuthenticationService.Instance.PlayerId)
                    {
                        await LobbyService.Instance.DeleteLobbyAsync(currentLobby.Id);
                    }
                    else
                    {
                        await LobbyService.Instance.RemovePlayerAsync(currentLobby.Id, AuthenticationService.Instance.PlayerId);
                    }
                    currentLobby = null;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[OnlineNetworkManager] Error leaving lobby: {ex.Message}");
            }
        }

        private void Update()
        {
            HandleLobbyHeartbeat();
        }

        private async void HandleLobbyHeartbeat()
        {
            if (currentLobby != null && currentLobby.HostId == AuthenticationService.Instance?.PlayerId)
            {
                heartbeatTimer += Time.deltaTime;
                if (heartbeatTimer >= 15f)
                {
                    heartbeatTimer = 0f;
                    try
                    {
                        await LobbyService.Instance.SendHeartbeatPingAsync(currentLobby.Id);
                    }
                    catch (Exception ex)
                    {
                        Debug.LogWarning($"[OnlineNetworkManager] Heartbeat failed: {ex.Message}");
                    }
                }
            }
        }
    }
}

