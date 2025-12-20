// ========= 공통 유틸 =========
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function toast(msg){
  let t = $("#toast");
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

function setYear(){
  const y = $("#year");
  if(y) y.textContent = new Date().getFullYear();
}

function mobileMenu(){
  const nav = $("#nav");
  const btn = $("#menuBtn");
  if(!nav || !btn) return;
  btn.addEventListener("click", ()=> nav.classList.toggle("open"));
  // 메뉴 클릭하면 닫기(모바일)
  nav.addEventListener("click", (e)=>{
    if(e.target.tagName === "A") nav.classList.remove("open");
  });
}

function setActiveNav(){
  const path = location.pathname.split("/").pop() || "index.html";
  $all(".nav a").forEach(a=>{
    const href = a.getAttribute("href");
    if(!href) return;
    if(href.endsWith(path)) a.classList.add("active");
  });
}

// ========= 데이터(아티스트/상품) =========
// ===== 저장 키 =====
const ARTISTS_KEY = "lyb_artists_v1";
const PRODUCTS_KEY = "lyb_products_v1";
const POSTS_KEY = "lyb_posts_v1";

// ===== 기본 데이터(초기값) =====
const DEFAULT_ARTISTS = [
  { id:"artist-a", name:"ARTIST A", role:"Vocal • Ballad", debut:"2026 (Project)", instagram:"@lyb_artistA", youtube:"LYB Artist A", tags:["Vocal","Ballad","Live"], bio:"섬세한 감정선과 안정적인 호흡이 강점인 보컬.", img:"assets/a1.jpg" },
  { id:"artist-b", name:"ARTIST B", role:"Dance • Performance", debut:"2026 (Project)", instagram:"@lyb_artistB", youtube:"LYB Artist B", tags:["Dance","Performance","Choreo"], bio:"파워풀한 퍼포먼스와 디테일한 표현.", img:"assets/a2.jpg" },
  { id:"artist-c", name:"ARTIST C", role:"Actor • Drama", debut:"2026 (Project)", instagram:"@lyb_artistC", youtube:"LYB Artist C", tags:["Actor","Drama","OST"], bio:"감정 연기와 발성이 강점.", img:"assets/a3.jpg" }
];

const DEFAULT_PRODUCTS = [
  { id:"hoodie", name:"Official Hoodie", price:59000, img:"assets/hoodie.jpg", tag:"Apparel" },
  { id:"stick", name:"Light Stick", price:39000, img:"assets/stick.jpg", tag:"Goods" },
  { id:"photo", name:"Photo Set", price:12000, img:"assets/photo.jpg", tag:"Photo" }
];

const DEFAULT_POSTS = [
  { id:"p1", type:"NOTICE", title:"신규 오디션 안내", content:"온라인 1차 접수 오픈", pinned:true, visible:true, createdAt: Date.now() }
];

// ===== 로컬 저장 유틸 =====
function readLS(key, fallback){
  try{
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  }catch{
    return fallback;
  }
}
function writeLS(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureDefaults(){
  if(!localStorage.getItem(ARTISTS_KEY)) writeLS(ARTISTS_KEY, DEFAULT_ARTISTS);
  if(!localStorage.getItem(PRODUCTS_KEY)) writeLS(PRODUCTS_KEY, DEFAULT_PRODUCTS);
  if(!localStorage.getItem(POSTS_KEY)) writeLS(POSTS_KEY, DEFAULT_POSTS);
}

function getArtists(){ return readLS(ARTISTS_KEY, DEFAULT_ARTISTS); }
function setArtists(v){ writeLS(ARTISTS_KEY, v); }
function getProducts(){ return readLS(PRODUCTS_KEY, DEFAULT_PRODUCTS); }
function setProducts(v){ writeLS(PRODUCTS_KEY, v); }
function getPosts(){ return readLS(POSTS_KEY, DEFAULT_POSTS); }
function setPosts(v){ writeLS(POSTS_KEY, v); }


// ========= 아티스트 목록 렌더 =========
function renderArtistDetail(){
  const root = document.querySelector("#artistDetail");
  if(!root) return; 

    const list = getArtists();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const a = (id ? list.find(x => x.id === id) : null) || list[0];

  if(!a){
    root.innerHTML = `<div class="notice">아티스트 데이터가 없습니다.</div>`;
    return;
  }

  const tags = Array.isArray(a.tags) ? a.tags : [];

  root.innerHTML = `
    <div class="kv">
      <div class="media">
        ${a.img ? `<img src="${a.img}" alt="${escapeHtml(a.name)}" onerror="this.remove()">` : ""}
      </div>

      <div class="panel">
        <div class="tagrow">
          ${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}
        </div>

        <h2 style="margin:6px 0 0; font-weight:950;">${escapeHtml(a.name)}</h2>
        <p class="muted" style="margin:6px 0 0; font-weight:900;">${escapeHtml(a.role || "")}</p>

        <hr class="hr" />

        <div style="display:grid; gap:8px;">
          <div><span class="muted">Debut</span><div style="font-weight:900">${escapeHtml(a.debut || "-")}</div></div>
          <div><span class="muted">Instagram</span><div style="font-weight:900">${escapeHtml(a.instagram || "-")}</div></div>
          <div><span class="muted">YouTube</span><div style="font-weight:900">${escapeHtml(a.youtube || "-")}</div></div>
        </div>

        <hr class="hr" />

        <p class="muted" style="margin:0; font-weight:800; line-height:1.6;">
          ${escapeHtml(a.bio || "")}
        </p>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <a class="btn primary" href="audition.html">오디션 안내</a>
          <a class="btn ghost" href="artists.html">목록으로</a>
        </div>
      </div>
    </div>
  `;
}


// ========= 오디션 폼 (메일앱 열기) =========
function auditionMail(){
  const form = $("#auditionForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
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

    // 여기 이메일만 네 회사용으로 바꾸면 됨
    const to = "audition@lybent.com";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
}

// ========= 장바구니(로컬스토리지) =========
const CART_KEY = "lyb_cart_v1";

function readCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  }catch{
    return [];
  }
}
function writeCart(items){
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCartBadge();
}

function addToCart(productId){
  const cart = readCart();
  const found = cart.find(x => x.id === productId);
  if(found) found.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  writeCart(cart);
  toast("장바구니에 담았어요!");
}

function removeFromCart(productId){
  const cart = readCart().filter(x=> x.id !== productId);
  writeCart(cart);
  renderCart();
}

function changeQty(productId, delta){
  const cart = readCart();
  const item = cart.find(x=> x.id === productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){
    writeCart(cart.filter(x=> x.id !== productId));
  }else{
    writeCart(cart);
  }
  renderCart();
}

function cartCount(){
  return readCart().reduce((sum,x)=> sum + x.qty, 0);
}

function renderCartBadge(){
  const el = $("#cartCount");
  if(!el) return;
  el.textContent = cartCount();
}

function renderProducts(){
  const wrap = document.querySelector("#productGrid");
  if(!wrap) return;

  const list = getProducts();

  renderCartBadge();
}

function renderCart(){
  const wrap = document.querySelector("#cartList"); // ✅ 네 HTML 기준
  if(!wrap) return;

  const products = getProducts(); // ✅ 저장 데이터
  const cart = readCart ? readCart() : JSON.parse(localStorage.getItem("lyb_cart_v1") || "[]");

  if(!Array.isArray(cart) || cart.length === 0){
    wrap.innerHTML = `<div class="notice">장바구니가 비어있습니다.</div>`;
    renderCartBadge && renderCartBadge();
    return;
  }

  let total = 0;

  // 테이블 행 만들기
  const rows = cart.map(item=>{
    const p = products.find(x => x.id === item.id);
    if(!p) return `
      <tr>
        <td colspan="4" class="muted">상품을 찾을 수 없습니다: ${escapeHtml(item.id)}</td>
      </tr>
    `;

    const qty = Math.max(1, Number(item.qty || 1));
    const line = Number(p.price || 0) * qty;
    total += line;

    return `
      <tr>
        <td style="font-weight:950;">${escapeHtml(p.name)}</td>

        <td>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button class="btn small" type="button" data-qty="${p.id}" data-delta="-1">-</button>
            <span style="font-weight:950;">${qty}</span>
            <button class="btn small" type="button" data-qty="${p.id}" data-delta="1">+</button>
          </div>
        </td>

        <td style="font-weight:950;">₩${line.toLocaleString()}</td>

        <td>
          <button class="btn small danger" type="button" data-remove="${p.id}">삭제</button>
        </td>
      </tr>
    `;
  }).join("");

  // 출력
  wrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>상품</th>
          <th>수량</th>
          <th>금액</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-top:12px; flex-wrap:wrap;">
      <div class="muted" style="font-weight:950;">총 합계</div>
      <div style="font-size:18px; font-weight:950;">₩${total.toLocaleString()}</div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:12px;">
      <button class="btn ghost" id="clearCart" type="button">비우기</button>
      <button class="btn primary" id="checkout" type="button">결제 UI(모의)</button>
    </div>
  `;

  wrap.onclick = (e)=>{
    const r = e.target.closest("[data-remove]");
    if(r){
      const id = r.getAttribute("data-remove");
      if(typeof removeFromCart === "function") removeFromCart(id);
      else{
        const next = cart.filter(x => x.id !== id);
        (writeCart ? writeCart(next) : localStorage.setItem("lyb_cart_v1", JSON.stringify(next)));
      }
      renderCart();
      return;
    }

    const q = e.target.closest("[data-qty]");
    if(q){
      const id = q.getAttribute("data-qty");
      const delta = Number(q.getAttribute("data-delta"));
      if(typeof changeQty === "function") changeQty(id, delta);
      else{
        const next = cart.map(x=>{
          if(x.id !== id) return x;
          const newQty = Math.max(1, Number(x.qty || 1) + delta);
          return { ...x, qty: newQty };
        });
        (writeCart ? writeCart(next) : localStorage.setItem("lyb_cart_v1", JSON.stringify(next)));
      }
      renderCart();
      return;
    }

    if(e.target.id === "clearCart"){
      (writeCart ? writeCart([]) : localStorage.setItem("lyb_cart_v1", "[]"));
      renderCart();
      if(typeof toast === "function") toast("장바구니를 비웠어요!");
      return;
    }

    if(e.target.id === "checkout"){
      if(typeof toast === "function") toast("결제는 포트폴리오용 UI입니다!");
      const modal = document.querySelector("#checkoutPanel");
      if(modal) modal.style.display = "block";
      return;
    }
  };

  if(typeof renderCartBadge === "function") renderCartBadge();
}

function closeCheckout(){
  const btn = $("#closeCheckout");
  const panel = $("#checkoutPanel");
  if(!btn || !panel) return;
  btn.addEventListener("click", ()=> panel.style.display = "none");
}

function adminMock(){
  const form = $("#adminNoticeForm");
  const list = $("#adminNoticeList");
  if(!form || !list) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    const title = (data.get("title")||"").toString().trim();
    const type = (data.get("type")||"").toString().trim();
    const content = (data.get("content")||"").toString().trim();
    if(!title || !type || !content){
      toast("내용을 채워줘!");
      return;
    }

    const item = document.createElement("div");
    item.className = "card";
    item.innerHTML = `
      <p class="chip">${type}</p>
      <h3 style="margin:10px 0 6px; font-weight:950;">${escapeHtml(title)}</h3>
      <p class="muted" style="margin:0; font-weight:850; line-height:1.55;">${escapeHtml(content)}</p>
      <div style="display:flex; gap:10px; margin-top:12px;">
        <button class="btn small danger" type="button">삭제</button>
      </div>
    `;
    item.querySelector("button").addEventListener("click", ()=>{
      item.remove();
      toast("삭제 완료!");
    });

    list.prepend(item);
    form.reset();
    toast("공지 등록 완료!");
  });
}
function formatDate(ts){
  try{
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
  }catch{
    return "";
  }
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getPostsPublic(){
  const POSTS_KEY = "lyb_posts_v1";
  let posts = [];
  try{ posts = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); }catch{ posts = []; }

  // 공개 글만
  posts = posts.filter(p => p.visible !== false);

  // pinned 먼저, 최신 먼저
  posts.sort((a,b)=> (b.pinned - a.pinned) || (b.createdAt - a.createdAt));
  return posts;
}

function renderNewsPage(){
  const listEl = document.querySelector("#newsList");
  const detailEl = document.querySelector("#newsDetail");
  if(!listEl || !detailEl) return;

  const url = new URL(location.href);
  let filter = url.searchParams.get("type") || "ALL";
  const activeId = url.searchParams.get("id") || "";

  let posts = getPostsPublic();
  if(filter !== "ALL") posts = posts.filter(p => p.type === filter);

  // 필터 버튼 활성
  document.querySelectorAll("[data-filter]").forEach(btn=>{
    btn.classList.remove("primary");
    if(btn.getAttribute("data-filter") === filter) btn.classList.add("primary");
    btn.onclick = ()=>{
      const next = btn.getAttribute("data-filter");
      url.searchParams.set("type", next);
      url.searchParams.delete("id");
      location.href = url.toString();
    };
  });

  if(posts.length === 0){
    listEl.innerHTML = `<div class="notice">표시할 게시글이 없습니다.</div>`;
    detailEl.innerHTML = `<div class="notice">게시글이 없어요.</div>`;
    return;
  }

  // 활성 글 결정: 쿼리 id가 없으면 첫 글
  let current = posts.find(p => p.id === activeId) || posts[0];

  // 리스트 렌더(클릭하면 news.html?id=... 로 이동)
  listEl.innerHTML = posts.map(p => `
    <a class="card" href="news.html?type=${encodeURIComponent(filter)}&id=${encodeURIComponent(p.id)}"
       style="display:block; text-decoration:none;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
        <p class="chip">${p.type}${p.pinned ? " • PIN" : ""}</p>
        <p class="muted small" style="margin:0; font-weight:900;">${formatDate(p.createdAt)}</p>
      </div>
      <h3 style="margin:10px 0 6px; font-weight:950; ${p.id===current.id ? "text-decoration:underline;" : ""}">
        ${escapeHtml(p.title)}
      </h3>
      <p class="muted" style="margin:0; font-weight:850; line-height:1.55;">
        ${escapeHtml(p.content)}
      </p>
    </a>
  `).join("");

  // 상세 렌더
  detailEl.innerHTML = `
    <p class="chip">${current.type}${current.pinned ? " • PIN" : ""}</p>
    <h2 style="margin:10px 0 6px; font-weight:950;">${escapeHtml(current.title)}</h2>
    <p class="muted small" style="margin:0 0 12px; font-weight:900;">${formatDate(current.createdAt)}</p>
    <div class="card">
      <p style="margin:0; font-weight:850; line-height:1.8; color:rgba(234,240,255,.92);">
        ${escapeHtml(current.content).replaceAll("\n","<br>")}
      </p>
    </div>
    <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
      <a class="btn ghost" href="index.html#news">홈으로</a>
      <a class="btn primary" href="audition.html">오디션 지원</a>
    </div>
  `;
}


function renderHomePosts(){
  const listEl = $("#homePostList");
  const featuredEl = $("#homePostFeatured");
  if(!listEl && !featuredEl) return;

  // posts 저장 키가 없다면(아직 admin.js 안 썼다면) 기본 빈 배열
  const POSTS_KEY = "lyb_posts_v1";
  let posts = [];
  try{ posts = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); }catch{ posts = []; }

  // 공개 글만
  posts = posts.filter(p => p.visible !== false);

  // pinned 먼저, 최신 먼저
  posts.sort((a,b)=> (b.pinned - a.pinned) || (b.createdAt - a.createdAt));

  // FEATURED: pinned 중 첫 번째
  const featured = posts.find(p => !!p.pinned) || null;

  // 리스트: 상위 6개
  const top = posts.slice(0, 6);

  if(listEl){
    if(top.length === 0){
      listEl.innerHTML = `<div class="notice">아직 등록된 소식이 없어요. admin에서 공지/이벤트를 등록해봐!</div>`;
    }else{
        listEl.innerHTML = top.map(p => `
  <a class="card"
     href="news.html?id=${encodeURIComponent(p.id)}"
     style="display:block; text-decoration:none; color:inherit;">
     
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
      <p class="chip">${p.type}${p.pinned ? " • PIN" : ""}</p>
      <p class="muted small" style="margin:0; font-weight:900;">${formatDate(p.createdAt)}</p>
    </div>

    <h3 style="margin:10px 0 6px; font-weight:950;">
      ${escapeHtml(p.title)}
    </h3>

    <p class="muted" style="margin:0; font-weight:850; line-height:1.55;">
      ${escapeHtml(p.content)}
    </p>
  </a>
`).join("");

    }
  }

  if(featuredEl && featured){
    featuredEl.innerHTML = `
      <p class="chip">FEATURED • ${featured.type}</p>
      <h3 style="margin:10px 0 6px; font-weight:950;">${escapeHtml(featured.title)}</h3>
      <p class="muted" style="margin:0; font-weight:850; line-height:1.55;">${escapeHtml(featured.content)}</p>
      <p class="muted small" style="margin:12px 0 0; font-weight:900;">${formatDate(featured.createdAt)}</p>

      <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
        <a class="btn primary" href="audition.html">오디션 지원</a>
        <a class="btn ghost" href="#contact">문의하기</a>
      </div>
    `;
  }
}


function renderArtists(){
  const wrap = document.querySelector("#artistGrid");
  if(!wrap) return;

  const list = getArtists();

  wrap.innerHTML = list.map(a => `
    <a class="card artist-card" href="artist.html?id=${encodeURIComponent(a.id)}"
       style="display:block; text-decoration:none; color:inherit;">
      <div class="media">
        <img
          src="${a.img || "assets/artist-placeholder.png"}"
          alt="${escapeHtml(a.name)}"
          onerror="this.src='assets/artist-placeholder.png'"
        />
      </div>

      <div style="margin-top:10px;">
        <h3 style="margin:0; font-weight:950;">${escapeHtml(a.name)}</h3>
        <p class="muted" style="margin:6px 0 0;">${escapeHtml(a.role || "")}</p>
      </div>
    </a>
  `).join("");
}


document.addEventListener("DOMContentLoaded", ()=>{
  ensureDefaults();   // ✅ 반드시 제일 위

  setYear();
  mobileMenu();
  setActiveNav();

  renderHomePosts();
  renderNewsPage();

  renderArtists();
  renderArtistDetail();

  auditionMail();

  renderProducts();
  renderCart();
  closeCheckout();

  adminMock();
  renderCartBadge();
});



