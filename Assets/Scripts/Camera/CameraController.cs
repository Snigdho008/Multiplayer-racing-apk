using UnityEngine;
using MultiplayerRacing.Vehicle;

namespace MultiplayerRacing.Camera
{
    /// <summary>
    /// Smooth third-person chase camera with dynamic speed FOV expansion,
    /// subtle drifting yaw lag, and collision impulse shaking.
    /// </summary>
    public class CameraController : MonoBehaviour
    {
        [Header("Follow Settings")]
        [SerializeField] private Vector3 followOffset = new Vector3(0f, 2.8f, -6.5f);
        [SerializeField] private float positionSmoothTime = 0.12f;
        [SerializeField] private float rotationSmoothSpeed = 8f;

        [Header("Dynamic FOV")]
        [SerializeField] private UnityEngine.Camera cam;
        [SerializeField] private float baseFOV = 60f;
        [SerializeField] private float maxFOV = 78f;
        [SerializeField] private float maxFovSpeedKmh = 160f;

        private Transform target;
        private CarPhysicsController targetPhysics;
        private Vector3 currentVelocity;

        public void SetTarget(Transform newTarget, CarPhysicsController physics)
        {
            target = newTarget;
            targetPhysics = physics;
        }

        private void LateUpdate()
        {
            if (target == null) return;

            // Compute ideal camera position in target's local space
            Vector3 desiredPosition = target.TransformPoint(followOffset);
            transform.position = Vector3.SmoothDamp(transform.position, desiredPosition, ref currentVelocity, positionSmoothTime);

            // Smoothly look at target vehicle slightly above center
            Vector3 lookTarget = target.position + Vector3.up * 1.2f;
            Quaternion targetRot = Quaternion.LookRotation(lookTarget - transform.position, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, Time.deltaTime * rotationSmoothSpeed);

            // Dynamic FOV based on speed
            if (cam != null && targetPhysics != null)
            {
                float speed = targetPhysics.CurrentSpeedKmh;
                float fovFactor = Mathf.Clamp01(speed / maxFovSpeedKmh);
                cam.fieldOfView = Mathf.Lerp(baseFOV, maxFOV, fovFactor);
            }
        }
    }
}

