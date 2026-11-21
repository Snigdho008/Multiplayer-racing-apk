using UnityEngine;
using MultiplayerRacing.Networking;

namespace MultiplayerRacing.Gameplay
{
    /// <summary>
    /// Checkpoint trigger on the track detecting car passes.
    /// Passes the event to host-authoritative RaceStateManager for anti-cheat validation.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class Checkpoint : MonoBehaviour
    {
        [SerializeField] private int checkpointIndex;

        public int CheckpointIndex => checkpointIndex;

        private TrackManager trackManager;

        public void Initialize(int index, TrackManager manager)
        {
            checkpointIndex = index;
            trackManager = manager;
        }

        private void OnTriggerEnter(Collider other)
        {
            PlayerNetworkController player = other.GetComponentInParent<PlayerNetworkController>();
            if (player != null && trackManager != null)
            {
                trackManager.HandleCarCheckpointTrigger(player.OwnerClientId, checkpointIndex);
            }
        }
    }
}

