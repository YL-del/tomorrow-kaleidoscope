/* rooms.js —— 三章完整地图：现实 / 里世界双态
   约定：房间逻辑 1280×720（街道 2400×720），后墙 0~340，地面 340~690
   每个房间：draw(现实景) / otherDecor(里世界独有物) / walls 碰撞 / hotspots / monsters / spawn */

import { poly, ell, line, INK, PAL, hash, flame, rrectPts } from './art.js';
import { drawBoy, drawDeer, drawRabbit, drawCat, drawGoat, drawPig, drawKaleidoEye } from './chars.js';

export const FLOOR_TOP = 340, FLOOR_BOT = 690;

/* ---------- 通用景 helpers ---------- */
function shell(ctx, W, opt = {}) {
  const { wall = '#cfc5ab', stripe = '#c2b799', wain = '#6b5138', floor = '#8a6f52', floorDark = '#75593d', wainY = FLOOR_TOP, seed = 1 } = opt;
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, wainY);
  ctx.globalAlpha = .18; ctx.fillStyle = stripe;
  for (let x = 20; x < W; x += 90) ctx.fillRect(x, 0, 34, wainY);
  ctx.globalAlpha = 1;
  ctx.fillStyle = wain; ctx.fillRect(0, wainY - 30, W, 30);
  line(ctx, 0, wainY - 30, W, wainY - 30, { lw: 3, seed });
  line(ctx, 0, wainY, W, wainY, { lw: 3.4, seed: seed + 1 });
  ctx.fillStyle = floor; ctx.fillRect(0, wainY, W, 720 - wainY);
  // 地板横板 + 竖缝
  for (let y = wainY + 42, r = 0; y < 720; y += 46, r++) {
    line(ctx, 0, y, W, y, { lw: 2.2, seed: seed + r * 7, stroke: floorDark, alpha: .8 });
    for (let x = ((r * 137) % 210); x < W; x += 210) {
      line(ctx, x, y - 42, x, y, { lw: 1.8, seed: seed + r * 13 + x, stroke: floorDark, alpha: .55 });
    }
  }
}

function door(ctx, x, y, w, h, opt = {}) {
  const { fill = '#6e5138', frame = '#4a3626', open = false, seed = 5 } = opt;
  ctx.fillStyle = frame; ctx.fillRect(x - 8, y - h - 8, w + 16, h + 8);
  poly(ctx, rrectPts(x, y - h, w, h, 3), { fill, lw: 3, amp: 1.2, seed });
  if (open) { ctx.fillStyle = '#100c08'; ctx.fillRect(x + 4, y - h + 4, w - 8, h - 4); }
  else {
    poly(ctx, rrectPts(x + 10, y - h + 12, w - 20, h - 24, 2), { fill: null, stroke: '#4a3626', lw: 2, amp: .8, seed: seed + 1 });
    ell(ctx, x + w - 14, y - h * .48, 3.4, 3.4, { fill: '#c9a227', lw: 1.6, amp: .3, seed: seed + 2 });
  }
}

function windowView(ctx, x, y, w, h, t, opt = {}) {
  const { seed = 9, night = false } = opt;
  ctx.fillStyle = '#4a3626'; ctx.fillRect(x - 7, y - 7, w + 14, h + 14);
  ctx.fillStyle = night ? '#2c3234' : '#b9c2c4'; ctx.fillRect(x, y, w, h);
  // 远山
  poly(ctx, [[x, y + h * .62], [x + w * .3, y + h * .28], [x + w * .55, y + h * .6], [x + w, y + h * .34], [x + w, y + h], [x, y + h]], { fill: night ? '#23282a' : '#a7adae', stroke: null, amp: 1, seed });
  // 松树
  for (let i = 0; i < 4; i++) {
    const px = x + 14 + i * (w - 24) / 3.2;
    poly(ctx, [[px - 8, y + h - 8], [px, y + h - 34 - hash(seed, i) * 8], [px + 8, y + h - 8]], { fill: night ? '#1c2220' : '#4a524c', lw: 1.6, amp: .6, seed: seed + i });
  }
  if (night) { // 里世界窗：渗红
    ctx.globalAlpha = .25; ctx.fillStyle = '#9e2b25'; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  }
  line(ctx, x + w / 2, y, x + w / 2, y + h, { lw: 2.4, seed: seed + 3 });
  line(ctx, x, y + h / 2, x + w, y + h / 2, { lw: 2.4, seed: seed + 4 });
}

function furnitureShadow(ctx, x, y, w) {
  ctx.globalAlpha = .14; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x, y, w / 2, 9, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
}

/* ---------- 房间表 ---------- */
export const ROOMS = {};

/* ============ 第一章 ============ */

ROOMS.bedroom = {
  label: '二楼卧室', chapter: 1,
  walls: [[60, 380, 260, 110], [880, 360, 200, 90], [0, 0, 60, 720], [1220, 0, 60, 720], [1060, 0, 220, 360]],
  spawn: { x: 980, y: 560 },
  spawnFrom: { foyer: { x: 980, y: 560 } },
  hotspots: [
    { id: 'nightstand', x: 380, y: 470, r: 60, name: '床头柜', show: F => !F.matches,
      act(F, g) { F.matches = true; g.gainItem('火柴'); g.say(['床头柜抽屉里躺着一盒火柴——「万津火柴社·湖畔分销」。', '阿堵：火柴。……为什么我总觉得这盒子很重要？']); } },
    { id: 'nightstand2', x: 380, y: 470, r: 60, name: '床头柜', show: F => F.matches,
      act(F, g) { g.say(['抽屉已经空了。']); } },
    { id: 'stove', x: 950, y: 430, r: 70, name: '水壶与炉子', show: F => !F.keySt,
      act(F, g) {
        F.keySt = true; g.save(); g.gainItem('铜钥匙');
        g.say(['炉上的水壶还在咕嘟作响。垫着袖子端开壶——壶底下压着一把铜钥匙。', '获得了「铜钥匙」。阿堵：标签上刻着「书房」。']);
      } },
    { id: 'wardrobe', x: 730, y: 420, r: 70, name: '衣柜',
      act(F, g) { g.say(['衣柜里挂着一件不合身的大人外套，口袋里有一张烧掉一角的合照。']); } },
    { id: 'painting', x: 170, y: 330, r: 60, name: '墙上的画',
      act(F, g) { g.say(['画的是这栋宅子和湖。画的背面写着一行小字：「眼睛会替你记住，你不敢看的。」']); } },
    { id: 'tofoyer', x: 1140, y: 380, r: 80, name: '下楼', act(F, g) { g.gotoRoom('foyer'); } },
  ],
  otherDecor(ctx, t, F) {
    // 窗外立着一个影子
    ctx.save(); ctx.globalAlpha = .8;
    poly(ctx, [[128, 210], [146, 130], [158, 210]], { fill: '#1a1210', stroke: null, amp: 1, seed: 3 });
    ell(ctx, 143, 122, 10, 12, { fill: '#1a1210', stroke: null, amp: .8, seed: 4 });
    ctx.restore();
    poly(ctx, [[520, 330], [524, 290], [530, 330]], { fill: '#7e1f1a', stroke: null, amp: .6, seed: 5, alpha: .85 });
  },
  monsters: F => [],
  draw(ctx, t, F) {
    shell(ctx, 1280, { seed: 11 });
    // 窗
    windowView(ctx, 110, 120, 220, 150, t, { seed: 12 });
    // 床
    furnitureShadow(ctx, 190, 500, 280);
    poly(ctx, [[70, 430], [300, 430], [320, 500], [50, 500]], { fill: '#7a5c40', lw: 3, amp: 1.2, seed: 13 });
    poly(ctx, [[80, 380], [300, 380], [300, 432], [80, 432]], { fill: '#d8cdb4', lw: 2.6, amp: 1, seed: 14 });
    poly(ctx, [[95, 388], [175, 388], [175, 428], [95, 428]], { fill: '#ece2ca', lw: 2, amp: .8, seed: 15 });
    // 床头柜
    poly(ctx, [[350, 440], [415, 440], [420, 500], [345, 500]], { fill: '#6e5138', lw: 2.6, amp: 1, seed: 16 });
    line(ctx, 352, 468, 416, 468, { lw: 2, seed: 17 });
    // 衣柜
    furnitureShadow(ctx, 730, 480, 170);
    poly(ctx, [[660, 200], [800, 200], [806, 470], [654, 470]], { fill: '#6e5138', lw: 3, amp: 1.4, seed: 18 });
    line(ctx, 730, 205, 730, 465, { lw: 2.4, seed: 19 });
    ell(ctx, 720, 340, 3, 3, { fill: '#c9a227', lw: 1.4, seed: 20 });
    ell(ctx, 740, 340, 3, 3, { fill: '#c9a227', lw: 1.4, seed: 21 });
    // 墙上画
    ctx.fillStyle = '#4a3626'; ctx.fillRect(120, 240, 100, 78);
    ctx.fillStyle = '#b9c2c4'; ctx.fillRect(126, 246, 88, 66);
    poly(ctx, [[126, 300], [160, 264], [190, 296], [214, 272], [214, 312], [126, 312]], { fill: '#8a8f90', stroke: null, amp: .8, seed: 22 });
    // 炉子与水壶
    furnitureShadow(ctx, 950, 470, 160);
    poly(ctx, [[880, 320], [1020, 320], [1030, 460], [870, 460]], { fill: '#4a4642', lw: 3, amp: 1.2, seed: 23 });
    poly(ctx, [[900, 300], [1000, 300], [1006, 322], [894, 322]], { fill: '#35322e', lw: 2.4, amp: .8, seed: 24 });
    ell(ctx, 950, 292, 26, 14, { fill: '#7a6a58', lw: 2.4, amp: .8, seed: 25 });   // 壶
    poly(ctx, [[940, 282], [936, 262], [958, 266], [952, 282]], { fill: '#7a6a58', lw: 2, amp: .6, seed: 26 });
    if (!F.keySt) { // 蒸汽
      ctx.globalAlpha = .5;
      for (let i = 0; i < 3; i++) { const yy = 250 - ((t * 30 + i * 30) % 60); ell(ctx, 945 + i * 6, yy, 5, 9, { fill: '#fff', stroke: null, amp: .6, seed: 27 + i }); }
      ctx.globalAlpha = 1;
    }
    // 门（下楼）
    door(ctx, 1080, 350, 90, 190, { seed: 28 });
    // 地毯
    poly(ctx, rrectPts(430, 520, 380, 130, 12), { fill: '#8e4a44', lw: 2.6, amp: 1.4, seed: 29, alpha: .9 });
  },
};

ROOMS.foyer = {
  label: '宅邸门厅', chapter: 1,
  walls: [[520, 380, 220, 40], [0, 0, 40, 720], [1240, 0, 40, 720], [80, 300, 120, 60], [1100, 300, 140, 60], [840, 350, 140, 60]],
  spawn: { x: 640, y: 600 },
  spawnFrom: { bedroom: { x: 200, y: 520 }, study: { x: 1080, y: 520 }, cellar: { x: 640, y: 620 } },
  hotspots: [
    { id: 'deer', x: 420, y: 560, r: 80, name: '鹿先生', show: F => true,
      act(F, g) {
        if (!F.deerTalk1) { F.deerTalk1 = true; g.save(); g.say([
          '鹿先生：客人醒啦。湖上的雾十年没散过，这宅子已经很久没有活人的脚步声了。',
          '鹿先生：大门的门把早就锈死在里世界里了——普通眼睛看不见它。',
          '阿堵：里世界？',
          '鹿先生：用您那只眼睛看。按住 F，去看这个世界背后的事。但别看太久，那只眼睛会累。',
        ]); }
        else if (!F.handleOn) g.say(['鹿先生：门把在里世界的地窖工作台上。地窖钥匙在书房——从先主的眼睛里找答案。']);
        else g.say(['鹿先生：装好门把就出发吧。湖对岸的小镇在等您。……昨天还没有建成的小镇。']);
      } },
    { id: 'bigdoor', x: 640, y: 420, r: 90, name: '宅邸大门',
      act(F, g) {
        if (F.handleOn) { g.startChapter2(); }
        else if (F.gotHandle) { F.handleOn = true; g.consumeItem('大门门把'); g.save(); g.say(['咔——门把嵌进了锁孔，转动时整扇门都在叹气。']); }
        else g.say(['大门纹丝不动。锁孔的位置空着一个圆洞——门把被人拆走了。']);
      } },
    { id: 'tobedroom', x: 140, y: 400, r: 70, name: '回卧室', act(F, g) { g.gotoRoom('bedroom'); } },
    { id: 'tostudy', x: 1150, y: 400, r: 70, name: '书房',
      act(F, g) {
        if (F.keySt || F.studyOpen) { F.studyOpen = true; g.gotoRoom('study'); }
        else g.say(['书房门锁着，锁孔泛着铜色。二楼的水壶下面……好像压着什么。']);
      } },
    { id: 'tocellar', x: 120, y: 500, r: 70, name: '地窖暗门',
      act(F, g) {
        if (F.keyCellar) g.gotoRoom('cellar');
        else g.say(['地板上一扇矮小的暗门，挂着一把粗重的铁锁。钥匙应该在哪里等着被找到。']);
      } },
    { id: 'clock', x: 900, y: 400, r: 70, name: '落地钟',
      act(F, g) { g.say(['老式落地钟。指针停在 11:44。钟摆上有一圈烧灼的痕迹。', '阿堵：11 点 44 分……这个数字为什么这么耳熟？']); } },
    { id: 'coat', x: 180, y: 420, r: 60, name: '衣帽架', act(F, g) { g.say(['挂着一件小孩子的红色雨衣。不是你的尺码——但袖口绣着「堵」字。']); } },
  ],
  otherDecor(ctx, t, F) {
    // 门缝渗出红光
    ctx.save(); ctx.globalAlpha = .5 + Math.sin(t * 2) * .15;
    poly(ctx, [[560, 170], [568, 170], [568, 340], [560, 340]], { fill: '#9e2b25', stroke: null, amp: .5, seed: 31 });
    poly(ctx, [[712, 170], [720, 170], [720, 340], [712, 340]], { fill: '#9e2b25', stroke: null, amp: .5, seed: 32 });
    ctx.restore();
  },
  monsters: F => [],
  draw(ctx, t, F) {
    shell(ctx, 1280, { wall: '#c6b894', seed: 41 });
    // 大门（双开）
    ctx.fillStyle = '#4a3626'; ctx.fillRect(540, 140, 200, 210);
    poly(ctx, rrectPts(550, 150, 88, 190, 3), { fill: '#5d452e', lw: 3, amp: 1.2, seed: 42 });
    poly(ctx, rrectPts(642, 150, 88, 190, 3), { fill: '#5d452e', lw: 3, amp: 1.2, seed: 43 });
    // 门把洞 / 已装门把
    if (F.handleOn) ell(ctx, 640, 250, 6, 6, { fill: '#c9a227', lw: 2, amp: .3, seed: 44 });
    else { ell(ctx, 640, 250, 7, 7, { fill: '#171310', lw: 2.4, amp: .3, seed: 45 }); }
    // 彩窗
    poly(ctx, [[560, 60], [720, 60], [720, 130], [560, 130]], { fill: '#8a6f52', lw: 2.6, amp: 1, seed: 46 });
    for (let i = 0; i < 4; i++) poly(ctx, [[566 + i * 40, 66], [598 + i * 40, 66], [598 + i * 40, 124], [566 + i * 40, 124]], { fill: ['#8e4a44', '#5d7a72', '#c9a227', '#8e4a44'][i], stroke: INK, lw: 1.8, amp: .8, seed: 47 + i, alpha: .85 });
    // 侧门
    door(ctx, 90, 350, 80, 180, { seed: 52 });
    door(ctx, 1110, 350, 80, 180, { seed: 53 });
    // 落地钟
    furnitureShadow(ctx, 900, 440, 120);
    poly(ctx, [[850, 170], [950, 170], [960, 440], [840, 440]], { fill: '#5d452e', lw: 3, amp: 1.2, seed: 54 });
    poly(ctx, [[840, 140], [960, 140], [950, 172], [850, 172]], { fill: '#4a3626', lw: 2.6, amp: .8, seed: 55 });
    ell(ctx, 900, 240, 34, 34, { fill: '#ece2ca', lw: 2.6, amp: .8, seed: 56 });
    line(ctx, 900, 240, 900 + Math.cos(2.05) * 24, 240 - Math.sin(-2.05) * 0 + Math.sin(2.05) * 24 * 0 + 0, { lw: 2.4, seed: 57 });
    line(ctx, 900, 240, 912, 224, { lw: 2.4, seed: 58 });
    line(ctx, 900, 240, 886, 252, { lw: 2, seed: 59 });
    // 衣帽架
    line(ctx, 180, 250, 180, 440, { lw: 4, seed: 60 });
    line(ctx, 156, 258, 204, 252, { lw: 3, seed: 61 });
    poly(ctx, [[160, 262], [200, 256], [204, 330], [158, 334]], { fill: '#a8403a', lw: 2.2, amp: .8, seed: 62 });
    // 红地毯
    poly(ctx, rrectPts(480, 430, 320, 220, 14), { fill: '#743a36', lw: 2.6, amp: 1.6, seed: 63, alpha: .92 });
    // 地窖暗门（地板左下）
    poly(ctx, [[70, 470], [170, 470], [178, 540], [62, 540]], { fill: '#4a3626', lw: 3, amp: 1.2, seed: 64 });
    line(ctx, 70, 505, 170, 505, { lw: 2.2, seed: 65, stroke: '#2e2115' });
    ell(ctx, 150, 522, 7, 5, { fill: '#c9a227', lw: 2, amp: .3, seed: 66 });
    // 鹿先生
    drawDeer(ctx, 420, 580, 1.05, t);
  },
};

ROOMS.study = {
  label: '先主书房', chapter: 1,
  walls: [[180, 400, 320, 80], [0, 0, 40, 720], [1240, 0, 40, 720], [760, 380, 240, 70]],
  spawn: { x: 200, y: 540 },
  spawnFrom: { foyer: { x: 140, y: 540 } },
  hotspots: [
    { id: 'b-gold', x: 250, y: 470, r: 46, name: '金脊书', show: F => !F.booksSolved,
      act(F, g) { g.pullBook('gold'); } },
    { id: 'b-teal', x: 330, y: 470, r: 46, name: '青脊书', show: F => !F.booksSolved,
      act(F, g) { g.pullBook('teal'); } },
    { id: 'b-crimson', x: 410, y: 470, r: 46, name: '绯红书', show: F => !F.booksSolved,
      act(F, g) { g.pullBook('crimson'); } },
    { id: 'portrait', x: 650, y: 400, r: 70, name: '先主肖像',
      act(F, g) {
        if (!F.sawWriting) g.say(['肖像上的老人闭着眼。画框下刻着：「颜色即顺序——从先主的眼睛里看。」', '阿堵：先主的眼睛……我好像，也有那样的眼睛。']);
        else g.say(['肖像上的老人闭着眼。你在里世界已经读过他的遗言。']);
      } },
    { id: 'writing', x: 650, y: 350, r: 70, name: '墙上渗出的字', world: 'other', show: F => !F.sawWriting,
      act(F, g) { F.sawWriting = true; g.save(); g.say(['墙面像皮肤一样渗出暗红的字迹——', '「金，青，绯。按此序抽之，勿念。」', '字迹随即淡去。']); } },
    { id: 'writing2', x: 650, y: 350, r: 70, name: '墙上的旧痕', world: 'other', show: F => F.sawWriting,
      act(F, g) { g.say(['血字已经淡去，只留下墙面上一道浅浅的焦痕。']); } },
    { id: 'desk', x: 880, y: 450, r: 80, name: '书桌',
      act(F, g) { g.say(['桌上一座黄铜地球仪，大陆的形状和任何地图都对不上。抽屉里全是没寄出去的信，收信人一栏空着。']); } },
    { id: 'rabbit', x: 1060, y: 580, r: 80, name: '兔小姐',
      act(F, g) {
        if (!F.keyCellar) g.say(['兔小姐：书房的规矩是先主定的——「颜色即顺序」。可是先生，您要是看不出来，书架一千年也不会开。', '兔小姐：听说……有些字要用另一双眼睛才读得到。']);
        else g.say(['兔小姐：地窖的灯早就坏了，先生带上火柴。里世界的东西，也带着您的火光吗？']);
      } },
    { id: 'tofoyer', x: 100, y: 420, r: 70, name: '回门厅', act(F, g) { g.gotoRoom('foyer'); } },
  ],
  otherDecor(ctx, t, F) {
    // 血字
    if (!F.sawWriting) {
      ctx.save(); ctx.globalAlpha = .75 + Math.sin(t * 1.6) * .15;
      ctx.fillStyle = '#7e1f1a'; ctx.font = 'bold 44px "Kaiti SC", "KaiTi", "STKaiti", serif';
      ctx.textAlign = 'center';
      ctx.fillText('金 · 青 · 绯', 650, 305);
      ctx.restore();
    }
    // 书架后在里世界敞开的暗格
    poly(ctx, [[210, 400], [470, 400], [470, 470], [210, 470]], { fill: '#170f0a', stroke: null, amp: 1, seed: 61, alpha: .9 });
  },
  monsters: F => [],
  draw(ctx, t, F) {
    shell(ctx, 1280, { wall: '#c2b795', seed: 62 });
    // 书架
    furnitureShadow(ctx, 340, 500, 340);
    poly(ctx, [[180, 180], [500, 180], [506, 470], [174, 470]], { fill: '#5d452e', lw: 3.4, amp: 1.4, seed: 63 });
    if (!F.booksSolved) {
      const cols = { gold: '#c9a227', teal: '#5d7a72', crimson: '#a8403a', brown: '#7a5c40' };
      const order = ['gold', 'teal', 'crimson', 'brown'];
      const xs = [205, 285, 365, 445];
      order.forEach((k, i) => {
        poly(ctx, [[xs[i], 220], [xs[i] + 62, 220], [xs[i] + 62, 380], [xs[i], 380]], { fill: cols[k], lw: 2.6, amp: 1, seed: 64 + i });
        line(ctx, xs[i] + 14, 240, xs[i] + 14, 360, { lw: 1.6, seed: 68 + i, stroke: 'rgba(0,0,0,.3)' });
        line(ctx, xs[i] + 46, 240, xs[i] + 46, 360, { lw: 1.6, seed: 72 + i, stroke: 'rgba(0,0,0,.3)' });
      });
      ctx.fillStyle = 'rgba(47,38,32,.55)'; ctx.fillRect(205, 300, 300, 78); // 暗格阴影横板
    } else {
      poly(ctx, [[210, 220], [470, 220], [470, 470], [210, 470]], { fill: '#2a2018', lw: 2.6, amp: 1, seed: 76 });
      if (F.keyCellar) ell(ctx, 340, 440, 8, 6, { fill: '#c9a227', lw: 1.6, amp: .4, seed: 77, alpha: .8 });
    }
    // 肖像
    ctx.fillStyle = '#4a3626'; ctx.fillRect(580, 170, 140, 180);
    ctx.fillStyle = '#d8cdb4'; ctx.fillRect(590, 180, 120, 160);
    ell(ctx, 650, 240, 26, 30, { fill: '#e8d9bd', lw: 2.2, amp: .8, seed: 78 });
    poly(ctx, [[616, 236], [634, 224], [636, 238]], { fill: '#23262e', stroke: null, amp: .5, seed: 79 });
    poly(ctx, [[664, 236], [682, 224], [684, 238]], { fill: '#23262e', stroke: null, amp: .5, seed: 80 });
    poly(ctx, [[610, 300], [690, 300], [684, 336], [616, 336]], { fill: '#3a3a42', stroke: null, amp: .8, seed: 81 });
    line(ctx, 590, 300, 710, 300, { lw: 2, seed: 82 });
    // 书桌 + 地球仪
    furnitureShadow(ctx, 880, 490, 240);
    poly(ctx, [[760, 400], [1000, 400], [1010, 490], [750, 490]], { fill: '#6e5138', lw: 3, amp: 1.2, seed: 83 });
    ell(ctx, 950, 380, 30, 30, { fill: '#5d7a72', lw: 2.6, amp: .9, seed: 84 });
    const ga = t * .35;
    poly(ctx, [[950 + Math.cos(ga) * 16 - 8, 366], [950 + Math.cos(ga + 2) * 16, 380], [950 + Math.cos(ga + 4) * 16 + 6, 394]], { fill: '#c9b98a', stroke: null, amp: .6, seed: 85 });
    ell(ctx, 800, 380, 8, 14, { fill: '#ece2ca', lw: 2, amp: .5, seed: 86 });
    // 门
    door(ctx, 60, 370, 84, 190, { seed: 87 });
    // 地毯
    poly(ctx, rrectPts(470, 520, 340, 140, 12), { fill: '#5d7a72', lw: 2.4, amp: 1.4, seed: 88, alpha: .85 });
    // 兔小姐
    drawRabbit(ctx, 1060, 600, 1, t);
  },
};

ROOMS.cellar = {
  label: '地窖', chapter: 1,
  walls: [[0, 0, 40, 720], [1240, 0, 40, 720], [420, 400, 240, 80], [700, 420, 220, 80]],
  spawn: { x: 640, y: 620 },
  spawnFrom: { foyer: { x: 640, y: 620 } },
  dark: true,
  hotspots: [
    { id: 'matchbox', x: 180, y: 470, r: 60, name: '墙上的火柴盒', show: F => !F.lampLit,
      act(F, g) { F.lampLit = true; g.save(); g.say(['划亮一根火柴，点起墙上的油灯。豆大的光晕摇了摇，站稳了。']); } },
    { id: 'workbench', x: 800, y: 500, r: 80, name: '工作台', world: 'other', show: F => !F.gotHandle,
      act(F, g) { F.gotHandle = true; g.save(); g.gainItem('大门门把'); g.say(['里世界的工作台上，一扇黄铜门把静静躺在焦痕中央——现实的眼睛绝对看不见它。', '获得了「大门门把」。']); } },
    { id: 'workbench2', x: 800, y: 500, r: 80, name: '工作台', world: 'other', show: F => F.gotHandle,
      act(F, g) { g.say(['工作台上的焦痕摆成了一个圆，像有人在这里坐了很多年。']); } },
    { id: 'shelf', x: 500, y: 470, r: 70, name: '木架', world: 'any',
      act(F, g) { if (!F.lampLit) g.say(['太黑了，只能摸到一层灰。']); else g.say(['木架上摆着一排空罐头，标签全都朝墙。第 7 个罐子里装着一枚乳牙。']); } },
    { id: 'burnt', x: 1050, y: 500, r: 70, name: '烧焦的箱子',
      act(F, g) { if (!F.lampLit) g.say(['黑暗里只有一个更黑的轮廓。']); else g.say(['箱子里全是烧剩的相册。唯一完好的一页：一家人站在湖边，每个人的眼睛都被剪掉了。']); } },
    { id: 'up', x: 640, y: 640, r: 70, name: '回门厅', act(F, g) { g.gotoRoom('foyer'); } },
  ],
  otherDecor(ctx, t, F) {
    // 工作台上的门把（里世界独有）
    if (!F.gotHandle) {
      ctx.save(); ctx.globalAlpha = .85 + Math.sin(t * 2.4) * .15;
      ctx.translate(790, 468);
      poly(ctx, [[0, 0], [30, -8], [34, 2], [4, 10]], { fill: '#c9a227', lw: 2.4, amp: .5, seed: 91 });
      ell(ctx, 36, -3, 8, 8, { fill: '#c9a227', lw: 2.4, amp: .5, seed: 92 });
      ctx.restore();
    }
    // 地面焦痕
    ctx.save(); ctx.globalAlpha = .5;
    ell(ctx, 790, 520, 130, 40, { fill: '#3a1c14', stroke: null, amp: 2, seed: 93 });
    ctx.restore();
  },
  monsters: F => F.gotHandle ? [] : [{ type: 'nurse', x: 900, y: 560, seed: 1, speed: 46 }],
  draw(ctx, t, F) {
    shell(ctx, 1280, { wall: '#8a8172', stripe: '#7e7566', wain: '#54432e', floor: '#6e5a42', floorDark: '#5c4a36', seed: 94 });
    // 石墙肌理
    ctx.globalAlpha = .25;
    for (let y = 40; y < 300; y += 64) for (let x = ((y / 64) % 2) * 70; x < 1280; x += 140) { ctx.strokeStyle = '#6e655a'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 130, 56); }
    ctx.globalAlpha = 1;
    // 油灯
    if (F.lampLit) { ell(ctx, 180, 380, 10, 12, { fill: '#c9a227', lw: 2.2, amp: .5, seed: 95 }); flame(ctx, 180, 372, 26, 9, t, 5); }
    else ell(ctx, 180, 380, 10, 12, { fill: '#7a7264', lw: 2.2, amp: .5, seed: 95 });
    // 木架
    furnitureShadow(ctx, 500, 480, 220);
    poly(ctx, [[400, 300], [600, 300], [606, 470], [394, 470]], { fill: '#54432e', lw: 3, amp: 1.2, seed: 96 });
    for (let i = 0; i < 3; i++) line(ctx, 405, 340 + i * 42, 595, 340 + i * 42, { lw: 2.2, seed: 97 + i });
    for (let i = 0; i < 5; i++) ell(ctx, 430 + i * 34, 388, 9, 11, { fill: '#8a8172', lw: 1.8, amp: .5, seed: 101 + i });
    // 工作台（现实里空无一物）
    furnitureShadow(ctx, 800, 520, 220);
    poly(ctx, [[700, 430], [900, 430], [910, 520], [690, 520]], { fill: '#6e5a42', lw: 3, amp: 1.2, seed: 106 });
    // 烧焦的箱子
    poly(ctx, [[990, 440], [1120, 440], [1128, 520], [982, 520]], { fill: '#3a2f24', lw: 3, amp: 1.2, seed: 107 });
    line(ctx, 990, 468, 1120, 468, { lw: 2, seed: 108, stroke: '#241c14' });
    // 楼梯口
    poly(ctx, [[590, 560], [690, 560], [700, 700], [580, 700]], { fill: '#241c14', lw: 3, amp: 1.2, seed: 109 });
    for (let i = 0; i < 4; i++) line(ctx, 592 + i * 2, 580 + i * 30, 688 - i * 2, 580 + i * 30, { lw: 2, seed: 110 + i, stroke: '#4a3c2c' });
  },
};

/* ============ 第二章 ============ */

ROOMS.street = {
  label: '雾湖镇 · 长街', chapter: 2, W: 2400,
  walls: [
    [0, 0, 2400, 380],            // 后墙整排（门是画在墙上、交互点在门前地面）
    [0, 0, 40, 720], [2360, 0, 40, 720],
    [380, 400, 500, 60], [980, 410, 180, 70], [1780, 400, 160, 60], [2100, 410, 180, 70],
  ],
  spawn: { x: 300, y: 560 },
  spawnFrom: { foyer: { x: 300, y: 560 }, shop: { x: 660, y: 540 }, church: { x: 1540, y: 540 }, clinic: { x: 2100, y: 540 } },
  hotspots: [
    { id: 'shopdoor', x: 640, y: 440, r: 80, name: '杂货店',
      act(F, g) { g.gotoRoom('shop'); } },
    { id: 'churchdoor', x: 1540, y: 440, r: 80, name: '教堂',
      act(F, g) { g.gotoRoom('church'); } },
    { id: 'clinicdoor', x: 2140, y: 440, r: 80, name: '旧诊所',
      act(F, g) { g.gotoRoom('clinic'); } },
    { id: 'pig', x: 1150, y: 580, r: 80, name: '猪大叔',
      act(F, g) {
        if (!F.pigTalk) { F.pigTalk = true; g.save(); g.say([
          '猪大叔：外乡人？从湖那边宅子里来的？……啧，那宅子十年前就烧没了，你不知道吗。',
          '猪大叔：雾把整个镇子糊住了，出不去。老话说，教堂的钟一响，雾就得让路。',
          '猪大叔：神父的蜡烛铺子里有货——哦不，现在是猫掌柜了。带着礼去，猫认东西不认人。'
        ]); }
        else if (!F.bellRung) g.say(['猪大叔：钟不响，雾不散。猫掌柜、神父、还有诊所……那地方，晚上别用那种眼睛看。']);
        else g.say(['猪大叔：雾散了……湖心那座灯塔居然一直都在。去吧，外乡人，把信写完。']);
      } },
    { id: 'bridge', x: 2320, y: 520, r: 80, name: '湖心栈桥',
      act(F, g) {
        if (F.bellRung) g.startChapter3();
        else g.say(['浓雾在栈桥前堆成一堵墙，伸手进去就像伸进冷水。先让钟响起来。']);
      } },
    { id: 'lake', x: 120, y: 600, r: 80, name: '湖边',
      act(F, g) { g.say(['湖水漆黑平缓。水面倒映的镇子……比岸上的镇子多出好几栋房子。']); } },
  ],
  otherDecor(ctx, t, F) {
    // 里世界长街：倾斜的电线杆与影
    for (let i = 0; i < 6; i++) {
      const x = 260 + i * 380;
      ctx.save(); ctx.translate(x, 0); ctx.rotate(hash(i, 3) * .1);
      line(ctx, 0, 120, 0, 340, { lw: 4, seed: 121 + i, stroke: '#1a1410' });
      line(ctx, -30, 140, 34, 132, { lw: 3, seed: 125 + i, stroke: '#1a1410' });
      ctx.restore();
    }
    // 门后的眼睛
    ctx.save(); ctx.globalAlpha = .5 + Math.sin(t * 2.2) * .2;
    ell(ctx, 660, 250, 5, 6, { fill: '#e8e2d2', stroke: null, amp: .3, seed: 131 });
    ell(ctx, 1548, 240, 5, 6, { fill: '#e8e2d2', stroke: null, amp: .3, seed: 132 });
    ctx.restore();
  },
  monsters: F => [{ type: 'lurker', x: 1300, y: 560, seed: 2, speed: 40, range: 330 }],
  draw(ctx, t, F) {
    // 雾街：更冷的壳
    shell(ctx, 2400, { wall: '#b3b6ad', stripe: '#a6a99f', wain: '#5a4c3a', floor: '#7d7466', floorDark: '#6b6255', seed: 133 });
    // 三栋房子立面
    const houses = [
      { x: 380, w: 520, c: '#7a6a58', sign: '万 津 杂 货', doorX: 600, seed: 134 },
      { x: 1320, w: 460, c: '#6e6a76', sign: '湖 畔 礼 拜 堂', doorX: 1490, seed: 140, church: true },
      { x: 1960, w: 380, c: '#7d7466', sign: '旧 诊 所', doorX: 2080, seed: 146 },
    ];
    houses.forEach(h => {
      poly(ctx, [[h.x, 340], [h.x + h.w, 340], [h.x + h.w - 30, 160], [h.x + 30, 160]], { fill: h.c, lw: 3, amp: 1.4, seed: h.seed });
      // 屋顶
      poly(ctx, [[h.x + 10, 160], [h.x + h.w - 10, 160], [h.x + h.w / 2 + 40, 90], [h.x + h.w / 2 - 40, 90]], { fill: '#4a4038', lw: 3, amp: 1.2, seed: h.seed + 1 });
      // 招牌
      ctx.fillStyle = '#efe6cf'; ctx.fillRect(h.x + h.w / 2 - 110, 180, 220, 44);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(h.x + h.w / 2 - 110, 180, 220, 44);
      ctx.fillStyle = '#2f2620'; ctx.font = 'bold 26px "Kaiti SC","KaiTi",serif'; ctx.textAlign = 'center';
      ctx.fillText(h.sign, h.x + h.w / 2, 212);
      // 门
      door(ctx, h.doorX, 340, 84, 170, { seed: h.seed + 2, open: false });
      // 窗
      for (let i = 0; i < 2; i++) {
        const wx = h.x + 60 + i * (h.w - 160);
        if (Math.abs(wx - h.doorX) > 90) {
          ctx.fillStyle = '#3a3c38'; ctx.fillRect(wx, 240, 66, 60);
          ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(wx, 240, 66, 60);
          line(ctx, wx + 33, 240, wx + 33, 300, { lw: 1.6, seed: h.seed + 3 + i });
        }
      }
      if (h.church) { // 小尖塔十字
        line(ctx, h.x + h.w / 2, 90, h.x + h.w / 2, 52, { lw: 4, seed: h.seed + 5, stroke: '#3a3c38' });
        line(ctx, h.x + h.w / 2 - 12, 62, h.x + h.w / 2 + 12, 62, { lw: 4, seed: h.seed + 6, stroke: '#3a3c38' });
      }
    });
    // 铺面小物
    for (let i = 0; i < 8; i++) { const x = 200 + i * 290 + hash(i, 8) * 60; ell(ctx, x, 430 + hash(i, 9) * 200, 14, 8, { fill: '#5c5448', lw: 1.6, amp: .6, seed: 150 + i, alpha: .8 }); }
    // 猪大叔
    drawPig(ctx, 1150, 600, 1.02, t);
    // 栈桥（被雾锁着 / 雾散后露出）
    if (F.bellRung) {
      poly(ctx, [[2200, 470], [2400, 430], [2400, 700], [2200, 700]], { fill: '#5d4a34', lw: 3, amp: 1.2, seed: 160 });
      for (let i = 0; i < 5; i++) line(ctx, 2210 + i * 45, 480 - i * 8, 2210 + i * 45, 700, { lw: 2.4, seed: 161 + i, stroke: '#4a3a28' });
    }
  },
};

ROOMS.shop = {
  label: '万津杂货', chapter: 2,
  walls: [[0, 0, 40, 720], [1240, 0, 40, 720], [180, 400, 220, 90], [420, 410, 200, 70], [820, 420, 220, 60]],
  spawn: { x: 1050, y: 560 },
  spawnFrom: { street: { x: 1050, y: 560 } },
  hotspots: [
    { id: 'cat', x: 640, y: 560, r: 90, name: '猫掌柜',
      act(F, g) {
        if (F.traded) g.say(['猫掌柜：蜡烛拿好了？教堂的烛台吃油吃得很。——喵。']);
        else if (g.hasItem('银怀表')) {
          F.traded = true; g.consumeItem('银怀表'); g.gainItem('蜡烛'); g.save();
          g.say(['猫掌柜的耳朵一抖：银怀表！好东西……先主生前当掉的那块！', '猫掌柜从柜台下摸出一支粗蜡烛：教堂的烛台只认这种老蜡。——成交，喵。', '获得了「蜡烛」。']);
        } else g.say(['猫掌柜眯着金眼睛：想换老蜡烛？拿有分量的旧东西来换。越旧越好，越——舍不得越好。']);
      } },
    { id: 'shelfs', x: 260, y: 470, r: 80, name: '货架',
      act(F, g) { g.say(['货架上全是同一牌子的火柴、盐和蜡烛。价签上的日期都停在十年前。']); } },
    { id: 'counter', x: 500, y: 480, r: 70, name: '柜台',
      act(F, g) { g.say(['玻璃柜台里躺着一枚黄铜门铃、半副老花镜，和一杆没有秤砣的秤。']); } },
    { id: 'out', x: 1150, y: 400, r: 70, name: '回长街', act(F, g) { g.gotoRoom('street'); } },
  ],
  otherDecor(ctx, t, F) {
    ctx.save(); ctx.globalAlpha = .7;
    poly(ctx, [[180, 340], [210, 340], [205, 400], [185, 400]], { fill: '#1a1210', stroke: null, amp: .8, seed: 170 });
    ctx.restore();
  },
  monsters: F => [],
  draw(ctx, t, F) {
    shell(ctx, 1280, { wall: '#c8bfa8', seed: 171 });
    // 货架
    furnitureShadow(ctx, 260, 500, 220);
    poly(ctx, [[170, 240], [350, 240], [356, 470], [164, 470]], { fill: '#5d452e', lw: 3, amp: 1.2, seed: 172 });
    for (let i = 0; i < 3; i++) {
      line(ctx, 176, 300 + i * 50, 344, 300 + i * 50, { lw: 2.2, seed: 173 + i });
      for (let j = 0; j < 4; j++) poly(ctx, [[190 + j * 40, 262 + i * 50], [214 + j * 40, 262 + i * 50], [214 + j * 40, 298 + i * 50], [190 + j * 40, 298 + i * 50]], { fill: ['#8e4a44', '#5d7a72', '#c9a227', '#a8403a'][((i + j) % 4)], lw: 1.6, amp: .5, seed: 176 + i * 4 + j });
    }
    // 柜台
    furnitureShadow(ctx, 500, 490, 220);
    poly(ctx, [[400, 420], [600, 420], [610, 490], [390, 490]], { fill: '#6e5138', lw: 3, amp: 1.2, seed: 181 });
    poly(ctx, [[430, 430], [570, 430], [574, 470], [426, 470]], { fill: '#8a8f90', lw: 2, amp: .8, seed: 182, alpha: .7 });
    // 侧货架
    poly(ctx, [[830, 300], [1010, 300], [1016, 470], [824, 470]], { fill: '#5d452e', lw: 3, amp: 1.2, seed: 183 });
    for (let i = 0; i < 3; i++) line(ctx, 836, 350 + i * 40, 1004, 350 + i * 40, { lw: 2, seed: 184 + i });
    // 猫掌柜
    drawCat(ctx, 640, 580, 1.02, t);
    // 门
    door(ctx, 1090, 370, 84, 180, { seed: 188 });
  },
};

ROOMS.church = {
  label: '湖畔礼拜堂', chapter: 2,
  walls: [[0, 0, 40, 720], [1240, 0, 40, 720], [420, 470, 460, 60], [880, 380, 160, 70], [940, 200, 180, 160]],
  spawn: { x: 150, y: 560 },
  spawnFrom: { street: { x: 150, y: 560 } },
  hotspots: [
    { id: 'goat', x: 320, y: 570, r: 90, name: '山羊神父',
      act(F, g) {
        if (!F.statuesSolved) g.say(['山羊神父：三圣像各望一方，唯有齐齐俯瞰湖心，钟楼才肯交出钥匙。', '山羊神父：孩子，你的眼睛……在圣堂里少用。这里的墙，会记住它看到的东西。']);
        else if (!F.candlesLit) g.say(['山羊神父：圣像已俯首。点燃三烛，钥匙自现。']);
        else g.say(['山羊神父：钟绳在楼上。拉钟的时候，替十年前没来得及忏悔的人，多敲一下。']);
      } },
    { id: 'statue0', x: 500, y: 500, r: 60, name: '圣像·左', show: F => !F.statuesSolved, act(F, g) { g.turnStatue(0); } },
    { id: 'statue1', x: 650, y: 500, r: 60, name: '圣像·中', show: F => !F.statuesSolved, act(F, g) { g.turnStatue(1); } },
    { id: 'statue2', x: 800, y: 500, r: 60, name: '圣像·右', show: F => !F.statuesSolved, act(F, g) { g.turnStatue(2); } },
    { id: 'candelabrum', x: 950, y: 470, r: 80, name: '大烛台',
      act(F, g) {
        if (F.candlesLit) { g.say(['三支老蜡安静地烧着。']); return; }
        if (!F.statuesSolved) { g.say(['烛台擦得很亮，但烛芯是湿的——圣像没有俯首之前，火点不着。']); return; }
        if (!g.hasItem('蜡烛')) { g.say(['需要一支够老、够分量的蜡烛。镇上只有一个人收旧物。']); return; }
        F.candlesLit = true; F.gotBellKey = true; g.consumeItem('蜡烛'); g.save(); g.gainItem('钟楼钥匙');
        g.say(['老蜡落进烛台，三簇火苗同时立起。祭坛的暗格「咔」地弹开——', '获得了「钟楼钥匙」。']);
      } },
    { id: 'belltower', x: 1080, y: 480, r: 95, name: '钟楼',
      act(F, g) {
        if (F.bellRung) { g.say(['钟还在轻轻嗡鸣。']); return; }
        if (!F.gotBellKey) { g.say(['钟楼的门锁着。锁孔是三叶草的形状。']); return; }
        g.ringBell();
      } },
    { id: 'out', x: 100, y: 440, r: 95, name: '回长街', act(F, g) { g.gotoRoom('street'); } },
  ],
  otherDecor(ctx, t, F) {
    // 彩窗下的影
    ctx.save(); ctx.globalAlpha = .4;
    poly(ctx, [[560, 340], [720, 340], [760, 560], [520, 560]], { fill: '#2c1a16', stroke: null, amp: 2, seed: 190 });
    ctx.restore();
  },
  monsters: F => [],
  draw(ctx, t, F) {
    shell(ctx, 1280, { wall: '#b8ad96', stripe: '#aca189', wain: '#4e4438', floor: '#6e6656', floorDark: '#5c5546', seed: 191 });
    // 彩窗
    const win = (x) => {
      ctx.fillStyle = '#4a3626'; ctx.fillRect(x - 6, 90, 92, 190);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) poly(ctx, rrectPts(x + i * 28, 96 + j * 45, 24, 40, 2), { fill: ['#8e4a44', '#5d7a72', '#c9a227', '#7a6a9a'][(i + j) % 4], lw: 1.6, amp: .5, seed: 192 + i * 4 + j, alpha: .9 });
    };
    win(470); win(600); win(730);
    // 祭坛
    poly(ctx, [[420, 420], [880, 420], [890, 480], [410, 480]], { fill: '#5d4a34', lw: 3, amp: 1.2, seed: 200 });
    // 三圣像（可转向）
    const dirs = F.statues || [2, 0, 3];
    for (let i = 0; i < 3; i++) {
      const x = 500 + i * 150;
      furnitureShadow(ctx, x, 520, 80);
      poly(ctx, [[x - 22, 430], [x + 22, 430], [x + 26, 500], [x - 26, 500]], { fill: '#c6bda8', lw: 2.8, amp: 1, seed: 201 + i });
      ell(ctx, x, 414, 14, 15, { fill: '#c6bda8', lw: 2.4, amp: .7, seed: 204 + i });
      // 面朝方向的鼻尖标记
      const a = [0, Math.PI / 2, Math.PI, -Math.PI / 2][dirs[i]]; // down/left/up/right
      ell(ctx, x + Math.cos(a == 0 ? 0 : a == Math.PI ? Math.PI : a) * (a === 0 || a === Math.PI ? 0 : 12) + (a === Math.PI ? -10 : a === 0 ? 10 : 0), 416 + (a === 0 ? 6 : a === Math.PI ? 4 : 0), 2, 2, { fill: '#2f2620', stroke: null, amp: .2, seed: 207 + i });
      if (dirs[i] === 0) { ell(ctx, x - 4, 412, 1.6, 2, { fill: '#2f2620', stroke: null, amp: .2, seed: 210 + i }); ell(ctx, x + 4, 412, 1.6, 2, { fill: '#2f2620', stroke: null, amp: .2, seed: 213 + i }); }
    }
    // 大烛台
    if (!F.candlesLit || true) {
      poly(ctx, [[930, 380], [970, 380], [975, 470], [925, 470]], { fill: '#b98d3a', lw: 2.8, amp: .9, seed: 216 });
      for (let i = 0; i < 3; i++) {
        const cx = 915 + i * 28;
        line(ctx, cx, 380, cx, 340, { lw: 3, seed: 217 + i, stroke: '#b98d3a' });
        if (F.candlesLit) flame(ctx, cx, 338, 22, 7, t, 60 + i);
        else line(ctx, cx - 1, 344, cx - 1, 338, { lw: 2, seed: 220 + i, stroke: '#3a3226' });
      }
    }
    // 钟楼门
    door(ctx, 1040, 360, 90, 190, { seed: 224, fill: '#4a3626' });
    // 长椅
    for (let i = 0; i < 3; i++) {
      poly(ctx, [[180 + i * 10, 560 + i * 40], [420 + i * 10, 560 + i * 40], [425 + i * 10, 585 + i * 40], [175 + i * 10, 585 + i * 40]], { fill: '#6e5138', lw: 2.2, amp: .9, seed: 225 + i, alpha: .95 });
    }
    // 山羊神父
    drawGoat(ctx, 320, 600, 1.05, t);
  },
};

ROOMS.clinic = {
  label: '旧诊所', chapter: 2,
  walls: [[0, 0, 40, 720], [1240, 0, 40, 720], [180, 400, 180, 80], [620, 400, 220, 80], [880, 430, 220, 60]],
  spawn: { x: 1050, y: 560 },
  spawnFrom: { street: { x: 1050, y: 560 } },
  hotspots: [
    { id: 'cabinet', x: 240, y: 480, r: 70, name: '药柜',
      act(F, g) { if (!F.bandage) { F.bandage = true; g.gainItem('绷带'); } else g.say(['药柜里只剩空瓶和一卷用过的纱布。']); } },
    { id: 'watch', x: 560, y: 470, r: 70, name: '药桌上闪光的旧物', world: 'other', show: F => !F.gotWatch,
      act(F, g) { F.gotWatch = true; g.save(); g.gainItem('银怀表'); g.say(['里世界里的药桌上，一块银怀表还在走——表盖内侧刻着「赠 阿堵」。', '……是谁送的？获得了「银怀表」。']); } },
    { id: 'bed', x: 980, y: 500, r: 80, name: '诊查床',
      act(F, g) { g.say(['床单下鼓起一个人形，很瘦，双手交叠放在胸前。你没有掀开的勇气。']); } },
    { id: 'desk2', x: 720, y: 480, r: 70, name: '医案',
      act(F, g) { g.say(['最后一页医案：「11 月 3 日。火灾。转诊至湖心灯塔。家属：无。」']); } },
    { id: 'out', x: 1150, y: 470, r: 70, name: '回长街', act(F, g) { g.gotoRoom('street'); } },
  ],
  otherDecor(ctx, t, F) {
    if (!F.gotWatch) {
      ctx.save(); ctx.globalAlpha = .8 + Math.sin(t * 3) * .2;
      ell(ctx, 560, 452, 10, 10, { fill: '#c9ced2', lw: 2.2, amp: .4, seed: 230 });
      line(ctx, 560, 452, 560, 444, { lw: 1.4, seed: 231, stroke: '#3a3c38' });
      ctx.restore();
    }
    // 床单下的人形更明显
    ctx.save(); ctx.globalAlpha = .3; ctx.fillStyle = '#9e2b25'; ctx.fillRect(900, 440, 180, 50); ctx.restore();
  },
  monsters: F => F.gotWatch ? [] : [
    { type: 'nurse', x: 420, y: 560, seed: 3, speed: 44 },
    { type: 'nurse', x: 880, y: 600, seed: 4, speed: 50 },
  ],
  draw(ctx, t, F) {
    shell(ctx, 1280, { wall: '#c4c4b8', stripe: '#b8b8ac', wain: '#4e5048', floor: '#7a7a6c', floorDark: '#68685c', seed: 232 });
    // 药柜
    furnitureShadow(ctx, 240, 490, 180);
    poly(ctx, [[160, 260], [320, 260], [326, 480], [154, 480]], { fill: '#8a8f90', lw: 3, amp: 1.2, seed: 233 });
    ctx.fillStyle = '#e8e2d2'; ctx.fillRect(176, 280, 132, 90);
    for (let i = 0; i < 4; i++) poly(ctx, rrectPts(182 + i * 32, 286, 24, 78, 2), { fill: '#a8403a', lw: 1.4, amp: .4, seed: 234 + i, alpha: .6 });
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#d8d2c4'; ctx.fillRect(178 + i * 44, 386, 34, 60); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(178 + i * 44, 386, 34, 60); }
    // 药桌
    furnitureShadow(ctx, 720, 490, 220);
    poly(ctx, [[620, 410], [840, 410], [850, 490], [610, 490]], { fill: '#6e6656', lw: 3, amp: 1.2, seed: 238 });
    ell(ctx, 700, 398, 10, 12, { fill: '#5d7a72', lw: 2, amp: .5, seed: 239 });
    poly(ctx, [[760, 390], [810, 390], [806, 408], [764, 408]], { fill: '#e8e2d2', lw: 1.8, amp: .5, seed: 240 });
    // 诊查床
    furnitureShadow(ctx, 980, 510, 220);
    poly(ctx, [[880, 440], [1090, 440], [1100, 520], [870, 520]], { fill: '#8a8f90', lw: 2.8, amp: 1, seed: 241 });
    poly(ctx, [[890, 415], [1080, 415], [1080, 445], [890, 445]], { fill: '#e8e2d2', lw: 2, amp: .8, seed: 242 });
    poly(ctx, [[940, 418], [1030, 418], [1026, 442], [944, 442]], { fill: '#d8d2c4', stroke: null, amp: .6, seed: 243 }); // 鼓起的人形
    // 门
    door(ctx, 1090, 370, 84, 180, { seed: 244 });
    // 挂钟（停摆）
    ell(ctx, 500, 220, 26, 26, { fill: '#e8e2d2', lw: 2.4, amp: .6, seed: 245 });
    line(ctx, 500, 220, 500, 202, { lw: 2, seed: 246 });
    line(ctx, 500, 220, 514, 226, { lw: 2, seed: 247 });
  },
};

/* ============ 第三章 ============ */

function lighthouseShell(ctx, t, F, floorN) {
  // 砖塔内壁
  ctx.fillStyle = '#7a6a58'; ctx.fillRect(0, 0, 1280, FLOOR_TOP);
  ctx.globalAlpha = .3;
  for (let y = 30; y < 300; y += 52) for (let x = ((y / 52) % 2) * 60; x < 1280; x += 120) { ctx.strokeStyle = '#645648'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 110, 44); }
  ctx.globalAlpha = 1;
  // 螺旋窗（透进湖光）
  const wx = 640, wy = 120;
  ell(ctx, wx, wy, 90, 110, { fill: F ? '#2c3234' : '#8a9294', lw: 4, n: 24, amp: 1.6, seed: 250 });
  ctx.globalAlpha = .5 + Math.sin(t * .8) * .1;
  poly(ctx, [[wx - 40, wy - 40], [wx + 30, wy - 20], [wx - 10, wy + 50], [wx - 60, wy + 30]], { fill: '#b9c2c4', stroke: null, amp: 1.4, seed: 251 });
  ctx.globalAlpha = 1;
  // 弧形地板
  ctx.fillStyle = '#5c4a36'; ctx.fillRect(0, FLOOR_TOP, 1280, 720 - FLOOR_TOP);
  for (let y = FLOOR_TOP + 40; y < 720; y += 44) line(ctx, 0, y, 1280, y, { lw: 2.2, seed: 252 + y, stroke: '#4c3c2c', alpha: .8 });
  // 楼层号刻痕
  ctx.fillStyle = 'rgba(47,38,32,.6)'; ctx.font = 'bold 30px "Kaiti SC","KaiTi",serif';
  ctx.fillText(floorN + ' / 3', 60, 80);
}

const lighthouseWalls = [[0, 0, 90, 720], [1190, 0, 90, 720], [200, 240, 180, 80], [880, 380, 200, 70]];

ROOMS.lh1 = {
  label: '湖心灯塔 · 底层', chapter: 3, dark: 'dim',
  walls: lighthouseWalls,
  spawn: { x: 200, y: 600 },
  spawnFrom: { street: { x: 200, y: 600 }, lh2: { x: 1000, y: 560 } },
  hotspots: [
    { id: 'deer2', x: 360, y: 570, r: 90, name: '守塔人',
      act(F, g) {
        if (!F.deer2Talk) { F.deer2Talk = true; g.save(); g.say([
          '守塔人转过身。还是那件长大衣，那对角——只是这次你看清了，他的大衣下摆已经烧焦了。',
          '守塔人：欢迎回到起点，阿堵。十年前的 11 月 3 日 11 点 44 分，这里着了一场火。',
          '守塔人：你总问「湖对岸的小镇为什么昨天还没有建成」——因为整个镇子，连同这盏灯，都停在了那一天。',
          '守塔人：你的眼睛不是诅咒。它是那场火留给你的……信箱。',
          '守塔人：塔顶有一张桌子。带上笔墨纸，把信写完，然后——替所有人，看一眼明天。',
          '守塔人：东西都还留在塔里。有几样，只有你的眼睛找得到。每层的闸，也要用你的眼睛才扳得动。'
        ]); }
        else g.say(['守塔人：往上走吧。塔里的东西……比外面安静，但别大意。']);
      } },
    { id: 'quill', x: 260, y: 480, r: 70, name: '窗台上的旧笔', world: 'other', show: F => !F.gotQuill,
      act(F, g) { F.gotQuill = true; g.save(); g.gainItem('旧钢笔'); g.say(['笔杆上全是火烧的泡痕，笔尖却亮得像新的。', '获得了「旧钢笔」。']); } },
    { id: 'quill2', x: 260, y: 480, r: 70, name: '窗台', world: 'other', show: F => F.gotQuill,
      act(F, g) { g.say(['窗台的灰上留着一行小孩的脚印，从窗口走向楼梯。']); } },
    { id: 'gate1', x: 940, y: 470, r: 80, name: '锈蚀的闸杆', world: 'other', show: F => !F.stairs1,
      act(F, g) { F.stairs1 = true; g.save(); g.say(['你在里世界里握住闸杆——铁锈像水一样从指缝流走。楼梯的锁，开了。']); } },
    { id: 'gate1b', x: 940, y: 470, r: 80, name: '闸杆', world: 'other', show: F => F.stairs1,
      act(F, g) { g.say(['闸杆已经扳开。']); } },
    { id: 'up', x: 1050, y: 420, r: 80, name: '上楼', act(F, g) { if (F.stairs1) g.gotoRoom('lh2'); else g.say(['楼梯口焊着一道锈闸，现实的手推不动它。']); } },
    { id: 'out', x: 120, y: 620, r: 70, name: '回长街', act(F, g) { g.gotoRoom('street'); } },
  ],
  otherDecor(ctx, t, F) {
    ctx.save(); ctx.globalAlpha = .35; ell(ctx, 640, 500, 260, 60, { fill: '#3a1c14', stroke: null, amp: 2, seed: 255 }); ctx.restore();
  },
  monsters: F => F.gotQuill ? [] : [{ type: 'nurse', x: 760, y: 580, seed: 5, speed: 48 }],
  draw(ctx, t, F) {
    lighthouseShell(ctx, t, false, 1);
    // 桌椅
    furnitureShadow(ctx, 300, 520, 180);
    poly(ctx, [[220, 440], [390, 440], [398, 510], [212, 510]], { fill: '#6e5a42', lw: 3, amp: 1.2, seed: 256 });
    // 杂物桶
    ell(ctx, 480, 500, 26, 18, { fill: '#4a4642', lw: 2.4, amp: .8, seed: 257 });
    // 楼梯（螺旋）
    poly(ctx, [[980, 300], [1120, 300], [1140, 480], [960, 480]], { fill: '#3a2f24', lw: 3, amp: 1.2, seed: 258 });
    for (let i = 0; i < 5; i++) poly(ctx, [[990 + i * 6, 320 + i * 32], [1110 - i * 6, 320 + i * 32], [1116 - i * 6, 344 + i * 32], [984 + i * 6, 344 + i * 32]], { fill: ['#5c4a36', '#54432e'][i % 2], lw: 1.8, amp: .6, seed: 259 + i, alpha: .9 });
    // 出口门
    door(ctx, 60, 370, 80, 180, { seed: 265 });
    // 守塔人
    drawDeer(ctx, 360, 590, 1.1, t);
  },
};

ROOMS.lh2 = {
  label: '湖心灯塔 · 中层', chapter: 3, dark: 'dim',
  walls: lighthouseWalls,
  spawn: { x: 160, y: 600 },
  spawnFrom: { lh1: { x: 160, y: 600 }, lh3: { x: 1000, y: 560 } },
  hotspots: [
    { id: 'ink', x: 260, y: 480, r: 70, name: '柜中的墨', world: 'other', show: F => !F.gotInk,
      act(F, g) { F.gotInk = true; g.save(); g.gainItem('墨水'); g.say(['柜子深处一瓶墨水，瓶身漆黑，标签是空的。', '获得了「墨水」。']); } },
    { id: 'ink2', x: 260, y: 480, r: 70, name: '空药柜', world: 'other', show: F => F.gotInk,
      act(F, g) { g.say(['柜壁内侧刻满了正字，数到一半就断了。']); } },
    { id: 'gate2', x: 940, y: 470, r: 80, name: '锈蚀的闸杆', world: 'other', show: F => !F.stairs2,
      act(F, g) { F.stairs2 = true; g.save(); g.say(['第二道闸，锈得更狠。你握紧——眼睛发烫——闸开了。']); } },
    { id: 'gate2b', x: 940, y: 470, r: 80, name: '闸杆', world: 'other', show: F => F.stairs2,
      act(F, g) { g.say(['闸杆已经扳开。']); } },
    { id: 'up', x: 1050, y: 420, r: 80, name: '上楼', act(F, g) { if (F.stairs2) g.gotoRoom('lh3'); else g.say(['又一道锈闸。用那只眼睛去看，去扳。']); } },
    { id: 'down', x: 150, y: 620, r: 70, name: '下楼', act(F, g) { g.gotoRoom('lh1'); } },
  ],
  otherDecor(ctx, t, F) {
    ctx.save(); ctx.globalAlpha = .3;
    poly(ctx, [[400, 340], [900, 340], [950, 560], [350, 560]], { fill: '#2c1a16', stroke: null, amp: 2, seed: 266 });
    ctx.restore();
  },
  monsters: F => F.gotInk ? [] : [{ type: 'crawler', x: 700, y: 560, seed: 6, speed: 92 }],
  draw(ctx, t, F) {
    lighthouseShell(ctx, t, false, 2);
    // 柜子
    furnitureShadow(ctx, 260, 500, 180);
    poly(ctx, [[190, 300], [340, 300], [346, 480], [184, 480]], { fill: '#54432e', lw: 3, amp: 1.2, seed: 267 });
    line(ctx, 190, 390, 340, 390, { lw: 2, seed: 268 });
    // 维修工具桌
    furnitureShadow(ctx, 700, 500, 200);
    poly(ctx, [[610, 430], [790, 430], [800, 500], [600, 500]], { fill: '#6e5a42', lw: 3, amp: 1.2, seed: 269 });
    line(ctx, 630, 455, 700, 455, { lw: 3, seed: 270, stroke: '#4a4642' });
    ell(ctx, 745, 455, 10, 7, { fill: '#4a4642', lw: 1.8, amp: .4, seed: 271 });
    // 楼梯
    poly(ctx, [[980, 300], [1120, 300], [1140, 480], [960, 480]], { fill: '#3a2f24', lw: 3, amp: 1.2, seed: 272 });
    for (let i = 0; i < 5; i++) poly(ctx, [[990 + i * 6, 320 + i * 32], [1110 - i * 6, 320 + i * 32], [1116 - i * 6, 344 + i * 32], [984 + i * 6, 344 + i * 32]], { fill: '#5c4a36', lw: 1.8, amp: .6, seed: 273 + i, alpha: .9 });
    poly(ctx, [[140, 560], [240, 560], [250, 690], [130, 690]], { fill: '#241c14', lw: 3, amp: 1.2, seed: 278 });
  },
};

ROOMS.lh3 = {
  label: '湖心灯塔 · 上层', chapter: 3, dark: 'dim',
  walls: lighthouseWalls,
  spawn: { x: 160, y: 600 },
  spawnFrom: { lh2: { x: 160, y: 600 }, lhtop: { x: 1000, y: 560 } },
  hotspots: [
    { id: 'paper', x: 260, y: 480, r: 70, name: '桌上的信纸', world: 'other', show: F => !F.gotPaper,
      act(F, g) { F.gotPaper = true; g.save(); g.gainItem('信纸'); g.say(['一叠信纸，边角烧黄，第一行印着：「致昨天」。', '获得了「信纸」。']); } },
    { id: 'paper2', x: 260, y: 480, r: 70, name: '空桌', world: 'other', show: F => F.gotPaper,
      act(F, g) { g.say(['桌面的灰被手指抹开一块，像有人每天来摸一遍这张空桌子。']); } },
    { id: 'gate3', x: 940, y: 470, r: 80, name: '最后一道闸', world: 'other', show: F => !F.stairs3,
      act(F, g) { F.stairs3 = true; g.save(); g.say(['最后一道闸。你扳动它的时候，整座塔轻轻晃了一下，像点了一次头。']); } },
    { id: 'gate3b', x: 940, y: 470, r: 80, name: '闸杆', world: 'other', show: F => F.stairs3,
      act(F, g) { g.say(['最后一道闸已经扳开。']); } },
    { id: 'up', x: 1050, y: 420, r: 80, name: '登顶', act(F, g) { if (F.stairs3) g.gotoRoom('lhtop'); else g.say(['塔顶的方向透出光。先扳开这道闸。']); } },
    { id: 'down', x: 150, y: 620, r: 70, name: '下楼', act(F, g) { g.gotoRoom('lh2'); } },
  ],
  otherDecor(ctx, t, F) { },
  monsters: F => F.gotPaper ? [] : [
    { type: 'crawler', x: 620, y: 580, seed: 7, speed: 88 },
    { type: 'nurse', x: 1000, y: 560, seed: 8, speed: 46 },
  ],
  draw(ctx, t, F) {
    lighthouseShell(ctx, t, false, 3);
    furnitureShadow(ctx, 280, 500, 160);
    poly(ctx, [[210, 430], [350, 430], [358, 500], [202, 500]], { fill: '#6e5a42', lw: 3, amp: 1.2, seed: 279 });
    // 楼梯
    poly(ctx, [[980, 300], [1120, 300], [1140, 480], [960, 480]], { fill: '#3a2f24', lw: 3, amp: 1.2, seed: 280 });
    for (let i = 0; i < 5; i++) poly(ctx, [[990 + i * 6, 320 + i * 32], [1110 - i * 6, 320 + i * 32], [1116 - i * 6, 344 + i * 32], [984 + i * 6, 344 + i * 32]], { fill: '#5c4a36', lw: 1.8, amp: .6, seed: 281 + i, alpha: .9 });
    poly(ctx, [[140, 560], [240, 560], [250, 690], [130, 690]], { fill: '#241c14', lw: 3, amp: 1.2, seed: 286 });
    // 破箱子
    poly(ctx, [[520, 460], [620, 460], [626, 520], [514, 520]], { fill: '#3a2f24', lw: 2.8, amp: 1, seed: 287 });
  },
};

ROOMS.lhtop = {
  label: '湖心灯塔 · 灯室', chapter: 3, dark: 'dim',
  walls: [[0, 0, 90, 720], [1190, 0, 90, 720], [180, 380, 900, 60]],
  spawn: { x: 640, y: 620 },
  spawnFrom: { lh3: { x: 640, y: 620 } },
  hotspots: [
    { id: 'lamp', x: 640, y: 400, r: 90, name: '熄灭的灯炉',
      act(F, g) { g.say(['巨大的灯炉冷着。玻璃罩上贴着一张childlike的蜡笔画：一座亮着的塔，塔下站着一家人。']); } },
    { id: 'desk3', x: 640, y: 520, r: 100, name: '写字桌',
      act(F, g) {
        if (F.letterWritten) return;
        if (g.hasItem('旧钢笔') && g.hasItem('墨水') && g.hasItem('信纸')) g.writeLetter();
        else {
          const miss = ['旧钢笔', '墨水', '信纸'].filter(k => !g.hasItem(k));
          g.say(['桌面干净得反常，像等了很多年。还差：' + miss.join('、') + '。']);
        }
      } },
    { id: 'deer3', x: 950, y: 580, r: 90, name: '守塔人',
      act(F, g) { g.say(['守塔人：纸、笔、墨都在你手里了。别替他们道歉，也别替自己——把想说的写下来就好。']); } },
  ],
  otherDecor(ctx, t, F) { },
  monsters: F => [],
  draw(ctx, t, F) {
    // 灯室：环形玻璃
    ctx.fillStyle = '#3c4448'; ctx.fillRect(0, 0, 1280, FLOOR_TOP);
    // 外面的夜湖
    ctx.fillStyle = '#232a2c'; ctx.fillRect(0, 60, 1280, 240);
    ell(ctx, 640, 560, 900, 260, { fill: '#5c4a36', stroke: null, amp: 2, seed: 290 });
    // 湖面微光
    for (let i = 0; i < 7; i++) { const lx = 150 + i * 160; ell(ctx, lx, 150 + (i % 3) * 60, 40, 5, { fill: '#8a9294', stroke: null, amp: .6, seed: 291 + i, alpha: .35 }); }
    // 中央灯炉
    furnitureShadow(ctx, 640, 470, 200);
    poly(ctx, [[560, 300], [720, 300], [740, 470], [540, 470]], { fill: '#4a4642', lw: 3.4, amp: 1.2, seed: 300 });
    poly(ctx, [[580, 200], [700, 200], [716, 302], [564, 302]], { fill: '#8a9294', lw: 3, amp: 1.2, seed: 301, alpha: .5 });
    ctx.fillStyle = '#3c4448'; ctx.fillRect(0, 0, 1280, FLOOR_TOP); // 重绘墙面遮上半
    poly(ctx, [[560, 300], [720, 300], [740, 470], [540, 470]], { fill: '#4a4642', lw: 3.4, amp: 1.2, seed: 300 });
    // 写字桌
    furnitureShadow(ctx, 640, 590, 260);
    poly(ctx, [[520, 500], [760, 500], [772, 590], [508, 590]], { fill: '#6e5138', lw: 3.4, amp: 1.2, seed: 302 });
    poly(ctx, [[560, 486], [720, 486], [724, 502], [556, 502]], { fill: '#7a5c40', lw: 2.4, amp: .8, seed: 303 });
    // 空白信纸
    poly(ctx, [[600, 470], [690, 470], [692, 488], [598, 488]], { fill: '#f4ecd6', lw: 1.8, amp: .4, seed: 304 });
    // 守塔人
    drawDeer(ctx, 950, 600, 1.1, t);
    // 下楼口
    poly(ctx, [[1000, 560], [1120, 560], [1140, 700], [980, 700]], { fill: '#241c14', lw: 3, amp: 1.2, seed: 305 });
  },
};

export function roomById(id) { return ROOMS[id]; }
