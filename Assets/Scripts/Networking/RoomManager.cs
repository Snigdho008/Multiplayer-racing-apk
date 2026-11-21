using System;
using System.Collections.Generic;
using Unity.Collections;
using Unity.Netcode;
using UnityEngine;
using UnityEngine.SceneManagement;
using MultiplayerRacing.Core;

namespace MultiplayerRacing.Networking
{
    [System.Serializable]
    public struct PlayerSlotData : INetworkSerializable, IEquatable<PlayerSlotData>
    {
        public ulong ClientId;
        public FixedString64Bytes PlayerName;
        public int CarColorIndex;
        public bool IsReady;
        public int GridPositionIndex;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            serializer.SerializeValue(ref ClientId);
            serializer.SerializeValue(ref PlayerName);
            serializer.SerializeValue(ref CarColorIndex);
            serializer.SerializeValue(ref IsReady);
            serializer.SerializeValue(ref GridPositionIndex);
        }

        public bool Equals(PlayerSlotData other)
        {
            return ClientId == other.ClientId &&
                   PlayerName.Equals(other.PlayerName) &&
                   CarColorIndex == other.CarColorIndex &&
                   IsReady == other.IsReady &&
                   GridPositionIndex == other.GridPositionIndex;
        }
    }

    /// <summary>
    /// Synchronizes 2-4 player lobby slots, car customizations, ready states,
    /// and triggers scene transition when all racers are confirmed.
    /// </summary>
    public class RoomManager : NetworkBehaviour
    {
        public static RoomManager Instance { get; private set; }

        public NetworkList<PlayerSlotData> PlayerSlots;

        public event Action OnSlotsUpdated;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            PlayerSlots = new NetworkList<PlayerSlotData>();
        }

        public override void OnNetworkSpawn()
        {
            PlayerSlots.OnListChanged += HandleSlotsChanged;
        }

        public override void OnNetworkDespawn()
        {
            PlayerSlots.OnListChanged -= HandleSlotsChanged;
        }

        private void HandleSlotsChanged(NetworkListEvent<PlayerSlotData> changeEvent)
        {
            OnSlotsUpdated?.Invoke();
        }

        public void RegisterPlayer(ulong clientId)
        {
            if (!IsServer) return;

            if (PlayerSlots.Count >= GameConstants.MAX_PLAYERS)
            {
                Debug.LogWarning($"[RoomManager] Room is full! Rejecting client {clientId}");
                NetworkManager.Singleton.DisconnectClient(clientId);
                return;
            }

            int nextSlot = PlayerSlots.Count;
            PlayerSlotData newPlayer = new PlayerSlotData
            {
                ClientId = clientId,
                PlayerName = $"Racer {nextSlot + 1}",
                CarColorIndex = nextSlot,
                IsReady = false,
                GridPositionIndex = nextSlot
            };

            PlayerSlots.Add(newPlayer);
            Debug.Log($"[RoomManager] Registered player {clientId} in slot {nextSlot}");
        }

        [ServerRpc(RequireOwnership = false)]
        public void SetPlayerReadyServerRpc(ulong clientId, bool ready, ServerRpcParams rpcParams = default)
        {
            for (int i = 0; i < PlayerSlots.Count; i++)
            {
                if (PlayerSlots[i].ClientId == clientId)
                {
                    PlayerSlotData data = PlayerSlots[i];
                    data.IsReady = ready;
                    PlayerSlots[i] = data;
                    break;
                }
            }
        }

        [ServerRpc(RequireOwnership = false)]
        public void SetCarColorServerRpc(ulong clientId, int colorIndex, ServerRpcParams rpcParams = default)
        {
            for (int i = 0; i < PlayerSlots.Count; i++)
            {
                if (PlayerSlots[i].ClientId == clientId)
                {
                    PlayerSlotData data = PlayerSlots[i];
                    data.CarColorIndex = colorIndex;
                    PlayerSlots[i] = data;
                    break;
                }
            }
        }

        public bool CanStartRace()
        {
            if (!IsServer) return false;
            if (PlayerSlots.Count < GameConstants.MIN_PLAYERS) return false;

            foreach (var slot in PlayerSlots)
            {
                if (!slot.IsReady) return false;
            }
            return true;
        }

        public void StartRaceScene()
        {
            if (!IsServer) return;

            if (CanStartRace())
            {
                NetworkManager.Singleton.SceneManager.LoadScene(GameConstants.SCENE_RACE, LoadSceneMode.Single);
            }
        }
    }
}

