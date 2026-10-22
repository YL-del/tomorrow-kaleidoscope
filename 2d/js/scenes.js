/* scenes.js —— 角色 + 三个房间场景（现在态 / 未来态） */
import { poly, ell, line, INK, PAL, hash, flame } from './art.js';

const FLOOR = 600; // 地面线

/* ============ 角色 ============ */

/* 阿堵：独眼男孩，万花筒之瞳 */
export function drawBoy(ctx, x, y, s, t, opt = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bob = Math.sin(t * 1.6) * 1.5;
  ctx.translate(0, bob);
  // 腿 + 鞋
  poly(ctx, [[-16, 0], [-5, 0], [-5, -48], [-16, -48]], { fill: '#3a3f52', seed: 21, lw: 2.5 });
  poly(ctx, [[5, 0], [16, 0], [16, -48], [5, -48]], { fill: '#34394b', seed: 22, lw: 2.5 });
  poly(ctx, [[-20, 0], [-3, 0], [-3, -9], [-20, -9]], { fill: '#8f463e', seed: 23, lw: 2.5 });
  poly(ctx, [[3, 0], [20, 0], [20, -9], [3, -9]], { fill: '#84403a', seed: 24, lw: 2.5 });
  // 身体（毛衣）
  poly(ctx, [[-30, -44], [30, -44], [36, -108], [-36, -108]], { fill: '#c08238', seed: 25, lw: 3 });
  poly(ctx, [[-36, -108], [36, -108], [34, -122], [-34, -122]], { fill: '#a8712e', seed: 26, lw: 2.5 });
  // 背带裤
  poly(ctx, [[-16, -100], [16, -100], [16, -44], [5, -44], [5, -92], [-5, -92], [-5, -44], [-16, -44]], { fill: '#414c74', seed: 27, lw: 2.5, close: true });
  // 手臂
  poly(ctx, [[-36, -104], [-48, -60], [-38, -56], [-28, -98]], { fill: '#b57a33', seed: 28, lw: 2.5 });
  poly(ctx, [[36, -104], [48, -60], [38, -56], [28, -98]], { fill: '#b57a33', seed: 29, lw: 2.5 });
  // 围巾
  ell(ctx, 0, -122, 26, 9, { fill: '#9e4c47', seed: 30, lw: 2.5 });
  poly(ctx, [[10, -118], [22, -96], [12, -92], [4, -116]], { fill: '#8e423e', seed: 31, lw: 2.5 });
  // 头
  ell(ctx, 0, -168, 46, 44, { fill: '#f3e3c2', seed: 32, lw: 3 });
  // 头发 + 呆毛
  poly(ctx, [[-46, -172], [-30, -206], [-10, -190], [8, -208], [30, -192], [46, -172], [30, -180], [0, -174], [-28, -180]], { fill: '#4c3a2b', seed: 33, lw: 2.5 });
  line(ctx, 2, -206, 8 + Math.sin(t * 3) * 3, -226, { lw: 4, seed: 34 });
  // 腮红
  ell(ctx, -30, -156, 7, 4.5, { fill: '#d99c88', stroke: null, seed: 35, alpha: .8 });
  ell(ctx, 34, -160, 6, 4, { fill: '#d99c88', stroke: null, seed: 36, alpha: .8 });
  // —— 万花筒之瞳（唯一的大眼睛）——
  const ex = 4, ey = -164;
  ell(ctx, ex, ey, 20, 20, { fill: '#f8f2e0', seed: 37, lw: 3, n: 22 });
  const spin = t * (opt.eyeFast ? 2.4 : 0.35);
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * Math.PI * 2;
    const cols = ['#2e7f76', '#a8403a', '#c9a227'];
    const px = ex + Math.cos(a) * 8.5, py = ey + Math.sin(a) * 8.5;
    ell(ctx, px, py, 5.5, 3.4, { fill: cols[i % 3], stroke: null, seed: 40 + i, rot: a, alpha: .95 });
  }
  ell(ctx, ex, ey, 13.5, 13.5, { fill: null, stroke: '#c9a227', lw: 2.5, seed: 49, n: 20 });
  ell(ctx, ex, ey, 4.6, 4.6, { fill: '#0a0d12', stroke: null, seed: 50, n: 14 });
  ell(ctx, ex - 4, ey - 5, 2.4, 2.2, { fill: '#fff8e8', stroke: null, seed: 51, n: 10 });
  ctx.restore();
}

/* 鹿先生：管家，长外套 + 鹿角 */
export function drawDeer(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const br = Math.sin(t * 1.1) * 1;
  ctx.translate(0, br);
  // 腿
  poly(ctx, [[-20, 0], [-8, 0], [-8, -60], [-20, -60]], { fill: '#4a3a2c', seed: 61, lw: 2.5 });
  poly(ctx, [[8, 0], [20, 0], [20, -60], [8, -60]], { fill: '#423426', seed: 62, lw: 2.5 });
  poly(ctx, [[-24, 0], [-6, 0], [-6, -10], [-24, -10]], { fill: '#241c14', seed: 63, lw: 2.5 });
  poly(ctx, [[6, 0], [24, 0], [24, -10], [6, -10]], { fill: '#241c14', seed: 64, lw: 2.5 });
  // 长外套
  poly(ctx, [[-34, -56], [34, -56], [40, -178], [-40, -178]], { fill: '#7a5636', seed: 65, lw: 3 });
  poly(ctx, [[-40, -178], [40, -178], [38, -192], [-38, -192]], { fill: '#684828', seed: 66, lw: 2.5 });
  for (let i = 0; i < 4; i++) ell(ctx, 0, -168 + i * 30, 3.4, 3.4, { fill: '#2c2218', stroke: null, seed: 67 + i, n: 10 });
  // 手
  ell(ctx, -44, -110, 9, 11, { fill: '#b08a5c', seed: 71, lw: 2.5 });
  ell(ctx, 44, -110, 9, 11, { fill: '#b08a5c', seed: 72, lw: 2.5 });
  // 鹿头
  ell(ctx, 0, -224, 30, 34, { fill: '#b08a5c', seed: 73, lw: 3 });
  poly(ctx, [[-30, -216], [-52, -206], [-30, -200]], { fill: '#a37e50', seed: 74, lw: 2.5 });
  poly(ctx, [[30, -216], [52, -206], [30, -200]], { fill: '#a37e50', seed: 75, lw: 2.5 });
  // 鹿角
  line(ctx, -14, -254, -26, -296, { lw: 4.5, seed: 76 });
  line(ctx, -22, -280, -44, -298, { lw: 3.5, seed: 77 });
  line(ctx, -24, -268, -46, -274, { lw: 3.5, seed: 78 });
  line(ctx, 14, -254, 26, -296, { lw: 4.5, seed: 79 });
  line(ctx, 22, -280, 44, -298, { lw: 3.5, seed: 80 });
  line(ctx, 24, -268, 46, -274, { lw: 3.5, seed: 81 });
  // 眼睛（细长温和）
  line(ctx, -18, -232, -8, -230, { lw: 3, seed: 82 });
  line(ctx, 8, -230, 18, -232, { lw: 3, seed: 83 });
  ell(ctx, 0, -212, 6, 4.5, { fill: '#241c14', stroke: null, seed: 84, n: 12 });
  ctx.restore();
}

/* 兔小姐：女仆装 + 长耳 */
export function drawRabbit(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bob = Math.sin(t * 2 + 1) * 1.5;
  ctx.translate(0, bob);
  // 腿
  poly(ctx, [[-14, 0], [-5, 0], [-5, -36], [-14, -36]], { fill: '#5a4a3c', seed: 91, lw: 2.5 });
  poly(ctx, [[5, 0], [14, 0], [14, -36], [5, -36]], { fill: '#52443a', seed: 92, lw: 2.5 });
  poly(ctx, [[-18, 0], [-3, 0], [-3, -8], [-18, -8]], { fill: '#241c14', seed: 93, lw: 2.5 });
  poly(ctx, [[3, 0], [18, 0], [18, -8], [3, -8]], { fill: '#241c14', seed: 94, lw: 2.5 });
  // 连衣裙
  poly(ctx, [[-24, -34], [24, -34], [30, -110], [-30, -110]], { fill: '#7d6a58', seed: 95, lw: 3 });
  // 围裙
  poly(ctx, [[-18, -46], [18, -46], [22, -100], [-22, -100]], { fill: '#e5dcc4', seed: 96, lw: 2.5 });
  poly(ctx, [[-20, -104], [20, -104], [16, -118], [-16, -118]], { fill: '#d8ceba', seed: 97, lw: 2.5 });
  // 手（拿鸡毛掸）
  ell(ctx, -34, -78, 8, 9, { fill: '#cfcabc', seed: 98, lw: 2.5 });
  ell(ctx, 34, -86, 8, 9, { fill: '#cfcabc', seed: 99, lw: 2.5 });
  line(ctx, 34, -92, 48, -140, { lw: 3, seed: 100 });
  ell(ctx, 50, -150, 8, 16, { fill: '#d8ceba', stroke: null, seed: 101, alpha: .9 });
  // 兔头
  ell(ctx, 0, -142, 26, 28, { fill: '#cfcabc', seed: 102, lw: 3 });
  // 长耳
  poly(ctx, [[-16, -162], [-24, -236], [-8, -238], [-2, -166]], { fill: '#c6bcae', seed: 103, lw: 2.5 });
  poly(ctx, [[2, -166], [10, -240], [24, -234], [14, -162]], { fill: '#c6bcae', seed: 104, lw: 2.5 });
  poly(ctx, [[-15, -172], [-19, -226], [-11, -226], [-8, -172]], { fill: '#d9a8a0', stroke: null, seed: 105, amp: 1 });
  poly(ctx, [[6, -172], [13, -224], [19, -222], [12, -172]], { fill: '#d9a8a0', stroke: null, seed: 106, amp: 1 });
  // 眼睛 + 鼻
  ell(ctx, -10, -146, 3.4, 4, { fill: '#241c14', stroke: null, seed: 107, n: 10 });
  ell(ctx, 10, -146, 3.4, 4, { fill: '#241c14', stroke: null, seed: 108, n: 10 });
  poly(ctx, [[-4, -136], [4, -136], [0, -131]], { fill: '#b06a5c', stroke: null, seed: 109, amp: .6 });
  ctx.restore();
}

/* ============ 通用布景 ============ */

function wallpaper(ctx) {
  poly(ctx, [[0, 0], [1280, 0], [1280, FLOOR], [0, FLOOR]], { fill: PAL.wall, stroke: null, amp: 0 });
  ctx.save(); ctx.globalAlpha = .5;
  for (let x = 30; x < 1280; x += 56) line(ctx, x, 0, x, FLOOR, { lw: 1.5, stroke: PAL.wallStripe, amp: .8, seed: x });
  ctx.restore();
  // 墙裙
  poly(ctx, [[0, FLOOR - 90], [1280, FLOOR - 90], [1280, FLOOR], [0, FLOOR]], { fill: PAL.wainscot, seed: 90, lw: 3 });
  line(ctx, 0, FLOOR - 90, 1280, FLOOR - 90, { lw: 4 });
  // 地板
  poly(ctx, [[0, FLOOR], [1280, FLOOR], [1280, 720], [0, 720]], { fill: PAL.floor, stroke: null, amp: 0 });
  for (let x = 0; x < 1280; x += 88) line(ctx, x + hash(x, 3) * 4, FLOOR, x - 30 + hash(x, 4) * 4, 720, { lw: 2, alpha: .4, seed: x + 5 });
  line(ctx, 0, FLOOR, 1280, FLOOR, { lw: 4 });
}

function windowView(ctx, x, y, w, h) {
  // 窗外：灰蓝天空 + 远山 + 松林（参考图的湖景山色）
  poly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { fill: PAL.sky, seed: 111, lw: 3 });
  ctx.save();
  ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip();
  // 远山
  poly(ctx, [[x - 10, y + h * .72], [x + w * .2, y + h * .3], [x + w * .42, y + h * .62], [x + w * .62, y + h * .26], [x + w * .85, y + h * .58], [x + w + 10, y + h * .4], [x + w + 10, y + h], [x - 10, y + h]], { fill: PAL.mountainFar, stroke: null, seed: 112, amp: 1 });
  poly(ctx, [[x + w * .08, y + h * .4], [x + w * .2, y + h * .3], [x + w * .34, y + h * .44]], { fill: PAL.mountainHi, stroke: null, seed: 113, amp: 1 });
  // 松林剪影
  for (let i = 0; i < 9; i++) {
    const tx = x + 8 + i * (w / 9), ty = y + h * .8;
    poly(ctx, [[tx - 9, ty], [tx, ty - 26 - hash(i, 9) * 8], [tx + 9, ty]], { fill: PAL.pine, stroke: null, seed: 120 + i, amp: .8 });
  }
  poly(ctx, [[x - 10, y + h * .82], [x + w + 10, y + h * .8], [x + w + 10, y + h], [x - 10, y + h]], { fill: PAL.mountainNear, stroke: null, seed: 130, amp: 1 });
  ctx.restore();
  // 窗棂
  line(ctx, x + w / 2, y, x + w / 2, y + h, { lw: 3.5, seed: 131 });
  line(ctx, x, y + h / 2, x + w, y + h / 2, { lw: 3.5, seed: 132 });
  poly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { fill: null, stroke: INK, lw: 4, seed: 133, amp: 1 });
}

function carpet(ctx, x, w) {
  ell(ctx, x, FLOOR + 60, w, 34, { fill: PAL.red, stroke: INK, lw: 3, seed: 140, alpha: .92 });
  ell(ctx, x, FLOOR + 60, w * .72, 24, { fill: PAL.redDeep, stroke: null, seed: 141, alpha: .7 });
}

/* ============ 房间：雾之卧室 ============ */

export function drawBedroom(ctx, t, F) {
  wallpaper(ctx);
  // 窗 + 窗帘
  windowView(ctx, 90, 90, 210, 250);
  const sway = Math.sin(t * .8) * 5;
  poly(ctx, [[82, 78], [116, 78], [110 + sway, 372], [76, 372]], { fill: PAL.cloth, seed: 142, lw: 3 });
  poly(ctx, [[292, 78], [326, 78], [326, 372], [290 - sway, 372]], { fill: PAL.cloth, seed: 143, lw: 3 });
  line(ctx, 70, 82, 336, 82, { lw: 5, seed: 144 });
  // 手巾（挂在窗右沿）
  if (!F.towel) {
    poly(ctx, [[300, 120], [330, 118], [336, 190], [326, 188], [322, 150], [306, 152], [300, 190]], { fill: '#e0d3ae', seed: 145, lw: 2.5 });
    line(ctx, 306, 152, 322, 150, { lw: 1.5, alpha: .5, seed: 146 });
  }
  // 床
  poly(ctx, [[380, 560], [700, 560], [700, 470], [660, 430], [400, 430], [380, 470]], { fill: PAL.wood, seed: 147, lw: 3 });
  poly(ctx, [[390, 470], [690, 470], [690, 520], [390, 520]], { fill: PAL.red, seed: 148, lw: 3 });
  poly(ctx, [[660, 436], [700, 470], [660, 470]], { fill: '#e8ddc2', stroke: null, seed: 149 });
  poly(ctx, [[616, 434], [664, 448], [664, 468], [612, 456]], { fill: PAL.cream, seed: 150, lw: 2.5 });
  line(ctx, 388, 520, 692, 520, { lw: 3, seed: 151 });
  // 床底阴影
  ell(ctx, 540, 572, 150, 16, { fill: '#4a3826', stroke: null, seed: 152, alpha: .5 });
  // 地毯
  carpet(ctx, 620, 150);
  // 炉子
  poly(ctx, [[920, 560], [1080, 560], [1072, 400], [928, 400]], { fill: PAL.iron, seed: 153, lw: 3.5 });
  poly(ctx, [[948, 400], [952, 220], [988, 220], [986, 400]], { fill: PAL.ironDark, seed: 154, lw: 3 });
  line(ctx, 936, 228, 1004, 228, { lw: 4, seed: 155 });
  // 炉门
  if (F.stoveClosed) {
    ell(ctx, 1000, 480, 34, 40, { fill: PAL.ironDark, seed: 156, lw: 3 });
    ell(ctx, 1000, 480, 12, 4, { fill: '#2a2724', stroke: null, seed: 157 });
  } else {
    ell(ctx, 1000, 482, 34, 42, { fill: '#1c140c', seed: 156, lw: 3 });
    flame(ctx, 1000, 508, 46, 15, t, 9);
    ctx.save(); ctx.globalAlpha = .25; ell(ctx, 1000, 490, 52, 60, { fill: '#e08a30', stroke: null, seed: 158 }); ctx.restore();
  }
  // 水壶
  if (!F.kettleOff) {
    const bub = Math.sin(t * 5) * 2;
    poly(ctx, [[1040, 396], [1076, 396], [1072, 360], [1044, 360]], { fill: '#b8b0a0', seed: 159, lw: 2.5 });
    poly(ctx, [[1044, 360], [1040, 348], [1052, 352]], { fill: '#a89f90', stroke: null, seed: 160 });
    line(ctx, 1076, 380, 1092, 368, { lw: 3, seed: 161 });
    line(ctx, 1046 - 6, 352, 1046 - 10, 336 - bub, { lw: 2, alpha: .5, seed: 162 + Math.floor(t * 3) });
    line(ctx, 1060, 350, 1062, 330 - bub, { lw: 2, alpha: .4, seed: 163 + Math.floor(t * 3) });
  }
  // 墙上挂画
  poly(ctx, [[760, 150], [860, 150], [860, 230], [760, 230]], { fill: '#d6c8a8', seed: 164, lw: 3 });
  poly(ctx, [[768, 158], [852, 158], [852, 222], [768, 222]], { fill: '#b9a87c', stroke: null, seed: 165 });
  ell(ctx, 810, 186, 14, 16, { fill: '#8a6f52', stroke: null, seed: 166 });
  poly(ctx, [[790, 218], [830, 218], [818, 196], [800, 198]], { fill: '#5d5142', stroke: null, seed: 167 });
  // 阿堵
  drawBoy(ctx, 620, FLOOR + 52, 1, t);
  // 门（右）
  poly(ctx, [[1150, 560], [1150, 250], [1280, 250], [1280, 560]], { fill: '#6b4b30', stroke: INK, lw: 4, seed: 168 });
  poly(ctx, [[1166, 300], [1264, 300], [1264, 380], [1166, 380]], { fill: '#7d5a39', stroke: null, seed: 169 });
  poly(ctx, [[1166, 400], [1264, 400], [1264, 480], [1166, 480]], { fill: '#7d5a39', stroke: null, seed: 170 });
  if (!F.bedroomOpen) ell(ctx, 1162, 410, 8, 8, { fill: PAL.brass, seed: 171, n: 12, lw: 2.5 });
}

export function bedroomFuture(ctx, t, F) {
  const safe = F.stoveClosed && F.kettleOff;
  if (!safe) {
    // 窗帘着火
    flame(ctx, 130, 200, 130 + Math.sin(t * 7) * 14, 26, t, 31);
    flame(ctx, 300, 240, 110 + Math.sin(t * 7.7 + 2) * 12, 22, t, 32);
    flame(ctx, 210, 160, 90, 18, t, 33);
    ctx.save(); ctx.globalAlpha = .16; poly(ctx, [[70, 90], [340, 90], [360, 380], [60, 380]], { fill: '#c04a18', stroke: null, seed: 172 }); ctx.restore();
    line(ctx, 76, 372, 110 + Math.sin(t) * 5, 300, { lw: 2, stroke: '#743a36', alpha: .7, seed: 173 });
  }
}

/* ============ 房间：门厅 ============ */

export function drawFoyer(ctx, t, F) {
  wallpaper(ctx);
  // 大门（中右）
  poly(ctx, [[690, 560], [690, 210], [1010, 210], [1010, 560]], { fill: '#5d422a', stroke: INK, lw: 4, seed: 180 });
  poly(ctx, [[710, 240], [838, 240], [838, 540], [710, 540]], { fill: '#6d4f32', stroke: null, seed: 181 });
  poly(ctx, [[858, 240], [990, 240], [990, 540], [858, 540]], { fill: '#6d4f32', stroke: null, seed: 182 });
  // 门楣装饰
  poly(ctx, [[672, 210], [1028, 210], [1016, 178], [684, 178]], { fill: '#4c3620', stroke: INK, lw: 3, seed: 183 });
  // 把手孔 / 装好的把手
  if (F.handleOn) {
    ell(ctx, 846, 400, 10, 10, { fill: PAL.brass, seed: 184, n: 12, lw: 2.5 });
    line(ctx, 846, 400, 872, 388, { lw: 5, seed: 185 });
    ell(ctx, 874, 386, 5, 5, { fill: PAL.gold, seed: 186, n: 10 });
  } else {
    ell(ctx, 846, 400, 9, 9, { fill: '#241c14', seed: 184, n: 12, lw: 3 });
  }
  // 大钟
  poly(ctx, [[150, 560], [150, 240], [280, 240], [280, 560]], { fill: PAL.woodDark, seed: 187, lw: 4 });
  poly(ctx, [[138, 246], [292, 246], [215, 190]], { fill: '#4c3620', stroke: INK, lw: 3, seed: 188 });
  ell(ctx, 215, 310, 48, 48, { fill: PAL.cream, seed: 189, lw: 3, n: 24 });
  const wound = F.clockWound;
  const minuteA = wound ? (-Math.PI / 2 + (t * 0.02) % (Math.PI * 2)) : -Math.PI / 2;
  line(ctx, 215, 310, 215 + Math.cos(-Math.PI / 2 + 0.6) * 26, 310 + Math.sin(-Math.PI / 2 + 0.6) * 26, { lw: 4, seed: 190 }); // 时针指 12 后一点
  const mm = wound ? (-Math.PI / 2 + Math.PI / 5) : -Math.PI / 2 + Math.PI / 5;
  line(ctx, 215, 310, 215 + Math.cos(mm) * 36, 310 + Math.sin(mm) * 36, { lw: 3, seed: 191 });
  line(ctx, 215, 310, 215 + Math.cos(minuteA) * 36, 310 + Math.sin(minuteA) * 36, { lw: 2, alpha: .9, seed: 192 });
  // 摆锤
  const pend = wound ? Math.sin(t * 2.4) * 0.5 : Math.sin(t * .3) * 0.05;
  line(ctx, 215, 380, 215 + Math.sin(pend) * 60, 380 + Math.cos(pend) * 130, { lw: 3, seed: 193 });
  ell(ctx, 215 + Math.sin(pend) * 60, 380 + Math.cos(pend) * 130, 14, 18, { fill: PAL.brass, seed: 194, lw: 2.5 });
  // 挂衣架
  line(ctx, 380, 560, 380, 320, { lw: 5, seed: 195 });
  line(ctx, 340, 330, 420, 330, { lw: 4, seed: 196 });
  poly(ctx, [[352, 330], [344, 420], [372, 424], [368, 334]], { fill: '#5a4a3c', stroke: null, seed: 197 });
  ell(ctx, 404, 336, 10, 14, { fill: PAL.cream, seed: 198, lw: 2.5 });
  // 烛台小桌
  poly(ctx, [[1080, 560], [1230, 560], [1222, 500], [1088, 500]], { fill: PAL.wood, seed: 199, lw: 3 });
  line(ctx, 1100, 500, 1100, 560, { lw: 3, seed: 200 });
  line(ctx, 1210, 500, 1210, 560, { lw: 3, seed: 201 });
  ell(ctx, 1155, 486, 10, 14, { fill: PAL.cream, seed: 202, lw: 2.5 });
  flame(ctx, 1155, 472, 26, 8, t, 41);
  // 红地毯（通向大门）
  poly(ctx, [[560, 560], [1140, 560], [1190, 720], [500, 720]], { fill: PAL.red, stroke: INK, lw: 3, seed: 203, alpha: .9 });
  // 鹿先生
  if (F.metDeer) drawDeer(ctx, 480, FLOOR + 55, 1.05, t);
  // 阿堵
  drawBoy(ctx, 640, FLOOR + 55, .95, t);
  // 侧门（左：回卧室）
  poly(ctx, [[0, 560], [0, 280], [96, 280], [96, 560]], { fill: '#6b4b30', stroke: INK, lw: 4, seed: 204 });
  ell(ctx, 84, 420, 7, 7, { fill: PAL.brass, seed: 205, n: 12, lw: 2 });
  // 书房门（右）
  poly(ctx, [[1184, 560], [1184, 280], [1280, 280], [1280, 560]], { fill: '#63452c', stroke: INK, lw: 4, seed: 206 });
  poly(ctx, [[1196, 310], [1268, 310], [1268, 390], [1196, 390]], { fill: '#755636', stroke: null, seed: 207 });
  poly(ctx, [[1196, 410], [1268, 410], [1268, 490], [1196, 490]], { fill: '#755636', stroke: null, seed: 208 });
  ell(ctx, 1196, 420, 7, 7, { fill: PAL.brass, seed: 209, n: 12, lw: 2 });
}

export function foyerFuture(ctx, t, F) {
  const safe = F.handleOn && F.clockWound;
  if (!safe) {
    // 大门敞开，浓雾涌入 + 红色湖面 + 高大鹿影
    poly(ctx, [[710, 540], [710, 240], [990, 240], [990, 540]], { fill: '#0e0c08', stroke: null, seed: 210, amp: 1 });
    ctx.save();
    ctx.beginPath(); ctx.rect(712, 242, 276, 296); ctx.clip();
    poly(ctx, [[712, 380], [990, 372], [990, 538], [712, 538]], { fill: PAL.blood, stroke: null, seed: 211, amp: 1.4, alpha: .85 });
    // 雾
    for (let i = 0; i < 4; i++) {
      const fx = 730 + i * 70 + Math.sin(t * .8 + i) * 14;
      ell(ctx, fx, 330 + hash(i, 3) * 30, 60, 22, { fill: PAL.fog, stroke: null, seed: 212 + i, alpha: .35, amp: 1.4 });
    }
    // 高大的鹿角剪影
    ctx.globalAlpha = .85;
    poly(ctx, [[820, 500], [880, 500], [868, 300], [832, 300]], { fill: '#0a0806', stroke: null, seed: 218, amp: 1 });
    ell(ctx, 850, 282, 22, 26, { fill: '#0a0806', stroke: null, seed: 219 });
    line(ctx, 838, 262, 826, 216, { lw: 4, stroke: '#0a0806', seed: 220 });
    line(ctx, 862, 262, 874, 216, { lw: 4, stroke: '#0a0806', seed: 221 });
    line(ctx, 830, 236, 812, 222, { lw: 3, stroke: '#0a0806', seed: 222 });
    line(ctx, 870, 236, 888, 222, { lw: 3, stroke: '#0a0806', seed: 223 });
    ctx.restore();
    ell(ctx, 850, 585, 220, 26, { fill: PAL.blood, stroke: null, seed: 224, alpha: .55 });
  }
}

/* ============ 房间：书房 ============ */

export const BOOK_ORDER = ['red', 'gold', 'teal', 'crimson', 'brown']; // 初始摆放
export const BOOK_SOLVED = ['gold', 'teal', 'crimson'];               // 正确顺序：金 → 青 → 绯
const BOOK_COLS = { red: '#9e4a3c', gold: '#c9a227', teal: '#5d7a72', crimson: '#a8403a', brown: '#6d5236' };

export function drawStudy(ctx, t, F, peek) {
  wallpaper(ctx);
  // 书架
  if (!F.booksSolved) {
    poly(ctx, [[130, 560], [130, 200], [560, 200], [560, 560]], { fill: PAL.woodDark, stroke: INK, lw: 4, seed: 230 });
    poly(ctx, [[150, 220], [540, 220], [540, 380], [150, 380]], { fill: '#4c3620', stroke: null, seed: 231 });
    poly(ctx, [[150, 400], [540, 400], [540, 545], [150, 545]], { fill: '#4c3620', stroke: null, seed: 232 });
    // 上排装饰书
    for (let i = 0; i < 9; i++) {
      const bx = 165 + i * 41, bh = 120 + hash(i, 7) * 22;
      poly(ctx, [[bx, 370], [bx + 30, 370], [bx + 30, 370 - bh], [bx, 370 - bh]], { fill: ['#8a7a58', '#5d5142', '#7d6a58', '#6d5236'][i % 4], stroke: INK, lw: 2, seed: 240 + i, amp: 1 });
    }
    // 下排：五本可互动的书
    BOOK_ORDER.forEach((id, i) => {
      if (F.bookPulled?.includes(id)) return;
      const bx = 180 + i * 70;
      poly(ctx, [[bx, 536], [bx + 44, 536], [bx + 44, 412], [bx, 412]], { fill: BOOK_COLS[id], stroke: INK, lw: 2.5, seed: 260 + i, amp: 1.2 });
      line(ctx, bx + 8, 420, bx + 8, 528, { lw: 1.5, alpha: .4, seed: 270 + i });
    });
    // 暗格
    poly(ctx, [[190, 536], [410, 536], [410, 470], [190, 470]], { fill: '#241a10', stroke: INK, lw: 3, seed: 276 });
    if (F.springKey) {
      poly(ctx, [[250, 520], [350, 520], [344, 492], [256, 492]], { fill: '#241a10', stroke: null, seed: 277 });
    } else {
      // 发条钥匙躺在暗格里
      ell(ctx, 268, 506, 12, 12, { fill: null, stroke: PAL.brass, lw: 3.5, seed: 278, n: 14 });
      line(ctx, 278, 506, 330, 506, { lw: 3.5, stroke: PAL.brass, seed: 279 });
      line(ctx, 330, 506, 338, 498, { lw: 3, stroke: PAL.brass, seed: 280 });
      line(ctx, 330, 506, 338, 514, { lw: 3, stroke: PAL.brass, seed: 281 });
    }
  } else {
    // 倒塌前的书架（已解密：书按好了，暗格空了）——画整齐书架
    poly(ctx, [[130, 560], [130, 200], [560, 200], [560, 560]], { fill: PAL.woodDark, stroke: INK, lw: 4, seed: 230 });
    poly(ctx, [[150, 220], [540, 220], [540, 380], [150, 380]], { fill: '#4c3620', stroke: null, seed: 231 });
    poly(ctx, [[150, 400], [540, 400], [540, 545], [150, 545]], { fill: '#4c3620', stroke: null, seed: 232 });
    for (let i = 0; i < 14; i++) {
      const bx = 160 + i * 27, bh = 130 + hash(i, 8) * 24;
      poly(ctx, [[bx, 370], [bx + 22, 370], [bx + 22, 370 - bh], [bx, 370 - bh]], { fill: ['#8a7a58', '#5d5142', '#7d6a58', '#6d5236'][i % 4], stroke: INK, lw: 2, seed: 282 + i, amp: 1 });
    }
    ['gold', 'teal', 'crimson'].forEach((id, i) => {
      const bx = 200 + i * 70;
      poly(ctx, [[bx, 536], [bx + 44, 536], [bx + 44, 412], [bx, 412]], { fill: BOOK_COLS[id], stroke: INK, lw: 2.5, seed: 300 + i, amp: 1.2 });
    });
    poly(ctx, [[190, 536], [410, 536], [410, 470], [190, 470]], { fill: '#241a10', stroke: INK, lw: 3, seed: 276 });
  }
  // 画像（挂在书架上方）
  poly(ctx, [[290, 60], [410, 60], [410, 172], [290, 172]], { fill: '#d6c8a8', stroke: INK, lw: 4, seed: 306 });
  poly(ctx, [[300, 70], [400, 70], [400, 162], [300, 162]], { fill: '#b9a87c', stroke: null, seed: 307 });
  // 画像里是戴鹿角的先主
  ell(ctx, 350, 108, 20, 22, { fill: '#8a6f52', stroke: null, seed: 308 });
  poly(ctx, [[300, 160], [400, 160], [392, 128], [308, 128]], { fill: '#5d5142', stroke: null, seed: 309 });
  line(ctx, 338, 92, 328, 66, { lw: 3, seed: 310 });
  line(ctx, 362, 92, 372, 66, { lw: 3, seed: 311 });
  // 书桌 + 地球仪
  poly(ctx, [[820, 560], [1120, 560], [1110, 470], [830, 470]], { fill: PAL.wood, seed: 312, lw: 3.5 });
  line(ctx, 850, 470, 850, 560, { lw: 3.5, seed: 313 });
  line(ctx, 1090, 470, 1090, 560, { lw: 3.5, seed: 314 });
  // 摊开的书页
  poly(ctx, [[900, 462], [990, 462], [996, 448], [906, 448]], { fill: PAL.cream, seed: 315, lw: 2 });
  line(ctx, 948, 448, 948, 462, { lw: 1.5, alpha: .5, seed: 316 });
  // 地球仪
  ell(ctx, 1058, 400, 34, 34, { fill: '#7d9a8e', seed: 317, lw: 3, n: 24 });
  ctx.save();
  ctx.beginPath(); ctx.ellipse(1058, 400, 34, 34, 0, 0, 7); ctx.clip();
  const goff = (t * 8) % 90;
  poly(ctx, [[1020 + goff, 386], [1044 + goff, 372], [1066 + goff, 388], [1050 + goff, 400], [1028 + goff, 398]], { fill: '#c2b184', stroke: null, seed: 318, amp: 1 });
  poly(ctx, [[1030 + goff, 416], [1062 + goff, 412], [1074 + goff, 424], [1040 + goff, 428]], { fill: '#c2b184', stroke: null, seed: 319, amp: 1 });
  ctx.restore();
  ell(ctx, 1058, 400, 34, 34, { fill: null, stroke: INK, lw: 3, seed: 320, n: 24 });
  line(ctx, 1058, 366, 1058, 434, { lw: 2, alpha: .5, seed: 321 });
  poly(ctx, [[1042, 434], [1074, 434], [1058, 452]], { fill: PAL.brass, stroke: INK, lw: 2.5, seed: 322 });
  // 蜡烛
  ell(ctx, 880, 440, 7, 12, { fill: PAL.cream, seed: 323, lw: 2 });
  flame(ctx, 880, 428, 22, 7, t, 43);
// 兔小姐（窥探未来且书架未解时，她已不在）
if (!(peek && !F.booksSolved)) drawRabbit(ctx, 700, FLOOR + 55, 1, t);
  // 阿堵
  drawBoy(ctx, 480, FLOOR + 52, .92, t, { eyeFast: false });
  // 门（左）
  poly(ctx, [[0, 560], [0, 280], [96, 280], [96, 560]], { fill: '#6b4b30', stroke: INK, lw: 4, seed: 324 });
  ell(ctx, 84, 420, 7, 7, { fill: PAL.brass, seed: 325, n: 12, lw: 2 });
}

export function studyFuture(ctx, t, F) {
  if (!F.booksSolved) {
    // 书架倒塌 + 满地书
    ctx.save();
    ctx.translate(340, 420); ctx.rotate(.28); ctx.translate(-340, -420);
    poly(ctx, [[130, 560], [130, 200], [560, 200], [560, 560]], { fill: PAL.woodDark, stroke: INK, lw: 4, seed: 330 });
    poly(ctx, [[150, 220], [540, 220], [540, 380], [150, 380]], { fill: '#4c3620', stroke: null, seed: 331 });
    poly(ctx, [[150, 400], [540, 400], [540, 545], [150, 545]], { fill: '#4c3620', stroke: null, seed: 332 });
    ctx.restore();
    for (let i = 0; i < 7; i++) {
      const bx = 200 + i * 90 + hash(i, 11) * 30, by = 590 + hash(i, 12) * 40;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(hash(i, 13) * .8);
      poly(ctx, [[-22, -14], [22, -14], [22, 14], [-22, 14]], { fill: ['#9e4a3c', '#c9a227', '#5d7a72', '#6d5236'][i % 4], stroke: INK, lw: 2, seed: 340 + i, amp: 1 });
      ctx.restore();
    }
    // 兔小姐不见了，只剩羽毛掸子
    line(ctx, 700, 620, 720, 560, { lw: 3, seed: 350 });
    ell(ctx, 724, 548, 8, 15, { fill: '#d8ceba', stroke: null, seed: 351, alpha: .9 });
  }
}
