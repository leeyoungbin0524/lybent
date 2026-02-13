// audition-submit.js (REST insert: getSession 안 씀 / 멈춤 해결)
(function () {
  const msgEl = document.getElementById("audMsg");
  const form = document.getElementById("auditionForm");

  const SUPABASE_URL = "https://tbrpjpkklhbbuwdhqpsw.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicnBqcGtrbGhiYnV3ZGhxcHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODgxNTAsImV4cCI6MjA4NjM2NDE1MH0.5W-wXOsX5b1uyygAxZSLwVEFAh-lPRuZT-_0WDaEFSc";
  const PROJECT_REF = "tbrpjpkklhbbuwdhqpsw";

  const $ = (id) => document.getElementById(id);

  function setMsg(t) {
    if (msgEl) msgEl.textContent = t || "";
  }

  function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  // ✅ supabase auth token(localStorage)에서 세션 직접 꺼내기
  function readSessionFromStorage() {
    try {
      // 보통: sb-<ref>-auth-token
      const exactKey = `sb-${PROJECT_REF}-auth-token`;
      const rawExact = localStorage.getItem(exactKey);
      if (rawExact) return JSON.parse(rawExact);

      // 혹시 키가 다르면 유사키 탐색
      const keys = Object.keys(localStorage);
      const k = keys.find(x => x.includes(`sb-${PROJECT_REF}`) && x.endsWith("-auth-token"));
      if (!k) return null;
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("[audition] readSessionFromStorage failed:", e);
      return null;
    }
  }

  async function insertAudition(payload, accessToken) {
    const url = `${SUPABASE_URL}/rest/v1/Audition`;

    const headers = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      // RLS 켜져있으면 Authorization 필요
      ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      // insert 결과를 받고 싶으면 Prefer 사용 가능
      "Prefer": "return=representation"
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify([payload])
    });

    const text = await res.text(); // 에러 메시지 확인 위해 text로 받기
    if (!res.ok) {
      throw new Error(`REST insert failed (${res.status}): ${text}`);
    }

    // return=representation 이면 JSON 배열이 온다
    try { return JSON.parse(text); } catch { return text; }
  }

  if (!form) return;

  // 중복 바인딩 방지
  if (window.__lyb_audition_bound_rest) return;
  window.__lyb_audition_bound_rest = true;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      setMsg("⏳ 제출 준비중... (세션 읽기)");

      const sess = readSessionFromStorage();
      const accessToken = sess?.access_token || "";
      const userId = sess?.user?.id || "";

      if (!accessToken || !userId) {
        setMsg("❌ 로그인 세션을 찾을 수 없어요. 다시 로그인 후 시도해줘.");
        return;
      }

      const name = ($("a_name")?.value || "").trim();
      const phone = ($("a_phone")?.value || "").trim();
      const position = ($("a_position")?.value || "").trim();
      const video_link = ($("a_video")?.value || "").trim();
      const message = ($("a_message")?.value || "").trim();

      if (!name || !phone) {
        setMsg("❌ 이름/전화번호는 필수입니다.");
        return;
      }

      setMsg("⏳ 제출중... (DB 저장)");

      const payload = {
        user_id: userId,
        name,
        phone,
        position,
        video_link,
        message
      };

      const data = await withTimeout(
        insertAudition(payload, accessToken),
        12000,
        "insert(Audition)"
      );

      setMsg("✅ 지원 완료! DB에 저장되었습니다.");
      form.reset();

      console.log("[audition] inserted:", data);

    } catch (err) {
      console.error("[audition] exception:", err);
      setMsg("❌ 저장 실패: " + (err?.message || err));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  console.log("[audition-submit] bound (REST)");
})();