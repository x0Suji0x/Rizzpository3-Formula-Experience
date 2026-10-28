# Formula Interactive Experience

This repository includes a React Three Fiber Formula vehicle experience with Kit, Drive, and Studio modes, orbit/zoom controls, vehicle selection, and keyboard/touch driving.

The three vehicles are local GLB exports of the supplied `Formula 2 Car High Poly.blend` source. They use the same 96,243-triangle geometry with three mesh objects and 14 materials; the Scarlet GP and Ocean GP variants use separate body and front-wing material colors. The application loads these files from `public/models/`, so the vehicle models do not depend on a third-party model CDN.

The supplied Blender source did not include a separate license or attribution document. Verify reuse terms before redistributing these assets further.

## Run locally

```bash
npm ci
npm run build
npm run dev
```

## Blender sources and previews

- `assets/blender/sources/formula-2-car-high-poly.blend` — preserved supplied source copy.
- `assets/blender/liveries/` — editable Scarlet GP and Ocean GP material variants.
- `assets/blender/export_formula_liveries.py` — script used to export the livery variants.
- `previews/` — source and livery render previews.

## Modes

- **Kit**: inspect the vehicle, orbit/zoom, and select a livery.
- **Drive**: use WASD or arrow keys; touch controls are available on smaller screens. This is a lightweight arcade-style kinematic controller, not a full tyre/suspension simulation.
- **Studio**: manually orbit and zoom the vehicle.
