/**
 * The Pa'Casa conversational orb shader and its look model, shared by the web
 * WebGL2 renderer in ChatOrb. A direct port of @native-springs/shaders
 * orb.glsl (MatthewSRC, adapted from SnoopethDuckDuck's
 * https://www.shadertoy.com/view/mdd3D4) and its composeOrbLook state layers,
 * so web and native OrbOverlay draw the same orb.
 */

export const ORB_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const ORB_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float time;
uniform float intensity;
uniform vec2 viewSize;
uniform vec3 color;
uniform vec3 secondaryColor;
uniform float scale;
uniform float radius;
uniform float thickness;
uniform float dispersion;
uniform float spread;
uniform float turbulence;
uniform float chromatic;
uniform float shimmer;
uniform float symmetry;
uniform float core;
uniform float brightness;
uniform float saturation;
uniform float rippleProgress;
uniform float rippleStrength;

const float PI = 3.14159265;
const float NOISE_FREQ = 8.0;
const float NOISE_CELLS = 64.0;
const float TILE = NOISE_CELLS / NOISE_FREQ;

mat2 rot(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  p *= NOISE_FREQ;
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 i1 = mod(i + 1.0, NOISE_CELLS);
  i = mod(i, NOISE_CELLS);
  float a = hash(i);
  float b = hash(vec2(i1.x, i.y));
  float c = hash(vec2(i.x, i1.y));
  float d = hash(i1);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 filaments(vec2 uv, float t, float d0, float scroll) {
  float turb = turbulence;
  vec2 o = chromatic * (0.05 * uv + vec2(0.0, 0.015));
  vec2 uv2 = uv;
  vec3 tx = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float io = 2.0 * PI * float(i) / 8.0;
    uv2 *= rot(-0.01 * t + io);
    vec2 q = uv2 - scroll;
    vec2 oi = o + shimmer * 0.012 * vec2(sin(t * 6.1 + io * 3.0), cos(t * 4.7 + io * 2.0));
    vec3 tx2 = vec3(valueNoise(q - oi), valueNoise(q), valueNoise(q + oi));
    uv2 *= rot(-0.01 * t - io);
    tx2 *= tx2;
    tx2 *= tx2;
    tx2 *= tx2;
    tx2 *= 1.0 + shimmer * 0.5 * sin(t * 9.0 + io * 5.0);
    tx += d0 * tx2;
    float a = 0.1 * d0 - 0.4 * t;
    uv2 = mix(uv2 * 1.2 - 0.5 * turb, uv + 0.8 * vec2(cos(a), sin(a)) + turb, turb);
  }
  return tx;
}

void main() {
  float t = time;
  float turb = turbulence;

  vec2 uv = vec2(
    (vUv.x - 0.5) * viewSize.x,
    (0.5 - vUv.y) * viewSize.y
  ) / viewSize.y;
  uv /= max(scale, 0.001);
  uv.y += 0.02 * cos(t);
  uv *= 1.0 - 0.4 * turb;
  float r = length(uv);

  float d0 = exp(mix(0.3, 0.5, turb) - mix(spread, 4.0, turb) * sqrt(abs(radius + 0.02 - r)));
  float scroll = mod(0.15 * t, TILE);

  vec3 tx;
  if (symmetry < 0.001) {
    tx = filaments(uv, t, d0, scroll);
  } else if (symmetry > 0.999) {
    tx = filaments(vec2(abs(uv.x), uv.y), t, d0, scroll);
  } else {
    tx = mix(filaments(uv, t, d0, scroll), filaments(vec2(abs(uv.x), uv.y), t, d0, scroll), symmetry);
  }

  vec3 d = abs(0.04 * turb + radius + dispersion * tx - r);

  float th = max(thickness, 0.1);
  vec3 col = mix(color, secondaryColor, 2.5 * d / th) * exp(0.45 - (3.0 / th) * sqrt(d));
  col = max(col, 0.0);

  if (core > 0.001) {
    float inner = 1.0 - smoothstep(radius * 0.35, radius * 0.95, r);
    vec2 cp = uv * rot(0.15 * t);
    float n1 = valueNoise(cp * 0.6 + mod(0.05 * t, TILE));
    float n2 = valueNoise(cp * 1.1 - mod(0.07 * t, TILE));
    float churn = n1 * n2;
    col += mix(color, secondaryColor, 0.5) * core * inner * churn * churn * 0.6;
  }

  if (rippleStrength > 0.0) {
    float p = rippleProgress;
    float rippleRadius = radius + 0.02 + p * 0.5;
    float width = 0.012 + 0.03 * p;
    float fade = (1.0 - p) * (1.0 - p) * smoothstep(0.0, 0.08, p);
    float x = (r - rippleRadius) / width;
    col += color * exp(-x * x) * fade * rippleStrength * 0.6;
  }

  col *= brightness;
  float luminance = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luminance), col, saturation);
  col = clamp(col * intensity, 0.0, 1.0);

  float alpha = max(col.r, max(col.g, col.b));
  if (alpha < 0.001) {
    fragColor = vec4(0.0);
    return;
  }
  fragColor = vec4(col / alpha, alpha);
}
`;

/** The look contract, mirrored from @native-springs/shaders orbLook.ts. */
export interface OrbLook {
  radius: number;
  breathAmount: number;
  breathPeriod: number;
  thickness: number;
  dispersion: number;
  spread: number;
  turbulence: number;
  chromatic: number;
  shimmer: number;
  symmetry: number;
  core: number;
  brightness: number;
  saturation: number;
  motion: number;
  speaking: number;
}

export const IDLE_LOOK: OrbLook = {
  radius: 0.23, breathAmount: 0.012, breathPeriod: 5.0, thickness: 1.0,
  dispersion: 1.0, spread: 14.0, turbulence: 0.15, chromatic: 1.25,
  shimmer: 0.1, symmetry: 0.0, core: 0.0, brightness: 1.0, saturation: 1.0,
  motion: 0.75, speaking: 0.0,
};

/** composeOrbLook(idle→'thinking'): center churns, dispersion turbulent. */
export const BUSY_LOOK: OrbLook = {
  ...IDLE_LOOK,
  core: 1.0, turbulence: 0.35, chromatic: 1.5, dispersion: 1.25,
  shimmer: 0.15, motion: 1.08, breathPeriod: 3.75,
};

/** Pa'Casa pair: calm carolina ring, royal-blue fringe. */
export const ORB_COLOR: [number, number, number] = [0.31, 0.72, 0.96];
export const ORB_SECONDARY: [number, number, number] = [0.56, 0.44, 0.91];

/**
 * New-Siri palette drift: two stop lists cycled on different periods so the
 * ring and its fringe slide through blue → violet → pink → peach against each
 * other, the way the Siri edge glow flows rather than sits on fixed hues.
 */
export const SIRI_PRIMARY: readonly (readonly [number, number, number])[] = [
  [0.36, 0.7, 1.0], [0.62, 0.45, 1.0], [1.0, 0.42, 0.68],
  [1.0, 0.62, 0.34], [0.36, 0.7, 1.0],
];
export const SIRI_SECONDARY: readonly (readonly [number, number, number])[] = [
  [0.56, 0.42, 0.94], [1.0, 0.38, 0.6], [0.42, 0.8, 1.0],
  [0.74, 0.52, 1.0], [0.56, 0.42, 0.94],
];

/** Smoothstep through a closed stop list; `phase` wraps at list length − 1. */
export function siriPalette(
  stops: readonly (readonly [number, number, number])[],
  phase: number,
): [number, number, number] {
  const span = stops.length - 1;
  const x = ((phase % span) + span) % span;
  const i = Math.min(Math.floor(x), span - 1);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return [
    a[0] + (b[0] - a[0]) * s,
    a[1] + (b[1] - a[1]) * s,
    a[2] + (b[2] - a[2]) * s,
  ];
}
