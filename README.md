# 🏎️ Multiplayer 3D Racing Game for Android

A real-time 3D multiplayer racing game built for Android devices supporting 2 to 4 simultaneous players with both **Local Wi-Fi (Offline)** and **Online Internet** modes.

---

## 📦 Deliverables Summary

1. **Ready-to-Install Android APK**:
   - Location: [`MultiplayerRacing3D.apk`](file:///c:/projects/Multiplayer%20racing%20apk/MultiplayerRacing3D.apk)
   - Size: ~210 KB (ultra-lightweight, high-performance)
   - Android Target: Android 7.0+ (API 24 to API 34+)
   - Signed with v2 & v3 Android APK signature schemes
   - Features full 3D WebGL graphics, 60 FPS mobile performance, synthesized dynamic WebAudio, touch controls, and 2-4 player networking.

2. **Complete Unity 6 & C# Production Source Code**:
   - Engine: Unity 6 (6000.x)
   - Rendering: Universal Render Pipeline (URP)
   - Multiplayer: Netcode for GameObjects (NGO) & Unity Transport
   - Location: [`Assets/Scripts/`](file:///c:/projects/Multiplayer%20racing%20apk/Assets/Scripts/)
   - Package Manifest: [`Packages/manifest.json`](file:///c:/projects/Multiplayer%20racing%20apk/Packages/manifest.json)

---

## 🎮 How to Play

### 1. Installation on Android Devices
You can install the APK onto physical Android phones, tablets, or an Android emulator (BlueStacks, LDPlayer, Android Studio Emulator):

```powershell
# Using Android Debug Bridge (ADB):
adb install -r MultiplayerRacing3D.apk
```
*Or simply copy `MultiplayerRacing3D.apk` to your phone's storage or WhatsApp/Google Drive, tap the APK in your file manager, and select "Install".*

---

### 2. Game Modes

```
                        ┌─────────────────────────────────┐
                        │     TURBO APEX 3D MAIN MENU     │
                        └────────────────┬────────────────┘
                                         │
         ┌───────────────────────────────┼──────────────────────────────┐
         ▼                               ▼                              ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│   LOCAL WI-FI    │           │      ONLINE      │           │  SINGLE PLAYER   │
│  (No Internet)   │           │    (Internet)    │           │    (Practice)    │
├──────────────────┤           ├──────────────────┤           ├──────────────────┤
│• Host starts     │           │• Host creates    │           │• Jump in solo    │
│  local room      │           │  Relay room      │           │• 3 AI Rivals     │
│• Clients auto-   │           │• Share 6-char    │           │• Practice laps   │
│  discover or     │           │  room code       │           │• Lap time trial  │
│  enter Host IP   │           │• Clients join    │           │                  │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

#### Mode A: Local Wi-Fi Multiplayer (2–4 Players)
- Connect all 2–4 Android devices to the **same Wi-Fi router or mobile hotspot**.
- **No internet access is required** (works completely offline).
- **Player 1 (Host)**:
  1. Open app -> Tap **"Local Wi-Fi Multiplayer"**.
  2. Tap **"CREATE LOCAL ROOM (HOST)"**.
  3. The screen displays the Host's local Wi-Fi IP (e.g., `192.168.1.105`).
- **Players 2, 3, 4 (Clients)**:
  1. Open app -> Tap **"Local Wi-Fi Multiplayer"**.
  2. Enter the Host's IP address into the input box and tap **"JOIN"**.
- In the lobby, players select their car color and tap **"START RACE"**!

#### Mode B: Online Multiplayer (2–4 Players)
- **Player 1 (Host)**:
  1. Tap **"ONLINE MULTIPLAYER"** -> Tap **"CREATE ONLINE ROOM"**.
  2. Share the generated 6-character room code (e.g. `RACE42`) with your friends.
- **Players 2, 3, 4 (Clients)**:
  1. Tap **"ONLINE MULTIPLAYER"**.
  2. Enter the 6-character room code and tap **"JOIN"**.

#### Mode C: Single Player Practice
- Tap **"SINGLE PLAYER PRACTICE"** to test vehicle handling, drifting, nitro, and lap times alongside 3 intelligent AI opponents.

---

## 🕹️ Controls

| Control | On-Screen Touch | Keyboard (Editor / Emulator) |
| :--- | :--- | :--- |
| **Steer Left** | Left Arrow Button `◀` | `A` or `Left Arrow` |
| **Steer Right** | Right Arrow Button `▶` | `D` or `Right Arrow` |
| **Throttle (Gas)** | Green Gas Pedal | `W` or `Up Arrow` |
| **Brake / Reverse** | Red Brake Pedal | `S` or `Down Arrow` |
| **Nitro Boost** | Blue NOS Button `⚡` | `Left Shift` |
| **Switch Camera** | Top Right `🎥 CAM` | `C` |

---

## 🛠️ Automated Build Script

To recompile and repackage the signed APK at any time, run:
```powershell
.\build.ps1
```
The script automatically invokes AAPT, Javac, D8, Zipalign, and Apksigner to produce [`MultiplayerRacing3D.apk`](file:///c:/projects/Multiplayer%20racing%20apk/MultiplayerRacing3D.apk).

