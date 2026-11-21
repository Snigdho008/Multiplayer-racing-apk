using UnityEngine;

namespace MultiplayerRacing.Core
{
    public static class GameConstants
    {
        public const int MIN_PLAYERS = 2;
        public const int MAX_PLAYERS = 4;
        public const ushort DEFAULT_LAN_PORT = 7777;
        public const ushort DEFAULT_DISCOVERY_PORT = 47777;
        public const string BROADCAST_HANDSHAKE_MESSAGE = "RACING_3D_LAN_BROADCAST_V1";
        public const string BROADCAST_ACK_MESSAGE = "RACING_3D_LAN_ACK_V1";
        public const int TOTAL_LAPS = 3;
        public const float COUNTDOWN_DURATION = 4.0f; // 3, 2, 1, GO!
        public const float DISCONNECT_TIMEOUT = 10.0f;
        public const string SCENE_LOBBY = "MainMenu";
        public const string SCENE_RACE = "Track01";
        public const string LOBBY_SERVICE_NAME = "MultiplayerRacing3D";
    }

    public enum NetworkMode
    {
        None,
        LocalLAN,
        OnlineRelay
    }

    public enum RaceState
    {
        WaitingForPlayers,
        Countdown,
        Racing,
        Completed,
        Aborted
    }
}

