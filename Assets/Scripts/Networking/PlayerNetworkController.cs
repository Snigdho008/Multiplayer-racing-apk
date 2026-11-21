using Unity.Netcode;
using UnityEngine;
using MultiplayerRacing.Vehicle;
using MultiplayerRacing.Camera;

namespace MultiplayerRacing.Networking
{
    /// <summary>
    /// Attached to each car prefab. Dispatches inputs from local device
    /// to the host, configures camera tracking for owner, and sets up car color.
    /// </summary>
    public class PlayerNetworkController : NetworkBehaviour
    {
        [Header("Components")]
        [SerializeField] private CarPhysicsController physicsController;
        [SerializeField] private CarStateSynchronizer stateSynchronizer;
        [SerializeField] private MeshRenderer[] carBodyRenderers;

        [Header("Palette")]
        [SerializeField] private Color[] playerColors = new Color[]
        {
            new Color(0.9f, 0.15f, 0.15f), // Red
            new Color(0.15f, 0.5f, 0.95f), // Blue
            new Color(0.1f, 0.85f, 0.3f),  // Green
            new Color(0.95f, 0.75f, 0.1f)  // Yellow
        };

        private void Start()
        {
            if (IsOwner)
            {
                // Connect smooth follow camera to local player car
                CameraController cam = FindFirstObjectByType<CameraController>();
                if (cam != null)
                {
                    cam.SetTarget(transform, physicsController);
                }
            }

            // Only enable local physics simulation on the authoritative Host
            if (!IsServer)
            {
                // On client devices, remote cars are moved via CarStateSynchronizer interpolation
                if (physicsController != null)
                {
                    Rigidbody rb = physicsController.GetComponent<Rigidbody>();
                    if (rb != null && !IsOwner)
                    {
                        rb.isKinematic = true;
                    }
                }
            }

            ApplyCarVisualColor();
        }

        private void Update()
        {
            if (!IsOwner) return;

            // Capture local inputs (Touch UI or Keyboard fallback)
            float throttle = Input.GetAxis("Vertical");
            float steer = Input.GetAxis("Horizontal");
            bool brake = Input.GetKey(KeyCode.Space);
            bool nitro = Input.GetKey(KeyCode.LeftShift);

            // Forward to Host via ServerRpc
            if (IsServer)
            {
                physicsController.ThrottleInput = throttle;
                physicsController.SteerInput = steer;
                physicsController.BrakeInput = brake;
                physicsController.NitroInput = nitro;
            }
            else
            {
                SubmitInputServerRpc(throttle, steer, brake, nitro);
            }
        }

        [ServerRpc(Delivery = RpcDelivery.Unreliable)]
        private void SubmitInputServerRpc(float throttle, float steer, bool brake, bool nitro)
        {
            if (physicsController != null)
            {
                // Host validates and applies client input
                physicsController.ThrottleInput = Mathf.Clamp(throttle, -1f, 1f);
                physicsController.SteerInput = Mathf.Clamp(steer, -1f, 1f);
                physicsController.BrakeInput = brake;
                physicsController.NitroInput = nitro;
            }
        }

        public void SetMobileInputs(float throttle, float steer, bool brake, bool nitro)
        {
            if (!IsOwner) return;

            if (IsServer)
            {
                physicsController.ThrottleInput = throttle;
                physicsController.SteerInput = steer;
                physicsController.BrakeInput = brake;
                physicsController.NitroInput = nitro;
            }
            else
            {
                SubmitInputServerRpc(throttle, steer, brake, nitro);
            }
        }

        private void ApplyCarVisualColor()
        {
            int colorIndex = (int)(OwnerClientId % (ulong)playerColors.Length);
            Color chosenColor = playerColors[colorIndex];

            foreach (var r in carBodyRenderers)
            {
                if (r != null)
                {
                    r.material.color = chosenColor;
                }
            }
        }
    }
}

