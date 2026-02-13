// login.js (STABLE v2 - DOM ready safe + AbortError retry)
(function () {
  const sb = window.supabaseClient;
  const msgEl = document.getElementById("msg");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  function setMsg(t) {
    if (msgEl) msgEl.textContent = t || "";
  }

  // DOMContentLoaded가 이미 지난 경우에도 동작하도록
  function onReady(fn) {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  if (!sb) {
    setMsg("❌ supabaseClient가 없습니다. (supabase-client.js 로드 순서 확인)");
    console.error("[login] no supabaseClient");
    return;
  }

  // ✅ 중복 바인딩 방지 (Live Server 리로드/스크립트 중복 로드 대비)
  if (window.__lyb_login_bound) return;
  window.__lyb_login_bound = true;

  // AbortError(요청 취소) 안전 재시도
  async function withAbortRetry(fn, { retries = 2, delayMs = 350 } = {}) {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        const isAbort = (e && e.name === "AbortError") || String(e?.message || "").includes("signal is aborted");
        if (!isAbort || i === retries) throw e;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  }

  async function refreshUI() {
    try {
      const { data: { session } } = await withAbortRetry(() => sb.auth.getSession());
      if (logoutBtn) logoutBtn.style.display = session ? "inline-block" : "none";
    } catch (e) {
      console.warn("[login] getSession failed:", e);
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  }

  async function doLogin() {
    const email = (document.getElementById("email")?.value || "").trim();
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      setMsg("❌ 이메일/비밀번호를 입력해줘");
      return;
    }

    if (loginBtn) loginBtn.disabled = true;
    if (signupBtn) signupBtn.disabled = true;
    setMsg("⏳ 로그인 중...");

    try {
      const { data, error } = await withAbortRetry(
        () => sb.auth.signInWithPassword({ email, password }),
        { retries: 2, delayMs: 450 }
      );

      if (error) {
        setMsg("❌ 로그인 실패: " + error.message);
        return;
      }

      const ok = !!data?.session;
      setMsg(ok ? "✅ 로그인 성공! 메인으로 이동합니다..." : "✅ 로그인됨. 메인으로 이동합니다...");

      await refreshUI();

      setTimeout(() => {
        location.href = "index.html";
      }, 350);

    } catch (e) {
      console.error("[login] exception:", e);
      setMsg("❌ 로그인 중 예외: " + (e?.message || e));
    } finally {
      if (loginBtn) loginBtn.disabled = false;
      if (signupBtn) signupBtn.disabled = false;
    }
  }

  async function doSignup() {
    const email = (document.getElementById("email")?.value || "").trim();
    const password = document.getElementById("password")?.value || "";

    if (!email || !password) {
      setMsg("❌ 이메일/비밀번호를 입력해줘");
      return;
    }

    if (signupBtn) signupBtn.disabled = true;
    if (loginBtn) loginBtn.disabled = true;
    setMsg("⏳ 회원가입 중...");

    try {
      const { error } = await withAbortRetry(
        () => sb.auth.signUp({ email, password }),
        { retries: 2, delayMs: 450 }
      );

      if (error) {
        setMsg("❌ 회원가입 실패: " + error.message);
        return;
      }

      setMsg("✅ 회원가입 완료! 이제 로그인해줘.");
      await refreshUI();

    } catch (e) {
      console.error("[signup] exception:", e);
      setMsg("❌ 회원가입 중 예외: " + (e?.message || e));
    } finally {
      if (signupBtn) signupBtn.disabled = false;
      if (loginBtn) loginBtn.disabled = false;
    }
  }

  async function doLogout() {
    setMsg("⏳ 로그아웃 중...");
    try {
      await withAbortRetry(() => sb.auth.signOut(), { retries: 1, delayMs: 300 });
      await refreshUI();
      setMsg("✅ 로그아웃 완료");
    } catch (e) {
      setMsg("❌ 로그아웃 실패: " + (e?.message || e));
    }
  }

  onReady(() => {
    loginBtn?.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
    signupBtn?.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });
    logoutBtn?.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
    refreshUI();
    console.log("[login] ready");
  });
})();