using UnityEngine;

namespace MultiplayerRacing.Vehicle
{
    /// <summary>
    /// Dynamic audio generator for motor RPM, tire squeal, and impact thuds.
    /// Uses lightweight AudioSource pitch modulations for optimal Android performance.
    /// </summary>
    [RequireComponent(typeof(CarPhysicsController))]
    public class CarAudioEffects : MonoBehaviour
    {
        [SerializeField] private AudioSource engineAudio;
        [SerializeField] private AudioSource tireScreechAudio;
        [SerializeField] private AudioSource crashAudio;

        [SerializeField] private float minPitch = 0.8f;
        [SerializeField] private float maxPitch = 2.4f;

        private CarPhysicsController physics;

        private void Awake()
        {
            physics = GetComponent<CarPhysicsController>();
        }

        private void Update()
        {
            if (engineAudio != null)
            {
                float rpm = physics.EngineRpmRatio;
                engineAudio.pitch = Mathf.Lerp(minPitch, maxPitch, rpm);
            }
        }

        private void OnCollisionEnter(Collision collision)
        {
            if (collision.relativeVelocity.magnitude > 5.0f && crashAudio != null)
            {
                crashAudio.Play();
            }
        }
    }
}

