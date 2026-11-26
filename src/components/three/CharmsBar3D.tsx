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
import {
  LOOKS,
  MAX_BITS,
  ORBITERS,
  STICK_OFFSET_Y,
  buildBar,
  buildChunk,
  buildStickTextures,
  canvasTexture,
  clamp,
  coatingSampler,
  rng,
  roundedSlab,
  toppingLayout,
} from "./charmsModel";

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

  const sampler = useMemo(() => coatingSampler(barGeo), [barGeo]);

  // Per-flavour topping layout (positions/rotations/scales kept for the pop animation)
  const layout = useMemo(() => toppingLayout(flavor, sampler), [flavor, sampler]);

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
          <mesh geometry={stickGeo} position={[0, STICK_OFFSET_Y, 0]}>
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
  paused = false,
}: {
  flavor: string;
  fallback?: React.ReactNode;
  onInteract?: () => void;
  /** stop rendering (e.g. while a modal covers the hero) */
  paused?: boolean;
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
        frameloop={visible && !paused ? "always" : "never"}
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
