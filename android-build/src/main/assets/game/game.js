/**
 * APEX: MOST WANTED 3D - Need for Speed: Most Wanted Visual Overhaul
 * 
 * Features:
 * - Iconic NFS Most Wanted Golden Autumn HDR Aesthetics (ACES Filmic Tone Mapping)
 * - Real-Time Procedural Environment Map with Mirror Reflections on Car Bodies & Glass
 * - Legendary BMW M3 GTR Style Silver & Cobalt Blue Livery with Hood Heat Vents
 * - Tuned Widebody Aero Kits, Carbon Splitters, GT3 Spoilers, Brembo Brakes with Glowing Rotors
 * - Wet Glossy Asphalt with Mirror Puddle Reflections & Tire Skid Mark Ribbons
 * - Volumetric Xenon Headlights, Full-Width LED Taillights & Twin Fiery NOS Jet Exhausts
 * - Rockport Autumn Highway: Suspension Bridge, Autumn Maple Trees, Overhead Gantries & Speed Cameras
 * - High-Speed Motion Blur / Radial Wind Streaks Canvas Overlay & Camera Radar Flash
 * - Authentic NFS Most Wanted Tachometer, Gear Indicator & Redline Shift Light
 */

(function () {
    'use strict';

    // ─── Constants ───────────────────────────────────────────────────────────────
    const TOTAL_LAPS = 3;
    const MAX_PLAYERS = 4;

    // Ultra High-Graphics NFS Tuned Cars (Matching Reference Aesthetics)
    const CAR_THEMES = [
        { name: 'Copper Apex GTR', base: 0xD84E20, texFile: 'textures/car_paint_copper.png', stripe: '#D84E20', dark: 0x1A1412, rim: 0x181818, brake: 0xCC1100, num: '1', numColor: '#00FF66' },
        { name: 'Cyan Velocity',  base: 0x00C8DC, texFile: 'textures/rival_cyan.png',       stripe: '#00C8DC', dark: 0x004050, rim: 0x222228, brake: 0x00FF66, num: '3', numColor: '#FF2222' },
        { name: 'Solar Apex',     base: 0xF5BE00, texFile: 'textures/rival_yellow.png',     stripe: '#F5BE00', dark: 0x403000, rim: 0x111111, brake: 0xFF2222, num: '2', numColor: '#FFDD00' },
        { name: 'M3 GTR Hero',    base: 0xD8DDE6, texFile: 'textures/car_paint_m3.png',     stripe: '#0055D4', dark: 0x111620, rim: 0x222228, brake: 0xCC1100, num: '4', numColor: '#FFFFFF' },
        { name: 'Emerald Hyper',  base: 0x1EC85A, texFile: 'textures/rival_green.png',      stripe: '#1EC85A', dark: 0x083818, rim: 0x151515, brake: 0xFF8800, num: '5', numColor: '#00FF66' }
    ];

    const PLAYER_NUMBER_COLORS = ['#00FF66', '#FF2222', '#FFDD00', '#FFFFFF'];
    const textureLoader = new THREE.TextureLoader();
    const windTurbines = [];
    const audioBuffers = {};
    let bgmAudioSource = null;
    let engineAccelAudioNode = null;
    let engineIdleAudioNode = null;

    // ─── Track Definitions (NFS Most Wanted Style) ────────────────────────────────
    const TRACKS = {
        rockport: {
            name: 'Rockport Autumn Highway',
            pts: [
                [0,0,0],[0,0,85],[18,0,150],[65,0,210],[135,0,235],
                [195,0,205],[225,0,135],[215,0,55],[185,0,-12],
                [195,0,-80],[165,0,-135],[90,0,-158],[20,0,-145],
                [-38,0,-120],[-65,0,-60],[-48,0,-15]
            ],
            fog: { color: 0xDDA044, near: 80, far: 450 },
            ambientColor: 0x886040, ambientIntensity: 0.85,
            sunColor: 0xFFB040, sunIntensity: 2.2, sunPos: [90, 38, 220],
            rimColor: 0x6688BB, rimIntensity: 0.55,
            roadColor: 0x14161C,
            isNight: false
        },
        downtown: {
            name: 'Camden Docks & Downtown',
            pts: [
                [0,0,0],[0,0,88],[-10,0,120],[-52,0,140],[-100,0,130],
                [-135,0,105],[-140,0,60],[-126,0,22],[-92,0,-8],
                [-54,0,-22],[-14,0,-14],[32,0,18],[50,0,65],
                [32,0,94],[12,0,94]
            ],
            fog: { color: 0x060A14, near: 60, far: 230 },
            ambientColor: 0x1A2644, ambientIntensity: 0.45,
            sunColor: 0x2255AA, sunIntensity: 0.45, sunPos: [-50, 20, -90],
            rimColor: 0x6633AA, rimIntensity: 0.35,
            roadColor: 0x0A0D12,
            isNight: true
        },
        canyon: {
            name: 'Blackwood Canyon Duel',
            pts: [
                [0,0,0],[-6,3,60],[-28,7,118],[-62,12,158],[-86,16,124],
                [-74,12,82],[-40,8,60],[6,6,80],[48,3,122],
                [76,0,155],[96,0,126],[106,5,82],[94,12,36],
                [62,16,5],[28,10,-34],[0,5,-20]
            ],
            fog: { color: 0xC89466, near: 100, far: 520 },
            ambientColor: 0x886B52, ambientIntensity: 0.75,
            sunColor: 0xFFE0B0, sunIntensity: 1.8, sunPos: [110, 55, 180],
            rimColor: 0x445577, rimIntensity: 0.4,
            roadColor: 0x1A1B20,
            isNight: false,
            hasElevation: true
        }
    };

    // ─── State ────────────────────────────────────────────────────────────────────
    let scene, camera, renderer, envTexture;
    let localPlayerCar = null;
    const cars = [];
    let checkpoints = [];
    let trackWaypoints = [];
    let raceState = 'MENU';
    let countdownRemaining = 3;
    let raceStartTime = 0;
    let currentLapTime = 0;
    let bestLapTime = Infinity;
    let topSpeedReached = 0;
    let cameraModeIndex = 0;
    let frameCount = 0;
    let animTime = 0;
    let camShakeAmount = 0;

    let netMode = 'SOLO';
    let isHost = true;
    let myPlayerIndex = 0;
    let peerInstance = null;
    let netConnections = [];
    let hostConnection = null;

    let selectedTrackId = 'rockport';
    let currentTrack = null;
    let pendingMode = 'SOLO';

    const inputs = { steerLeft:false, steerRight:false, throttle:false, brake:false, nitro:false };

    // Skid marks & smoke
    const skidmarks = [];
    const MAX_SKIDMARKS = 120;
    let tireSmokeParticles = null;
    let sparkParticles = null;

    // High speed canvas & radar flash
    let speedLinesCanvas = null;
    let speedLinesCtx = null;
    let radarFlashEl = null;

    // Audio
    let audioCtx=null, engineOsc=null, engineGain=null, tireGain=null, nitroOsc=null, nitroGain=null;

    const animObjs = [];

    // ─── INIT ────────────────────────────────────────────────────────────────────
    window.addEventListener('DOMContentLoaded', init);

    function init() {
        setupThree();
        setupSpeedLinesCanvas();
        buildTrackEnvironment('rockport');
        initCarsForLobby(4);
        setupAudio();
        setupInputListeners();
        setupMenuUI();

        let lastTime = performance.now();
        function animate(now) {
            requestAnimationFrame(animate);
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            animTime += dt;
            frameCount++;

            updatePhysics(dt);
            updateCamera(dt);
            updateHUD(now);
            updateAnims(dt);
        windTurbines.forEach(wt => { wt.rotation.z += 0.018; });
            updateParticles(dt);
            updateFloatingLabels();
            renderSpeedLines();
            updateRemoteSync(now);

            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
    }

    // ─── THREE.JS SETUP WITH HIGH-END HDR LIGHTING ────────────────────────────────
    function setupThree() {
        const container = document.getElementById('game-container');
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 700);
        camera.position.set(0, 4, -10);

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.BasicShadowMap;

        // Cinematic ACES Filmic Tone Mapping (Iconic NFS warm amber HDR look)
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;
        container.appendChild(renderer.domElement);

        // Generate procedural HDR autumn environment map for real-time car reflections
        envTexture = createNFSWorldEnvMap();
        scene.environment = envTexture;

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (speedLinesCanvas) {
                speedLinesCanvas.width = window.innerWidth;
                speedLinesCanvas.height = window.innerHeight;
            }
        });
    }

    // ─── PROCEDURAL HDR ENVIRONMENT REFLECTION MAP ────────────────────────────────
    function createNFSWorldEnvMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Sky gradient: Deep burnt amber top down to brilliant golden sun horizon
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
        skyGrad.addColorStop(0.0, '#3A1505');
        skyGrad.addColorStop(0.3, '#A0450A');
        skyGrad.addColorStop(0.7, '#FFA025');
        skyGrad.addColorStop(0.95, '#FFF299');
        skyGrad.addColorStop(1.0, '#FFE877');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 1024, 256);

        // Autumn sun flare & god rays
        const sunGrad = ctx.createRadialGradient(720, 200, 10, 720, 200, 240);
        sunGrad.addColorStop(0.0, 'rgba(255, 255, 220, 1.0)');
        sunGrad.addColorStop(0.2, 'rgba(255, 200, 80, 0.85)');
        sunGrad.addColorStop(0.6, 'rgba(255, 120, 30, 0.3)');
        sunGrad.addColorStop(1.0, 'rgba(200, 60, 0, 0.0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, 1024, 256);

        // Cirrus cloud bands
        ctx.fillStyle = 'rgba(255, 230, 190, 0.22)';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.ellipse(200 + i * 160, 80 + i * 18, 140, 16, 0.05, 0, Math.PI * 2);
            ctx.fill();
        }

        // Horizon silhouette (city skyscrapers, suspension bridge pylons, trees)
        ctx.fillStyle = '#18100C';
        for (let b = 0; b < 24; b++) {
            const bx = b * 45;
            const bh = 15 + (Math.sin(b * 3.7) * 0.5 + 0.5) * 45;
            ctx.fillRect(bx, 256 - bh, 36, bh);
        }

        // Ground reflection: Wet dark asphalt reflecting warm amber sky
        const groundGrad = ctx.createLinearGradient(0, 256, 0, 512);
        groundGrad.addColorStop(0.0, '#221510');
        groundGrad.addColorStop(0.2, '#141216');
        groundGrad.addColorStop(0.7, '#0A0A0E');
        groundGrad.addColorStop(1.0, '#050508');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 256, 1024, 256);

        // Wet puddle specular highlights on ground
        ctx.fillStyle = 'rgba(255, 180, 70, 0.18)';
        for (let p = 0; p < 8; p++) {
            ctx.beginPath();
            ctx.ellipse(120 + p * 120, 320 + (p % 3) * 40, 80, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        return texture;
    }

    // ─── HIGH SPEED MOTION BLUR & RADAR OVERLAY ──────────────────────────────────
    function setupSpeedLinesCanvas() {
        speedLinesCanvas = document.getElementById('speed-lines-canvas');
        if (speedLinesCanvas) {
            speedLinesCanvas.width = window.innerWidth;
            speedLinesCanvas.height = window.innerHeight;
            speedLinesCtx = speedLinesCanvas.getContext('2d');
        }
        radarFlashEl = document.getElementById('radar-flash-overlay');
    }

    function renderSpeedLines() {
        if (!speedLinesCtx || !localPlayerCar) return;
        const w = speedLinesCanvas.width, h = speedLinesCanvas.height;
        speedLinesCtx.clearRect(0, 0, w, h);

        const kmh = localPlayerCar.speed * 3.6;
        if (kmh < 130 && !localPlayerCar.nitroActive) return;

        const intensity = localPlayerCar.nitroActive ? 1.0 : Math.min(1.0, (kmh - 130) / 70);
        const cx = w / 2, cy = h / 2;
        const lineCount = localPlayerCar.nitroActive ? 32 : 18;

        speedLinesCtx.lineWidth = localPlayerCar.nitroActive ? 2.5 : 1.5;
        for (let i = 0; i < lineCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distInner = (0.28 + Math.random() * 0.15) * Math.min(w, h);
            const distOuter = (0.55 + Math.random() * 0.45) * Math.min(w, h);

            const x1 = cx + Math.cos(angle) * distInner;
            const y1 = cy + Math.sin(angle) * distInner;
            const x2 = cx + Math.cos(angle) * distOuter;
            const y2 = cy + Math.sin(angle) * distOuter;

            const alpha = (0.15 + Math.random() * 0.45) * intensity;
            speedLinesCtx.strokeStyle = localPlayerCar.nitroActive
                ? `rgba(0, 220, 255, ${alpha})`
                : `rgba(255, 230, 180, ${alpha * 0.7})`;

            speedLinesCtx.beginPath();
            speedLinesCtx.moveTo(x1, y1);
            speedLinesCtx.lineTo(x2, y2);
            speedLinesCtx.stroke();
        }
    }

    function triggerRadarCameraFlash() {
        if (!radarFlashEl) return;
        radarFlashEl.style.opacity = '0.9';
        setTimeout(() => {
            if (radarFlashEl) radarFlashEl.style.opacity = '0';
        }, 120);
    }

    // ─── SCENE CLEANUP & BUILD ───────────────────────────────────────────────────
    function clearScene() {
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        animObjs.length = 0;
        cars.length = 0;
        localPlayerCar = null;
        checkpoints = [];
        trackWaypoints = [];
        skidmarks.length = 0;
    }

    function buildTrackEnvironment(trackId) {
        clearScene();
        currentTrack = TRACKS[trackId] || TRACKS.rockport;
        selectedTrackId = trackId;

        // Fog
        scene.fog = new THREE.Fog(currentTrack.fog.color, currentTrack.fog.near, currentTrack.fog.far);

        // Ambient Light
        const ambient = new THREE.AmbientLight(currentTrack.ambientColor, currentTrack.ambientIntensity);
        scene.add(ambient);

        // Blazing Golden Sun
        const sun = new THREE.DirectionalLight(currentTrack.sunColor, currentTrack.sunIntensity);
        const sp = currentTrack.sunPos;
        sun.position.set(sp[0], sp[1], sp[2]);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        const sc = sun.shadow.camera;
        sc.left=-150; sc.right=150; sc.top=150; sc.bottom=-150; sc.near=10; sc.far=420;
        scene.add(sun);

        // Cool Rim Fill Light
        const rim = new THREE.DirectionalLight(currentTrack.rimColor, currentTrack.rimIntensity);
        rim.position.set(-60, 25, -60);
        scene.add(rim);

        // Ground terrain
        const groundGeo = new THREE.PlaneGeometry(1600, 1600);
        groundGeo.rotateX(-Math.PI / 2);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x121418,
            roughness: 0.95,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = -0.15;
        ground.receiveShadow = true;
        scene.add(ground);

        // Spline Waypoints
        const rawPts = currentTrack.pts.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(rawPts, true, 'centripetal');
        trackWaypoints = curve.getSpacedPoints(240);

        // Build specific theme
        if (trackId === 'rockport') buildRockportEnv();
        else if (trackId === 'downtown') buildDowntownEnv();
        else if (trackId === 'canyon') buildCanyonEnv();

        // Build high-end wet road
        buildWetAsphaltRoad();
        buildCheckerboardStartLine();
        buildBarriers(trackId);
        buildCheckpoints();
        buildTrackFurniture();
        setupParticleSystems();
    }

    // ─── 1. ROCKPORT AUTUMN HIGHWAY (CLASSIC NFS:MW AESTHETIC) ────────────────────
    function buildRockportEnv() {
        // High-Resolution 4K Panoramic Sunset Sky Dome
        const skyTex = textureLoader.load('textures/sunset_sky_pano.png');
        skyTex.wrapS = THREE.RepeatWrapping;
        const skyGeo = new THREE.SphereGeometry(850, 48, 24);
        const skyMat = new THREE.MeshBasicMaterial({
            map: skyTex,
            side: THREE.BackSide,
            depthWrite: false
        });
        const skyDome = new THREE.Mesh(skyGeo, skyMat);
        skyDome.position.y = 80;
        scene.add(skyDome);

        // Blazing autumn sun disc + halo
        const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(26, 32),
            new THREE.MeshBasicMaterial({ color: 0xFFF5CC }));
        sunDisc.position.set(90, 72, 510);
        scene.add(sunDisc);

        const halo = new THREE.Mesh(new THREE.CircleGeometry(64, 32),
            new THREE.MeshBasicMaterial({ color: 0xFFA020, transparent: true, opacity: 0.45, depthWrite: false }));
        halo.position.set(90, 72, 509);
        scene.add(halo);

        // 3D Wind Turbines on the hills (matching reference screenshot)
        const turbineCoords = [
            [160, 24, 260], [210, 32, 320], [270, 38, 380],
            [-180, 22, 220], [-240, 28, 290]
        ];
        turbineCoords.forEach(([tx, ty, tz]) => {
            buildWindTurbine(tx, ty, tz);
        });

        // Ocean channel (coastal highway view)
        const oceanGeo = new THREE.PlaneGeometry(700, 300, 24, 8);
        oceanGeo.rotateX(-Math.PI / 2);
        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x1A3555,
            metalness: 0.85,
            roughness: 0.2,
            envMap: envTexture
        });
        const ocean = new THREE.Mesh(oceanGeo, oceanMat);
        ocean.position.set(0, -0.4, 380);
        scene.add(ocean);

        // Iconic Suspension Bridge (Rockport landmark)
        buildSuspensionBridge(210, 320);

        // Autumn Maple & Oak Trees (rich orange, crimson, and golden yellow)
        for (let i = 0; i < 35; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const ang = i * 0.38;
            const dist = 70 + Math.random() * 35;
            const px = Math.sin(ang) * dist * side;
            const pz = -130 + i * 16 + Math.random() * 20;
            buildAutumnTree(px, pz, i);
        }

        // Industrial Factory & Warehouse Silhouettes
        buildIndustrialComplex(180, 210);
        buildIndustrialComplex(-190, 200);

        // Overhead Highway Gantries with Speed Trap Radar Cameras
        buildOverheadGantry(trackWaypoints[40], 'ROCKPORT INTERSTATE', 'SPEED TRAP 200M', true);
        buildOverheadGantry(trackWaypoints[140], 'DOWNTOWN DOCKS', 'RADAR ZONE', true);
    }

    function buildWindTurbine(x, y, z) {
        const turbineGroup = new THREE.Group();
        const mastGeo = new THREE.CylinderGeometry(0.7, 1.4, 42, 8);
        const tMat = new THREE.MeshStandardMaterial({ color: 0x7A361E, roughness: 0.6 });
        const mast = new THREE.Mesh(mastGeo, tMat);
        mast.position.y = 21;
        turbineGroup.add(mast);

        const hub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), tMat);
        hub.position.y = 42;
        turbineGroup.add(hub);

        const bladeGroup = new THREE.Group();
        bladeGroup.position.set(0, 42, 0.7);
        for (let a = 0; a < 3; a++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 17, 0.15), tMat);
            blade.position.y = 8.5;
            const arm = new THREE.Group();
            arm.rotation.z = (a * 2 * Math.PI) / 3;
            arm.add(blade);
            bladeGroup.add(arm);
        }
        turbineGroup.add(bladeGroup);
        turbineGroup.position.set(x, y, z);
        scene.add(turbineGroup);
        windTurbines.push(bladeGroup);
    }

    function buildAutumnTree(x, z, seed) {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3E2714, roughness: 0.95 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 4.5, 8), trunkMat);
        trunk.position.y = 2.25;
        group.add(trunk);

        // Autumn colors: golden amber, maple red, burnt orange
        const foliagePalette = [0xFFAA11, 0xCC3300, 0xEE6600, 0xD47711];
        const folColor = foliagePalette[seed % foliagePalette.length];
        const folMat = new THREE.MeshStandardMaterial({ color: folColor, roughness: 0.85 });

        // Multi-tier leafy canopy
        for (let t = 0; t < 3; t++) {
            const r = 2.8 - t * 0.55;
            const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), folMat);
            canopy.position.set(Math.sin(t * 1.5) * 0.3, 4.5 + t * 1.8, Math.cos(t * 1.5) * 0.3);
            canopy.scale.y = 0.85;
            group.add(canopy);
        }

        group.position.set(x, 0, z);
        const scale = 0.85 + (Math.sin(seed * 5.2) * 0.5 + 0.5) * 0.45;
        group.scale.set(scale, scale, scale);
        scene.add(group);

        // Wind sway
        animObjs.push({
            update: (dt, t) => {
                group.rotation.z = Math.sin(t * 0.9 + seed) * 0.03;
            }
        });
    }

    function buildSuspensionBridge(x, z) {
        const bridgeGroup = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x992211,
            metalness: 0.75,
            roughness: 0.35,
            envMap: envTexture
        });
        const cableMat = new THREE.MeshBasicMaterial({ color: 0xCCCCCC });

        // Two twin suspension towers
        [-25, 25].forEach(ox => {
            const tower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 60, 3.5), steelMat);
            tower.position.set(ox, 30, 0);
            bridgeGroup.add(tower);

            // Cross struts
            for (let cs = 0; cs < 3; cs++) {
                const strut = new THREE.Mesh(new THREE.BoxGeometry(48, 1.8, 2.5), steelMat);
                strut.position.set(0, 16 + cs * 15, 0);
                bridgeGroup.add(strut);
            }
        });

        // Main parabolic suspension cable
        for (let c = -40; c <= 40; c += 2) {
            const cy = 20 + Math.pow(c / 40, 2) * 38;
            const cableDot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 3), cableMat);
            cableDot.position.set(c, cy, 0);
            bridgeGroup.add(cableDot);
        }

        bridgeGroup.position.set(x, 0, z);
        bridgeGroup.rotation.y = 0.6;
        scene.add(bridgeGroup);
    }

    function buildIndustrialComplex(x, z) {
        const group = new THREE.Group();
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x3A3C42, roughness: 0.85 });
        const tankMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.8, roughness: 0.3, envMap: envTexture });

        // Factory warehouses
        for (let w = 0; w < 3; w++) {
            const warehouse = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 18), concreteMat);
            warehouse.position.set(w * 26 - 26, 7, 0);
            group.add(warehouse);

            // Roof vents
            const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 4, 8), concreteMat);
            vent.position.set(w * 26 - 26, 16, 0);
            group.add(vent);
        }

        // Oil storage tanks
        for (let t = 0; t < 2; t++) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 12, 16), tankMat);
            tank.position.set(t * 16 - 8, 6, 22);
            group.add(tank);
        }

        group.position.set(x, 0, z);
        scene.add(group);
    }

    function buildOverheadGantry(wp, signText, subText, hasSpeedCamera) {
        const gantry = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444855, metalness: 0.8, roughness: 0.3 });

        // Twin pillars spanning road
        [-11, 11].forEach(ox => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.5, 0.6), metalMat);
            p.position.set(ox, 4.75, 0);
            gantry.add(p);
        });

        // Cross truss
        const truss = new THREE.Mesh(new THREE.BoxGeometry(23, 1.2, 0.8), metalMat);
        truss.position.set(0, 9.2, 0);
        gantry.add(truss);

        // Highway Signboard
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 80;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#005522'; ctx.fillRect(0, 0, 256, 80);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 248, 72);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Impact, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(signText, 128, 38);
        ctx.fillStyle = '#FFDD00';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(subText, 128, 64);

        const signMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), signMat);
        sign.position.set(0, 9.2, 0.45);
        gantry.add(sign);

        // Speed Trap Radar Box with Flash Strobe
        if (hasSpeedCamera) {
            const camBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8),
                new THREE.MeshStandardMaterial({ color: 0xEEAA00, metalness: 0.7 }));
            camBox.position.set(8.5, 9.8, 0.2);
            gantry.add(camBox);

            const flashLens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16),
                new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
            flashLens.position.set(8.5, 9.8, 0.62);
            gantry.add(flashLens);

            // Radar trigger zone check
            animObjs.push({
                update: () => {
                    if (localPlayerCar && raceState === 'RACING') {
                        const dist = localPlayerCar.group.position.distanceTo(gantry.position);
                        if (dist < 12 && localPlayerCar.speed * 3.6 > 135) {
                            if (!gantry.userData.lastFlash || (animTime - gantry.userData.lastFlash > 4.0)) {
                                gantry.userData.lastFlash = animTime;
                                triggerRadarCameraFlash();
                                playBeep(980, 0.1);
                            }
                        }
                    }
                }
            });
        }

        gantry.position.set(wp.x, wp.y, wp.z);
        scene.add(gantry);
    }

    // ─── 2. CAMDEN DOCKS & DOWNTOWN (NIGHT RAIN) ──────────────────────────────────
    function buildDowntownEnv() {
        // Deep midnight sky
        const sky = new THREE.Mesh(new THREE.PlaneGeometry(800, 800),
            new THREE.MeshBasicMaterial({ color: 0x03050A, side: THREE.BackSide, depthWrite: false }));
        sky.position.set(0, 200, 0); sky.rotation.x = Math.PI / 2;
        scene.add(sky);

        // 16 Modern glass skyscrapers
        for (let b = 0; b < 16; b++) {
            const ang = (b / 16) * Math.PI * 2;
            const bx = Math.sin(ang) * (140 + (b % 4) * 35);
            const bz = Math.cos(ang) * (140 + (b % 4) * 35);
            const h = 55 + (b % 5) * 22;
            const w = 18 + (b % 3) * 6;

            const bldgMat = new THREE.MeshStandardMaterial({
                color: 0x0E1420,
                metalness: 0.9,
                roughness: 0.15,
                envMap: envTexture
            });
            const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.8), bldgMat);
            bldg.position.set(bx, h / 2, bz);
            scene.add(bldg);

            // Rooftop beacon
            const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xFF1100 }));
            redBeacon.position.set(bx, h + 0.4, bz);
            scene.add(redBeacon);
        }

        // Wet mist particle rain
        buildRainSystem();
    }

    function buildRainSystem() {
        const count = 900;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3]     = (Math.random() - 0.5) * 240;
            pos[i * 3 + 1] = Math.random() * 35;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 240;
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        const rain = new THREE.Points(geo,
            new THREE.PointsMaterial({ color: 0x99B0D4, size: 0.35, transparent: true, opacity: 0.65 }));
        scene.add(rain);

        const pArr = geo.attributes.position;
        animObjs.push({
            update: (dt) => {
                for (let i = 0; i < count; i++) {
                    let y = pArr.getY(i) - 22 * dt;
                    if (y < -0.5) y = 35;
                    pArr.setY(i, y);
                    pArr.setX(i, pArr.getX(i) - 2.0 * dt);
                }
                pArr.needsUpdate = true;
            }
        });
    }

    // ─── 3. BLACKWOOD CANYON PASS (CANYON DUEL) ───────────────────────────────────
    function buildCanyonEnv() {
        // Canyon rocky peaks
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x77553A, roughness: 0.95 });
        for (let c = 0; c < 12; c++) {
            const ang = (c / 12) * Math.PI * 2;
            const cx = Math.sin(ang) * (130 + (c % 3) * 25);
            const cz = Math.cos(ang) * (130 + (c % 3) * 25);
            const ch = 70 + (c % 4) * 25;
            const cliff = new THREE.Mesh(new THREE.ConeGeometry(40, ch, 7), rockMat);
            cliff.position.set(cx, ch / 2, cz);
            scene.add(cliff);
        }
    }

    // ─── WET ASPHALT ROAD WITH GLOSSY SPECULAR REFLECTIONS ────────────────────────
    function buildWetAsphaltRoad() {
        const roadWidth = 18;
        const positions = [], normals = [], uvs = [], indices = [];
        const n = trackWaypoints.length;

        for (let i = 0; i <= n; i++) {
            const p1 = trackWaypoints[i % n];
            const p2 = trackWaypoints[(i + 1) % n];
            const fwd = new THREE.Vector3().subVectors(p2, p1).normalize();
            const right = new THREE.Vector3(-fwd.z, 0, fwd.x).normalize();

            const lEdge = p1.clone().addScaledVector(right, -roadWidth / 2);
            const rEdge = p1.clone().addScaledVector(right,  roadWidth / 2);
            const ry = p1.y;

            positions.push(lEdge.x, ry + 0.02, lEdge.z, rEdge.x, ry + 0.02, rEdge.z);
            normals.push(0, 1, 0, 0, 1, 0);
            uvs.push(0, i * 0.4, 1, i * 0.4);
        }

        for (let i = 0; i < n; i++) {
            const b = i * 2;
            indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
        geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);

        // High-Resolution 2K PBR Wet Asphalt
        const roadDiff = textureLoader.load('textures/asphalt_pbr_diffuse.png');
        roadDiff.wrapS = THREE.RepeatWrapping; roadDiff.wrapT = THREE.RepeatWrapping;
        roadDiff.repeat.set(1, 24);

        const roadNorm = textureLoader.load('textures/asphalt_pbr_normal.png');
        roadNorm.wrapS = THREE.RepeatWrapping; roadNorm.wrapT = THREE.RepeatWrapping;
        roadNorm.repeat.set(1, 24);

        const roadRough = textureLoader.load('textures/asphalt_pbr_roughness.png');
        roadRough.wrapS = THREE.RepeatWrapping; roadRough.wrapT = THREE.RepeatWrapping;
        roadRough.repeat.set(1, 24);

        const roadMat = new THREE.MeshStandardMaterial({
            map: roadDiff,
            normalMap: roadNorm,
            normalScale: new THREE.Vector2(0.85, 0.85),
            roughnessMap: roadRough,
            roughness: 0.32,
            metalness: 0.35,
            envMap: envTexture,
            envMapIntensity: 1.1
        });

        const road = new THREE.Mesh(geo, roadMat);
        road.receiveShadow = true;
        scene.add(road);
    }

    function createAsphaltTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dark bitumen grain
        ctx.fillStyle = '#14171E';
        ctx.fillRect(0, 0, 512, 512);

        // Asphalt noise grain
        for (let n = 0; n < 4000; n++) {
            const lum = 15 + Math.random() * 25;
            ctx.fillStyle = `rgb(${lum},${lum},${lum + 3})`;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        // Wet puddles with specular highlights
        ctx.fillStyle = 'rgba(10, 12, 16, 0.75)';
        for (let p = 0; p < 8; p++) {
            ctx.beginPath();
            ctx.ellipse(Math.random() * 512, Math.random() * 512, 60, 20, Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 14);
        return tex;
    }

    function buildRoadCenterLines() {
        for (let i = 0; i < trackWaypoints.length; i += 3) {
            const p = trackWaypoints[i];
            const p2 = trackWaypoints[(i + 1) % trackWaypoints.length];
            const angle = Math.atan2(p2.x - p.x, p2.z - p.z);

            // Double Yellow Center Stripes (Authentic NFS highway style)
            [-0.3, 0.3].forEach(off => {
                const s = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2),
                    new THREE.MeshBasicMaterial({ color: 0xF59E0B }));
                s.rotation.x = -Math.PI / 2;
                s.rotation.z = -angle;
                s.position.set(p.x + Math.cos(angle) * off, p.y + 0.035, p.z - Math.sin(angle) * off);
                scene.add(s);
            });
        }
    }

    function buildCheckerboardStartLine() {
        const p1 = trackWaypoints[0];
        const p2 = trackWaypoints[1];
        const fwd = new THREE.Vector3().subVectors(p2, p1).normalize();

        const checkTex = textureLoader.load('textures/checkered_line.png');
        checkTex.wrapS = THREE.RepeatWrapping; checkTex.wrapT = THREE.RepeatWrapping;
        checkTex.repeat.set(8, 2);

        const startMat = new THREE.MeshStandardMaterial({
            map: checkTex,
            roughness: 0.5,
            metalness: 0.1
        });
        const startMesh = new THREE.Mesh(new THREE.PlaneGeometry(22, 6.5), startMat);
        startMesh.rotation.x = -Math.PI / 2;
        startMesh.rotation.z = Math.atan2(fwd.x, fwd.z);
        startMesh.position.set(p1.x, p1.y + 0.035, p1.z - 3.5);
        startMesh.receiveShadow = true;
        scene.add(startMesh);
    }

    function buildBarriers(trackId) {
        const roadWidth = 19;
        const n = trackWaypoints.length;
        const chevronTex = textureLoader.load('textures/neon_barrier_chevron.png');
        chevronTex.wrapS = THREE.RepeatWrapping;
        chevronTex.wrapT = THREE.ClampToEdgeWrapping;
        chevronTex.repeat.set(36, 1);

        const barrierMat = new THREE.MeshStandardMaterial({
            map: chevronTex,
            emissiveMap: chevronTex,
            emissive: new THREE.Color(0x00FF88),
            emissiveIntensity: 0.95,
            roughness: 0.35,
            metalness: 0.55
        });

        [-1, 1].forEach(side => {
            const positions = [], normals = [], uvs = [], indices = [];
            const wallH = 1.6;

            for (let i = 0; i <= n; i++) {
                const p1 = trackWaypoints[i % n];
                const p2 = trackWaypoints[(i + 1) % n];
                const fwd = new THREE.Vector3().subVectors(p2, p1).normalize();
                const right = new THREE.Vector3(-fwd.z, 0, fwd.x).normalize();

                const bPos = p1.clone().addScaledVector(right, side * (roadWidth / 2 + 0.3));
                const tPos = bPos.clone();
                tPos.y += wallH;

                positions.push(bPos.x, bPos.y, bPos.z, tPos.x, tPos.y, tPos.z);
                normals.push(side * -right.x, 0, side * -right.z, side * -right.x, 0, side * -right.z);
                uvs.push(i * 0.45, 0, i * 0.45, 1);
            }

            for (let i = 0; i < n; i++) {
                const b = i * 2;
                if (side === -1) {
                    indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
                } else {
                    indices.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
                }
            }

            const wallGeo = new THREE.BufferGeometry();
            wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            wallGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            wallGeo.setIndex(indices);
            wallGeo.computeVertexNormals();

            const wallMesh = new THREE.Mesh(wallGeo, barrierMat);
            scene.add(wallMesh);
        });
    }

    function buildTrackFurniture() {
        // Start gantry banner
        const wMat = new THREE.MeshStandardMaterial({ color: 0x33333E, metalness: 0.8 });
        [-10, 10].forEach(x => {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 11, 8), wMat);
            p.position.set(x, 5.5, -5); scene.add(p);
        });
        const beam = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 0.6), wMat);
        beam.position.set(0, 11, -5); scene.add(beam);
    }

    function buildCheckpoints() {
        checkpoints = [];
        const count = 12;
        const step = Math.floor(trackWaypoints.length / count);
        for (let i = 0; i < count; i++) {
            const pt = trackWaypoints[i * step];
            checkpoints.push({ index: i, position: pt.clone(), radius: 24 });
        }
    }

    // ─── PARTICLE SYSTEMS (SMOKE & SPARKS) ────────────────────────────────────────
    function setupParticleSystems() {
        // Tire smoke
        const smokeCount = 120;
        const smokeGeo = new THREE.BufferGeometry();
        const sPos = new Float32Array(smokeCount * 3);
        smokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
        const smokeMat = new THREE.PointsMaterial({
            color: 0xCCCCCC,
            size: 2.2,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        tireSmokeParticles = new THREE.Points(smokeGeo, smokeMat);
        tireSmokeParticles.userData = { pool: [], index: 0 };
        scene.add(tireSmokeParticles);

        for (let i = 0; i < smokeCount; i++) {
            tireSmokeParticles.userData.pool.push({ x: 0, y: -99, z: 0, life: 0 });
        }
    }

    function emitTireSmoke(x, y, z) {
        if (!tireSmokeParticles) return;
        const p = tireSmokeParticles.userData.pool[tireSmokeParticles.userData.index];
        p.x = x + (Math.random() - 0.5) * 0.4;
        p.y = y + 0.15;
        p.z = z + (Math.random() - 0.5) * 0.4;
        p.life = 0.8;
        tireSmokeParticles.userData.index = (tireSmokeParticles.userData.index + 1) % tireSmokeParticles.userData.pool.length;
    }

    function updateParticles(dt) {
        if (!tireSmokeParticles) return;
        const pos = tireSmokeParticles.geometry.attributes.position;
        tireSmokeParticles.userData.pool.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= dt;
                p.y += 1.2 * dt;
                pos.setXYZ(i, p.x, p.y, p.z);
            } else {
                pos.setXYZ(i, 0, -99, 0);
            }
        });
        pos.needsUpdate = true;
    }

    // ─── DETAILED NFS MOST WANTED CAR CREATION (BMW M3 GTR LIVERY) ────────────────
    function createCar(playerIndex) {
        const theme = CAR_THEMES[playerIndex % CAR_THEMES.length];
        const carGroup = new THREE.Group();

        // High-Definition Livery and Carbon Fiber Materials
        const liveryTex = textureLoader.load(theme.texFile);
        const carbonTex = textureLoader.load('textures/carbon_weave.png');
        carbonTex.wrapS = THREE.RepeatWrapping; carbonTex.wrapT = THREE.RepeatWrapping;
        carbonTex.repeat.set(4, 4);

        const bodyMat = new THREE.MeshStandardMaterial({
            map: liveryTex,
            color: theme.base,
            metalness: 0.85,
            roughness: 0.18,
            envMap: envTexture,
            envMapIntensity: 1.5
        });

        const darkCarbonMat = new THREE.MeshStandardMaterial({
            map: carbonTex,
            color: theme.dark,
            metalness: 0.9,
            roughness: 0.22,
            envMap: envTexture
        });

        const tintedGlassMat = new THREE.MeshStandardMaterial({
            color: 0x141824,
            metalness: 0.95,
            roughness: 0.05,
            transparent: true,
            opacity: 0.82,
            envMap: envTexture
        });

        // Main Lower Chasis
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.55, 4.85), bodyMat);
        body.position.y = 0.52;
        body.castShadow = true;
        carGroup.add(body);

        // Flared Widebody Wheel Arches (Iconic GT Widebody look)
        [[-1.25, 0.42, 1.55], [1.25, 0.42, 1.55], [-1.25, 0.42, -1.55], [1.25, 0.42, -1.55]].forEach(([wx, wy, wz]) => {
            const arch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 1.05), bodyMat);
            arch.position.set(wx < 0 ? wx + 0.08 : wx - 0.08, wy + 0.18, wz);
            carGroup.add(arch);
        });

        // Curved Hood with Dual Carbon Heat Extraction Vents
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.28, 2.15), bodyMat);
        hood.position.set(0, 0.94, 0.95);
        hood.castShadow = true;
        carGroup.add(hood);

        // Twin Carbon Hood Vents (Signature M3 GTR feature)
        [-0.45, 0.45].forEach(vx => {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.75), darkCarbonMat);
            vent.position.set(vx, 1.08, 0.95);
            carGroup.add(vent);
        });

        // Iconic Racing Stripe running across center of car
        const stripeMat = new THREE.MeshBasicMaterial({ color: theme.stripe });
        const hoodStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.1), stripeMat);
        hoodStripe.rotation.x = -Math.PI / 2;
        hoodStripe.position.set(0, 1.09, 0.95);
        carGroup.add(hoodStripe);

        const roofStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.8), stripeMat);
        roofStripe.rotation.x = -Math.PI / 2;
        roofStripe.position.set(0, 1.39, -0.25);
        carGroup.add(roofStripe);

        // Cockpit / Cabin Shell
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.6, 1.9), bodyMat);
        cabin.position.set(0, 1.08, -0.25);
        cabin.castShadow = true;
        carGroup.add(cabin);

        // Windshield (deeply raked)
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.54, 0.12), tintedGlassMat);
        windshield.position.set(0, 1.1, 0.72);
        windshield.rotation.x = 0.42;
        carGroup.add(windshield);

        // Rear window
        const rearWin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.54, 0.12), tintedGlassMat);
        rearWin.position.set(0, 1.08, -1.02);
        rearWin.rotation.x = -0.42;
        carGroup.add(rearWin);

        // Side windows
        [-0.89, 0.89].forEach(xOff => {
            const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 1.68), tintedGlassMat);
            sw.position.set(xOff, 1.1, -0.2);
            carGroup.add(sw);
        });

        // Carbon Front Splitter
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.45), darkCarbonMat);
        splitter.position.set(0, 0.22, 2.68);
        carGroup.add(splitter);

        // Massive Rear GT3 Wing (Carbon Fiber & Alloy Posts)
        const wingPlate = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 0.7), darkCarbonMat);
        wingPlate.position.set(0, 1.6, -2.15);
        carGroup.add(wingPlate);

        [-1.3, 1.3].forEach(epX => {
            const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.7), darkCarbonMat);
            endPlate.position.set(epX, 1.45, -2.15);
            carGroup.add(endPlate);
        });

        [-0.65, 0.65].forEach(postX => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.1), darkCarbonMat);
            post.position.set(postX, 1.34, -2.15);
            carGroup.add(post);
        });

        // Dual Xenon Projector Headlights
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xE8F4FF });
        [-0.75, 0.75].forEach(hx => {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), hlMat);
            hl.position.set(hx, 0.72, 2.48);
            carGroup.add(hl);

            // Volumetric Forward Light Cone projecting onto wet asphalt
            const coneGeo = new THREE.ConeGeometry(2.5, 14, 12, 1, true);
            coneGeo.rotateX(-Math.PI / 2);
            const coneMat = new THREE.MeshBasicMaterial({
                color: 0xCCE8FF,
                transparent: true,
                opacity: 0.18,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const beam = new THREE.Mesh(coneGeo, coneMat);
            beam.position.set(hx, 0.5, 9.5);
            carGroup.add(beam);
        });

        // Full-width Modern LED Tail Light Bar
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xFF1800 });
        const tailBar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.08), tailMat);
        tailBar.position.set(0, 0.74, -2.46);
        carGroup.add(tailBar);

        // Quad Burnt Titanium Exhaust Tips
        const tiMat = new THREE.MeshStandardMaterial({ color: 0x446699, metalness: 0.95, roughness: 0.1 });
        [-0.55, -0.35, 0.35, 0.55].forEach(ex => {
            const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.32, 10), tiMat);
            tip.rotation.x = Math.PI / 2;
            tip.position.set(ex, 0.3, -2.52);
            carGroup.add(tip);
        });

        // Twin Fiery NOS Nitrous Jet Flames
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0 });
        const flames = [];
        [-0.45, 0.45].forEach(fx => {
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.3, 8), flameMat.clone());
            flame.rotation.x = Math.PI / 2;
            flame.position.set(fx, 0.3, -3.2);
            carGroup.add(flame);
            flames.push(flame);
        });

        // Brembo Ventilated Brake Rotors with Dynamic Heat Glow
        const brakeGlowMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
        const brakeCalipers = [];
        const wheels = [];
        const wheelOffsets = [
            [-1.25, 0.42, 1.55],
            [ 1.25, 0.42, 1.55],
            [-1.25, 0.42, -1.55],
            [ 1.25, 0.42, -1.55]
        ];

        const tireMat = new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.95 });
        const rimMat = new THREE.MeshStandardMaterial({
            color: theme.rim,
            metalness: 0.95,
            roughness: 0.12,
            envMap: envTexture
        });

        wheelOffsets.forEach(([wx, wy, wz]) => {
            const wg = new THREE.Group();

            // Wide low-profile sport tire
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.42, 20), tireMat);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wg.add(tire);

            // Deep-dish forged alloy rim
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.44, 6), rimMat);
            rim.rotation.z = Math.PI / 2;
            wg.add(rim);

            // High-Res Brembo Cross-Drilled Brake Rotor
            const rotorTex = textureLoader.load('textures/brake_rotor.png');
            const rotorMat = new THREE.MeshStandardMaterial({
                map: rotorTex,
                metalness: 0.85,
                roughness: 0.25
            });
            const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.46, 16), rotorMat);
            rotor.rotation.z = Math.PI / 2;
            wg.add(rotor);
            brakeCalipers.push(rotor);

            wg.position.set(wx, wy, wz);
            carGroup.add(wg);
            wheels.push(wg);
        });

        // Grid Placement: Player car at start line, rivals lined up ahead exactly like reference image
        const gridPresets = [
            [ 0.0, 0,  0.0],  // Player: Hero car right behind the checkered line
            [-1.6, 0, 18.0],  // Rival 1 (Cyan) ahead center-left
            [ 3.4, 0, 18.0],  // Rival 2 (Yellow) ahead center-right
            [-5.5, 0, 16.0],  // Rival 3 (Red) ahead far-left
            [ 8.0, 0, 15.0]   // Rival 4 (Emerald) ahead far-right
        ];
        const gPos = gridPresets[playerIndex % gridPresets.length];
        carGroup.position.set(gPos[0], gPos[1], gPos[2]);
        scene.add(carGroup);

        // Player Floating Number Sprite (hidden for player car, visible for rivals ahead)
        const numberSprite = createPlayerNumberSprite(theme.num || (playerIndex + 1), theme.numColor || PLAYER_NUMBER_COLORS[playerIndex]);
        numberSprite.position.set(0, 3.2, 0);
        numberSprite.scale.set(3.0, 3.0, 1);
        if (playerIndex === 0) numberSprite.visible = false;
        carGroup.add(numberSprite);

        return {
            group: carGroup,
            bodyMesh: body,
            flames,
            wheels,
            brakeCalipers,
            numberSprite,
            playerIndex,
            theme,

            // Physics
            speed: 0,
            topSpeed: 56,
            acceleration: 22,
            brakePower: 30,
            reverseTopSpeed: 14,
            steerAngle: 0,
            steerInput: 0,
            throttleInput: 0,
            brakeInput: false,
            nitroActive: false,
            nitroGauge: 100,
            brakeHeat: 0,

            // Race progress
            currentLap: 1,
            lastCheckpoint: -1,
            hasFinished: false,
            finishRank: 0
        };
    }

    function createPlayerNumberSprite(number, colorStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);

        // Dynamic bold italic racing number matching reference image
        ctx.font = 'italic 900 86px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Heavy dark outline
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(String(number), 64, 64);

        // Brilliant neon fill with glow
        ctx.shadowColor = colorStr;
        ctx.shadowBlur = 18;
        ctx.fillStyle = colorStr;
        ctx.fillText(String(number), 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    }

    function updateFloatingLabels() {
        const t = performance.now() * 0.001;
        cars.forEach((car, i) => {
            if (!car) return;
            car.numberSprite.position.y = 3.2 + Math.sin(t * 2 + i) * 0.08;
        });
    }

    // ─── TIRE SKID MARKS RIBBON ───────────────────────────────────────────────────
    function recordTireSkidmark(car) {
        if (skidmarks.length > MAX_SKIDMARKS) {
            const old = skidmarks.shift();
            scene.remove(old);
        }
        const markMat = new THREE.MeshBasicMaterial({ color: 0x050608, transparent: true, opacity: 0.55 });
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 1.2), markMat);
        mark.rotation.x = -Math.PI / 2;
        mark.rotation.z = -car.group.rotation.y;
        mark.position.set(car.group.position.x, car.group.position.y + 0.03, car.group.position.z);
        scene.add(mark);
        skidmarks.push(mark);
    }

    // ─── PHYSICS WITH DRIFTING, NITRO BOOST & SHIFTING ────────────────────────────
    function getTrackY(x, z) {
        if (!currentTrack || !currentTrack.hasElevation) return 0;
        let best = null, bestD = Infinity;
        for (let i = 0; i < trackWaypoints.length; i++) {
            const wp = trackWaypoints[i];
            const d = (wp.x - x) * (wp.x - x) + (wp.z - z) * (wp.z - z);
            if (d < bestD) { bestD = d; best = wp; }
        }
        return best ? best.y : 0;
    }

    function updatePhysics(dt) {
        cars.forEach(car => {
            if (!car) return;

            if (car === localPlayerCar && raceState === 'RACING') {
                car.steerInput    = (inputs.steerLeft ? -1 : 0) + (inputs.steerRight ? 1 : 0);
                car.throttleInput = inputs.throttle ? 1 : 0;
                car.brakeInput    = inputs.brake;
                car.nitroActive   = inputs.nitro && car.nitroGauge > 0 && car.throttleInput > 0;
            } else if (netMode === 'SOLO' && car !== localPlayerCar && raceState === 'RACING') {
                updateAICar(car, dt);
            }

            let eTop = car.topSpeed, eAccel = car.acceleration;

            // Nitrous Oxide Injection
            if (car.nitroActive) {
                eTop   *= 1.42; // Up to ~240 KM/H!
                eAccel *= 2.1;
                car.nitroGauge = Math.max(0, car.nitroGauge - 34 * dt);
                car.flames.forEach(f => {
                    f.material.opacity = 0.95;
                    f.scale.set(1, 0.8 + Math.random() * 0.6, 1);
                });
                camShakeAmount = Math.max(camShakeAmount, 0.08);
            } else {
                car.flames.forEach(f => { f.material.opacity *= 0.75; });
                car.nitroGauge = Math.min(100, car.nitroGauge + 9 * dt);
            }

            // Throttle & Brake
            if (car.throttleInput > 0) {
                if (car.speed < eTop) car.speed += eAccel * dt;
            } else if (car.brakeInput) {
                if (car.speed > 0.5) {
                    car.speed = Math.max(0, car.speed - car.brakePower * dt);
                    car.brakeHeat = Math.min(1.0, car.brakeHeat + 1.8 * dt);
                    // Emit tire smoke & skid marks when braking from high speed
                    if (car.speed > 18) {
                        recordTireSkidmark(car);
                        emitTireSmoke(car.group.position.x, car.group.position.y, car.group.position.z);
                    }
                } else {
                    car.speed = Math.max(-car.reverseTopSpeed, car.speed - car.acceleration * 0.55 * dt);
                }
            } else {
                car.speed = Math.max(0, car.speed - 9.0 * dt);
            }

            // Brake Rotors Heat Glow Effect
            car.brakeHeat = Math.max(0, car.brakeHeat - 0.7 * dt);
            if (car.brakeCalipers) {
                car.brakeCalipers.forEach(r => {
                    const rLum = Math.round(car.brakeHeat * 255);
                    const gLum = Math.round(car.brakeHeat * 75);
                    r.material.color.setRGB(rLum / 255, gLum / 255, 0);
                });
            }

            // Steering & Dynamic Street Drift
            const speedRatio = Math.min(1, Math.abs(car.speed) / 28);
            const maxAngle = 0.54 * (1 - speedRatio * 0.38);
            car.steerAngle += (car.steerInput * maxAngle - car.steerAngle) * Math.min(1, dt * 11);

            car.wheels[0].rotation.y = car.steerAngle;
            car.wheels[1].rotation.y = car.steerAngle;

            if (Math.abs(car.speed) > 0.2) {
                const turn = car.steerAngle * (car.speed / 2.5) * dt;
                car.group.rotation.y -= turn;
            }

            const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.group.rotation.y);
            car.group.position.addScaledVector(fwd, car.speed * dt);

            // Elevation Tracking
            if (currentTrack && currentTrack.hasElevation) {
                const ty = getTrackY(car.group.position.x, car.group.position.z);
                car.group.position.y += (ty - car.group.position.y) * Math.min(1, dt * 8);
            }

            // Wheel Spin
            const wheelSpin = (car.speed * dt) / 0.44;
            car.wheels.forEach(w => w.children[0].rotation.x += wheelSpin);

            checkTrackProgress(car);

            if (car === localPlayerCar) {
                const kmh = car.speed * 3.6;
                if (kmh > topSpeedReached) topSpeedReached = Math.round(kmh);
                updateEngineAudio(kmh, car.nitroActive);
            }
        });
    }

    function updateAICar(car, dt) {
        let closestIdx = 0, minDist = Infinity;
        for (let i = 0; i < trackWaypoints.length; i++) {
            const d = car.group.position.distanceTo(trackWaypoints[i]);
            if (d < minDist) { minDist = d; closestIdx = i; }
        }
        const targetIdx = (closestIdx + 7) % trackWaypoints.length;
        const targetPt = trackWaypoints[targetIdx].clone();
        targetPt.x += (car.playerIndex - 1.5) * 4.2;

        const toTarget = new THREE.Vector3().subVectors(targetPt, car.group.position);
        const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.group.rotation.y);
        const angle = fwd.angleTo(toTarget);
        const cross = new THREE.Vector3().crossVectors(fwd, toTarget);

        car.steerInput    = Math.min(1, Math.max(-1, (cross.y > 0 ? 1 : -1) * (angle / 0.38)));
        car.throttleInput = 1;
        car.brakeInput    = angle > 0.65 && car.speed > 34;
    }

    // ─── CHECKPOINTS & LAP PROGRESS ──────────────────────────────────────────────
    function checkTrackProgress(car) {
        checkpoints.forEach(cp => {
            if (car.group.position.distanceTo(cp.position) < cp.radius) {
                const expected = (car.lastCheckpoint + 1) % checkpoints.length;
                if (cp.index === expected) {
                    car.lastCheckpoint = cp.index;
                    if (cp.index === 0 && car.lastCheckpoint === 0) {
                        car.currentLap++;
                        if (car === localPlayerCar) {
                            const lapSec = (performance.now() - currentLapTime) / 1000;
                            if (lapSec > 10 && lapSec < bestLapTime) bestLapTime = lapSec;
                            currentLapTime = performance.now();
                        }
                        if (car.currentLap > TOTAL_LAPS && !car.hasFinished) {
                            car.hasFinished = true;
                            car.finishRank = cars.filter(c => c && c.hasFinished).length;
                            if (car === localPlayerCar) triggerRaceFinish(car.finishRank);
                        }
                    }
                }
            }
        });

        if (raceState === 'RACING') {
            const sortedCars = [...cars].filter(Boolean).sort((a, b) => {
                if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
                return b.lastCheckpoint - a.lastCheckpoint;
            });
            const rank = sortedCars.indexOf(localPlayerCar) + 1;
            const el = document.getElementById('hud-position');
            if (el) el.innerHTML = `${rank}<small>/${cars.length}</small>`;
        }
    }

    // ─── CAMERA CONTROLS WITH SPEED WARP & DYNAMIC SHAKE ─────────────────────────
    function updateCamera(dt) {
        if (!localPlayerCar) return;

        const carPos = localPlayerCar.group.position;
        const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), localPlayerCar.group.rotation.y);

        let camOffset, lookOffset;
        if (cameraModeIndex === 0) {
            // Close low action chase cam (Iconic NFS bumper-level view)
            camOffset  = fwd.clone().multiplyScalar(-6.2).add(new THREE.Vector3(0, 2.5, 0));
            lookOffset = fwd.clone().multiplyScalar(10.0).add(new THREE.Vector3(0, 0.95, 0));
        } else if (cameraModeIndex === 1) {
            camOffset  = fwd.clone().multiplyScalar(-9.5).add(new THREE.Vector3(0, 3.8, 0));
            lookOffset = fwd.clone().multiplyScalar(8.0).add(new THREE.Vector3(0, 1.4, 0));
        } else {
            // Hood / Bumper cam
            camOffset  = fwd.clone().multiplyScalar(1.6).add(new THREE.Vector3(0, 1.25, 0));
            lookOffset = fwd.clone().multiplyScalar(18.0).add(new THREE.Vector3(0, 0.55, 0));
        }

        const targetPos = carPos.clone().add(camOffset);

        // Apply camera shake on high speed & NOS
        if (camShakeAmount > 0.001) {
            targetPos.x += (Math.random() - 0.5) * camShakeAmount;
            targetPos.y += (Math.random() - 0.5) * camShakeAmount;
            camShakeAmount = Math.max(0, camShakeAmount - 0.5 * dt);
        }

        camera.position.lerp(targetPos, Math.min(1, dt * 9.5));
        camera.lookAt(carPos.clone().add(lookOffset));

        // Speed warp FOV: 65° at idle, up to 88° on full boost!
        const speedRatio = Math.min(1, Math.abs(localPlayerCar.speed) / 56);
        const targetFOV = 65 + speedRatio * 18 + (localPlayerCar.nitroActive ? 6 : 0);
        camera.fov += (targetFOV - camera.fov) * Math.min(1, dt * 6);
        camera.updateProjectionMatrix();
    }

    // ─── NFS MOST WANTED TACHO & SPEEDOMETER HUD ──────────────────────────────────
    function updateHUD(now) {
        if (!localPlayerCar || raceState !== 'RACING') return;

        const kmh = Math.round(localPlayerCar.speed * 3.6);
        const speedEl = document.getElementById('speed-value');
        if (speedEl) speedEl.textContent = kmh;

        // RPM & Gear calculation (Simulates 6-speed tuned street gearbox)
        const gearThresholds = [35, 75, 120, 165, 205, 250];
        let gear = 1;
        for (let g = 0; g < gearThresholds.length; g++) {
            if (kmh > gearThresholds[g]) gear = g + 2;
            else break;
        }
        gear = Math.min(6, gear);
        const gearEl = document.getElementById('gear-value');
        if (gearEl) gearEl.textContent = localPlayerCar.speed < -0.5 ? 'R' : gear;

        // RPM Needle rotation: -135deg at 0 to +135deg at 8000 RPM
        const prevGearKmh = gear === 1 ? 0 : gearThresholds[gear - 2];
        const nextGearKmh = gearThresholds[gear - 1];
        const rpmFrac = Math.min(1, Math.max(0, (kmh - prevGearKmh) / (nextGearKmh - prevGearKmh)));
        const rpm = 2500 + rpmFrac * 5500;
        const needleAngle = -135 + (rpm / 8000) * 270;
        const needleEl = document.getElementById('tacho-needle');
        if (needleEl) needleEl.style.transform = `rotate(${needleAngle}deg)`;

        // Shift Light (Flashes red at > 7000 RPM)
        const shiftLight = document.getElementById('shift-light');
        if (shiftLight) {
            if (rpm > 7000) shiftLight.classList.add('active');
            else shiftLight.classList.remove('active');
        }

        // NOS Nitro Bar
        const nitroEl = document.getElementById('nitro-bar');
        if (nitroEl) nitroEl.style.width = localPlayerCar.nitroGauge + '%';

        // Lap counter & Elapsed Time
        const lapEl = document.getElementById('hud-lap');
        if (lapEl) lapEl.innerHTML = `${Math.min(localPlayerCar.currentLap, TOTAL_LAPS)}<small>/${TOTAL_LAPS}</small>`;

        const elapsed = (now - raceStartTime) / 1000;
        const mins = Math.floor(elapsed / 60);
        const secs = (elapsed % 60).toFixed(2);
        const timeEl = document.getElementById('hud-time');
        if (timeEl) timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
    }

    function updateAnims(dt) {
        animObjs.forEach(o => { try { o.update(dt, animTime); } catch(e){} });
    }

    // ─── HIGH-FIDELITY STEREO RACING AUDIO SYSTEM ─────────────────────────────
    function loadSample(name, url) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                if ((xhr.status === 200 || xhr.status === 0) && xhr.response && audioCtx) {
                    audioCtx.decodeAudioData(xhr.response, function(buf) {
                        audioBuffers[name] = buf;
                    });
                }
            };
            xhr.send();
        } catch(e) {}
    }

    function playSoundEffect(name, vol = 0.8, pitch = 1.0) {
        if (!audioCtx || !audioBuffers[name]) return null;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const src = audioCtx.createBufferSource();
            src.buffer = audioBuffers[name];
            src.playbackRate.value = pitch;
            const g = audioCtx.createGain();
            g.gain.value = vol;
            src.connect(g);
            g.connect(audioCtx.destination);
            src.start();
            return src;
        } catch(e) { return null; }
    }

    function setupAudio() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AC();

            // Load Ultra HD Stereo WAV audio samples
            loadSample('idle', 'audio/engine_idle.wav');
            loadSample('accel', 'audio/engine_accel.wav');
            loadSample('nitro', 'audio/nitro_boost.wav');
            loadSample('screech', 'audio/tire_screech.wav');
            loadSample('shift', 'audio/gear_shift.wav');
            loadSample('beep', 'audio/countdown_beep.wav');
            loadSample('go', 'audio/countdown_go.wav');
            loadSample('bgm', 'audio/racing_soundtrack.wav');

            // Fallback Engine Synth Oscillator
            engineOsc = audioCtx.createOscillator();
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.setValueAtTime(55, audioCtx.currentTime);

            engineGain = audioCtx.createGain();
            engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            engineOsc.connect(engineGain);
            engineGain.connect(audioCtx.destination);
            engineOsc.start();

            // Tire squeal gain node
            tireGain = audioCtx.createGain();
            tireGain.gain.setValueAtTime(0, audioCtx.currentTime);
            tireGain.connect(audioCtx.destination);
        } catch(e) {}
    }

    function startEngineLoops() {
        if (!audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (audioBuffers['accel'] && !engineAccelAudioNode) {
                engineAccelAudioNode = audioCtx.createBufferSource();
                engineAccelAudioNode.buffer = audioBuffers['accel'];
                engineAccelAudioNode.loop = true;
                const g = audioCtx.createGain();
                g.gain.value = 0.45;
                engineAccelAudioNode.connect(g);
                g.connect(audioCtx.destination);
                engineAccelAudioNode.start();
                engineAccelAudioNode._gain = g;
            }
            if (audioBuffers['bgm'] && !bgmAudioSource) {
                bgmAudioSource = audioCtx.createBufferSource();
                bgmAudioSource.buffer = audioBuffers['bgm'];
                bgmAudioSource.loop = true;
                const g = audioCtx.createGain();
                g.gain.value = 0.35;
                bgmAudioSource.connect(g);
                g.connect(audioCtx.destination);
                bgmAudioSource.start();
            }
        } catch(e) {}
    }

    function updateEngineAudio(kmh, isNitro) {
        if (!audioCtx) return;
        try {
            // Modulate fallback synth
            if (engineOsc) {
                const baseFreq = 60 + (kmh / 240) * 260 + (isNitro ? 45 : 0);
                engineOsc.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.05);
            }
            // Modulate realistic HD Engine Audio loop
            if (engineAccelAudioNode) {
                const rate = 0.65 + (kmh / 200) * 0.95 + (isNitro ? 0.2 : 0);
                engineAccelAudioNode.playbackRate.setTargetAtTime(rate, audioCtx.currentTime, 0.05);
            }
        } catch(e){}
    }

    function playBeep(freq, duration) {
        if (!audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (freq > 600 && audioBuffers['go']) {
                playSoundEffect('go', 0.9);
                return;
            } else if (audioBuffers['beep']) {
                playSoundEffect('beep', 0.85);
                return;
            }
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0.25, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(g); g.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + duration);
        } catch(e) {}
    }

    // ─── TOUCH INPUT ─────────────────────────────────────────────────────────────
    function setupInputListeners() {
        bindTouchBtn('btn-steer-left',  v => inputs.steerLeft  = v);
        bindTouchBtn('btn-steer-right', v => inputs.steerRight = v);
        bindTouchBtn('btn-gas',         v => inputs.throttle   = v);
        bindTouchBtn('btn-brake',       v => inputs.brake      = v);
        bindTouchBtn('btn-nitro',       v => inputs.nitro      = v);

        const camBtn = document.getElementById('btn-cam');
        if (camBtn) camBtn.addEventListener('click', () => cameraModeIndex = (cameraModeIndex + 1) % 3);

        window.addEventListener('keydown', e => {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            if (e.key==='ArrowLeft'||e.key==='a')  inputs.steerLeft  = true;
            if (e.key==='ArrowRight'||e.key==='d') inputs.steerRight = true;
            if (e.key==='ArrowUp'||e.key==='w')    inputs.throttle   = true;
            if (e.key==='ArrowDown'||e.key==='s')  inputs.brake      = true;
            if (e.key==='Shift')                   inputs.nitro      = true;
            if (e.key==='c') cameraModeIndex = (cameraModeIndex + 1) % 3;
        });

        window.addEventListener('keyup', e => {
            if (e.key==='ArrowLeft'||e.key==='a')  inputs.steerLeft  = false;
            if (e.key==='ArrowRight'||e.key==='d') inputs.steerRight = false;
            if (e.key==='ArrowUp'||e.key==='w')    inputs.throttle   = false;
            if (e.key==='ArrowDown'||e.key==='s')  inputs.brake      = false;
            if (e.key==='Shift')                   inputs.nitro      = false;
        });
    }

    function bindTouchBtn(id, cb) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const on = e => {
            e.preventDefault();
            if (audioCtx?.state === 'suspended') audioCtx.resume();
            cb(true);
        };
        const off = e => { e.preventDefault(); cb(false); };
        btn.addEventListener('touchstart',  on,  { passive: false });
        btn.addEventListener('touchend',    off, { passive: false });
        btn.addEventListener('touchcancel', off, { passive: false });
        btn.addEventListener('mousedown', on);
        btn.addEventListener('mouseup',   off);
        btn.addEventListener('mouseleave',off);
    }

    // ─── MENU UI & NAVIGATION ────────────────────────────────────────────────────
    function addTapListener(idOrEl, handler) {
        const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
        if (!el) return;
        let lastTime = 0;
        const trigger = function(e) {
            const now = performance.now();
            if (now - lastTime < 280) return;
            lastTime = now;
            if (audioCtx && audioCtx.state === 'suspended') {
                try { audioCtx.resume(); } catch(err){}
            }
            handler(e);
        };
        el.onclick = trigger;
        el.addEventListener('touchend', trigger, { passive: true });
    }

    function setupMenuUI() {
        const viewMode   = document.getElementById('view-mode-select');
        const viewTrack  = document.getElementById('view-track-select');
        const viewLan    = document.getElementById('view-lan');
        const viewOnline = document.getElementById('view-online');
        const viewLobby  = document.getElementById('view-lobby');

        let localIp = '192.168.1.100';
        if (window.AndroidNative?.getLocalIpAddress) localIp = window.AndroidNative.getLocalIpAddress();
        const ipEl = document.getElementById('lan-my-ip');
        if (ipEl) ipEl.textContent = localIp;

        // Instant Quick Race - 1-tap start
        addTapListener('btn-quick-race', () => {
            startSoloPractice();
        });

        // Track & Car selector
        addTapListener('btn-select-track', () => {
            pendingMode = 'SOLO';
            showView(viewMode, viewTrack);
        });

        // Multiplayer modes
        addTapListener('btn-select-lan',    () => { pendingMode = 'LAN';    showView(viewMode, viewLan); });
        addTapListener('btn-select-online', () => { pendingMode = 'ONLINE'; showView(viewMode, viewOnline); });

        // Track Card Click
        document.querySelectorAll('.track-card').forEach(card => {
            addTapListener(card, () => {
                document.querySelectorAll('.track-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                selectedTrackId = card.dataset.track;
            });
        });

        // Launch race directly from track select
        addTapListener('btn-track-confirm', () => {
            buildTrackEnvironment(selectedTrackId);
            initCarsForLobby(4);
            launchRace();
        });

        // Top & Bottom Back Buttons (Track Select)
        addTapListener('btn-track-back',     () => showView(viewTrack, viewMode));
        addTapListener('btn-track-back-top', () => showView(viewTrack, viewMode));

        // Top & Bottom Back Buttons (LAN)
        addTapListener('btn-lan-back',     () => showView(viewLan, viewMode));
        addTapListener('btn-lan-back-top', () => showView(viewLan, viewMode));

        // Top & Bottom Back Buttons (Online)
        addTapListener('btn-online-back',     () => showView(viewOnline, viewMode));
        addTapListener('btn-online-back-top', () => showView(viewOnline, viewMode));

        // Top & Bottom Leave Buttons (Lobby)
        addTapListener('btn-leave-lobby',     () => showView(viewLobby, viewMode));
        addTapListener('btn-lobby-back-top',  () => showView(viewLobby, viewMode));

        addTapListener('btn-lan-host', () => {
            netMode = 'LAN'; isHost = true; myPlayerIndex = 0;
            const code = 'LAN-' + (localIp ? localIp.replace(/[^0-9]/g, '').slice(-4) : '100');
            setupHostPeer(code, 'LOCAL WI-FI HOST');
        });

        addTapListener('btn-lan-join', () => {
            const hostIp = document.getElementById('lan-ip-input').value.trim();
            if (!hostIp) return alert('Please enter Host IP!');
            netMode = 'LAN'; isHost = false;
            const code = 'LAN-' + hostIp.replace(/[^0-9]/g, '').slice(-4);
            setupClientPeer(code);
        });

        addTapListener('btn-online-host', () => {
            netMode = 'ONLINE'; isHost = true; myPlayerIndex = 0;
            setupHostPeer('RACE' + Math.floor(100 + Math.random() * 900), 'ONLINE HOST');
        });

        addTapListener('btn-online-join', () => {
            const code = document.getElementById('online-code-input').value.trim().toUpperCase();
            if (!code) return alert('Please enter room code!');
            netMode = 'ONLINE'; isHost = false;
            setupClientPeer(code);
        });

        document.querySelectorAll('.color-btn').forEach(btn => {
            addTapListener(btn, () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const ci = parseInt(btn.dataset.color);
                if (localPlayerCar) {
                    localPlayerCar.bodyMesh.material.color.setHex(CAR_THEMES[ci].base);
                }
            });
        });

        addTapListener('btn-start-race', () => {
            if (isHost) broadcastPacket({ type: 'START_RACE' });
            launchRace();
        });

        addTapListener('btn-client-solo', () => {
            launchRace();
        });

        addTapListener('btn-leave-lobby',     () => location.reload());
        addTapListener('btn-finish-restart', () => location.reload());
        addTapListener('btn-finish-lobby',   () => location.reload());
    }

    function showView(hideEl, showEl) {
        if (hideEl) hideEl.classList.add('hidden');
        if (showEl) showEl.classList.remove('hidden');
    }

    // Android Physical & Gesture Back Handler
    window.handleAndroidBack = function() {
        const viewTrack  = document.getElementById('view-track-select');
        const viewLan    = document.getElementById('view-lan');
        const viewOnline = document.getElementById('view-online');
        const viewLobby  = document.getElementById('view-lobby');
        const viewMode   = document.getElementById('view-mode-select');

        if (viewTrack && !viewTrack.classList.contains('hidden')) {
            showView(viewTrack, viewMode);
        } else if (viewLan && !viewLan.classList.contains('hidden')) {
            showView(viewLan, viewMode);
        } else if (viewOnline && !viewOnline.classList.contains('hidden')) {
            showView(viewOnline, viewMode);
        } else if (viewLobby && !viewLobby.classList.contains('hidden')) {
            showView(viewLobby, viewMode);
        } else if (window.AndroidNative?.exitApp) {
            window.AndroidNative.exitApp();
        }
    };

    function setupHostPeer(roomCode, modeBadge) {
        document.getElementById('view-lan').classList.add('hidden');
        document.getElementById('view-online').classList.add('hidden');
        document.getElementById('view-lobby').classList.remove('hidden');
        document.getElementById('room-mode-badge').textContent = modeBadge;
        document.getElementById('room-code-display').textContent = 'ROOM: ' + roomCode;

        const startBtn = document.getElementById('btn-start-race');
        if (startBtn) startBtn.classList.remove('hidden');
        const soloBtn = document.getElementById('btn-client-solo');
        if (soloBtn) soloBtn.classList.add('hidden');

        const hint = document.getElementById('lobby-status-hint');
        if (hint) {
            hint.textContent = 'Room ready! Click START RACE when ready.';
            hint.classList.remove('hidden');
        }

        initCarsForLobby(4);
        renderLobbySlots();

        if (window.Peer) {
            try {
                peerInstance = new Peer(roomCode);
                peerInstance.on('error', err => console.warn('Peer host warning:', err));
                peerInstance.on('connection', conn => {
                    netConnections.push(conn);
                    conn.on('data', d => handleIncomingData(d, conn));
                    conn.on('open', () => {
                        renderLobbySlots();
                        broadcastPacket({ type: 'LOBBY_UPDATE', count: netConnections.length + 1 });
                    });
                });
            } catch(e) {
                console.warn('Peer error:', e);
            }
        }
    }

    function setupClientPeer(roomCode) {
        document.getElementById('view-lan').classList.add('hidden');
        document.getElementById('view-online').classList.add('hidden');
        document.getElementById('view-lobby').classList.remove('hidden');
        document.getElementById('room-mode-badge').textContent = 'CLIENT';
        document.getElementById('room-code-display').textContent = 'CONNECTED: ' + roomCode;

        const startBtn = document.getElementById('btn-start-race');
        if (startBtn) startBtn.classList.add('hidden');
        const soloBtn = document.getElementById('btn-client-solo');
        if (soloBtn) soloBtn.classList.remove('hidden');

        const hint = document.getElementById('lobby-status-hint');
        if (hint) {
            hint.textContent = 'Connected. Waiting for Host to start (or tap START WITH AI RIVALS)';
            hint.classList.remove('hidden');
        }

        initCarsForLobby(4);
        renderLobbySlots();

        if (window.Peer) {
            try {
                peerInstance = new Peer();
                peerInstance.on('error', err => console.warn('Peer client warning:', err));
                peerInstance.on('open', () => {
                    hostConnection = peerInstance.connect(roomCode);
                    hostConnection.on('error', err => console.warn('Conn warning:', err));
                    hostConnection.on('data', d => handleIncomingData(d, hostConnection));
                    hostConnection.on('open', () => {
                        initCarsForLobby(4);
                        renderLobbySlots();
                    });
                });
            } catch(e) {
                console.warn('Peer error:', e);
            }
        }
    }

    function broadcastPacket(data) {
        netConnections.forEach(c => {
            try { if (c.open) c.send(data); } catch(e){}
        });
    }

    function handleIncomingData(data, sender) {
        if (data.type === 'START_RACE') {
            launchRace();
        } else if (data.type === 'CAR_SYNC') {
            const rc = cars[data.playerIndex];
            if (rc && rc !== localPlayerCar) {
                rc.group.position.set(data.x, data.y, data.z);
                rc.group.rotation.y = data.rotY;
                rc.speed = data.speed;
                rc.steerAngle = data.steerAngle;
            }
        }
    }

    function updateRemoteSync(now) {
        if (raceState !== 'RACING' || !localPlayerCar) return;
        if (now % 34 < 17) {
            const pkt = {
                type: 'CAR_SYNC',
                playerIndex: myPlayerIndex,
                x: localPlayerCar.group.position.x,
                y: localPlayerCar.group.position.y,
                z: localPlayerCar.group.position.z,
                rotY: localPlayerCar.group.rotation.y,
                speed: localPlayerCar.speed,
                steerAngle: localPlayerCar.steerAngle
            };
            if (isHost) broadcastPacket(pkt);
            else if (hostConnection?.open) {
                try { hostConnection.send(pkt); } catch(e){}
            }
        }
    }

    function initCarsForLobby(numCars) {
        cars.forEach(c => { if (c) scene.remove(c.group); });
        cars.length = 0;
        for (let i = 0; i < numCars; i++) {
            cars.push(createCar(i));
        }
        localPlayerCar = cars[myPlayerIndex];
    }

    function renderLobbySlots() {
        const container = document.getElementById('player-slots-list');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < MAX_PLAYERS; i++) {
            const isOccupied = i <= (isHost ? netConnections.length : 1);
            const theme = CAR_THEMES[i % CAR_THEMES.length];
            const slot = document.createElement('div');
            slot.className = 'slot-item';
            slot.innerHTML = `<div style="display:flex;align-items:center;">
                <div class="slot-color-dot" style="background:${theme.stripe}"></div>
                <strong>Slot ${i+1}: ${isOccupied ? (i === myPlayerIndex ? 'You (' + theme.name + ')' : 'Racer ' + (i+1) + ' (' + theme.name + ')') : 'AI Rival (' + theme.name + ')'}</strong>
            </div>
            <span style="font-size:12px;color:${isOccupied ? '#10b981' : '#94a3b8'}">${isOccupied ? 'READY' : 'AI READY'}</span>`;
            container.appendChild(slot);
        }
    }

    // ─── RACE LAUNCH & COUNTDOWN ─────────────────────────────────────────────────
    function startSoloPractice() {
        netMode = 'SOLO'; isHost = true; myPlayerIndex = 0;
        if (!currentTrack) buildTrackEnvironment(selectedTrackId);
        initCarsForLobby(4);
        launchRace();
    }

    function launchRace() {
        if (!currentTrack) buildTrackEnvironment(selectedTrackId);
        if (cars.length === 0) initCarsForLobby(4);

        // Hide menus, reveal HUD & touch controls
        const menuScreen = document.getElementById('menu-screen');
        if (menuScreen) menuScreen.classList.add('hidden');

        const hudTop = document.getElementById('hud-top');
        if (hudTop) hudTop.classList.remove('hidden');

        const speedometer = document.getElementById('hud-speedometer');
        if (speedometer) speedometer.classList.remove('hidden');

        const touchControls = document.getElementById('touch-controls');
        if (touchControls) touchControls.classList.remove('hidden');

        // Start Countdown
        raceState = 'COUNTDOWN';
        countdownRemaining = 3;
        const banner = document.getElementById('countdown-banner');
        const text   = document.getElementById('countdown-text');
        if (banner) banner.classList.remove('hidden');
        if (text)   { text.textContent = '3'; text.style.color = '#FFCC00'; }
        playBeep(440, 0.25);

        const timer = setInterval(() => {
            countdownRemaining--;
            if (countdownRemaining > 0) {
                if (text) text.textContent = countdownRemaining;
                playBeep(440, 0.25);
            } else if (countdownRemaining === 0) {
                if (text) { text.textContent = 'GO!'; text.style.color = '#00FF66'; }
                playBeep(880, 0.5);
                raceState = 'RACING';
                startEngineLoops();
                raceStartTime = currentLapTime = performance.now();
            } else {
                if (banner) banner.classList.add('hidden');
                clearInterval(timer);
            }
        }, 1000);
    }

    function triggerRaceFinish(rank) {
        raceState = 'FINISHED';
        if (localPlayerCar) localPlayerCar.speed = 0;
        if (window.AndroidNative?.vibrate) window.AndroidNative.vibrate(150);

        const screen = document.getElementById('finish-screen');
        if (screen) screen.classList.remove('hidden');

        const medals = ['🥇 1ST PLACE! (BLACKLIST CHAMPION)', '🥈 2ND PLACE!', '🥉 3RD PLACE!', '4TH PLACE'];
        const rankEl = document.getElementById('podium-rank-text');
        if (rankEl) rankEl.textContent = medals[rank - 1] || 'FINISHED!';

        const totalSec = (performance.now() - raceStartTime) / 1000;
        const mins = Math.floor(totalSec / 60);
        const secs = (totalSec % 60).toFixed(2);
        const tEl = document.getElementById('stat-total-time');
        if (tEl) tEl.textContent = `${mins}:${secs.padStart(5, '0')}`;

        if (bestLapTime < 999) {
            const bm = Math.floor(bestLapTime / 60);
            const bs = (bestLapTime % 60).toFixed(2);
            const lEl = document.getElementById('stat-best-lap');
            if (lEl) lEl.textContent = `${bm}:${bs.padStart(5, '0')}`;
        }

        const spEl = document.getElementById('stat-top-speed');
        if (spEl) spEl.textContent = `${topSpeedReached} KM/H`;
    }

})();
