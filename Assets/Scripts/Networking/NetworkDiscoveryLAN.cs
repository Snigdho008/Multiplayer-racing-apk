using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using UnityEngine;
using MultiplayerRacing.Core;

namespace MultiplayerRacing.Networking
{
    [System.Serializable]
    public struct DiscoveredRoom
    {
        public string roomName;
        public string hostIp;
        public ushort port;
        public int currentPlayers;
        public int maxPlayers;
        public float lastSeenTime;
    }

    /// <summary>
    /// Lightweight UDP Multicast/Broadcast service discovery for local Wi-Fi.
    /// Operates without any internet connection or cloud service.
    /// </summary>
    public class NetworkDiscoveryLAN : MonoBehaviour
    {
        [SerializeField] private int discoveryPort = GameConstants.DEFAULT_DISCOVERY_PORT;
        [SerializeField] private float broadcastInterval = 1.0f;

        public event Action<DiscoveredRoom> OnRoomDiscovered;

        private UdpClient broadcastClient;
        private UdpClient listenerClient;
        private Thread listenThread;
        private bool isListening;
        private bool isBroadcasting;
        private string broadcastPayload;
        private float lastBroadcastTimer;

        public void StartBroadcasting(string roomName, ushort gamePort, int maxPlayers)
        {
            StopBroadcasting();

            broadcastPayload = $"{GameConstants.BROADCAST_HANDSHAKE_MESSAGE}|{roomName}|{gamePort}|1|{maxPlayers}";
            broadcastClient = new UdpClient();
            broadcastClient.EnableBroadcast = true;
            isBroadcasting = true;
            Debug.Log($"[NetworkDiscoveryLAN] Broadcasting room '{roomName}' on LAN port {discoveryPort}");
        }

        public void StopBroadcasting()
        {
            isBroadcasting = false;
            if (broadcastClient != null)
            {
                broadcastClient.Close();
                broadcastClient = null;
            }
        }

        public void StartListening()
        {
            StopListening();

            try
            {
                listenerClient = new UdpClient();
                listenerClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                listenerClient.Client.Bind(new IPEndPoint(IPAddress.Any, discoveryPort));

                isListening = true;
                listenThread = new Thread(ListenLoop) { IsBackground = true };
                listenThread.Start();
                Debug.Log($"[NetworkDiscoveryLAN] Listening for LAN rooms on port {discoveryPort}");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[NetworkDiscoveryLAN] Could not bind listener socket: {ex.Message}");
            }
        }

        public void StopListening()
        {
            isListening = false;
            if (listenerClient != null)
            {
                listenerClient.Close();
                listenerClient = null;
            }
            if (listenThread != null && listenThread.IsAlive)
            {
                listenThread.Abort();
                listenThread = null;
            }
        }

        private void Update()
        {
            if (isBroadcasting)
            {
                lastBroadcastTimer += Time.deltaTime;
                if (lastBroadcastTimer >= broadcastInterval)
                {
                    lastBroadcastTimer = 0f;
                    SendBroadcastPacket();
                }
            }
        }

        private void SendBroadcastPacket()
        {
            try
            {
                byte[] bytes = Encoding.UTF8.GetBytes(broadcastPayload);
                IPEndPoint endPoint = new IPEndPoint(IPAddress.Broadcast, discoveryPort);
                broadcastClient.Send(bytes, bytes.Length, endPoint);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[NetworkDiscoveryLAN] Broadcast send error: {ex.Message}");
            }
        }

        private void ListenLoop()
        {
            IPEndPoint senderEndpoint = new IPEndPoint(IPAddress.Any, 0);
            while (isListening)
            {
                try
                {
                    byte[] data = listenerClient.Receive(ref senderEndpoint);
                    string message = Encoding.UTF8.GetString(data);

                    if (message.StartsWith(GameConstants.BROADCAST_HANDSHAKE_MESSAGE))
                    {
                        string[] parts = message.Split('|');
                        if (parts.Length >= 5)
                        {
                            DiscoveredRoom room = new DiscoveredRoom
                            {
                                roomName = parts[1],
                                hostIp = senderEndpoint.Address.ToString(),
                                port = ushort.Parse(parts[2]),
                                currentPlayers = int.Parse(parts[3]),
                                maxPlayers = int.Parse(parts[4]),
                                lastSeenTime = Time.time
                            };

                            // Deliver on main thread
                            ExecuteOnMainThread(() => OnRoomDiscovered?.Invoke(room));
                        }
                    }
                }
                catch (SocketException)
                {
                    // Socket closed
                    break;
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[NetworkDiscoveryLAN] Listen exception: {ex.Message}");
                }
            }
        }

        private void ExecuteOnMainThread(Action action)
        {
            // Unity-safe main thread dispatch
            UnitySynchronizationContext.Current?.Post(_ => action(), null);
        }

        private void OnDestroy()
        {
            StopBroadcasting();
            StopListening();
        }
    }

    public class UnitySynchronizationContext
    {
        public static SynchronizationContext Current => SynchronizationContext.Current;
    }
}

