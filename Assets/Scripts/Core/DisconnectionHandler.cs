using System;
using Unity.Netcode;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace MultiplayerRacing.Core
{
    /// <summary>
    /// Handles player drops, temporary latency timeouts, host drop termination,
    /// and graceful recovery back to the main lobby.
    /// </summary>
    public class DisconnectionHandler : MonoBehaviour
    {
        public static DisconnectionHandler Instance { get; private set; }

        public event Action<ulong, string> OnPlayerDropped;
        public event Action<string> OnHostDisconnected;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void HandlePlayerDisconnected(ulong clientId)
        {
            // If local client is the one that got disconnected
            if (NetworkManager.Singleton != null && clientId == NetworkManager.Singleton.LocalClientId)
            {
                Debug.LogWarning("[DisconnectionHandler] Local client lost connection to server.");
                OnHostDisconnected?.Invoke("Lost connection to Host.");
                ReturnToMenu("Disconnected from host.");
                return;
            }

            // If local client is host, a remote player disconnected
            if (NetworkManager.Singleton != null && NetworkManager.Singleton.IsHost)
            {
                Debug.LogWarning($"[DisconnectionHandler] Remote client {clientId} disconnected.");
                OnPlayerDropped?.Invoke(clientId, $"Player {clientId} left the race.");
            }
        }

        public void ReturnToMenu(string reason)
        {
            Debug.Log($"[DisconnectionHandler] Returning to Menu: {reason}");
            if (ConnectionManager.Instance != null)
            {
                ConnectionManager.Instance.DisconnectAndShutdown();
            }

            if (SceneManager.GetActiveScene().name != GameConstants.SCENE_LOBBY)
            {
                SceneManager.LoadScene(GameConstants.SCENE_LOBBY);
            }
        }
    }
}

