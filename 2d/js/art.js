/* art.js —— 手绘风绘图基元：确定性抖动轮廓 + 平涂色块
   风格参考：绣湖式插画（深色勾线、平涂水彩、微抖手绘线） */

export const INK = '#2f2620';          // 勾线墨色
export const PAL = {
  sky: '#b9c2c4', mountainFar: '#a7adae', mountainNear: '#8a8f90', mountainHi: '#c9cdd0',
  pine: '#4a524c', ground: '#d8d5c9', blood: '#9e2b25',
  wall: '#cfc5ab', wallStripe: '#c2b799', wainscot: '#6b5138', floor: '#8a6f52', floorDark: '#75593d',
  wood: '#7a5c40', woodDark: '#5d452e', cream: '#ece2ca', cloth: '#dccfb2',
  iron: '#4a4642', ironDark: '#35322e', brass: '#b98d3a', copper: '#a86a32',
  red: '#8e4a44', redDeep: '#743a36', teal: '#5d7a72', gold: '#c9a227',
  paper: '#f4ecd6', fog: '#c5c9c6',
};

/* 稳定哈希 → [-1,1]，保证每帧抖动一致（不闪动） */
export function hash(...ns) {
  let h = 2166136261;
  for (const n of ns) { h ^= (n | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); }
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

/* 抖动点序列 */
function jpts(pts, amp, seed) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    out.push([x + hash(seed, i * 2) * amp, y + hash(seed, i * 2 + 1) * amp]);
  }
  return out;
}

/* 手绘多边形：平涂填充 + 墨线勾边 */
export function poly(ctx, pts, opt = {}) {
  const { fill, stroke = INK, lw = 3, amp = 1.6, seed = 1, alpha = 1, close = true } = opt;
  const p = jpts(pts, amp, seed);
  ctx.save();
  if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.beginPath();
  p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  ctx.restore();
}

/* 手绘椭圆（圆用 rx==ry） */
export function ell(ctx, cx, cy, rx, ry, opt = {}) {
  const { n = 20, rot = 0, ...rest } = opt;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
    pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
  }
  poly(ctx, pts, { seed: opt.seed ?? 7, amp: opt.amp ?? Math.min(rx, ry) * 0.06 + 0.8, ...rest });
}

/* 手绘线段 */
export function line(ctx, x1, y1, x2, y2, opt = {}) {
  const { lw = 3, amp = 1.4, seed = 3, segs = 6, alpha = 1, stroke = INK } = opt;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  poly(ctx, pts, { stroke, lw, amp, seed, alpha, fill: null, close: false });
}

/* 圆角矩形路径点 */
export function rrectPts(x, y, w, h, r = 6) {
  const p = [];
  p.push([x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r]);
  p.push([x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]);
  return p;
}

/* 火苗（锯齿三角组，随时间摆动） */
export function flame(ctx, cx, baseY, h, w, t, seed = 5, alpha = 1) {
  const sway = Math.sin(t * 6 + seed) * w * 0.18;
  ctx.save();
  if (alpha < 1) ctx.globalAlpha *= alpha;
  poly(ctx, [
    [cx - w, baseY], [cx - w * 0.45, baseY - h * 0.45], [cx - w * 0.6, baseY - h * 0.2],
    [cx + sway, baseY - h], [cx + w * 0.5, baseY - h * 0.35], [cx + w * 0.7, baseY - h * 0.15], [cx + w, baseY],
  ], { fill: '#c96a2a', stroke: null, amp: 1.2, seed });
  poly(ctx, [
    [cx - w * 0.55, baseY], [cx + sway * 0.6, baseY - h * 0.62], [cx + w * 0.5, baseY],
  ], { fill: '#e8b23c', stroke: null, amp: 1, seed: seed + 1 });
  ctx.restore();
}

/* 纸纹噪点（离屏一次性生成） */
export function makeGrain(w, h, alpha = 14) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() * 2 - 1) * 60;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = alpha;
  }
  g.putImageData(img, 0, 0);
  return c;
}
