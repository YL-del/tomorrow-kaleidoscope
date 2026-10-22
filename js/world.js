// 3D 世界构建：房间外壳、家具、主角阿堵、未来态差异
import * as THREE from 'three';

const MAT = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.02, ...opts });

function box(w, h, d, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT(color, opts.mat));
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.rx) m.rotation.x = opts.rx;
  return m;
}

function cyl(rt, rb, h, color, x, y, z, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), MAT(color));
  m.position.set(x, y, z);
  return m;
}

function sph(r, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), MAT(color));
  m.position.set(x, y, z);
  return m;
}

/* ---------- 房间外壳（每间一样大，参数化配色） ---------- */
function shell(parent, { wall, floor, wainscot = 0x6b5a49 }) {
  // 地板
  const floorMesh = box(10.6, 0.3, 10.6, floor, 0, -0.15, 0);
  parent.add(floorMesh);
  // 地板条纹
  for (let i = -5; i <= 5; i += 1) {
    parent.add(box(0.04, 0.02, 10.4, 0x000000, i + 0.5, 0.005, 0, { mat: { opacity: 0.12, transparent: true } }));
  }
  // 四面墙（厚墙盒）
  const wallH = 5, half = 5.2;
  parent.add(box(10.8, wallH, 0.4, wall, 0, wallH / 2, -half));
  parent.add(box(10.8, wallH, 0.4, wall, 0, wallH / 2, half));
  parent.add(box(0.4, wallH, 10.8, wall, -half, wallH / 2, 0));
  parent.add(box(0.4, wallH, 10.8, wall, half, wallH / 2, 0));
  // 踢脚线
  const wc = box(10.8, 0.5, 0.08, wainscot, 0, 0.25, -4.98);
  parent.add(wc);
  parent.add(box(10.8, 0.5, 0.08, wainscot, 0, 0.25, 4.98));
  parent.add(box(0.08, 0.5, 10.8, wainscot, -4.98, 0.25, 0));
  parent.add(box(0.08, 0.5, 10.8, wainscot, 4.98, 0.25, 0));
  // 天花板
  parent.add(box(10.8, 0.2, 10.8, 0x2c3050, 0, 5.1, 0));
}

/* ---------- 主角阿堵（低多边形卡通小人） ---------- */
export function buildBoy() {
  const g = new THREE.Group();
  // 腿
  const legL = box(0.22, 0.5, 0.24, 0x3a4062, -0.14, 0.3, 0);
  const legR = box(0.22, 0.5, 0.24, 0x3a4062, 0.14, 0.3, 0);
  // 鞋
  legL.add(box(0.26, 0.14, 0.36, 0xc9564c, 0, -0.28, 0.05));
  legR.add(box(0.26, 0.14, 0.36, 0xc9564c, 0, -0.28, 0.05));
  g.add(legL, legR);
  // 身体（毛衣 + 背带裤）
  g.add(box(0.62, 0.55, 0.42, 0xf2a54a, 0, 0.87, 0));
  g.add(box(0.5, 0.34, 0.36, 0x45528c, 0, 0.72, 0.01));
  g.add(box(0.52, 0.1, 0.38, 0x3a4578, 0, 0.86, 0.01));
  // 手臂
  const armL = box(0.16, 0.42, 0.18, 0xe2933c, -0.38, 0.92, 0);
  const armR = box(0.16, 0.42, 0.18, 0xe2933c, 0.38, 0.92, 0);
  g.add(armL, armR);
  // 围巾
  g.add(box(0.5, 0.13, 0.46, 0xd95d5d, 0, 1.2, 0));
  g.add(box(0.14, 0.26, 0.08, 0xd95d5d, 0.2, 1.06, 0.24));
  // 头
  const head = sph(0.42, 0xffe3c9, 0, 1.66, 0);
  // 头发（上半覆盖 + 呆毛）
  const hair = sph(0.44, 0x6b4a35, 0, 1.72, -0.02);
  hair.scale.set(1, 0.72, 1);
  hair.position.y = 1.76;
  head.add(hair);
  const tuft = box(0.06, 0.22, 0.06, 0x6b4a35, 0.04, 0.46, 0);
  tuft.rotation.z = -0.5;
  head.add(tuft);
  // 独眼
  const eyeWhite = sph(0.13, 0xffffff, 0, 1.64, 0.34);
  const iris = sph(0.075, 0x1c2030, 0, 1.64, 0.42);
  const glimmer = sph(0.028, 0xfff7e6, -0.03, 1.68, 0.44);
  g.add(head, eyeWhite, iris, glimmer);
  // 腮红
  g.add(sph(0.06, 0xffb3a0, -0.2, 1.58, 0.32));
  g.add(sph(0.06, 0xffb3a0, 0.2, 1.58, 0.32));
  return { group: g, legL, legR, armL, armR, iris, head };
}

/* ---------- 火焰（未来态危险元素） ---------- */
function makeFire(x, y, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  for (let i = 0; i < 5; i++) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.22 * scale, 0.9 * scale, 7),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd166 : 0xff5e3a, transparent: true, opacity: 0.92 })
    );
    flame.position.set((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.35);
    flame.userData.phase = Math.random() * Math.PI * 2;
    flame.userData.baseY = flame.position.y;
    g.add(flame);
  }
  g.userData.energetic = true;
  return g;
}

/* ============================================================
   房间构建器：返回 { group, interact: Map<iid, mesh[]>, future(f) }
   interact: 把可点击 mesh 的 userData.iid 设为热点 id，引擎统一收集
   ============================================================ */
function tag(group, interact, iid, mesh) {
  mesh.userData.iid = iid;
  group.add(mesh);
  if (!interact.has(iid)) interact.set(iid, []);
  interact.get(iid).push(mesh);
  return mesh;
}

/* ---------- 房间 1：卧室 ---------- */
function buildBedroom(scene, interact) {
  const g = new THREE.Group();
  shell(g, { wall: 0x75829c, floor: 0xc89b6d });

  // 窗 + 窗帘（后墙）
  tag(g, interact, 'curtain', box(3.2, 2.6, 0.2, 0x8fa8c9, -2.7, 3.1, -4.85));
  g.add(box(3.6, 0.3, 0.28, 0x5a4632, -2.7, 4.55, -4.8));   // 窗楣
  g.add(box(3.6, 0.3, 0.28, 0x5a4632, -2.7, 1.75, -4.8));   // 窗台
  for (const s of [-1, 1]) {
    const curtain = box(0.5, 2.9, 0.14, s < 0 ? 0xffd9b0 : 0xffd9b0, -2.7 + s * 1.75, 3.0, -4.72);
    tag(g, interact, 'curtain', curtain);
  }
  // 炉子 + 水壶
  const stove = new THREE.Group();
  stove.add(box(1.1, 1.05, 1.0, 0x5a6068, 0, 0.55, 0));
  stove.add(box(1.2, 0.12, 1.1, 0x3e444d, 0, 1.12, 0));
  stove.position.set(-2.7, 0, -3.9);
  const stoveGlow = new THREE.PointLight(0xff6a2a, 0.7, 5);
  stoveGlow.position.set(-2.7, 0.9, -3.5);
  const kettle = cyl(0.3, 0.24, 0.42, 0xe8e4d8, -2.7, 1.4, -3.9);
  const kettleSpout = cyl(0.05, 0.09, 0.3, 0xe8e4d8, -2.35, 1.42, -3.9);
  kettleSpout.rotation.z = 0.7;
  const kettleLid = cyl(0.12, 0.14, 0.06, 0xd8d2c0, -2.7, 1.64, -3.9);
  stove.userData.iid = 'stove'; kettle.userData.iid = 'stove'; kettleSpout.userData.iid = 'stove'; kettleLid.userData.iid = 'stove';
  g.add(stove, stoveGlow, kettle, kettleSpout, kettleLid);
  if (!interact.has('stove')) interact.set('stove', []);
  interact.get('stove').push(stove, kettle, kettleSpout, kettleLid);

  // 床（左区）
  const bed = new THREE.Group();
  bed.add(box(1.7, 0.35, 2.6, 0x8a5f3c, 0, 0.35, 0));           // 床架
  bed.add(box(1.6, 0.22, 2.4, 0xffe3c9, 0, 0.62, 0));           // 床垫
  bed.add(box(1.62, 0.18, 1.1, 0xff8fa3, 0, 0.66, 0.6));        // 被子
  bed.add(box(0.7, 0.16, 0.44, 0xfdf8ee, 0, 0.74, -0.95));      // 枕头
  bed.add(box(1.7, 1.2, 0.16, 0x6e4a2e, 0, 0.95, -1.35));       // 床头板
  bed.position.set(-3.3, 0, 0.2);
  bed.rotation.y = Math.PI / 2;
  bed.userData.iid = 'bed';
  g.add(bed);
  if (!interact.has('bed')) interact.set('bed', []);
  interact.get('bed').push(bed);

  // 玩具箱（右前角）
  const toybox = new THREE.Group();
  toybox.add(box(1.2, 0.75, 0.85, 0xd97742, 0, 0.38, 0));
  toybox.add(box(1.26, 0.16, 0.9, 0xbf6235, 0, 0.82, 0));
  toybox.add(box(0.24, 0.16, 0.5, 0xffd166, 0, 0.95, 0));       // 盖口玩具
  toybox.position.set(3.4, 0, 3.2);
  toybox.rotation.y = -0.4;
  toybox.userData.iid = 'toybox';
  g.add(toybox);
  if (!interact.has('toybox')) interact.set('toybox', []);
  interact.get('toybox').push(toybox);

  // 小地毯
  const rug = cyl(1.5, 1.5, 0.04, 0xbb6a52, 0, 0.03, 0.6, 28);
  g.add(rug);
  tag(g, interact, 'rug', rug);

  // 画像（后墙）
  const picture = box(0.9, 1.15, 0.08, 0xffe9c9, 2.8, 3.2, -4.92);
  picture.add(box(1.02, 1.27, 0.05, 0xc9a45c, 0, 0, 0.04));
  tag(g, interact, 'picture', picture);

  // 房门（右墙）
  const door = new THREE.Group();
  door.add(box(1.15, 2.3, 0.14, 0x8a5f3c, 0, 0, 0));
  door.add(box(0.95, 0.85, 0.05, 0x9c7047, 0, 0.45, 0.09));
  door.add(box(0.95, 0.85, 0.05, 0x9c7047, 0, -0.55, 0.09));
  door.add(sph(0.09, 0xe6c25a, 0.42, 0, 0.1));
  door.position.set(4.75, 1.15, 1.4);
  door.userData.iid = 'door';
  g.add(door);
  if (!interact.has('door')) interact.set('door', []);
  interact.get('door').push(door);

  scene.add(g);

  // future(flags): 窗帘着火 / 安静
  const futureGroup = new THREE.Group();
  const fire = makeFire(-2.7, 1.9, -4.6, 1.3);
  const fireLight = new THREE.PointLight(0xff5e3a, 1.6, 9);
  fireLight.position.set(-2.7, 2.4, -3.8);
  futureGroup.add(fire, fireLight);
  futureGroup.userData.iid = 'curtain';

  return { group: g, futureGroup, doorGroup: door, hideInFuture: [] };
}

/* ---------- 房间 2：书房 ---------- */
function buildStudy(scene, interact) {
  const g = new THREE.Group();
  shell(g, { wall: 0x7d7a95, floor: 0x9a7551 });

  // 大书架（左墙整面）
  const shelf = new THREE.Group();
  const frame = box(1.0, 4.6, 3.6, 0x6e4a2e, 0, 0, 0);
  shelf.add(frame);
  const bookColors = [0xc9564c, 0x45528c, 0x3f7d5c, 0xd8a93c, 0x8a5f3c, 0x995c8a];
  for (let lv = 0; lv < 5; lv++) {
    shelf.add(box(0.94, 0.08, 3.5, 0x8a5f3c, 0.06, -2.06 + lv * 0.92, 0));
    for (let b = 0; b < 8; b++) {
      const h = 0.5 + ((lv * 8 + b) % 3) * 0.07;
      const bk = box(0.6, h, 0.26, bookColors[(lv * 8 + b) % bookColors.length], 0.12, -1.62 + lv * 0.92 + h / 2 - 0.04, -1.5 + b * 0.42);
      bk.rotation.y = ((b % 3) - 1) * 0.04;
      shelf.add(bk);
    }
  }
  // 垫脚的大辞典（底层前方）
  const dict = box(0.7, 0.36, 0.5, 0x5d4a6b, 0.3, -2.24, -1.2);
  shelf.add(dict);
  shelf.position.set(-4.4, 2.4, -0.6);
  shelf.userData.iid = 'shelf';
  g.add(shelf);
  if (!interact.has('shelf')) interact.set('shelf', []);
  interact.get('shelf').push(shelf, dict);

  // 书桌（右区）
  const desk = new THREE.Group();
  desk.add(box(2.0, 0.14, 1.1, 0x8a5f3c, 0, 0.78, 0));
  for (const [lx, lz] of [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]]) {
    desk.add(box(0.14, 0.78, 0.14, 0x6e4a2e, lx, 0.39, lz));
  }
  // 抽屉
  const drawer = box(0.8, 0.3, 0.95, 0x9c7047, -0.5, 0.55, 0.02);
  drawer.userData.iid = 'desk';
  desk.add(drawer);
  // 台灯
  const lamp = new THREE.Group();
  lamp.add(cyl(0.16, 0.2, 0.06, 0x3e444d, 0, 0.92, -0.3));
  lamp.add(cyl(0.03, 0.03, 0.5, 0x3e444d, 0, 1.15, -0.3));
  lamp.add(cyl(0.16, 0.22, 0.22, 0xffd166, 0, 1.42, -0.3));
  const lampLight = new THREE.PointLight(0xffe0a0, 0.8, 6);
  lampLight.position.set(0, 1.5, -0.3);
  lamp.add(lampLight);
  // 信纸
  const letter = box(0.5, 0.02, 0.36, 0xfdf8ee, 0.3, 0.86, 0.1);
  desk.add(lamp, letter);
  desk.position.set(3.3, 0, -1.4);
  desk.rotation.y = -0.5;
  g.add(desk);
  if (!interact.has('desk')) interact.set('desk', []);
  interact.get('desk').push(drawer);

  // 老鼠洞（左墙角）
  const hole = new THREE.Group();
  const holeBg = cyl(0.22, 0.22, 0.06, 0x201810, 0, 0.22, 0, 16);
  holeBg.rotation.x = Math.PI / 2;
  hole.add(holeBg, box(0.7, 0.06, 0.3, 0xd9c9a8, 0, 0.02, 0.2));
  hole.position.set(-4.75, 0, 2.8);
  hole.userData.iid = 'mousehole';
  g.add(hole);
  if (!interact.has('mousehole')) interact.set('mousehole', []);
  interact.get('mousehole').push(hole);

  // 邮差画像（后墙）
  const painting = box(1.0, 1.3, 0.08, 0xcfd8ec, 1.2, 3.1, -4.92);
  painting.add(box(1.14, 1.44, 0.05, 0xc9a45c, 0, 0, 0.04));
  tag(g, interact, 'painting', painting);

  // 旧地球仪
  const globe = new THREE.Group();
  globe.add(cyl(0.3, 0.4, 0.1, 0x8a5f3c, 0, 0.75, 0));
  const ball = sph(0.5, 0x9bc4d8, 0, 1.45, 0);
  ball.userData.spin = true;
  globe.add(ball);
  globe.add(cyl(0.03, 0.03, 0.5, 0x3e444d, 0, 1.1, 0));
  globe.position.set(3.6, 0, 1.8);
  globe.userData.iid = 'globe';
  g.add(globe);
  if (!interact.has('globe')) interact.set('globe', []);
  interact.get('globe').push(globe);

  // 房门（右墙）
  const door = new THREE.Group();
  door.add(box(1.15, 2.3, 0.14, 0x8a5f3c, 0, 0, 0));
  door.add(box(0.95, 0.85, 0.05, 0x9c7047, 0, 0.45, 0.09));
  door.add(box(0.95, 0.85, 0.05, 0x9c7047, 0, -0.55, 0.09));
  door.add(sph(0.09, 0xe6c25a, 0.42, 0, 0.1));
  door.position.set(4.75, 1.15, 0.6);
  door.userData.iid = 'door';
  g.add(door);
  if (!interact.has('door')) interact.set('door', []);
  interact.get('door').push(door);

  scene.add(g);

  // future: 书架倒塌 + 满地书
  const futureGroup = new THREE.Group();
  const fShelf = shelf.clone();
  fShelf.rotation.z = -1.25;
  fShelf.position.set(-3.1, 0.9, -0.5);
  futureGroup.add(fShelf);
  const scatterColors = [0xc9564c, 0x45528c, 0x3f7d5c, 0xd8a93c];
  for (let i = 0; i < 14; i++) {
    const bk = box(0.5, 0.3, 0.34, scatterColors[i % 4],
      -3.4 + Math.random() * 4.4, 0.16, -2.4 + Math.random() * 4.6);
    bk.rotation.y = Math.random() * Math.PI;
    futureGroup.add(bk);
  }
  const fDict = box(0.7, 0.36, 0.5, 0x5d4a6b, -4.2, 0.18, 2.3);
  fDict.rotation.y = 0.8;
  futureGroup.add(fDict);
  // 小老鼠（啃奶酪状）
  const mouse = new THREE.Group();
  mouse.add(sph(0.16, 0xb0a494, 0, 0.16, 0));
  mouse.add(sph(0.1, 0xc9bda9, 0, 0.3, 0.02));
  mouse.add(sph(0.05, 0x3a3348, 0, 0.28, 0.12));
  mouse.rotation.y = -1.4;
  mouse.position.set(-4.3, 0, 2.4);
  mouse.userData.iid = 'mousehole';
  futureGroup.add(mouse);
  fShelf.userData.iid = 'shelf';
  fDict.userData.iid = 'shelf';

  return { group: g, futureGroup, doorGroup: door, hideInFuture: [shelf] };
}

/* ---------- 房间 3：门厅 ---------- */
function buildHall(scene, interact) {
  const g = new THREE.Group();
  shell(g, { wall: 0x6f7b95, floor: 0xa8886a });

  // 立钟（后墙左）
  const clock = new THREE.Group();
  clock.add(box(1.1, 3.6, 0.62, 0x6e4a2e, 0, 1.8, 0));
  clock.add(box(1.2, 0.24, 0.7, 0x8a5f3c, 0, 3.7, 0));
  const face = cyl(0.42, 0.42, 0.08, 0xf5ead2, 0, 2.95, 0.34, 28);
  face.rotation.x = Math.PI / 2;
  const handH = box(0.05, 0.24, 0.04, 0x3a3350, 0, 3.02, 0.4);
  const handM = box(0.04, 0.32, 0.04, 0x3a3350, -0.06, 2.95, 0.4);
  handH.rotation.z = -2.62; // 11:55 → 时针近 12，分针 55 分
  handM.rotation.z = 1.83;
  const pendulum = new THREE.Group();
  pendulum.add(cyl(0.015, 0.015, 1.5, 0xd8c070, 0, -0.75, 0));
  pendulum.add(cyl(0.22, 0.22, 0.06, 0xe6c25a, 0, -1.5, 0));
  pendulum.position.set(0, 1.5, 0.1);
  pendulum.userData.swing = true;
  clock.add(face, handH, handM, pendulum);
  clock.position.set(-1.8, 0, -4.2);
  clock.userData.iid = 'clock';
  g.add(clock);
  if (!interact.has('clock')) interact.set('clock', []);
  interact.get('clock').push(clock, face, pendulum);

  // 大门（后墙中央）
  const frontdoor = new THREE.Group();
  for (const s of [-1, 1]) frontdoor.add(box(1.2, 2.7, 0.16, 0x8a5f3c, s * 0.62, 1.35, 0));
  frontdoor.add(box(2.9, 0.3, 0.2, 0x6e4a2e, 0, 2.9, 0));
  frontdoor.add(sph(0.1, 0xe6c25a, 0.3, 1.3, 0.12));
  frontdoor.add(sph(0.1, 0xe6c25a, -0.3, 1.3, 0.12));
  // 门框上毛线挂饰
  const garland = new THREE.Group();
  for (let i = 0; i < 7; i++) garland.add(sph(0.09, [0xd95d5d, 0xffd166, 0x6ee7c8][i % 3], 1.25 - i * 0.42, 3.05 + Math.sin(i) * 0.06, 0.14));
  frontdoor.add(garland);
  frontdoor.position.set(1.2, 0, -4.75);
  frontdoor.userData.iid = 'frontdoor';
  g.add(frontdoor);
  if (!interact.has('frontdoor')) interact.set('frontdoor', []);
  interact.get('frontdoor').push(frontdoor);

  // 门前地毯
  const mat = new THREE.Group();
  const matBase = box(1.9, 0.05, 1.1, 0xa34d5e, 0, 0.03, 0);
  matBase.userData.iid = 'mat';
  mat.add(matBase);
  mat.add(box(1.2, 0.055, 0.4, 0xd9a05e, 0, 0.04, 0));
  mat.position.set(1.0, 0, -3.0);
  g.add(mat);
  if (!interact.has('mat')) interact.set('mat', []);
  interact.get('mat').push(mat);

  // 工具柜（右墙）
  const toolbox = new THREE.Group();
  toolbox.add(box(1.35, 1.9, 0.62, 0x50607a, 0, 0.95, 0));
  toolbox.add(box(1.42, 0.14, 0.68, 0x3d4a60, 0, 1.92, 0));
  const lock = box(0.18, 0.26, 0.12, 0xe6c25a, 0, 1.0, 0.34);
  toolbox.add(lock);
  toolbox.position.set(4.6, 0, 0.2);
  toolbox.userData.iid = 'toolbox';
  g.add(toolbox);
  if (!interact.has('toolbox')) interact.set('toolbox', []);
  interact.get('toolbox').push(toolbox, lock);

  // 旧邮票墙（右墙）
  const stamps = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    stamps.add(box(0.34, 0.4, 0.04, [0x9bc4d8, 0xcfd8ec, 0xe8d9c0, 0xb8d0c0][i], 0, 2.6 - (i % 2) * 0.55, i * 0.42 - 0.6));
  }
  stamps.rotation.y = -Math.PI / 2;
  stamps.position.set(4.78, 0, 1.9);
  stamps.userData.iid = 'stamps';
  g.add(stamps);
  if (!interact.has('stamps')) interact.set('stamps', []);
  interact.get('stamps').push(stamps);

  // 衣帽架（左墙）
  const rack = new THREE.Group();
  rack.add(cyl(0.06, 0.09, 1.9, 0x8a5f3c, 0, 0.95, 0));
  for (let i = 0; i < 3; i++) {
    const hook = cyl(0.03, 0.03, 0.34, 0x8a5f3c, Math.cos(i * 2.1) * 0.17, 1.78, Math.sin(i * 2.1) * 0.17);
    hook.rotation.z = Math.cos(i * 2.1) * 0.8;
    rack.add(hook);
  }
  rack.add(box(0.56, 0.7, 0.16, 0x7a5f8a, 0.08, 1.35, 0.1)); // 小斗篷
  rack.position.set(-4.6, 0, 1.6);
  rack.userData.iid = 'rack';
  g.add(rack);
  if (!interact.has('rack')) interact.set('rack', []);
  interact.get('rack').push(rack);

  scene.add(g);

  // future: 摆锤飞出砸地板
  const futureGroup = new THREE.Group();
  const fPendulum = new THREE.Group();
  fPendulum.add(cyl(0.015, 0.015, 1.2, 0xd8c070, 0, -0.6, 0));
  fPendulum.add(cyl(0.22, 0.22, 0.06, 0xe6c25a, 0, -1.2, 0));
  fPendulum.rotation.z = -1.35; // 斜插在地上的姿态
  fPendulum.position.set(0.9, 1.2, -3.3);
  futureGroup.add(fPendulum);
  const crater = cyl(0.5, 0.62, 0.1, 0x3a3630, 0.9, 0.05, -3.3, 12);
  futureGroup.add(crater);
  for (let i = 0; i < 10; i++) {
    futureGroup.add(box(0.08, 0.05, 0.18, 0xc9b08a, 0.4 + Math.random() * 1.3, 0.03, -2.7 + Math.random() * 1.4));
  }
  const shatterGlass = box(0.9, 0.02, 0.6, 0xbfe0f0, -1.2, 0.03, -3.6);
  shatterGlass.rotation.y = 0.7;
  futureGroup.add(shatterGlass);

  return { group: g, futureGroup, doorGroup: frontdoor, garland, hideInFuture: [pendulum] };
}

export function buildRoom(i, scene, interact) {
  if (i === 0) return buildBedroom(scene, interact);
  if (i === 1) return buildStudy(scene, interact);
  return buildHall(scene, interact);
}

/* ---------- 房间灯光 ---------- */
export function roomLights(scene, index) {
  const lights = [];
  const amb = new THREE.AmbientLight(0x9aa4c8, index === 1 ? 0.55 : 0.5);
  const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x5a4a3a, 0.5);
  const dir = new THREE.DirectionalLight(0xfff0d8, 0.6);
  dir.position.set(2, 6, 3);
  lights.push(amb, hemi, dir);
  const main = new THREE.PointLight(0xffdbb0, 1.05, 18, 1.4);
  main.position.set(0, 4.3, 0);
  lights.push(main);
  lights.forEach((l) => scene.add(l));
  return lights;
}
