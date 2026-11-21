using UnityEngine;

namespace MultiplayerRacing.Vehicle
{
    /// <summary>
    /// Highly optimized, realistic yet arcade-friendly car physics controller
    /// using Unity Rigidbody and WheelColliders with anti-roll bars, downforce,
    /// and mobile-ready controls.
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    public class CarPhysicsController : MonoBehaviour
    {
        [Header("Wheel Colliders")]
        [SerializeField] private WheelCollider frontLeftWheel;
        [SerializeField] private WheelCollider frontRightWheel;
        [SerializeField] private WheelCollider rearLeftWheel;
        [SerializeField] private WheelCollider rearRightWheel;

        [Header("Engine & Transmission")]
        [SerializeField] private float maxMotorTorque = 1800f;
        [SerializeField] private float maxReverseTorque = 1000f;
        [SerializeField] private float maxBrakeTorque = 3500f;
        [SerializeField] private float maxSteerAngle = 32f;
        [SerializeField] private float topSpeedKmh = 180f;

        [Header("Vehicle Dynamics")]
        [SerializeField] private Transform centerOfMass;
        [SerializeField] private float downforceCoefficient = 80f;
        [SerializeField] private float antiRollStiffness = 6000f;

        [Header("Nitro Boost")]
        [SerializeField] private float nitroMultiplier = 1.6f;
        [SerializeField] private float maxNitroCapacity = 100f;
        [SerializeField] private float nitroConsumptionRate = 25f;
        [SerializeField] private float nitroRegenRate = 8f;

        private Rigidbody rb;
        private float currentSteerAngle;
        private float currentNitro;
        private bool isNitroActive;

        // Current Inputs
        public float ThrottleInput { get; set; }
        public float SteerInput { get; set; }
        public bool BrakeInput { get; set; }
        public bool NitroInput { get; set; }

        // Telemetry properties
        public float CurrentSpeedKmh => rb != null ? rb.linearVelocity.magnitude * 3.6f : 0f;
        public float NitroPercentage => currentNitro / maxNitroCapacity;
        public float EngineRpmRatio => Mathf.Clamp01(CurrentSpeedKmh / topSpeedKmh);

        private void Awake()
        {
            rb = GetComponent<Rigidbody>();
            if (centerOfMass != null)
            {
                rb.centerOfMass = centerOfMass.localPosition;
            }
            else
            {
                rb.centerOfMass = new Vector3(0, -0.35f, 0); // Low center of gravity to prevent rollover
            }

            currentNitro = maxNitroCapacity;
        }

        private void FixedUpdate()
        {
            ApplyMotor();
            ApplySteering();
            ApplyAntiRollBars();
            ApplyDownforce();
            HandleNitro();
        }

        private void ApplyMotor()
        {
            float speed = CurrentSpeedKmh;
            float targetTorque = 0f;

            if (ThrottleInput > 0f)
            {
                if (speed < topSpeedKmh)
                {
                    targetTorque = ThrottleInput * maxMotorTorque;
                    if (isNitroActive) targetTorque *= nitroMultiplier;
                }
            }
            else if (ThrottleInput < 0f)
            {
                targetTorque = ThrottleInput * maxReverseTorque;
            }

            // Apply rear wheel drive (or AWD)
            rearLeftWheel.motorTorque = targetTorque;
            rearRightWheel.motorTorque = targetTorque;
            frontLeftWheel.motorTorque = targetTorque * 0.3f; // AWD 30% front
            frontRightWheel.motorTorque = targetTorque * 0.3f;

            // Brake logic
            float currentBrake = BrakeInput ? maxBrakeTorque : 0f;
            frontLeftWheel.brakeTorque = currentBrake;
            frontRightWheel.brakeTorque = currentBrake;
            rearLeftWheel.brakeTorque = currentBrake * 0.8f;
            rearRightWheel.brakeTorque = currentBrake * 0.8f;
        }

        private void ApplySteering()
        {
            // Speed-sensitive steering: reduce max steer angle at high speeds for stability
            float speedRatio = Mathf.Clamp01(CurrentSpeedKmh / 140f);
            float effectiveMaxAngle = Mathf.Lerp(maxSteerAngle, maxSteerAngle * 0.45f, speedRatio);

            currentSteerAngle = Mathf.Lerp(currentSteerAngle, SteerInput * effectiveMaxAngle, Time.fixedDeltaTime * 12f);
            frontLeftWheel.steerAngle = currentSteerAngle;
            frontRightWheel.steerAngle = currentSteerAngle;
        }

        private void ApplyAntiRollBars()
        {
            ApplyAntiRollBarToPair(frontLeftWheel, frontRightWheel);
            ApplyAntiRollBarToPair(rearLeftWheel, rearRightWheel);
        }

        private void ApplyAntiRollBarToPair(WheelCollider wl, WheelCollider wr)
        {
            WheelHit hit;
            float travelL = 1.0f;
            float travelR = 1.0f;

            bool groundedL = wl.GetGroundHit(out hit);
            if (groundedL)
                travelL = (-wl.transform.InverseTransformPoint(hit.point).y - wl.radius) / wl.suspensionDistance;

            bool groundedR = wr.GetGroundHit(out hit);
            if (groundedR)
                travelR = (-wr.transform.InverseTransformPoint(hit.point).y - wr.radius) / wr.suspensionDistance;

            float antiRollForce = (travelL - travelR) * antiRollStiffness;

            if (groundedL)
                rb.AddForceAtPosition(wl.transform.up * -antiRollForce, wl.transform.position);
            if (groundedR)
                rb.AddForceAtPosition(wr.transform.up * antiRollForce, wr.transform.position);
        }

        private void ApplyDownforce()
        {
            // Increases tire grip proportionally to velocity squared
            rb.AddForce(-transform.up * downforceCoefficient * rb.linearVelocity.sqrMagnitude);
        }

        private void HandleNitro()
        {
            if (NitroInput && currentNitro > 0f && ThrottleInput > 0.1f)
            {
                isNitroActive = true;
                currentNitro = Mathf.Max(0f, currentNitro - nitroConsumptionRate * Time.fixedDeltaTime);
                rb.AddForce(transform.forward * 4500f, ForceMode.Force);
            }
            else
            {
                isNitroActive = false;
                if (currentNitro < maxNitroCapacity)
                {
                    currentNitro = Mathf.Min(maxNitroCapacity, currentNitro + nitroRegenRate * Time.fixedDeltaTime);
                }
            }
        }

        public void ResetCarToPosition(Vector3 position, Quaternion rotation)
        {
            rb.linearVelocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;
            transform.position = position;
            transform.rotation = rotation;
        }
    }
}

