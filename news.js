function escapeHtml(str=""){
  return String(str).replace(/[&<>"']/g, (m)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

function normalizeType(t=""){
  const x = String(t||"").toUpperCase();
  if(["NOTICE","MEDIA","AUDITION"].includes(x)) return x;
  return "NOTICE";
}

function setActiveFilter(type){
  document.querySelectorAll("[data-news-filter]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.newsFilter === type);
  });
}

function renderNews(items){
  const list = document.getElementById("newsList");
  if(!list) return;

  if(!items.length){
    list.innerHTML = `<div class="card">게시글이 없습니다.</div>`;
    return;
  }

  list.innerHTML = items.map(it=>{
    const type = normalizeType(it.type);
    const title = escapeHtml(it.title);
    const content = escapeHtml(it.content);
    const date = escapeHtml(it.date);

    return `
      <article class="card">
        <div style="font-size:11px;letter-spacing:.22em;color:var(--muted);text-transform:uppercase;">${type}</div>
        <div style="margin-top:8px;font-weight:900;font-size:18px;">${title}</div>
        <p style="margin:10px 0 0;color:var(--muted);line-height:1.65;font-size:14px;">${content}</p>
        <div style="margin-top:12px;color:var(--muted);font-size:12px;">${date}</div>
      </article>
    `;
  }).join("");
}

async function loadNews(){
  const res = await fetch("news.json", { cache: "no-store" });
  if(!res.ok) throw new Error("news.json 로드 실패");
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

function applyFilters(all){
  const q = (document.getElementById("newsSearch")?.value || "").trim().toLowerCase();
  const activeType = document.querySelector("[data-news-filter].active")?.dataset.newsFilter || "ALL";

  return all
    .filter(it=>{
      const type = normalizeType(it.type);
      const text = `${it.title||""} ${it.content||""}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      const matchType = (activeType === "ALL") || (type === activeType);
      return matchQ && matchType;
    })
    .sort((a,b)=> String(b.date||"").localeCompare(String(a.date||"")));
}

async function initNews(){
  const list = document.getElementById("newsList");
  if(!list) return;

  let all = [];
  try{
    all = await loadNews();
  }catch(e){
    list.innerHTML = `<div class="card">
      news.json을 불러오지 못했어요.<br>
      같은 폴더에 <b>news.json</b>이 있는지 확인해줘.
    </div>`;
    return;
  }

  const rerender = ()=> renderNews(applyFilters(all));

  document.getElementById("newsSearch")?.addEventListener("input", rerender);

  document.querySelectorAll("[data-news-filter]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      setActiveFilter(btn.dataset.newsFilter);
      rerender();
    });
  });

  // 초기값: ALL
  setActiveFilter("ALL");
  rerender();
}

// news.html에서 호출
window.addEventListener("DOMContentLoaded", initNews);