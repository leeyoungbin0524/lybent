// auth.js - localStorage 기반 "가짜지만 작동하는" 인증
// ✅ 미리 만들어둘 관리자 계정(원하는 값으로 바꿔도 됨)
const PRESET_ADMIN = {
  email: "admin@lybent.com",
  password: "1234",
  name: "LYB Admin",
  isAdmin: true
};

function ensurePresetAdmin(){
  const users = readUsers();
  const exists = users.some(u => u.email === PRESET_ADMIN.email);

  if(!exists){
    users.push({
      id: "admin_lyb",
      name: PRESET_ADMIN.name,
      email: PRESET_ADMIN.email,
      password: PRESET_ADMIN.password,
      isAdmin: true
    });
    writeUsers(users);
  }
}


const USERS_KEY = "lyb_users_v1";
const SESSION_KEY = "lyb_session_v1";

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: user.email,
    name: user.name,
    isAdmin: !!user.isAdmin, 
    loggedInAt: Date.now()
  }));
}


function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> t.style.display="none", 1800);
}

// ===== 회원가입 =====
function bindSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const password2 = String(data.get("password2") || "");

    if (!name) return toast("이름을 입력해줘!");
    if (!isValidEmail(email)) return toast("이메일 형식이 아니야!");
    if (password.length < 4) return toast("비밀번호는 4자 이상으로 해줘!");
    if (password !== password2) return toast("비밀번호가 서로 달라!");

    const users = readUsers();
    if (users.some(u => u.email === email)) return toast("이미 가입된 이메일이야!");

    users.push({
      id: "u_" + Math.random().toString(16).slice(2),
      name,
      email,
      password // ⚠️ 실제 서비스면 절대 이렇게 저장하면 안 됨(지금은 데모)
    });

    writeUsers(users);
    toast("회원가입 완료! 로그인 페이지로 이동할게.");
    setTimeout(() => location.href = "login.html", 900);
  });
}

// ===== 로그인 =====
function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");

    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return toast("이메일 또는 비밀번호가 틀렸어!");

    setSession(user);
    toast(`환영해요, ${user.name}님!`);
    setTimeout(() => location.href = "index.html", 700);
  });
}

// ===== 로그아웃 버튼(선택) =====
function bindLogoutButton() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    clearSession();
    toast("로그아웃 완료!");
    setTimeout(() => location.href = "index.html", 600);
  });
}

function controlAdminOnlyUI(){
  const adminOnlyEls = document.querySelectorAll("[data-admin-only]");
  if(!adminOnlyEls.length) return;

  const s = getSession();
  const show = !!(s && s.isAdmin);

  adminOnlyEls.forEach(el => {
    el.style.display = show ? "" : "none";
  });
}


// ===== 로그인 상태 표시(선택) =====
function renderAuthStatus() {
  const el = document.getElementById("authStatus");
  if (!el) return;

  const s = getSession();
  if (!s) {
    el.innerHTML = `<a class="btn small" href="login.html">로그인</a>`;
    return;
  }

  el.innerHTML = `
    <span class="muted" style="font-weight:900;">${s.name}님</span>
    <button class="btn small danger" id="logoutBtn" type="button">로그아웃</button>
  `;
  bindLogoutButton();
}

document.addEventListener("DOMContentLoaded", () => {
  bindSignupForm();
  bindLoginForm();
  renderAuthStatus();
});

function controlAdminLink(){
  const adminLink = document.querySelector('a[href="admin.html"]');
  if(!adminLink) return;

  const session = JSON.parse(localStorage.getItem("lyb_session_v1") || "null");
  if(!session){
    adminLink.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  controlAdminLink();
  ensurePresetAdmin();
  bindSignupForm();
  bindLoginForm();
  renderAuthStatus();
  protectAdminPage();
  controlAdminOnlyUI();
});

function controlAdminLink(){
  const adminLink = document.querySelector('a[href="admin.html"]');
  if(!adminLink) return;

  const s = getSession();
  // 로그인 안 했거나, 관리자 아니면 숨김
  if(!s || !s.isAdmin){
    adminLink.style.display = "none";
  }else{
    adminLink.style.display = "";
  }
}

function protectAdminPage(){
  const isAdminPage = location.pathname.endsWith("admin.html");
  if(!isAdminPage) return;

  const s = getSession();
  if(!s || !s.isAdmin){
    toast("관리자만 접근할 수 있어!");
    setTimeout(()=> location.href = "login.html", 800);
  }
}
