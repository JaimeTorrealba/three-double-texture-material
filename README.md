![npm](https://img.shields.io/npm/v/@jaimebboyjt/three-scatter)

# Three double texture materials

`Three double texture material` (I know, I know, long name right...) is a simple yet in many occasion useful npm pkg that extend your materials in `three.js`, making them possible to add a second texture ,this includes PBR textures like: `normalMap`, `aoMap`, `roughnessMap` etc.

Making them possible to easily combine them without a specialized software like `blender`, `substance designer` or `armory paint`. Keep in mind that this tool doesn't replace those softwares

## Installation

```bash
npm i @jaimebboyjt/three-double-texture-materials
```

## Usage

All three classes share the same blending parameters and helper methods. The blending is driven by an internal Perlin noise texture — no extra setup required.

### Common parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `blend` | `number` | `0.5` | Blend point between the two textures (0–1). |
| `feather` | `number` | `0.1` | Width of the transition edge. Larger values produce a softer blend. |
| `noiseScale` | `number` | `1` | Tiling scale of the noise texture used for the transition. |
| `noiseMap` | `Texture \| null` | Perlin (built-in) | Override the default noise texture with your own. |

### Common methods

| Method | Description |
|---|---|
| `setblend(value: number)` | Update `blend` at runtime (e.g. inside an animation loop). |
| `setFeather(value: number)` | Update `feather` at runtime. |
| `setNoiseScale(value: number)` | Update `noiseScale` at runtime. |

---

### DTMeshBasicMaterial

Extends `MeshBasicMaterial`. Accepts all standard `MeshBasicMaterialParameters` plus a second color map.

| Extra parameter | Type | Description |
|---|---|---|
| `secondMap` | `Texture \| null` | Second albedo texture to blend with `map`. |

```js
import * as THREE from 'three'
import { DTMeshBasicMaterial } from '@jaimebboyjt/three-double-texture-materials'

const loader = new THREE.TextureLoader()

const material = new DTMeshBasicMaterial({
  map: loader.load('/textures/grass/albedo.jpg'),
  secondMap: loader.load('/textures/rock/albedo.jpg'),
  blend: 0.5,    // blend midpoint
  feather: 0.15, // edge softness
  noiseScale: 2,    // noise tiling
})

// Animate the transition at runtime
function animate() {
  requestAnimationFrame(animate)
  material.setBlend(Math.sin(Date.now() * 0.001) * 0.5 + 0.5)
  renderer.render(scene, camera)
}
animate()
```

---

### DTMeshStandardMaterial

Extends `MeshStandardMaterial`. Accepts all standard `MeshStandardMaterialParameters` plus a full second PBR texture set.

| Extra parameter | Type | Description |
|---|---|---|
| `secondMap` | `Texture \| null` | Second albedo texture. |
| `secondNormalMap` | `Texture \| null` | Second normal map. |
| `secondRoughnessMap` | `Texture \| null` | Second roughness map. |
| `secondMetalnessMap` | `Texture \| null` | Second metalness map. |
| `secondAoMap` | `Texture \| null` | Second ambient occlusion map. |
| `secondDisplacementMap` | `Texture \| null` | Second displacement map. |

```js
import * as THREE from 'three'
import { DTMeshStandardMaterial } from '@jaimebboyjt/three-double-texture-materials'

const loader = new THREE.TextureLoader()

const material = new DTMeshStandardMaterial({
  // First PBR set (standard three.js params)
  map:           loader.load('/textures/moss/albedo.jpg'),
  normalMap:     loader.load('/textures/moss/normal.jpg'),
  roughnessMap:  loader.load('/textures/moss/roughness.jpg'),
  aoMap:         loader.load('/textures/moss/ao.jpg'),

  // Second PBR set
  secondMap:           loader.load('/textures/metal/albedo.jpg'),
  secondNormalMap:     loader.load('/textures/metal/normal.jpg'),
  secondRoughnessMap:  loader.load('/textures/metal/roughness.jpg'),
  secondAoMap:         loader.load('/textures/metal/ao.jpg'),

  blend: 0.5,
  feather: 0.1,
  noiseScale: 1,
})
```

---

### DTMeshPhysicalMaterial

Extends `MeshPhysicalMaterial`. Identical second-texture API to `DTMeshStandardMaterial`, with the addition of all `MeshPhysicalMaterialParameters` (clearcoat, transmission, iridescence, etc.).

| Extra parameter | Type | Description |
|---|---|---|
| `secondMap` | `Texture \| null` | Second albedo texture. |
| `secondNormalMap` | `Texture \| null` | Second normal map. |
| `secondRoughnessMap` | `Texture \| null` | Second roughness map. |
| `secondMetalnessMap` | `Texture \| null` | Second metalness map. |
| `secondAoMap` | `Texture \| null` | Second ambient occlusion map. |
| `secondDisplacementMap` | `Texture \| null` | Second displacement map. |

```js
import * as THREE from 'three'
import { DTMeshPhysicalMaterial } from '@jaimebboyjt/three-double-texture-materials'

const loader = new THREE.TextureLoader()

const material = new DTMeshPhysicalMaterial({
  // Physical-only params
  clearcoat: 1,
  clearcoatRoughness: 0.1,

  // First PBR set
  map:          loader.load('/textures/ice/albedo.jpg'),
  normalMap:    loader.load('/textures/ice/normal.jpg'),
  roughnessMap: loader.load('/textures/ice/roughness.jpg'),

  // Second PBR set
  secondMap:          loader.load('/textures/rock/albedo.jpg'),
  secondNormalMap:    loader.load('/textures/rock/normal.jpg'),
  secondRoughnessMap: loader.load('/textures/rock/roughness.jpg'),

  blend: 0.4,
  feather: 0.2,
})
```

### DTMeshBasicNodeMaterial

Soon

### DTMeshStandardNodeMaterial

Soon

### DTMeshPhysicalNodeMaterial

Soon

## Contributing

We are open to contributions, please read the [contributing guide](/CONTRIBUTING.md) to get started.

## License

[MIT](/LICENSE)

## Sponsors

Be the first to support this project [here](LINK) ☺️.