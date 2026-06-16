/* ===== リベ市場 売上管理アプリ ロジック ===== */

const yen = (n) => '¥' + Math.round(n).toLocaleString('ja-JP');
const $ = (id) => document.getElementById(id);

/* ---- データ（DB層 経由：Supabase未設定ならスマホ内＋ダミー） ---- */
let stock   = [];    // 在庫
let sold    = [];    // 売れたもの
let manual  = null;  // 月別手動入力（送料・手数料 等）
let summary = null;  // 売上集計（sold から計算した実データ）

function getPeriod() { const n = new Date(); return `${n.getFullYear()}年${n.getMonth()+1}月`; }

async function reloadStock()  { stock  = await DB.getStock(); }
async function reloadSold()   { sold   = await DB.getSold(); summary = computeSummary(sold); }
async function reloadManual() { manual = await DB.getManual(getPeriod()); }

/* ローカルモード時の在庫保存（DBモードは upsert を使う） */
function saveStockLocal() { if (DB.mode === 'local') DB.localSaveStockAll(stock); }

/* ===== 売れたものデータから売上集計を計算 ===== */
function computeSummary(soldArr) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const curYM    = `${now.getFullYear()}-${pad(now.getMonth()+1)}`;
  const prevD    = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevYM   = `${prevD.getFullYear()}-${pad(prevD.getMonth()+1)}`;
  const prevYrYM = `${now.getFullYear()-1}-${pad(now.getMonth()+1)}`;

  const daysCur  = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysPrev = new Date(prevD.getFullYear(), prevD.getMonth()+1, 0).getDate();
  const dailyNow  = new Array(daysCur).fill(0);
  const dailyPrev = new Array(daysPrev).fill(0);

  let todaySales=0, todayCount=0, todayProfit=0;
  let monthSales=0, monthCount=0, monthCost=0;
  let prevMonthSales=0, prevYearSales=0;

  (soldArr || []).forEach(it => {
    const ds = String(it.date || '');
    const datePart = ds.slice(0, 10);      // YYYY-MM-DD
    const itYM = datePart.slice(0, 7);     // YYYY-MM
    const day  = parseInt(datePart.slice(8, 10), 10);
    const rev  = (it.price||0) * (it.qty||0);
    const cst  = (it.cost||0)  * (it.qty||0);
    const prof = rev - cst - (it.point||0);

    if (datePart === todayStr) { todaySales+=rev; todayCount+=(it.qty||0); todayProfit+=prof; }
    if (itYM === curYM)  { monthSales+=rev; monthCount+=(it.qty||0); monthCost+=cst; if (day>=1&&day<=daysCur)  dailyNow[day-1]+=rev; }
    if (itYM === prevYM) { prevMonthSales+=rev; if (day>=1&&day<=daysPrev) dailyPrev[day-1]+=rev; }
    if (itYM === prevYrYM) { prevYearSales+=rev; }
  });

  const cumulative = (arr) => { let s=0; return arr.map(v => s+=v); };
  const chartNow  = cumulative(dailyNow).slice(0, now.getDate()); // 今日まで
  const chartPrev = cumulative(dailyPrev);

  return {
    todaySales, todayCount, todayProfit,
    monthSales,
    vsPrevMonth: prevMonthSales>0 ? (monthSales-prevMonthSales)/prevMonthSales*100 : 0,
    vsPrevYear:  prevYearSales>0  ? (monthSales-prevYearSales)/prevYearSales*100   : 0,
    hasPrevMonth: prevMonthSales>0,
    hasPrevYear:  prevYearSales>0,
    monthBreakdown: { count: monthCount, sales: monthSales, cost: monthCost },
    chartNow:  chartNow.length  ? chartNow  : [0],
    chartPrev: chartPrev.length ? chartPrev : [0],
    period: getPeriod(),
  };
}

/* ===== ダッシュボード描画 ===== */
function renderDashboard() {
  const now = new Date();
  const days = ['日','月','火','水','木','金','土'];
  $('today-date').textContent =
    `${now.getFullYear()}年${String(now.getMonth()+1).padStart(2,'0')}月${String(now.getDate()).padStart(2,'0')}日（${days[now.getDay()]}）`;

  const s = summary || computeSummary(sold);
  $('d-sales').textContent = yen(s.todaySales);
  $('d-count').textContent = s.todayCount;
  $('d-profit').textContent = yen(s.todayProfit);

  $('m-sales').textContent = yen(s.monthSales);
  setCompare('m-vs-prev', s.vsPrevMonth, s.hasPrevMonth);
  setCompare('m-vs-year', s.vsPrevYear, s.hasPrevYear);

  // 在庫情報（保存された在庫から再計算）
  const totalQty = stock.reduce((s,i)=> s + (i.qty||0), 0);
  const sellVal  = stock.reduce((s,i)=> s + (i.qty||0)*(i.price||0), 0);
  const costVal  = stock.reduce((s,i)=> s + (i.qty||0)*(i.cost||0), 0);
  $('s-count').textContent = totalQty.toLocaleString('ja-JP') + 'コ';
  $('s-sell').textContent  = yen(sellVal);
  $('s-cost').textContent  = yen(costVal);
  // 販売率（今月売れた数 ÷（今月売れた数＋現在庫数））
  const soldQty = s.monthBreakdown.count;
  const turnover = (soldQty + totalQty) > 0 ? Math.round(soldQty / (soldQty + totalQty) * 100) : 0;
  $('turnover-ring').style.setProperty('--p', turnover + '%');
  $('turnover-val').textContent = turnover + '%';
}

function setCompare(id, val, hasData) {
  const el = $(id);
  if (hasData === false) { el.textContent = '―'; el.className = 'cmp-v'; return; }
  const up = val >= 0;
  el.textContent = Math.abs(val).toFixed(1) + '%' + (up ? '↑' : '↓');
  el.className = 'cmp-v ' + (up ? 'up' : 'down');
}

/* ===== 月間売上（手動入力対応） ===== */
const MANUAL_FIELDS = ['shipping','fee','point','other','refund'];
const FIELD_LABELS = { shipping:'送料', fee:'販売手数料', point:'ポイント', other:'その他経費', refund:'返金' };

function manualFallback() {
  return { shipping: 0, fee: 0, point: 0, other: 0, refund: 0 };
}

function renderMonthly() {
  const s = summary || computeSummary(sold);
  const b = s.monthBreakdown;
  const m = manual || manualFallback();

  $('period-text').textContent = s.period;
  $('bd-count').textContent  = b.count.toLocaleString('ja-JP') + 'コ';
  $('bd-sales').textContent  = yen(b.sales);
  $('bd-cost').textContent   = '-' + yen(b.cost);
  $('bd-ship').textContent   = yen(m.shipping);
  $('bd-fee').textContent    = '-' + yen(m.fee);
  $('bd-point').textContent  = '-' + Math.round(m.point).toLocaleString('ja-JP') + 'pt';
  $('bd-other').textContent  = '-' + yen(m.other);
  $('bd-refund').textContent = '-' + yen(m.refund);

  // 利益額＝売上＋送料－仕入－手数料－ポイント－その他－返金
  const profit = b.sales + m.shipping - b.cost - m.fee - m.point - m.other - m.refund;
  const rate = b.sales > 0 ? (profit / b.sales * 100) : 0;
  $('bd-profit').textContent = yen(profit);
  $('bd-rate').textContent   = rate.toFixed(1) + '%';
}

async function editManualField(field) {
  const m = manual || manualFallback();
  const label = FIELD_LABELS[field];
  const unit = field === 'point' ? 'pt' : '円';
  const cur = m[field];
  const input = prompt(`${label}を入力（${unit}）`, cur);
  if (input === null) return; // キャンセル
  const val = Number(String(input).replace(/[,，\s¥￥]/g, ''));
  if (isNaN(val)) { alert('数字を入力してください'); return; }
  m[field] = val;
  manual = m;
  await DB.saveManual(getPeriod(), m);
  renderMonthly();
}

/* ===== 売れたもの ===== */
function renderSold() {
  const list = $('sold-list');
  list.innerHTML = '';
  sold.forEach(it => {
    const gross = it.price * it.qty - it.cost * it.qty - it.point;
    const card = document.createElement('div');
    card.className = 'sold-card';
    card.innerHTML = `
      <span class="sold-badge">${it.status}</span>
      <div class="sold-name">${esc(it.name)}</div>
      <div class="sold-meta">注文番号 ${esc(it.orderNo)}<br>注文日 ${esc(it.date)}</div>
      <div class="sold-grid">
        <div class="k">商品価格</div><div class="v">${yen(it.price)}</div>
        <div class="k">仕入価格</div><div class="v">${yen(it.cost)}</div>
        <div class="k">売れた個数</div><div class="v">${it.qty}</div>
        <div class="k">在庫</div><div class="v">${it.stock}</div>
        <div class="k">粗利</div><div class="v profit">${yen(gross)}</div>
      </div>`;
    list.appendChild(card);
  });
}

/* ===== 在庫 ===== */
function renderStock(filter) {
  const wrap = $('stock-items');
  wrap.innerHTML = '';
  const f = (filter || '').trim();
  stock.forEach((it, idx) => {
    if (f && it.name.indexOf(f) === -1 && (it.sku||'').indexOf(f) === -1) return;
    const card = document.createElement('div');
    card.className = 'stock-card';
    const low = (it.qty||0) <= 3;
    card.innerHTML = `
      <div class="info">
        <div class="sname">${esc(it.name)}</div>
        <div class="sdetail">SKU: ${esc(it.sku||'-')}<br>原価 ${yen(it.cost)} / 売価 ${yen(it.price)}</div>
      </div>
      <div class="qty-badge ${low?'low':''}">${it.qty}<span style="font-size:11px;">コ</span></div>`;
    card.addEventListener('click', () => openModal(idx));
    wrap.appendChild(card);
  });
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ===== 在庫モーダル ===== */
let editingIdx = -1;
function openModal(idx) {
  editingIdx = (idx === undefined) ? -1 : idx;
  const it = editingIdx >= 0 ? stock[editingIdx] : { name:'', sku:'', cost:'', price:'', qty:'' };
  $('f-name').value  = it.name;
  $('f-sku').value   = it.sku;
  $('f-cost').value  = it.cost;
  $('f-price').value = it.price;
  $('f-qty').value   = it.qty;
  $('stock-modal').hidden = false;
}
function closeModal() { $('stock-modal').hidden = true; }
async function saveModal() {
  const obj = {
    name:  $('f-name').value.trim(),
    sku:   $('f-sku').value.trim(),
    cost:  Number($('f-cost').value) || 0,
    price: Number($('f-price').value) || 0,
    qty:   Number($('f-qty').value) || 0,
  };
  if (!obj.name) { alert('商品名を入力してください'); return; }
  if (editingIdx >= 0) {
    obj.id = stock[editingIdx] && stock[editingIdx].id; // DBモードで更新を判定
    stock[editingIdx] = obj;
  } else {
    stock.push(obj);
  }
  saveStockLocal();
  await DB.upsertStock(obj);
  if (DB.mode === 'supabase') await reloadStock(); // 採番されたidを反映
  closeModal();
  renderStock($('stock-search').value);
  renderDashboard();
}

/* ===== グラフ ===== */
let chart;
function renderChart() {
  const ctx = $('salesChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (chart) chart.destroy();
  const s = summary || computeSummary(sold);
  const len = Math.max(s.chartNow.length, s.chartPrev.length);
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: len}, (_,i)=> i+1),
      datasets: [
        { label:'今月', data: s.chartNow, borderColor:'#185FA5', backgroundColor:'#185FA5', borderWidth:2.5, tension:0.3, pointRadius:0 },
        { label:'先月', data: s.chartPrev, borderColor:'#EF9F27', borderWidth:1.5, borderDash:[5,4], tension:0.3, pointRadius:0 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        y:{ ticks:{ callback:(v)=> v>=1000000 ? (v/1000000).toFixed(1)+'M' : (v>=1000 ? Math.round(v/1000)+'K' : v), font:{size:10}, color:'#9AA4B0' }, grid:{ color:'#EEF1F5' } },
        x:{ ticks:{ font:{size:9}, color:'#9AA4B0', maxTicksLimit:8 }, grid:{ display:false } }
      }
    }
  });
}

/* ===== ナビゲーション ===== */
const SCREEN_TITLES = { home:'ホーム', stock:'在庫管理', sold:'売れたもの' };
function showScreen(name) {
  ['home','stock','sold'].forEach(s => { $('screen-'+s).hidden = (s !== name); });
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  $('header-title').textContent = SCREEN_TITLES[name];
  if (name === 'home') renderChart();
  if (name === 'sold') renderSold();
  if (name === 'stock') renderStock($('stock-search').value);
}

/* ===== イベント ===== */
async function init() {
  // データ読み込み（Supabase or スマホ内＋ダミー）
  try {
    await Promise.all([reloadStock(), reloadSold(), reloadManual()]);
  } catch (e) {
    console.warn('データ読込でエラー。ローカルにフォールバック', e);
  }

  renderDashboard();
  renderMonthly();
  renderChart();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      $('tab-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'dashboard') renderChart();
    });
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });

  // 月間売上：編集可能な行をタップで入力
  document.querySelectorAll('.breakdown tr.editable').forEach(row => {
    row.addEventListener('click', () => editManualField(row.dataset.field));
  });

  $('btn-add-stock').addEventListener('click', () => openModal());
  $('f-cancel').addEventListener('click', closeModal);
  $('f-save').addEventListener('click', saveModal);
  $('stock-search').addEventListener('input', (e) => renderStock(e.target.value));
  $('stock-modal').addEventListener('click', (e) => { if (e.target.id === 'stock-modal') closeModal(); });
}

document.addEventListener('DOMContentLoaded', init);
