/* game.js —— 主逻辑：点击调查 / 物品 / 万花筒之瞳 / 对话 / 存档 / 结局 */
import { poly, ell, line, INK, PAL, hash, makeGrain } from './art.js';
import { drawBoy, drawBedroom, bedroomFuture, drawFoyer, foyerFuture, drawStudy, studyFuture, BOOK_ORDER, BOOK_SOLVED } from './scenes.js';

const W = 1280, H = 720, FLOOR = 600;
const SAVE_KEY = 'MINGRI_2D_SAVE_V1';

const $ = id => document.getElementById(id);
const canvas = $('gl');
const ctx = canvas.getContext('2d');

/* ---------- 全局状态 ---------- */
const state = {
  scene: 'title',            // title | play | end
  room: 'bedroom',
  flags: {},
  inv: [],
  sel: null,
  peeking: false,
  hintUsed: 0,
  bookSeq: [],
};
const F = () => state.flags;

/* ---------- 存档 ---------- */
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ room: state.room, flags: state.flags, inv: state.inv, hintUsed: state.hintUsed })); } catch (e) {}
}
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && d.flags) return d;
  } catch (e) {}
  return null;
}
function hasSave() { const d = loadSave(); return !!(d && (d.inv.length || Object.keys(d.flags).length)); }

/* ---------- UI 基元 ---------- */
let toastTimer = null;
function toast(msg, ms = 2600) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

const DIALOGS = [];   // [{who, text}]
let onDialogEnd = null;
let showing = false;
function say(lines, cb) {
  DIALOGS.push(...lines);
  if (cb) onDialogEnd = cb;
  if (!showing) nextDialog();
}
function nextDialog() {
  clearInterval(nextDialog._tw);
  if (!DIALOGS.length) {
    if (!showing) return;
    showing = false;
    $('dialog').classList.remove('show');
    const cb = onDialogEnd; onDialogEnd = null;
    if (cb) cb();
    return;
  }
  showing = true;
  const d = DIALOGS.shift();
  const box = $('dialog');
  box.querySelector('.who').textContent = d.who;
  box.classList.add('show');
  // 打字机
  const el = box.querySelector('.text');
  el.textContent = '';
  let i = 0; const full = d.text;
  clearInterval(nextDialog._tw);
  nextDialog._tw = setInterval(() => {
    i += 2; el.textContent = full.slice(0, i);
    if (i >= full.length) clearInterval(nextDialog._tw);
  }, 28);
}
$('dialog').addEventListener('click', () => {
  // 点击：若打字未完则立即显示整句，否则下一句
  const el = $('dialog').querySelector('.text');
  nextDialog();
});

/* ---------- 物品 ---------- */
const ITEMS = {
  towel:   { name: '旧手巾', draw: g => { poly(g, [[10, 30], [36, 28], [38, 10], [12, 12]], { fill: '#e0d3ae', seed: 1, lw: 2.5 }); line(g, 14, 18, 34, 16, { lw: 1.5, alpha: .5, seed: 2 }); } },
  handle:  { name: '黄铜把手', draw: g => { ell(g, 16, 23, 8, 8, { fill: PAL.brass, seed: 3, n: 12, lw: 2 }); line(g, 22, 22, 36, 16, { lw: 4, stroke: PAL.brass, seed: 4 }); ell(g, 37, 15, 3.5, 3.5, { fill: PAL.gold, seed: 5, n: 10 }); } },
  keySt:   { name: '书房铜钥匙', draw: g => { ell(g, 14, 23, 8, 8, { fill: null, stroke: '#a86a32', lw: 3, seed: 6, n: 14 }); line(g, 21, 23, 38, 23, { lw: 3, stroke: '#a86a32', seed: 7 }); line(g, 34, 23, 34, 30, { lw: 2.5, stroke: '#a86a32', seed: 8 }); line(g, 28, 23, 28, 29, { lw: 2.5, stroke: '#a86a32', seed: 9 }); } },
  keyWind: { name: '发条钥匙', draw: g => { ell(g, 14, 23, 9, 9, { fill: null, stroke: PAL.brass, lw: 3, seed: 10, n: 14 }); line(g, 22, 23, 38, 23, { lw: 3, stroke: PAL.brass, seed: 11 }); line(g, 38, 23, 43, 18, { lw: 2.5, stroke: PAL.brass, seed: 12 }); line(g, 38, 23, 43, 28, { lw: 2.5, stroke: PAL.brass, seed: 13 }); } },
};
function gainItem(id, msg) {
  if (state.inv.includes(id)) return;
  state.inv.push(id); renderInv(); toast(msg); save();
}
function renderInv() {
  const inv = $('inv'); inv.innerHTML = '';
  state.inv.forEach(id => {
    const slot = document.createElement('div');
    slot.className = 'slot' + (state.sel === id ? ' sel' : '');
    const c = document.createElement('canvas'); c.width = 46; c.height = 46;
    ITEMS[id].draw(c.getContext('2d'));
    slot.appendChild(c);
    const n = document.createElement('div'); n.className = 'slot-name'; n.textContent = ITEMS[id].name;
    slot.appendChild(n);
    slot.onclick = e => { e.stopPropagation(); state.sel = state.sel === id ? null : id; renderInv(); };
    inv.appendChild(slot);
  });
  // 未选中时（点空白取消）
}

/* ---------- 热点 ---------- */
// 每个: {id, x,y,w,h, name, act(item)}
function roomHotspots() {
  if (state.room === 'bedroom') {
    const hs = [
      { id: 'towel', x: 292, y: 112, w: 52, h: 90, name: '挂着的手巾', show: () => !F().towel, act: () => { F().towel = true; gainItem('towel', '取下了窗边的旧手巾。'); } },
      { id: 'bed', x: 380, y: 540, w: 320, h: 50, name: '床底', act: () => {
          if (!F().handle) { F().handle = true; gainItem('handle', '床底下滚着一枚黄铜门把手……是谁落下的？'); }
          else say([{ who: '阿堵', text: '床底下只剩灰尘了。' }]);
        } },
      { id: 'kettle', x: 1020, y: 330, w: 90, h: 75, name: '炉上的水壶', show: () => !F().kettleOff, act: () => {
          if (F().towel) { F().kettleOff = true; state.inv = state.inv.filter(i => i !== 'towel'); renderInv(); save();
            gainItem('keySt', '壶底下压着一把铜钥匙——获得了「书房铜钥匙」。');
            say([{ who: '阿堵', text: '垫着手巾，总算把壶端了下来——壶底下压着一把铜钥匙！' }]);
          } else say([{ who: '阿堵', text: '壶身烫得没法碰。得找块布垫着……' }]);
        } },
      { id: 'stove', x: 940, y: 430, w: 120, h: 90, name: '炉门', act: () => {
          if (!F().kettleOff) say([{ who: '阿堵', text: '炉火烧得正旺，水壶咕嘟咕嘟响个不停。' }]);
          else if (!F().stoveClosed) { F().stoveClosed = true; save(); toast('关上了炉门。火光熄灭了。');
            say([{ who: '阿堵', text: '离开之前，还是把炉门关上比较好……总有种不安的感觉。' }]);
          } else say([{ who: '阿堵', text: '炉门已经关好了。' }]);
        } },
      { id: 'picture', x: 756, y: 146, w: 110, h: 90, name: '墙上的画', act: () => say([{ who: '阿堵', text: '画里的人影雾蒙蒙的，看不清脸。画框角落刻着一行小字：「眼见未必为实。」' }]) },
      { id: 'door', x: 1150, y: 260, w: 120, h: 300, name: '房门', act: () => {
          if (F().bedroomOpen || state.inv.includes('keySt')) {
            if (!F().bedroomOpen) { F().bedroomOpen = true; save(); toast('用铜钥匙打开了房门。'); }
            gotoRoom('foyer');
          } else say([{ who: '阿堵', text: '门锁得死死的。锁孔样式很老……钥匙也许被藏在屋里什么地方。' }]);
        } },
      { id: 'self', x: 570, y: 400, w: 110, h: 250, name: '阿堵', act: () => say([{ who: '阿堵', text: F().stoveClosed ? '眼睛转了转。万花筒之瞳能看到十分钟后——按 F 试试。' : '总觉得十分钟后这里会变得不一样。按 F 窥探看看。' }]) },
    ];
    return hs;
  }
  if (state.room === 'foyer') {
    return [
      { id: 'bedroom-door', x: 0, y: 290, w: 100, h: 270, name: '回卧室', act: () => gotoRoom('bedroom') },
      { id: 'study-door', x: 1180, y: 290, w: 100, h: 270, name: '去书房', show: () => F().metDeer, act: () => gotoRoom('study') },
      { id: 'deer', x: 420, y: 300, w: 130, h: 320, name: '鹿先生', show: () => F().metDeer, act: () => say([
          { who: '鹿先生', text: F().clockWound ? '钟声一响，大门便会应声而开。客人，门在那边。' : '大门与老钟是一体的——这是先主的规矩。「钟声响起之时，门才会记得自己的职责」。' },
        ]) },
      { id: 'hole', x: 826, y: 380, w: 44, h: 44, name: '门上的把手孔', show: () => !F().handleOn, act: () => {
          if (state.inv.includes('handle')) { F().handleOn = true; state.inv = state.inv.filter(i => i !== 'handle'); renderInv(); save();
            toast('装上了黄铜把手。');
            say([{ who: '阿堵', text: '咔哒——把手装好了。可是门纹丝不动。' }]);
          } else say([{ who: '阿堵', text: '大门上空着一个把手孔，边缘磨得发亮。' }]);
        } },
      { id: 'bigdoor', x: 690, y: 210, w: 320, h: 350, name: '宅邸大门', act: () => {
          if (F().handleOn && F().clockWound) { endGame(); }
          else if (!F().handleOn) say([{ who: '阿堵', text: '推不动。门上还缺着把手。' }]);
          else say([{ who: '阿堵', text: '把手有了，门却像长在墙上一样。也许……要等什么信号？' }]);
        } },
      { id: 'clock', x: 138, y: 190, w: 160, h: 370, name: '老爷钟', act: () => {
          if (F().clockWound) say([{ who: '阿堵', text: '钟摆不紧不慢地晃着。分针不知何时开始走了。' }]);
          else if (state.inv.includes('keyWind')) { F().clockWound = true; state.inv = state.inv.filter(i => i !== 'keyWind'); renderInv(); save();
            say([{ who: '阿堵', text: '插上发条钥匙，用力拧——齿轮咔咔转动，分针颤了一下，开始走了！' },
                 { who: '？？？', text: '「……钟声响起之时，门才会记得自己的职责。」' },
                 { who: '阿堵', text: '钟在走。等分针走到第十分钟——门会开吗？' }]);
          } else say([{ who: '阿堵', text: '老爷钟停了。上发条的孔是空的——需要一把发条钥匙。' }]);
        } },
      { id: 'coat', x: 336, y: 320, w: 90, h: 240, name: '挂衣架', act: () => say([{ who: '阿堵', text: '一件旧外套。口袋里空空如也，只有一股浓重的雾味。' }]) },
      { id: 'candle', x: 1080, y: 440, w: 150, h: 120, name: '烛台', act: () => say([{ who: '阿堵', text: '烛火安安静静。奇怪，刚才没有风，火苗却朝大门的方向偏。' }]) },
    ];
  }
  // study
  return [
    { id: 'back', x: 0, y: 290, w: 100, h: 270, name: '回门厅', act: () => gotoRoom('foyer') },
    { id: 'portrait', x: 286, y: 56, w: 130, h: 120, name: '先主画像', act: () => say([
        { who: '阿堵', text: '画像背后刻着一行小字——' },
        { who: '先主', text: '「金先于青，绯在最后。钟爱黄昏之人如是说。」' },
      ]) },
    { id: 'globe', x: 1010, y: 350, w: 100, h: 110, name: '地球仪', act: () => {
        say([{ who: '阿堵', text: '地球仪缓缓转着，海图上别着一枚红头图钉，钉着湖对岸的小镇。' },
             { who: '阿堵', text: '图钉下压着字条：「大门的钟，只在十分钟后说真话。」' }]);
      } },
    { id: 'desk', x: 820, y: 460, w: 300, h: 110, name: '书桌', act: () => say([{ who: '阿堵', text: '摊开的账本上记满了日期，每一页的最后都写着同一句话：「别忘了看明天。」' }]) },
    { id: 'rabbit', x: 650, y: 380, w: 110, h: 280, name: '兔小姐', act: () => say([
        { who: '兔小姐', text: '先生让我把书房收拾干净……可这些书，怎么摆都不对劲。' },
        { who: '兔小姐', text: '先主生前最爱黄昏。他说书也该像黄昏一样排——金色的光，青色的影，绯色的天。' },
      ]) },
    ...BOOK_ORDER.map((id, i) => ({
      id: 'book-' + id,
      x: 180 + i * 70, y: 412, w: 46, h: 126,
      name: { red: '红书', gold: '金书', teal: '青书', crimson: '绯书', brown: '褐书' }[id],
      show: () => !F().booksSolved && !F().bookPulled?.includes(id),
      act: () => {
        if (F().booksSolved) return;
        const seq = state.bookSeq;
        if (BOOK_SOLVED[seq.length] === id) {
          seq.push(id);
          (F().bookPulled ??= []).push(id);
          if (seq.length === BOOK_SOLVED.length) {
            F().booksSolved = true; save();
            gainItem('keyWind', '暗格弹开——获得了「发条钥匙」。');
            say([{ who: '阿堵', text: '咔嗒——书架下层弹出一个暗格，里面躺着一把黄铜的发条钥匙！' }]);
          } else toast('书轻轻弹了进去……（' + seq.length + '/3）');
        } else {
          state.bookSeq = []; F().bookPulled = [];
          toast('什么也没发生。书架咯吱响了一声，弹了回去。');
        }
        save();
      },
    })),
  ];
}

/* ---------- 房间切换 ---------- */
let trans = null; // {to, t}
function gotoRoom(room) {
  trans = { to: room, t: 0 };   // 仅作视觉淡入淡出
  state.peeking = false; syncPeekUI();
  state.room = room;
  $('room-label').innerHTML = ROOM_META[room].label + '<div id="room-sub">第一章 · 雾中宅邸</div>';
  save();
  if (room === 'foyer' && !F().metDeer) {
    F().metDeer = true; save();
    setTimeout(() => say([
      { who: '？？？', text: '……客人醒得比预想早。' },
      { who: '鹿先生', text: '我是这宅邸的管家。今晚有个小小的仪式，恕不奉陪。' },
      { who: '阿堵', text: '仪式？我要怎么离开这里？' },
      { who: '鹿先生', text: '大门？呵。大门与老钟是一体的——「钟声响起之时，门才会记得自己的职责」。' },
      { who: '阿堵', text: '（他走了。右侧的门通向书房，先去看看吧。）' },
    ]), 900);
  }
}
const ROOM_META = {
  bedroom: { label: '雾之卧室', draw: drawBedroom, future: bedroomFuture },
  foyer: { label: '宅邸门厅', draw: drawFoyer, future: foyerFuture },
  study: { label: '先主书房', draw: drawStudy, future: studyFuture },
};

/* ---------- 窥探未来 ---------- */
function togglePeek() {
  if (state.scene !== 'play' || DIALOGS.length || trans) return;
  state.peeking = !state.peeking;
  syncPeekUI();
  if (state.peeking) {
    const f = F(), r = state.room;
    let danger = true;
    if (r === 'bedroom') danger = !(f.stoveClosed && f.kettleOff);
    if (r === 'study') danger = !f.booksSolved;
    if (r === 'foyer') danger = !(f.handleOn && f.clockWound);
    toast(danger
      ? { bedroom: '窗帘烧起来了——是没人看管的炉火！', study: '书架倒了，兔小姐也不见了……', foyer: '大门敞着，雾里有红色的湖，还有谁站在那里……' }[r]
      : { bedroom: '炉火安分，窗帘完好。十分钟后，一切如常。', study: '书立得整整齐齐。十分钟后，一切如常。', foyer: '大门紧闭，钟声将鸣。十分钟后，一切如常。' }[r]);
  }
}
function syncPeekUI() {
  $('peek-fx').classList.toggle('show', state.peeking);
  $('peek-banner').classList.toggle('show', state.peeking);
  $('peek-tip').classList.toggle('show', state.peeking);
  $('peek-btn').classList.toggle('on', state.peeking);
}

/* ---------- 提示 ---------- */
function hint() {
  if (state.scene !== 'play' || DIALOGS.length) return;
  state.hintUsed++;
  const f = F();
  let msg;
  if (state.room === 'bedroom') {
    if (!f.towel) msg = '窗边挂着的手巾，看起来能隔热。';
    else if (!f.kettleOff) msg = '垫着手巾把沸腾的水壶端下来，壶底下也许有别的东西。';
    else if (!f.stoveClosed) msg = '未来着火了——离开前把炉门关上试试。';
    else if (!f.bedroomOpen) msg = '用铜钥匙打开房门，去门厅看看。';
    else msg = '去门厅吧，鹿先生在等你。';
  } else if (state.room === 'foyer') {
    if (!f.handleOn) msg = '床底下找到的黄铜把手，正好装在大门的孔上。';
    else if (!f.metDeer) msg = '去书房看看——门就在右侧。';
    else if (!state.inv.includes('keyWind') && !f.booksSolved) msg = '书房的书架藏着一个按颜色排列的谜题：金 → 青 → 绯。';
    else if (!f.clockWound) msg = '把发条钥匙插进老爷钟，给它上弦。';
    else msg = '把手装好了，钟也在走——等分针走过十分钟，点按大门。';
  } else {
    if (!f.booksSolved) msg = '先主画像的背面有书的口诀；兔小姐也会给提示。';
    else msg = '拿着发条钥匙回门厅，给老爷钟上弦。';
  }
  toast('提示：' + msg, 3800);
  updateHintCount();
}
function updateHintCount() { $('hint-count').textContent = '提示 ×∞'; }

/* ---------- 点击处理 ---------- */
let mouse = { x: -1, y: -1, lx: -1, ly: -1 };
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
canvas.addEventListener('mousemove', e => {
  const p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
  const tag = $('cursor-tag');
  const hs = state.scene === 'play' ? hoverHotspot() : null;
  if (hs) {
    tag.style.display = 'block';
    tag.textContent = hs.name;
    tag.style.left = (e.clientX + 14) + 'px';
    tag.style.top = (e.clientY + 10) + 'px';
    canvas.style.cursor = 'pointer';
  } else { tag.style.display = 'none'; canvas.style.cursor = 'default'; }
});
canvas.addEventListener('mousedown', e => {
  if (state.scene !== 'play' || DIALOGS.length || trans) return;
  const p = toLogical(e);
  const hs = hitHotspot(p.x, p.y);
  if (hs) { mouse.lx = p.x; mouse.ly = p.y; hs.act(state.sel); }
});
function visibleHotspots() { return roomHotspots().filter(h => (!h.show || h.show())); }
function hitHotspot(x, y) { return visibleHotspots().find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h); }
function hoverHotspot() { return hitHotspot(mouse.x, mouse.y); }

/* ---------- 键盘 ---------- */
window.addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') { e.preventDefault(); togglePeek(); }
  if (e.key === 'h' || e.key === 'H') hint();
  if (e.key === 'Escape' && state.sel) { state.sel = null; renderInv(); }
});

$('peek-btn').onclick = togglePeek;
$('hint-btn').onclick = hint;

/* ---------- 开始 / 结束 ---------- */
function startGame(fresh) {
  if (fresh) {
    state.room = 'bedroom'; state.flags = {}; state.inv = []; state.sel = null; state.hintUsed = 0; state.bookSeq = [];
    save();
    renderInv();
    $('room-label').firstChild.textContent = '雾之卧室';
    say([
      { who: '？？？', text: '雾从湖面漫上来的时候，宅邸的灯亮了。' },
      { who: '阿堵', text: '这里是……雾中宅邸？我记得我是沿着红湖走过来的，然后……' },
      { who: '阿堵', text: '炉火、水壶、挂画——都很陌生，又好像在哪儿见过。' },
      { who: '阿堵', text: '（右眼微微发烫。按 F，用「万花筒之瞳」看看十分钟后。）' },
    ]);
  } else {
    const d = loadSave();
    if (d) { state.room = d.room || 'bedroom'; state.flags = d.flags; state.inv = d.inv; state.hintUsed = d.hintUsed || 0; }
    renderInv();
    $('room-label').firstChild.textContent = ROOM_META[state.room].label;
    toast('欢迎回来。存档已恢复。');
  }
  $('room-sub') && ($('room-label').innerHTML = ROOM_META[state.room].label + '<div id="room-sub">第一章 · 雾中宅邸</div>');
  updateHintCount();
  state.scene = 'play';
  $('title-screen').classList.remove('show');
  $('end-screen').classList.remove('show');
  $('room-label').style.display = 'block';
  $('topright').style.display = 'flex';
}
function endGame() {
  state.scene = 'end';
  state.peeking = false; syncPeekUI();
  $('end-text').innerHTML = '钟声响起，大门应声而开。<br/>门外没有街道，只有漫过大腿的浓雾，和红得像黄昏的湖面。<br/><br/>鹿先生立在门内，微微欠身：<br/>「路上小心，客人。湖对岸的小镇——昨天还没有建成。」<br/><br/>阿堵攥紧了背带，一步迈进了雾里。';
  $('end-screen').classList.add('show');
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
$('btn-start').onclick = () => startGame(true);
$('btn-continue').onclick = () => startGame(false);
$('end-restart').onclick = () => {
  state.scene = 'title';
  $('end-screen').classList.remove('show');
  $('title-screen').classList.add('show');
  $('room-label').style.display = 'none';
  $('topright').style.display = 'none';
};
// 有存档时启用继续按钮
if (hasSave()) $('btn-continue').textContent = '继续上次冒险';
else { $('btn-continue').disabled = true; $('btn-continue').textContent = '（暂无存档）'; }

/* ---------- 渲染 ---------- */
const grain = makeGrain(256, 256, 12);

function fitCanvas() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  canvas.style.width = (W * s) + 'px';
  canvas.style.height = (H * s) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function drawTitleScene(t) {
  // 标题背景：雾中山湖（参考图的构图）
  ctx.fillStyle = PAL.sky; ctx.fillRect(0, 0, W, H);
  // 山
  poly(ctx, [[-20, 400], [180, 210], [360, 360], [560, 170], [760, 350], [960, 200], [1160, 340], [1300, 260], [1300, 500], [-20, 500]], { fill: PAL.mountainFar, stroke: null, seed: 401, amp: 2 });
  poly(ctx, [[140, 262], [220, 218], [300, 276]], { fill: PAL.mountainHi, stroke: null, seed: 402, amp: 1.5 });
  poly(ctx, [[510, 236], [580, 186], [660, 260]], { fill: PAL.mountainHi, stroke: null, seed: 403, amp: 1.5 });
  // 松林
  for (let i = 0; i < 22; i++) {
    const tx = 20 + i * 60, ty = 430 + hash(i, 21) * 14;
    poly(ctx, [[tx - 16, ty], [tx, ty - 46 - hash(i, 22) * 14], [tx + 16, ty]], { fill: PAL.pine, stroke: null, seed: 410 + i, amp: 1 });
  }
  // 湖面
  poly(ctx, [[-20, 470], [1300, 458], [1300, 720], [-20, 720]], { fill: '#c3c6c2', stroke: null, amp: 0 });
  // 红色倒影一抹
  ell(ctx, 640, 560, 300, 36, { fill: PAL.blood, stroke: null, seed: 430, alpha: .5, amp: 2 });
  ell(ctx, 640, 600, 180, 24, { fill: PAL.blood, stroke: null, seed: 431, alpha: .3, amp: 2 });
  // 雾带
  for (let i = 0; i < 4; i++) {
    const fx = 200 + i * 320 + Math.sin(t * .5 + i * 2) * 30;
    ell(ctx, fx, 460 + i * 14, 200, 26, { fill: PAL.fog, stroke: null, seed: 440 + i, alpha: .4, amp: 2 });
  }
  // 棺木般的长石台? → 换成石台上的万花筒
  poly(ctx, [[560, 520], [720, 512], [730, 548], [552, 556]], { fill: '#cfc8b4', stroke: INK, lw: 3, seed: 450 });
  poly(ctx, [[552, 556], [730, 548], [724, 566], [560, 572]], { fill: '#b5ad98', stroke: INK, lw: 2.5, seed: 451 });
  // 台上的眼睛
  drawBoy(ctx, 640, 690, 1.15, t);
}

function render(t) {
  requestAnimationFrame(render);
  ctx.clearRect(0, 0, W, H);
  if (state.scene === 'title') { drawTitleScene(t); drawGrain(); return; }
  if (state.scene === 'end') { drawGrain(); return; }

  // 房间切换（仅视觉淡入淡出，逻辑已在 gotoRoom 同步完成）
  if (trans) {
    trans.t += 1 / 30;
    if (trans.t >= 1) trans = null;
  }
const meta = ROOM_META[state.room];
meta.draw(ctx, t, F(), state.peeking);
  if (state.peeking) {
    // 未来态变化
    ctx.save();
    meta.future(ctx, t, F());
    ctx.restore();
    // 泛黄做旧
    ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = '#a87830'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  drawGrain();

  // 转场黑幕
  if (trans) {
    const a = trans.t < .5 ? trans.t * 2 : (1 - trans.t) * 2;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = '#0d0a06'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
function drawGrain() {
  ctx.save(); ctx.globalAlpha = .5;
  for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) ctx.drawImage(grain, x, y);
  ctx.restore();
}

render(0);

/* 调试/测试钩子 */
window.__act = (id, item) => { const hs = roomHotspots().find(h => h.id === id); if (hs && (!hs.show || hs.show())) hs.act(item); };
window.__state = () => state;
window.__goto = r => gotoRoom(r);

/* 自动化全流程测试：?autotest=1（同步执行，不受后台标签节流影响） */
if (location.search.includes('autotest')) {
  const log = (m) => { const d = document.getElementById('autolog') || (() => { const x = document.createElement('div'); x.id = 'autolog'; document.body.appendChild(x); return x; })(); d.textContent += m + ' | '; };
  window.__log = log;
  setTimeout(() => {
    try {
      startGame(true);
      const drain = () => { let n = 0; while ((DIALOGS.length || showing) && n++ < 60) nextDialog(); };
      ['towel', 'bed', 'kettle', 'stove', 'door'].forEach(id => { drain(); window.__act(id); log(id + ':' + state.room); });
      drain(); window.__act('hole'); window.__act('study-door'); log('foyer:' + state.room + ',inv=' + state.inv);
      ['portrait', 'rabbit', 'book-gold', 'book-teal', 'book-crimson', 'back'].forEach(id => { drain(); window.__act(id); log(id + ':solved=' + !!F().booksSolved + ',inv=' + state.inv); });
      drain(); window.__act('clock'); log('clock:wound=' + !!F().clockWound);
      setTimeout(() => {
        try { drain(); window.__act('bigdoor'); document.title = 'AUTOTEST_DONE:' + state.scene; log('DONE scene=' + state.scene); }
        catch (e) { document.title = 'AUTOTEST_ERR:' + e.message; log('ERR ' + e.message); }
      }, 1300);
    } catch (e) { document.title = 'AUTOTEST_ERR:' + e.message; log('OUTER_ERR ' + e.message + e.stack); }
  }, 500);
} else if (location.search.includes('tour=')) {
  const tour = new URLSearchParams(location.search).get('tour');
  setTimeout(() => {
    try {
      startGame(true);
      let n = 0; while ((DIALOGS.length || showing) && n++ < 60) nextDialog();
      F().metDeer = true; F().towel = true; F().handle = true; F().kettleOff = true; F().stoveClosed = true; F().bedroomOpen = true;
      window.__goto(tour);
      setTimeout(() => { try { let m = 0; while ((DIALOGS.length || showing) && m++ < 60) nextDialog(); if (location.search.includes('peek')) togglePeek(); document.title = 'TOUR_READY'; } catch (e) { document.title = 'ERR:' + e.message; } }, 700);
    } catch (e) { document.title = 'ERR:' + e.message; }
  }, 400);
}
