# APEX LAB // FORMULA

An interactive Formula vehicle study built with React, Three.js, and React Three Fiber. Choose a car, inspect it in Kit mode, drive it in Drive mode, or orbit it in Studio mode.

## Open it locally

Requirements: Node.js and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, usually **http://localhost:5173/**. If that port is busy, Vite will print a different one. To make a production build, run `npm run build`.

## Controls

- **Kit**: drag to orbit, scroll/pinch to zoom, and use the previous/next controls to switch cars.
- **Drive**: use **WASD** or the **arrow keys**. Touch controls are available on smaller screens.
- **Studio**: orbit and zoom around the car.

Driving uses a lightweight arcade-style controller; it is not a tyre or suspension physics simulation.

## Formula 2 models

All three cars use local GLB files in `public/models/`: the supplied high-poly source model, Scarlet GP, and Ocean GP. The livery variants share the source geometry and change material colors. Editable Blender files and the export script are in `assets/blender/`; preview renders are in `previews/`.

The supplied Blender source did not include a separate license or attribution document. Verify reuse terms before redistributing these model files further.

## Stack

- React 18 and Vite
- Three.js, React Three Fiber, and Drei
- GSAP, Zustand, and Lucide React
