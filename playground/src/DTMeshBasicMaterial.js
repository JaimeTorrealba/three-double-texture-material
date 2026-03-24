import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { Pane } from "tweakpane";
import { DTMeshBasicMaterial } from 'three-double-texture-materials';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const gridHelper = new THREE.GridHelper(10, 10);
gridHelper.position.y = -3;
scene.add(gridHelper);


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
  blend: 0.5,
  feather: 0.1,
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
const blendFolder = pane.addFolder({ title: "Merged Texture params" });
blendFolder.addBinding(options, "blend", {
  min: 0,
  max: 1,
  step: 0.01,
}).on("change", ({ value }) => {
  newStandardMaterial.setBlend(value);
});
blendFolder.addBinding(options, "feather", {
  min: 0.1,
  max: 0.75,
  step: 0.01,
}).on("change", ({ value }) => {
  newStandardMaterial.setFeather(value);
});
blendFolder.addBinding(options, "noiseScale", {
  min: 0,
  max: 5,
  step: 0.01,
}).on("change", ({ value }) => {
  newStandardMaterial.setNoiseScale(value);
});

/**
 * Texturas
 */
const textureLoader = new THREE.TextureLoader();
const baseTexture = textureLoader.load("/textures/metal-rusted/color.jpg");
baseTexture.wrapS = THREE.RepeatWrapping;
baseTexture.wrapT = THREE.RepeatWrapping;
baseTexture.repeat.set(2,2);

const colorSecondaryTexture = textureLoader.load("/textures/ice/color.jpg");
colorSecondaryTexture.wrapS = THREE.RepeatWrapping;
colorSecondaryTexture.wrapT = THREE.RepeatWrapping;
colorSecondaryTexture.repeat.set(2,2);

/**
 * Mesh
 */
const geometry = new THREE.IcosahedronGeometry(3, 16,16);
const newStandardMaterial = new DTMeshBasicMaterial({
  // noiseMap: noiseMap,
  feather: 0.1,
  noiseScale: 1,
  // BASE MAPS
  map: baseTexture,
  // SECONDARY MAPS
  secondMap: colorSecondaryTexture,
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
renderer.setClearColor(0x333333, 1);

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