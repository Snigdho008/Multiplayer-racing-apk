using UnityEngine;

namespace MultiplayerRacing.Vehicle
{
    /// <summary>
    /// Synchronizes visual 3D wheel meshes with their corresponding WheelCollider
    /// physical positions, spring compressions, and steering rotations.
    /// </summary>
    public class WheelVisualSync : MonoBehaviour
    {
        [System.Serializable]
        public struct WheelPair
        {
            public WheelCollider collider;
            public Transform visualMesh;
        }

        [SerializeField] private WheelPair frontLeft;
        [SerializeField] private WheelPair frontRight;
        [SerializeField] private WheelPair rearLeft;
        [SerializeField] private WheelPair rearRight;

        private void Update()
        {
            UpdateWheel(frontLeft);
            UpdateWheel(frontRight);
            UpdateWheel(rearLeft);
            UpdateWheel(rearRight);
        }

        private void UpdateWheel(WheelPair pair)
        {
            if (pair.collider == null || pair.visualMesh == null) return;

            Vector3 pos;
            Quaternion rot;
            pair.collider.GetWorldPose(out pos, out rot);

            pair.visualMesh.position = pos;
            pair.visualMesh.rotation = rot;
        }
    }
}

