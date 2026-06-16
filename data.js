/* ===== ダミーデータ =====
   次回 Supabase / Chrome拡張連携で、ここを実データに差し替える。
   形式は本番でもこの構造を踏襲する。 */

// 売れたもの（販売履歴）
const SOLD_ITEMS = [
  { name: "レノア オードリュクス 香り付けビーズ マインドフルネス サンデー 詰め替え 855mL ×1袋", orderNo: "01KTV58F4GFMQ3788APE6HH3E1", date: "2026-06-16 00:40", price: 1200, cost: 760, shipping: 0, point: 0, qty: 1, stock: 18, status: "受取完了" },
  { name: "Oral-B 歯ブラシ 歯ぐきケア 超高密度 ×2本", orderNo: "01KTV3744599X843842", date: "2026-06-16 00:21", price: 1980, cost: 980, shipping: 0, point: 0, qty: 2, stock: 9, status: "発送済み" },
  { name: "Razer Viper V2 Pro (Black Edition) ゲーミングマウス 超軽量 58g", orderNo: "01KTV6561624X299046", date: "2026-06-15 23:17", price: 18500, cost: 14200, shipping: 0, point: 0, qty: 1, stock: 3, status: "受取完了" },
  { name: "ハミングフレア リラックスラベンダー&ジャスミン詰め替え大容量2430ml ×1袋", orderNo: "01KTV8507353X061436", date: "2026-06-15 21:45", price: 1480, cost: 920, shipping: 0, point: 0, qty: 1, stock: 12, status: "発送済み" },
  { name: "ブラウン 電動歯ブラシ オーラルB iO2 防水", orderNo: "01KTV9912345X778899", date: "2026-06-15 19:02", price: 8900, cost: 6100, shipping: 0, point: 0, qty: 1, stock: 5, status: "受取完了" },
  { name: "レノア オードリュクス 香り付け専用ビーズ マインドフルネス リラックス 詰替 855ml ×2袋", orderNo: "01KTV1122334X556677", date: "2026-06-15 15:30", price: 2400, cost: 1520, shipping: 0, point: 0, qty: 2, stock: 7, status: "発送済み" },
];

// 在庫（商品マスタ）
const STOCK_ITEMS = [
  { name: "レノア オードリュクス ビーズ マインドフルネス サンデー 855mL", sku: "LN-SUN-855", cost: 760, price: 1200, qty: 18 },
  { name: "Oral-B 歯ブラシ 歯ぐきケア 超高密度", sku: "ORB-GUM-2", cost: 980, price: 1980, qty: 9 },
  { name: "Razer Viper V2 Pro ゲーミングマウス", sku: "RZ-VP2", cost: 14200, price: 18500, qty: 3 },
  { name: "ハミングフレア ラベンダー&ジャスミン 2430ml", sku: "HM-LV-2430", cost: 920, price: 1480, qty: 12 },
  { name: "ブラウン オーラルB iO2 電動歯ブラシ", sku: "BR-IO2", cost: 6100, price: 8900, qty: 2 },
  { name: "レノア オードリュクス リラックス 855ml", sku: "LN-RLX-855", cost: 760, price: 1200, qty: 7 },
];

// 今日・今月の集計（ダミー）
const SUMMARY = {
  todaySales: 9591,
  todayCount: 4,
  todayProfit: 3538,
  monthSales: 3193448,
  vsPrevMonth: 16.9,
  vsPrevYear: 58.1,
  monthBreakdown: {
    count: 1269,
    sales: 3151467,
    cost: 1727460,
    shipping: 4500,
    fee: 315146,
    point: 1760,
    other: 101900,
    refund: 11629,
    profit: 672800,
    rate: 21.3,
  },
  // 日別累計売上（今月・先月）グラフ用
  chartNow: [120000,310000,480000,650000,820000,990000,1150000,1320000,1500000,1680000,1850000,2000000,2150000,2300000,2450000,2600000,2750000,2900000,3050000,3193448],
  chartPrev: [100000,260000,420000,580000,720000,860000,1000000,1140000,1280000,1420000,1560000,1700000,1840000,1980000,2120000,2260000,2400000,2540000,2680000,2730000],
  period: "2026年6月",
};
