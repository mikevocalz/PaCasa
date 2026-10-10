'use client';

import { createElement, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useInstanceStore, useStore } from '@acme/ui';
import { Text, View } from '@acme/ui/tw';
import {
  BUSY_LOOK, IDLE_LOOK, ORB_FRAG, ORB_VERT,
  SIRI_PRIMARY, SIRI_SECONDARY, siriPalette, type OrbLook,
} from './orb-shader';

const UNIFORMS = [
  'time', 'intensity', 'viewSize', 'color', 'secondaryColor', 'scale',
  'radius', 'thickness', 'dispersion', 'spread', 'turbulence', 'chromatic',
  'shimmer', 'symmetry', 'core', 'brightness', 'saturation',
  'rippleProgress', 'rippleStrength',
] as const;

/**
 * The Pa'Casa shader orb on web: the same filament-ring GLSL native renders
 * through OrbOverlay, drawn with a raw WebGL2 context because the shared
 * ThreeCanvas uses WebGPURenderer, which cannot compile classic
 * ShaderMaterial. Falls back to a label where WebGL2 is unavailable.
 */
export function ChatOrb({ busy }: { busy: boolean }) {
  const status = useInstanceStore(() => ({ failed: false }));
  const failed = useStore(status, (s) => s.failed);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (Platform.OS !== 'web' || !canvas) return;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) {
      status.setState({ failed: true });
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('shader-alloc');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('shader-compile: ' + gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    let raf = 0;
    let program: WebGLProgram | null = null;
    let observer: ResizeObserver | null = null;
    try {
      program = gl.createProgram();
      if (!program) throw new Error('program-alloc');
      gl.attachShader(program, compile(gl.VERTEX_SHADER, ORB_VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, ORB_FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('program-link: ' + gl.getProgramInfoLog(program));
      }
      gl.useProgram(program);

      const location = gl.getAttribLocation(program, 'aPos');
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

      const u = new Map<string, WebGLUniformLocation | null>();
      for (const name of UNIFORMS) u.set(name, gl.getUniformLocation(program, name));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.uniform1f(u.get('intensity') ?? null, 1);
      gl.uniform1f(u.get('scale') ?? null, 1);
      gl.uniform1f(u.get('rippleProgress') ?? null, 0);
      gl.uniform1f(u.get('rippleStrength') ?? null, 0);

      const look: OrbLook = { ...IDLE_LOOK };
      let time = 0;
      let last = 0;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const draw = (now: number) => {
        const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
        last = now;
        const target = busyRef.current ? BUSY_LOOK : IDLE_LOOK;
        const ease = Math.min(1, delta * 3);
        (Object.keys(look) as (keyof OrbLook)[]).forEach((key) => {
          look[key] += (target[key] - look[key]) * ease;
        });
        time += delta * look.motion;
        const breath = Math.sin((2 * Math.PI * time) / Math.max(look.breathPeriod, 0.001));
        // Siri-style aurora: primary and fringe slide through their palettes
        // on different periods so the hues never sit still.
        const primary = siriPalette(SIRI_PRIMARY, time / 11);
        const secondary = siriPalette(SIRI_SECONDARY, time / 17 + 0.37);
        gl.uniform3f(u.get('color') ?? null, ...primary);
        gl.uniform3f(u.get('secondaryColor') ?? null, ...secondary);

        gl.uniform1f(u.get('time') ?? null, time);
        gl.uniform1f(u.get('radius') ?? null, look.radius + look.breathAmount * breath);
        gl.uniform1f(u.get('thickness') ?? null, Math.max(look.thickness, 0.1));
        gl.uniform1f(u.get('dispersion') ?? null, look.dispersion);
        gl.uniform1f(u.get('spread') ?? null, look.spread);
        gl.uniform1f(u.get('turbulence') ?? null, look.turbulence);
        gl.uniform1f(u.get('chromatic') ?? null, look.chromatic);
        gl.uniform1f(u.get('shimmer') ?? null, look.shimmer);
        gl.uniform1f(u.get('symmetry') ?? null, look.symmetry);
        gl.uniform1f(u.get('core') ?? null, look.core);
        gl.uniform1f(u.get('brightness') ?? null,
          Math.max(look.brightness * (1 + 4 * look.breathAmount * breath), 0));
        gl.uniform1f(u.get('saturation') ?? null, look.saturation);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!reduced) raf = requestAnimationFrame(draw);
      };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
        gl.uniform2f(u.get('viewSize') ?? null, canvas.clientWidth, canvas.clientHeight);
      };
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();
      raf = requestAnimationFrame(draw);
      if (reduced) draw(0);
    } catch (cause) {
      console.error('ChatOrb failed to initialise:', cause);
      status.setState({ failed: true });
    }
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      // Do NOT loseContext: getContext('webgl2') returns the same context on
      // StrictMode's remount, and a lost context compiles nothing.
      if (program) gl.deleteProgram(program);
    };
  }, [busyRef, status]);

  return (
    // Explicit height: the shared className map does not translate h-*
    // utilities on this path, so the stage collapsed to 0px on web.
    // The glow needs a dark stage even inside the daylit shell.
    <View style={{ height: 176 }} className="mx-auto w-full max-w-sm overflow-hidden rounded-soft border border-border bg-ink-950">
      {failed || Platform.OS !== 'web' ? (
        <View className="h-full items-center justify-center">
          <Text className="font-semibold text-royal-300">{busy ? 'Pa’Casa está pensando…' : 'Pa’Casa'}</Text>
        </View>
      ) : (
        createElement('canvas', {
          ref: canvasRef,
          role: 'img',
          'aria-label': busy ? 'Pa’Casa está pensando' : 'Orbe animado de Pa’Casa',
          style: { display: 'block', width: '100%', height: '100%' },
        })
      )}
    </View>
  );
}
