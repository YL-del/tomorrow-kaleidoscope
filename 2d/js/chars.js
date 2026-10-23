/* chars.js —— 角色绘制：阿堵（双眼版·万花筒写轮眼）、NPC、里世界怪物
   约定：所有 draw*(ctx, x, y, s, t, ...) 以 (x,y)=脚底中心，s=缩放(1≈身高100px) */

import { poly, ell, line, INK, hash } from './art.js';

/* ============ 阿堵 ============
   有形头部（发梢锯齿刘海 + 侧发 + 耳朵 + 鼻梁创可贴），
   左眼普通黑瞳，右眼红色万花筒写轮眼（三叶风车，里世界加速旋转并发光） */
export function drawBoy(ctx, x, y, s, facing = 'down', walkT = 0, opt = {}) {
  const { other = false, alpha = 1, hurt = false } = opt;
  const W = walkT;
  const lift = (ph) => Math.sin(ph) * 3;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (facing === 'left') ctx.scale(-1, 1);
  const side = facing === 'left' || facing === 'right';

  // 腿
  const legPh = W * 9;
  const l1 = facing === 'up' || facing === 'down' ? lift(legPh) : 0;
  const l2 = facing === 'up' || facing === 'down' ? lift(legPh + Math.PI) : 0;
  poly(ctx, [[-9, -16 - Math.max(0, l1)], [-4, -16 - Math.max(0, l1)], [-4, 0], [-9, 0]], { fill: '#2c3040', lw: 2.4, amp: .8, seed: 21 });
  poly(ctx, [[4, -16 - Math.max(0, l2)], [9, -16 - Math.max(0, l2)], [9, 0], [4, 0]], { fill: '#2c3040', lw: 2.4, amp: .8, seed: 22 });
  ell(ctx, -7, -1, 5.5, 3, { fill: '#4a3a28', lw: 2, amp: .6, seed: 23 });
  ell(ctx, 7, -1, 5.5, 3, { fill: '#4a3a28', lw: 2, amp: .6, seed: 24 });

  // 身体（芥末黄大衣）
  const bob = Math.abs(Math.sin(W * 9)) * 1.5;
  poly(ctx, [[-14, -48 - bob], [14, -48 - bob], [17, -16], [-17, -16]], { fill: '#c98f3d', lw: 3, amp: 1.2, seed: 25 });
  // 大衣下摆深色边
  poly(ctx, [[-17, -19], [17, -19], [17, -16], [-17, -16]], { fill: '#a5742e', stroke: null, amp: .8, seed: 26 });
  // 扣子
  for (let i = 0; i < 3; i++) ell(ctx, 0, -42 - bob + i * 9, 1.7, 1.7, { fill: '#6e4c1c', lw: 1.4, amp: .3, seed: 30 + i });
  // 手臂
  const armSw = facing === 'up' || facing === 'down' ? Math.sin(W * 9) * 5 : 2;
  poly(ctx, [[-17, -46 - bob], [-22, -44 - bob], [-21 + armSw * .4, -22], [-16, -24]], { fill: '#b57f34', lw: 2.6, amp: 1, seed: 27 });
  poly(ctx, [[17, -46 - bob], [22, -44 - bob], [21 - armSw * .4, -22], [16, -24]], { fill: '#b57f34', lw: 2.6, amp: 1, seed: 28 });
  ell(ctx, -19 + armSw * .4, -20, 3.4, 3.6, { fill: '#f2e4d2', lw: 2, amp: .5, seed: 29 });
  ell(ctx, 19 - armSw * .4, -20, 3.4, 3.6, { fill: '#f2e4d2', lw: 2, amp: .5, seed: 31 });

  // 头
  const hy = -70 - bob;           // 头中心
  // 脖子
  poly(ctx, [[-4, -50 - bob], [4, -50 - bob], [4, -58 - bob], [-4, -58 - bob]], { fill: '#e6d2ba', stroke: null, amp: .5, seed: 32 });
  // 后发（画在脸后面，形成头形）
  poly(ctx, [
    [-21, hy - 14], [-24, hy - 2], [-23, hy + 12], [-18, hy + 20], [-10, hy + 22],
    [0, hy + 23], [10, hy + 22], [18, hy + 20], [23, hy + 12], [24, hy - 2], [21, hy - 14],
    [12, hy - 22], [-12, hy - 22],
  ], { fill: '#23262e', lw: 3, amp: 1.2, seed: 33 });
  // 耳朵
  if (!side) {
    ell(ctx, -21, hy + 3, 3.6, 5, { fill: '#f2e4d2', lw: 2.2, amp: .5, seed: 34 });
    ell(ctx, 21, hy + 3, 3.6, 5, { fill: '#f2e4d2', lw: 2.2, amp: .5, seed: 35 });
  } else {
    ell(ctx, 19, hy + 4, 3.8, 5.4, { fill: '#f2e4d2', lw: 2.2, amp: .5, seed: 35 });
  }
  // 脸（下颌略收，不是圆球）
  poly(ctx, [
    [-18, hy - 8], [-18, hy + 6], [-14, hy + 16], [-6, hy + 20], [0, hy + 21],
    [6, hy + 20], [14, hy + 16], [18, hy + 6], [18, hy - 8],
  ], { fill: '#f2e4d2', lw: 2.6, amp: 1, seed: 36 });

  if (facing === 'up') {
    // 背面：全后脑勺
    poly(ctx, [[-20, hy + 18], [0, hy + 23], [20, hy + 18], [16, hy - 6], [-16, hy - 6]], { fill: '#23262e', stroke: INK, lw: 2.6, amp: 1, seed: 37 });
    // 围巾结
    ell(ctx, 0, -52 - bob, 5, 4, { fill: '#a8403a', lw: 2, amp: .5, seed: 38 });
  } else {
    // 刘海（锯齿）
    poly(ctx, [
      [-19, hy - 4], [-21, hy - 12], [-13, hy - 10], [-15, hy - 17], [-6, hy - 12],
      [-4, hy - 19], [3, hy - 12], [8, hy - 18], [13, hy - 11], [19, hy - 14],
      [20, hy - 4], [14, hy + 1], [7, hy - 2], [0, hy + 1], [-8, hy - 2], [-14, hy + 1],
    ], { fill: '#23262e', lw: 2.6, amp: .9, seed: 39 });
    // 侧发
    poly(ctx, [[-20, hy - 8], [-23, hy + 12], [-18, hy + 16], [-16, hy - 4]], { fill: '#23262e', stroke: null, amp: .8, seed: 40 });
    poly(ctx, [[20, hy - 8], [23, hy + 12], [18, hy + 16], [16, hy - 4]], { fill: '#23262e', stroke: null, amp: .8, seed: 41 });
    // 鼻梁创可贴
    ctx.save(); ctx.translate(0, hy + 5); ctx.rotate(-.18);
    poly(ctx, [[-2.6, -6], [2.6, -6], [2.6, 6], [-2.6, 6]], { fill: '#efe6cf', lw: 1.6, amp: .3, seed: 42 });
    ctx.restore();
    // 眼睛：左普通 / 右万花筒写轮眼（侧面时只露写轮眼在前方）
    const ey = hy + 6;
    if (!side) {
      // 左眼（普通）
      ell(ctx, -9, ey, 4.6, 5.2, { fill: '#fff', lw: 2, amp: .4, seed: 43 });
      ell(ctx, -9, ey + .5, 2.1, 2.4, { fill: '#2a2a32', stroke: null, amp: .2, seed: 44 });
      line(ctx, -13.5, ey - 4, -5, ey - 4.6, { lw: 2, amp: .4, seed: 45 });
      // 右眼（万花筒写轮眼）
      drawKaleidoEye(ctx, 9, ey, 4.8, opt);
      line(ctx, 5, ey - 4.6, 13.5, ey - 4, { lw: 2, amp: .4, seed: 46 });
    } else {
      // 侧脸：写轮眼在前
      drawKaleidoEye(ctx, 9, ey, 4.6, opt);
      line(ctx, 3, ey - 4.4, 14, ey - 4, { lw: 2, amp: .4, seed: 46 });
      line(ctx, 15, ey + 2, 17.5, ey + 4.5, { lw: 2, amp: .4, seed: 47 }); // 鼻尖
    }
    // 嘴
    line(ctx, -3, hy + 15, 3, hy + 15, { lw: 1.8, amp: .3, seed: 48 });
  }
  // 围巾
  poly(ctx, [[-12, -54 - bob], [12, -54 - bob], [14, -47 - bob], [-14, -47 - bob]], { fill: '#a8403a', lw: 2.4, amp: .8, seed: 49 });
  poly(ctx, [[8, -50 - bob], [14, -44 - bob], [10, -36 - bob], [4, -46 - bob]], { fill: '#8e3128', stroke: null, amp: .7, seed: 50 });

  if (hurt) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(158,43,37,.25)'; ctx.fillRect(-60, -110, 120, 120); }
  ctx.restore();
}

/* 万花筒写轮眼：白底 + 红虹膜 + 黑色三叶风车（佐助万花筒式） */
export function drawKaleidoEye(ctx, cx, cy, r, opt = {}) {
  const { spin = 0, other = false } = opt;
  ell(ctx, cx, cy, r, r * 1.1, { fill: '#fff', lw: 2, amp: .4, seed: 55 });
  ell(ctx, cx, cy, r * .8, r * .9, { fill: other ? '#c62a20' : '#b3241c', lw: 1.6, amp: .3, seed: 56 });
  if (other) {
    const g = ctx.createRadialGradient(cx, cy, r * .4, cx, cy, r * 2.6);
    g.addColorStop(0, 'rgba(214,54,40,.5)'); g.addColorStop(1, 'rgba(214,54,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, 7); ctx.fill();
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.strokeStyle = '#16090a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  // 三片弯刃风车
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * .18, Math.sin(a) * r * .2);
    ctx.quadraticCurveTo(
      Math.cos(a - .9) * r * .78, Math.sin(a - .9) * r * .86,
      Math.cos(a + .55) * r * .6, Math.sin(a + .55) * r * .66,
    );
    ctx.stroke();
  }
  // 外环
  ctx.beginPath(); ctx.arc(0, 0, r * .82, 0, 7); ctx.stroke();
  ell(ctx, 0, 0, r * .16, r * .16, { fill: '#16090a', stroke: null, amp: .1, seed: 57 });
  ctx.restore();
  // 上睫毛线
  line(ctx, cx - r, cy - r * 1.1, cx + r, cy - r * 1.15, { lw: 2, amp: .3, seed: 58 });
}

/* ============ NPC ============ */
export function drawDeer(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const br = Math.sin(t * 1.1) * 1.2;
  poly(ctx, [[-10, -16], [10, -16], [10, 0], [-10, 0]], { fill: '#2c3040', lw: 2.4, amp: .8, seed: 61 });
  poly(ctx, [[-16, -50 + br], [16, -50 + br], [20, -14], [-20, -14]], { fill: '#5a4632', lw: 3, amp: 1.2, seed: 62 });
  for (let i = 0; i < 3; i++) ell(ctx, 0, -44 + br + i * 10, 1.8, 1.8, { fill: '#3a2c1c', stroke: null, amp: .3, seed: 63 + i });
  ell(ctx, -18, -18 + br, 3.6, 4, { fill: '#e8d9bd', lw: 2, amp: .5, seed: 66 });
  ell(ctx, 18, -18 + br, 3.6, 4, { fill: '#e8d9bd', lw: 2, amp: .5, seed: 67 });
  // 鹿头
  const hy = -66 + br;
  poly(ctx, [[-13, hy - 8], [-13, hy + 10], [0, hy + 16], [13, hy + 10], [13, hy - 8]], { fill: '#8a6b48', lw: 2.8, amp: 1, seed: 68 });
  ell(ctx, -8, hy + 1, 1.6, 2.2, { fill: '#1c140c', stroke: null, amp: .2, seed: 69 });
  ell(ctx, 8, hy + 1, 1.6, 2.2, { fill: '#1c140c', stroke: null, amp: .2, seed: 70 });
  ell(ctx, 0, hy + 9, 2.6, 2, { fill: '#1c140c', stroke: null, amp: .2, seed: 71 });
  // 鹿角
  line(ctx, -9, hy - 8, -16, hy - 24, { lw: 3, amp: .8, seed: 72 });
  line(ctx, -16, hy - 24, -22, hy - 30, { lw: 2.4, amp: .6, seed: 73 });
  line(ctx, -14, hy - 18, -20, hy - 19, { lw: 2.2, amp: .5, seed: 74 });
  line(ctx, 9, hy - 8, 16, hy - 24, { lw: 3, amp: .8, seed: 75 });
  line(ctx, 16, hy - 24, 22, hy - 30, { lw: 2.4, amp: .6, seed: 76 });
  line(ctx, 14, hy - 18, 20, hy - 19, { lw: 2.2, amp: .5, seed: 77 });
  ctx.restore();
}

export function drawRabbit(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const br = Math.sin(t * 1.4) * 1;
  poly(ctx, [[-8, -14], [8, -14], [8, 0], [-8, 0]], { fill: '#4a4038', lw: 2.2, amp: .7, seed: 81 });
  poly(ctx, [[-12, -42 + br], [12, -42 + br], [15, -12], [-15, -12]], { fill: '#8d8378', lw: 2.8, amp: 1, seed: 82 });
  poly(ctx, [[-8, -40 + br], [8, -40 + br], [9, -16], [-9, -16]], { fill: '#e4dbc8', stroke: null, amp: .8, seed: 83 });
  const hy = -56 + br;
  ell(ctx, 0, hy, 11, 10, { fill: '#efe9dc', lw: 2.6, amp: .8, seed: 84 });
  poly(ctx, [[-6, hy - 6], [-9, hy - 30], [-2, hy - 28], [-1, hy - 8]], { fill: '#efe9dc', lw: 2.4, amp: .8, seed: 85 });
  poly(ctx, [[6, hy - 6], [9, hy - 30], [2, hy - 28], [1, hy - 8]], { fill: '#efe9dc', lw: 2.4, amp: .8, seed: 86 });
  poly(ctx, [[-7, hy - 10], [-8, hy - 26], [-4, hy - 24]], { fill: '#e8b8c0', stroke: null, amp: .4, seed: 87 });
  poly(ctx, [[7, hy - 10], [8, hy - 26], [4, hy - 24]], { fill: '#e8b8c0', stroke: null, amp: .4, seed: 88 });
  ell(ctx, -4, hy - 1, 1.4, 1.8, { fill: '#1c140c', stroke: null, amp: .2, seed: 89 });
  ell(ctx, 4, hy - 1, 1.4, 1.8, { fill: '#1c140c', stroke: null, amp: .2, seed: 90 });
  ell(ctx, 0, hy + 4, 1.8, 1.4, { fill: '#d89098', stroke: null, amp: .2, seed: 91 });
  ctx.restore();
}

export function drawCat(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const br = Math.sin(t * 1.6) * 1;
  poly(ctx, [[-16, -56 + br], [16, -56 + br], [18, -14], [-18, -14]], { fill: '#5d564e', lw: 2.8, amp: 1, seed: 95 }); // 围裙外袍
  poly(ctx, [[-9, -52 + br], [9, -52 + br], [10, -18], [-10, -18]], { fill: '#d8d0be', stroke: null, amp: .8, seed: 96 });
  const hy = -68 + br;
  ell(ctx, 0, hy, 12, 10.5, { fill: '#7a7268', lw: 2.6, amp: .8, seed: 97 });
  poly(ctx, [[-11, hy - 6], [-14, hy - 15], [-4, hy - 11]], { fill: '#7a7268', lw: 2.2, amp: .6, seed: 98 });
  poly(ctx, [[11, hy - 6], [14, hy - 15], [4, hy - 11]], { fill: '#7a7268', lw: 2.2, amp: .6, seed: 99 });
  ell(ctx, -4.5, hy - 1, 1.6, 2, { fill: '#c9a227', stroke: null, amp: .2, seed: 100 });
  ell(ctx, 4.5, hy - 1, 1.6, 2, { fill: '#c9a227', stroke: null, amp: .2, seed: 101 });
  line(ctx, -1.5, hy + 4, 1.5, hy + 4, { lw: 1.6, amp: .2, seed: 102 });
  line(ctx, -9, hy + 4, -3, hy + 5, { lw: 1.2, amp: .2, seed: 103 });
  line(ctx, 9, hy + 4, 3, hy + 5, { lw: 1.2, amp: .2, seed: 104 });
  ctx.restore();
}

export function drawGoat(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const br = Math.sin(t * .9) * 1;
  poly(ctx, [[-16, -58 + br], [16, -58 + br], [19, -14], [-19, -14]], { fill: '#3a3a42', lw: 2.8, amp: 1, seed: 108 }); // 黑袍
  line(ctx, 0, -54 + br, 0, -18, { lw: 2, amp: .4, seed: 109, stroke: '#c9a227' });
  const hy = -74 + br;
  poly(ctx, [[-12, hy - 6], [-12, hy + 12], [0, hy + 17], [12, hy + 12], [12, hy - 6]], { fill: '#d8d2c4', lw: 2.6, amp: .9, seed: 110 });
  // 弯角
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, hy - 6); ctx.quadraticCurveTo(-18, hy - 20, -8, hy - 26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, hy - 6); ctx.quadraticCurveTo(18, hy - 20, 8, hy - 26); ctx.stroke();
  ell(ctx, -4.5, hy + 2, 1.5, 2, { fill: '#1c140c', stroke: null, amp: .2, seed: 111 });
  ell(ctx, 4.5, hy + 2, 1.5, 2, { fill: '#1c140c', stroke: null, amp: .2, seed: 112 });
  ctx.restore();
}

export function drawPig(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const br = Math.sin(t * 1.2) * 1;
  poly(ctx, [[-15, -50 + br], [15, -50 + br], [18, -14], [-18, -14]], { fill: '#7a5a48', lw: 2.8, amp: 1, seed: 115 });
  const hy = -64 + br;
  ell(ctx, 0, hy, 13, 11, { fill: '#e0a8a0', lw: 2.6, amp: .8, seed: 116 });
  poly(ctx, [[-14, hy - 8], [-10, hy - 14], [-6, hy - 8]], { fill: '#e0a8a0', lw: 2, amp: .5, seed: 117 });
  poly(ctx, [[14, hy - 8], [10, hy - 14], [6, hy - 8]], { fill: '#e0a8a0', lw: 2, amp: .5, seed: 118 });
  ell(ctx, -4, hy - 2, 1.4, 1.8, { fill: '#1c140c', stroke: null, amp: .2, seed: 119 });
  ell(ctx, 4, hy - 2, 1.4, 1.8, { fill: '#1c140c', stroke: null, amp: .2, seed: 120 });
  ell(ctx, 0, hy + 5, 4.5, 3.4, { fill: '#c8837a', lw: 2, amp: .4, seed: 121 });
  ell(ctx, -1.6, hy + 5, .9, 1.2, { fill: '#8e5348', stroke: null, amp: .2, seed: 122 });
  ell(ctx, 1.6, hy + 5, .9, 1.2, { fill: '#8e5348', stroke: null, amp: .2, seed: 123 });
  ctx.restore();
}

/* ============ 里世界怪物（寂静岭式：无面 / 畸长 / 匍行） ============ */

/* 无面护士：白袍，平滑无五官的头歪向一侧，抽搐式移动，持长针 */
export function drawNurse(ctx, x, y, s, t, seed = 0) {
  const tq = Math.floor(t * 8) + seed * 100;          // 量化时间 → 抽搐
  const jx = hash(tq, seed) * 2.2, jy = hash(tq, seed + 1) * 1.4;
  const tilt = .38 + hash(seed, 7) * .12;
  ctx.save(); ctx.translate(x + jx, y + jy); ctx.scale(s, s);
  poly(ctx, [[-9, -18], [9, -18], [9, 0], [-9, 0]], { fill: '#cfc8b8', lw: 2.4, amp: .9, seed: seed + 130 });
  poly(ctx, [[-14, -52], [14, -52], [17, -14], [-17, -14]], { fill: '#ded8c8', lw: 2.8, amp: 1, seed: seed + 131 });
  poly(ctx, [[-6, -48], [8, -46], [10, -22], [-4, -24]], { fill: '#8e8676', stroke: null, amp: .7, seed: seed + 132, alpha: .8 }); // 污渍
  // 垂落的双臂（一只手持长针）
  poly(ctx, [[-17, -50], [-21, -48], [-20, -14], [-15, -16]], { fill: '#ded8c8', lw: 2.4, amp: .8, seed: seed + 133 });
  poly(ctx, [[17, -50], [21, -48], [22, -20], [16, -22]], { fill: '#ded8c8', lw: 2.4, amp: .8, seed: seed + 134 });
  line(ctx, 21, -22, 30, 2, { lw: 1.8, amp: .3, seed: seed + 135, stroke: '#b9b4a8' });
  poly(ctx, [[29, 2], [32, 0], [30.5, 5]], { fill: '#d8d4c8', stroke: null, amp: .2, seed: seed + 136 });
  // 歪斜的无面头（只有一道缝合线）
  ctx.save(); ctx.translate(0, -66); ctx.rotate(tilt + Math.sin(t * 2 + seed) * .06);
  ell(ctx, 0, 0, 11, 12.5, { fill: '#e8e0cc', lw: 2.6, amp: .8, seed: seed + 137 });
  line(ctx, -2, -11, 1, 11, { lw: 1.4, amp: .3, seed: seed + 138, stroke: '#8e8272' });
  ctx.restore();
  ctx.restore();
}

/* 长颈客：躯干细长漆黑，脖颈过长、头颅耷拉，滑行逼近，近身突进 */
export function drawLurker(ctx, x, y, s, t, seed = 0) {
  const sw = Math.sin(t * 1.7 + seed) * 5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  poly(ctx, [[-8, -60], [8, -58], [12, 0], [-12, 0]], { fill: '#241f1e', lw: 3, amp: 1.4, seed: seed + 140 });
  // 过长的脖颈
  ctx.strokeStyle = '#241f1e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(4 + sw * .4, -86, sw, -104); ctx.stroke();
  // 耷拉的头
  ctx.save(); ctx.translate(sw, -106); ctx.rotate(.55 + Math.sin(t * 2.2 + seed) * .1);
  ell(ctx, 0, 0, 8.5, 10, { fill: '#2e2826', lw: 2.6, amp: .9, seed: seed + 141 });
  ell(ctx, 3.4, 2, 1.6, 1.2, { fill: '#e8e2d2', stroke: null, amp: .2, seed: seed + 142 });
  ctx.restore();
  // 过长的手臂
  ctx.strokeStyle = '#241f1e'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-9, -52); ctx.quadraticCurveTo(-18 - sw * .3, -30, -14, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -52); ctx.quadraticCurveTo(18 - sw * .3, -34, 15, -10); ctx.stroke();
  ctx.restore();
}

/* 跪行者：四肢着地疾爬，脊背弓起，头颅前探 */
export function drawCrawler(ctx, x, y, s, t, seed = 0) {
  const g = Math.sin(t * 9 + seed * 3);
  ctx.save(); ctx.translate(x, y + g * 1); ctx.scale(s, s);
  const dir = 1;
  ctx.scale(dir, 1);
  poly(ctx, [
    [-16, -6], [-8, -16 - g], [4, -20 - g], [14, -14], [20, -4], [12, 0], [-10, 0],
  ], { fill: '#cfc4ae', lw: 2.6, amp: 1, seed: seed + 150 });   // 弓起的苍白躯干
  // 四肢
  line(ctx, -12, -10, -18 - g * 2, 0, { lw: 3, amp: .6, seed: seed + 151, stroke: '#cfc4ae' });
  line(ctx, -4, -14, -2 + g * 3, 0, { lw: 3, amp: .6, seed: seed + 152, stroke: '#cfc4ae' });
  line(ctx, 8, -12, 12 + g * 3, 0, { lw: 3, amp: .6, seed: seed + 153, stroke: '#cfc4ae' });
  line(ctx, 14, -8, 20 - g * 2, 0, { lw: 3, amp: .6, seed: seed + 154, stroke: '#cfc4ae' });
  // 前探的头（无眼，只有裂口）
  ctx.save(); ctx.translate(21, -8 - g); ctx.rotate(.3);
  ell(ctx, 0, 0, 6, 5, { fill: '#d8cdb8', lw: 2.2, amp: .6, seed: seed + 155 });
  line(ctx, 1, 2, 5.5, 3, { lw: 1.6, amp: .3, seed: seed + 156, stroke: '#6e5a44' });
  ctx.restore();
  // 肋线
  for (let i = 0; i < 3; i++) line(ctx, -6 + i * 6, -14 - g, -4 + i * 6, -4, { lw: 1.2, amp: .3, seed: seed + 157 + i, stroke: '#8e8272', alpha: .7 });
  ctx.restore();
}
