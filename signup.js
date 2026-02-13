// signup.js
window.addEventListener("DOMContentLoaded", () => {
  const sb = window.supabaseClient;
  const msg = document.getElementById("msg");

  const nameEl = document.getElementById("name");
  const phoneEl = document.getElementById("phone");
  const emailEl = document.getElementById("email");
  const pwEl = document.getElementById("password");
  const btn = document.getElementById("createBtn");

  function setMsg(t){ if (msg) msg.textContent = t || ""; }

  if (!sb) {
    setMsg("❌ supabaseClient 없음. (supabase-client.js / supabase-js 로드 확인)");
    return;
  }

  btn?.addEventListener("click", async () => {
    const name = (nameEl?.value || "").trim();
    const phone = (phoneEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();
    const password = (pwEl?.value || "");

    if (!name) return setMsg("❌ 이름을 입력해줘");
    if (!phone) return setMsg("❌ 전화번호를 입력해줘");
    if (!email) return setMsg("❌ 이메일을 입력해줘");
    if (password.length < 6) return setMsg("❌ 비밀번호는 6자 이상 권장");

    setMsg("⏳ 회원가입 중...");

    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            phone: phone
          }
        }
      });

      if (error) {
        setMsg("❌ 회원가입 실패: " + error.message);
        return;
      }

      // 이메일 인증 켜져 있으면 session이 null일 수 있음
      if (!data.session) {
        setMsg("✅ 가입 완료! 이메일 인증 후 로그인해줘.");
        setTimeout(() => location.href = "login.html", 1200);
        return;
      }

      setMsg("✅ 가입 성공! 로그인 페이지로 이동합니다...");
      setTimeout(() => location.href = "login.html", 700);

    } catch (e) {
      console.error(e);
      setMsg("❌ 예외: " + (e?.message || String(e)));
    }
  });
});