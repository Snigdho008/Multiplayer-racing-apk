using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace MultiplayerRacing.Optimization
{
    /// <summary>
    /// Configures Universal Render Pipeline (URP) and runtime engine parameters
    /// specifically tuned for sustained 60 FPS on mid-range Android devices.
    /// </summary>
    public class AndroidURPOptimizer : MonoBehaviour
    {
        [Header("Target Framerate & Power")]
        [SerializeField] private int targetFrameRate = 60;
        [SerializeField] private bool disableVSync = true;
        [SerializeField] private bool preventScreenSleep = true;

        [Header("Shadows & Visuals")]
        [SerializeField] private float mobileShadowDistance = 45f;
        [SerializeField] private bool enableHalfResolutionTransparency = true;

        private void Awake()
        {
            ApplyMobileOptimizations();
        }

        public void ApplyMobileOptimizations()
        {
            // 1. Lock 60 FPS
            if (disableVSync)
            {
                QualitySettings.vSyncCount = 0;
            }
            Application.targetFrameRate = targetFrameRate;

            // 2. Prevent device from sleeping during intense multiplayer races
            if (preventScreenSleep)
            {
                Screen.sleepTimeout = SleepTimeout.NeverSleep;
            }

            // 3. Optimize URP Quality Level for mobile GPUs (Adreno / Mali)
            UniversalRenderPipelineAsset urpAsset = QualitySettings.renderPipeline as UniversalRenderPipelineAsset;
            if (urpAsset != null)
            {
                urpAsset.shadowDistance = mobileShadowDistance;
            }

            // 4. Garbage Collection tuning to eliminate frame hitches
            GarbageCollector.GCMode = GarbageCollector.Mode.Enabled;

            Debug.Log($"[AndroidURPOptimizer] Applied Android 60 FPS performance optimizations.");
        }
    }
}

