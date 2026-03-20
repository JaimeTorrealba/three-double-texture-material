import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { Pane } from "tweakpane";
import { DTMeshStandardMaterial } from 'double-texture-materials';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Light
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
/**
 * Resize
 */
window.addEventListener("resize", () => {
  // update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  // update camera
  camera.aspect = sizes.width / sizes.height;

  camera.updateProjectionMatrix();
  // update renderer
  renderer.setSize(sizes.width, sizes.height);
});

/**
 * Debug
 * */

const pane = new Pane();

const options = {
  progress: 0.5,
  mergedSize: 0.1,
  noiseScale: 1,
  // Textures tweaks
  roughness: 1,
  metalness: 0,
  aoMapIntensity: 1,
  normalScaleX: 1,
  normalScaleY: 1,
  displacementScale: 0.25,
};

/**
 * Merged texture params
 */
const progressFolder = pane.addFolder({ title: "Merged Texture params" });
progressFolder.addBinding(options, "progress", {
  min: 0,
  max: 1,
  step: 0.01,
}).on("change", ({ value }) => {
  newStandardMaterial.setMerge(value);
});
progressFolder.addBinding(options, "mergedSize", {
  min: 0.1,
  max: 0.75,
  step: 0.01,
}).on("change", ({ value }) => {
  newStandardMaterial.setmergedSize(value);
});
progressFolder.addBinding(options, "noiseScale", {
  min: 0,
  max: 5,
  step: 0.01,
}).on("change", ({ value }) => {
  newStandardMaterial.setNoiseScale(value);
});

/**
 * Based texture params
 */
const baseTextureFolder = pane.addFolder({ title: "Base Texture params" });
baseTextureFolder.addBinding(options, "normalScaleX", {
  min: 0,
  max: 3,
  step: 0.1,
}).on("change", ({ value }) => {
  newStandardMaterial.normalScale.x = value;
});

baseTextureFolder.addBinding(options, "normalScaleY", {
  min: 0,
  max: 3,
  step: 0.1,
}).on("change", ({ value }) => {
  newStandardMaterial.normalScale.y = value;
});
baseTextureFolder.addBinding(options, "displacementScale", {
  min: 0,
  max: 5,
  step: 0.1,
}).on("change", ({ value }) => {
  newStandardMaterial.displacementScale = value;
});
baseTextureFolder.addBinding(options, "roughness", {
  min: 0,
  max: 3,
  step: 0.1,
}).on("change", ({ value }) => {
  newStandardMaterial.roughness = value;
});
baseTextureFolder.addBinding(options, "aoMapIntensity", {
  min: 0,
  max: 3,
  step: 0.1,
}).on("change", ({ value }) => {
  newStandardMaterial.aoMapIntensity = value;
});
baseTextureFolder.addBinding(options, "metalness", {
  min: 0,
  max: 3,
  step: 0.1,
}).on("change", ({ value }) => {
  newStandardMaterial.metalness = value;
});
/**
 * Texturas
 */
const textureLoader = new THREE.TextureLoader();
const baseTexture = textureLoader.load("/textures/bark/color.png");
baseTexture.wrapS = THREE.RepeatWrapping;
baseTexture.wrapT = THREE.RepeatWrapping;
baseTexture.repeat.set(2,2);
const displacementBaseTexture = textureLoader.load("/textures/bark/displacement.png");
const normalBaseTexture = textureLoader.load("/textures/bark/normal.png");
const aoBaseTexture = textureLoader.load("/textures/bark/ao.png");
const roughnessBaseTexture = textureLoader.load("/textures/bark/roughness.png");

const colorSecondaryTexture = textureLoader.load("/textures/moss/color.png", (tex) => {
  // TODO: Texture is not being repeated
});
colorSecondaryTexture.wrapS = THREE.RepeatWrapping;
colorSecondaryTexture.wrapT = THREE.RepeatWrapping;
colorSecondaryTexture.repeat.set(2,2);
const displacementSecondaryTexture = textureLoader.load("/textures/moss/displacement.png");
const normalSecondaryTexture = textureLoader.load("/textures/moss/normal.png");
const aoSecondaryTexture = textureLoader.load("/textures/moss/ao.png");
const roughnessSecondaryTexture = textureLoader.load("/textures/moss/roughness.png");

// const noiseMap = textureLoader.load("/textures/perlin.png");
// noiseMap.wrapS = THREE.RepeatWrapping;
// noiseMap.wrapT = THREE.RepeatWrapping;
// noiseMap.repeat.set(4, 4);

/**
 * Mesh
 */
const geometry = new THREE.CylinderGeometry(3, 3, 8, 128, 128, true);
const newStandardMaterial = new DTMeshStandardMaterial({
  // noiseMap: noiseMap,
  mergedSize: 0.1,
  noiseScale: 1,
  // BASE MAPS
  map: baseTexture,
  normalMap: normalBaseTexture,
  roughnessMap: roughnessBaseTexture,
  aoMap: aoBaseTexture,
  displacementMap: displacementBaseTexture,
  // SECONDARY MAPS
  secondMap: colorSecondaryTexture,
  secondDisplacementMap: displacementSecondaryTexture,
  secondNormalMap: normalSecondaryTexture,
  secondAoMap: aoSecondaryTexture,
  secondRoughnessMap: roughnessSecondaryTexture,
  // GLOBAL PARAMS
  side: THREE.DoubleSide,
  roughness: options.roughness,
  aoMapIntensity: options.aoMapIntensity,
  displacementScale: options.displacementScale,
  metalness: options.metalness,
  normalScale: new THREE.Vector2(options.normalScaleX, options.normalScaleY),

});

const mesh = new THREE.Mesh(geometry, newStandardMaterial);
mesh.rotation.y = Math.PI * 0.5;
scene.add(mesh);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 10
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/**
 * Environment map (cubemap.exr)
 */
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new EXRLoader().load('/cubemap.exr', (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  scene.background = envMap;
  texture.dispose();
  pmremGenerator.dispose();
});

/**
 * Controls
 */
const control = new OrbitControls(camera, renderer.domElement);
control.enablePan = true;
control.enableRotate = true;

// Animate
function animate() {
  control.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

/**
 * Fullscreen
 */
window.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    renderer.domElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});