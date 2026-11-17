"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import type { FlavorColors } from "@/content/types";

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                     */
/* ------------------------------------------------------------------ */

/** Soft-serve swirl: a tube following a tapering conical helix — the same shape as the logo. */
function useSwirlGeometry() {
  return useMemo(() => {
    const turns = 3.6;
    const height = 1.75;
    const baseRadius = 0.78;
    const pts: THREE.Vector3[] = [];
    const N = 260;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const angle = t * turns * Math.PI * 2;
      const r = baseRadius * Math.pow(1 - t, 0.85) + 0.02;
      const y = height * Math.pow(t, 0.92);
      pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    // little curl on top
    const last = pts[pts.length - 1];
    pts.push(last.clone().add(new THREE.Vector3(-0.05, 0.12, 0.02)));
    pts.push(last.clone().add(new THREE.Vector3(-0.14, 0.2, 0.05)));

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubular = 520;
    const radial = 36;
    const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false);

    // Taper the tube radius along its length + add soft "piping" ridges.
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const center = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let i = 0; i <= tubular; i++) {
      const t = i / tubular;
      curve.getPointAt(t, center);
      const base = 0.3 * (1 - t * 0.72) + 0.03;
      const tipFade = t > 0.96 ? 1 - ((t - 0.96) / 0.04) * 0.8 : 1;
      // round off the start of the piping so there is no flat cut end
      const startFade = t < 0.04 ? Math.sqrt(Math.max(0.0001, t / 0.04)) : 1;
      for (let j = 0; j <= radial; j++) {
        const idx = i * (radial + 1) + j;
        v.fromBufferAttribute(pos, idx).sub(center);
        const ridge = 1 + 0.06 * Math.sin((j / radial) * Math.PI * 2 * 6);
        v.multiplyScalar(base * tipFade * startFade * ridge);
        pos.setXYZ(idx, center.x + v.x, center.y + v.y, center.z + v.z);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/** Waffle cone texture drawn on a canvas (no external assets). */
function useWaffleTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 512;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#E9B26A");
    grad.addColorStop(1, "#C9853B");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    g.strokeStyle = "rgba(120,62,18,0.55)";
    g.lineWidth = 10;
    const step = 64;
    for (let i = -size; i < size * 2; i += step) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + size, size);
      g.stroke();
      g.beginPath();
      g.moveTo(i, size);
      g.lineTo(i + size, 0);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/* ------------------------------------------------------------------ */
/* Parts                                                                */
/* ------------------------------------------------------------------ */

function Cone() {
  const tex = useWaffleTexture();
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.001, -2.05),
      new THREE.Vector2(0.08, -1.9),
      new THREE.Vector2(0.82, -0.02),
      new THREE.Vector2(0.86, 0.08),
      new THREE.Vector2(0.8, 0.1),
    ];
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          map={tex ?? undefined}
          bumpMap={tex ?? undefined}
          bumpScale={2}
          roughness={0.75}
          color="#ffffff"
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* rim */}
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.84, 0.065, 16, 80]} />
        <meshStandardMaterial color="#D99A4E" roughness={0.6} />
      </mesh>
    </group>
  );
}

const SPRINKLE_COLORS = ["#FEB258", "#194E91", "#F58AA2", "#ffffff", "#9AD8F5", "#B8D27E"];

function Sprinkles({ swirl }: { swirl: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 70;

  const data = useMemo(() => {
    const pos = swirl.attributes.position as THREE.BufferAttribute;
    const nor = swirl.attributes.normal as THREE.BufferAttribute;
    const out: { p: THREE.Vector3; q: THREE.Quaternion; c: THREE.Color }[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    while (out.length < count) {
      const idx = Math.floor(rand() * pos.count);
      const n = new THREE.Vector3().fromBufferAttribute(nor, idx);
      if (n.y < 0.15) continue; // only on upward-facing cream
      const p = new THREE.Vector3().fromBufferAttribute(pos, idx).addScaledVector(n, 0.012);
      const q = new THREE.Quaternion().setFromUnitVectors(up, n);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(up, rand() * Math.PI));
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      out.push({ p, q, c: new THREE.Color(SPRINKLE_COLORS[Math.floor(rand() * SPRINKLE_COLORS.length)]) });
    }
    return out;
  }, [swirl]);

  return (
    <instancedMesh
      ref={(mesh) => {
        if (!mesh) return;
        (ref as React.MutableRefObject<THREE.InstancedMesh | null>).current = mesh;
        const m = new THREE.Matrix4();
        data.forEach((d, i) => {
          m.compose(d.p, d.q, new THREE.Vector3(1, 1, 1));
          mesh.setMatrixAt(i, m);
          mesh.setColorAt(i, d.c);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }}
      args={[undefined, undefined, count]}
    >
      <capsuleGeometry args={[0.018, 0.07, 4, 8]} />
      <meshStandardMaterial roughness={0.35} />
    </instancedMesh>
  );
}

function IceCream({ colors }: { colors: FlavorColors }) {
  const group = useRef<THREE.Group>(null);
  const creamMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const dollopMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const swirl = useSwirlGeometry();
  const target = useMemo(() => new THREE.Color(), []);
  const targetSheen = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (g) {
      g.rotation.y += delta * 0.55;
      // gentle tilt toward the pointer
      const px = state.pointer.x;
      const py = state.pointer.y;
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -px * 0.18, 4, delta);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, py * 0.12, 4, delta);
    }
    const m = creamMat.current;
    if (m) {
      target.set(colors.base);
      targetSheen.set(colors.accent);
      m.color.lerp(target, 1 - Math.exp(-delta * 5));
      m.sheenColor.lerp(targetSheen, 1 - Math.exp(-delta * 5));
      dollopMat.current?.color.copy(m.color);
    }
  });

  return (
    <group ref={group} position={[0, 0.05, 0]}>
      <Cone />
      <group position={[0, 0.05, 0]}>
        {/* base dollop that hides the joint with the cone */}
        <mesh position={[0, 0.06, 0]} scale={[1, 0.45, 1]}>
          <sphereGeometry args={[0.8, 48, 32]} />
          <meshPhysicalMaterial ref={dollopMat} color={colors.base} roughness={0.5} />
        </mesh>
        <mesh geometry={swirl} castShadow>
          <meshPhysicalMaterial
            ref={creamMat}
            color={colors.base}
            roughness={0.42}
            clearcoat={0.35}
            clearcoatRoughness={0.4}
            sheen={1}
            sheenRoughness={0.5}
            sheenColor={colors.accent}
          />
        </mesh>
        <Sprinkles swirl={swirl} />
      </group>
    </group>
  );
}

function FloatingScoops({ colors }: { colors: FlavorColors }) {
  const scoops = useMemo(
    () => [
      { p: [-1.8, 1.3, -1.2] as const, s: 0.32, c: "#FEB258" },
      { p: [1.8, 0.9, -1.6] as const, s: 0.26, c: "#F58AA2" },
      { p: [1.7, -1.4, -0.8] as const, s: 0.22, c: "#B8D27E" },
      { p: [-1.9, -1.1, -1.4] as const, s: 0.2, c: "#ffffff" },
    ],
    [],
  );
  return (
    <>
      {scoops.map((s, i) => (
        <Float key={i} speed={1.6 + i * 0.3} rotationIntensity={1.2} floatIntensity={1.6}>
          <mesh position={s.p as unknown as THREE.Vector3Tuple}>
            <icosahedronGeometry args={[s.s, 6]} />
            <meshPhysicalMaterial color={i === 0 ? colors.base : s.c} roughness={0.45} clearcoat={0.3} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function IceCreamScene({ colors }: { colors: FlavorColors }) {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows="percentage"
      camera={{ position: [0, 0.2, 7.4], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#FEB258" />

      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
        <IceCream colors={colors} />
      </Float>
      <FloatingScoops colors={colors} />

      <ContactShadows position={[0, -2.2, 0]} opacity={0.35} scale={6} blur={2.6} far={3} color="#0d2f5e" />

      {/* Studio lighting built from light-formers: no HDR file download needed */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-4, 1, 2]} scale={[2, 5, 1]} color="#FFE2BD" />
        <Lightformer form="rect" intensity={1} position={[4, 0, 1]} scale={[2, 5, 1]} color="#cfe0ff" />
        <Lightformer form="ring" intensity={0.8} position={[0, -3, -4]} scale={4} />
      </Environment>
    </Canvas>
  );
}
