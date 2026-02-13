// supabase-client.js (STABLE v2)
// ✅ 사이트 전체에서 supabaseClient 1개만 사용
// ✅ autoRefreshToken 켜서 세션이 갑자기 풀리는 현상 줄임

(function () {
  if (!window.supabase) {
    console.error("[supabase-client] supabase-js not loaded");
    return;
  }

  const SUPABASE_URL = "https://tbrpjpkklhbbuwdhqpsw.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicnBqcGtrbGhiYnV3ZGhxcHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODgxNTAsImV4cCI6MjA4NjM2NDE1MH0.5W-wXOsX5b1uyygAxZSLwVEFAh-lPRuZT-_0WDaEFSc";

  if (window.supabaseClient) {
    console.log("[supabase-client] already exists");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,     // ✅ 안정적으로 유지
      detectSessionInUrl: false
    }
  });

  console.log("[supabase-client] client ready (stable v2)");
})();