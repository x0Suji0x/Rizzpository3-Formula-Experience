import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const unusedPublicAssets = [
  'dist/bike.glb',
  'dist/rodin-bike.glb',
  'dist/models/rodin-bike-optimized.glb',
  'dist/models/cgc-motorcycle.glb',
];

for (const relativePath of unusedPublicAssets) {
  const assetPath = resolve(repoRoot, relativePath);
  if (existsSync(assetPath)) unlinkSync(assetPath);
}
