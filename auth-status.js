// auth-status.js
// ✅ 공통 Auth 상태 표시 + 로그인 버튼 표시(이름/Account) + (옵션) Admin 버튼 표시
// - window.supabaseClient 사용 (supabase-client.js에서 1번만 생성)
// - AbortError(페이지 전환/리로드 등)는 조용히 무시

(function () {
  const sb = window.supabaseClient;
  if (!sb) {
    console.warn("[auth-status] supabaseClient missing");
    return;
  }

  const authEls = Array.from(document.querySelectorAll("#authStatus"));
  const accountBtn = document.getElementById("accountBtn");
  const adminBtn = document.getElementById("adminBtn");

  function setAuthText(t) {
    authEls.forEach(el => { if (el) el.textContent = t; });
  }

  function nameFromEmail(email){
    if(!email) return "Account";
    return (email.split("@")[0] || "Account");
  }

  async function checkIsAdmin(userId){
    if(!adminBtn) return false;
    try{
      const { data, error } = await sb
        .from("admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return false;
      return !!data;
    }catch(e){
      if (String(e?.name) === "AbortError") return false;
      return false;
    }
  }

  async function refresh() {
    try {
      const { data: { session }, error } = await sb.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        const email = session.user.email || "";
        const dn = (session.user.user_metadata?.display_name || "").trim();
        const label = dn || nameFromEmail(email);

        setAuthText("Auth: ON");
        if (accountBtn) {
          accountBtn.textContent = label;
          accountBtn.href = "account.html";
          accountBtn.style.display = "block";
        }

        if (adminBtn) {
          adminBtn.style.display = "none";
          const ok = await checkIsAdmin(session.user.id);
          if (ok) {
            adminBtn.style.display = "block";
            adminBtn.href = "admin.html";
          }
        }
      } else {
        setAuthText("Auth: OFF");
        if (accountBtn) {
          accountBtn.textContent = "Login";
          accountBtn.href = "login.html";
          accountBtn.style.display = "block";
        }
        if (adminBtn) adminBtn.style.display = "none";
      }
    } catch (e) {
      if (String(e?.name) === "AbortError") return; // 페이지 이동/리로드 등
      console.warn("[auth-status] exception:", e);
      setAuthText("Auth: ERR");
    }
  }

  // 최초 1회 + 이벤트 구독
  refresh();

  sb.auth.onAuthStateChange(() => {
    refresh();
  });

  // 백업용: 아주 가끔(60초)만 갱신
  setInterval(refresh, 60000);
})();
