using UnityEngine;
using TMPro;
using MultiplayerRacing.Gameplay;
using MultiplayerRacing.Core;
using Unity.Netcode;

namespace MultiplayerRacing.UI
{
    /// <summary>
    /// Heads-Up Display for in-race HUD: Speedometer, Lap Count, Position, Countdown, Leaderboard.
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        [Header("HUD Elements")]
        [SerializeField] private TextMeshProUGUI speedText;
        [SerializeField] private TextMeshProUGUI lapText;
        [SerializeField] private TextMeshProUGUI positionText;
        [SerializeField] private TextMeshProUGUI countdownText;
        [SerializeField] private GameObject countdownPanel;
        [SerializeField] private GameObject finishPanel;
        [SerializeField] private TextMeshProUGUI finishRankText;

        private void Start()
        {
            if (RaceStateManager.Instance != null)
            {
                RaceStateManager.Instance.OnCountdownTick += HandleCountdown;
                RaceStateManager.Instance.OnRaceStateChanged += HandleRaceStateChanged;
            }
        }

        private void OnDestroy()
        {
            if (RaceStateManager.Instance != null)
            {
                RaceStateManager.Instance.OnCountdownTick -= HandleCountdown;
                RaceStateManager.Instance.OnRaceStateChanged -= HandleRaceStateChanged;
            }
        }

        private void Update()
        {
            if (RaceStateManager.Instance != null && NetworkManager.Singleton != null)
            {
                var progress = RaceStateManager.Instance.GetLocalPlayerProgress(NetworkManager.Singleton.LocalClientId);
                if (lapText != null)
                {
                    lapText.text = $"LAP {Mathf.Min(progress.CurrentLap, GameConstants.TOTAL_LAPS)} / {GameConstants.TOTAL_LAPS}";
                }
            }
        }

        public void UpdateSpeedometer(float speedKmh)
        {
            if (speedText != null)
            {
                speedText.text = $"{Mathf.RoundToInt(speedKmh)} <size=60%>KM/H</size>";
            }
        }

        private void HandleCountdown(float remaining)
        {
            if (countdownPanel != null) countdownPanel.SetActive(true);

            if (remaining > 1.0f)
            {
                countdownText.text = Mathf.CeilToInt(remaining - 1.0f).ToString();
            }
            else if (remaining > 0f)
            {
                countdownText.text = "GO!";
            }
            else
            {
                if (countdownPanel != null) countdownPanel.SetActive(false);
            }
        }

        private void HandleRaceStateChanged(RaceState state)
        {
            if (state == RaceState.Completed)
            {
                ShowFinishScreen();
            }
        }

        private void ShowFinishScreen()
        {
            if (finishPanel != null)
            {
                finishPanel.SetActive(true);
                if (NetworkManager.Singleton != null)
                {
                    var progress = RaceStateManager.Instance.GetLocalPlayerProgress(NetworkManager.Singleton.LocalClientId);
                    finishRankText.text = $"YOU FINISHED #{progress.FinishRank}!";
                }
            }
        }

        public void OnReturnToLobbyClicked()
        {
            if (ConnectionManager.Instance != null)
            {
                ConnectionManager.Instance.DisconnectAndShutdown();
            }
        }
    }
}

