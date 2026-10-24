import { useEffect, useRef } from 'react';

/*
 * "Pattern refraction" glass from the Figma file (custom shader effect, Lenticular pattern).
 * Figma's own runtime needs HTML-in-Canvas + WebGPU, which ordinary browsers don't ship yet,
 * so this is the same shader math ported to WebGL2. It refracts a snapshot of what sits
 * behind the glass (drawn by `paintBackdrop`) instead of live DOM.
 *
 * Figma params: patternType 0 (lenticular), amount 100, seamlessness 0, frost 0,
 * iorDispersion 4, centerHandle { x: 50, y: 50, radius: 11.47, angle: 49.1 }, pixelWrapMode 0.
 */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uDims;        // css px
uniform float uScale;      // device px per css px
uniform vec2 uCenter;      // css px
uniform float uAngle;
uniform float uSize;
uniform float uAmount;
uniform float uSeam;
uniform float uIor;
uniform int uSamples;
out vec4 outColor;
const float PI = 3.14159265358979;

float patternHeight(vec2 p, mat2 rot, float invSize) {
  vec2 pos = p - uCenter;
  pos = rot * pos;
  pos *= invSize;
  vec2 gridPos = fract(pos) * 2.0 - 1.0;
  float h = pow(sin((gridPos.x * 0.5 + 0.5) * PI), 0.7);
  h = clamp(h, 0.0, 1.0);
  h *= pow(h, uSeam);
  return h;
}
vec3 patternNormals(vec2 p, mat2 rot, float invSize) {
  float h = patternHeight(p, rot, invSize);
  float h1 = patternHeight(p + vec2(0.125, 0.0), rot, invSize);
  float v1 = patternHeight(p + vec2(0.0, 0.125), rot, invSize);
  return normalize(vec3(h - vec2(h1, v1), 0.0125));
}
vec4 sampleZero(vec2 px) {
  vec2 uv = px / uDims;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uTex, uv);
}
void main() {
  vec2 localPos = vec2(gl_FragCoord.x, uDims.y * uScale - gl_FragCoord.y) / uScale;
  float c = cos(uAngle), s = sin(uAngle);
  mat2 rot = mat2(c, s, -s, c);
  float invSize = 1.0 / uSize;
  vec3 ray = vec3(0.0, 0.0, -1.0);
  float iorR = 1.333 + uIor, iorG = 1.333, iorB = 1.333 - uIor;
  vec4 acc = vec4(0.0);
  float n = float(uSamples);
  for (int i = 0; i < 6; i++) {
    if (i >= uSamples) break;
    for (int j = 0; j < 6; j++) {
      if (j >= uSamples) break;
      vec2 off = vec2(float(i), float(j)) / n - (n - 1.0) / n * 0.5;
      vec3 nor = patternNormals(localPos + off / uScale, rot, invSize);
      vec3 rR = refract(ray, nor, iorR);
      vec3 rG = refract(ray, nor, iorG);
      vec3 rB = refract(ray, nor, iorB);
      acc.r += sampleZero(localPos + rR.xy * uAmount).r;
      vec4 g = sampleZero(localPos + rG.xy * uAmount);
      acc.g += g.g;
      acc.a += g.a;
      acc.b += sampleZero(localPos + rB.xy * uAmount).b;
    }
  }
  vec4 col = acc / (n * n);
  outColor = vec4(col.rgb, col.a);
}`;

const PARAMS = { amount: 100, seamlessness: 0, iorDispersion: 4, radius: 11.473249435424805, angle: 49.10326385498047 };

export default function GlassRefraction({ width, height, paintBackdrop, pointer, className = '' }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const pointerRef = useRef(pointer);
  pointerRef.current = pointer;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true, antialias: false });
    if (!gl) return undefined;
    const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    const tex = gl.createTexture();
    const backdrop = document.createElement('canvas');
    const u = n => gl.getUniformLocation(prog, n);
    const state = { gl, prog, buf, loc, tex, backdrop, u, ready: false, raf: 0, samples: 6 };
    glRef.current = state;

    const draw = () => {
      state.raf = 0;
      if (!state.ready) return;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth || width;
      const H = canvas.clientHeight || height;
      const k = W / width; // design → css px
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const p = pointerRef.current || { x: 0.5, y: 0.5 };
      // The pattern centre drifts a little with the cursor/finger so the stripes come alive.
      const cx = (0.5 + (p.x - 0.5) * 0.18) * W;
      const cy = (0.5 + (p.y - 0.5) * 0.18) * H;
      gl.uniform1i(u('uTex'), 0);
      gl.uniform2f(u('uDims'), W, H);
      gl.uniform1f(u('uScale'), scale);
      gl.uniform2f(u('uCenter'), cx, cy);
      gl.uniform1f(u('uAngle'), (-PARAMS.angle * Math.PI) / 180);
      gl.uniform1f(u('uSize'), (20 + (PARAMS.radius / 100) * 980) * k);
      gl.uniform1f(u('uAmount'), PARAMS.amount * 10 * k);
      gl.uniform1f(u('uSeam'), Math.max(PARAMS.seamlessness / 100, 0.001));
      gl.uniform1f(u('uIor'), (PARAMS.iorDispersion / 100) * 0.25);
      gl.uniform1i(u('uSamples'), state.samples);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    state.request = (samples = 6) => {
      state.samples = samples;
      if (!state.raf) state.raf = requestAnimationFrame(draw);
    };

    const rebuild = async () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth || width;
      const H = canvas.clientHeight || height;
      canvas.width = Math.round(W * scale);
      canvas.height = Math.round(H * scale);
      backdrop.width = canvas.width;
      backdrop.height = canvas.height;
      const ctx = backdrop.getContext('2d');
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      await paintBackdrop(ctx);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backdrop);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      state.ready = true;
      state.request(6);
    };

    const ro = new ResizeObserver(() => rebuild());
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(state.raf);
      glRef.current = null;
    };
  }, [width, height, paintBackdrop]);

  // Re-render when the pointer moves (cheaper sampling while moving, full quality at rest).
  useEffect(() => {
    const s = glRef.current;
    if (!s) return undefined;
    s.request(pointer ? 3 : 6);
    if (!pointer) return undefined;
    const t = setTimeout(() => s.request(6), 180);
    return () => clearTimeout(t);
  }, [pointer]);

  return <canvas ref={canvasRef} className={`glass-refraction ${className}`.trim()} aria-hidden="true" />;
}
