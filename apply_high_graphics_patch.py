import re

with open("android-build/src/main/assets/game/game.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update CAR_THEMES
old_themes = """    // NFS Most Wanted Tuned Colors
    const CAR_THEMES = [
        { name: 'M3 GTR Hero', base: 0xD8DDE6, stripe: '#0055D4', dark: 0x111620, rim: 0x222228, brake: 0xCC1100 },
        { name: 'Blacklist Razor', base: 0x101216, stripe: '#CC1122', dark: 0x050608, rim: 0xD4A017, brake: 0xD4A017 },
        { name: 'Sunburst Tuner', base: 0xFF5500, stripe: '#111118', dark: 0x1A1008, rim: 0xEEEEEE, brake: 0x0088FF },
        { name: 'Toxic Hyper', base: 0x77DD00, stripe: '#002244', dark: 0x0A1408, rim: 0x1A1A1A, brake: 0xFFDD00 }
    ];

    const PLAYER_NUMBER_COLORS = ['#00FF66', '#FF3322', '#FFCC00', '#00DDFF'];"""

new_themes = """    // Ultra High-Graphics NFS Tuned Cars (Matching Reference Aesthetics)
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
    let engineIdleAudioNode = null;"""

assert old_themes in code, "Could not find old_themes in game.js"
code = code.replace(old_themes, new_themes, 1)

# 2. Update buildRockportEnv
old_rockport = """    // ─── 1. ROCKPORT AUTUMN HIGHWAY (CLASSIC NFS:MW AESTHETIC) ────────────────────
    function buildRockportEnv() {
        // Multi-layered golden autumn sky dome
        const skyBands = [
            { y: 240, c: 0x4A1E08 },
            { y: 170, c: 0x9E4410 },
            { y: 110, c: 0xD87818 },
            { y: 65,  c: 0xFFA830 },
            { y: 32,  c: 0xFFD466 }
        ];
        skyBands.forEach(b => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(800, 800),
                new THREE.MeshBasicMaterial({ color: b.c, side: THREE.BackSide, depthWrite: false }));
            m.position.set(0, b.y, 50);
            m.rotation.x = Math.PI / 2;
            scene.add(m);
        });

        // Blazing autumn sun disc + halo
        const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(18, 32),
            new THREE.MeshBasicMaterial({ color: 0xFFF5CC }));
        sunDisc.position.set(90, 62, 510);
        scene.add(sunDisc);

        const halo = new THREE.Mesh(new THREE.CircleGeometry(42, 32),
            new THREE.MeshBasicMaterial({ color: 0xFFA020, transparent: true, opacity: 0.38, depthWrite: false }));
        halo.position.set(90, 62, 509);
        scene.add(halo);"""

new_rockport = """    // ─── 1. ROCKPORT AUTUMN HIGHWAY (CLASSIC NFS:MW AESTHETIC) ────────────────────
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
        });"""

assert old_rockport in code, "Could not find old_rockport in game.js"
code = code.replace(old_rockport, new_rockport, 1)

# Add buildWindTurbine function helper
wind_func = """    function buildWindTurbine(x, y, z) {
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

"""
code = code.replace("    function buildAutumnTree", wind_func + "    function buildAutumnTree", 1)

# 3. Update buildWetAsphaltRoad to use real 2K PBR textures
old_road = """        // Procedural wet asphalt texture
        const roadTex = createAsphaltTexture();
        const roadMat = new THREE.MeshStandardMaterial({
            map: roadTex,
            roughness: 0.35,
            metalness: 0.65,
            envMap: envTexture
        });

        const road = new THREE.Mesh(geo, roadMat);
        road.receiveShadow = true;
        scene.add(road);

        buildRoadCenterLines();"""

new_road = """        // High-Resolution 2K PBR Wet Asphalt
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
        scene.add(road);"""

assert old_road in code, "Could not find old_road in game.js"
code = code.replace(old_road, new_road, 1)

# 4. Update buildCheckerboardStartLine to use checkered_line.png
old_start = """    function buildCheckerboardStartLine() {
        const tileSize = 2.5, cols = 7, rows = 3;
        const colWhite = new THREE.MeshBasicMaterial({ color: 0xEEEEEE });
        const colBlack = new THREE.MeshBasicMaterial({ color: 0x111116 });
        const tileGeo = new THREE.PlaneGeometry(tileSize, tileSize);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tile = new THREE.Mesh(tileGeo, (r + c) % 2 === 0 ? colWhite : colBlack);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set((c - cols / 2 + 0.5) * tileSize, 0.035, (r - rows / 2 + 0.5) * tileSize - 5);
                scene.add(tile);
            }
        }
    }"""

new_start = """    function buildCheckerboardStartLine() {
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
    }"""

assert old_start in code, "Could not find old_start in game.js"
code = code.replace(old_start, new_start, 1)

# 5. Update buildBarriers to continuous glowing neon chevron barriers
old_barriers = """    function buildBarriers(trackId) {
        const roadWidth = 18;
        const barrierMat = new THREE.MeshStandardMaterial({
            color: 0x2A2E36,
            roughness: 0.6,
            metalness: 0.4
        });
        const yellowHazardMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });

        for (let i = 0; i < trackWaypoints.length; i += 2) {
            const p = trackWaypoints[i];
            const p2 = trackWaypoints[(i + 1) % trackWaypoints.length];
            const fwd = new THREE.Vector3().subVectors(p2, p).normalize();
            const right = new THREE.Vector3(-fwd.z, 0, fwd.x).normalize();
            const angle = Math.atan2(fwd.x, fwd.z);

            [-1, 1].forEach(side => {
                const pos = p.clone().addScaledVector(right, side * (roadWidth / 2 + 0.45));
                const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 4.4), barrierMat);
                wall.position.set(pos.x, p.y + 0.6, pos.z);
                wall.rotation.y = angle;
                scene.add(wall);

                // Alternating yellow hazard reflective stripe
                if (i % 4 === 0) {
                    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 4.2), yellowHazardMat);
                    strip.position.set(pos.x, p.y + 0.85, pos.z);
                    strip.rotation.y = angle;
                    scene.add(strip);
                }
            });
        }
    }"""

new_barriers = """    function buildBarriers(trackId) {
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
    }"""

assert old_barriers in code, "Could not find old_barriers in game.js"
code = code.replace(old_barriers, new_barriers, 1)

# 6. Update createCar: apply livery texture, rotor texture, and grid positioning
old_create_car_head = """        // High-gloss clearcoat metallic paint reflecting the golden HDR environment
        const bodyMat = new THREE.MeshStandardMaterial({
            color: theme.base,
            metalness: 0.88,
            roughness: 0.15,
            envMap: envTexture,
            envMapIntensity: 1.4
        });

        const darkCarbonMat = new THREE.MeshStandardMaterial({
            color: theme.dark,
            metalness: 0.85,
            roughness: 0.25,
            envMap: envTexture
        });"""

new_create_car_head = """        // High-Definition Livery and Carbon Fiber Materials
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
        });"""

assert old_create_car_head in code, "Could not find old_create_car_head in game.js"
code = code.replace(old_create_car_head, new_create_car_head, 1)

# Update brake rotor in createCar
old_rotor = """            // Cross-drilled brake rotor (heats up and glows orange-red during braking)
            const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 12), brakeGlowMat.clone());
            rotor.rotation.z = Math.PI / 2;
            wg.add(rotor);
            brakeCalipers.push(rotor);"""

new_rotor = """            // High-Res Brembo Cross-Drilled Brake Rotor
            const rotorTex = textureLoader.load('textures/brake_rotor.png');
            const rotorMat = new THREE.MeshStandardMaterial({
                map: rotorTex,
                metalness: 0.85,
                roughness: 0.25
            });
            const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.46, 16), rotorMat);
            rotor.rotation.z = Math.PI / 2;
            wg.add(rotor);
            brakeCalipers.push(rotor);"""

assert old_rotor in code, "Could not find old_rotor in game.js"
code = code.replace(old_rotor, new_rotor, 1)

# Update grid positions and number sprite in createCar
old_grid = """        // Grid Position
        const gridX = (playerIndex % 2 === 0 ? -3.5 : 3.5);
        const gridZ = -Math.floor(playerIndex / 2) * 10 - 8;
        carGroup.position.set(gridX, 0, gridZ);
        scene.add(carGroup);

        // Player Floating Number Sprite
        const numberSprite = createPlayerNumberSprite(playerIndex + 1, PLAYER_NUMBER_COLORS[playerIndex]);
        numberSprite.position.set(0, 3.2, 0);
        numberSprite.scale.set(3.5, 1.8, 1);
        carGroup.add(numberSprite);"""

new_grid = """        // Grid Placement: Player car at start line, rivals lined up ahead exactly like reference image
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
        carGroup.add(numberSprite);"""

assert old_grid in code, "Could not find old_grid in game.js"
code = code.replace(old_grid, new_grid, 1)

# 7. Update createPlayerNumberSprite
old_sprite = """    function createPlayerNumberSprite(number, colorStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 64);
        ctx.fillStyle = 'rgba(10, 14, 24, 0.75)';
        ctx.beginPath();
        ctx.roundRect(8, 4, 112, 56, 12);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = colorStr;
        ctx.stroke();

        ctx.fillStyle = colorStr;
        ctx.font = 'bold 44px Impact, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = colorStr; ctx.shadowBlur = 12;
        ctx.fillText(String(number), 64, 34);

        const tex = new THREE.CanvasTexture(canvas);
        return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    }"""

new_sprite = """    function createPlayerNumberSprite(number, colorStr) {
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
    }"""

assert old_sprite in code, "Could not find old_sprite in game.js"
code = code.replace(old_sprite, new_sprite, 1)

# 8. Update animate to rotate wind turbines
old_anim_call = "updateAnims(dt);"
new_anim_call = """updateAnims(dt);
        windTurbines.forEach(wt => { wt.rotation.z += 0.018; });"""
assert old_anim_call in code, "Could not find updateAnims(dt); in game.js"
code = code.replace(old_anim_call, new_anim_call, 1)

# 9. Update setupAudio and updateEngineAudio
old_audio = """    // ─── AUDIO ENGINE (SYNTH ENGINE WITH NITRO BURST) ─────────────────────────────
    function setupAudio() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AC();

            // Main tuned engine sound
            engineOsc = audioCtx.createOscillator();
            engineOsc.type = 'sawtooth';
            engineOsc.frequency.setValueAtTime(55, audioCtx.currentTime);

            engineGain = audioCtx.createGain();
            engineGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            engineOsc.connect(engineGain);
            engineGain.connect(audioCtx.destination);
            engineOsc.start();

            // Tire squeal noise buffer
            const bufSz = audioCtx.sampleRate;
            const nBuf = audioCtx.createBuffer(1, bufSz, audioCtx.sampleRate);
            const data = nBuf.getChannelData(0);
            for (let i = 0; i < bufSz; i++) data[i] = Math.random() * 2 - 1;

            const nSrc = audioCtx.createBufferSource();
            nSrc.buffer = nBuf;
            nSrc.loop = true;

            const bp = audioCtx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 1400;

            tireGain = audioCtx.createGain();
            tireGain.gain.setValueAtTime(0, audioCtx.currentTime);
            nSrc.connect(bp); bp.connect(tireGain); tireGain.connect(audioCtx.destination);
            nSrc.start();
        } catch(e) {}
    }

    function updateEngineAudio(kmh, isNitro) {
        if (!engineOsc || !audioCtx) return;
        try {
            const baseFreq = 60 + (kmh / 240) * 260 + (isNitro ? 45 : 0);
            engineOsc.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.05);
        } catch(e){}
    }

    function playBeep(freq, duration) {
        if (!audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0.25, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(g); g.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + duration);
        } catch(e) {}
    }"""

new_audio = """    // ─── HIGH-FIDELITY STEREO RACING AUDIO SYSTEM ─────────────────────────────
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
    }"""

assert old_audio in code, "Could not find old_audio in game.js"
code = code.replace(old_audio, new_audio, 1)

# Hook startEngineLoops into launchRace
old_launch = "raceState = 'RACING';"
new_launch = """raceState = 'RACING';
                startEngineLoops();"""
assert old_launch in code, "Could not find raceState = 'RACING' in game.js"
code = code.replace(old_launch, new_launch, 1)

# Hook shift and nitro sound effects
old_shift = "document.getElementById('gear-value').textContent = gear;"
new_shift = """document.getElementById('gear-value').textContent = gear;
                playSoundEffect('shift', 0.5);"""
code = code.replace(old_shift, new_shift, 1)

with open("android-build/src/main/assets/game/game.js", "w", encoding="utf-8") as f:
    f.write(code)

print("SUCCESS: High Graphics Patch applied to game.js!")
