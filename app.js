function updateLogo(){
  const isDark = document.body.classList.contains("dark");
  const logoPath = isDark ? "LYB LOGO FULL WHITE.png" : "LYB LOGO FULL DARK.png";

  ["logo-desktop","logo-mobile","logo-drawer"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.src = logoPath;
  });
}

function setTheme(theme){
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
  updateLogo();
}

function toggleTheme(){
  setTheme(document.body.classList.contains("dark") ? "light" : "dark");
}

function openDrawer(){
  const overlay = document.getElementById("overlay");
  const drawer = document.getElementById("drawer");
  if(!overlay || !drawer) return;

  overlay.classList.add("open");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

function closeDrawer(){
  const overlay = document.getElementById("overlay");
  const drawer = document.getElementById("drawer");
  if(!overlay || !drawer) return;

  overlay.classList.remove("open");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

function tick(){
  const d = new Date();
  const p = n => String(n).padStart(2,"0");
  const str = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;

  const a = document.getElementById("clock"); if(a) a.textContent = str;
  const b = document.getElementById("clock-m"); if(b) b.textContent = str;
}

window.addEventListener("keydown",(e)=>{
  if(e.key === "Escape") closeDrawer();
});

window.addEventListener("DOMContentLoaded", ()=>{
  setTheme(localStorage.getItem("theme") || "light");
  tick();
  setInterval(tick, 1000 * 20);
});

