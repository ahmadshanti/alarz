/**
 * Builds the AR / export version of the Charms bar from the same procedural model as the hero:
 * - the bite becomes its own material (ice cream) instead of a custom shader,
 * - toppings are merged into one mesh with vertex colours (AR viewers don't do instancing well),
 * - the bar lies on the table, at real size (~15 cm including the stick).
 * Used by the exporter that writes public/models/charms-<flavor>.glb.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  LOOKS,
  STICK_OFFSET_Y,
  buildBar,
  buildStickTextures,
  coatingSampler,
  roundedSlab,
  toppingLayout,
} from "./charmsModel";

/** Lighter topping chunk for AR (20 faces instead of 80 — the size difference is invisible at real scale). */
function arChunk() {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const k = 1 + 0.22 * Math.sin(x * 12.9898 + y * 78.233 + z * 37.719);
    pos.setXYZ(i, x * k, y * k, z * k);
  }
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  return g;
}

/** model units → metres (bar body 2.0 units ≈ 10 cm) */
const METRES_PER_UNIT = 0.05;

export async function buildCharmsArModel(flavor: string, logoUrl = "/logo.svg"): Promise<THREE.Group> {
  const look = LOOKS[flavor] ?? LOOKS.almonds;

  /* bar: split triangles into coating (group 0) and bitten ice cream (group 1) */
  const source = buildBar();
  const index = source.index!;
  const bite = source.getAttribute("aBite") as THREE.BufferAttribute;
  const coat: number[] = [];
  const inside: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i),
      b = index.getX(i + 1),
      c = index.getX(i + 2);
    ((bite.getX(a) + bite.getX(b) + bite.getX(c)) / 3 > 0.5 ? inside : coat).push(a, b, c);
  }
  const barGeo = source.clone();
  barGeo.setIndex([...coat, ...inside]);
  barGeo.clearGroups();
  barGeo.addGroup(0, coat.length, 0);
  barGeo.addGroup(coat.length, inside.length, 1);
  barGeo.deleteAttribute("aBite");
  barGeo.deleteAttribute("aWeight");
  barGeo.deleteAttribute("uv"); // no textures on the bar in AR

  const bar = new THREE.Mesh(barGeo, [
    new THREE.MeshPhysicalMaterial({
      name: "chocolate-coating",
      color: look.coat,
      roughness: look.rough,
      metalness: 0,
      clearcoat: look.clear,
      clearcoatRoughness: 0.22,
    }),
    new THREE.MeshStandardMaterial({ name: "ice-cream", color: look.inside, roughness: 0.75, metalness: 0 }),
  ]);
  bar.name = "bar";

  /* toppings: bake every chunk into one mesh with per-vertex colour */
  const items = toppingLayout(flavor, coatingSampler(source));
  const chunk = arChunk();
  const m = new THREE.Matrix4();
  const parts = items.map((it) => {
    const g = chunk.clone();
    g.applyMatrix4(m.compose(it.pos, it.quat, it.scale));
    // 8-bit normalized vertex colours (valid glTF COLOR_0, a quarter of the size of floats)
    const colors = new Uint8Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = Math.round(it.color.r * 255);
      colors[i + 1] = Math.round(it.color.g * 255);
      colors[i + 2] = Math.round(it.color.b * 255);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3, true));
    return g;
  });
  const group = new THREE.Group();
  group.add(bar);
  if (parts.length) {
    const toppings = new THREE.Mesh(
      mergeGeometries(parts),
      new THREE.MeshStandardMaterial({ name: "toppings", vertexColors: true, roughness: 0.62, metalness: 0 }),
    );
    toppings.name = "toppings";
    group.add(toppings);
  }

  /* wooden stick with the engraved logo */
  const { wood, ready } = buildStickTextures(logoUrl);
  await ready;
  const stick = new THREE.Mesh(
    roundedSlab(0.34, 1.3, 0.07, 0.03, [6, 18, 2]),
    new THREE.MeshStandardMaterial({ name: "wood-stick", map: wood, roughness: 0.85, metalness: 0 }),
  );
  stick.name = "stick";
  stick.position.y = STICK_OFFSET_Y;
  group.add(stick);

  /* lie it on the table (front face up), a little diagonal, real size, resting on y = 0 */
  group.rotation.set(-Math.PI / 2, 0, 0);
  const root = new THREE.Group();
  root.name = `Al-Arz Charms (${flavor})`;
  const tilt = new THREE.Group();
  tilt.rotation.y = 0.45;
  tilt.add(group);
  root.add(tilt);
  root.scale.setScalar(METRES_PER_UNIT);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  root.position.set(-centre.x, -box.min.y, -centre.z);
  return root;
}
