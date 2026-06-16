/* ============================================
   Supabase 接続設定
   帰宅後、Supabaseの「Project Settings → API」から
   下の2つをコピペするだけ：
     - Project URL      → SUPABASE_URL
     - anon public key  → SUPABASE_ANON_KEY
   未設定（空のまま）なら、自動でダミーデータ＋スマホ内保存モードで動く。
   ============================================ */

const SUPABASE_URL = "https://xuztjtylgizuphvpfrld.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__MyLkume5uG60Vlak2QE-Q_cGJ4W47X";

const USE_SUPABASE = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
