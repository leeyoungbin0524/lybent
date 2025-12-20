const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

// 모바일 메뉴 토글
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});

// 오디션 폼 → 이메일 보내기 (메일앱 열기)
const form = document.getElementById("auditionForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = data.get("name");
  const contact = data.get("contact");
  const field = data.get("field");
  const message = data.get("message");

  const subject = encodeURIComponent(`[LYB 오디션 지원] ${name} / ${field}`);
  const body = encodeURIComponent(
`이름: ${name}
연락처/이메일: ${contact}
지원분야: ${field}

소개:
${message}

(첨부파일은 이 메일에 답장으로 보내주세요.)`
  );

  // 여기 이메일만 너 회사 이메일로 바꾸면 됨
  window.location.href = `mailto:info@celebrityagency.com?subject=${subject}&body=${body}`;
});
