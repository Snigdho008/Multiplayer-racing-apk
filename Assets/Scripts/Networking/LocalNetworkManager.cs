using System;
using System.Collections.Generic;
using UnityEngine;
using MultiplayerRacing.Core;

namespace MultiplayerRacing.Networking
{
    /// <summary>
    /// Manages Local Wi-Fi / LAN networking: broadcasting host availability,
    /// searching for rooms on the local subnet, and manual direct IP fallback.
    /// </summary>
    public class LocalNetworkManager : MonoBehaviour
    {
        [SerializeField] private NetworkDiscoveryLAN discovery;

        private readonly Dictionary<string, DiscoveredRoom> availableRooms = new Dictionary<string, DiscoveredRoom>();

        public event Action<List<DiscoveredRoom>> OnRoomListUpdated;

        private void Awake()
        {
            if (discovery == null)
            {
                discovery = gameObject.AddComponent<NetworkDiscoveryLAN>();
            }

            discovery.OnRoomDiscovered += HandleRoomDiscovered;
        }

        public void StartBroadcasting(string roomName, ushort port, int maxPlayers)
        {
            discovery.StartBroadcasting(roomName, port, maxPlayers);
        }

        public void StopBroadcasting()
        {
            discovery.StopBroadcasting();
        }

        public void StartDiscovery()
        {
            availableRooms.Clear();
            discovery.StartListening();
        }

        public void StopDiscovery()
        {
            discovery.StopListening();
        }

        private void HandleRoomDiscovered(DiscoveredRoom room)
        {
            string key = $"{room.hostIp}:{room.port}";
            availableRooms[key] = room;
            NotifyRoomsChanged();
        }

        private void NotifyRoomsChanged()
        {
            List<DiscoveredRoom> rooms = new List<DiscoveredRoom>(availableRooms.Values);
            OnRoomListUpdated?.Invoke(rooms);
        }
    }
}

