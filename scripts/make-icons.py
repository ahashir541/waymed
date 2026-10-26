# Renders the PNG app icons (public/icon-192.png, public/icon-512.png) that match public/icon.svg.
# Run: python scripts/make-icons.py   (needs Pillow)
from PIL import Image, ImageDraw

def render(size: int, path: str) -> None:
    s = 4  # supersample for smooth edges
    W = size * s
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # vertical-diagonal gradient navy -> teal-navy
    grad = Image.new("RGBA", (W, W))
    gd = ImageDraw.Draw(grad)
    for i in range(W):
        t = i / W
        c = tuple(int(a + (b - a) * t) for a, b in zip((11, 11, 11), (31, 31, 31))) + (255,)
        gd.line([(0, i), (W, i)], fill=c)
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 0.22), fill=255)
    img.paste(grad, (0, 0), mask)
    k = W / 512
    # route curve approximated with a polyline
    pts = []
    for i in range(41):
        t = i / 40
        # two cubic segments: (120,360)->(256,250)->(392,150)
        if t < 0.5:
            u = t * 2
            p0, p1, p2, p3 = (120, 360), (180, 360), (190, 250), (256, 250)
        else:
            u = (t - 0.5) * 2
            p0, p1, p2, p3 = (256, 250), (322, 250), (330, 150), (392, 150)
        x = (1-u)**3*p0[0] + 3*(1-u)**2*u*p1[0] + 3*(1-u)*u**2*p2[0] + u**3*p3[0]
        y = (1-u)**3*p0[1] + 3*(1-u)**2*u*p1[1] + 3*(1-u)*u**2*p2[1] + u**3*p3[1]
        pts.append((x * k, y * k))
    d.line(pts, fill=(224, 168, 0, 255), width=int(36 * k), joint="curve")
    for p in (pts[0], pts[-1]):
        r = 18 * k
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(224, 168, 0, 255))
    r = 34 * k
    d.ellipse([120 * k - r, 360 * k - r, 120 * k + r, 360 * k + r], fill="white")
    # pin
    cx, cy, R = 392 * k, 162 * k, 54 * k
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill="white")
    d.polygon([(cx - R * 0.8, cy + R * 0.55), (cx + R * 0.8, cy + R * 0.55), (cx, 254 * k)], fill="white")
    r = 20 * k
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(11, 11, 11, 255))
    img.resize((size, size), Image.LANCZOS).save(path)

render(192, "public/icon-192.png")
render(512, "public/icon-512.png")
print("icons written")
