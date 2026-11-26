/**
 * The Al-Arz "Charms" bar, as plain three.js (no React): flavour looks, the bar with its bite,
 * topping chunks and the engraved wooden stick. Shared by the interactive hero
 * (CharmsBar3D) and the AR model exporter, so both always show the same ice cream.
 */
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

/* ------------------------------------------------------------------ */
/* Flavour looks                                                        */
/* ------------------------------------------------------------------ */

export interface Look {
  coat: string;
  inside: string;
  rough: number;
  clear: number;
  bits: { count: number; colors: string[]; size: [number, number]; squash: number };
}

export const LOOKS: Record<string, Look> = {
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
export const MAX_BITS = 140;
export const ORBITERS = 14;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Subdivided box projected onto a rounded box; returns geometry with analytic normals. */
export function roundedSlab(w: number, h: number, d: number, r: number, segs: [number, number, number]) {
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
export function buildBar() {
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
export function buildChunk() {
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

export function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
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
export function buildStickTextures(logoUrl = "/logo.svg") {
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
  // resolves once the engraved logo is drawn (the exporter waits for it)
  const ready = new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
  img.src = logoUrl;

  return { wood, woodBump, ready };
}

export interface ToppingItem {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: THREE.Vector3;
  color: THREE.Color;
}

/** Surface sampler over the coating (never on the bite or the bottom). */
export function coatingSampler(barGeo: THREE.BufferGeometry) {
  return new MeshSurfaceSampler(new THREE.Mesh(barGeo)).setWeightAttribute("aWeight").build();
}

/** Deterministic topping placement for a flavour. */
export function toppingLayout(flavor: string, sampler: MeshSurfaceSampler): ToppingItem[] {
  const l = LOOKS[flavor] ?? LOOKS.almonds;
  const r = rng(flavor.length * 97 + 11);
  const p = new THREE.Vector3(),
    n = new THREE.Vector3();
  const items: ToppingItem[] = [];
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
}

/** The stick sits below the bar: centre y = -1.45 in model units. */
export const STICK_OFFSET_Y = -1.45;
