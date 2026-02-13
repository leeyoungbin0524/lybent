const sb = window.supabaseClient;

function escapeHtml(s=""){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

function card(a){
  const img = a.image_url
    ? `<img src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.name)}"
         style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px;border:1px solid var(--line);">`
    : `<div style="width:100%;aspect-ratio:1/1;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;color:var(--muted);">No Image</div>`;

  return `
    <div style="border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:14px;">
      ${img}
      <div style="margin-top:10px;font-weight:900;font-size:16px;">${escapeHtml(a.name || "")}</div>
      <div style="color:var(--muted);font-size:13px;margin-top:4px;">${escapeHtml(a.role || "")}</div>
      <div style="color:var(--muted);font-size:13px;line-height:1.6;margin-top:8px;">${escapeHtml(a.bio || "")}</div>
    </div>
  `;
}

async function loadArtists(){
  const grid = document.getElementById("artistsGrid");
  const msg = document.getElementById("artistsMsg");
  if(!grid) return;

  grid.innerHTML = "";
  if(msg){ msg.style.display="inline-flex"; msg.textContent="불러오는 중…"; }

  const { data, error } = await sb
    .from("artists")
    .select("id, name, role, bio, image_url, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending:true })
    .order("created_at", { ascending:false });

  if(error){
    if(msg){ msg.style.display="inline-flex"; msg.textContent="불러오기 실패: " + error.message; }
    return;
  }

  const rows = data || [];
  if(!rows.length){
    if(msg){ msg.style.display="inline-flex"; msg.textContent="등록된 아티스트가 없습니다."; }
    return;
  }

  if(msg){ msg.style.display="none"; }
  grid.innerHTML = rows.map(card).join("");
}

window.addEventListener("DOMContentLoaded", ()=>{
  loadArtists();
});