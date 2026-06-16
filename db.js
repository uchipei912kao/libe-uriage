/* ============================================
   データアクセス層
   USE_SUPABASE が true  → Supabase（クラウドDB・複数端末同期）
   USE_SUPABASE が false → localStorage＋ダミーデータ（スマホ内のみ）
   アプリ側(app.js)はこの DB.* だけ呼べばよい。
   ============================================ */

const DB = (() => {

  let sb = null;
  function client() {
    if (!sb && USE_SUPABASE && window.supabase) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return sb;
  }

  /* ---------- 在庫 ---------- */
  async function getStock() {
    if (USE_SUPABASE) {
      const { data, error } = await client().from('stock_items').select('*').order('id');
      if (error) { console.warn('stock取得失敗', error); return localGetStock(); }
      return data;
    }
    return localGetStock();
  }
  async function upsertStock(item) {
    if (USE_SUPABASE) {
      const row = { name:item.name, sku:item.sku, cost:item.cost, price:item.price, qty:item.qty, updated_at:new Date().toISOString() };
      const c = client();
      // id があれば更新、無ければ新規追加（idは自動採番＝GENERATED ALWAYS のため明示指定しない）
      let res;
      if (item.id) res = await c.from('stock_items').update(row).eq('id', item.id);
      else         res = await c.from('stock_items').insert(row);
      if (res.error) console.warn('stock保存失敗', res.error);
      return;
    }
    localUpsertStock(item);
  }
  function localGetStock() {
    const s = localStorage.getItem('libe_stock');
    if (s) { try { return JSON.parse(s); } catch(e){} }
    return JSON.parse(JSON.stringify(typeof STOCK_ITEMS !== 'undefined' ? STOCK_ITEMS : []));
  }
  function localUpsertStock(item) {
    const arr = localGetStock();
    if (item._idx != null && item._idx >= 0) arr[item._idx] = item;
    else arr.push(item);
    localStorage.setItem('libe_stock', JSON.stringify(arr));
  }
  function localSaveStockAll(arr) { localStorage.setItem('libe_stock', JSON.stringify(arr)); }

  /* ---------- 売れたもの ---------- */
  async function getSold() {
    if (USE_SUPABASE) {
      const { data, error } = await client().from('sold_items').select('*').order('date', { ascending:false });
      if (error) { console.warn('sold取得失敗', error); return localGetSold(); }
      // DBのカラム名 → アプリの形に整形
      return data.map(r => ({ id:r.id, name:r.name, orderNo:r.order_no, date:fmtDate(r.date), price:r.price, cost:r.cost, shipping:r.shipping||0, point:r.point, qty:r.qty, stock:r.stock||0, status:r.status }));
    }
    return localGetSold();
  }
  // 売れたもの1件の項目を更新（送料の手入力など）
  async function updateSold(id, fields) {
    if (USE_SUPABASE) {
      const { error } = await client().from('sold_items').update(fields).eq('id', id);
      if (error) console.warn('sold更新失敗', error);
    }
  }
  function localGetSold() {
    return JSON.parse(JSON.stringify(typeof SOLD_ITEMS !== 'undefined' ? SOLD_ITEMS : []));
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n)=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /* ---------- 月別手動入力 ---------- */
  async function getManual(period) {
    if (USE_SUPABASE) {
      const { data, error } = await client().from('monthly_manual').select('*').eq('period', period).maybeSingle();
      if (error) { console.warn('manual取得失敗', error); return localGetManual(period); }
      if (data) return { shipping:data.shipping, fee:data.fee, point:data.point, other:data.other, refund:data.refund };
    }
    return localGetManual(period);
  }
  async function saveManual(period, m) {
    if (USE_SUPABASE) {
      const { error } = await client().from('monthly_manual').upsert({ period, ...m, updated_at:new Date().toISOString() });
      if (error) console.warn('manual保存失敗', error);
      return;
    }
    localStorage.setItem('libe_manual_' + period, JSON.stringify(m));
  }
  function localGetManual(period) {
    const s = localStorage.getItem('libe_manual_' + period);
    if (s) { try { return JSON.parse(s); } catch(e){} }
    // 未入力なら0（旧ダミー経費は使わない）
    return { shipping:0, fee:0, point:0, other:0, refund:0 };
  }

  return {
    mode: USE_SUPABASE ? 'supabase' : 'local',
    getStock, upsertStock, localSaveStockAll,
    getSold, updateSold,
    getManual, saveManual,
  };
})();
