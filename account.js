// account.js
// ✅ 계정 설정 페이지 전용 스크립트 (이름/비번 변경 + 로그아웃)
// - window.supabaseClient 사용 (supabase-client.js에서 1번만 생성)
// - 로그인 안돼있으면 login.html로 이동

(function () {
  const sb = window.supabaseClient;
  if (!sb) {
    alert("supabaseClient not found. (supabase-client.js 확인)");
    return;
  }

  const emailEl = document.getElementById("accountEmail");
  const msgEl = document.getElementById("accountMsg");
  const nameInput = document.getElementById("displayName");
  const pwInput = document.getElementById("newPassword");

  const saveNameBtn = document.getElementById("saveNameBtn");
  const savePwBtn = document.getElementById("savePwBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  function setMsg(t) {
    if (msgEl) msgEl.textContent = t || "";
  }

  async function requireLogin() {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) {
      setMsg("❌ 세션 확인 실패: " + error.message);
      return null;
    }
    if (!session) {
      location.href = "login.html?next=account.html";
      return null;
    }
    return session;
  }

  (async () => {
    const session = await requireLogin();
    if (!session) return;

    const email = session.user?.email || "—";
    if (emailEl) emailEl.textContent = "email: " + email;

    const currentName = session.user?.user_metadata?.display_name || "";
    if (nameInput) nameInput.value = currentName;

    setMsg("로그인됨. 여기서 계정 설정을 변경할 수 있어.");
  })();

  saveNameBtn?.addEventListener("click", async () => {
    const session = await requireLogin();
    if (!session) return;

    const displayName = (nameInput?.value || "").trim();
    const { error } = await sb.auth.updateUser({
      data: { display_name: displayName }
    });

    if (error) {
      setMsg("❌ 이름 저장 실패: " + error.message);
      return;
    }
    setMsg("✅ 이름 저장 완료");
  });

  savePwBtn?.addEventListener("click", async () => {
    const session = await requireLogin();
    if (!session) return;

    const newPw = (pwInput?.value || "").trim();
    if (newPw.length < 6) {
      setMsg("❌ 비밀번호는 6자 이상 추천");
      return;
    }

    const { error } = await sb.auth.updateUser({ password: newPw });
    if (error) {
      setMsg("❌ 비밀번호 변경 실패: " + error.message);
      return;
    }
    if (pwInput) pwInput.value = "";
    setMsg("✅ 비밀번호 변경 완료");
  });

  logoutBtn?.addEventListener("click", async () => {
  setMsg("⏳ 로그아웃 중...");

  // 1) signOut 요청은 보내되 "기다리지 않음"
  try { sb.auth.signOut(); } catch (e) {}

  // 2) 혹시 남아있는 supabase auth 캐시도 제거(안전빵)
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.includes("supabase") || k.includes("sb-") || k.includes("auth-token")) {
        localStorage.removeItem(k);
      }
    });
    Object.keys(sessionStorage).forEach(k => {
      if (k.includes("supabase") || k.includes("sb-") || k.includes("auth-token")) {
        sessionStorage.removeItem(k);
      }
    });
  } catch (e) {}

  // 3) 바로 메인으로 이동 (멈춤 현상 방지)
  location.replace("index.html");
});
})();
