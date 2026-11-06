import { useEffect, useRef } from 'react';

/*
 * Figma V4 hero: the blue blob (Vector 107:846) with Figma's Glass effect
 * (refraction 0.8, depth 62, dispersion 0.5, frost 7, light -45°, intensity 0.8) and a 20% #7DA7D9 fill.
 * Browsers can't refract live DOM inside an arbitrary shape, so this refracts a snapshot of what sits
 * behind it (drawn by `paintBackdrop`) in WebGL. The bevel comes from a blurred copy of the shape:
 * only a thin band at the edge bends the light; the pane itself stays flat (no bulge, no volume).
 */
export const BLOB_PATH =
  'M320.321 290.794C316.178 308.789 283.572 295.16 273.407 288.206L216.403 249.246C221.639 264.17 220.597 296.759 206.39 297.343C187.457 298.104 181.408 273.18 174.216 258.13C148.04 306.073 114.341 377.012 83.2594 374.956C49.9925 372.748 81.6838 276.607 112.918 217.546C65.1393 239.475 7.98325 264.855 0.359057 239.576C-1.34368 233.942 3.18001 221.252 10.3213 216.506L87.4019 165.288C58.2521 153.587 26.8658 148.333 24.1465 128.003C21.4272 107.674 54.2621 112.217 95.3819 113.08C74.4408 70.3135 42.3684 17.3696 60.7935 3.23266C80.8959 -12.1987 113.121 30.5168 139.653 69.9328C146.489 40.7451 146.616 5.2631 164.889 1.12607C186.669 -3.82314 184.178 38.5878 201.079 63.5369C208.118 55.212 231.525 35.5675 241.843 42.7756C254.855 51.8618 244.994 74.5266 241.36 91.8616C281.641 74.8312 336.662 55.7958 351.555 74.7805C365.278 92.293 318.822 135.592 272.517 153.283C292.315 169.196 317.297 168.739 316.992 184.018C316.839 191.582 312.493 198.13 302.328 198.79L259.836 201.582C283.394 226.175 317.398 250.186 320.321 290.794Z';
export const BLOB = { w: 354, h: 375 };

const GLASS = { refraction: 0.8, depth: 62, dispersion: 0.5, frost: 7, light: -45, intensity: 0.8, tint: [125 / 255, 167 / 255, 217 / 255], tintAlpha: 0.2 };

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uBack;   // what sits behind, sharp
uniform sampler2D uShape;  // r: sharp shape mask, g: blurred shape (height)
uniform vec2 uSize;        // design px
uniform float uAmount;     // px of bend at the steepest edge
uniform float uDisp;
uniform float uFrost;      // px
uniform vec2 uLight;
uniform float uIntensity;
uniform vec3 uTint;
uniform float uTintA;
out vec4 outColor;

vec3 frosted(vec2 uv) {
  vec2 px = 1.0 / uSize;
  vec3 c = texture(uBack, uv).rgb * 0.2;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    vec2 o = vec2(cos(a), sin(a)) * px * uFrost;
    c += texture(uBack, uv + o).rgb * 0.055 + texture(uBack, uv + o * 0.5).rgb * 0.045;
  }
  return c;
}
void main() {
  vec4 s = texture(uShape, vUv);
  float m = s.r;
  if (m < 0.002) { outColor = vec4(0.0); return; }
  vec2 px = 1.0 / uSize;
  // A flat pane: only a thin band along the edge bends the light, the rest is clear frosted glass.
  float hx = texture(uShape, vUv + vec2(px.x, 0.0)).g - texture(uShape, vUv - vec2(px.x, 0.0)).g;
  float hy = texture(uShape, vUv + vec2(0.0, px.y)).g - texture(uShape, vUv - vec2(0.0, px.y)).g;
  vec2 g = vec2(hx, hy) * 0.5;
  float edge = clamp(length(g) * 9.0, 0.0, 1.0);
  vec2 dir = length(g) > 1e-5 ? normalize(g) : vec2(0.0);
  vec2 off = dir * edge * uAmount * px;
  vec3 col;
  col.r = frosted(vUv + off * (1.0 + uDisp * 0.1)).r;
  col.g = frosted(vUv + off).g;
  col.b = frosted(vUv + off * (1.0 - uDisp * 0.1)).b;
  col = mix(col, vec3(1.0), 0.2); // frosted, milky
  col = mix(col, uTint, uTintA);
  // A hairline of light on the edge facing the light (-45°), nothing that reads as volume.
  float lit = max(dot(-dir, uLight), 0.0);
  float rim = smoothstep(0.55, 1.0, edge);
  col += vec3(1.0) * rim * lit * 0.35 * uIntensity;
  outColor = vec4(clamp(col, 0.0, 1.0), m);
}`;

// 3 box passes ≈ gaussian, on a single 8-bit channel.
function blurChannel(src, w, h, r) {
  let a = Float32Array.from(src);
  let b = new Float32Array(a.length);
  const pass = (from, to, horizontal) => {
    const n = horizontal ? w : h;
    const lines = horizontal ? h : w;
    for (let l = 0; l < lines; l += 1) {
      let acc = 0;
      const at = i => from[horizontal ? l * w + Math.min(n - 1, Math.max(0, i)) : Math.min(n - 1, Math.max(0, i)) * w + l];
      for (let i = -r; i <= r; i += 1) acc += at(i);
      for (let i = 0; i < n; i += 1) {
        to[horizontal ? l * w + i : i * w + l] = acc / (2 * r + 1);
        acc += at(i + r + 1) - at(i - r);
      }
    }
  };
  for (let k = 0; k < 3; k += 1) { pass(a, b, true); pass(b, a, false); }
  return a;
}

export default function GlassBlob({ paintBackdrop, pointer, className = '' }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const pointerRef = useRef(pointer);
  pointerRef.current = pointer;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true });
    if (!gl) { canvas.dataset.fallback = ''; return undefined; }
    const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.dataset.fallback = ''; return undefined; }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    const u = n => gl.getUniformLocation(prog, n);
    const texBack = gl.createTexture();
    const texShape = gl.createTexture();
    const setTex = (tex, source) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    const state = { ready: false, raf: 0 };
    stateRef.current = state;

    const draw = () => {
      state.raf = 0;
      if (!state.ready) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texBack);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texShape);
      gl.uniform1i(u('uBack'), 0);
      gl.uniform1i(u('uShape'), 1);
      gl.uniform2f(u('uSize'), BLOB.w, BLOB.h);
      gl.uniform1f(u('uAmount'), GLASS.refraction * 10);
      gl.uniform1f(u('uDisp'), GLASS.dispersion);
      gl.uniform1f(u('uFrost'), GLASS.frost);
      // The light swings a little with the cursor/finger.
      const p = pointerRef.current;
      const a = ((GLASS.light - 90) * Math.PI) / 180 + (p ? (p.x - 0.5) * 0.9 : 0);
      gl.uniform2f(u('uLight'), Math.cos(a), Math.sin(a));
      gl.uniform1f(u('uIntensity'), GLASS.intensity);
      gl.uniform3f(u('uTint'), ...GLASS.tint);
      gl.uniform1f(u('uTintA'), GLASS.tintAlpha);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    state.request = () => { if (!state.raf) state.raf = requestAnimationFrame(draw); };

    const build = async () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * (canvas.clientWidth / BLOB.w || 1);
      const W = Math.max(1, Math.round(BLOB.w * scale));
      const H = Math.max(1, Math.round(BLOB.h * scale));
      canvas.width = W;
      canvas.height = H;
      const back = document.createElement('canvas');
      back.width = W; back.height = H;
      const bctx = back.getContext('2d');
      bctx.setTransform(W / BLOB.w, 0, 0, H / BLOB.h, 0, 0);
      await paintBackdrop(bctx);
      // Shape: sharp mask (antialiased) in R, a blurred copy (the bevel height) in G.
      const shape = document.createElement('canvas');
      shape.width = W; shape.height = H;
      const sctx = shape.getContext('2d');
      sctx.setTransform(W / BLOB.w, 0, 0, H / BLOB.h, 0, 0);
      sctx.fillStyle = '#fff';
      sctx.fill(new Path2D(BLOB_PATH));
      const img = sctx.getImageData(0, 0, W, H);
      const alpha = new Uint8ClampedArray(W * H);
      for (let i = 0; i < W * H; i += 1) alpha[i] = img.data[i * 4 + 3];
      const blurred = blurChannel(alpha, W, H, Math.max(1, Math.round(2.5 * (W / BLOB.w)))); // thin bevel: a flat pane
      for (let i = 0; i < W * H; i += 1) {
        img.data[i * 4] = alpha[i];
        img.data[i * 4 + 1] = blurred[i];
        img.data[i * 4 + 2] = 0;
        img.data[i * 4 + 3] = 255;
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      setTex(texBack, back);
      setTex(texShape, img);
      state.ready = true;
      state.request();
    };

    let t = 0;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(build, 60); });
    ro.observe(canvas);
    return () => { ro.disconnect(); clearTimeout(t); cancelAnimationFrame(state.raf); stateRef.current = null; };
  }, [paintBackdrop]);

  useEffect(() => { stateRef.current?.request?.(); }, [pointer]);

  return <canvas ref={canvasRef} className={`glass-blob ${className}`.trim()} aria-hidden="true" />;
}
