using System;
using System.Collections.Generic;
using Unity.Collections;
using Unity.Netcode;
using UnityEngine;
using MultiplayerRacing.Core;

namespace MultiplayerRacing.Gameplay
{
    [System.Serializable]
    public struct RacerProgress : INetworkSerializable, IEquatable<RacerProgress>
    {
        public ulong ClientId;
        public int CurrentLap;
        public int LastCheckpointIndex;
        public float TotalRaceTime;
        public bool HasFinished;
        public int FinishRank;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            serializer.SerializeValue(ref ClientId);
            serializer.SerializeValue(ref CurrentLap);
            serializer.SerializeValue(ref LastCheckpointIndex);
            serializer.SerializeValue(ref TotalRaceTime);
            serializer.SerializeValue(ref HasFinished);
            serializer.SerializeValue(ref FinishRank);
        }

        public bool Equals(RacerProgress other)
        {
            return ClientId == other.ClientId &&
                   CurrentLap == other.CurrentLap &&
                   LastCheckpointIndex == other.LastCheckpointIndex &&
                   HasFinished == other.HasFinished &&
                   FinishRank == other.FinishRank;
        }
    }

    /// <summary>
    /// Host-Authoritative Race Manager orchestrating Countdown, Checkpoints,
    /// Anti-cheat lap validation, and Final Leaderboard.
    /// </summary>
    public class RaceStateManager : NetworkBehaviour
    {
        public static RaceStateManager Instance { get; private set; }

        public NetworkVariable<RaceState> CurrentRaceState = new NetworkVariable<RaceState>(
            RaceState.WaitingForPlayers,
            NetworkVariableReadPermission.Everyone,
            NetworkVariableWritePermission.Server
        );

        public NetworkVariable<float> CountdownTimer = new NetworkVariable<float>(
            GameConstants.COUNTDOWN_DURATION,
            NetworkVariableReadPermission.Everyone,
            NetworkVariableWritePermission.Server
        );

        public NetworkList<RacerProgress> RacerProgressList;

        public event Action<RaceState> OnRaceStateChanged;
        public event Action<float> OnCountdownTick;
        public event Action OnLeaderboardUpdated;

        private int nextFinishRank = 1;
        private float raceTimer;

        private void Awake()
        {
            Instance = this;
            RacerProgressList = new NetworkList<RacerProgress>();
        }

        public override void OnNetworkSpawn()
        {
            CurrentRaceState.OnValueChanged += HandleRaceStateChanged;
            CountdownTimer.OnValueChanged += HandleCountdownChanged;
            RacerProgressList.OnListChanged += HandleRacerListChanged;

            if (IsServer)
            {
                InitializeRacerList();
                StartRaceCountdown();
            }
        }

        public override void OnNetworkDespawn()
        {
            CurrentRaceState.OnValueChanged -= HandleRaceStateChanged;
            CountdownTimer.OnValueChanged -= HandleCountdownChanged;
            RacerProgressList.OnListChanged -= HandleRacerListChanged;
        }

        private void InitializeRacerList()
        {
            RacerProgressList.Clear();
            foreach (var client in NetworkManager.Singleton.ConnectedClientsList)
            {
                RacerProgress progress = new RacerProgress
                {
                    ClientId = client.ClientId,
                    CurrentLap = 1,
                    LastCheckpointIndex = -1,
                    TotalRaceTime = 0f,
                    HasFinished = false,
                    FinishRank = 0
                };
                RacerProgressList.Add(progress);
            }
        }

        private void StartRaceCountdown()
        {
            CurrentRaceState.Value = RaceState.Countdown;
            CountdownTimer.Value = GameConstants.COUNTDOWN_DURATION;
        }

        private void Update()
        {
            if (!IsServer) return;

            if (CurrentRaceState.Value == RaceState.Countdown)
            {
                CountdownTimer.Value -= Time.deltaTime;
                if (CountdownTimer.Value <= 0f)
                {
                    CountdownTimer.Value = 0f;
                    CurrentRaceState.Value = RaceState.Racing;
                }
            }
            else if (CurrentRaceState.Value == RaceState.Racing)
            {
                raceTimer += Time.deltaTime;
            }
        }

        public void ServerRecordCheckpointPass(ulong clientId, int checkpointIndex, int totalCheckpoints)
        {
            if (!IsServer || CurrentRaceState.Value != RaceState.Racing) return;

            for (int i = 0; i < RacerProgressList.Count; i++)
            {
                if (RacerProgressList[i].ClientId == clientId)
                {
                    RacerProgress p = RacerProgressList[i];
                    if (p.HasFinished) return;

                    // Anti-cheat verification: must pass checkpoints strictly in sequential order
                    int expectedCheckpoint = (p.LastCheckpointIndex + 1) % totalCheckpoints;

                    if (checkpointIndex == expectedCheckpoint)
                    {
                        p.LastCheckpointIndex = checkpointIndex;

                        // Check if completed a lap (crossed finish line checkpoint 0 after last checkpoint)
                        if (checkpointIndex == 0 && p.LastCheckpointIndex == 0 && p.CurrentLap > 0)
                        {
                            p.CurrentLap++;

                            if (p.CurrentLap > GameConstants.TOTAL_LAPS)
                            {
                                p.HasFinished = true;
                                p.FinishRank = nextFinishRank++;
                                p.TotalRaceTime = raceTimer;
                                Debug.Log($"[RaceStateManager] Player {clientId} finished #{p.FinishRank} in {p.TotalRaceTime:F2}s");

                                CheckAllPlayersFinished();
                            }
                        }

                        RacerProgressList[i] = p;
                    }
                    break;
                }
            }
        }

        private void CheckAllPlayersFinished()
        {
            bool allDone = true;
            foreach (var p in RacerProgressList)
            {
                if (!p.HasFinished)
                {
                    allDone = false;
                    break;
                }
            }

            if (allDone)
            {
                CurrentRaceState.Value = RaceState.Completed;
            }
        }

        private void HandleRaceStateChanged(RaceState oldState, RaceState newState)
        {
            OnRaceStateChanged?.Invoke(newState);
        }

        private void HandleCountdownChanged(float oldVal, float newVal)
        {
            OnCountdownTick?.Invoke(newVal);
        }

        private void HandleRacerListChanged(NetworkListEvent<RacerProgress> changeEvent)
        {
            OnLeaderboardUpdated?.Invoke();
        }

        public RacerProgress GetLocalPlayerProgress(ulong localClientId)
        {
            foreach (var p in RacerProgressList)
            {
                if (p.ClientId == localClientId) return p;
            }
            return default;
        }
    }
}

