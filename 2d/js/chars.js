/* chars.js —— 角色绘制 v2：阿堵（双眼版·万花筒写轮眼）、NPC、里世界怪物
   v2 美术升级：关节分段、表情层、服饰细节、怪物溃烂层+骨骼+滴液动画
   约定：所有 draw*(ctx, x, y, s, t, ...) 以 (x,y)=脚底中心，s=缩放(1≈身高100px) */

import { poly, ell, line, INK, hash } from './art.js';

/* 脚底阴影（所有角色通用） */
function shadow(ctx, w = 16, a = .18) {
  ell(ctx, 0, 1, w, w * .22, { fill: '#241c14', stroke: null, amp: .6, seed: 9, alpha: a });
}

/* ============ 阿堵 ============
   v2：领口翻边/腰带/口袋大衣、双段手臂摆动、分节腿、发丝线、
   眉毛表情层、下颌影线、左眼上睑+高光 */
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

  shadow(ctx, 18);

  // 腿（分节：裤腿+鞋，带鞋底线）
  const legPh = W * 9;
  const l1 = facing === 'up' || facing === 'down' ? lift(legPh) : 0;
  const l2 = facing === 'up' || facing === 'down' ? lift(legPh + Math.PI) : 0;
  for (const [lx, ph] of [[-9, l1], [4, l2]]) {
    poly(ctx, [[lx, -17 - Math.max(0, ph)], [lx + 5, -17 - Math.max(0, ph)], [lx + 5, -8], [lx, -8]], { fill: '#2c3040', lw: 2.2, amp: .7, seed: 21 + lx });
    poly(ctx, [[lx, -8], [lx + 5, -8], [lx + 5, -2 - Math.max(0, ph) * .4], [lx, -2 - Math.max(0, ph) * .4]], { fill: '#262a38', lw: 2.2, amp: .6, seed: 22 + lx });
    ell(ctx, lx + 2.5, -1, 5.5, 3, { fill: '#4a3a28', lw: 2, amp: .5, seed: 23 + lx });
    line(ctx, lx - 2, -1, lx + 7, -1, { lw: 1.4, amp: .3, seed: 24 + lx, stroke: '#33281c' });
  }

  // 身体（芥末黄大衣 v2：翻领+腰带+口袋）
  const bob = Math.abs(Math.sin(W * 9)) * 1.5;
  poly(ctx, [[-14, -48 - bob], [14, -48 - bob], [17, -16], [-17, -16]], { fill: '#c98f3d', lw: 3, amp: 1.2, seed: 25 });
  poly(ctx, [[-17, -19], [17, -19], [17, -16], [-17, -16]], { fill: '#a5742e', stroke: null, amp: .8, seed: 26 });
  // 翻领
  poly(ctx, [[-6, -48 - bob], [-1, -40 - bob], [-8, -36 - bob], [-11, -44 - bob]], { fill: '#b57f34', lw: 2, amp: .6, seed: 27 });
  poly(ctx, [[6, -48 - bob], [1, -40 - bob], [8, -36 - bob], [11, -44 - bob]], { fill: '#b57f34', lw: 2, amp: .6, seed: 28 });
  // 腰带+扣
  poly(ctx, [[-16, -30], [16, -30], [16, -26], [-16, -26]], { fill: '#6e4c1c', lw: 1.8, amp: .5, seed: 29 });
  ell(ctx, 0, -28, 2.6, 2, { fill: '#c9a227', lw: 1.4, amp: .3, seed: 30 });
  // 口袋
  line(ctx, 8, -24, 14, -23, { lw: 1.6, amp: .3, seed: 31 });
  line(ctx, 14, -23, 13, -19, { lw: 1.6, amp: .3, seed: 32 });
  // 扣子
  for (let i = 0; i < 3; i++) ell(ctx, -6, -40 - bob + i * 5, 1.5, 1.5, { fill: '#6e4c1c', lw: 1.2, amp: .3, seed: 33 + i });

  // 手臂（双段：上臂+前臂，行走摆动带肘弯）
  const armSw = facing === 'up' || facing === 'down' ? Math.sin(W * 9) * 5 : 2;
  // 左臂（远侧，画在身体前）
  poly(ctx, [[-17, -46 - bob], [-22, -44 - bob], [-23, -33], [-18, -32]], { fill: '#b57f34', lw: 2.4, amp: .9, seed: 34 });
  poly(ctx, [[-23, -33], [-18, -32], [-19 + armSw * .4, -22], [-14 + armSw * .4, -23]], { fill: '#a5742e', lw: 2.4, amp: .9, seed: 35 });
  ell(ctx, -16.5 + armSw * .4, -20, 3.2, 3.4, { fill: '#f2e4d2', lw: 2, amp: .5, seed: 36 });
  // 右臂（近侧）
  poly(ctx, [[17, -46 - bob], [22, -44 - bob], [23, -33], [18, -32]], { fill: '#b57f34', lw: 2.4, amp: .9, seed: 37 });
  poly(ctx, [[23, -33], [18, -32], [19 - armSw * .4, -22], [14 - armSw * .4, -23]], { fill: '#a5742e', lw: 2.4, amp: .9, seed: 38 });
  ell(ctx, 16.5 - armSw * .4, -20, 3.2, 3.4, { fill: '#f2e4d2', lw: 2, amp: .5, seed: 39 });

  // 头
  const hy = -70 - bob;
  // 脖子
  poly(ctx, [[-4, -50 - bob], [4, -50 - bob], [4, -58 - bob], [-4, -58 - bob]], { fill: '#e6d2ba', stroke: null, amp: .5, seed: 40 });
  // 后发（形成头形）
  poly(ctx, [
    [-21, hy - 14], [-24, hy - 2], [-23, hy + 12], [-18, hy + 20], [-10, hy + 22],
    [0, hy + 23], [10, hy + 22], [18, hy + 20], [23, hy + 12], [24, hy - 2], [21, hy - 14],
    [12, hy - 22], [-12, hy - 22],
  ], { fill: '#23262e', lw: 3, amp: 1.2, seed: 41 });
  // 后发发丝线
  line(ctx, -12, hy - 14, -15, hy + 14, { lw: 1.2, amp: .6, seed: 42, stroke: '#3a3e4a', alpha: .8 });
  line(ctx, 2, hy - 16, 3, hy + 16, { lw: 1.2, amp: .6, seed: 43, stroke: '#3a3e4a', alpha: .8 });
  line(ctx, 14, hy - 13, 17, hy + 10, { lw: 1.2, amp: .6, seed: 44, stroke: '#3a3e4a', alpha: .8 });
  // 耳朵（带内耳线）
  if (!side) {
    ell(ctx, -21, hy + 3, 3.6, 5, { fill: '#f2e4d2', lw: 2.2, amp: .5, seed: 45 });
    ell(ctx, 21, hy + 3, 3.6, 5, { fill: '#f2e4d2', lw: 2.2, amp: .5, seed: 46 });
    line(ctx, -21.5, hy + 1, -20.5, hy + 5, { lw: 1, amp: .2, seed: 47, stroke: '#c9ab8a' });
    line(ctx, 20.5, hy + 1, 21.5, hy + 5, { lw: 1, amp: .2, seed: 48, stroke: '#c9ab8a' });
  } else {
    ell(ctx, 19, hy + 4, 3.8, 5.4, { fill: '#f2e4d2', lw: 2.2, amp: .5, seed: 46 });
    line(ctx, 18.6, hy + 2, 19.6, hy + 6, { lw: 1, amp: .2, seed: 48, stroke: '#c9ab8a' });
  }
  // 脸（下颌略收）
  poly(ctx, [
    [-18, hy - 8], [-18, hy + 6], [-14, hy + 16], [-6, hy + 20], [0, hy + 21],
    [6, hy + 20], [14, hy + 16], [18, hy + 6], [18, hy - 8],
  ], { fill: '#f2e4d2', lw: 2.6, amp: 1, seed: 49 });
  // 下颌影线
  line(ctx, -12, hy + 17, 0, hy + 20, { lw: 1, amp: .4, seed: 50, stroke: '#d9bd9c', alpha: .9 });

  if (facing === 'up') {
    // 背面：全后脑勺+发旋
    poly(ctx, [[-20, hy + 18], [0, hy + 23], [20, hy + 18], [16, hy - 6], [-16, hy - 6]], { fill: '#23262e', stroke: INK, lw: 2.6, amp: 1, seed: 51 });
    ell(ctx, 0, hy + 4, 3.2, 3.2, { fill: null, stroke: '#3a3e4a', lw: 1.4, amp: .4, seed: 52 });
    // 围巾结
    ell(ctx, 0, -52 - bob, 5, 4, { fill: '#a8403a', lw: 2, amp: .5, seed: 53 });
  } else {
    // 刘海（锯齿 v2：更多齿+发丝线）
    poly(ctx, [
      [-19, hy - 4], [-21, hy - 12], [-13, hy - 10], [-15, hy - 17], [-6, hy - 12],
      [-4, hy - 19], [3, hy - 12], [8, hy - 18], [13, hy - 11], [19, hy - 14],
      [20, hy - 4], [14, hy + 1], [7, hy - 2], [0, hy + 1], [-8, hy - 2], [-14, hy + 1],
    ], { fill: '#23262e', lw: 2.6, amp: .9, seed: 54 });
    line(ctx, -10, hy - 12, -11, hy - 3, { lw: 1, amp: .5, seed: 55, stroke: '#3a3e4a', alpha: .9 });
    line(ctx, 5, hy - 13, 6, hy - 3, { lw: 1, amp: .5, seed: 56, stroke: '#3a3e4a', alpha: .9 });
    line(ctx, 14, hy - 11, 15, hy - 3, { lw: 1, amp: .5, seed: 57, stroke: '#3a3e4a', alpha: .9 });
    // 侧发
    poly(ctx, [[-20, hy - 8], [-23, hy + 12], [-18, hy + 16], [-16, hy - 4]], { fill: '#23262e', stroke: null, amp: .8, seed: 58 });
    poly(ctx, [[20, hy - 8], [23, hy + 12], [18, hy + 16], [16, hy - 4]], { fill: '#23262e', stroke: null, amp: .8, seed: 59 });
    // 鼻梁创可贴（带透气孔点）
    ctx.save(); ctx.translate(0, hy + 5); ctx.rotate(-.18);
    poly(ctx, [[-2.6, -6], [2.6, -6], [2.6, 6], [-2.6, 6]], { fill: '#efe6cf', lw: 1.6, amp: .3, seed: 60 });
    for (let i = 0; i < 3; i++) { ell(ctx, -1, -3.4 + i * 3.4, .4, .4, { fill: '#c9ab8a', stroke: null, amp: .1, seed: 61 + i }); ell(ctx, 1, -3.4 + i * 3.4, .4, .4, { fill: '#c9ab8a', stroke: null, amp: .1, seed: 64 + i }); }
    ctx.restore();
    // 眼睛：左普通 / 右万花筒写轮眼
    const ey = hy + 6;
    if (!side) {
      // 眉毛（hurt 时皱起）
      line(ctx, -13, ey - 6.5, -5.5, ey - (hurt ? 5 : 7), { lw: 1.8, amp: .4, seed: 67 });
      line(ctx, 5.5, ey - (hurt ? 5 : 7), 13, ey - 6.5, { lw: 1.8, amp: .4, seed: 68 });
      // 左眼（普通）：上睑+高光
      ell(ctx, -9, ey, 4.6, 5.2, { fill: '#fff', lw: 2, amp: .4, seed: 69 });
      ell(ctx, -9, ey + .5, 2.1, 2.4, { fill: '#2a2a32', stroke: null, amp: .2, seed: 70 });
      ell(ctx, -10, ey - 1, .8, .8, { fill: '#fff', stroke: null, amp: .1, seed: 71 });
      line(ctx, -13.5, ey - 4, -5, ey - 4.6, { lw: 2, amp: .4, seed: 72 });
      // 右眼（万花筒写轮眼）
      drawKaleidoEye(ctx, 9, ey, 4.8, opt);
      // 右眼下独有疤痕线（幼时留下）
      line(ctx, 6, ey + 7, 13, ey + 6.4, { lw: 1.1, amp: .4, seed: 73, stroke: '#c9a887', alpha: .8 });
    } else {
      drawKaleidoEye(ctx, 9, ey, 4.6, opt);
      line(ctx, 3, ey - 4.4, 14, ey - 4, { lw: 2, amp: .4, seed: 72 });
      line(ctx, 15, ey + 2, 17.5, ey + 4.5, { lw: 2, amp: .4, seed: 74 }); // 鼻尖
    }
    // 嘴（hurt 时张开喘息）
    if (hurt) ell(ctx, 0, hy + 15, 2.4, 3, { fill: '#7a4038', stroke: null, amp: .3, seed: 75 });
    else line(ctx, -3, hy + 15, 3, hy + 15, { lw: 1.8, amp: .3, seed: 75 });
    // 腮红（淡）
    if (!hurt) { line(ctx, -15, hy + 12, -11, hy + 12.5, { lw: 1.2, amp: .3, seed: 76, stroke: '#e0b49a', alpha: .7 }); line(ctx, 11, hy + 12.5, 15, hy + 12, { lw: 1.2, amp: .3, seed: 77, stroke: '#e0b49a', alpha: .7 }); }
  }
  // 围巾（带流苏须线）
  poly(ctx, [[-12, -54 - bob], [12, -54 - bob], [14, -47 - bob], [-14, -47 - bob]], { fill: '#a8403a', lw: 2.4, amp: .8, seed: 78 });
  poly(ctx, [[8, -50 - bob], [14, -44 - bob], [10, -36 - bob], [4, -46 - bob]], { fill: '#8e3128', stroke: null, amp: .7, seed: 79 });
  line(ctx, 7, -43 - bob, 7.5, -38 - bob, { lw: 1, amp: .3, seed: 80, stroke: '#6e231c' });
  line(ctx, 10, -42 - bob, 11, -37 - bob, { lw: 1, amp: .3, seed: 81, stroke: '#6e231c' });

  if (hurt) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(158,43,37,.25)'; ctx.fillRect(-60, -110, 120, 120); }
  ctx.restore();
}

/* 万花筒写轮眼 v2：白底 + 红虹膜 + 三叶风车（刃尖带勾玉）+ 高光 */
export function drawKaleidoEye(ctx, cx, cy, r, opt = {}) {
  const { spin = 0, other = false } = opt;
  ell(ctx, cx, cy, r, r * 1.1, { fill: '#fff', lw: 2, amp: .4, seed: 85 });
  ell(ctx, cx, cy, r * .8, r * .9, { fill: other ? '#c62a20' : '#b3241c', lw: 1.6, amp: .3, seed: 86 });
  if (other) {
    const g = ctx.createRadialGradient(cx, cy, r * .4, cx, cy, r * 2.6);
    g.addColorStop(0, 'rgba(214,54,40,.5)'); g.addColorStop(1, 'rgba(214,54,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, 7); ctx.fill();
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.strokeStyle = '#16090a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  // 三片弯刃风车 + 刃尖勾玉
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const tipX = Math.cos(a + .55) * r * .6, tipY = Math.sin(a + .55) * r * .66;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * .18, Math.sin(a) * r * .2);
    ctx.quadraticCurveTo(
      Math.cos(a - .9) * r * .78, Math.sin(a - .9) * r * .86,
      tipX, tipY,
    );
    ctx.stroke();
    // 勾玉（刃尖小水滴）
    ell(ctx, tipX, tipY, r * .13, r * .16, { fill: '#16090a', stroke: null, amp: .1, seed: 87 + i, rot: a + .55 });
  }
  // 外环
  ctx.beginPath(); ctx.arc(0, 0, r * .82, 0, 7); ctx.stroke();
  ell(ctx, 0, 0, r * .16, r * .16, { fill: '#16090a', stroke: null, amp: .1, seed: 90 });
  ctx.restore();
  // 高光
  ell(ctx, cx - r * .35, cy - r * .4, r * .18, r * .14, { fill: '#fff', stroke: null, amp: .1, seed: 91, alpha: .85 });
  // 上睫毛线
  line(ctx, cx - r, cy - r * 1.1, cx + r, cy - r * 1.15, { lw: 2, amp: .3, seed: 92 });
}

/* ============ NPC v2（服饰细节 + 表情层） ============ */

/* 鹿管家：燕尾服 + 马甲 + 怀表链 + 白手套 + 多叉鹿角 */
export function drawDeer(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadow(ctx, 17);
  const br = Math.sin(t * 1.1) * 1.2;
  // 燕尾服后摆
  poly(ctx, [[-13, -30], [-8, -26], [-10, -6], [-16, -10]], { fill: '#4a3a28', lw: 2.2, amp: .8, seed: 95 });
  poly(ctx, [[13, -30], [8, -26], [10, -6], [16, -10]], { fill: '#4a3a28', lw: 2.2, amp: .8, seed: 96 });
  // 裤腿
  poly(ctx, [[-10, -16], [10, -16], [10, 0], [-10, 0]], { fill: '#2c3040', lw: 2.4, amp: .8, seed: 97 });
  // 燕尾服主体
  poly(ctx, [[-16, -50 + br], [16, -50 + br], [20, -14], [-20, -14]], { fill: '#5a4632', lw: 3, amp: 1.2, seed: 98 });
  // 马甲
  poly(ctx, [[-10, -48 + br], [10, -48 + br], [11, -20], [-11, -20]], { fill: '#6e5638', stroke: null, amp: .8, seed: 99 });
  for (let i = 0; i < 4; i++) ell(ctx, 0, -44 + br + i * 8, 1.5, 1.5, { fill: '#2c2014', stroke: null, amp: .3, seed: 100 + i });
  // 白衬衫领+黑领结
  poly(ctx, [[-5, -50 + br], [5, -50 + br], [4, -44 + br], [-4, -44 + br]], { fill: '#ece2ca', lw: 1.6, amp: .4, seed: 104 });
  ell(ctx, 0, -46 + br, 3, 2, { fill: '#1c1814', stroke: null, amp: .2, seed: 105 });
  // 怀表链
  line(ctx, -10, -44 + br, -4, -30 + br, { lw: 1.2, amp: .5, seed: 106, stroke: '#c9a227' });
  ell(ctx, -4, -29 + br, 1.8, 2.2, { fill: '#c9a227', lw: 1.2, amp: .2, seed: 107 });
  // 白手套双手
  ell(ctx, -18, -18 + br, 3.6, 4, { fill: '#ece2ca', lw: 2, amp: .5, seed: 108 });
  ell(ctx, 18, -18 + br, 3.6, 4, { fill: '#ece2ca', lw: 2, amp: .5, seed: 109 });
  // 鹿头（长吻）
  const hy = -66 + br;
  poly(ctx, [[-13, hy - 8], [-13, hy + 10], [0, hy + 16], [13, hy + 10], [13, hy - 8]], { fill: '#8a6b48', lw: 2.8, amp: 1, seed: 110 });
  poly(ctx, [[-6, hy + 6], [6, hy + 6], [4, hy + 13], [0, hy + 15], [-4, hy + 13]], { fill: '#a68658', stroke: null, amp: .5, seed: 111 });
  // 温和的眼睛（带上睑）
  ell(ctx, -8, hy + 1, 1.7, 2.2, { fill: '#1c140c', stroke: null, amp: .2, seed: 112 });
  ell(ctx, 8, hy + 1, 1.7, 2.2, { fill: '#1c140c', stroke: null, amp: .2, seed: 113 });
  line(ctx, -10, hy - 1.5, -6, hy - 1.8, { lw: 1.1, amp: .2, seed: 114 });
  line(ctx, 6, hy - 1.8, 10, hy - 1.5, { lw: 1.1, amp: .2, seed: 115 });
  ell(ctx, 0, hy + 9, 2.4, 1.9, { fill: '#1c140c', stroke: null, amp: .2, seed: 116 });
  // 鹿耳（角侧）
  poly(ctx, [[-13, hy - 8], [-19, hy - 12], [-16, hy - 4]], { fill: '#8a6b48', lw: 1.8, amp: .5, seed: 117 });
  poly(ctx, [[13, hy - 8], [19, hy - 12], [16, hy - 4]], { fill: '#8a6b48', lw: 1.8, amp: .5, seed: 118 });
  // 鹿角（主枝+三叉）
  for (const m of [-1, 1]) {
    line(ctx, m * 9, hy - 8, m * 16, hy - 24, { lw: 3, amp: .8, seed: 119 + m });
    line(ctx, m * 16, hy - 24, m * 22, hy - 30, { lw: 2.4, amp: .6, seed: 121 + m });
    line(ctx, m * 14, hy - 18, m * 20, hy - 19, { lw: 2.2, amp: .5, seed: 123 + m });
    line(ctx, m * 11, hy - 13, m * 15, hy - 14, { lw: 1.8, amp: .4, seed: 125 + m, stroke: '#5d452e' });
  }
  ctx.restore();
}

/* 兔女仆：围裙+荷叶边+蕾丝发带+腮红胡须点 */
export function drawRabbit(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadow(ctx, 14);
  const br = Math.sin(t * 1.4) * 1;
  poly(ctx, [[-8, -14], [8, -14], [8, 0], [-8, 0]], { fill: '#4a4038', lw: 2.2, amp: .7, seed: 130 });
  // 连衣裙
  poly(ctx, [[-12, -42 + br], [12, -42 + br], [15, -12], [-15, -12]], { fill: '#8d8378', lw: 2.8, amp: 1, seed: 131 });
  // 荷叶边下摆（锯齿线）
  poly(ctx, [[-15, -15], [-10, -12], [-5, -15], [0, -12], [5, -15], [10, -12], [15, -15]], { fill: '#a89e90', lw: 1.6, amp: .5, seed: 132 });
  // 围裙+肩带
  poly(ctx, [[-8, -40 + br], [8, -40 + br], [9, -16], [-9, -16]], { fill: '#e4dbc8', stroke: null, amp: .8, seed: 133 });
  line(ctx, -8, -40 + br, -11, -44 + br, { lw: 2, amp: .4, seed: 134, stroke: '#e4dbc8' });
  line(ctx, 8, -40 + br, 11, -44 + br, { lw: 2, amp: .4, seed: 135, stroke: '#e4dbc8' });
  // 围裙口袋
  line(ctx, -4, -26, 4, -26, { lw: 1.4, amp: .3, seed: 136, stroke: '#c2b7a2' });
  // 项圈
  poly(ctx, [[-7, -42 + br], [7, -42 + br], [6, -39 + br], [-6, -39 + br]], { fill: '#a8403a', lw: 1.4, amp: .3, seed: 137 });
  const hy = -56 + br;
  // 头（蛋形）
  ell(ctx, 0, hy, 11, 10, { fill: '#efe9dc', lw: 2.6, amp: .8, seed: 138 });
  // 长耳（内耳粉色更长）
  poly(ctx, [[-6, hy - 6], [-9, hy - 30], [-2, hy - 28], [-1, hy - 8]], { fill: '#efe9dc', lw: 2.4, amp: .8, seed: 139 });
  poly(ctx, [[6, hy - 6], [9, hy - 30], [2, hy - 28], [1, hy - 8]], { fill: '#efe9dc', lw: 2.4, amp: .8, seed: 140 });
  poly(ctx, [[-6.2, hy - 10], [-8, hy - 27], [-3.5, hy - 25]], { fill: '#e8b8c0', stroke: null, amp: .4, seed: 141 });
  poly(ctx, [[6.2, hy - 10], [8, hy - 27], [3.5, hy - 25]], { fill: '#e8b8c0', stroke: null, amp: .4, seed: 142 });
  // 蕾丝发带
  line(ctx, -9, hy - 7, 9, hy - 8, { lw: 2, amp: .5, seed: 143, stroke: '#fff', alpha: .9 });
  ell(ctx, 8.5, hy - 8, 2.2, 1.6, { fill: '#fff', lw: 1.2, amp: .2, seed: 144 });
  // 眼（带睫毛）+鼻+腮红+胡须点
  ell(ctx, -4, hy - 1, 1.5, 1.9, { fill: '#1c140c', stroke: null, amp: .2, seed: 145 });
  ell(ctx, 4, hy - 1, 1.5, 1.9, { fill: '#1c140c', stroke: null, amp: .2, seed: 146 });
  line(ctx, -5.6, hy - 3, -2.6, hy - 3.4, { lw: 1, amp: .2, seed: 147 });
  line(ctx, 2.6, hy - 3.4, 5.6, hy - 3, { lw: 1, amp: .2, seed: 148 });
  ell(ctx, 0, hy + 4, 1.8, 1.4, { fill: '#d89098', stroke: null, amp: .2, seed: 149 });
  ell(ctx, -7, hy + 3, 1.8, 1.2, { fill: '#eec3c9', stroke: null, amp: .2, seed: 150, alpha: .8 });
  ell(ctx, 7, hy + 3, 1.8, 1.2, { fill: '#eec3c9', stroke: null, amp: .2, seed: 151, alpha: .8 });
  for (const m of [-1, 1]) for (let i = 0; i < 3; i++) ell(ctx, m * (8 + i * 2.2), hy + 2 + hash(150 + i, m) * 2, .5, .5, { fill: '#8d8378', stroke: null, amp: .1, seed: 152 + i + m * 3 });
  ctx.restore();
}

/* 猫掌柜：马甲+领巾+竖瞳金眼+绒毛脸颊 */
export function drawCat(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadow(ctx, 16);
  const br = Math.sin(t * 1.6) * 1;
  // 外袍
  poly(ctx, [[-16, -56 + br], [16, -56 + br], [18, -14], [-18, -14]], { fill: '#5d564e', lw: 2.8, amp: 1, seed: 160 });
  // 马甲+扣
  poly(ctx, [[-10, -52 + br], [10, -52 + br], [11, -18], [-11, -18]], { fill: '#4a443c', stroke: null, amp: .8, seed: 161 });
  for (let i = 0; i < 3; i++) ell(ctx, 0, -46 + br + i * 9, 1.3, 1.3, { fill: '#c9a227', stroke: null, amp: .2, seed: 162 + i });
  // 领巾
  poly(ctx, [[-4, -54 + br], [4, -54 + br], [3, -44 + br], [0, -40 + br], [-3, -44 + br]], { fill: '#8e3128', lw: 1.6, amp: .4, seed: 165 });
  const hy = -68 + br;
  // 头+绒毛脸颊（锯齿）
  ell(ctx, 0, hy, 12, 10.5, { fill: '#7a7268', lw: 2.6, amp: .8, seed: 166 });
  poly(ctx, [[-12, hy + 3], [-15, hy + 6], [-12, hy + 8], [-14, hy + 10], [-10, hy + 10]], { fill: '#7a7268', lw: 1.6, amp: .4, seed: 167 });
  poly(ctx, [[12, hy + 3], [15, hy + 6], [12, hy + 8], [14, hy + 10], [10, hy + 10]], { fill: '#7a7268', lw: 1.6, amp: .4, seed: 168 });
  // 耳（内耳粉）
  poly(ctx, [[-11, hy - 6], [-14, hy - 15], [-4, hy - 11]], { fill: '#7a7268', lw: 2.2, amp: .6, seed: 169 });
  poly(ctx, [[11, hy - 6], [14, hy - 15], [4, hy - 11]], { fill: '#7a7268', lw: 2.2, amp: .6, seed: 170 });
  poly(ctx, [[-10.5, hy - 7.5], [-12.5, hy - 13], [-6.5, hy - 10.5]], { fill: '#c9909a', stroke: null, amp: .3, seed: 171 });
  poly(ctx, [[10.5, hy - 7.5], [12.5, hy - 13], [6.5, hy - 10.5]], { fill: '#c9909a', stroke: null, amp: .3, seed: 172 });
  // 金色竖瞳
  ell(ctx, -4.5, hy - 1, 1.9, 2.3, { fill: '#c9a227', stroke: null, amp: .2, seed: 173 });
  ell(ctx, 4.5, hy - 1, 1.9, 2.3, { fill: '#c9a227', stroke: null, amp: .2, seed: 174 });
  ell(ctx, -4.5, hy - 1, .6, 1.7, { fill: '#1c140c', stroke: null, amp: .1, seed: 175 });
  ell(ctx, 4.5, hy - 1, .6, 1.7, { fill: '#1c140c', stroke: null, amp: .1, seed: 176 });
  // 鼻+嘴+胡须
  poly(ctx, [[-1.2, hy + 3], [1.2, hy + 3], [0, hy + 4.4]], { fill: '#c9909a', stroke: null, amp: .15, seed: 177 });
  line(ctx, -1.5, hy + 5.5, 1.5, hy + 5.5, { lw: 1.4, amp: .2, seed: 178 });
  for (const m of [-1, 1]) {
    line(ctx, m * 7, hy + 4, m * 13, hy + 3, { lw: 1.1, amp: .2, seed: 179 + m, stroke: '#d8d0be' });
    line(ctx, m * 7, hy + 5.5, m * 13, hy + 6.5, { lw: 1.1, amp: .2, seed: 181 + m, stroke: '#d8d0be' });
  }
  ctx.restore();
}

/* 羊神父：圣带+十字架+胡须+弯角棱线 */
export function drawGoat(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadow(ctx, 17);
  const br = Math.sin(t * .9) * 1;
  // 黑袍+宽袖
  poly(ctx, [[-16, -58 + br], [16, -58 + br], [19, -14], [-19, -14]], { fill: '#3a3a42', lw: 2.8, amp: 1, seed: 185 });
  poly(ctx, [[-19, -46 + br], [-24, -40 + br], [-22, -20], [-16, -22]], { fill: '#33333b', lw: 2.2, amp: .7, seed: 186 });
  poly(ctx, [[19, -46 + br], [24, -40 + br], [22, -20], [16, -22]], { fill: '#33333b', lw: 2.2, amp: .7, seed: 187 });
  // 圣带（前后两条金色带+十字）
  poly(ctx, [[-6, -56 + br], [-2, -56 + br], [-3, -18], [-7, -18]], { fill: '#c9a227', stroke: null, amp: .5, seed: 188 });
  poly(ctx, [[2, -56 + br], [6, -56 + br], [7, -18], [3, -18]], { fill: '#c9a227', stroke: null, amp: .5, seed: 189 });
  line(ctx, -5, -40 + br, -4, -30 + br, { lw: 1.2, amp: .2, seed: 190, stroke: '#7a5c14' });
  line(ctx, 5, -40 + br, 4, -30 + br, { lw: 1.2, amp: .2, seed: 191, stroke: '#7a5c14' });
  // 合十的手
  ell(ctx, 0, -20, 4, 5, { fill: '#d8d2c4', lw: 2, amp: .5, seed: 192 });
  const hy = -74 + br;
  // 头+吻部
  poly(ctx, [[-12, hy - 6], [-12, hy + 12], [0, hy + 17], [12, hy + 12], [12, hy - 6]], { fill: '#d8d2c4', lw: 2.6, amp: .9, seed: 193 });
  poly(ctx, [[-5, hy + 9], [5, hy + 9], [3, hy + 15], [0, hy + 16], [-3, hy + 15]], { fill: '#c2b7a2', stroke: null, amp: .4, seed: 194 });
  // 沉重的眉+温和眼
  line(ctx, -8, hy - 1, -2.5, hy - .5, { lw: 1.8, amp: .3, seed: 195 });
  line(ctx, 2.5, hy - .5, 8, hy - 1, { lw: 1.8, amp: .3, seed: 196 });
  ell(ctx, -4.5, hy + 2, 1.5, 2, { fill: '#1c140c', stroke: null, amp: .2, seed: 197 });
  ell(ctx, 4.5, hy + 2, 1.5, 2, { fill: '#1c140c', stroke: null, amp: .2, seed: 198 });
  // 山羊胡
  poly(ctx, [[-3, hy + 14], [3, hy + 14], [2, hy + 22], [0, hy + 24], [-2, hy + 22]], { fill: '#c2b7a2', lw: 1.8, amp: .5, seed: 199 });
  // 弯角（带棱线）
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, hy - 6); ctx.quadraticCurveTo(-18, hy - 20, -8, hy - 26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, hy - 6); ctx.quadraticCurveTo(18, hy - 20, 8, hy - 26); ctx.stroke();
  ctx.strokeStyle = '#8a8272'; ctx.lineWidth = 1.2;
  for (let i = 1; i <= 3; i++) {
    const tt = i / 4;
    ctx.beginPath();
    ctx.moveTo(-8 - 10 * tt * (1 - tt) * 2 * .8, hy - 6 - 20 * tt + 6 * tt * tt);
    ctx.lineTo(-8 - 10 * tt * (1 - tt) * 2 * .8 + 3, hy - 6 - 20 * tt + 6 * tt * tt + 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

/* 猪路人：背带裤+补丁+垂耳 */
export function drawPig(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadow(ctx, 16);
  const br = Math.sin(t * 1.2) * 1;
  poly(ctx, [[-15, -50 + br], [15, -50 + br], [18, -14], [-18, -14]], { fill: '#7a5a48', lw: 2.8, amp: 1, seed: 205 });
  // 背带裤
  poly(ctx, [[-13, -34], [13, -34], [15, -14], [-15, -14]], { fill: '#4a5a6a', stroke: null, amp: .8, seed: 206 });
  line(ctx, -10, -34, -12, -46 + br, { lw: 2.4, amp: .4, seed: 207, stroke: '#4a5a6a' });
  line(ctx, 10, -34, 12, -46 + br, { lw: 2.4, amp: .4, seed: 208, stroke: '#4a5a6a' });
  ell(ctx, -10, -33, 1.6, 1.6, { fill: '#c9a227', stroke: null, amp: .2, seed: 209 });
  ell(ctx, 10, -33, 1.6, 1.6, { fill: '#c9a227', stroke: null, amp: .2, seed: 210 });
  // 补丁口袋
  poly(ctx, [[3, -26], [10, -26], [10, -20], [3, -20]], { fill: '#5d6e80', lw: 1.4, amp: .4, seed: 211 });
  const hy = -64 + br;
  ell(ctx, 0, hy, 13, 11, { fill: '#e0a8a0', lw: 2.6, amp: .8, seed: 212 });
  // 垂耳（内耳）
  poly(ctx, [[-14, hy - 8], [-10, hy - 15], [-5, hy - 8], [-9, hy - 5]], { fill: '#e0a8a0', lw: 2, amp: .5, seed: 213 });
  poly(ctx, [[14, hy - 8], [10, hy - 15], [5, hy - 8], [9, hy - 5]], { fill: '#e0a8a0', lw: 2, amp: .5, seed: 214 });
  poly(ctx, [[-11.5, hy - 9], [-9, hy - 12.5], [-7, hy - 8.5]], { fill: '#c8837a', stroke: null, amp: .3, seed: 215 });
  poly(ctx, [[11.5, hy - 9], [9, hy - 12.5], [7, hy - 8.5]], { fill: '#c8837a', stroke: null, amp: .3, seed: 216 });
  ell(ctx, -4, hy - 2, 1.4, 1.8, { fill: '#1c140c', stroke: null, amp: .2, seed: 217 });
  ell(ctx, 4, hy - 2, 1.4, 1.8, { fill: '#1c140c', stroke: null, amp: .2, seed: 218 });
  // 鼻（鼻孔加深+高光）
  ell(ctx, 0, hy + 5, 4.5, 3.4, { fill: '#c8837a', lw: 2, amp: .4, seed: 219 });
  ell(ctx, -1.6, hy + 5, .9, 1.2, { fill: '#7a4238', stroke: null, amp: .2, seed: 220 });
  ell(ctx, 1.6, hy + 5, .9, 1.2, { fill: '#7a4238', stroke: null, amp: .2, seed: 221 });
  ell(ctx, -1.2, hy + 3.6, .7, .5, { fill: '#e8c0b8', stroke: null, amp: .1, seed: 222, alpha: .9 });
  // 微笑+腮红
  line(ctx, -3, hy + 9.5, 3, hy + 9.5, { lw: 1.4, amp: .3, seed: 223 });
  ell(ctx, -8, hy + 4, 1.8, 1.2, { fill: '#e89088', stroke: null, amp: .2, seed: 224, alpha: .6 });
  ell(ctx, 8, hy + 4, 1.8, 1.2, { fill: '#e89088', stroke: null, amp: .2, seed: 225, alpha: .6 });
  ctx.restore();
}

/* ============ 里世界怪物 v2（寂静岭式：溃烂层 + 骨骼 + 滴液动画） ============ */

/* 无面护士 v2：驼背、撕裂袍摆、腹部血渍滴落、缝合线十字线脚、
   凹陷眼窝、长针滴液、量化抽搐+偶发头部猛歪 */
export function drawNurse(ctx, x, y, s, t, seed = 0) {
  const tq = Math.floor(t * 8) + seed * 100;
  const jx = hash(tq, seed) * 2.4, jy = hash(tq, seed + 1) * 1.6;
  const jerk = hash(Math.floor(t * 1.3) + seed * 7, seed + 2) > .82 ? .28 : 0;  // 偶发头部猛歪
  const tilt = .5 + hash(seed, 7) * .14 + jerk;
  ctx.save(); ctx.translate(x + jx, y + jy); ctx.scale(s, s);
  shadow(ctx, 15, .22);
  // 驼背的躯干（背部弧线隆起）
  poly(ctx, [[-14, -52], [-8, -58], [6, -58], [14, -50], [17, -14], [-17, -14]], { fill: '#ded8c8', lw: 2.8, amp: 1, seed: seed + 230 });
  // 撕裂袍摆（锯齿）
  poly(ctx, [[-17, -17], [-11, -12], [-5, -17], [1, -12], [7, -17], [12, -12], [17, -17], [17, -14], [-17, -14]], { fill: '#b8b2a2', lw: 1.6, amp: .5, seed: seed + 231 });
  // 腹部巨大陈血渍（多层）
  poly(ctx, [[-7, -46], [9, -44], [12, -24], [-5, -26]], { fill: '#8e6a54', stroke: null, amp: .7, seed: seed + 232, alpha: .85 });
  poly(ctx, [[-4, -42], [6, -40], [8, -28], [-2, -30]], { fill: '#6e4a38', stroke: null, amp: .5, seed: seed + 233, alpha: .9 });
  // 血渍滴落（随时间循环）
  const dropPh = (t * .7 + seed * .37) % 1;
  const dropY = -24 + dropPh * 20;
  line(ctx, 4, -26, 4, dropY, { lw: 1.4, amp: .2, seed: seed + 234, stroke: '#5d3a2c', alpha: .9 - dropPh * .5 });
  ell(ctx, 4, dropY + 2, 1, 1.5, { fill: '#5d3a2c', stroke: null, amp: .1, seed: seed + 235, alpha: 1 - dropPh * .7 });
  // 左臂垂落（细长手指）
  poly(ctx, [[-17, -50], [-21, -48], [-20, -14], [-15, -16]], { fill: '#ded8c8', lw: 2.4, amp: .8, seed: seed + 236 });
  for (let i = 0; i < 3; i++) line(ctx, -19, -13, -20 + i * 2, -6 + Math.abs(hash(seed + i, 3)) * 3, { lw: 1.2, amp: .3, seed: seed + 237 + i, stroke: '#c9bda8' });
  // 右臂持长针（针管内药液+针尖滴液）
  poly(ctx, [[17, -50], [21, -48], [22, -20], [16, -22]], { fill: '#ded8c8', lw: 2.4, amp: .8, seed: seed + 240 });
  poly(ctx, [[19, -24], [27, -18], [25, -14], [17, -20]], { fill: '#cfc8b8', lw: 1.6, amp: .4, seed: seed + 241 });
  poly(ctx, [[25, -20], [31, -17], [31, -13], [25, -16]], { fill: '#cfc8b8', lw: 1.4, amp: .3, seed: seed + 242 });
  poly(ctx, [[26, -19.5], [30, -17.5], [30, -14.5], [26, -16.5]], { fill: '#9e8a5a', stroke: null, amp: .2, seed: seed + 243, alpha: .85 });
  line(ctx, 31, -15, 38, 4, { lw: 1.6, amp: .3, seed: seed + 244, stroke: '#b9b4a8' });
  poly(ctx, [[37, 4], [39.5, 2], [38, 7]], { fill: '#d8d4c8', stroke: null, amp: .2, seed: seed + 245 });
  const nd = (t * .9 + seed * .5) % 1;
  ell(ctx, 38, 6 + nd * 10, .8, 1.4, { fill: '#c9c2b0', stroke: null, amp: .1, seed: seed + 246, alpha: 1 - nd });
  // 歪斜的无面头
  ctx.save(); ctx.translate(0, -66); ctx.rotate(tilt + Math.sin(t * 2 + seed) * .06);
  ell(ctx, 0, 0, 11, 12.5, { fill: '#e8e0cc', lw: 2.6, amp: .8, seed: seed + 247 });
  // 凹陷眼窝（无瞳孔，只有暗影）
  ell(ctx, -4.5, -2, 2.6, 3.2, { fill: '#b8ac94', stroke: null, amp: .3, seed: seed + 248, alpha: .8 });
  ell(ctx, 4.5, -2.5, 2.4, 3, { fill: '#b8ac94', stroke: null, amp: .3, seed: seed + 249, alpha: .8 });
  // 缝合线 + 十字线脚
  line(ctx, -2, -11, 1.5, 11, { lw: 1.4, amp: .3, seed: seed + 250, stroke: '#8e8272' });
  for (let i = 0; i < 5; i++) {
    const yy = -8 + i * 4.5;
    const xx = -2 + (yy + 11) * .32;
    line(ctx, xx - 1.6, yy, xx + 1.6, yy - .8, { lw: 1, amp: .15, seed: seed + 251 + i, stroke: '#6e6454' });
  }
  // 颌线渗液
  const jd = (t * .5 + seed) % 1;
  line(ctx, -3, 11, -3, 11 + jd * 6, { lw: 1.1, amp: .2, seed: seed + 256, stroke: '#7a6a50', alpha: .8 - jd * .6 });
  ctx.restore();
  ctx.restore();
}

/* 长颈客 v2：颈椎节节可见、耷拉头张颌露齿、浊白眼球、
   脊背棘线、肘关节长臂三指、体侧肋纹 */
export function drawLurker(ctx, x, y, s, t, seed = 0) {
  const sw = Math.sin(t * 1.7 + seed) * 5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shadow(ctx, 13, .25);
  // 躯干（前倾）
  poly(ctx, [[-8, -60], [8, -58], [12, 0], [-12, 0]], { fill: '#241f1e', lw: 3, amp: 1.4, seed: seed + 260 });
  // 肋纹（浅色，透出皮下的骨）
  for (let i = 0; i < 4; i++) line(ctx, -6 + i, -48 + i * 9, 5 - i, -44 + i * 9, { lw: 1.1, amp: .4, seed: seed + 261 + i, stroke: '#4a423e', alpha: .8 });
  // 脊背棘线
  for (let i = 0; i < 5; i++) line(ctx, -7 + i * .5, -58 + i * 10, -10 - i * .4, -56 + i * 10, { lw: 1.4, amp: .3, seed: seed + 266 + i, stroke: '#171310' });
  // 过长的脖颈
  ctx.strokeStyle = '#241f1e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(4 + sw * .4, -86, sw, -104); ctx.stroke();
  // 颈椎节（沿曲线的骨节）
  for (let i = 1; i <= 6; i++) {
    const tt = i / 7;
    const nx = 2 * (1 - tt) * (1 - tt) * 0 + 2 * (1 - tt) * tt * (4 + sw * .4) + tt * tt * sw;
    const ny = 2 * (1 - tt) * (1 - tt) * -58 + 2 * (1 - tt) * tt * -86 + tt * tt * -104;
    line(ctx, nx - 3.2, ny, nx + 3.2, ny + .8, { lw: 1.2, amp: .2, seed: seed + 271 + i, stroke: '#3a332e', alpha: .9 });
  }
  // 耷拉的头（张颌+齿）
  ctx.save(); ctx.translate(sw, -106); ctx.rotate(.55 + Math.sin(t * 2.2 + seed) * .1);
  ell(ctx, 0, 0, 8.5, 10, { fill: '#2e2826', lw: 2.6, amp: .9, seed: seed + 278 });
  // 浊白大眼（小瞳）
  ell(ctx, 3.4, 2, 2.6, 2, { fill: '#e8e2d2', stroke: null, amp: .2, seed: seed + 279 });
  ell(ctx, 3.8, 2.1, .8, .8, { fill: '#4a2a24', stroke: null, amp: .1, seed: seed + 280 });
  // 张开的下颌+细齿
  poly(ctx, [[-2, 6], [6, 7], [4, 12], [0, 10]], { fill: '#171310', stroke: null, amp: .3, seed: seed + 281 });
  for (let i = 0; i < 4; i++) poly(ctx, [[-1 + i * 1.9, 7], [0 + i * 1.9, 10.5], [1 + i * 1.9, 7]], { fill: '#d8d2c0', stroke: null, amp: .15, seed: seed + 282 + i });
  // 垂涎
  const ld = (t * .6 + seed * .3) % 1;
  line(ctx, 2, 10, 2, 10 + ld * 7, { lw: 1, amp: .2, seed: seed + 286, stroke: '#8a8272', alpha: .8 - ld * .6 });
  ctx.restore();
  // 过长的手臂（肘弯+三长指）
  for (const m of [-1, 1]) {
    ctx.strokeStyle = '#241f1e'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(m * 9, -52); ctx.quadraticCurveTo(m * (18 - sw * .3), -30, m * 13, -14); ctx.stroke();
    for (let i = 0; i < 3; i++) line(ctx, m * 13, -14, m * (15 + i * 2), -4 + i * 2.5, { lw: 1.3, amp: .3, seed: seed + 290 + i + m * 3, stroke: '#241f1e' });
  }
  ctx.restore();
}

/* 跪行者 v2：棘刺脊背、外翻肋骨、反仰的头（黑洞眼窝+裂口牙）、
   皮肤淤斑、关节四肢长指、拖拽的后腿 */
export function drawCrawler(ctx, x, y, s, t, seed = 0) {
  const g = Math.sin(t * 9 + seed * 3);
  ctx.save(); ctx.translate(x, y + g * 1); ctx.scale(s, s);
  shadow(ctx, 20, .2);
  const dir = 1;
  ctx.scale(dir, 1);
  // 弓起的苍白躯干（淤斑）
  poly(ctx, [
    [-16, -6], [-8, -16 - g], [4, -20 - g], [14, -14], [20, -4], [12, 0], [-10, 0],
  ], { fill: '#cfc4ae', lw: 2.6, amp: 1, seed: seed + 300 });
  ell(ctx, -6, -11 - g, 3, 2, { fill: '#a89a80', stroke: null, amp: .4, seed: seed + 301, alpha: .7 });
  ell(ctx, 3, -14 - g, 2.4, 1.6, { fill: '#a89a80', stroke: null, amp: .4, seed: seed + 302, alpha: .7 });
  ell(ctx, 10, -8, 2, 1.4, { fill: '#a89a80', stroke: null, amp: .4, seed: seed + 303, alpha: .7 });
  // 脊背棘刺
  for (let i = 0; i < 4; i++) {
    const bx = -7 + i * 6, by = -15 - g + (i > 1 ? (i - 2) * 2.4 : -i * 1.2);
    poly(ctx, [[bx - 1.6, by], [bx, by - 4.5 - (3 - Math.abs(i - 1.5)) * .8], [bx + 1.6, by]], { fill: '#e8e0cc', lw: 1.2, amp: .3, seed: seed + 304 + i });
  }
  // 外翻肋骨（白色弧线）
  for (let i = 0; i < 4; i++) line(ctx, -8 + i * 5, -13 - g, -5 + i * 5, -4, { lw: 1.5, amp: .4, seed: seed + 308 + i, stroke: '#ece4d0', alpha: .85 });
  // 四肢（关节+长指）
  for (const [ax, ay, dir2] of [[-12, -10, -1], [-4, -14, 1], [8, -12, 1], [14, -8, -1]]) {
    line(ctx, ax, ay, ax + dir2 * 3, -4, { lw: 3, amp: .5, seed: seed + 312 + ax, stroke: '#cfc4ae' });
    line(ctx, ax + dir2 * 3, -4, ax + dir2 * (5 + Math.abs(g) * 2), 0, { lw: 2.6, amp: .5, seed: seed + 320 + ax, stroke: '#c0b49c' });
    for (let i = 0; i < 2; i++) line(ctx, ax + dir2 * (5 + Math.abs(g) * 2), 0, ax + dir2 * (7 + i * 2.4), 1.5, { lw: 1, amp: .2, seed: seed + 328 + ax + i, stroke: '#b0a48c' });
  }
  // 反仰的头（朝上后方，黑洞眼窝+裂口牙）
  ctx.save(); ctx.translate(21, -9 - g); ctx.rotate(-.5 + g * .06);
  ell(ctx, 0, 0, 6.5, 5.5, { fill: '#d8cdb8', lw: 2.2, amp: .6, seed: seed + 336 });
  ell(ctx, -1.5, -2, 1.9, 2.3, { fill: '#171310', stroke: null, amp: .2, seed: seed + 337 });
  ell(ctx, 2.8, -2.4, 1.4, 1.7, { fill: '#171310', stroke: null, amp: .2, seed: seed + 338 });
  // 裂口+牙
  poly(ctx, [[-2, 2.5], [5, 1.5], [4.5, 4], [-1, 4.5]], { fill: '#4a3020', stroke: null, amp: .25, seed: seed + 339 });
  for (let i = 0; i < 3; i++) poly(ctx, [[-1 + i * 2.1, 2.6], [0 + i * 2.1, 4.2], [1 + i * 2.1, 2.6]], { fill: '#e8e0cc', stroke: null, amp: .12, seed: seed + 340 + i });
  ctx.restore();
  ctx.restore();
}
