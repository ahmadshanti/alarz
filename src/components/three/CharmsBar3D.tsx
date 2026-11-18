"use client";

/**
 * Interactive, procedurally-built Al-Arz "Charms" ice cream bar.
 *
 * Realism: rounded "pillow" bar with an uneven glossy chocolate coating (clearcoat + bump),
 * a real bite showing the ice cream inside, toppings scattered on the coating surface,
 * and a wooden stick — lit by a studio environment rendered once.
 *
 * Performance: ~5k-vertex bar, instanced toppings, no real-time shadows, environment
 * rendered a single time, DPR capped (and lowered automatically if FPS drops), and the
 * render loop stops while the hero is off-screen. Loaded lazily (no SSR).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

/* ------------------------------------------------------------------ */
/* Flavour looks                                                        */
/* ------------------------------------------------------------------ */

interface Look {
  coat: string;
  inside: string;
  rough: number;
  clear: number;
  bits: { count: number; colors: string[]; size: [number, number]; squash: number };
}

const LOOKS: Record<string, Look> = {
  almonds: {
    coat: "#6e3c1f",
    inside: "#f3e2c0",
    rough: 0.34,
    clear: 0.75,
    bits: { count: 135, colors: ["#c8935a", "#b07a45", "#ddb07a", "#9c6535"], size: [0.022, 0.045], squash: 0.45 },
  },
  "double-chocolate": {
    coat: "#2d1408",
    inside: "#5b311b",
    rough: 0.26,
    clear: 1,
    bits: { count: 30, colors: ["#1b0b04", "#3a1a0b"], size: [0.03, 0.055], squash: 0.35 },
  },
  "cookies-cream": {
    coat: "#1b1615",
    inside: "#f3eee6",
    rough: 0.4,
    clear: 0.6,
    bits: { count: 135, colors: ["#0c0909", "#151111", "#0c0909", "#efe8dc"], size: [0.018, 0.04], squash: 0.4 },
  },
  "strawberry-white": {
    coat: "#f2e3c7",
    inside: "#f6d0d8",
    rough: 0.38,
    clear: 0.55,
    bits: { count: 55, colors: ["#e0405f", "#c92a4b", "#f07d93"], size: [0.024, 0.05], squash: 0.5 },
  },
};
const MAX_BITS = 140;
const ORBITERS = 14;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Subdivided box projected onto a rounded box; returns geometry with analytic normals. */
function roundedSlab(w: number, h: number, d: number, r: number, segs: [number, number, number]) {
  const g = new THREE.BoxGeometry(w, h, d, ...segs);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const hw = w / 2 - r,
    hh = h / 2 - r,
    hd = d / 2 - r;
  const v = new THREE.Vector3(),
    c = new THREE.Vector3(),
    n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    c.set(clamp(v.x, -hw, hw), clamp(v.y, -hh, hh), clamp(v.z, -hd, hd));
    n.subVectors(v, c);
    if (n.lengthSq() < 1e-10) n.fromBufferAttribute(nor, i);
    n.normalize();
    v.copy(c).addScaledVector(n, r);
    pos.setXYZ(i, v.x, v.y, v.z);
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}

/** The bar body: pillow shape, uneven coating, and a bite (aBite = 1 on the bitten surface). */
function buildBar() {
  const W = 1.04,
    H = 2.0,
    D = 0.56;
  const g = roundedSlab(W, H, D, 0.24, [26, 50, 14]);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const bite = new Float32Array(pos.count);
  const v = new THREE.Vector3(),
    n = new THREE.Vector3();

  // Two overlapping "teeth" spheres → scalloped bite on the top corner
  const bites = [
    { c: new THREE.Vector3(0.44, 1.02, 0), r: 0.4 },
    { c: new THREE.Vector3(0.08, 1.14, 0), r: 0.28 },
  ];

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);

    // pillow: thicker in the middle, slightly tapered towards the top
    const fx = v.x / (W / 2);
    v.z *= 1 + 0.16 * (1 - fx * fx);
    v.x *= 1 - 0.035 * (v.y / H);

    // uneven hand-dipped coating
    const wob =
      0.007 * Math.sin(v.x * 9.1 + v.y * 4.3) * Math.cos(v.y * 7.7 - v.z * 5.2) +
      0.004 * Math.sin(v.y * 23.0 + v.x * 11.0);
    v.addScaledVector(n, wob);

    for (let pass = 0; pass < 2; pass++) {
      for (const b of bites) {
        const dz = v.z - b.c.z;
        const dx = v.x - b.c.x,
          dy = v.y - b.c.y;
        if (dx * dx + dy * dy + dz * dz >= b.r * b.r) continue;
        const rr = Math.sqrt(Math.max(b.r * b.r - dz * dz, 0)) * 1.001;
        let len = Math.hypot(dx, dy);
        let ux = dx,
          uy = dy;
        if (len < 1e-5) {
          ux = 0.7;
          uy = 0.7;
          len = 1;
        }
        v.x = b.c.x + (ux / len) * rr;
        v.y = b.c.y + (uy / len) * rr;
        n.subVectors(b.c, v).normalize();
        bite[i] = 1;
      }
    }

    pos.setXYZ(i, v.x, v.y, v.z);
    nor.setXYZ(i, n.x, n.y, n.z);
  }

  g.setAttribute("aBite", new THREE.BufferAttribute(bite, 1));
  // sampling weight for toppings: coating only, not the bite, not the bottom
  const w = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) w[i] = bite[i] > 0 || pos.getY(i) < -0.92 ? 0 : 1;
  g.setAttribute("aWeight", new THREE.BufferAttribute(w, 1));
  g.computeBoundingSphere();
  return g;
}

/** Rocky chunk for nuts / crumbs (flat-shaded, consistent jitter so it stays watertight). */
function buildChunk() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const k = 1 + 0.22 * Math.sin(x * 12.9898 + y * 78.233 + z * 37.719);
    pos.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * Wooden stick textures with the Al-Arz logo engraved near the bottom.
 * Canvas has the same aspect as the stick face (0.34 × 1.3) so nothing is stretched.
 * The logo (public/logo.svg) is drawn once it loads: a burnt-in colour layer for the
 * colour map, and a recessed shape in the bump map so light catches the engraving.
 */
function buildStickTextures() {
  const W = 256,
    H = 980;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const woodC = make(),
    bumpC = make();
  const g = woodC.getContext("2d")!,
    b = bumpC.getContext("2d")!;

  // wood + grain
  const base = g.createLinearGradient(0, 0, W, 0);
  base.addColorStop(0, "#d4a670");
  base.addColorStop(0.5, "#e2bb86");
  base.addColorStop(1, "#d1a26b");
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  b.fillStyle = "#808080";
  b.fillRect(0, 0, W, H);
  const r = rng(3);
  for (let i = 0; i < 80; i++) {
    const x = r() * W;
    const a = 0.2 + r() * 0.35;
    const lw = 0.6 + r() * 2.2;
    const path = new Path2D();
    path.moveTo(x, 0);
    path.bezierCurveTo(x + r() * 10 - 5, H * 0.33, x + r() * 10 - 5, H * 0.66, x + r() * 8 - 4, H);
    g.strokeStyle = `rgba(${150 + r() * 30},${100 + r() * 20},${55 + r() * 15},${a})`;
    g.lineWidth = lw;
    g.stroke(path);
    b.strokeStyle = `rgba(100,100,100,${a * 0.6})`;
    b.lineWidth = lw;
    b.stroke(path);
  }

  const wood = new THREE.CanvasTexture(woodC);
  wood.colorSpace = THREE.SRGBColorSpace;
  wood.anisotropy = 4;
  const woodBump = new THREE.CanvasTexture(bumpC);

  const img = new Image();
  img.onload = () => {
    const LW = 852,
      LH = 436;
    const tint = (color: string) => {
      const c = document.createElement("canvas");
      c.width = LW;
      c.height = LH;
      const t = c.getContext("2d")!;
      t.drawImage(img, 0, 0, LW, LH);
      t.globalCompositeOperation = "source-in";
      t.fillStyle = color;
      t.fillRect(0, 0, LW, LH);
      return c;
    };
    // logo runs along the stick, reading bottom → top, centred in the lower part
    const len = 380,
      wid = (len * LH) / LW;
    const place = (ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, alpha: number, dx = 0, dy = 0) => {
      ctx.save();
      ctx.translate(W / 2 + dx, H - 90 - len / 2 + dy);
      ctx.rotate(-Math.PI / 2);
      ctx.globalAlpha = alpha;
      ctx.drawImage(src, -len / 2, -wid / 2, len, wid);
      ctx.restore();
    };
    place(g, tint("#f6dcb3"), 0.55, 1.5, 1.5); // lit lower lip of the cut
    place(g, tint("#6a3a17"), 0.9); // burnt engraving
    place(g, tint("#3d1f0b"), 0.35, -1, -1); // shadowed upper lip
    place(b, tint("#262626"), 1); // recessed in the bump map
    wood.needsUpdate = true;
    woodBump.needsUpdate = true;
  };
  img.src = "/logo.svg";

  return { wood, woodBump };
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export interface DragInput {
  dragging: boolean;
  pending: number;
  vel: number;
  tilt: number;
  hoverX: number;
  hoverY: number;
}

function Bar({ flavor, input }: { flavor: string; input: React.RefObject<DragInput> }) {
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const bits = useRef<THREE.InstancedMesh>(null);
  const orbit = useRef<THREE.InstancedMesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const pop = useRef(1);
  const lastFlavor = useRef(flavor);

  const barGeo = useMemo(buildBar, []);
  const stickGeo = useMemo(() => roundedSlab(0.34, 1.3, 0.07, 0.03, [6, 18, 2]), []);
  const chunkGeo = useMemo(buildChunk, []);

  const tex = useMemo(() => {
    const bump = canvasTexture(256, (g, s) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, s, s);
      const r = rng(7);
      for (let i = 0; i < 1400; i++) {
        const l = Math.floor(90 + r() * 80);
        g.fillStyle = `rgba(${l},${l},${l},0.35)`;
        g.beginPath();
        g.arc(r() * s, r() * s, 1 + r() * 4, 0, Math.PI * 2);
        g.fill();
      }
    });
    bump.repeat.set(2, 2);
    const { wood, woodBump } = buildStickTextures();
    const shadowTex = canvasTexture(128, (g, s) => {
      const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grd.addColorStop(0, "rgba(40,20,8,0.35)");
      grd.addColorStop(1, "rgba(40,20,8,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, s, s);
    });
    return { bump, wood, woodBump, shadowTex };
  }, []);

  const uniforms = useMemo(() => {
    const l = LOOKS[flavor] ?? LOOKS.almonds;
    return { uCoat: { value: new THREE.Color(l.coat) }, uInside: { value: new THREE.Color(l.inside) } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barMat = useMemo(() => {
    const l = LOOKS[flavor] ?? LOOKS.almonds;
    const m = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      roughness: l.rough,
      clearcoat: l.clear,
      clearcoatRoughness: 0.22,
      bumpMap: tex.bump,
      bumpScale: 2.2,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uCoat = uniforms.uCoat;
      shader.uniforms.uInside = uniforms.uInside;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aBite;\nvarying float vBite;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBite = aBite;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uCoat;\nuniform vec3 uInside;\nvarying float vBite;")
        .replace(
          "#include <color_fragment>",
          "#include <color_fragment>\nfloat bt = smoothstep(0.35, 0.65, vBite);\ndiffuseColor.rgb = mix(uCoat, uInside, bt);",
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.72, smoothstep(0.35, 0.65, vBite));",
        )
        .replace(
          "#include <lights_physical_fragment>",
          "#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= 1.0 - smoothstep(0.35, 0.65, vBite);\n#endif",
        );
    };
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, uniforms]);

  const sampler = useMemo(() => {
    const mesh = new THREE.Mesh(barGeo);
    return new MeshSurfaceSampler(mesh).setWeightAttribute("aWeight").build();
  }, [barGeo]);

  // Per-flavour topping layout (positions/rotations/scales kept for the pop animation)
  const layout = useMemo(() => {
    const l = LOOKS[flavor] ?? LOOKS.almonds;
    const r = rng(flavor.length * 97 + 11);
    const p = new THREE.Vector3(),
      n = new THREE.Vector3();
    const items: { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3; color: THREE.Color }[] = [];
    for (let i = 0; i < l.bits.count; i++) {
      sampler.sample(p, n);
      const s = l.bits.size[0] + r() * (l.bits.size[1] - l.bits.size[0]);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      quat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2));
      items.push({
        pos: p.clone().addScaledVector(n, s * 0.05),
        quat,
        scale: new THREE.Vector3(s * (0.8 + r() * 0.6), s * l.bits.squash, s * (0.8 + r() * 0.5)),
        color: new THREE.Color(l.bits.colors[Math.floor(r() * l.bits.colors.length)]).multiplyScalar(0.85 + r() * 0.3),
      });
    }
    return items;
  }, [flavor, sampler]);

  const orbiters = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: ORBITERS }, () => ({
      radius: 1.35 + r() * 0.8,
      y: -1.4 + r() * 2.8,
      speed: (0.15 + r() * 0.25) * (r() > 0.5 ? 1 : -1),
      phase: r() * Math.PI * 2,
      size: 0.025 + r() * 0.04,
      spin: r() * 3,
    }));
  }, []);

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const tmpS = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => ({ coat: new THREE.Color(), inside: new THREE.Color() }), []);

  const writeBits = (k: number) => {
    const mesh = bits.current;
    if (!mesh) return;
    layout.forEach((b, i) => {
      tmpS.copy(b.scale).multiplyScalar(k);
      m4.compose(b.pos, b.quat, tmpS);
      mesh.setMatrixAt(i, m4);
    });
    mesh.count = layout.length;
    mesh.instanceMatrix.needsUpdate = true;
  };

  // Flavour change: new toppings + colours + a spin burst
  useEffect(() => {
    const mesh = bits.current;
    if (!mesh) return;
    layout.forEach((b, i) => mesh.setColorAt(i, b.color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (lastFlavor.current !== flavor) {
      pop.current = 0;
      if (input.current) input.current.vel += 9;
      lastFlavor.current = flavor;
    }
    writeBits(pop.current);
    const orb = orbit.current;
    if (orb) {
      const l = LOOKS[flavor] ?? LOOKS.almonds;
      for (let i = 0; i < ORBITERS; i++) orb.setColorAt(i, new THREE.Color(i % 3 === 0 ? l.coat : l.bits.colors[i % l.bits.colors.length]));
      if (orb.instanceColor) orb.instanceColor.needsUpdate = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const t = state.clock.elapsedTime;
    const st = input.current!;
    const l = LOOKS[flavor] ?? LOOKS.almonds;

    // --- rotation (drag + inertia + idle auto-rotate)
    if (spin.current) {
      spin.current.rotation.y += st.pending;
      st.pending = 0;
      if (!st.dragging) {
        spin.current.rotation.y += st.vel * dt;
        st.vel += (0.45 - st.vel) * (1 - Math.exp(-1.6 * dt));
      }
    }
    if (outer.current) {
      if (!st.dragging) st.tilt += (st.hoverY * 0.25 - st.tilt) * (1 - Math.exp(-4 * dt));
      const o = outer.current;
      o.rotation.x += (st.tilt - o.rotation.x) * (1 - Math.exp(-8 * dt));
      o.rotation.z += (-0.32 + st.hoverX * -0.12 + Math.sin(t * 0.8) * 0.04 - o.rotation.z) * (1 - Math.exp(-4 * dt));
      o.position.y = 0.42 + Math.sin(t * 1.25) * 0.09;
    }
    if (shadow.current) {
      const k = 1 - Math.sin(t * 1.25) * 0.08;
      shadow.current.scale.set(2.6 * k, 1.1 * k, 1);
    }

    // --- colour / material transitions
    const a = 1 - Math.exp(-5 * dt);
    uniforms.uCoat.value.lerp(target.coat.set(l.coat), a);
    uniforms.uInside.value.lerp(target.inside.set(l.inside), a);
    barMat.roughness += (l.rough - barMat.roughness) * a;
    barMat.clearcoat += (l.clear - barMat.clearcoat) * a;

    // --- toppings pop-in
    if (pop.current < 1) {
      pop.current = Math.min(1, pop.current + dt * 1.8);
      const p = pop.current;
      const k = 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2); // back-out
      writeBits(Math.max(0, k));
    }

    // --- floating crumbs
    const orb = orbit.current;
    if (orb) {
      orbiters.forEach((o, i) => {
        const ang = o.phase + t * o.speed;
        tmpV.set(Math.cos(ang) * o.radius, o.y + Math.sin(t * 0.9 + o.phase) * 0.15, Math.sin(ang) * o.radius * 0.6 - 0.4);
        tmpQ.setFromEuler(new THREE.Euler(t * 0.4 + o.spin, t * 0.3 + o.spin, 0));
        tmpS.setScalar(o.size);
        m4.compose(tmpV, tmpQ, tmpS);
        orb.setMatrixAt(i, m4);
      });
      orb.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={outer} rotation={[0, 0, -0.32]}>
        <group ref={spin} rotation={[0, -0.5, 0]}>
          <mesh geometry={barGeo} material={barMat} />
          <instancedMesh ref={bits} args={[chunkGeo, undefined, MAX_BITS]} frustumCulled={false}>
            <meshStandardMaterial roughness={0.62} />
          </instancedMesh>
          <mesh geometry={stickGeo} position={[0, -1.45, 0]}>
            <meshStandardMaterial map={tex.wood} bumpMap={tex.woodBump} bumpScale={4} roughness={0.85} />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={orbit} args={[chunkGeo, undefined, ORBITERS]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
      <mesh ref={shadow} position={[0, -1.75, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex.shadowTex} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas wrapper with drag handling                                    */
/* ------------------------------------------------------------------ */

export default function CharmsBar3D({
  flavor,
  fallback,
  onInteract,
}: {
  flavor: string;
  fallback?: React.ReactNode;
  onInteract?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<DragInput>({ dragging: false, pending: 0, vel: 0, tilt: 0, hoverX: 0, hoverY: 0 });
  const last = useRef({ x: 0, y: 0, t: 0 });
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1.5);

  // Stop rendering when the hero is off-screen
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const down = (e: React.PointerEvent) => {
    input.current.dragging = true;
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    onInteract?.();
  };
  const move = (e: React.PointerEvent) => {
    const st = input.current;
    if (st.dragging) {
      const now = performance.now();
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      const dts = Math.max((now - last.current.t) / 1000, 0.008);
      const d = dx * 0.012;
      st.pending += d;
      st.vel = clamp(d / dts, -18, 18);
      st.tilt = clamp(st.tilt + dy * 0.004, -0.5, 0.5);
      last.current = { x: e.clientX, y: e.clientY, t: now };
    } else if (e.pointerType === "mouse" && wrap.current) {
      const r = wrap.current.getBoundingClientRect();
      st.hoverX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      st.hoverY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
  };
  const up = () => {
    input.current.dragging = false;
  };
  const leave = () => {
    input.current.dragging = false;
    input.current.hoverX = 0;
    input.current.hoverY = 0;
  };

  return (
    <div
      ref={wrap}
      className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={leave}
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={dpr}
        camera={{ position: [0, 0, 6.3], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        fallback={fallback}
        onCreated={() => setReady(true)}
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <directionalLight position={[-4, 1, -3]} intensity={0.9} color="#ffcf9a" />

        <Bar flavor={flavor} input={input} />

        {/* Studio reflections — rendered once, no HDR download */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} position={[0, 3, 4]} scale={[5, 1.2, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[-4, 0.5, 2]} scale={[1.2, 5, 1]} color="#ffe2bd" />
          <Lightformer form="rect" intensity={1.4} position={[4, -0.5, 2]} scale={[1.2, 5, 1]} color="#dbe8ff" />
          <Lightformer form="ring" intensity={1} position={[0, -3, -4]} scale={4} color="#feb258" />
        </Environment>
      </Canvas>
    </div>
  );
}
