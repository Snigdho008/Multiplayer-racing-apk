# 🔨 Unity 6 & Android APK Build Guide

## 1. Unity 6 Project Setup & Build

### Prerequisites
- Unity Hub & Unity Editor 6000.0 (Unity 6) or higher.
- Unity Android Build Support module (Android SDK & NDK Tools, OpenJDK).

### Step-by-Step Instructions
1. **Open Project in Unity 6**:
   - Launch Unity Hub.
   - Click **Add** -> **Add project from disk**.
   - Select the folder: `c:\projects\Multiplayer racing apk`.
   - Ensure the Editor Version is set to **Unity 6**.

2. **Verify Packages**:
   - Open **Window** -> **Package Manager**.
   - Confirm that the following packages are installed (defined in `Packages/manifest.json`):
     - `com.unity.netcode.gameobjects`
     - `com.unity.transport`
     - `com.unity.render-pipelines.universal`
     - `com.unity.services.core`
     - `com.unity.services.authentication`
     - `com.unity.services.lobby`
     - `com.unity.services.relay`
     - `com.unity.inputsystem`

3. **Configure Project Settings**:
   - Go to **Edit** -> **Project Settings** -> **Player** -> **Android Tab**:
     - **Package Name**: `com.antigravity.multiplayerracing3d`
     - **Minimum API Level**: Android 7.0 (API Level 24)
     - **Target API Level**: Android 14 (API Level 34)
     - **Scripting Backend**: IL2CPP
     - **Target Architectures**: ARM64 and ARMv7
     - **Default Orientation**: Landscape Left / Landscape Right

4. **Build APK**:
   - Open **File** -> **Build Settings...**
   - Switch platform to **Android**.
   - Add Scenes:
     - `Assets/Scenes/MainMenu.unity` (Index 0)
     - `Assets/Scenes/Track01.unity` (Index 1)
   - Click **Build** -> Choose output filename -> Generate APK!

---

## 2. Standalone Android Toolchain Build

The workspace includes a standalone Android build toolchain and PowerShell build script that compiles and packages the APK directly without requiring the Unity Editor GUI:

### Run Build Script
```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

### Build Pipeline Steps
1. **AAPT Resource Compilation**: Processes `AndroidManifest.xml` and Android resources, generating `R.java`.
2. **Javac Compilation**: Compiles `MainActivity.java` and bridge interfaces using Java 17.
3. **D8 Dexing**: Transforms compiled Java bytecode into Android Dalvik `classes.dex`.
4. **Asset Bundling**: Packages 3D WebGL engine, Three.js, PeerJS, audio synthesizers, and textures into `assets/game/`.
5. **Zipalign**: Optimizes APK package byte alignment to 4-byte boundaries for zero-copy memory mapping.
6. **Apksigner**: Signs the package with standard v2 and v3 signature schemes.

