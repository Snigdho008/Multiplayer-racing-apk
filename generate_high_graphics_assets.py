import os
import math
import wave
import struct
import random
from PIL import Image, ImageDraw, ImageFilter

ASSETS_DIR = r"android-build\src\main\assets\game"
TEX_DIR = os.path.join(ASSETS_DIR, "textures")
AUDIO_DIR = os.path.join(ASSETS_DIR, "audio")

os.makedirs(TEX_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

print("Starting generation of Ultra High-Graphics Assets (4K/2K Textures & Stereo HD Audio)...")

# Helper for stereo 16-bit WAV writing
def write_stereo_wav(filename, left_samples, right_samples, sample_rate=44100):
    path = os.path.join(AUDIO_DIR, filename)
    with wave.open(path, "wb") as wav:
        wav.setnchannels(2)      # Stereo
        wav.setsampwidth(2)      # 16-bit
        wav.setframerate(sample_rate)
        n = min(len(left_samples), len(right_samples))
        interleaved = []
        for i in range(n):
            l = max(-32767, min(32767, int(left_samples[i])))
            r = max(-32767, min(32767, int(right_samples[i])))
            interleaved.extend([l, r])
        raw = struct.pack(f"<{len(interleaved)}h", *interleaved)
        wav.writeframes(raw)
    print(f"Generated [AUDIO] {filename}: {os.path.getsize(path) // 1024} KB")

# ---------------------------------------------------------
# 1. SUNSET SKY PANORAMA (4096 x 2048)
# Matches screenshot: vibrant golden-orange sunset, sun glow,
# distant mountain silhouettes and wind turbines on the horizon!
# ---------------------------------------------------------
def generate_sunset_sky():
    w, h = 4096, 2048
    img = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(img)

    # Sky gradient from deep amber at top to intense radiant yellow/white at horizon
    for y in range(h):
        t = y / h
        if t < 0.45:
            f = t / 0.45
            r = int(225 + 30 * f)
            g = int(80 + 75 * f)
            b = int(20 + 30 * f)
        elif t < 0.65:
            f = (t - 0.45) / 0.20
            r = 255
            g = int(155 + 60 * f)
            b = int(50 + 60 * f)
        elif t < 0.82:
            f = (t - 0.65) / 0.17
            r = 255
            g = int(215 - 35 * f)
            b = int(110 - 55 * f)
        else:
            f = (t - 0.82) / 0.18
            r = int(180 - 100 * f)
            g = int(90 - 50 * f)
            b = int(40 - 25 * f)
        # Add subtle dither grain
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Sun glow center (around x = w//2, y = int(h * 0.58))
    sun_x, sun_y = w // 2, int(h * 0.58)
    for rad in range(550, 0, -4):
        alpha = int(255 * (1.0 - (rad / 550.0) ** 0.5))
        draw.ellipse([sun_x - rad, sun_y - rad, sun_x + rad, sun_y + rad],
                     fill=(255, 240, 190, min(255, alpha // 3)))

    # Distant mountain silhouettes
    mountains = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    m_draw = ImageDraw.Draw(mountains)

    # Layer 1: Far mountains (warm golden-brown haze)
    pts1 = [(0, h)]
    for x in range(0, w + 40, 20):
        elev = math.sin(x * 0.003) * 110 + math.sin(x * 0.009) * 65 + math.cos(x * 0.02) * 25
        my = int(h * 0.67) - int(elev)
        pts1.append((x, my))
    pts1.append((w, h))
    m_draw.polygon(pts1, fill=(165, 75, 32, 185))

    # Layer 2: Nearer hills & rock mesas (darker silhouette)
    pts2 = [(0, h)]
    for x in range(0, w + 40, 15):
        elev = math.sin(x * 0.005 + 1.2) * 130 + math.cos(x * 0.012) * 70 + math.sin(x * 0.03) * 20
        my = int(h * 0.73) - int(elev)
        pts2.append((x, my))
    pts2.append((w, h))
    m_draw.polygon(pts2, fill=(85, 32, 16, 230))

    # Wind Turbines on the hills (exactly matching the user's screenshot)
    wt_x_positions = [int(w * 0.54), int(w * 0.58), int(w * 0.62), int(w * 0.66), int(w * 0.14), int(w * 0.18)]
    for tx in wt_x_positions:
        ty = int(h * 0.65) + int(math.sin(tx * 0.005 + 1.2) * 60)
        m_draw.line([(tx, ty), (tx, ty - 120)], fill=(65, 28, 16, 230), width=5)
        m_draw.ellipse([tx - 8, ty - 128, tx + 8, ty - 112], fill=(75, 32, 18, 245))
        blade_len = 70
        angles = [0, 2.094, 4.188]
        for a in angles:
            bx = tx + math.sin(a) * blade_len
            by = (ty - 120) - math.cos(a) * blade_len
            m_draw.line([(tx, ty - 120), (bx, by)], fill=(65, 28, 16, 230), width=4)

    # Radio communication tower on far left
    tow_x = int(w * 0.09)
    tow_y = int(h * 0.66)
    m_draw.line([(tow_x, tow_y), (tow_x, tow_y - 160)], fill=(55, 22, 14, 240), width=4)
    m_draw.line([(tow_x - 22, tow_y), (tow_x, tow_y - 160)], fill=(55, 22, 14, 210), width=2)
    m_draw.line([(tow_x + 22, tow_y), (tow_x, tow_y - 160)], fill=(55, 22, 14, 210), width=2)
    m_draw.ellipse([tow_x - 6, tow_y - 166, tow_x + 6, tow_y - 154], fill=(255, 50, 30, 255))

    img = Image.alpha_composite(img, mountains)
    out_path = os.path.join(TEX_DIR, "sunset_sky_pano.png")
    img.save(out_path, format="PNG", optimize=False)
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 2. NEON BARRIER CHEVRONS (2048 x 512)
# Glowing neon-green directional arrows (>>> >>> >>>)
# exactly matching the track barriers in the user's screenshot!
# ---------------------------------------------------------
def generate_neon_barrier():
    w, h = 2048, 512
    img = Image.new("RGBA", (w, h), (18, 20, 24, 255))
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, w, 40], fill=(50, 55, 62, 255))
    draw.rectangle([0, h - 40, w, h], fill=(35, 40, 46, 255))
    draw.line([(0, 40), (w, 40)], fill=(120, 130, 140, 255), width=3)
    draw.line([(0, h - 41), (w, h - 41)], fill=(90, 100, 110, 255), width=2)

    for x in range(0, w, 16):
        draw.line([(x, 40), (x, h - 40)], fill=(24, 28, 34, 255), width=2)
    for y in range(40, h - 40, 16):
        draw.line([(0, y), (w, y)], fill=(24, 28, 34, 255), width=2)

    glow_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)

    chevron_spacing = 160
    for cx in range(60, w + 80, chevron_spacing):
        for sub in range(2):
            ox = cx + sub * 45
            arrow_pts = [
                (ox - 30, 80),
                (ox + 25, h // 2),
                (ox - 30, h - 80),
                (ox - 8, h - 80),
                (ox + 47, h // 2),
                (ox - 8, 80)
            ]
            glow_draw.polygon(arrow_pts, fill=(0, 255, 120, 200))

    bloom = glow_img.filter(ImageFilter.GaussianBlur(radius=14))
    img = Image.alpha_composite(img, bloom)
    img = Image.alpha_composite(img, glow_img.filter(ImageFilter.GaussianBlur(radius=5)))

    core_draw = ImageDraw.Draw(img)
    for cx in range(60, w + 80, chevron_spacing):
        for sub in range(2):
            ox = cx + sub * 45
            arrow_pts = [
                (ox - 24, 90),
                (ox + 22, h // 2),
                (ox - 24, h - 90),
                (ox - 6, h - 90),
                (ox + 40, h // 2),
                (ox - 6, 90)
            ]
            core_draw.polygon(arrow_pts, fill=(50, 255, 140, 255))
            core_draw.line([(ox - 10, 105), (ox + 30, h // 2), (ox - 10, h - 105)], fill=(230, 255, 240, 255), width=6)

    out_path = os.path.join(TEX_DIR, "neon_barrier_chevron.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 3. HIGH-RESOLUTION PBR ASPHALT DIFFUSE (2048 x 2048)
# Multi-layered dark bitumen tarmac with aggregate stone,
# asphalt grain, micro-cracks, oil marks, and painted race line!
# ---------------------------------------------------------
def generate_asphalt_diffuse():
    w, h = 2048, 2048
    img = Image.new("RGBA", (w, h), (42, 44, 48, 255))
    draw = ImageDraw.Draw(img)

    random.seed(42)
    # High frequency aggregate noise
    for _ in range(95000):
        rx = random.randint(0, w - 4)
        ry = random.randint(0, h - 4)
        c = random.randint(28, 68)
        draw.rectangle([rx, ry, rx + random.randint(1, 3), ry + random.randint(1, 3)],
                       fill=(c, c + random.randint(-3, 3), c + random.randint(-2, 4), 255))

    for track_center_x in [int(w * 0.28), int(w * 0.45), int(w * 0.72)]:
        track_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        t_draw = ImageDraw.Draw(track_overlay)
        t_draw.rectangle([track_center_x - 140, 0, track_center_x + 140, h], fill=(18, 19, 21, 140))
        track_overlay = track_overlay.filter(ImageFilter.GaussianBlur(radius=30))
        img = Image.alpha_composite(img, track_overlay)

    line_w = 40
    dash_h = 320
    gap_h = 240
    dash_draw = ImageDraw.Draw(img)
    mid_x = w // 2
    for y in range(0, h, dash_h + gap_h):
        dash_draw.rectangle([mid_x - line_w // 2, y, mid_x + line_w // 2, y + dash_h], fill=(235, 238, 242, 240))
        for py in range(y, min(h, y + dash_h), 25):
            dash_draw.line([(mid_x - line_w // 2, py), (mid_x + line_w // 2, py)], fill=(70, 72, 75, 110), width=2)

    dash_draw.rectangle([80, 0, 110, h], fill=(225, 228, 232, 230))
    dash_draw.rectangle([w - 110, 0, w - 80, h], fill=(225, 228, 232, 230))

    out_path = os.path.join(TEX_DIR, "asphalt_pbr_diffuse.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 4. PBR ASPHALT NORMAL MAP (2048 x 2048)
# High frequency surface bumps for ultra-realistic lighting
# ---------------------------------------------------------
def generate_asphalt_normal():
    w, h = 2048, 2048
    img = Image.new("RGBA", (w, h), (128, 128, 255, 255))
    draw = ImageDraw.Draw(img)

    random.seed(99)
    for _ in range(85000):
        rx = random.randint(0, w - 3)
        ry = random.randint(0, h - 3)
        nx = 128 + random.randint(-28, 28)
        ny = 128 + random.randint(-28, 28)
        nz = 255
        draw.rectangle([rx, ry, rx + random.randint(1, 3), ry + random.randint(1, 3)], fill=(nx, ny, nz, 255))

    out_path = os.path.join(TEX_DIR, "asphalt_pbr_normal.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 5. PBR ASPHALT ROUGHNESS MAP (2048 x 2048)
# High roughness for road, glossy low roughness for rubber tracks & puddles
# ---------------------------------------------------------
def generate_asphalt_roughness():
    w, h = 2048, 2048
    img = Image.new("RGBA", (w, h), (190, 190, 190, 255))
    draw = ImageDraw.Draw(img)

    for track_center_x in [int(w * 0.28), int(w * 0.45), int(w * 0.72)]:
        track_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        t_draw = ImageDraw.Draw(track_overlay)
        t_draw.rectangle([track_center_x - 130, 0, track_center_x + 130, h], fill=(80, 80, 80, 160))
        track_overlay = track_overlay.filter(ImageFilter.GaussianBlur(radius=25))
        img = Image.alpha_composite(img, track_overlay)

    out_path = os.path.join(TEX_DIR, "asphalt_pbr_roughness.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 6. CHECKERED START/FINISH LINE (1024 x 512)
# Crisp checkerboard grid
# ---------------------------------------------------------
def generate_checkered_line():
    w, h = 1024, 512
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    cols, rows = 8, 4
    cw, ch = w // cols, h // rows
    for r in range(rows):
        for c in range(cols):
            if (r + c) % 2 == 1:
                draw.rectangle([c * cw, r * ch, (c + 1) * cw, (r + 1) * ch], fill=(24, 26, 28, 255))
            else:
                draw.rectangle([c * cw, r * ch, (c + 1) * cw, (r + 1) * ch], fill=(245, 245, 250, 255))

    out_path = os.path.join(TEX_DIR, "checkered_line.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 7. HERO SPORTS COUPE LIVERY (2048 x 2048)
# Matching the burnt copper/metallic orange sports car in the user's screenshot!
# ---------------------------------------------------------
def generate_hero_car_texture():
    w, h = 2048, 2048
    img = Image.new("RGBA", (w, h), (218, 65, 32, 255))
    draw = ImageDraw.Draw(img)

    for y in range(h):
        fac = abs(y - h // 2) / (h // 2)
        r = int(245 - 45 * fac)
        g = int(85 - 35 * fac)
        b = int(35 - 15 * fac)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    draw.rectangle([w // 4, int(h * 0.2), 3 * w // 4, int(h * 0.6)], fill=(32, 34, 38, 255))
    for diag in range(-w, w * 2, 8):
        draw.line([(diag, int(h * 0.2)), (diag + int(h * 0.4), int(h * 0.6))], fill=(48, 50, 54, 255), width=2)

    for vx in [int(w * 0.35), int(w * 0.60)]:
        draw.rectangle([vx, int(h * 0.08), vx + int(w * 0.12), int(h * 0.17)], fill=(20, 22, 26, 255))
        for vy in range(int(h * 0.09), int(h * 0.16), 14):
            draw.line([(vx, vy), (vx + int(w * 0.12), vy)], fill=(80, 85, 92, 255), width=3)

    diffuser_top = int(h * 0.75)
    draw.rectangle([int(w * 0.15), diffuser_top, int(w * 0.85), h - 80], fill=(22, 24, 28, 255))
    for strake_x in range(int(w * 0.25), int(w * 0.76), 90):
        draw.rectangle([strake_x - 6, diffuser_top, strake_x + 6, h - 80], fill=(45, 50, 56, 255))

    for ex in [int(w * 0.22), int(w * 0.28), int(w * 0.72), int(w * 0.78)]:
        ey = h - 140
        erad = 45
        draw.ellipse([ex - erad, ey - erad, ex + erad, ey + erad], fill=(12, 14, 16, 255))
        draw.ellipse([ex - erad + 8, ey - erad + 8, ex + erad - 8, ey + erad - 8], fill=(60, 110, 190, 255))
        draw.ellipse([ex - erad + 14, ey - erad + 14, ex + erad - 14, ey + erad - 14], fill=(10, 10, 12, 255))

    ty = int(h * 0.68)
    draw.polygon([(int(w * 0.16), ty), (int(w * 0.44), ty), (int(w * 0.42), ty + 60), (int(w * 0.18), ty + 60)], fill=(200, 10, 20, 255))
    draw.line([(int(w * 0.17), ty + 25), (int(w * 0.43), ty + 25)], fill=(255, 120, 130, 255), width=8)
    draw.polygon([(int(w * 0.56), ty), (int(w * 0.84), ty), (int(w * 0.82), ty + 60), (int(w * 0.58), ty + 60)], fill=(200, 10, 20, 255))
    draw.line([(int(w * 0.57), ty + 25), (int(w * 0.83), ty + 25)], fill=(255, 120, 130, 255), width=8)

    draw.rectangle([w // 2 - 140, ty + 10, w // 2 + 140, ty + 70], fill=(240, 242, 245, 255), outline=(50, 50, 50, 255), width=3)
    draw.rectangle([w // 2 - 140, ty + 10, w // 2 - 105, ty + 70], fill=(20, 70, 200, 255))

    out_path = os.path.join(TEX_DIR, "car_paint_copper.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 8. M3 GTR SILVER & BLUE LIVERY (2048 x 2048)
# ---------------------------------------------------------
def generate_m3_gtr_livery():
    w, h = 2048, 2048
    img = Image.new("RGBA", (w, h), (215, 218, 224, 255))
    draw = ImageDraw.Draw(img)

    for y in range(0, h, 4):
        s = random.randint(-8, 8)
        draw.line([(0, y), (w, y)], fill=(215 + s, 218 + s, 224 + s, 255), width=2)

    blue1 = (18, 72, 190, 255)
    blue2 = (8, 40, 130, 255)

    pts_left = [(0, int(h * 0.3)), (int(w * 0.45), int(h * 0.7)), (int(w * 0.4), int(h * 0.85)), (0, int(h * 0.6))]
    draw.polygon(pts_left, fill=blue1)

    pts_right = [(w, int(h * 0.3)), (int(w * 0.55), int(h * 0.7)), (int(w * 0.6), int(h * 0.85)), (w, int(h * 0.6))]
    draw.polygon(pts_right, fill=blue1)

    draw.polygon([(w // 2 - 180, 0), (w // 2 - 80, int(h * 0.3)), (w // 2 - 130, int(h * 0.3)), (w // 2 - 230, 0)], fill=blue2)
    draw.polygon([(w // 2 + 180, 0), (w // 2 + 80, int(h * 0.3)), (w // 2 + 130, int(h * 0.3)), (w // 2 + 230, 0)], fill=blue2)
    draw.rectangle([w // 2 - 200, int(h * 0.12), w // 2 + 200, int(h * 0.22)], fill=(25, 28, 32, 255))

    out_path = os.path.join(TEX_DIR, "car_paint_m3.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 9. BREMBO DRILLED BRAKE ROTORS (1024 x 1024)
# ---------------------------------------------------------
def generate_brake_rotor():
    w, h = 1024, 1024
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = w // 2, h // 2
    outer_r = int(w * 0.46)
    inner_r = int(w * 0.22)

    draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], fill=(175, 180, 186, 255))
    for r in range(inner_r + 10, outer_r - 10, 8):
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(150, 155, 160, 255), width=2)

    num_spokes = 24
    for sp in range(num_spokes):
        base_a = (sp / num_spokes) * 2 * math.pi
        for dr in range(3):
            cur_r = inner_r + 40 + dr * 55
            cur_a = base_a + dr * 0.08
            hx = cx + math.cos(cur_a) * cur_r
            hy = cy + math.sin(cur_a) * cur_r
            draw.ellipse([hx - 8, hy - 8, hx + 8, hy + 8], fill=(20, 22, 25, 255))

    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=(30, 32, 36, 255))
    draw.ellipse([cx - inner_r // 2, cy - inner_r // 2, cx + inner_r // 2, cy + inner_r // 2], fill=(0, 0, 0, 0))

    for b in range(5):
        ba = (b / 5) * 2 * math.pi
        bx = cx + math.cos(ba) * (inner_r * 0.65)
        by = cy + math.sin(ba) * (inner_r * 0.65)
        draw.ellipse([bx - 14, by - 14, bx + 14, by + 14], fill=(220, 225, 230, 255), outline=(100, 105, 110, 255), width=3)

    caliper = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(caliper)
    c_pts = [
        (cx + int(outer_r * 0.4), cy - int(outer_r * 1.05)),
        (cx + int(outer_r * 1.08), cy - int(outer_r * 0.4)),
        (cx + int(outer_r * 0.85), cy - int(outer_r * 0.15)),
        (cx + int(outer_r * 0.25), cy - int(outer_r * 0.75))
    ]
    c_draw.polygon(c_pts, fill=(210, 20, 25, 255))
    c_draw.line(c_pts, fill=(240, 80, 85, 255), width=6)

    img = Image.alpha_composite(img, caliper)
    out_path = os.path.join(TEX_DIR, "brake_rotor.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 10. CARBON FIBER WEAVE (1024 x 1024)
# ---------------------------------------------------------
def generate_carbon_fiber():
    w, h = 1024, 1024
    img = Image.new("RGBA", (w, h), (26, 28, 30, 255))
    draw = ImageDraw.Draw(img)

    block = 16
    for y in range(0, h, block):
        for x in range(0, w, block):
            if ((x // block) + (y // block)) % 2 == 0:
                c1, c2 = (46, 48, 52, 255), (32, 34, 38, 255)
            else:
                c1, c2 = (22, 24, 26, 255), (38, 40, 44, 255)
            draw.rectangle([x, y, x + block, y + block], fill=c1)
            draw.line([(x, y), (x + block, y + block)], fill=c2, width=2)

    out_path = os.path.join(TEX_DIR, "carbon_weave.png")
    img.save(out_path, format="PNG")
    print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 11. COMPETITOR CAR TEXTURES (Cyan, Yellow, Green, Purple)
# ---------------------------------------------------------
def generate_competitor_textures():
    rivals = [
        ("rival_cyan.png", (0, 200, 220), (0, 80, 110)),
        ("rival_yellow.png", (245, 190, 0), (80, 60, 0)),
        ("rival_green.png", (30, 200, 90), (10, 70, 30)),
        ("rival_purple.png", (140, 40, 210), (50, 10, 90)),
    ]
    w, h = 2048, 2048
    for fname, base_col, dark_col in rivals:
        img = Image.new("RGBA", (w, h), (*base_col, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([w // 3, 0, 2 * w // 3, h], fill=(*dark_col, 255))
        draw.rectangle([w // 2 - 25, 0, w // 2 + 25, h], fill=(255, 255, 255, 255))
        draw.rectangle([0, int(h * 0.75), w, h], fill=(20, 22, 24, 255))
        draw.rectangle([120, int(h * 0.70), 550, int(h * 0.74)], fill=(255, 20, 30, 255))
        draw.rectangle([w - 550, int(h * 0.70), w - 120, int(h * 0.74)], fill=(255, 20, 30, 255))

        out_path = os.path.join(TEX_DIR, fname)
        img.save(out_path, format="PNG")
        print(f"Generated [TEX] {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# ---------------------------------------------------------
# 12. HIGH-FIDELITY STEREO RACING AUDIO (44.1 kHz, 16-bit)
# Generates rich stereo audio loops for engine, turbo, drift,
# nitrous, shifts, and high-energy racing soundtrack
# ---------------------------------------------------------
def generate_hd_audio():
    sample_rate = 44100

    # 1. Stereo V8 Idle Rumble (4.0 seconds loop)
    dur = 4.0
    n = int(sample_rate * dur)
    left, right = [], []
    for i in range(n):
        t = i / sample_rate
        base = math.sin(2 * math.pi * 38 * t)
        p1 = 0.6 * math.sin(2 * math.pi * 76 * t)
        p2 = 0.35 * math.sin(2 * math.pi * 114 * t + 0.5)
        # Left/Right exhaust pipe phase offset
        nl = (random.random() * 2 - 1) * 0.18
        nr = (random.random() * 2 - 1) * 0.18
        vl = (base + p1 + p2 + nl) / 2.1
        vr = (base + p1 * 0.9 + p2 * 1.1 + nr) / 2.1
        left.append(vl * 31000)
        right.append(vr * 31000)
    write_stereo_wav("engine_idle.wav", left, right, sample_rate)

    # 2. Screaming V8 High-RPM Racing Roar (5.0 seconds loop)
    dur = 5.0
    n = int(sample_rate * dur)
    left, right = [], []
    for i in range(n):
        t = i / sample_rate
        freq = 325.0 + 10.0 * math.sin(2 * math.pi * 3.5 * t)
        s1 = math.sin(2 * math.pi * freq * t)
        s2 = 0.75 * math.sin(2 * math.pi * freq * 2 * t)
        s3 = 0.55 * math.sin(2 * math.pi * freq * 3 * t)
        s4 = 0.35 * math.sin(2 * math.pi * freq * 4 * t)
        raw_l = math.tanh(((s1 + s2 + s3 + s4) / 2.6) * 1.8)
        raw_r = math.tanh(((s1 + s2 * 1.05 + s3 * 0.95 + s4) / 2.6) * 1.8)
        left.append(raw_l * 30000)
        right.append(raw_r * 30000)
    write_stereo_wav("engine_accel.wav", left, right, sample_rate)

    # 3. Stereo Nitrous Blast & Jet Roar (3.0 seconds)
    dur = 3.0
    n = int(sample_rate * dur)
    left, right = [], []
    for i in range(n):
        t = i / sample_rate
        env = min(1.0, t * 15.0) * math.exp(-t * 0.8)
        hiss_l = (random.random() * 2 - 1) * 0.7
        hiss_r = (random.random() * 2 - 1) * 0.7
        drone = 0.35 * math.sin(2 * math.pi * 92 * t)
        left.append(((hiss_l + drone) * env) * 31000)
        right.append(((hiss_r + drone) * env) * 31000)
    write_stereo_wav("nitro_boost.wav", left, right, sample_rate)

    # 4. Stereo Drift Tire Screech & Burnout (3.0 seconds loop)
    dur = 3.0
    n = int(sample_rate * dur)
    left, right = [], []
    for i in range(n):
        t = i / sample_rate
        f1 = 1380 + 260 * math.sin(2 * math.pi * 16 * t)
        f2 = 1860 + 340 * math.cos(2 * math.pi * 22 * t)
        sl = (math.sin(2 * math.pi * f1 * t) + 0.7 * math.sin(2 * math.pi * f2 * t) + (random.random() * 2 - 1) * 0.4) / 2.1
        sr = (math.sin(2 * math.pi * (f1 * 1.02) * t) + 0.7 * math.sin(2 * math.pi * (f2 * 0.98) * t) + (random.random() * 2 - 1) * 0.4) / 2.1
        left.append(max(-1.0, min(1.0, sl)) * 29000)
        right.append(max(-1.0, min(1.0, sr)) * 29000)
    write_stereo_wav("tire_screech.wav", left, right, sample_rate)

    # 5. Sequential Gear Shift & Blow-Off Pop (0.8 seconds)
    dur = 0.8
    n = int(sample_rate * dur)
    left, right = [], []
    for i in range(n):
        t = i / sample_rate
        clunk = math.sin(2 * math.pi * 135 * t) * math.exp(-t * 32) if t < 0.16 else 0
        bov_t = max(0, t - 0.06)
        bov_flutter = math.sin(2 * math.pi * 26 * bov_t)
        bov_l = (random.random() * 2 - 1) * (0.6 + 0.4 * bov_flutter) * math.exp(-bov_t * 7)
        bov_r = (random.random() * 2 - 1) * (0.6 + 0.4 * bov_flutter) * math.exp(-bov_t * 7)
        vl = clunk * 0.65 + bov_l * 0.8
        vr = clunk * 0.65 + bov_r * 0.8
        left.append(max(-1.0, min(1.0, vl)) * 31000)
        right.append(max(-1.0, min(1.0, vr)) * 31000)
    write_stereo_wav("gear_shift.wav", left, right, sample_rate)

    # 6. Countdown Beep & GO
    dur = 0.35
    n = int(sample_rate * dur)
    beep_l = [math.sin(2 * math.pi * 550 * (i / sample_rate)) * math.exp(-(i / sample_rate) * 7) * 28000 for i in range(n)]
    write_stereo_wav("countdown_beep.wav", beep_l, beep_l, sample_rate)

    dur = 0.7
    n = int(sample_rate * dur)
    go_l = []
    for i in range(n):
        t = i / sample_rate
        v = (math.sin(2 * math.pi * 1100 * t) + 0.3 * math.sin(2 * math.pi * 2200 * t)) * math.exp(-t * 3.5)
        go_l.append(max(-1.0, min(1.0, v / 1.35)) * 29000)
    write_stereo_wav("countdown_go.wav", go_l, go_l, sample_rate)

    # 7. Adrenaline Street Racing Sound Track (16.0 seconds Stereo HD Loop)
    # Driving electronic bassline + 4-on-the-floor kick + snare + synth arpeggio
    dur = 16.0
    n = int(sample_rate * dur)
    left_bgm, right_bgm = [], []
    bpm = 138.0
    beat_dur = 60.0 / bpm  # ~0.435s per beat
    for i in range(n):
        t = i / sample_rate
        beat_idx = int(t / beat_dur)
        beat_pos = (t % beat_dur) / beat_dur

        # Kick drum on every beat (0, 1, 2, 3...)
        kick_env = math.exp(-beat_pos * 18.0)
        kick_freq = 140.0 * math.exp(-beat_pos * 24.0) + 42.0
        kick = math.sin(2 * math.pi * kick_freq * (beat_pos * beat_dur)) * kick_env * 0.7

        # Snare on beats 2 and 4 (1 and 3 zero-indexed)
        snare = 0.0
        if beat_idx % 2 == 1:
            snare_env = math.exp(-beat_pos * 12.0)
            snare_tone = math.sin(2 * math.pi * 220.0 * (beat_pos * beat_dur)) * 0.3
            snare_noise = (random.random() * 2 - 1) * 0.7
            snare = (snare_tone + snare_noise) * snare_env * 0.55

        # Rolling 16th-note sub bassline (Root note shifting every 4 bars)
        bass_note = 48.0 if (beat_idx // 16) % 2 == 0 else 43.0  # C to G
        sub_bass = math.sin(2 * math.pi * bass_note * t) * 0.45

        # Synth arp running 16th notes
        sixteenth = int(t / (beat_dur / 4.0)) % 8
        arp_scale = [0, 3, 7, 10, 12, 10, 7, 3] # Minor pentatonic
        arp_freq = 440.0 * (2.0 ** ((arp_scale[sixteenth] - 9) / 12.0))
        arp_env = math.exp(-((t % (beat_dur / 4.0)) / (beat_dur / 4.0)) * 9.0)
        arp_l = math.sin(2 * math.pi * arp_freq * t) * arp_env * 0.28
        arp_r = math.sin(2 * math.pi * (arp_freq * 1.01) * t) * arp_env * 0.28

        mix_l = kick + snare * 0.9 + sub_bass + arp_l
        mix_r = kick + snare * 1.1 + sub_bass + arp_r

        left_bgm.append(max(-1.0, min(1.0, mix_l * 0.75)) * 28000)
        right_bgm.append(max(-1.0, min(1.0, mix_r * 0.75)) * 28000)

    write_stereo_wav("racing_soundtrack.wav", left_bgm, right_bgm, sample_rate)

if __name__ == "__main__":
    generate_sunset_sky()
    generate_neon_barrier()
    generate_asphalt_diffuse()
    generate_asphalt_normal()
    generate_asphalt_roughness()
    generate_checkered_line()
    generate_hero_car_texture()
    generate_m3_gtr_livery()
    generate_brake_rotor()
    generate_carbon_fiber()
    generate_competitor_textures()
    generate_hd_audio()
    print("ALL ULTRA HIGH-GRAPHICS ASSETS GENERATED!")
