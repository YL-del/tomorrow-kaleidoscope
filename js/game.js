// 游戏主引擎：渲染循环、输入、交互、窥探未来、存档
import * as THREE from 'three';
import { ROOMS, ITEMS, ENDING } from './data.js';
import { buildRoom, roomLights, buildBoy } from './world.js';

const $ = (id) => document.getElementById(id);
const canvas = $('gl');

/* ---------- 全局状态 ---------- */
const SAVE_KEY = 'MINGRI_WEB_SAVE_V1';
let save = loadSave();

let menuMode = true;          // 标题界面时不驱动游戏
let roomIndex = 0;
let built = null;             // buildRoom 结果
let lights = [];
let peeking = false;
let peeksUsed = 0;
let eyeSpinV = 0.6;
let selItem = null;           // 选中的道具 id
let dialogState = null;       // { lines, idx, chars, cb }
let running = true;

/* ---------- 存档 ---------- */
function defaultSave() {
  return { roomId: 0, flags: {}, items: [], hintIdx: {}, seenIntro: {}, chapterDone: false };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(defaultSave(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return defaultSave();
}
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 忽略：隐私模式等 */ }
}
const flags = () => {
  const k = ROOMS[roomIndex].key;
  if (!save.flags[k]) save.flags[k] = {};
  return save.flags[k];
};
const has = (id) => save.items.includes(id);
const give = (id) => { if (!save.items.includes(id)) save.items.push(id); };
const drop = (id) => { save.items = save.items.filter((x) => x !== id); };

/* ---------- three.js 基础 ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x171310, 10, 26);
scene.background = new THREE.Color(0x171310);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 60);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 主角 ---------- */
const boy = buildBoy();
scene.add(boy.group);
const player = {
  pos: new THREE.Vector3(0, 0, 1.6),
  face: 0,
  speed: 3.0,
};

/* ---------- 输入 ---------- */
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.code;
  keys.add(k);
  if (k === 'KeyF') togglePeek();
  else if (k === 'KeyH') showHint();
  else if (k === 'Space' || k === 'Enter') { if (dialogState) clickDialog(); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let mouse = { x: 0, y: 0 };

canvas.addEventListener('pointermove', (e) => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
  ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
  updateProbe();
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || menuMode) return;
  if (dialogState) { clickDialog(); return; }
  const iid = hoverIID;
  if (!iid) return;
  if (peeking) {
    say(futureDesc(iid));
    return;
  }
  interact(iid);
});

/* ---------- 交互命中 ---------- */
let hoverIID = null;
function isShown(o) {
  let cur = o;
  while (cur) { if (cur.visible === false) return false; cur = cur.parent; }
  return true;
}
function findIID(o) {
  let cur = o;
  while (cur) { if (cur.userData && cur.userData.iid) return cur.userData.iid; cur = cur.parent; }
  return null;
}
function castIID() {
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    if (!isShown(h.object)) continue;
    const iid = findIID(h.object);
    if (!iid) continue;
    const spot = ROOMS[roomIndex].hotspots.find((s) => s.id === iid);
    if (!spot) continue;
    const dx = player.pos.x - spot.pos[0], dz = player.pos.z - spot.pos[1];
    if (dx * dx + dz * dz > 4.4 * 4.4) continue; // 太远
    return iid;
  }
  return null;
}
function updateProbe() {
  if (menuMode) { $('probe-tip').style.display = 'none'; return; }
  hoverIID = dialogState ? null : castIID();
  const tip = $('probe-tip');
  if (hoverIID) {
    const spot = ROOMS[roomIndex].hotspots.find((s) => s.id === hoverIID);
    tip.textContent = (peeking ? '「未来」· ' : '') + spot.label;
    tip.style.display = 'block';
    tip.style.left = mouse.x + 'px';
    tip.style.top = mouse.y + 'px';
    canvas.style.cursor = 'pointer';
  } else {
    tip.style.display = 'none';
    canvas.style.cursor = 'default';
  }
}

/* ---------- 对话 ---------- */
function say(lines, cb) {
  dialogState = { lines: Array.isArray(lines) ? lines : [lines], idx: 0, chars: 0, cb: cb || null };
  $('dialog').style.display = 'block';
  $('dialog-catch').classList.add('show');
  renderDialog();
}
function renderDialog() {
  const line = dialogState.lines[dialogState.idx] || '';
  const shown = line.slice(0, dialogState.chars);
  $('dialog').querySelector('.text').textContent = shown;
  $('dialog').querySelector('.next').textContent =
    dialogState.chars >= line.length ? '▼ 点击继续' : '（点击显示全部）';
}
function clickDialog() {
  if (!dialogState) return;
  const line = dialogState.lines[dialogState.idx] || '';
  if (dialogState.chars < line.length) { dialogState.chars = line.length; renderDialog(); return; }
  dialogState.idx++;
  dialogState.chars = 0;
  if (dialogState.idx >= dialogState.lines.length) {
    const cb = dialogState.cb;
    dialogState = null;
    $('dialog').style.display = 'none';
    $('dialog-catch').classList.remove('show');
    if (cb) cb();
  } else renderDialog();
}
$('dialog').addEventListener('pointerdown', (e) => { e.stopPropagation(); clickDialog(); });
$('dialog-catch').addEventListener('pointerdown', (e) => { e.stopPropagation(); clickDialog(); });

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- 道具栏 ---------- */
function renderInventory() {
  const wrap = $('inventory');
  wrap.innerHTML = '';
  const tip = $('sel-item-tip');
  tip.style.display = 'none';
  for (const id of save.items) {
    const it = ITEMS[id];
    const slot = document.createElement('div');
    slot.className = 'slot' + (selItem === id ? ' sel' : '');
    slot.innerHTML = `<span class="slot-name">${it.name}</span>`;
    slot.style.fontWeight = '700';
    slot.style.color = slotLabelColor(id);
    slot.textContent = it.name.slice(0, 2);
    slot.title = it.desc;
    slot.onclick = () => {
      selItem = selItem === id ? null : id;
      renderInventory();
      if (selItem) toast(`已选中「${it.name}」：点击场景里的目标来使用`);
    };
    wrap.appendChild(slot);
  }
  if (selItem) {
    tip.textContent = `已选中「${ITEMS[selItem].name}」→ 点击要使用的对象`;
    tip.style.display = 'block';
  }
}
function slotLabelColor(id) {
  return { glove: '#e8b04b', cheese: '#ffd166', key: '#e6c25a', wrench: '#9fb2c8' }[id] || '#fff';
}

/* ---------- 房间构建/切换 ---------- */
function clearScene() {
  // 先移出主角，避免误释放他的几何体/材质
  scene.remove(boy.group);
  while (scene.children.length) {
    const c = scene.children[0];
    scene.remove(c);
    c.traverse?.((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
  scene.add(boy.group);
}
function enterRoom(i, withIntro) {
  roomIndex = i;
  const room = ROOMS[i];
  clearScene();
  const interact = new Map();
  built = buildRoom(i, scene, interact);
  lights = roomLights(scene, i);
  built.futureGroup.visible = false;
  scene.add(built.futureGroup);

  player.pos.set(room.playerSpawn[0], 0, room.playerSpawn[1]);
  player.face = 0;
  camYaw = room.cameraYaw;
  peeking = false;
  peeksUsed = 0;
  selItem = null;

  $('room-label').textContent = room.name;
  $('room-sub').textContent = room.sub;
  $('peek-fx').classList.remove('show');
  $('peek-btn').classList.remove('on');
  updateSandglass();
  renderInventory();

  save.roomId = i;
  persist();

  if (withIntro && !save.seenIntro[room.key]) {
    save.seenIntro[room.key] = true;
    persist();
    say(room.intro);
  }
}

/* ---------- 交互逻辑 ---------- */
function interact(iid) {
  const room = ROOMS[roomIndex];
  const f = flags();

  // 出口门
  const exitId = room.isExitDoor || 'door';
  if (iid === exitId) return doorFlow(room, f);

  // 使用道具
  if (selItem) {
    const use = room.itemUse[iid] && room.itemUse[iid][selItem];
    if (use && (!use.if || use.if(f))) {
      if (use.consume) drop(selItem);
      selItem = null;
      if (use.set) Object.assign(f, use.set);
      if (use.give) give(use.give);
      persist();
      renderInventory();
      say(use.lines);
      return;
    }
    toast(`对「${labelOf(room, iid)}」使用${ITEMS[selItem].name}……好像没什么用。`);
    return;
  }

  // 特判的 inspect
  const special = SPECIAL_INSPECT[room.key] && SPECIAL_INSPECT[room.key][iid];
  if (special) { special(f); return; }

  const lines = room.inspect[iid];
  if (lines) say(lines);
}

function labelOf(room, iid) {
  const s = room.hotspots.find((x) => x.id === iid);
  return s ? s.label : iid;
}

/* 房间特判：给道具 / 分支台词 */
const SPECIAL_INSPECT = {
  bedroom: {
    toybox: (f) => {
      if (has('glove')) say(['玩具箱最底下还有一本画册，封皮上画着一个独眼的孩子，书名磨掉了。']);
      else if (f.kettleOff) say(['手套已经用上了。箱底只剩一本画册——《万花筒里的孩子》。']);
      else {
        give('glove');
        persist();
        renderInventory();
        say(['玩具箱里乱七八糟……最底下压着一双厚实的隔热手套。', '（获得道具：隔热手套）']);
      }
    },
    stove: (f) => {
      if (f.kettleOff) say(['水壶安安稳稳地待在石槽里，还冒着一点热气。炉火也小了。']);
      else say(['炉火烧得正旺，水壶咣当咣当响个不停，壶盖一跳一跳的。', '总觉得再这么烧下去，会出什么事。']);
    },
  },
  study: {
    desk: (f) => {
      if (has('cheese') || f.mouseLured) say(['抽屉空空的，只剩几张写废的信纸。']);
      else {
        give('cheese');
        persist();
        renderInventory();
        say(['书桌的抽屉一拉就开。里面是一块用蜡纸包好的旧奶酪。', '（获得道具：旧奶酪）']);
      }
    },
  },
  hall: {
    clock: (f) => {
      if (f.tightened) say(['钟身发出安稳的滴答声。指针停在 11:55——好像永远停在 11:55。']);
      else say(['立钟比人还高，钟面停在 11:55，摆锤还在轻轻地晃。', '摆锤顶上的那颗螺丝，松了大半圈。']);
    },
    mat: (f) => {
      if (!f.gotKey) {
        f.gotKey = true;
        give('key');
        persist();
        renderInventory();
        say(['门垫的一角翻开来——下面压着一枚黄铜钥匙！', '（获得道具：黄铜钥匙）']);
      } else {
        say(['地毯下面除了钥匙压出的小印子，什么都没有了。']);
      }
    },
    toolbox: (f) => {
      if (f.toolboxOpen) say(['柜门敞着，里面整整齐齐码着信。每一封的收件人，都是「昨天的阿堵」。']);
      else say(['柜门上挂着一把小铜锁。锁孔擦得发亮——最近一定常被人打开。']);
    },
  },
};

/* ---------- 门与章节流程 ---------- */
function doorFlow(room, f) {
  if (room.solved(f)) {
    if (roomIndex === ROOMS.length - 1) {
      // 第一章结局
      say(['钟声没有响起。阿堵深吸一口气，推开大门。'], () => showEnding());
    } else {
      say(room.door.passLines, () => {
        fadeTo(() => enterRoom(roomIndex + 1, true));
      });
    }
  } else {
    say(room.door.deniedLines);
  }
}

function showEnding() {
  save.chapterDone = true;
  persist();
  $('end-text').innerHTML = ENDING.lines.map((l) => `・${l}`).join('<br/>');
  $('end-screen').classList.add('show');
  $('hud').classList.remove('show');
  menuMode = true;
}
$('end-ok').onclick = () => {
  $('end-screen').classList.remove('show');
  $('title-screen').classList.remove('hidden');
  $('btn-continue').style.display = 'none';
  $('btn-start').textContent = '重新开始第一章';
};

/* 简单黑场转场 */
const fadeEl = document.createElement('div');
fadeEl.style.cssText = 'position:absolute;inset:0;background:#080a18;z-index:60;opacity:0;transition:opacity .5s;pointer-events:none';
document.body.appendChild(fadeEl);
function fadeTo(fn) {
  fadeEl.style.opacity = '1';
  setTimeout(() => {
    fn();
    setTimeout(() => { fadeEl.style.opacity = '0'; }, 120);
  }, 560);
}

/* ---------- 窥探未来 ---------- */
let camYaw = 0;
function togglePeek() {
  if (menuMode || dialogState) return;
  peeking = !peeking;
  const room = ROOMS[roomIndex];
  const f = flags();
  const danger = !room.solved(f);

  $('peek-fx').classList.toggle('show', peeking);
  $('peek-btn').classList.toggle('on', peeking);

  if (peeking) {
    if (peeksUsed === 3) toast('「眼睛有点酸了……不过没关系，再看一眼。」');
    peeksUsed++;
    updateSandglass();
    if (danger) {
      // 呈现被毁坏的未来
      built.futureGroup.visible = true;
      for (const m of built.hideInFuture || []) m.visible = false;
    }
    toast('眼中琉璃一转——十分钟后……');
  } else {
    built.futureGroup.visible = false;
    for (const m of built.hideInFuture || []) m.visible = true;
  }
}
function updateSandglass() {
  $('sand-count').textContent = Math.max(0, 3 - peeksUsed);
}
function futureDesc(iid) {
  const room = ROOMS[roomIndex];
  const f = flags();
  const table = room.solved(f) ? room.future.safe : room.future.danger;
  return [table[iid] || '十分钟后，这里似乎也没什么变化。'];
}

$('peek-btn').onclick = togglePeek;

/* ---------- 提示 ---------- */
function showHint() {
  if (menuMode || dialogState) return;
  const room = ROOMS[roomIndex];
  if (!save.hintIdx[room.key]) save.hintIdx[room.key] = 0;
  const i = Math.min(save.hintIdx[room.key], room.hints.length - 1);
  $('hint-text').textContent = `提示 ${i + 1} / ${room.hints.length}：` + room.hints[i];
  save.hintIdx[room.key] = Math.min(i + 1, room.hints.length - 1);
  persist();
  $('hint-screen').classList.add('show');
}
$('hint-btn').onclick = showHint;
$('hint-ok').onclick = () => $('hint-screen').classList.remove('show');

/* ---------- 标题界面 ---------- */
if (save.roomId > 0 || save.items.length || (save.seenIntro && Object.keys(save.seenIntro).length)) {
  if (!save.chapterDone) $('btn-continue').style.display = '';
}
$('btn-start').onclick = () => {
  save = defaultSave();
  persist();
  startGame(0);
};
$('btn-continue').onclick = () => startGame(save.roomId);

function startGame(roomId) {
  menuMode = false;
  $('title-screen').classList.add('hidden');
  $('hud').classList.add('show');
  enterRoom(roomId, true);
}

/* ---------- 碰撞 ---------- */
const COLLIDERS = [
  // 卧室
  [[-3.3, 0.2, 1.6], [3.4, 3.2, 1.0], [-2.7, -3.9, 1.0]],
  // 书房
  [[-4.4, -0.6, 1.4], [3.3, -1.4, 1.4], [3.6, 1.8, 0.8]],
  // 门厅
  [[-1.8, -4.2, 1.0], [4.6, 0.2, 1.1], [-4.6, 1.6, 0.7], [1.2, -4.6, 1.2]],
];
function collide(p) {
  p.x = Math.max(-4.3, Math.min(4.3, p.x));
  p.z = Math.max(-4.3, Math.min(4.3, p.z));
  for (const [cx, cz, r] of COLLIDERS[roomIndex]) {
    const dx = p.x - cx, dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * r;
      p.z = cz + (dz / d) * r;
    }
  }
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (!menuMode) {
    // 对话/窥视时不动
    const block = !!dialogState || menuMode;
    let moving = false;
    if (!block && !peeking) {
      let vx = 0, vz = 0;
      if (keys.has('KeyW')) vz += 1;
      if (keys.has('KeyS')) vz -= 1;
      if (keys.has('KeyA')) vx -= 1;
      if (keys.has('KeyD')) vx += 1;
      // 相机系移动
      let mx = 0, mz = 0;
      if (vx || vz) {
        const s = Math.sin(camYaw), c = Math.cos(camYaw);
        // fwd = (-s, -c)  right = (c, -s)
        mx = (-s) * vz + c * vx;
        mz = (-c) * vz + (-s) * vx;
        const len = Math.hypot(mx, mz);
        mx /= len; mz /= len;
        moving = true;
        player.pos.x += mx * player.speed * dt;
        player.pos.z += mz * player.speed * dt;
        collide(player.pos);
        const target = Math.atan2(mx, mz);
        let diff = target - player.face;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        player.face += diff * Math.min(1, dt * 12);
      }
      // Q/E 旋转视角
      const rot = (keys.has('KeyQ') ? 1 : 0) + (keys.has('KeyE') ? -1 : 0);
      camYaw += rot * dt * 1.9;
    }

    // 男孩动画
    boy.group.position.set(player.pos.x, 0, player.pos.z);
    boy.group.rotation.y = player.face;
    if (moving) {
      const sw = Math.sin(t * 11);
      boy.legL.rotation.x = sw * 0.6;
      boy.legR.rotation.x = -sw * 0.6;
      boy.armL.rotation.x = -sw * 0.5;
      boy.armR.rotation.x = sw * 0.5;
      boy.group.position.y = Math.abs(Math.sin(t * 11)) * 0.04;
    } else {
      boy.legL.rotation.x *= 0.8; boy.legR.rotation.x *= 0.8;
      boy.armL.rotation.x *= 0.8; boy.armR.rotation.x *= 0.8;
      boy.group.position.y = Math.sin(t * 2.2) * 0.012;
    }
    // 万花筒之瞳：平时缓缓旋转，窥探未来时加速旋转 + 花纹发亮
    eyeSpinV += ((peeking ? 6.0 : 0.6) - eyeSpinV) * Math.min(1, dt * 5);
    boy.eye.rotation.z -= eyeSpinV * dt;
    const glow = peeking ? 1.6 : 0.3 + Math.abs(Math.sin(t * 1.4)) * 0.25;
    for (const m of boy.eyeGlowMats) m.emissiveIntensity = glow;

    // 场景小动画：摆锤 / 火焰 / 地球仪
    scene.traverse((o) => {
      if (o.userData && o.userData.swing) o.rotation.z = Math.sin(t * 1.9) * 0.14;
      if (o.userData && o.userData.spin) o.rotation.y += dt * 0.25;
      if (o.userData && o.userData.energetic) {
        for (const flame of o.children) {
          flame.position.y = flame.userData.baseY + Math.abs(Math.sin(t * 7 + flame.userData.phase)) * 0.14;
          flame.rotation.y = Math.sin(t * 3 + flame.userData.phase) * 0.2;
        }
      }
    });

    // 相机跟随（第三人称，Q/E 绕男孩旋转；贴墙时按比例拉近，始终留在房间内）
    const dist = 4.6, height = 3.0, margin = 4.6;
    const dxo = Math.sin(camYaw) * dist, dzo = Math.cos(camYaw) * dist;
    let s = 1;
    if (Math.abs(dxo) > 1e-4) s = Math.min(s, (margin - Math.abs(player.pos.x)) / Math.abs(dxo));
    if (Math.abs(dzo) > 1e-4) s = Math.min(s, (margin - Math.abs(player.pos.z)) / Math.abs(dzo));
    s = Math.max(0.35, s);
    const cx = player.pos.x + dxo * s;
    const cz = player.pos.z + dzo * s;
    camera.position.lerp(new THREE.Vector3(cx, height, cz), Math.min(1, dt * 8));
    camera.lookAt(player.pos.x, 1.3, player.pos.z);
  }

  // 对话打字机推进
  if (dialogState) {
    const line = dialogState.lines[dialogState.idx] || '';
    if (dialogState.chars < line.length) {
      dialogState.chars = Math.min(line.length, dialogState.chars + Math.round(dt * 60) || 1);
      renderDialog();
    }
  }

  renderer.render(scene, camera);
}

// 预构建第一间房（标题界面背后就是房间）
enterRoom(0, false);
loop();
