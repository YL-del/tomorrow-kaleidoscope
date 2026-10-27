/* game.js —— 《明日万花筒》2D 完整版引擎
   WASD 自由移动 · F 切换里世界 · E 调查 · 三章完整流程 */

import { poly, ell, line, INK, PAL, hash, makeGrain, flame } from './art.js';
import { drawBoy, drawNurse, drawLurker, drawCrawler, drawKaleidoEye } from './chars.js';
import { ROOMS, FLOOR_TOP, FLOOR_BOT } from './rooms.js';

const $ = s => document.querySelector(s);
const cv = $('#gl'), ctx = cv.getContext('2d');
const VW = 1280, VH = 720;
const SAVE_KEY = 'MINGRI_2D_SAVE_V2';

/* ---------- 全局状态 ---------- */
const state = {
  scene: 'title',          // title | play | end
  chapter: 1, room: 'foyer',
  world: 'real',           // real | other
  F: {},                   // 剧情旗标
  inv: [],                 // 物品
  hearts: 3, maxHearts: 3,
  energy: 100,             // 瞳力
  blind: 0, iframes: 0, switchFx: 0, switchDir: 0,
  px: 640, py: 560, facing: 'down', walkT: 0, moving: false,
  camX: 0,
  trans: 0,                // 房间切换淡入淡出
  hurtFx: 0,
};
let monsters = [];         // 当前房间怪物运行时
let soot = [];             // 里世界烟尘
const keys = {};
let grain = null;

/* ---------- 对话 ---------- */
const DIALOGS = [];
let onDialogEnd = null, showing = false, twTimer = null;
function say(lines, cb) { DIALOGS.push(...lines); if (cb) onDialogEnd = cb; if (!showing) nextDialog(); }
function nextDialog() {
  clearInterval(twTimer);
  if (!DIALOGS.length) {
    if (!showing) return;
    showing = false; $('#dialog').classList.remove('show');
    const cb = onDialogEnd; onDialogEnd = null; if (cb) cb();
    return;
  }
  showing = true;
  const d = DIALOGS.shift();
  $('#dialog').classList.add('show');
  const known = ['鹿先生', '兔小姐', '猫掌柜', '山羊神父', '猪大叔', '守塔人'];
  const idx = d.indexOf('：');
  const who = known.find(k => d.startsWith(k));
  const name = who && idx > 0 && idx <= who.length + 1 ? d.slice(0, idx) : '阿堵';
  const body = name === '阿堵' ? d : d.slice(name.length + 1);
  $('#dialog-name').textContent = name;
  const el = $('#dialog-text');
  el._full = body; el.textContent = '';
  let i = 0;
  twTimer = setInterval(() => {
    i += 2; el.textContent = body.slice(0, i);
    if (i >= body.length) clearInterval(twTimer);
  }, 26);
}
$('#dialog').addEventListener('click', () => {
  const el = $('#dialog-text');
  if (showing && el.textContent.length < el._full.length) el.textContent = el._full;
  else nextDialog();
});

/* ---------- 提示 / toast ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
const HINTS = {
  bedroom: '找找能生火的东西——地窖很黑。', foyer: '大门缺了门把。门把只存在于「里世界」。',
  study: '先主的肖像提示了顺序。用 F 看看墙上。', cellar: '里世界的工作台上放着你需要的东西……但里面有东西在巡逻。',
  street: '分别探访三栋房子。钟响，雾散。', shop: '猫掌柜收旧物——越舍不得的越好。',
  church: '三圣像齐望圣坛，再点三支老蜡。', clinic: '有些东西要用里世界的眼睛才看得见。小心护士。',
  lh1: '每层楼都有一道里世界的闸杆。', lh2: '小心爬行之物——它很快。', lh3: '最后一层。纸就在里世界的桌上。',
  lhtop: '把信写完。',
};
function showHint() { toast('提示：' + (HINTS[state.room] || '按 F 切换里世界看看。')); }

/* ---------- 物品 ---------- */
const ITEM_ICON = { '火柴': '🜂', '铜钥匙': '🗝', '地窖钥匙': '🗝', '大门门把': '⚬', '银怀表': '⏱', '蜡烛': '🕯', '绷带': '➕', '旧钢笔': '✒', '墨水': '🖋', '信纸': '📄', '钟楼钥匙': '🗝' };
function refreshInv() {
  const el = $('#inv'); el.innerHTML = '';
  state.inv.forEach(k => {
    const d = document.createElement('div');
    d.className = 'inv-item'; d.title = k;
    d.innerHTML = `<span class="ic">${ITEM_ICON[k] || '◆'}</span><span class="nm">${k}</span>`;
    el.appendChild(d);
  });
  if (!state.inv.length) el.innerHTML = '<div class="inv-empty">— 行囊空空 —</div>';
}
function gainItem(name) { state.inv.push(name); refreshInv(); toast(`获得「${name}」`); }
function consumeItem(name) { const i = state.inv.indexOf(name); if (i >= 0) state.inv.splice(i, 1); refreshInv(); }
function hasItem(name) { return state.inv.includes(name); }

/* ---------- 存档 ---------- */
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ chapter: state.chapter, room: state.room, F: state.F, inv: state.inv, hearts: state.hearts })); } catch (e) { }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!d || !d.room) return false;
    Object.assign(state, { chapter: d.chapter || 1, room: d.room, F: d.F || {}, inv: d.inv || [], hearts: d.hearts ?? 3, energy: 100, world: 'real' });
    return true;
  } catch (e) { return false; }
}

/* ---------- 房间切换 ---------- */
function gotoRoom(room) {
  const R = ROOMS[room];
  const prev = state.room;
  state.room = room;
  state.chapter = R.chapter || state.chapter;
  if (state.world === 'other') { state.world = 'real'; syncWorldUI(); }
  const sp = (R.spawnFrom && R.spawnFrom[prev]) || R.spawn;
  state.px = sp.x; state.py = sp.y; state.facing = 'down';
  spawnMonsters();
  $('#room-label').innerHTML = R.label + `<div id="room-sub">第${['一', '二', '三'][state.chapter - 1]}章 · ${['雾中宅邸', '困在昨天的小镇', '写给昨天的信'][state.chapter - 1]}</div>`;
  state.trans = 1;
  save();
}
function spawnMonsters() {
  const R = ROOMS[state.room];
  monsters = (R.monsters ? R.monsters(state.F) : []).map(m => ({ ...m, mx: m.x, my: m.y, cd: 0, lunge: 0, lvx: 0, lvy: 0, wt: Math.random() * 6, dead: false }));
}

/* ---------- 里世界切换 ---------- */
function toggleWorld() {
  if (state.scene !== 'play') return;
  if (state.world === 'real') {
    if (state.energy < 12) { toast('瞳力不足，眼睛需要休息。'); return; }
    state.world = 'other'; state.switchFx = 1; state.switchDir = 1;
    spawnMonsters();
    banner('里 世 界');
  } else {
    state.world = 'real'; state.switchFx = 1; state.switchDir = -1;
    banner('现 实');
  }
  syncWorldUI();
  save();
}
function banner(txt) {
  const b = $('#peek-banner'); b.textContent = txt;
  b.classList.add('show');
  clearTimeout(banner._t); banner._t = setTimeout(() => b.classList.remove('show'), 1400);
}
function syncWorldUI() {
  document.body.classList.toggle('in-other', state.world === 'other');
}

/* ---------- 章节 ---------- */
function startChapter2() {
  state.chapter = 2; save();
  say([
    '门开了。雾像潮水一样涌进来，又在门槛前停住——仿佛它也在等你先走。',
    '湖对岸的小镇就在雾里。鹿先生：路上小心，客人。镇上的人……都很念旧。',
  ], () => gotoRoom('street'));
}
function startChapter3() {
  state.chapter = 3; save();
  say([
    '雾散开的那一刻，你看见了湖心的灯塔——它一直都在，只是从来没有人在意。',
    '灯塔的窗口透出一点暖光，像有人在里面等了很久。',
  ], () => gotoRoom('lh1'));
}
function ringBell() {
  say(['你抓住钟绳，用尽全力——', '——当。', '当——', '当————',
    '钟声撞散了雾。整个小镇像被水洗过一样清晰起来。猪大叔在长街尽头朝你挥手，喊了句什么，被风带走了。'],
    () => { state.F.bellRung = true; save(); gotoRoom('street'); toast('雾散了。东侧栈桥通了。'); });
}
function writeLetter() {
  consumeItem('旧钢笔'); consumeItem('墨水'); consumeItem('信纸');
  state.F.letterWritten = true; save();
  say([
    '你坐下来。笔尖落纸的瞬间，里世界与现实第一次安静得像同一个地方。',
    '「致昨天：',
    '我没有忘记那场火。爸爸，妈妈，我每天都能看见你们站在灯塔下面，只是我一直不敢用这只眼睛好好看。',
    '今天我看清了。你们在笑。',
    '明天我会走出这座塔，替所有人看一下后天。灯会重新亮起来——这一次，是给活人点的。」',
    '——写完了。窗外的天，正一点一点亮起来。',
  ], () => { state.scene = 'end'; showEnd(); });
}
function showEnd() {
  $('#end-screen').classList.add('show');
  $('#end-title').textContent = '雾 尽 · 完';
  $('#end-text').innerHTML = '雾散尽之后，<br>湖对岸的小镇——<br>今天终于建成了。<br><br>阿堵走出灯塔，走进他看见过的明天。<br><br><span style="opacity:.55">《明日万花筒》全三章 · 完</span>';
}

/* ---------- 怪物 AI ---------- */
function updMonsters(dt) {
  if (state.world !== 'other') return;
  const R = ROOMS[state.room];
  monsters.forEach(m => {
    if (m.dead) return;
    const dx = state.px - m.mx, dy = state.py - m.my;
    const dist = Math.hypot(dx, dy);
    if (!isFinite(dist) || dist < 1) { m.mx = m.x; m.my = m.y; return; }
    m.cd = Math.max(0, m.cd - dt);
    if (m.type === 'nurse') {
      if (dist < 280) { m.mx += (dx / dist) * m.speed * dt; m.my += (dy / dist) * m.speed * dt; }
      else { m.wt += dt; m.mx += Math.sin(m.wt * .8 + m.seed) * 22 * dt; m.my += Math.cos(m.wt * .6 + m.seed) * 22 * dt; }
    } else if (m.type === 'lurker') {
      if (m.lunge > 0) {
        m.lunge -= dt; m.mx += m.lvx * dt; m.my += m.lvy * dt;
      } else if (dist < (m.range || 320)) {
        m.mx += (dx / dist) * m.speed * dt; m.my += (dy / dist) * m.speed * dt;
        if (dist < 150 && m.cd <= 0) {
          m.lunge = .42; m.cd = 2.2;
          const sp = 330; m.lvx = dx / dist * sp; m.lvy = dy / dist * sp;
          toast('它冲过来了——快躲开！');
        }
      } else { m.wt += dt; m.mx += Math.sin(m.wt * .5) * 14 * dt; }
    } else if (m.type === 'crawler') {
      const perp = Math.sin(m.wt * 6 + m.seed * 2) * 70;
      m.wt += dt;
      const nx = dx / dist, ny = dy / dist;
      m.mx += (nx * m.speed + -ny * perp) * dt; m.my += (ny * m.speed + nx * perp) * dt;
    }
    // 夹在房间内
    const W = R.W || 1280;
    m.mx = Math.max(70, Math.min(W - 70, m.mx));
    m.my = Math.max(FLOOR_TOP + 20, Math.min(FLOOR_BOT, m.my));
    // 伤害
    if (dist < 38 && state.iframes <= 0) hurtPlayer(dx, dy);
  });
}
function hurtPlayer(dx, dy) {
  state.hearts--; state.iframes = 1.6; state.hurtFx = .5;
  const d = Math.hypot(dx, dy) || 1;
  // 分步碰撞检测的击退：绝不让玩家嵌进墙里
  const R = ROOMS[state.room];
  for (let s = 0; s < 6; s++) {
    const nx = state.px + dx / d * 15, ny = state.py + dy / d * 15;
    if (collides(R, nx, ny)) break;
    state.px = nx; state.py = ny;
  }
  state.px = Math.max(34, Math.min((R.W || 1280) - 34, state.px));
  state.py = Math.max(FLOOR_TOP + 26, Math.min(FLOOR_BOT, state.py));
  stingSound();
  if (state.hearts <= 0) { death(); return; }
  toast('它碰到了你！剩余 ' + state.hearts + ' 颗心');
}
function death() {
  say(['眼前一黑。', '……', '你在原地醒来。那只眼睛还在，火也还在烧。故事还没有结束。'], () => {
    state.hearts = 3; state.energy = 100; state.world = 'real'; syncWorldUI();
    const R = ROOMS[state.room];
    state.px = R.spawn.x; state.py = R.spawn.y;
    spawnMonsters(); save();
  });
}

/* ---------- 玩家 ---------- */
function updPlayer(dt) {
  let dx = 0, dy = 0;
  if (keys.KeyW || keys.ArrowUp) dy -= 1;
  if (keys.KeyS || keys.ArrowDown) dy += 1;
  if (keys.KeyA || keys.ArrowLeft) dx -= 1;
  if (keys.KeyD || keys.ArrowRight) dx += 1;
  const run = keys.ShiftLeft || keys.ShiftRight;
  const sp = (run ? 235 : 155) * dt;
  state.moving = dx !== 0 || dy !== 0;
  if (state.moving) {
    const l = Math.hypot(dx, dy); dx = dx / l * sp; dy = dy / l * sp;
    if (Math.abs(dx) > Math.abs(dy)) state.facing = dx > 0 ? 'right' : 'left';
    else state.facing = dy > 0 ? 'down' : 'up';
    moveCollide(dx, dy);
    state.walkT += dt * (run ? 1.5 : 1);
  } else state.walkT = 0;

  // 瞳力
  if (state.world === 'other') {
    state.energy = Math.max(0, state.energy - 3.5 * dt);
    if (state.energy <= 0) {
      state.world = 'real'; state.blind = 2.4; state.switchFx = 1; state.switchDir = -1;
      syncWorldUI(); banner('瞳 力 耗 尽');
      stingSound();
    }
  } else {
    state.energy = Math.min(100, state.energy + 11 * dt);
    state.blind = Math.max(0, state.blind - dt);
  }
  state.iframes = Math.max(0, state.iframes - dt);
  state.hurtFx = Math.max(0, state.hurtFx - dt);
  state.switchFx = Math.max(0, state.switchFx - dt * 2.2);
  state.trans = Math.max(0, state.trans - dt * 1.6);

  // 烟尘
  if (state.world === 'other' && soot.length < 40 && Math.random() < .4) {
    soot.push({ x: Math.random() * VW, y: -10, v: 20 + Math.random() * 30, r: 1 + Math.random() * 2.4, a: .2 + Math.random() * .3 });
  }
  soot = soot.filter(p => { p.y += p.v * dt; p.x += Math.sin(p.y * .02) * 12 * dt; return p.y < VH + 10; });

  // NaN 防护：坐标异常时复位到出生点
  if (!isFinite(state.px) || !isFinite(state.py)) {
    const R0 = ROOMS[state.room];
    state.px = R0.spawn.x; state.py = R0.spawn.y;
  }

  updMonsters(dt);
}
function collides(R, nx, ny) {
  const hw = 13, hh = 10;
  for (const [wx, wy, ww, wh] of (R.walls || [])) {
    if (nx + hw > wx && nx - hw < wx + ww && ny + hh > wy && ny - hh < wy + wh) return true;
  }
  return !(nx > 30 && nx < (R.W || 1280) - 30 && ny > FLOOR_TOP + 24 && ny < FLOOR_BOT);
}
function moveCollide(dx, dy) {
  const R = ROOMS[state.room];
  // 脱困模式：若当前已嵌在墙里，允许自由移动走出
  if (collides(R, state.px, state.py)) {
    state.px += dx; state.py += dy;
    state.px = Math.max(34, Math.min((R.W || 1280) - 34, state.px));
    state.py = Math.max(FLOOR_TOP + 26, Math.min(FLOOR_BOT, state.py));
    return;
  }
  if (!collides(R, state.px + dx, state.py)) state.px += dx;
  if (!collides(R, state.px, state.py + dy)) state.py += dy;
}

/* ---------- 交互 ---------- */
function nearestHotspot() {
  const R = ROOMS[state.room];
  let best = null, bd = 1e9;
  for (const h of (R.hotspots || [])) {
    if (h.show && !h.show(state.F)) continue;
    if (h.world === 'other' && state.world !== 'other') continue;
    const d = Math.hypot(state.px - h.x, state.py - h.y);
    if (d < h.r && d < bd) { bd = d; best = h; }
  }
  return best;
}
function interact() {
  const h = nearestHotspot();
  if (!h) { return; }
  h.act(state.F, G);
}
function turnStatue(i) {
  const st = state.F.statues || (state.F.statues = [2, 0, 3]);
  st[i] = (st[i] + 1) % 4;
  if (st.every(v => v === 0)) {
    state.F.statuesSolved = true; save();
    say(['三圣像同时垂下头，齐齐望向圣坛——像三个终于等到答案的人。']);
  } else toast('圣像转动了。（全都面向下方时即是齐望圣坛）');
}
function pullBook(color) {
  const F = state.F;
  if (!F.sawWriting) {
    say(['阿堵：金……青……绯？看不出顺序。书脊上什么标记都没有。', '（也许该用另一双眼睛，看看这面墙上留下了什么。）']); return;
  }
  F.bookSeq = F.bookSeq || [];
  if (F.bookSeq[F.bookSeq.length - 1] !== color || F.bookSeq.length === 0) F.bookSeq.push(color);
  const want = ['gold', 'teal', 'crimson'];
  const cur = F.bookSeq.slice(-3);
  if (cur.length === 3 && cur.every((c, i) => c === want[i])) {
    F.booksSolved = true; F.keyCellar = true; save(); gainItem('地窖钥匙');
    say(['「咔。」金、青、绯——书架深处弹开一只暗格。', '暗格里躺着一把沉重的铁钥匙，柄上刻着： cellar。', '获得了「地窖钥匙」。']);
  } else if (cur.length >= 3) {
    F.bookSeq = [color]; toast('书架咯咯响了两声，又合上了。');
  } else toast('抽出了一本书……（已抽 ' + cur.length + '/3）');
}

/* ---------- G：给热点的 API ---------- */
const G = {
  say, gainItem, consumeItem, hasItem, gotoRoom, save, toast,
  pullBook, turnStatue, startChapter2, startChapter3, ringBell, writeLetter,
};

/* ---------- 音效（WebAudio 极简） ---------- */
let AC = null, droneOsc = null, droneGain = null;
function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    droneGain = AC.createGain(); droneGain.gain.value = 0; droneGain.connect(AC.destination);
    droneOsc = AC.createOscillator(); droneOsc.type = 'sawtooth'; droneOsc.frequency.value = 46;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140;
    droneOsc.connect(f); f.connect(droneGain); droneOsc.start();
  } catch (e) { }
}
function drone(on) { if (!AC) return; droneGain.gain.linearRampToValueAtTime(on ? .045 : 0, AC.currentTime + .6); }
function stingSound() {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'square'; o.frequency.setValueAtTime(220, AC.currentTime);
  o.frequency.exponentialRampToValueAtTime(70, AC.currentTime + .25);
  g.gain.setValueAtTime(.12, AC.currentTime); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + .3);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + .32);
}
let muted = false;
function toggleMute() { muted = !muted; if (droneGain) droneGain.gain.value = muted ? 0 : (state.world === 'other' ? .045 : 0); toast(muted ? '已静音' : '声音开启'); }

/* ---------- 绘制 ---------- */
function drawScene(t, dt) {
  const R = ROOMS[state.room];
  const W = R.W || VW;
  state.camX = W > VW ? Math.max(0, Math.min(W - VW, state.px - VW / 2)) : 0;
  ctx.save();
  ctx.translate(-state.camX, 0);
  // 房间
  ctx.fillStyle = '#171310'; ctx.fillRect(0, 0, W, VH);
  R.draw(ctx, t, state.F);

  const other = state.world === 'other';
  if (other) {
    // 去饱和 + 锈色
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0,15%,46%)'; ctx.fillRect(0, 0, W, VH);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#8a6a5c'; ctx.fillRect(0, 0, W, VH);
    ctx.globalCompositeOperation = 'source-over';
    // 里世界独有物（全彩浮于其上）
    if (R.otherDecor) R.otherDecor(ctx, t, state.F);
    // 怪物
    monsters.forEach(m => {
      if (m.dead) return;
      const fn = m.type === 'nurse' ? drawNurse : m.type === 'lurker' ? drawLurker : drawCrawler;
      fn(ctx, m.mx, m.my, 1.1, t, m.seed);
    });
  }

  // 交互点提示（最近的）
  const nh = nearestHotspot();
  if (nh) {
    const bx = nh.x, by = nh.y - 46 + Math.sin(t * 3) * 3;
    ctx.save(); ctx.globalAlpha = .92;
    ctx.fillStyle = '#f4ecd6'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const label = nh.name + (nh.world === 'other' ? ' ㊙' : '');
    ctx.font = '15px "Kaiti SC","KaiTi",serif';
    const tw = ctx.measureText(label).width + 46;
    ctx.beginPath(); ctx.roundRect(bx - tw / 2, by - 14, tw, 26, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f2620'; ctx.textAlign = 'left';
    ctx.fillText(label, bx - tw / 2 + 8, by + 4);
    ctx.fillStyle = '#8e3b32';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('E', bx - tw / 2 + ctx.measureText(label).width + 18, by + 4);
    ctx.restore();
  }

  // 玩家
  const blink = state.iframes > 0 && Math.floor(t * 12) % 2 === 0;
  if (!blink) {
    ell(ctx, state.px, state.py + 3, 22, 7, { fill: 'rgba(0,0,0,.22)', stroke: null, amp: .5, seed: 5 });
    drawBoy(ctx, state.px, state.py, 1.02, state.facing, state.moving ? state.walkT : 0, {
      other, spin: t * (other ? 5.2 : .9),
    });
  }
  ctx.restore();

  // 里世界氛围
  if (other) {
    ctx.save();
    soot.forEach(p => { ctx.globalAlpha = p.a; ctx.fillStyle = '#1a0f0c'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = .16;
    for (let i = 0; i < 3; i++) {
      const fx = ((t * 18 * (i + 1)) % (VW + 400)) - 200;
      ell(ctx, fx, 200 + i * 160, 260, 70, { fill: '#5c3428', stroke: null, amp: 2, seed: 320 + i });
    }
    ctx.restore();
    // 瞳力低警告
    if (state.energy < 30) {
      ctx.save(); ctx.globalAlpha = (Math.sin(t * 6) * .5 + .5) * .3;
      const g = ctx.createRadialGradient(VW / 2, VH / 2, 200, VW / 2, VH / 2, 720);
      g.addColorStop(0, 'rgba(158,43,37,0)'); g.addColorStop(1, 'rgba(158,43,37,.9)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); ctx.restore();
    }
  }

  // 黑暗房间（地窖）
  if (R.dark === true) {
    const lit = state.F.lampLit;
    const pr = lit ? 360 : 110;
    const g = ctx.createRadialGradient(state.px - state.camX, state.py - 30, pr * .25, state.px - state.camX, state.py - 30, pr);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, lit ? 'rgba(4,2,0,.92)' : 'rgba(2,1,0,.985)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  } else if (R.dark === 'dim') {
    const g = ctx.createRadialGradient(state.px - state.camX, state.py - 40, 180, state.px - state.camX, state.py - 40, 620);
    g.addColorStop(0, 'rgba(10,12,18,.06)'); g.addColorStop(1, 'rgba(8,10,16,.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }

  // 受伤 / 瞎 / 切换特效
  if (state.hurtFx > 0) { ctx.fillStyle = `rgba(158,43,37,${state.hurtFx * .5})`; ctx.fillRect(0, 0, VW, VH); }
  if (state.blind > 0) { ctx.fillStyle = `rgba(3,2,1,${Math.min(1, state.blind * .55)})`; ctx.fillRect(0, 0, VW, VH); }
  if (state.switchFx > 0) {
    const p = 1 - state.switchFx;
    const g = ctx.createRadialGradient(state.px - state.camX, state.py - 40, 0, state.px - state.camX, state.py - 40, 1400 * p);
    g.addColorStop(0, state.world === 'other' ? 'rgba(158,43,37,.28)' : 'rgba(185,194,196,.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  if (state.trans > 0) { ctx.fillStyle = `rgba(8,6,4,${state.trans})`; ctx.fillRect(0, 0, VW, VH); }
}

/* ---------- 标题画面 ---------- */
function drawTitle(t) {
  ctx.fillStyle = '#b9c2c4'; ctx.fillRect(0, 0, VW, VH);
  // 山
  poly(ctx, [[0, 380], [200, 210], [420, 390], [640, 240], [900, 400], [1120, 260], [1280, 380], [1280, 720], [0, 720]], { fill: '#a7adae', stroke: null, amp: 1.5, seed: 401 });
  poly(ctx, [[0, 470], [300, 320], [620, 480], [940, 330], [1280, 460], [1280, 720], [0, 720]], { fill: '#8a8f90', stroke: null, amp: 1.5, seed: 402 });
  for (let i = 0; i < 24; i++) {
    const x = 30 + i * 54 + hash(i, 1) * 12;
    const y = 470 + hash(i, 2) * 30;
    poly(ctx, [[x - 10, y], [x, y - 30 - hash(i, 3) * 12], [x + 10, y]], { fill: '#4a524c', lw: 1.6, amp: .7, seed: 403 + i });
  }
  // 湖
  ctx.fillStyle = '#7e8a8a'; ctx.fillRect(0, 520, VW, 200);
  for (let i = 0; i < 5; i++) ell(ctx, 300 + i * 180, 560 + (i % 3) * 50, 60, 8, { fill: '#9e2b25', stroke: null, amp: 1, seed: 420 + i, alpha: .4 });
  // 雾
  ctx.globalAlpha = .25;
  for (let i = 0; i < 4; i++) ell(ctx, ((t * 14 * (i + 1)) % 1600) - 160, 430 + i * 60, 300, 60, { fill: '#c5c9c6', stroke: null, amp: 2, seed: 430 + i });
  ctx.globalAlpha = 1;
  // 石台与阿堵
  poly(ctx, [[540, 640], [740, 640], [760, 720], [520, 720]], { fill: '#8a8f90', lw: 3, amp: 1.2, seed: 440 });
  drawBoy(ctx, 640, 648, 1.3, 'down', 0, { spin: t * 1.2 });
}

/* ---------- 主循环 ---------- */
let last = 0;
function loop(ts) {
  requestAnimationFrame(loop);   // 先排下一帧：任何异常都不再冻结游戏
  const t = ts / 1000;
  const dt = Math.min(.05, t - (last || t));
  last = t;
  try {
    if (state.scene === 'title') drawTitle(t);
    else if (state.scene === 'play') { updPlayer(dt); drawScene(t, dt); }
    else if (state.scene === 'end') { drawTitle(t * .4); }
    // 颗粒
    if (grain) { ctx.globalAlpha = .5; ctx.drawImage(grain, (t * 7) % 40 - 40, (t * 5) % 40 - 40, VW + 40, VH + 40); ctx.globalAlpha = 1; }
    // HUD 刷新
    if (state.scene === 'play') updateHUD();
  } catch (e) {
    if (document.title.indexOf('ERR:') !== 0) document.title = 'ERR:' + e.message;
  }
}
function updateHUD() {
  const h = $('#hearts');
  const want = '❤'.repeat(state.hearts) + '<span class="off">' + '❤'.repeat(state.maxHearts - state.hearts) + '</span>';
  if (h._v !== want) { h.innerHTML = want; h._v = want; }
  const e = $('#energy-fill');
  const v = Math.round(state.energy);
  if (e._v !== v) { e.style.width = v + '%'; e._v = v; e.classList.toggle('low', v < 30); }
  $('#eye-btn').classList.toggle('on', state.world === 'other');
}

/* ---------- 开始 ---------- */
function startGame(fresh) {
  initAudio();
  if (fresh) {
    state.chapter = 1; state.room = 'foyer'; state.F = {}; state.inv = []; state.hearts = 3; state.energy = 100; state.world = 'real';
    const R = ROOMS.foyer; state.px = R.spawn.x; state.py = R.spawn.y;
    syncWorldUI(); refreshInv(); save();
    gotoRoom('foyer');
    setTimeout(() => say([
      '阿堵：……又是这个梦。湖，雾，还有烧焦的味道。',
      '阿堵：醒来的时候，我就在这栋宅子的门厅里。左眼看得见雾，右眼看得见——雾后面的东西。',
      '（WASD 移动 · Shift 疾跑 · E 调查 · F 万花筒之瞳 · H 提示）',
    ]), 700);
  } else {
    if (!load()) { startGame(true); return; }
    syncWorldUI(); refreshInv();
    gotoRoom(state.room);
    toast('欢迎回来。第' + ['一', '二', '三'][state.chapter - 1] + '章。');
  }
  state.scene = 'play';
  $('#title-screen').classList.remove('show');
}

/* ---------- 输入 ---------- */
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (state.scene !== 'play') return;
  if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); interact(); }
  if (e.code === 'KeyF') { e.preventDefault(); toggleWorld(); }
  if (e.code === 'KeyH') showHint();
  if (e.code === 'KeyQ') {
    if (hasItem('绷带') && state.hearts < state.maxHearts) { consumeItem('绷带'); state.hearts++; toast('缠上绷带。感觉好些了。（' + state.hearts + '/' + state.maxHearts + '）'); }
    else if (hasItem('绷带')) toast('现在用不上。');
  }
  if (e.code === 'KeyM') toggleMute();
  if (showing && (e.code === 'KeyE' || e.code === 'Space')) { $('#dialog-text').textContent = $('#dialog-text')._full; }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
cv.addEventListener('click', e => {
  if (state.scene !== 'play' || showing) return;
  const r = cv.getBoundingClientRect();
  const cx = (e.clientX - r.left) / r.width * VW + state.camX;
  const cy = (e.clientY - r.top) / r.height * VH;
  const R = ROOMS[state.room];
  for (const h of (R.hotspots || [])) {
    if (h.show && !h.show(state.F)) continue;
    if (h.world === 'other' && state.world !== 'other') continue;
    if (Math.hypot(cx - h.x, cy - h.y) < h.r * .9) { h.act(state.F, G); return; }
  }
});

/* ---------- 调试 ---------- */
window.__act = id => { const R = ROOMS[state.room]; const h = (R.hotspots || []).find(x => x.id === id); if (h && (!h.show || h.show(state.F))) h.act(state.F, G); };
window.__state = () => state;
window.__goto = r => { state.scene = 'play'; $('#title-screen').classList.remove('show'); gotoRoom(r); };
window.__world = w => { state.world = w; syncWorldUI(); spawnMonsters(); };
window.__give = k => { state.inv.push(k); refreshInv(); };
if (new URLSearchParams(location.search).get('autotest')) {
  // 同步全流程测试
  const log = [];
  const box = document.createElement('div'); box.id = 'autolog';
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;background:rgba(0,0,0,.7);color:#8f8;font:12px monospace;padding:6px;max-width:900px;white-space:pre-wrap;';
  document.body.appendChild(box);
  const step = (name, fn) => { try { fn(); drain(); log.push(name + ':ok'); } catch (e) { log.push(name + ':ERR ' + e.message); } };
  const drain = () => { let n = 0; while ((showing || DIALOGS.length) && n++ < 500) { $('#dialog-text').textContent = ''; nextDialog(); } };
  setTimeout(() => {
    try {
      startGame(true);
      // CH1
      step('bedroom', () => { gotoRoom('bedroom'); });
      step('matches', () => __act('nightstand'));
      step('kettle', () => __act('stove'));
      step('tofoyer', () => __act('tofoyer'));
      step('deer', () => __act('deer'));
      step('tostudy', () => __act('tostudy'));
      step('rabbit', () => __act('rabbit'));
      step('portrait', () => __act('portrait'));
      step('world-on', () => { state.world = 'other'; spawnMonsters(); });
      step('writing', () => __act('writing'));
      step('books', () => { __act('b-gold'); __act('b-teal'); __act('b-crimson'); });
      step('world-off', () => { state.world = 'real'; });
      step('cellar-in', () => __act('tocellar'));
      step('matchbox', () => __act('matchbox'));
      step('handle-world', () => { state.world = 'other'; spawnMonsters(); __act('workbench'); });
      step('back-foyer', () => { state.world = 'real'; gotoRoom('foyer'); });
      step('bigdoor-handle', () => __act('bigdoor'));
      step('ch2-start', () => { state.F.handleOn = true; __act('bigdoor'); });
      step('street', () => { gotoRoom('street'); __act('pig'); });
      step('clinic', () => { gotoRoom('clinic'); });
      step('cabinet', () => __act('cabinet'));
      step('watch-world', () => { state.world = 'other'; spawnMonsters(); __act('watch'); state.world = 'real'; });
      step('shop', () => { gotoRoom('shop'); __act('cat'); });
      step('church', () => { gotoRoom('church'); __act('goat'); });
      step('church-exit', () => { state.px = 110; state.py = 440; const h = nearestHotspot(); if (!h || h.id !== 'out') throw new Error('exit?' + (h && h.id)); interact(); if (state.room !== 'street') throw new Error('stuck:' + state.room); gotoRoom('church'); });
      step('statues', () => { state.F.statues = [1, 1, 1]; __act('statue0'); __act('statue1'); __act('statue2'); });
      step('candles', () => __act('candelabrum'));
      step('bell-reach', () => { state.px = 1080; state.py = 470; const h = nearestHotspot(); if (!h || h.id !== 'belltower') throw new Error('bell?' + (h && h.id)); });
      step('bell', () => __act('belltower'));
      step('bridge', () => { gotoRoom('street'); state.F.bellRung = true; __act('bridge'); });
      step('lh1', () => { gotoRoom('lh1'); __act('deer2'); });
      step('quill', () => { state.world = 'other'; spawnMonsters(); __act('quill'); });
      step('gate1', () => __act('gate1'));
      step('lh2', () => { state.world = 'real'; gotoRoom('lh2'); });
      step('ink', () => { state.world = 'other'; spawnMonsters(); __act('ink'); __act('gate2'); });
      step('lh3', () => { state.world = 'real'; gotoRoom('lh3'); });
      step('paper', () => { state.world = 'other'; spawnMonsters(); __act('paper'); __act('gate3'); });
      step('top', () => { state.world = 'real'; gotoRoom('lhtop'); });
      step('letter', () => __act('desk3'));
      log.push('FINAL scene=' + state.scene + ' chapter=' + state.chapter + ' hearts=' + state.hearts);
    } catch (e) { log.push('FATAL ' + e.message); }
    box.textContent = log.join('\n');
    document.title = 'AUTOTEST_DONE:' + state.scene;
  }, 400);
} else if (new URLSearchParams(location.search).get('tour')) {
  const q = new URLSearchParams(location.search);
  setTimeout(() => {
    startGame(true);
    const room = q.get('tour');
    Object.assign(state.F, { metDeer: true, deerTalk1: true });
    gotoRoom(room);
    if (q.get('peek') === '1') { state.world = 'other'; }
    syncWorldUI(); spawnMonsters();
    document.title = 'TOUR_READY';
  }, 300);
}

/* ---------- 启动 ---------- */
grain = makeGrain(320, 180, 12);
if (localStorage.getItem(SAVE_KEY)) $('#btn-continue').classList.remove('disabled');
$('#btn-new').addEventListener('click', () => { initAudio(); startGame(true); });
$('#btn-continue').addEventListener('click', () => { initAudio(); startGame(false); });
$('#eye-btn').addEventListener('click', () => { initAudio(); toggleWorld(); });
$('#hint-btn').addEventListener('click', showHint);
refreshInv();
requestAnimationFrame(loop);
