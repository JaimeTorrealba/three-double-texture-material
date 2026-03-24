import {
  Texture,
  MeshBasicMaterialParameters,
  MeshBasicMaterial,
  Material,
  DataTexture,
  RepeatWrapping,
} from 'three'
import { TextureLoader } from 'three'
import perlinUrl from './assets/perlin.png?inline'

type NullableTexture = Texture | null

interface DTMeshBasicMaterialParams extends MeshBasicMaterialParameters {
  secondMap?: NullableTexture
  noiseMap?: NullableTexture
  blend?: number
  feather?: number
  noiseScale?: number
}

class DTMeshBasicMaterial extends MeshBasicMaterial {

  secondMap: NullableTexture
  noiseMap: NullableTexture
  blend: number
  feather: number
  noiseScale: number
  declare userData: Material['userData'] & {
    shader?: { uniforms: Record<string, { value: unknown }> }
  }

  constructor(params: DTMeshBasicMaterialParams = {}) {
    const { secondMap, noiseMap, blend, feather, noiseScale, ...baseParams } = params
    super(baseParams)

    this.secondMap = secondMap || null
    // NOISE PARAMS
    if (noiseMap) {
      this.noiseMap = noiseMap
    } else {
      // Use a 1x1 white DataTexture as placeholder so the sampler2D uniform
      // is always valid at compile time, then swap once the real image loads.
      const placeholder = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
      placeholder.needsUpdate = true
      this.noiseMap = placeholder

      // perlinUrl is a base64 data URL inlined at build time — no path issues
      new TextureLoader().load(perlinUrl, (texture) => {
        this.noiseMap = texture
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        if (this.userData.shader) {
          this.userData.shader.uniforms.noiseMap.value = texture
        }
      })
    }
    this.blend = blend ?? 0.5
    this.feather = feather ?? 0.1
    this.noiseScale = noiseScale ?? 1

    this.onBeforeCompile = (shader) => {

      // ---- DEFINES (must be set before compile) ----
      shader.defines = shader.defines || {}
      if (this.secondMap) shader.defines.USE_SECOND_MAP = ''

      // ---- UNIFORMS ----
      shader.uniforms.secondMap = { value: this.secondMap }
      shader.uniforms.noiseMap = { value: this.noiseMap }
      shader.uniforms.blend = { value: this.blend }
      shader.uniforms.feather = { value: this.feather }
      shader.uniforms.noiseScale = { value: this.noiseScale }

      this.userData.shader = shader

      // ---- INJECT UNIFORMS (only declare samplers that are bound) ----
      shader.fragmentShader =
        `
        uniform float blend;
        uniform float feather;
        uniform float noiseScale;
        ${this.secondMap ? 'uniform sampler2D secondMap;' : ''}
        uniform sampler2D noiseMap;

        float sampleNoise(vec2 uv) {
          return texture2D(noiseMap, uv * noiseScale).r;
        }

        vec2 blendMasks(vec2 uv) {
          float noiseVal = sampleNoise(uv);
          float maskLo = smoothstep(blend - feather, blend, noiseVal);
          float maskHi = smoothstep(blend, blend + feather, noiseVal);
          float borderMask = maskLo * (1.0 - maskHi);
          return vec2(maskHi, borderMask);
        }
        `
        + shader.fragmentShader
      // ---- ALBEDO BLEND ----
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
          #ifdef USE_MAP
            vec4 texelColor1 = texture2D( map, vMapUv );
            #ifdef USE_SECOND_MAP
              vec4 texelColor2 = texture2D( secondMap, vMapUv );
              vec2 colorMasks = blendMasks(vMapUv);
              float maskHiColor = colorMasks.x;
              float borderMaskColor = colorMasks.y;
              vec4 blendedColor = mix(texelColor2, texelColor1, maskHiColor);
              vec4 borderColor = mix(texelColor2, texelColor1, 0.5);
              vec4 finalColor = mix(blendedColor, borderColor, borderMaskColor);

              diffuseColor *= finalColor;
            #else
              diffuseColor *= texelColor1;
            #endif
          #endif
        `
      )
    }
  }

  setBlend(value: number) {
    this.blend = value
    if (this.userData.shader) {
      this.userData.shader.uniforms.blend.value = value
    }
  }

  setFeather(value: number) {
    this.feather = value
    if (this.userData.shader) {
      this.userData.shader.uniforms.feather.value = value
    }
  }
  setNoiseScale(value: number) {
    this.noiseScale = value
    if (this.userData.shader) {
      this.userData.shader.uniforms.noiseScale.value = value
    }
  }
}

export { DTMeshBasicMaterial };