using UnityEngine;
using UnityEngine.UI;
using MultiplayerRacing.Networking;

namespace MultiplayerRacing.UI
{
    /// <summary>
    /// Touch controls for Android devices: Steer Left/Right, Throttle, Brake/Reverse, and Nitro.
    /// Injects input into local PlayerNetworkController.
    /// </summary>
    public class MobileTouchControls : MonoBehaviour
    {
        [Header("Control Buttons")]
        [SerializeField] private Button leftSteerBtn;
        [SerializeField] private Button rightSteerBtn;
        [SerializeField] private Button throttleBtn;
        [SerializeField] private Button brakeBtn;
        [SerializeField] private Button nitroBtn;

        private float steerInput;
        private float throttleInput;
        private bool brakeInput;
        private bool nitroInput;

        private PlayerNetworkController localPlayer;

        public void RegisterLocalPlayer(PlayerNetworkController player)
        {
            localPlayer = player;
        }

        public void OnSteerLeftDown() => steerInput = -1f;
        public void OnSteerLeftUp() => steerInput = (steerInput < 0f) ? 0f : steerInput;

        public void OnSteerRightDown() => steerInput = 1f;
        public void OnSteerRightUp() => steerInput = (steerInput > 0f) ? 0f : steerInput;

        public void OnThrottleDown() => throttleInput = 1f;
        public void OnThrottleUp() => throttleInput = 0f;

        public void OnBrakeDown() => brakeInput = true;
        public void OnBrakeUp() => brakeInput = false;

        public void OnNitroDown() => nitroInput = true;
        public void OnNitroUp() => nitroInput = false;

        private void Update()
        {
            if (localPlayer != null)
            {
                // Also support keyboard testing in editor
                float h = steerInput != 0f ? steerInput : Input.GetAxis("Horizontal");
                float v = throttleInput != 0f ? throttleInput : Input.GetAxis("Vertical");
                bool b = brakeInput || Input.GetKey(KeyCode.Space);
                bool n = nitroInput || Input.GetKey(KeyCode.LeftShift);

                localPlayer.SetMobileInputs(v, h, b, n);
            }
        }
    }
}

