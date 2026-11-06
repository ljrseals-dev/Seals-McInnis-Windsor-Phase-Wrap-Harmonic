assets/ — Seals–McInnis–Windsor Phase-Wrap Harmonic

Printable visual assets for the SMWPWH repository. Copy each into its own file under assets/.

---

assets/smwpwh-marketing.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a12"/>
      <stop offset="100%" stop-color="#141428"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f5d76e"/>
      <stop offset="100%" stop-color="#e67e22"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="1200" height="675" fill="url(#bg)"/>

  <!-- staff lines -->
  <g stroke="#2a2a4a" stroke-width="2" opacity="0.5">
    <line x1="100" y1="520" x2="1100" y2="520"/>
    <line x1="100" y1="550" x2="1100" y2="550"/>
    <line x1="100" y1="580" x2="1100" y2="580"/>
  </g>

  <!-- ouroboros circle -->
  <circle cx="600" cy="300" r="130" fill="none" stroke="url(#gold)"
          stroke-width="8" filter="url(#glow)" opacity="0.9"/>
  <path d="M600 170 L620 200 L580 200 Z" fill="#f5d76e"/>

  <!-- phase wave -->
  <path d="M300 300 C 400 200, 500 400, 600 300 S 800 200, 900 300"
        fill="none" stroke="#4ecdc4" stroke-width="4" opacity="0.8"/>

  <!-- title -->
  <text x="600" y="120" text-anchor="middle" fill="#f5d76e"
        font-family="Arial, sans-serif" font-size="42" font-weight="bold"
        letter-spacing="1">
    Seals–McInnis–Windsor
  </text>
  <text x="600" y="170" text-anchor="middle" fill="#ffffff"
        font-family="Arial, sans-serif" font-size="36" font-weight="bold">
    Phase-Wrap Harmonic
  </text>

  <!-- tagline -->
  <text x="600" y="460" text-anchor="middle" fill="#4ecdc4"
        font-family="Arial, sans-serif" font-size="28">
    Endless motion. Notatable. Computable.
  </text>
  <text x="600" y="500" text-anchor="middle" fill="#aaaaaa"
        font-family="Arial, sans-serif" font-size="22">
    SMWPWH · Ouroboros Phase Canon
  </text>

  <!-- phase labels -->
  <text x="100" y="530" fill="#888" font-size="20">φ=0</text>
  <text x="550" y="530" fill="#888" font-size="20">φ=1/2</text>
  <text x="1050" y="530" fill="#888" font-size="20">φ=1 ↻ 0</text>
</svg>
```

Alt text: Dark gold-and-teal graphic reading “Seals–McInnis–Windsor Phase-Wrap Harmonic,” with an ouroboros circle, a phase wave, and the tagline “Endless motion. Notatable. Computable.”

---

assets/social-card.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#08080f"/>
      <stop offset="100%" stop-color="#1a1a30"/>
    </linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4ecdc4"/>
      <stop offset="100%" stop-color="#1a6b66"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg2)"/>

  <!-- concentric octave rings -->
  <g fill="none" stroke="url(#teal)" stroke-width="2" opacity="0.35">
    <circle cx="900" cy="315" r="60"/>
    <circle cx="900" cy="315" r="120"/>
    <circle cx="900" cy="315" r="180"/>
    <circle cx="900" cy="315" r="240"/>
  </g>

  <!-- rising phase curve -->
  <path d="M80 520 C 300 520, 400 200, 620 200 S 900 380, 1120 140"
        fill="none" stroke="#f5d76e" stroke-width="6" opacity="0.9"/>

  <!-- note dots on the curve -->
  <g fill="#f5d76e">
    <circle cx="200" cy="450" r="8"/>
    <circle cx="400" cy="300" r="8"/>
    <circle cx="620" cy="200" r="8"/>
    <circle cx="820" cy="290" r="8"/>
    <circle cx="1000" cy="200" r="8"/>
  </g>

  <!-- title block -->
  <text x="80" y="120" fill="#ffffff"
        font-family="Georgia, serif" font-size="64" font-weight="bold">
    Phase-Wrap
  </text>
  <text x="80" y="190" fill="#4ecdc4"
        font-family="Georgia, serif" font-size="64" font-weight="bold">
    Harmonic
  </text>

  <text x="80" y="250" fill="#888"
        font-family="Arial, sans-serif" font-size="24" letter-spacing="3">
    SEALS – McINNIS – WINDSOR
  </text>

  <text x="80" y="580" fill="#f5d76e"
        font-family="Arial, sans-serif" font-size="26">
    SMWPWH · v1.0
  </text>
</svg>
```

---

assets/banner.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 400">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0a0a12"/>
      <stop offset="50%" stop-color="#141428"/>
      <stop offset="100%" stop-color="#0a0a12"/>
    </linearGradient>
    <linearGradient id="gold3" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f5d76e"/>
      <stop offset="100%" stop-color="#e67e22"/>
    </linearGradient>
  </defs>

  <rect width="1600" height="400" fill="url(#bg3)"/>

  <!-- ouroboros on the right -->
  <g transform="translate(1350,200)">
    <circle r="110" fill="none" stroke="url(#gold3)" stroke-width="6" opacity="0.9"/>
    <path d="M0 -130 L20 -100 L-20 -100 Z" fill="#f5d76e"/>
    <path d="M-80 80 C -40 40, 40 40, 80 80"
          fill="none" stroke="#4ecdc4" stroke-width="4" opacity="0.7"/>
  </g>

  <!-- title on the left -->
  <text x="80" y="150" fill="#f5d76e"
        font-family="Georgia, serif" font-size="56" font-weight="bold">
    Seals–McInnis–Windsor
  </text>
  <text x="80" y="215" fill="#ffffff"
        font-family="Georgia, serif" font-size="48" font-weight="bold">
    Phase-Wrap Harmonic
  </text>
  <text x="80" y="280" fill="#4ecdc4"
        font-family="Arial, sans-serif" font-size="26" letter-spacing="2">
    ENDLESS MOTION · NOTATABLE · COMPUTABLE
  </text>

  <!-- phase strip -->
  <g transform="translate(80,340)">
    <line x1="0" y1="0" x2="700" y2="0" stroke="#2a2a4a" stroke-width="2"/>
    <circle cx="0" cy="0" r="6" fill="#f5d76e"/>
    <circle cx="350" cy="0" r="6" fill="#f5d76e"/>
    <circle cx="700" cy="0" r="6" fill="#f5d76e"/>
    <text x="0" y="25" fill="#888" font-size="16" font-family="Arial">φ=0</text>
    <text x="325" y="25" fill="#888" font-size="16" font-family="Arial">φ=1/2</text>
    <text x="660" y="25" fill="#888" font-size="16" font-family="Arial">φ=1 ↻ 0</text>
  </g>
</svg>
```

---

assets/icon.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="ico" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5d76e"/>
      <stop offset="100%" stop-color="#e67e22"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="96" fill="#0a0a12"/>

  <!-- ouroboros ring -->
  <circle cx="256" cy="256" r="160" fill="none"
          stroke="url(#ico)" stroke-width="16"/>
  <path d="M256 80 L286 124 L226 124 Z" fill="#f5d76e"/>

  <!-- phase curve inside -->
  <path d="M120 300 C 180 220, 220 340, 256 256 S 340 200, 392 260"
        fill="none" stroke="#4ecdc4" stroke-width="10"
        stroke-linecap="round" opacity="0.9"/>
</svg>
```

---

assets/phase-diagram.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500">
  <defs>
    <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4ecdc4"/>
      <stop offset="100%" stop-color="#f5d76e"/>
    </linearGradient>
  </defs>

  <rect width="900" height="500" fill="#0a0a12"/>

  <text x="450" y="50" text-anchor="middle" fill="#ffffff"
        font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    The Shepard Window W(φ)
  </text>

  <!-- axes -->
  <line x1="100" y1="400" x2="800" y2="400" stroke="#444" stroke-width="2"/>
  <line x1="100" y1="400" x2="100" y2="120" stroke="#444" stroke-width="2"/>

  <!-- axis labels -->
  <text x="90" y="120" text-anchor="end" fill="#888" font-size="18">1</text>
  <text x="90" y="400" text-anchor="end" fill="#888" font-size="18">0</text>
  <text x="100" y="430" text-anchor="middle" fill="#888" font-size="18">φ=0</text>
  <text x="450" y="430" text-anchor="middle" fill="#888" font-size="18">φ=1/2</text>
  <text x="800" y="430" text-anchor="middle" fill="#888" font-size="18">φ=1 ↻ 0</text>

  <!-- W(phi) = sin^2(pi phi), scaled -->
  <path d="M100 400
           C 200 400, 300 120, 450 120
           C 600 120, 700 400, 800 400"
        fill="none" stroke="url(#curveGrad)" stroke-width="6"/>

  <!-- seam markers -->
  <line x1="100" y1="400" x2="100" y2="120" stroke="#e74c3c"
        stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>
  <line x1="800" y1="400" x2="800" y2="120" stroke="#e74c3c"
        stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>

  <text x="450" y="470" text-anchor="middle" fill="#e74c3c"
        font-family="Arial, sans-serif" font-size="18">
    W(0) = W(1) = 0 · seamless wrap
  </text>
</svg>
```

---

assets/phase-staff.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500">
  <rect width="1000" height="500" fill="#0a0a12"/>

  <text x="500" y="50" text-anchor="middle" fill="#ffffff"
        font-family="Arial, sans-serif" font-size="26" font-weight="bold">
    SMWPWH Phase Staff
  </text>

  <!-- phase staff lines -->
  <g stroke="#2a2a4a" stroke-width="2">
    <line x1="100" y1="120" x2="900" y2="120"/>
    <line x1="100" y1="170" x2="900" y2="170"/>
    <line x1="100" y1="220" x2="900" y2="220"/>
  </g>

  <!-- phase labels -->
  <text x="60" y="125" fill="#888" font-size="16">1</text>
  <text x="60" y="175" fill="#888" font-size="16">1/2</text>
  <text x="60" y="225" fill="#888" font-size="16">0</text>

  <!-- rising phase curve -->
  <path d="M120 220 L300 170 L480 120 L660 170 L840 220"
        fill="none" stroke="#4ecdc4" stroke-width="4"/>

  <!-- phase dots -->
  <g fill="#f5d76e">
    <circle cx="120" cy="220" r="6"/>
    <circle cx="300" cy="170" r="6"/>
    <circle cx="480" cy="120" r="6"/>
    <circle cx="660" cy="170" r="6"/>
    <circle cx="840" cy="220" r="6"/>
  </g>

  <!-- wrap arrow -->
  <text x="860" y="220" fill="#f5d76e" font-size="24">↻</text>

  <!-- pitch staff -->
  <g stroke="#2a2a4a" stroke-width="2">
    <line x1="100" y1="320" x2="900" y2="320"/>
    <line x1="100" y1="350" x2="900" y2="350"/>
    <line x1="100" y1="380" x2="900" y2="380"/>
    <line x1="100" y1="410" x2="900" y2="410"/>
    <line x1="100" y1="440" x2="900" y2="440"/>
  </g>

  <!-- shepard noteheads -->
  <g fill="none" stroke="#4ecdc4" stroke-width="3">
    <circle cx="120" cy="410" r="9"/>
    <circle cx="300" cy="395" r="9"/>
    <circle cx="480" cy="380" r="9"/>
    <circle cx="660" cy="365" r="9"/>
    <circle cx="840" cy="350" r="9"/>
  </g>

  <!-- pitch labels -->
  <text x="120" y="475" text-anchor="middle" fill="#888" font-size="14">C</text>
  <text x="300" y="475" text-anchor="middle" fill="#888" font-size="14">D</text>
  <text x="480" y="475" text-anchor="middle" fill="#888" font-size="14">E</text>
  <text x="660" y="475" text-anchor="middle" fill="#888" font-size="14">F♯</text>
  <text x="840" y="475" text-anchor="middle" fill="#888" font-size="14">G♯</text>
</svg>
```

---

assets/README.md

```markdown
# SMWPWH assets

Visual assets for the Seals–McInnis–Windsor Phase-Wrap Harmonic.

## Files

| File | Purpose | Size |
|---|---|---|
| `smwpwh-marketing.svg` | Primary marketing image | 1200 × 675 |
| `social-card.svg` | Social share card (Open Graph) | 1200 × 630 |
| `banner.svg` | Repository banner | 1600 × 400 |
| `icon.svg` | App / favicon icon | 512 × 512 |
| `phase-diagram.svg` | Diagram of the Shepard window W(φ) | 900 × 500 |
| `phase-staff.svg` | Diagram of SMWPWH notation | 1000 × 500 |

## Palette

| Role | Hex |
|---|---|
| Background deep | `#0a0a12` |
| Background mid | `#141428` |
| Accent gold | `#f5d76e` |
| Accent orange | `#e67e22` |
| Accent teal | `#4ecdc4` |
| Text primary | `#ffffff` |
| Text muted | `#888888` |
| Staff lines | `#2a2a4a` |
| Seam warning | `#e74c3c` |

## Converting to PNG

```bash
# marketing image
rsvg-convert -w 1200 -h 675 assets/smwpwh-marketing.svg -o build/marketing.png

# social card
rsvg-convert -w 1200 -h 630 assets/social-card.svg -o build/social.png

# icon at multiple sizes
for s in 16 32 64 128 256 512; do
  rsvg-convert -w $s -h $s assets/icon.svg -o build/icon-$s.png
done
```

Alternatives to rsvg-convert:

· inkscape --export-type=png
· cairosvg
· resvg

Usage

GitHub social preview

Upload social-card.svg (converted to PNG) under
Settings → General → Social preview.

README banner

```markdown
![SMWPWH banner](assets/banner.svg)
```

Favicon

Convert icon.svg to favicon.ico with any icon tool.

Alt text

· smwpwh-marketing.svg: Dark gold-and-teal graphic reading
  “Seals–McInnis–Windsor Phase-Wrap Harmonic,” with an ouroboros
  circle, a phase wave, and the tagline “Endless motion. Notatable.
  Computable.”
· social-card.svg: Dark teal graphic with concentric octave rings,
  a rising phase curve, and the title “Phase-Wrap Harmonic.”
· banner.svg: Wide dark banner with the full theory name, the
  tagline, and a phase strip from φ=0 to φ=1 ↻ 0.
· icon.svg: Rounded dark square with a gold ouroboros ring and a
  teal phase curve inside.
· phase-diagram.svg: Plot of the Shepard window W(φ) = sin²(πφ),
  rising from 0 at φ=0 to 1 at φ=1/2 and back to 0 at φ=1, with
  dashed red seam markers.
· phase-staff.svg: Diagram of a phase staff above a pitch staff,
  with a rising phase curve, wrap arrow, and circular Shepard
  noteheads.

License

MIT. See LICENSE.

```

---

## assets/.gitignore

```gitignore
# keep SVG sources, ignore generated raster exports
*.png
*.jpg
*.jpeg
*.webp
*.ico
build/
```

---

assets/Makefile

```makefile
# Render SMWPWH SVG assets to PNG.
#
# Requires one of: rsvg-convert, inkscape, or cairosvg.
#
#   make            all raster exports
#   make marketing  marketing image only
#   make social     social card only
#   make icons      icon at standard sizes
#   make clean      remove build/

OUT ?= build
RSVG ?= rsvg-convert

.PHONY: all marketing social banner icons diagrams clean

all: marketing social banner icons diagrams

marketing:
	@mkdir -p $(OUT)
	$(RSVG) -w 1200 -h 675 smwpwh-marketing.svg -o $(OUT)/marketing.png

social:
	@mkdir -p $(OUT)
	$(RSVG) -w 1200 -h 630 social-card.svg -o $(OUT)/social.png

banner:
	@mkdir -p $(OUT)
	$(RSVG) -w 1600 -h 400 banner.svg -o $(OUT)/banner.png

icons:
	@mkdir -p $(OUT)
	@for s in 16 32 64 128 256 512; do \
	  $(RSVG) -w $$s -h $$s icon.svg -o $(OUT)/icon-$$s.png; \
	done

diagrams:
	@mkdir -p $(OUT)
	$(RSVG) -w 1800 -h 1000 phase-diagram.svg -o $(OUT)/phase-diagram.png
	$(RSVG) -w 2000 -h 1000 phase-staff.svg -o $(OUT)/phase-staff.png

clean:
	rm -rf $(OUT)
```

---

File tree

```
assets/
├── README.md
├── Makefile
├── .gitignore
├── smwpwh-marketing.svg
├── social-card.svg
├── banner.svg
├── icon.svg
├── phase-diagram.svg
└── phase-staff.svg
```

Smoke test

```bash
cd assets
make            # requires rsvg-convert
make icons
make clean
```

End of assets.
