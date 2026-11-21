using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using MultiplayerRacing.Core;
using MultiplayerRacing.Networking;

namespace MultiplayerRacing.UI
{
    /// <summary>
    /// Complete Main Menu UI controller supporting:
    /// - Local Wi-Fi host / auto-discovery list / direct IP manual connect
    /// - Online Lobby host / room code join
    /// - 2 to 4 player readiness and car color selector
    /// </summary>
    public class LobbyRoomUI : MonoBehaviour
    {
        [Header("Panels")]
        [SerializeField] private GameObject modeSelectPanel;
        [SerializeField] private GameObject localLanPanel;
        [SerializeField] private GameObject onlinePanel;
        [SerializeField] private GameObject roomLobbyPanel;

        [Header("LAN Inputs")]
        [SerializeField] private TMP_InputField lanRoomNameInput;
        [SerializeField] private TMP_InputField lanDirectIpInput;
        [SerializeField] private Transform lanRoomListContainer;
        [SerializeField] private GameObject lanRoomItemPrefab;

        [Header("Online Inputs")]
        [SerializeField] private TMP_InputField onlineLobbyNameInput;
        [SerializeField] private TMP_InputField onlineJoinCodeInput;
        [SerializeField] private TextMeshProUGUI activeRelayCodeDisplay;

        [Header("Room Lobby")]
        [SerializeField] private TextMeshProUGUI[] playerSlotNames = new TextMeshProUGUI[4];
        [SerializeField] private Image[] playerSlotColors = new Image[4];
        [SerializeField] private TextMeshProUGUI[] playerSlotStatuses = new TextMeshProUGUI[4];
        [SerializeField] private Button startRaceBtn;
        [SerializeField] private Button readyBtn;

        [Header("Status Text")]
        [SerializeField] private TextMeshProUGUI statusFeedbackText;

        private void Start()
        {
            ShowModeSelect();
            if (ConnectionManager.Instance != null)
            {
                ConnectionManager.Instance.OnConnectionStatusChanged += HandleStatusChanged;
            }
        }

        private void OnDestroy()
        {
            if (ConnectionManager.Instance != null)
            {
                ConnectionManager.Instance.OnConnectionStatusChanged -= HandleStatusChanged;
            }
        }

        public void ShowModeSelect()
        {
            modeSelectPanel.SetActive(true);
            localLanPanel.SetActive(false);
            onlinePanel.SetActive(false);
            roomLobbyPanel.SetActive(false);
        }

        #region Local LAN Actions

        public void ShowLocalLAN()
        {
            modeSelectPanel.SetActive(false);
            localLanPanel.SetActive(true);
        }

        public async void OnHostLocalClicked()
        {
            string roomName = string.IsNullOrEmpty(lanRoomNameInput.text) ? "Local Race" : lanRoomNameInput.text;
            statusFeedbackText.text = "Starting Local Wi-Fi Host...";
            bool success = await ConnectionManager.Instance.StartLocalHost(roomName);
            if (success)
            {
                OpenRoomLobby();
            }
        }

        public async void OnJoinLocalDirectClicked()
        {
            string ip = lanDirectIpInput.text.Trim();
            if (string.IsNullOrEmpty(ip))
            {
                statusFeedbackText.text = "Please enter Host IP address!";
                return;
            }

            statusFeedbackText.text = $"Connecting to {ip}...";
            bool success = await ConnectionManager.Instance.JoinLocalClient(ip);
            if (success)
            {
                OpenRoomLobby();
            }
        }

        #endregion

        #region Online Actions

        public void ShowOnline()
        {
            modeSelectPanel.SetActive(false);
            onlinePanel.SetActive(true);
        }

        public async void OnHostOnlineClicked()
        {
            string lobbyName = string.IsNullOrEmpty(onlineLobbyNameInput.text) ? "Online Grand Prix" : onlineLobbyNameInput.text;
            statusFeedbackText.text = "Creating Online Room via Unity Relay...";
            string code = await ConnectionManager.Instance.StartOnlineHost(lobbyName);
            if (!string.IsNullOrEmpty(code))
            {
                if (activeRelayCodeDisplay != null) activeRelayCodeDisplay.text = $"ROOM CODE: {code}";
                OpenRoomLobby();
            }
        }

        public async void OnJoinOnlineClicked()
        {
            string code = onlineJoinCodeInput.text.Trim().ToUpper();
            if (string.IsNullOrEmpty(code))
            {
                statusFeedbackText.text = "Please enter 6-character room code!";
                return;
            }

            statusFeedbackText.text = $"Connecting to Relay room {code}...";
            bool success = await ConnectionManager.Instance.JoinOnlineClientByCode(code);
            if (success)
            {
                OpenRoomLobby();
            }
        }

        #endregion

        private void OpenRoomLobby()
        {
            localLanPanel.SetActive(false);
            onlinePanel.SetActive(false);
            roomLobbyPanel.SetActive(true);

            bool isHost = ConnectionManager.Instance.IsHost;
            if (startRaceBtn != null) startRaceBtn.gameObject.SetActive(isHost);
        }

        public void OnToggleReadyClicked()
        {
            if (RoomManager.Instance != null && Unity.Netcode.NetworkManager.Singleton != null)
            {
                ulong localId = Unity.Netcode.NetworkManager.Singleton.LocalClientId;
                RoomManager.Instance.SetPlayerReadyServerRpc(localId, true);
            }
        }

        public void OnStartRaceClicked()
        {
            if (RoomManager.Instance != null && ConnectionManager.Instance.IsHost)
            {
                RoomManager.Instance.StartRaceScene();
            }
        }

        private void HandleStatusChanged(bool success, string message)
        {
            if (statusFeedbackText != null)
            {
                statusFeedbackText.text = message;
            }
        }
    }
}

