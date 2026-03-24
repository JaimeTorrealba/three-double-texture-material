import {
  Texture,
  MeshStandardMaterialParameters,
  MeshStandardMaterial,
  Material,
  DataTexture,
  RepeatWrapping,
} from 'three'
import { TextureLoader } from 'three'
import perlinUrl from './assets/perlin.png?inline'

type NullableTexture = Texture | null

interface DTMeshStandardMaterialParams extends MeshStandardMaterialParameters {
  secondMap?: NullableTexture
  secondDisplacementMap?: NullableTexture
  secondNormalMap?: NullableTexture
  secondRoughnessMap?: NullableTexture
  secondMetalnessMap?: NullableTexture
  secondAoMap?: NullableTexture
  noiseMap?: NullableTexture
  blend?: number
  feather?: number
  noiseScale?: number
}

class DTMeshStandardMaterial extends MeshStandardMaterial {

  secondMap: NullableTexture
  secondDisplacementMap: NullableTexture
  secondNormalMap: NullableTexture
  secondRoughnessMap: NullableTexture
  secondMetalnessMap: NullableTexture
  secondAoMap: NullableTexture
  noiseMap: NullableTexture
  blend: number
  feather: number
  noiseScale: number
  declare userData: Material['userData'] & {
    shader?: { uniforms: Record<string, { value: unknown }> }
  }

  constructor(params: DTMeshStandardMaterialParams = {}) {
    const { secondMap, secondDisplacementMap, secondNormalMap, secondRoughnessMap, secondMetalnessMap, secondAoMap, noiseMap, blend, feather, noiseScale, ...baseParams } = params
    super(baseParams)

    this.secondMap = secondMap || null
    this.secondDisplacementMap = secondDisplacementMap || null
    this.secondNormalMap = secondNormalMap || null
    this.secondRoughnessMap = secondRoughnessMap || null
    this.secondMetalnessMap = secondMetalnessMap || null
    this.secondAoMap = secondAoMap || null
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
      if (this.secondDisplacementMap) shader.defines.USE_SECOND_DISPLACEMENTMAP = ''
      if (this.secondNormalMap) shader.defines.USE_SECOND_NORMALMAP = ''
      if (this.secondRoughnessMap) shader.defines.USE_SECOND_ROUGHNESSMAP = ''
      if (this.secondMetalnessMap) shader.defines.USE_SECOND_METALNESSMAP = ''
      if (this.secondAoMap) shader.defines.USE_SECOND_AOMAP = ''

      // ---- UNIFORMS ----
      shader.uniforms.secondMap = { value: this.secondMap }
      shader.uniforms.secondDisplacementMap = { value: this.secondDisplacementMap }
      shader.uniforms.secondNormalMap = { value: this.secondNormalMap }
      shader.uniforms.secondRoughnessMap = { value: this.secondRoughnessMap }
      shader.uniforms.secondMetalnessMap = { value: this.secondMetalnessMap }
      shader.uniforms.secondAoMap = { value: this.secondAoMap }
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
        ${this.secondNormalMap ? 'uniform sampler2D secondNormalMap;' : ''}
        ${this.secondRoughnessMap ? 'uniform sampler2D secondRoughnessMap;' : ''}
        ${this.secondMetalnessMap ? 'uniform sampler2D secondMetalnessMap;' : ''}
        ${this.secondAoMap ? 'uniform sampler2D secondAoMap;' : ''}
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

      shader.vertexShader =
        `
        uniform float blend;
        uniform float feather;
        uniform float noiseScale;
        ${this.secondDisplacementMap ? 'uniform sampler2D secondDisplacementMap;' : ''}
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
        + shader.vertexShader

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
              vec4 borderColor = mix(texelColor2, texelColor1, feather);
              vec4 finalColor = mix(blendedColor, borderColor, borderMaskColor);

              diffuseColor *= finalColor;
            #else
              diffuseColor *= texelColor1;
            #endif
          #endif
        `
      )

      // ---- ROUGHNESS BLEND ----
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
          float roughnessFactor = roughness;
          #ifdef USE_ROUGHNESSMAP
            float rough1 = texture2D( roughnessMap, vRoughnessMapUv ).g;
            #ifdef USE_SECOND_ROUGHNESSMAP
              float rough2 = texture2D( secondRoughnessMap, vRoughnessMapUv ).g;
              vec2 roughMasks = blendMasks(vMapUv);
              float maskHiRough = roughMasks.x;
              float borderMaskRough = roughMasks.y;
              float blendedRough = mix( rough2, rough1, maskHiRough );
              float borderValueRough = mix( rough1, rough2, 0.5 );
              roughnessFactor *= mix( blendedRough, borderValueRough, borderMaskRough );
            #else
              roughnessFactor *= rough1;
            #endif
          #endif
        `
      )

      // ---- METALNESS BLEND ----
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <metalnessmap_fragment>',
        `
          float metalnessFactor = metalness;
          #ifdef USE_METALNESSMAP
            float metal1 = texture2D( metalnessMap, vMetalnessMapUv ).b;
            #ifdef USE_SECOND_METALNESSMAP
              float metal2 = texture2D( secondMetalnessMap, vMetalnessMapUv ).b;
              vec2 metalMasks = blendMasks(vMapUv);
              float maskHiMetal = metalMasks.x;
              float borderMaskMetal = metalMasks.y;
              float blendedMetal = mix( metal2, metal1, maskHiMetal );
              float borderValueMetal = mix( metal1, metal2, 0.5 );
              metalnessFactor *= mix( blendedMetal, borderValueMetal, borderMaskMetal );
            #else
              metalnessFactor *= metal1;
            #endif
          #endif
        `
      )

      // ---- NORMAL BLEND ----
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
          #ifdef USE_NORMALMAP_TANGENTSPACE
            vec3 n1 = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
            #ifdef USE_SECOND_NORMALMAP
              vec3 n2 = texture2D( secondNormalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
              float maskHiNormal = blendMasks(vMapUv).x;
              vec3 blendedNormal = normalize( mix( n2, n1, maskHiNormal ) );
            #else
              vec3 blendedNormal = n1;
            #endif
            blendedNormal.xy *= normalScale;
            normal = normalize( tbn * blendedNormal );
          #endif
        `
      )

      // ---- AO BLEND ----
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <aomap_fragment>',
        `
          #ifdef USE_AOMAP
            float ao1 = texture2D( aoMap, vAoMapUv ).r;
            #ifdef USE_SECOND_AOMAP
              float ao2 = texture2D( secondAoMap, vAoMapUv ).r;
              vec2 aoMasks = blendMasks(vMapUv);
              float maskHiAo = aoMasks.x;
              float borderMaskAo = aoMasks.y;
              float blendedAo = mix( ao2, ao1, maskHiAo );
              float borderValueAo = mix( ao1, ao2, 0.5 );
              float aoValue = mix( blendedAo, borderValueAo, borderMaskAo );
            #else
              float aoValue = ao1;
            #endif

            float ambientOcclusion = ( aoValue - 1.0 ) * aoMapIntensity + 1.0;
            reflectedLight.indirectDiffuse *= ambientOcclusion;

            #if defined( USE_CLEARCOAT )
              clearcoatSpecularIndirect *= ambientOcclusion;
            #endif

            #if defined( USE_SHEEN )
              sheenSpecularIndirect *= ambientOcclusion;
            #endif

            #if defined( USE_ENVMAP ) && defined( STANDARD )
              float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
              reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
            #endif
          #endif
        `
      )

      // ---- DISPLACEMENT BLEND ----
      shader.vertexShader = shader.vertexShader.replace(
        '#include <displacementmap_vertex>',
        `
          #ifdef USE_DISPLACEMENTMAP
            float disp1 = texture2D( displacementMap, vDisplacementMapUv ).x;
            #ifdef USE_SECOND_DISPLACEMENTMAP
              float disp2 = texture2D( secondDisplacementMap, vDisplacementMapUv ).x;
              vec2 dispMasks = blendMasks(vMapUv);
              float maskHiDisp = dispMasks.x;
              float borderMaskDisp = dispMasks.y;
              float blendedDisp = mix( disp2, disp1, maskHiDisp );
              float borderValueDisp = mix( disp1, disp2, 0.5 );
              float disp = mix( blendedDisp, borderValueDisp, borderMaskDisp );
            #else
              float disp = disp1;
            #endif
            transformed += normalize( objectNormal ) * ( disp * displacementScale + displacementBias );
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

export { DTMeshStandardMaterial };