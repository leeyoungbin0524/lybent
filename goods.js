// goods.js
// ✅ Admin에서 등록한 products 테이블을 읽어 Goods 페이지에 표시
// - window.supabaseClient 사용 (supabase-client.js에서 1번만 생성)

(function () {
  const sb = window.supabaseClient;
  const grid = document.getElementById("goodsGrid");
  const msg = document.getElementById("goodsMsg");
  const search = document.getElementById("goodsSearch");
  const reloadBtn = document.getElementById("goodsReload");

  if (!sb) {
    showMsg("❌ supabaseClient 없음 (supabase-client.js 로드/순서 확인)");
    return;
  }
  if (!grid) return;

  let allRows = [];

  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  function showMsg(t) {
    if (!msg) return;
    msg.style.display = "inline-flex";
    msg.textContent = t || "";
  }
  function hideMsg() {
    if (!msg) return;
    msg.style.display = "none";
    msg.textContent = "";
  }

  function toKRW(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString("ko-KR") + "원";
  }

  function render(rows) {
    const q = (search?.value || "").trim().toLowerCase();
    const filtered = (rows || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      return q ? name.includes(q) : true;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="card" style="border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:16px;">
          <div style="font-weight:900;">상품이 없습니다.</div>
          <div style="color:var(--muted);font-size:13px;margin-top:6px;">준비중.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((p) => {
      const name = escapeHtml(p.name || "—");
      const desc = escapeHtml(p.description || "");
      const price = toKRW(p.price);
      const stock = (p.stock ?? "—");
      const img = (p.image_url || "").trim();

      // 이미지가 없으면 깔끔한 플레이스홀더(텍스트만)
      const imgBlock = img
        ? `<img src="${escapeHtml(img)}" alt="${name}" style="width:100%;height:220px;object-fit:cover;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03);" loading="lazy">`
        : `<div style="width:100%;height:220px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03);display:flex;align-items:center;justify-content:center;color:var(--muted);">
            No Image
           </div>`;

      return `
        <article class="card" style="border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;">
          ${imgBlock}

          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="font-weight:900;font-size:16px;line-height:1.25;">${name}</div>
            <div style="color:var(--muted);font-size:13px;line-height:1.6;">${desc}</div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:auto;">
            <span class="pill" style="border-color:rgba(255,255,255,.12);">${escapeHtml(price)}</span>
            <span class="pill">재고: ${escapeHtml(stock)}</span>
          </div>

          <button class="btn" type="button" style="width:100%;">구매 준비중</button>
        </article>
      `;
    }).join("");
  }

  async function load() {
    hideMsg();
    showMsg("불러오는 중…");

    // ✅ is_active=true만 노출 (어드민에서 비활성하면 굿즈에 안 뜸)
    const { data, error } = await sb
      .from("products")
      .select("id, created_at, name, price, stock, image_url, description, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      showMsg("❌ products 조회 실패: " + error.message);
      grid.innerHTML = "";
      allRows = [];
      return;
    }

    allRows = data || [];
    if (!allRows.length) {
      showMsg("등록된 상품이 없습니다.");
    } else {
      hideMsg();
    }
    render(allRows);
  }

  // events
  search?.addEventListener("input", () => render(allRows));
  reloadBtn?.addEventListener("click", load);

  // init
  window.addEventListener("DOMContentLoaded", load);
  window.buyNow = function(productId){
  location.href = `checkout.html?product_id=${encodeURIComponent(productId)}`;
};
  
})();
