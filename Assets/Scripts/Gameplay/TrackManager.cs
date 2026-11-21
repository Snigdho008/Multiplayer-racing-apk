using System.Collections.Generic;
using UnityEngine;
using MultiplayerRacing.Core;

namespace MultiplayerRacing.Gameplay
{
    /// <summary>
    /// Manages track layout, grid starting positions (1st through 4th),
    /// and sequences all checkpoints on the circuit.
    /// </summary>
    public class TrackManager : MonoBehaviour
    {
        public static TrackManager Instance { get; private set; }

        [Header("Starting Grid Positions (2-4 Racers)")]
        [SerializeField] private Transform[] gridPositions = new Transform[4];

        [Header("Checkpoints")]
        [SerializeField] private List<Checkpoint> checkpoints = new List<Checkpoint>();

        private void Awake()
        {
            Instance = this;

            for (int i = 0; i < checkpoints.Count; i++)
            {
                if (checkpoints[i] != null)
                {
                    checkpoints[i].Initialize(i, this);
                }
            }
        }

        public Transform GetSpawnPosition(int slotIndex)
        {
            if (gridPositions != null && slotIndex >= 0 && slotIndex < gridPositions.Length)
            {
                return gridPositions[slotIndex];
            }
            return transform;
        }

        public void HandleCarCheckpointTrigger(ulong clientId, int checkpointIndex)
        {
            if (RaceStateManager.Instance != null)
            {
                RaceStateManager.Instance.ServerRecordCheckpointPass(clientId, checkpointIndex, checkpoints.Count);
            }
        }
    }
}

