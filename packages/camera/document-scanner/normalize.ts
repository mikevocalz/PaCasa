import type { ImageBuffer } from 'react-native-executorch/cv';

interface NativePixels {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  pixelFormat: string;
}

const CHANNELS: Readonly<Record<string, readonly number[]>> = {
  RGBA: [0, 1, 2], BGRA: [2, 1, 0],
  ARGB: [1, 2, 3], ABGR: [3, 2, 1],
  RGBX: [0, 1, 2], BGRX: [2, 1, 0],
  XRGB: [1, 2, 3], XBGR: [3, 2, 1],
  RGB: [0, 1, 2], BGR: [2, 1, 0],
};

/** Convert NitroImage physical pixel channels to ExecuTorch RGB (never assume iOS BGRA == Android RGBA). */
export function toOcrImageBuffer(raw: NativePixels): ImageBuffer {
  const channels = CHANNELS[raw.pixelFormat];
  const stride = raw.pixelFormat === 'RGB' || raw.pixelFormat === 'BGR' ? 3 : 4;
  if (!channels || !Number.isInteger(raw.width) || !Number.isInteger(raw.height) ||
      raw.width <= 0 || raw.height <= 0 || raw.width * raw.height > 12_000_000) {
    throw new Error('Formato o resolución de imagen no compatible.');
  }
  const src = new Uint8Array(raw.buffer);
  if (src.length !== raw.width * raw.height * stride) throw new Error('Longitud de píxeles incorrecta.');
  const dst = new Uint8Array(raw.width * raw.height * 3);
  for (let p = 0, o = 0; p < src.length; p += stride, o += 3) {
    dst[o] = src[p + channels[0]];
    dst[o + 1] = src[p + channels[1]];
    dst[o + 2] = src[p + channels[2]];
  }
  return { data: dst, width: raw.width, height: raw.height, layout: 'hwc', format: 'rgb' };
}
