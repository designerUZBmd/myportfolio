"use client";

import React, { useEffect, useRef } from "react";

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 position;
out vec2 vTextureCoord;

void main() {
  vTextureCoord = (position + 1.0) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform int uBlendMode;

uniform vec2 uPos;
uniform float uGridScale;
uniform float uTraceWidth;
uniform vec3 uTraceColor;
uniform vec3 uPulseColor;
uniform float uPulseSpeed;
uniform float uPulseDensity;
uniform float uGlowIntensity;
uniform float uOverlayOpacity;

out vec4 fragColor;

vec3 blend(int blendMode, vec3 src, vec3 dst) {
    if(blendMode == 0) return src;
    if(blendMode == 1) return src + dst;
    if(blendMode == 2) return src - dst;
    if(blendMode == 3) return src * dst;
    if(blendMode == 4) return 1.0 - (1.0 - src) * (1.0 - dst);
    if(blendMode == 5) {
      return vec3(
        (dst.x <= 0.5) ? (2.0 * src.x * dst.x) : (1.0 - 2.0 * (1.0 - dst.x) * (1.0 - src.x)),
        (dst.y <= 0.5) ? (2.0 * src.y * dst.y) : (1.0 - 2.0 * (1.0 - dst.y) * (1.0 - src.y)),
        (dst.z <= 0.5) ? (2.0 * src.z * dst.z) : (1.0 - 2.0 * (1.0 - dst.z) * (1.0 - src.z))
      );
    }
    if(blendMode == 6) return min(src, dst);
    if(blendMode == 7) return max(src, dst);
    if(blendMode == 8) {
      return vec3(
        (src.x == 1.0) ? 1.0 : min(1.0, dst.x / (1.0 - src.x)),
        (src.y == 1.0) ? 1.0 : min(1.0, dst.y / (1.0 - src.y)),
        (src.z == 1.0) ? 1.0 : min(1.0, dst.z / (1.0 - src.z))
      );
    }
    if(blendMode == 9) {
      return vec3(
        (src.x == 0.0) ? 0.0 : (1.0 - ((1.0 - dst.x) / src.x)),
        (src.y == 0.0) ? 0.0 : (1.0 - ((1.0 - dst.y) / src.y)),
        (src.z == 0.0) ? 0.0 : (1.0 - ((1.0 - dst.z) / src.z))
      );
    }
    if(blendMode == 10) return (src + dst) - 1.0;
    if(blendMode == 11) {
      return vec3(
        (src.x <= 0.5) ? (2.0 * src.x * dst.x) : (1.0 - 2.0 * (1.0 - src.x) * (1.0 - dst.x)),
        (src.y <= 0.5) ? (2.0 * src.y * dst.y) : (1.0 - 2.0 * (1.0 - src.y) * (1.0 - dst.y)),
        (src.z <= 0.5) ? (2.0 * src.z * dst.z) : (1.0 - 2.0 * (1.0 - src.z) * (1.0 - dst.z))
      );
    }
    if(blendMode == 12) {
      return vec3(
        (src.x <= 0.5) ? (dst.x - (1.0 - 2.0 * src.x) * dst.x * (1.0 - dst.x)) : (((src.x > 0.5) && (dst.x <= 0.25)) ? (dst.x + (2.0 * src.x - 1.0) * (4.0 * dst.x * (4.0 * dst.x + 1.0) * (dst.x - 1.0) + 7.0 * dst.x)) : (dst.x + (2.0 * src.x - 1.0) * (sqrt(dst.x) - dst.x))),
        (src.y <= 0.5) ? (dst.y - (1.0 - 2.0 * src.y) * dst.y * (1.0 - dst.y)) : (((src.y > 0.5) && (dst.y <= 0.25)) ? (dst.y + (2.0 * src.y - 1.0) * (4.0 * dst.y * (4.0 * dst.y + 1.0) * (dst.y - 1.0) + 7.0 * dst.y)) : (dst.y + (2.0 * src.y - 1.0) * (sqrt(dst.y) - dst.y))),
        (src.z <= 0.5) ? (dst.z - (1.0 - 2.0 * src.z) * dst.z * (1.0 - dst.z)) : (((src.z > 0.5) && (dst.z <= 0.25)) ? (dst.z + (2.0 * src.z - 1.0) * (4.0 * dst.z * (4.0 * dst.z + 1.0) * (dst.z - 1.0) + 7.0 * dst.z)) : (dst.z + (2.0 * src.z - 1.0) * (sqrt(dst.z) - dst.z)))
      );
    }
    if(blendMode == 13) return abs(dst - src);
    if(blendMode == 14) return src + dst - 2.0 * src * dst;
    if(blendMode == 15) return 2.0 * src + dst - 1.0;
    if(blendMode == 16) {
      return vec3(
        (src.x > 0.5) ? max(dst.x, 2.0 * (src.x - 0.5)) : min(dst.x, 2.0 * src.x),
        (src.y > 0.5) ? max(dst.y, 2.0 * (src.y - 0.5)) : min(dst.y, 2.0 * src.y),
        (src.z > 0.5) ? max(dst.z, 2.0 * (src.z - 0.5)) : min(dst.z, 2.0 * src.z)
      );
    }
    if(blendMode == 17) {
      return vec3(
        (src.x <= 0.5) ? (1.0 - (1.0 - dst.x) / (2.0 * src.x)) : (dst.x / (2.0 * (1.0 - src.x))),
        (src.y <= 0.5) ? (1.0 - (1.0 - dst.y) / (2.0 * src.y)) : (dst.y / (2.0 * (1.0 - src.y))),
        (src.z <= 0.5) ? (1.0 - (1.0 - dst.z) / (2.0 * src.z)) : (dst.z / (2.0 * (1.0 - src.z)))
      );
    }
    return src;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float sdSegmentT(vec2 p, vec2 a, vec2 b, out float t) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float d2 = dot(ba, ba);
  t = (d2 > 0.00001) ? clamp(dot(pa, ba) / d2, 0.0, 1.0) : 0.0;
  return length(pa - ba * t);
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float edgeH(vec2 c) {
  return step(0.38, hash21(vec2(c.x + 0.5, c.y) * 1.73 + 12.4));
}
float edgeV(vec2 c) {
  return step(0.38, hash21(vec2(c.x, c.y + 0.5) * 2.31 + 47.9));
}

void main() {
  vec2 uv = vTextureCoord;
  vec4 bg = texture(uTexture, uv);

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - uPos);
  p.x *= aspect;

  float baseGrid = mix(14.0, 34.0, clamp(uGridScale, 0.0, 1.0));
  vec2 gridP = p * baseGrid;

  vec2 cellId = floor(gridP);
  vec2 localP = fract(gridP) - 0.5;

  float pixelSize = baseGrid / min(uResolution.x, uResolution.y);
  float halfWidth = mix(0.012, 0.045, clamp(uTraceWidth, 0.0, 1.0));

  float minTraceDist = 1e5;
  float minViaDist = 1e5;
  float minViaHole = 1e5;
  float pulseAccum = 0.0;

  float canonicalTime = uTime * 0.05;
  float pSpeed = mix(0.8, 3.5, clamp(uPulseSpeed, 0.0, 1.0));
  float pDensity = mix(0.8, 3.0, clamp(uPulseDensity, 0.0, 1.0));

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = cellId + vec2(float(i), float(j));
      vec2 offset = vec2(float(i), float(j));
      vec2 lp = localP - offset;

      float hasE = edgeH(c);
      float hasW = edgeH(c - vec2(1.0, 0.0));
      float hasN = edgeV(c);
      float hasS = edgeV(c - vec2(0.0, 1.0));

      float connCount = hasE + hasW + hasN + hasS;
      float cellSeed = hash21(c * 3.17 + 89.2);

      vec2 ptC = vec2(0.0);
      vec2 ptE = vec2(0.5, 0.0);
      vec2 ptW = vec2(-0.5, 0.0);
      vec2 ptN = vec2(0.0, 0.5);
      vec2 ptS = vec2(0.0, -0.5);

      bool cornerChamfer = false;
      if (connCount == 2.0) {
        float segT = 0.0;
        if (hasN > 0.5 && hasE > 0.5) {
          cornerChamfer = true;
          vec2 bendPt = vec2(0.18, 0.18);
          float d1 = sdSegmentT(lp, ptN, bendPt, segT);
          float d2 = sdSegmentT(lp, bendPt, ptE, segT);
          minTraceDist = min(minTraceDist, min(d1, d2));
        } else if (hasN > 0.5 && hasW > 0.5) {
          cornerChamfer = true;
          vec2 bendPt = vec2(-0.18, 0.18);
          float d1 = sdSegmentT(lp, ptN, bendPt, segT);
          float d2 = sdSegmentT(lp, bendPt, ptW, segT);
          minTraceDist = min(minTraceDist, min(d1, d2));
        } else if (hasS > 0.5 && hasE > 0.5) {
          cornerChamfer = true;
          vec2 bendPt = vec2(0.18, -0.18);
          float d1 = sdSegmentT(lp, ptS, bendPt, segT);
          float d2 = sdSegmentT(lp, bendPt, ptE, segT);
          minTraceDist = min(minTraceDist, min(d1, d2));
        } else if (hasS > 0.5 && hasW > 0.5) {
          cornerChamfer = true;
          vec2 bendPt = vec2(-0.18, -0.18);
          float d1 = sdSegmentT(lp, ptS, bendPt, segT);
          float d2 = sdSegmentT(lp, bendPt, ptW, segT);
          minTraceDist = min(minTraceDist, min(d1, d2));
        }
      }

      if (!cornerChamfer) {
        if (hasE > 0.5) {
          float segT = 0.0;
          float d = sdSegmentT(lp, ptE, ptC, segT);
          minTraceDist = min(minTraceDist, d);
          if (cellSeed > 0.4) {
            float phase = cellSeed * 6.28 + canonicalTime * pSpeed;
            float pulseWave = fract(segT * pDensity - phase);
            pulseAccum += exp(-32.0 * pulseWave * pulseWave) * smoothstep(halfWidth * 2.5, 0.0, d);
          }
        }
        if (hasW > 0.5) {
          float segT = 0.0;
          float d = sdSegmentT(lp, ptW, ptC, segT);
          minTraceDist = min(minTraceDist, d);
          if (cellSeed > 0.3) {
            float phase = cellSeed * 5.12 + canonicalTime * pSpeed;
            float pulseWave = fract(segT * pDensity - phase);
            pulseAccum += exp(-32.0 * pulseWave * pulseWave) * smoothstep(halfWidth * 2.5, 0.0, d);
          }
        }
        if (hasN > 0.5) {
          float segT = 0.0;
          float d = sdSegmentT(lp, ptN, ptC, segT);
          minTraceDist = min(minTraceDist, d);
          if (cellSeed > 0.5) {
            float phase = cellSeed * 4.31 + canonicalTime * pSpeed;
            float pulseWave = fract(segT * pDensity - phase);
            pulseAccum += exp(-32.0 * pulseWave * pulseWave) * smoothstep(halfWidth * 2.5, 0.0, d);
          }
        }
        if (hasS > 0.5) {
          float segT = 0.0;
          float d = sdSegmentT(lp, ptS, ptC, segT);
          minTraceDist = min(minTraceDist, d);
          if (cellSeed > 0.45) {
            float phase = cellSeed * 7.19 + canonicalTime * pSpeed;
            float pulseWave = fract(segT * pDensity - phase);
            pulseAccum += exp(-32.0 * pulseWave * pulseWave) * smoothstep(halfWidth * 2.5, 0.0, d);
          }
        }
      }

      bool placeVia = (connCount == 1.0) || (connCount >= 3.0) || (connCount == 0.0 && cellSeed > 0.78);
      if (placeVia) {
        float dCenter = length(lp);
        minViaDist = min(minViaDist, dCenter);
        minViaHole = min(minViaHole, dCenter);
      }
    }
  }

  vec2 busP = p * (baseGrid * 0.5);
  vec2 busCell = floor(busP);
  vec2 busLocal = fract(busP) - 0.5;
  float busHash = hash21(busCell + 11.0);
  if (busHash > 0.65) {
    float line1 = abs(busLocal.y - 0.18);
    float line2 = abs(busLocal.y);
    float line3 = abs(busLocal.y + 0.18);
    float busD = min(min(line1, line2), line3);
    minTraceDist = min(minTraceDist, busD * 0.5);
  }

  vec2 icP = p * (baseGrid * 0.25);
  vec2 icCell = floor(icP);
  vec2 icLocal = fract(icP) - 0.5;
  float icHash = hash21(icCell + 93.7);
  if (icHash > 0.82) {
    float chipBox = abs(sdBox(icLocal, vec2(0.22, 0.22))) - 0.015;
    minTraceDist = min(minTraceDist, chipBox * 0.25);
  }

  float aa = max(pixelSize * 1.5, 0.002);
  float traceAlpha = 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, minTraceDist);

  float viaOuterR = halfWidth * 2.8;
  float viaHoleR = halfWidth * 1.1;
  float viaPadAlpha = 1.0 - smoothstep(viaOuterR - aa, viaOuterR + aa, minViaDist);
  float viaHoleMask = smoothstep(viaHoleR - aa, viaHoleR + aa, minViaHole);
  float viaAlpha = viaPadAlpha * viaHoleMask;

  float passiveAlpha = clamp(max(traceAlpha, viaAlpha), 0.0, 1.0);

  float pulseClamp = clamp(pulseAccum, 0.0, 1.0);
  float glowRadius = halfWidth * mix(4.0, 16.0, clamp(uGlowIntensity, 0.0, 1.0));
  float softGlow = exp(-minTraceDist / max(glowRadius, 0.001)) * pulseClamp;

  float viaPulse = smoothstep(0.3, 0.8, pulseClamp) * viaPadAlpha * 0.6;

  vec3 traceCol = uTraceColor;
  vec3 pulseCol = uPulseColor;

  vec3 circuitRgb = mix(traceCol, pulseCol, pulseClamp);
  circuitRgb += pulseCol * (softGlow * uGlowIntensity * 1.5 + viaPulse);

  float totalAlpha = clamp(passiveAlpha * 0.65 + pulseClamp + softGlow * uGlowIntensity * 0.8, 0.0, 1.0);

  vec3 blended;
  if (uBlendMode > 0) {
    blended = blend(uBlendMode, circuitRgb, bg.rgb);
  } else {
    blended = circuitRgb;
  }

  float finalMix = totalAlpha * clamp(uOverlayOpacity, 0.0, 1.0);
  fragColor = vec4(mix(bg.rgb, blended, finalMix), max(bg.a, finalMix));
}
`;

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.warn("WebGL 2 not supported for CircuitBackground");
      return;
    }

    // Compile helper
    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen quad buffer
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Dummy 1x1 transparent texture for uTexture
    const dummyTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dummyTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );

    // Uniform locations
    const locRes = gl.getUniformLocation(program, "uResolution");
    const locTime = gl.getUniformLocation(program, "uTime");
    const locBlend = gl.getUniformLocation(program, "uBlendMode");
    const locPos = gl.getUniformLocation(program, "uPos");
    const locScale = gl.getUniformLocation(program, "uGridScale");
    const locWidth = gl.getUniformLocation(program, "uTraceWidth");
    const locTraceCol = gl.getUniformLocation(program, "uTraceColor");
    const locPulseCol = gl.getUniformLocation(program, "uPulseColor");
    const locPulseSpeed = gl.getUniformLocation(program, "uPulseSpeed");
    const locPulseDens = gl.getUniformLocation(program, "uPulseDensity");
    const locGlow = gl.getUniformLocation(program, "uGlowIntensity");
    const locOpacity = gl.getUniformLocation(program, "uOverlayOpacity");
    const locTex = gl.getUniformLocation(program, "uTexture");

    gl.uniform1i(locTex, 0);
    gl.uniform1i(locBlend, 0);
    gl.uniform1f(locScale, 0.42); // Balanced circuit scale
    gl.uniform1f(locWidth, 0.16); // Refined, clean copper traces
    // Deep slate blue passive traces that stay dark & elegant
    gl.uniform3f(locTraceCol, 0.05, 0.12, 0.18);
    // Cyan electric brand blue (#82D9FF) for glowing data packets
    gl.uniform3f(locPulseCol, 0.51, 0.85, 1.0);
    gl.uniform1f(locPulseSpeed, 0.65);
    gl.uniform1f(locPulseDens, 0.55);
    gl.uniform1f(locGlow, 0.75);
    gl.uniform1f(locOpacity, 0.6); // Subtle overlay so 3D model & logo pop

    let mousePos = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth <= 992) return;
      const normX = e.clientX / window.innerWidth;
      const normY = 1.0 - e.clientY / window.innerHeight;
      mousePos.targetX = 0.5 + (normX - 0.5) * 0.08;
      mousePos.targetY = 0.5 + (normY - 0.5) * 0.08;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize handling
    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || window.innerWidth * 0.28;
      const h = parent?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(locRes, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Render loop
    let animId: number;
    const startTime = performance.now();

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      // Performance guard: pause if tab is hidden or sidebar is hidden on mobile/tablet
      if (document.hidden || !canvas || canvas.clientWidth === 0) {
        return;
      }

      const elapsed = (now - startTime) * 0.001;

      mousePos.x += (mousePos.targetX - mousePos.x) * 0.05;
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.05;

      gl.uniform1f(locTime, elapsed);
      gl.uniform2f(locPos, mousePos.x, mousePos.y);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);

      gl.deleteTexture(dummyTex);
      gl.deleteBuffer(posBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="circuit-bg-canvas"
      aria-hidden="true"
    />
  );
}
