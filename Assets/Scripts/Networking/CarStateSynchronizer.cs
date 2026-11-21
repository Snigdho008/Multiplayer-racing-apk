using Unity.Netcode;
using UnityEngine;

namespace MultiplayerRacing.Networking
{
    /// <summary>
    /// Host-Authoritative State Synchronization for car transforms and velocities.
    /// Uses exponential moving average interpolation and dead reckoning
    /// to eliminate jitter and packet loss effects on mobile Wi-Fi.
    /// </summary>
    public class CarStateSynchronizer : NetworkBehaviour
    {
        private struct CarTransformState : INetworkSerializable
        {
            public Vector3 Position;
            public Quaternion Rotation;
            public Vector3 Velocity;
            public float SpeedKmh;
            public float Timestamp;

            public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
            {
                serializer.SerializeValue(ref Position);
                serializer.SerializeValue(ref Rotation);
                serializer.SerializeValue(ref Velocity);
                serializer.SerializeValue(ref SpeedKmh);
                serializer.SerializeValue(ref Timestamp);
            }
        }

        private readonly NetworkVariable<CarTransformState> networkState = new NetworkVariable<CarTransformState>(
            default,
            NetworkVariableReadPermission.Everyone,
            NetworkVariableWritePermission.Server
        );

        [Header("Smoothing")]
        [SerializeField] private float interpolationSpeed = 16f;
        [SerializeField] private float snapDistanceThreshold = 5.0f;

        private Rigidbody rb;
        private Vector3 targetPosition;
        private Quaternion targetRotation;
        private Vector3 targetVelocity;

        private void Awake()
        {
            rb = GetComponent<Rigidbody>();
        }

        public override void OnNetworkSpawn()
        {
            networkState.OnValueChanged += HandleStateChanged;
            targetPosition = transform.position;
            targetRotation = transform.rotation;
        }

        public override void OnNetworkDespawn()
        {
            networkState.OnValueChanged -= HandleStateChanged;
        }

        private void HandleStateChanged(CarTransformState previous, CarTransformState current)
        {
            if (IsServer) return;

            targetPosition = current.Position;
            targetRotation = current.Rotation;
            targetVelocity = current.Velocity;

            // Snap if teleported or too far out of sync
            if (Vector3.Distance(transform.position, current.Position) > snapDistanceThreshold)
            {
                transform.position = current.Position;
                transform.rotation = current.Rotation;
            }
        }

        private void FixedUpdate()
        {
            if (IsServer)
            {
                // Host broadcasts authoritative transform & velocity state
                CarTransformState state = new CarTransformState
                {
                    Position = rb.position,
                    Rotation = rb.rotation,
                    Velocity = rb.linearVelocity,
                    SpeedKmh = rb.linearVelocity.magnitude * 3.6f,
                    Timestamp = Time.time
                };
                networkState.Value = state;
            }
        }

        private void Update()
        {
            if (IsServer) return;

            // Client smoothly interpolates toward target state with dead-reckoning extrapolation
            float dt = Time.deltaTime;
            Vector3 predictedPos = targetPosition + targetVelocity * dt;

            transform.position = Vector3.Lerp(transform.position, predictedPos, dt * interpolationSpeed);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, dt * interpolationSpeed);
        }
    }
}

