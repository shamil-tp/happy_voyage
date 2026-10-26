# Happy Journey ✈️🎓

A generative, interactive neo-brutalist webpage celebrating **Fasil's** departure for an **MSc in Computer Science in Austria** 🇦🇹.

Built with pure HTML5, CSS, and vanilla JavaScript featuring an animated Truchet tile canvas, procedural color palettes, interactive boarding pass souvenir, and sound effects.

---

## ✨ Features

- **Generative Truchet Canvas**: Fullscreen animated generative patterns using the Canvas 2D API with seeded pseudo-random generation (PRNG).
- **Interactive Ripple & Motion**: Interactive cursor ripple effects and glowing animated flow pulses along the tile tracks.
- **Neo-brutalist UI**: Bold typography, stark borders, and vibrant color schemes.
- **Boarding Pass Souvenir**: An interactive travel ticket modal (Kozhikode `CCJ` ✈️ Vienna `VIE`) with print support.
- **Seeded Palettes**: Includes presets like *Shamil Classic*, *Sunset Voyage*, *Cyberpunk*, *Kerala Monsoon*, and *Monochrome*.
- **Interactive Confetti & Audio**: Celebration confetti with synthetic Web Audio API chimes.
- **Zero Dependencies**: Lightweight, responsive, and runs entirely in the browser without frameworks or external build tools.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser, or serve it locally:

### Option 1: Direct File
Double-click `index.html` or open it directly in your browser.

### Option 2: Local Static Server
Using Python:
```bash
python3 -m http.server 8000
```
Or using Node.js:
```bash
npx serve .
```
Then visit `http://localhost:8000` (or the port indicated).

---

## 📁 Project Structure

```text
├── index.html       # Markup & structure (Hero card, header, boarding pass modal)
├── style.css        # Neo-brutalist styling, responsive layout, animations
├── app.js           # Truchet canvas engine, audio synthesis, interactive events
├── photo.jpg        # Profile image asset
├── photo.heic       # High-efficiency image asset
└── README.md        # Project documentation
```

---

## 🛠️ Built With

- **HTML5** & **Semantic Web Elements**
- **CSS3** (Custom properties, Neo-brutalism design system)
- **Vanilla JavaScript** (Canvas 2D API, Web Audio API)
- **Google Fonts** (*Unbounded*, *Space Grotesk*, *Plus Jakarta Sans*)

---

*Wishing Fasil boundless horizons, zero compile errors, and safe travels! 🇦🇹✨*
