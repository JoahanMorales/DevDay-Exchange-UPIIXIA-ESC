import type * as THREE_NS from "three";
import { BEATS, beatAt } from "./timeline";

type Three = typeof THREE_NS;
type RoundedBox = typeof import("three/examples/jsm/geometries/RoundedBoxGeometry.js").RoundedBoxGeometry;

export type Palette = { bg: string; surface: string; ink: string; ink2: string; accent: string; ok: string; bad: string; line: string };

/** CSS tokens read at runtime: the scene never hard-codes a color. */
export function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return { bg: v("--bg"), surface: v("--surface"), ink: v("--text"), ink2: v("--text-2"), accent: v("--accent"), ok: v("--ok"), bad: v("--bad"), line: v("--line") };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a)); // progress of p inside [a, b]
const ease = (x: number) => x * x * (3 - 2 * x);

export type SceneApi = {
  update(t: number, pointer?: { x: number; y: number }): void;
  resize(w: number, h: number): void;
  render(): void;
  dispose(): void;
};

export function createScene(T: Three, RoundedBoxGeometry: RoundedBox, host: HTMLElement, pal: Palette): SceneApi {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = "block";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 2, 0.1, 100);
  scene.add(new T.AmbientLight(0xffffff, 1.15));
  const sun = new T.DirectionalLight(0xffffff, 1.4);
  sun.position.set(3, 6, 6);
  scene.add(sun);

  const disposables: { dispose(): void }[] = [renderer];
  const C = (hex: string) => new T.Color(hex);
  const std = (hex: string, extra: Partial<THREE_NS.MeshStandardMaterialParameters> = {}) => {
    const m = new T.MeshStandardMaterial({ color: C(hex), roughness: 0.55, metalness: 0.05, ...extra });
    disposables.push(m);
    return m;
  };
  const basic = (hex: string, extra: Partial<THREE_NS.MeshBasicMaterialParameters> = {}) => {
    const m = new T.MeshBasicMaterial({ color: C(hex), ...extra });
    disposables.push(m);
    return m;
  };

  const labels: { s: THREE_NS.Sprite; bx: number; by: number }[] = [];
  function label(text: string, color: string, height = 0.42): THREE_NS.Sprite {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const font = '800 64px "Archivo", "Atkinson Hyperlegible", sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 24;
    c.width = w;
    c.height = 96;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 12, 50);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    disposables.push(tex, mat);
    const s = new T.Sprite(mat);
    s.scale.set((height * w) / 96, height, 1);
    labels.push({ s, bx: (height * w) / 96, by: height });
    return s;
  }

  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    const ink = new T.Color(pal.ink).getStyle(); // "rgb(r,g,b)": same hue as the page ink, so the shadow is tinted, not black
    const withAlpha = (a: number) => ink.replace("rgb(", "rgba(").replace(")", `,${a})`);
    grd.addColorStop(0, withAlpha(0.28));
    grd.addColorStop(1, withAlpha(0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const t = new T.CanvasTexture(c);
    disposables.push(t);
    return t;
  })();

  // On a narrow canvas the actors are packed closer so the labels stay readable.
  let spread = 1;
  type Phone = { group: THREE_NS.Group; screen: THREE_NS.Mesh; mat: THREE_NS.MeshBasicMaterial; base: THREE_NS.Vector3; x0: number };
  const bodyGeo = new RoundedBoxGeometry(1, 1.9, 0.16, 4, 0.14);
  const screenGeo = new T.PlaneGeometry(0.84, 1.68);
  const shadowGeo = new T.PlaneGeometry(2.2, 1);
  const shadowMat = new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  disposables.push(bodyGeo, screenGeo, shadowGeo, shadowMat);

  function phone(x: number, z: number, name: string): Phone {
    const group = new T.Group();
    const body = new T.Mesh(bodyGeo, std(pal.ink));
    const mat = basic(pal.surface);
    const screen = new T.Mesh(screenGeo, mat);
    screen.position.z = 0.085;
    const sh = new T.Mesh(shadowGeo, shadowMat);
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(0, -0.97, 0);
    const tag = label(name, pal.ink2, 0.34);
    tag.position.set(0, 1.62, 0.1);
    group.add(sh, body, screen, tag);
    group.position.set(x, 0, z);
    scene.add(group);
    return { group, screen, mat, base: group.position.clone(), x0: x };
  }

  const mario = phone(-5.4, 0, "Mario");
  const shop = phone(-2.2, 0, "Tienda");
  const n1 = phone(1.1, 0.2, "Vecino");
  const n2 = phone(3.9, -0.2, "Vecina");

  // Signal tower: bars crossed out in red until beat 4, then they light up.
  const tower = new T.Group();
  tower.position.set(7, -0.95, -0.6);
  const mast = new T.Mesh(new T.CylinderGeometry(0.06, 0.12, 3.1, 12), std(pal.ink));
  mast.position.y = 1.55;
  const barMats: THREE_NS.MeshStandardMaterial[] = [];
  const bars: THREE_NS.Mesh[] = [];
  [0.34, 0.54, 0.74].forEach((h, i) => {
    const m = std(pal.line);
    barMats.push(m);
    const b = new T.Mesh(new T.BoxGeometry(0.22, h, 0.22), m);
    b.position.set(-0.4 + i * 0.4, 3.35 + h / 2 - 0.3, 0);
    bars.push(b);
    tower.add(b);
  });
  const crossMat = basic(pal.bad);
  const cross = new T.Group();
  [Math.PI / 4, -Math.PI / 4].forEach((r) => {
    const l = new T.Mesh(new T.BoxGeometry(1.5, 0.12, 0.06), crossMat);
    l.rotation.z = r;
    cross.add(l);
  });
  cross.position.set(0, 3.7, 0.2);
  const towerTag = label("Señal", pal.ink2, 0.34);
  towerTag.position.set(0, 4.75, 0);
  tower.add(mast, cross, towerTag);
  scene.add(tower);

  // A table under the actors and dotted route markers: the eye reads "things travel along this line".
  const table = new T.Mesh(new RoundedBoxGeometry(15.6, 0.12, 2.6, 3, 0.05), std(pal.line, { transparent: true, opacity: 0.55 }));
  table.position.set(0.8, -1.06, 0);
  scene.add(table);
  const dotGeo = new T.SphereGeometry(0.06, 10, 10);
  const dotMat = basic(pal.ink2, { transparent: true, opacity: 0.35 });
  disposables.push(dotGeo, dotMat);
  const routeDots: THREE_NS.Mesh[] = [];
  for (let i = 0; i < 26; i++) {
    const d = new T.Mesh(dotGeo, dotMat);
    scene.add(d);
    routeDots.push(d);
  }

  // The IOU ticket (gold, reads "$25.00"), a sealed cube for the relay, a coin for the CoDi charge.
  const ticket = new T.Group();
  const ticketBody = new T.Mesh(new RoundedBoxGeometry(0.95, 0.58, 0.05, 3, 0.05), std(pal.accent));
  const ticketText = label("$25.00", pal.ink, 0.3);
  ticketText.position.z = 0.05;
  ticket.add(ticketBody, ticketText);
  scene.add(ticket);
  const ghost = new T.Group();
  const ghostBody = new T.Mesh(new RoundedBoxGeometry(0.95, 0.58, 0.05, 3, 0.05), std(pal.bad, { transparent: true, opacity: 0.8 }));
  const ghostTag = label("grabación / voz de IA", pal.bad, 0.26);
  ghostTag.position.set(0, -0.62, 0.05);
  ghost.add(ghostBody, ghostTag);
  scene.add(ghost);
  const cube = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), std(pal.accent));
  const cubeTag = label("cifrado", pal.ink2, 0.26);
  cubeTag.position.set(0, 0.62, 0);
  cube.add(cubeTag);
  scene.add(cube);
  const coin = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.08, 32), std(pal.accent, { metalness: 0.3 }));
  coin.rotation.x = Math.PI / 2;
  const coinWrap = new T.Group();
  coinWrap.add(coin);
  const coinTag = label("$0.01 de prueba", pal.ink, 0.28);
  coinTag.position.set(0, 0.7, 0);
  coinWrap.add(coinTag);
  scene.add(coinWrap);

  const okTag = label("✓ válido", pal.ok, 0.4);
  const badTag = label("✕ rechazado", pal.bad, 0.4);
  const paidTag = label("✓ cobrado por CoDi", pal.ok, 0.4);
  [okTag, badTag, paidTag].forEach((s) => {
    s.position.set(shop.base.x, 2.35, 0.2);
    scene.add(s);
  });

  // Sound rings around Mario and a burst of shards for the rejected ticket.
  const ringGeo = new T.RingGeometry(0.9, 0.96, 48);
  disposables.push(ringGeo);
  const rings = [0, 1, 2].map(() => {
    const m = new T.Mesh(ringGeo, basic(pal.accent, { transparent: true, side: T.DoubleSide, depthWrite: false }));
    m.position.set(mario.base.x, 0.2, 0.2);
    scene.add(m);
    return m;
  });
  const shardGeo = new T.BoxGeometry(0.13, 0.13, 0.13);
  disposables.push(shardGeo);
  const shardDirs = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return new T.Vector3(Math.cos(a), Math.sin(a) * 0.8 + 0.2, (i % 3) * 0.2 - 0.2);
  });
  const shards = (color: string) =>
    shardDirs.map(() => {
      const m = new T.Mesh(shardGeo, basic(color, { transparent: true }));
      m.visible = false;
      scene.add(m);
      return m;
    });
  const badShards = shards(pal.bad);
  const okShards = shards(pal.ok);

  const arc = (a: THREE_NS.Vector3, b: THREE_NS.Vector3, k: number, lift: number, out: THREE_NS.Object3D) => {
    out.position.lerpVectors(a, b, k);
    out.position.y += Math.sin(Math.PI * k) * lift;
  };
  const P = (x: number, y: number, z = 0.3) => new T.Vector3(x, y, z);
  const burst = (list: THREE_NS.Mesh[], origin: THREE_NS.Vector3, k: number) => {
    list.forEach((m, i) => {
      m.visible = k > 0 && k < 1;
      m.position.copy(origin).addScaledVector(shardDirs[i], ease(k) * 1.6);
      m.scale.setScalar(1 - k * 0.7);
      (m.material as THREE_NS.MeshBasicMaterial).opacity = 1 - k;
    });
  };

  const hide = (...o: THREE_NS.Object3D[]) => o.forEach((x) => (x.visible = false));
  const show = (...o: THREE_NS.Object3D[]) => o.forEach((x) => (x.visible = true));
  const setScreen = (p: Phone, hex: string) => p.mat.color.set(hex);

  function update(t: number, pointer = { x: 0, y: 0 }) {
    const { index, progress: p } = beatAt(t);
    hide(ticket, ghost, cube, coinWrap, okTag, badTag, paidTag, ...rings);
    burst(badShards, P(shop.base.x - 0.6, 0.3), 0);
    burst(okShards, P(shop.base.x, 0.6), 0);
    [mario, shop, n1, n2].forEach((ph) => {
      ph.group.position.copy(ph.base);
      ph.group.rotation.set(0, 0, 0);
      ph.group.scale.setScalar(1);
      setScreen(ph, pal.surface);
      ph.group.position.y = Math.sin(t * 1.6 + ph.x0) * 0.05; // idle bob
    });
    routeDots.forEach((d, i) => {
      const k = i / (routeDots.length - 1);
      d.position.set(mario.base.x + (tower.position.x - mario.base.x) * k, -0.95, 0.9);
      d.scale.setScalar(0.8 + 0.5 * Math.max(0, Math.sin(t * 2.2 - i * 0.5)));
    });
    let signal = 0;

    if (index === 0) {
      rings.forEach((r, i) => {
        const k = seg(p, 0.04 + i * 0.12, 0.5 + i * 0.12);
        r.visible = k > 0 && k < 1;
        r.scale.setScalar(0.5 + k * 2.6);
        (r.material as THREE_NS.MeshBasicMaterial).opacity = (1 - k) * 0.9;
      });
      const k = ease(seg(p, 0.22, 0.62));
      if (k < 1) {
        show(ticket);
        arc(P(mario.base.x, 0.3), P(shop.base.x, 0.3), k, 0.9, ticket);
        ticket.rotation.z = (1 - k) * 0.25;
      }
      if (p > 0.62) {
        setScreen(shop, pal.ok);
        show(okTag);
        const v = seg(p, 0.62, 0.92);
        shop.group.position.x += Math.sin(v * 40) * 0.05 * (1 - v);
        shop.group.rotation.z = Math.sin(v * 40) * 0.05 * (1 - v);
        burst(okShards, P(shop.base.x, 0.6), seg(p, 0.62, 0.95));
      }
    } else if (index === 1) {
      const k = ease(seg(p, 0.08, 0.55));
      if (k < 1) {
        show(ghost);
        arc(P(-7.4 * spread, -1.1), P(shop.base.x - 0.9, 0.2), k, 0.5, ghost);
      }
      if (p >= 0.55) {
        show(badTag);
        burst(badShards, P(shop.base.x - 0.9, 0.2), seg(p, 0.55, 0.9));
        shop.group.position.x += Math.sin(seg(p, 0.55, 0.7) * 20) * 0.03 * (1 - seg(p, 0.55, 0.7));
        setScreen(shop, pal.surface);
      }
    } else if (index === 2) {
      show(cube);
      const a = ease(seg(p, 0.05, 0.42));
      const b = ease(seg(p, 0.5, 0.92));
      cube.rotation.set(p * 5, p * 6, 0);
      if (p < 0.46) arc(P(shop.base.x, 0.9), P(n1.base.x, 0.9), a, 0.9, cube);
      else arc(P(n1.base.x, 0.9, 0.5), P(n2.base.x, 0.9, 0.1), b, 0.9, cube);
      const bump = (ph: Phone, at: number) => ph.group.scale.setScalar(1 + 0.12 * Math.sin(Math.PI * seg(p, at, at + 0.16)));
      bump(n1, 0.4);
      bump(n2, 0.88);
      setScreen(n1, p > 0.42 ? pal.accent : pal.surface);
      setScreen(n2, p > 0.9 ? pal.accent : pal.surface);
    } else {
      signal = ease(seg(p, 0, 0.22));
      setScreen(n2, pal.accent);
      const up = ease(seg(p, 0.2, 0.5));
      const down = ease(seg(p, 0.5, 0.86));
      if (p < 0.5) {
        show(cube);
        cube.rotation.set(p * 4, p * 5, 0);
        arc(P(n2.base.x, 0.9, 0.1), P(tower.position.x, 2.2, -0.2), up, 0.8, cube);
        if (p < 0.2) cube.position.set(n2.base.x, 0.9, 0.1);
      } else if (p < 0.86) {
        show(coinWrap);
        arc(P(tower.position.x, 2.2, -0.2), P(shop.base.x + 1.3 * spread, 0.5, 0.6), down, 1.8, coinWrap);
        coin.rotation.set(Math.PI / 2, 0, down * 14);
      }
      if (p >= 0.86) {
        // The payoff stays on screen: the coin rests beside the shop with its test-amount tag until the loop ends.
        show(coinWrap);
        coinWrap.position.set(shop.base.x + 1.3 * spread, 0.5 + Math.sin(t * 3) * 0.04, 0.6);
        coin.rotation.set(Math.PI / 2, 0, t * 2);
        setScreen(shop, pal.ok);
        show(paidTag);
        const v = seg(p, 0.86, 1);
        shop.group.position.x += Math.sin(v * 36) * 0.04 * (1 - v);
        burst(okShards, P(shop.base.x, 0.6), v);
      }
    }
    // Tower: red cross while there is no signal, bars light up in beat 4.
    cross.visible = signal < 0.3;
    bars.forEach((b, i) => {
      barMats[i].color.set(signal > 0.2 + i * 0.2 ? pal.ok : pal.line);
      b.scale.y = 1 + 0.25 * signal * (i + 1) * 0.5;
    });
    if (index === 3 || t < 0) tower.scale.setScalar(1 + 0.04 * Math.sin(signal * Math.PI));

    camera.position.x = pointer.x * 0.7;
    camera.position.y = 3.0 + pointer.y * 0.35;
    camera.lookAt((0.6 + pointer.x * 0.2) * spread, 1.5, 0);
  }

  function layout(narrow: boolean) {
    spread = narrow ? 0.6 : 1;
    const k = narrow ? 1.7 : 1; // labels need to stay readable on a phone
    labels.forEach(({ s, bx, by }) => s.scale.set(bx * k, by * k, 1));
    [mario, shop, n1, n2].forEach((ph) => ph.base.set(ph.x0 * spread, 0, ph.base.z));
    tower.position.x = 7 * spread;
    table.scale.x = narrow ? 0.62 : 1;
    table.position.x = 0.8 * spread;
    okTag.position.x = badTag.position.x = paidTag.position.x = shop.base.x;
  }

  function resize(w: number, h: number) {
    layout(w / h < 1.5);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    // Fit about 17 world units across, so the six actors show on a phone and on a projector.
    const half = spread < 1 ? 5.2 : 7.6; // half the world width to fit
    camera.position.z = Math.max(9, half / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect));
    camera.updateProjectionMatrix();
  }

  return {
    update,
    resize,
    render: () => renderer.render(scene, camera),
    dispose() {
      scene.traverse((o) => {
        const m = o as THREE_NS.Mesh;
        m.geometry?.dispose?.();
      });
      disposables.forEach((d) => d.dispose());
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export { BEATS };
