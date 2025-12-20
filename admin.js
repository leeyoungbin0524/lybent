(() => {
// admin.js - 로컬스토리지 기반 관리자 기능 (posts/artists/products/users/tools)

function $(s){ return document.querySelector(s); }
function $all(s){ return Array.from(document.querySelectorAll(s)); }

const USERS_KEY = "lyb_users_v1";
const POSTS_KEY = "lyb_posts_v1";
const ARTISTS_KEY = "lyb_artists_v1";
const PRODUCTS_KEY = "lyb_products_v1";

// app.js에 있는 toast가 없다면 대비
function toast(msg){
  if(window.toast) return window.toast(msg);
  alert(msg);
}

function fileToDataURL(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


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

function uid(prefix){
  return prefix + "_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

// ===== 탭 =====
function switchTab(tab){
  $all("[id^='tab-']").forEach(el => el.style.display = "none");
  const target = $("#tab-" + tab);
  if(target) target.style.display = "";

  // 버튼 active 느낌(선택)
  $all("[data-tab]").forEach(b=>{
    b.classList.remove("primary");
    if(b.getAttribute("data-tab") === tab) b.classList.add("primary");
  });
}

// ===== POSTS =====
function renderPosts(){
  const listEl = $("#postList");
  if(!listEl) return;

  const posts = readLS(POSTS_KEY, []);
  // pinned 먼저, 최신 먼저
  posts.sort((a,b)=> (b.pinned - a.pinned) || (b.createdAt - a.createdAt));

  listEl.innerHTML = posts.map(p=>`
    <div class="card" data-id="${p.id}">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
        <p class="chip">${p.type}${p.pinned ? " • PIN" : ""}${!p.visible ? " • HIDDEN" : ""}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn small" data-act="edit">수정</button>
          <button class="btn small" data-act="toggle">${p.visible ? "비공개" : "공개"}</button>
          <button class="btn small danger" data-act="del">삭제</button>
        </div>
      </div>
      <h3 style="margin:10px 0 6px; font-weight:950;">${escapeHtml(p.title)}</h3>
      <p class="muted" style="margin:0; font-weight:850; line-height:1.55;">${escapeHtml(p.content)}</p>
    </div>
  `).join("");

  listEl.onclick = (e)=>{
    const card = e.target.closest("[data-id]");
    const btn = e.target.closest("[data-act]");
    if(!card || !btn) return;

    const id = card.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    const posts2 = readLS(POSTS_KEY, []);
    const item = posts2.find(x=> x.id === id);
    if(!item) return;

    if(act === "del"){
      writeLS(POSTS_KEY, posts2.filter(x=> x.id !== id));
      toast("삭제 완료!");
      return renderPosts();
    }
    if(act === "toggle"){
      item.visible = !item.visible;
      writeLS(POSTS_KEY, posts2);
      toast(item.visible ? "공개로 변경!" : "비공개로 변경!");
      return renderPosts();
    }
    if(act === "edit"){
      fillPostForm(item);
      toast("수정 모드");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
}

function fillPostForm(p){
  const f = $("#postForm");
  if(!f) return;
  f.id.value = p.id;
  f.type.value = p.type;
  f.title.value = p.title;
  f.content.value = p.content;
  f.pinned.checked = !!p.pinned;
  f.visible.checked = !!p.visible;
}

function bindPostForm(){
  const f = $("#postForm");
  if(!f) return;

  $("#postCancel").onclick = ()=>{
    f.reset();
    f.id.value = "";
    // visible 기본 true
    f.visible.checked = true;
    toast("취소");
  };

  f.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = new FormData(f);
    const id = String(data.get("id")||"");
    const type = String(data.get("type")||"NOTICE");
    const title = String(data.get("title")||"").trim();
    const content = String(data.get("content")||"").trim();
    const pinned = !!data.get("pinned");
    const visible = !!data.get("visible");

    if(!title || !content) return toast("제목/내용을 입력해줘!");

    const posts = readLS(POSTS_KEY, []);
    if(id){
      const item = posts.find(x=> x.id === id);
      if(!item) return toast("수정 대상이 없어!");
      item.type = type;
      item.title = title;
      item.content = content;
      item.pinned = pinned;
      item.visible = visible;
      toast("수정 완료!");
    }else{
      posts.push({ id: uid("post"), type, title, content, pinned, visible, createdAt: Date.now() });
      toast("등록 완료!");
    }

    writeLS(POSTS_KEY, posts);
    f.reset();
    f.id.value = "";
    f.visible.checked = true;
    renderPosts();
  });
}

function fillArtistForm(a){
  if(!a) return;

  const f = $("#artistForm");
  if(!f) return;

  f.id.value = a.id || "";
  f.name.value = a.name || "";
  f.role.value = a.role || "";
  f.debut.value = a.debut || "";
  f.instagram.value = a.instagram || "";
  f.youtube.value = a.youtube || "";
  f.tags.value = Array.isArray(a.tags) ? a.tags.join(", ") : (a.tags || "");
  f.bio.value = a.bio || "";
  f.img.value = a.img || "";

  // 파일 업로드 미리보기 갱신(있을 때만)
  const preview = document.querySelector("#artistImgPreview");
  const fileInput = document.querySelector("#artistImgFile");
  if(preview){
    if(a.img){
      preview.src = a.img;
      preview.style.display = "block";
    }else{
      preview.style.display = "none";
    }
  }
  if(fileInput) fileInput.value = "";
}


// ===== ARTISTS =====
function renderArtistsAdmin(){
  const listEl = $("#artistList");
  if(!listEl) return;

  const list = readLS(ARTISTS_KEY, []);
  if(!Array.isArray(list) || list.length === 0){
    listEl.innerHTML = `<div class="notice">등록된 아티스트가 없습니다.</div>`;
    return;
  }

  listEl.innerHTML = list.map(a=>`
    <div class="card" data-id="${escapeHtml(a.id)}" style="display:grid; gap:10px;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
        <p class="chip">${escapeHtml(a.role || "Artist")}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn small" type="button" data-act="edit">수정</button>
          <button class="btn small danger" type="button" data-act="del">삭제</button>
        </div>
      </div>

      ${a.img ? `
        <div style="border-radius:12px; overflow:hidden;">
          <img src="${a.img}" alt="${escapeHtml(a.name)}"
               style="width:100%; height:160px; object-fit:cover; display:block;"
               onerror="this.remove()">
        </div>
      ` : `<div class="muted small">이미지 없음</div>`}

      <h3 style="margin:0; font-weight:950;">${escapeHtml(a.name)}</h3>
      <p class="muted" style="margin:0; font-weight:850;">Debut: ${escapeHtml(a.debut || "-")}</p>
    </div>
  `).join("");

  listEl.onclick = (e)=>{
    const card = e.target.closest("[data-id]");
    const btn = e.target.closest("[data-act]");
    if(!card || !btn) return;

    const id = card.getAttribute("data-id");
    const act = btn.getAttribute("data-act");

    const arr = readLS(ARTISTS_KEY, []);
    const item = arr.find(x=> x.id === id);
    if(!item) return;

    if(act === "del"){
      writeLS(ARTISTS_KEY, arr.filter(x=> x.id !== id));
      toast("삭제 완료!");
      return renderArtistsAdmin();
    }

    if(act === "edit"){
      fillArtistForm(item);
      toast("수정 모드");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
}

function bindArtistForm(){
  const f = $("#artistForm");
  if(!f) return;

  const fileInput = document.querySelector("#artistImgFile");
  const preview = document.querySelector("#artistImgPreview");
  const imgHidden = f.querySelector("input[name='img']"); // ✅ 여기!

  if(fileInput){
    fileInput.addEventListener("change", async ()=>{
      const file = fileInput.files?.[0];
      if(!file) return;

      const MAX_MB = 1.2;
      if(file.size > MAX_MB * 1024 * 1024){
        if(typeof toast === "function") toast(`이미지가 너무 커요! ${MAX_MB}MB 이하로 줄여주세요.`);
        fileInput.value = "";
        return;
      }

      try{
        const dataUrl = await fileToDataURL(file);
        if(imgHidden) imgHidden.value = dataUrl;

        if(preview){
          preview.src = dataUrl;
          preview.style.display = "block";
        }
      }catch(e){
        console.error(e);
        if(typeof toast === "function") toast("이미지 로딩 실패");
      }
    });
  }


  $("#artistCancel").onclick = ()=>{
    f.reset();
    f.id.value = "";
    toast("취소");
  };

  f.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = new FormData(f);
    const id = String(data.get("id")||"");
    const name = String(data.get("name")||"").trim();
    const role = String(data.get("role")||"").trim();
    const debut = String(data.get("debut")||"").trim();
    const instagram = String(data.get("instagram")||"").trim();
    const youtube = String(data.get("youtube")||"").trim();
    const tags = String(data.get("tags")||"").split(",").map(s=>s.trim()).filter(Boolean);
    const bio = String(data.get("bio")||"").trim();
    const img = String(data.get("img")||"").trim();

    if(!name || !role) return toast("이름/역할은 필수!");

    const arr = readLS(ARTISTS_KEY, []);
    if(id){
      const item = arr.find(x=> x.id === id);
      if(!item) return toast("수정 대상이 없어!");
      Object.assign(item, { name, role, debut, instagram, youtube, tags, bio, img });
      toast("수정 완료!");
    }else{
      arr.push({
        id: uid("artist"),
        name, role, debut, instagram, youtube, tags, bio, img
      });
      toast("추가 완료!");
    }

    writeLS(ARTISTS_KEY, arr);
    f.reset();
    f.id.value = "";
    renderArtistsAdmin();
  });
}

// ===== PRODUCTS =====
function renderProductsAdmin(){
  const listEl = $("#productList");
  if(!listEl) return;

  const list = readLS(PRODUCTS_KEY, []);
  listEl.innerHTML = list.map(p=>`
    <div class="card" data-id="${p.id}">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
        <p class="chip">${escapeHtml(p.tag || "Product")}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn small" data-act="edit">수정</button>
          <button class="btn small danger" data-act="del">삭제</button>
        </div>
      </div>
      <h3 style="margin:10px 0 6px; font-weight:950;">${escapeHtml(p.name)}</h3>
      <p class="muted" style="margin:0; font-weight:850;">₩${Number(p.price||0).toLocaleString()}</p>
    </div>
  `).join("");

  listEl.onclick = (e)=>{
    const card = e.target.closest("[data-id]");
    const btn = e.target.closest("[data-act]");
    if(!card || !btn) return;
    const id = card.getAttribute("data-id");
    const act = btn.getAttribute("data-act");

    const arr = readLS(PRODUCTS_KEY, []);
    const item = arr.find(x=> x.id === id);
    if(!item) return;

    if(act === "del"){
      writeLS(PRODUCTS_KEY, arr.filter(x=> x.id !== id));
      toast("삭제 완료!");
      return renderProductsAdmin();
    }
    if(act === "edit"){
      fillProductForm(item);
      toast("수정 모드");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
}

function fillProductForm(p){
  const f = $("#productForm");
  if(!f) return;
  f.id.value = p.id;
  f.name.value = p.name || "";
  f.tag.value = p.tag || "";
  f.price.value = p.price ?? 0;
  f.img.value = p.img || "";
}

function bindProductForm(){
  const f = $("#productForm");
  if(!f) return;

  $("#productCancel").onclick = ()=>{
    f.reset();
    f.id.value = "";
    toast("취소");
  };

  f.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = new FormData(f);
    const id = String(data.get("id")||"");
    const name = String(data.get("name")||"").trim();
    const tag = String(data.get("tag")||"").trim();
    const price = Number(data.get("price")||0);
    const img = String(data.get("img")||"").trim();

    if(!name) return toast("상품명은 필수!");
    if(Number.isNaN(price) || price < 0) return toast("가격은 숫자!");

    const arr = readLS(PRODUCTS_KEY, []);
    if(id){
      const item = arr.find(x=> x.id === id);
      if(!item) return toast("수정 대상이 없어!");
      Object.assign(item, { name, tag, price, img });
      toast("수정 완료!");
    }else{
      arr.push({ id: uid("prod"), name, tag, price, img });
      toast("추가 완료!");
    }

    writeLS(PRODUCTS_KEY, arr);
    f.reset();
    f.id.value = "";
    renderProductsAdmin();
  });
}

// ===== USERS =====
function renderUsers(){
  const el = $("#userList");
  if(!el) return;
  const users = readLS(USERS_KEY, []);

  el.innerHTML = `
    <table class="table">
      <thead><tr><th>이름</th><th>이메일</th><th>관리자</th></tr></thead>
      <tbody>
        ${users.map(u=>`
          <tr>
            <td style="color:rgba(234,240,255,.92); font-weight:950;">${escapeHtml(u.name||"-")}</td>
            <td>${escapeHtml(u.email||"-")}</td>
            <td>${u.isAdmin ? "YES" : "NO"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// ===== TOOLS =====
function bindTools(){
  const exp = $("#exportData");
  const reset = $("#resetData");
  if(exp){
    exp.onclick = ()=>{
      const data = {
        posts: readLS(POSTS_KEY, []),
        artists: readLS(ARTISTS_KEY, []),
        products: readLS(PRODUCTS_KEY, [])
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lyb-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast("다운로드 시작!");
    };
  }

  if(reset){
    reset.onclick = ()=>{
      if(!confirm("정말 초기화할래?")) return;
      localStorage.removeItem(POSTS_KEY);
      localStorage.removeItem(ARTISTS_KEY);
      localStorage.removeItem(PRODUCTS_KEY);
      toast("초기화 완료! 새로고침해줘.");
    };
  }
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

document.addEventListener("DOMContentLoaded", ()=>{
  // 탭 바인딩
  $all("[data-tab]").forEach(btn=>{
    btn.addEventListener("click", ()=> switchTab(btn.getAttribute("data-tab")));
  });
  switchTab("posts");

  bindPostForm();
  renderPosts();

  bindArtistForm();
  renderArtistsAdmin();

  bindProductForm();
  renderProductsAdmin();

  renderUsers();
  bindTools();
});
})();
