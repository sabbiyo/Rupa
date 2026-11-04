/* =========================================================
   RUPA — logika toko (frontend saja)
   ========================================================= */

const ICONS = {
  search:
    '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bag: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close:
    '<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow:
    '<svg class="icon icon--sm" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check:
    '<svg class="icon" viewBox="0 0 24 24"><path d="m5 13 4.5 4.5L19 7"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  trash:
    '<svg class="icon icon--sm" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  truck:
    '<svg class="icon" viewBox="0 0 24 24"><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
  shield:
    '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6l7-2.5Z"/><path d="m9.5 12 1.8 1.8L15 10"/></svg>',
  refresh:
    '<svg class="icon" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4h-4"/></svg>',
  headset:
    '<svg class="icon" viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5.5A1.5 1.5 0 0 1 4 17.5V14ZM20 14h-3v5h1.5A1.5 1.5 0 0 0 20 17.5V14Z"/></svg>',
  leaf: '<svg class="icon" viewBox="0 0 24 24"><path d="M20 4c0 9-5 13-11 13H4c0-8 5-12 11-12h5Z"/><path d="M4 21c2-5 6-8 12-10"/></svg>',
};

/* ---------------- Utils ---------------- */

const rp = (n) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const catLabel = (slug) =>
  (CATEGORIES.find((c) => c.slug === slug) || { label: slug }).label;

const stars = (rating) => {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
};

/* ---------------- Storage ---------------- */

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* mode privat — abaikan */
    }
  },
};

const CART_KEY = "rupa_cart_v1";
const WISH_KEY = "rupa_wish_v1";
const PROMO_KEY = "rupa_promo_v1";

const cart = {
  items() {
    const list = storage.get(CART_KEY, []);
    return Array.isArray(list) ? list.filter((i) => findProduct(i.id)) : [];
  },
  save(items) {
    storage.set(CART_KEY, items);
    syncCartUI();
  },
  add(id, size, qty = 1) {
    const product = findProduct(id);
    if (!product) return;
    const items = this.items();
    const lineSize = size || product.sizes[0];
    const found = items.find((i) => i.id === id && i.size === lineSize);
    if (found) found.qty = Math.min(99, found.qty + qty);
    else items.push({ id, size: lineSize, qty });
    this.save(items);
    toast(`${product.name} (${lineSize}) ditambahkan ke keranjang`);
  },
  setQty(id, size, qty) {
    const items = this.items();
    const line = items.find((i) => i.id === id && i.size === size);
    if (!line) return;
    if (qty <= 0) {
      this.save(items.filter((i) => !(i.id === id && i.size === size)));
      return;
    }
    line.qty = Math.min(99, qty);
    this.save(items);
  },
  remove(id, size) {
    this.save(this.items().filter((i) => !(i.id === id && i.size === size)));
  },
  clear() {
    storage.set(CART_KEY, []);
    storage.set(PROMO_KEY, null);
    syncCartUI();
  },
  count() {
    return this.items().reduce((sum, i) => sum + i.qty, 0);
  },
  lines() {
    return this.items().map((item) => {
      const product = findProduct(item.id);
      return {
        ...item,
        product,
        lineTotal: product.price * item.qty,
      };
    });
  },
  subtotal() {
    return this.lines().reduce((sum, l) => sum + l.lineTotal, 0);
  },
};

const wishlist = {
  ids() {
    const list = storage.get(WISH_KEY, []);
    return Array.isArray(list) ? list : [];
  },
  toggle(id) {
    const ids = this.ids();
    const has = ids.includes(id);
    const next = has ? ids.filter((x) => x !== id) : [...ids, id];
    storage.set(WISH_KEY, next);
    return !has;
  },
  has(id) {
    return this.ids().includes(id);
  },
};

/* ---------------- Promo & total ---------------- */

const getPromo = () => storage.get(PROMO_KEY, null);

function promoDiscount(subtotal) {
  const promo = getPromo();
  if (!promo || !PROMO_CODES[promo]) return 0;
  const def = PROMO_CODES[promo];
  const value = def.type === "percent" ? (subtotal * def.value) / 100 : def.value;
  return Math.min(value, subtotal);
}

function totals(subtotal = cart.subtotal()) {
  const discount = promoDiscount(subtotal);
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  return {
    subtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount + shipping),
  };
}

/* ---------------- Toast ---------------- */

function toast(message) {
  let host = qs(".toasts");
  if (!host) {
    host = document.createElement("div");
    host.className = "toasts";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = ICONS.check;
  const text = document.createElement("span");
  text.textContent = message;
  el.appendChild(text);
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

/* ---------------- Product card ---------------- */

function cardTemplate(product) {
  const badge = product.badge
    ? `<span class="badge${
        product.badge === "Diskon" ? " badge--sale" : ""
      }">${product.badge}</span>`
    : product.oldPrice
    ? '<span class="badge badge--sale">Diskon</span>'
    : "";

  return `
    <article class="card" data-reveal>
      <div class="card__media">
        <a class="card__media-link" href="product.html?id=${product.id}" aria-label="Lihat ${escapeHtml(
    product.name
  )}">
          <img src="${productImage(product, 0)}" alt="${escapeHtml(
    product.name
  )}" loading="lazy" width="800" height="1000">
        </a>
        ${badge}
        <button class="heart${wishlist.has(product.id) ? " is-active" : ""}"
                data-wish="${product.id}"
                aria-label="Simpan ${escapeHtml(product.name)} ke wishlist"
                aria-pressed="${wishlist.has(product.id)}">
          <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z"/></svg>
        </button>
        <div class="card__quick">
          <button class="btn btn--sm" data-quick-add="${product.id}">Tambah cepat</button>
        </div>
      </div>
      <div class="card__body">
        <p class="card__cat">${catLabel(product.category)}</p>
        <h3 class="card__title"><a href="product.html?id=${
          product.id
        }">${escapeHtml(product.name)}</a></h3>
        <div class="card__price">
          <span>${rp(product.price)}</span>
          ${product.oldPrice ? `<s>${rp(product.oldPrice)}</s>` : ""}
        </div>
        <div class="card__meta">
          <span class="star">★</span> ${product.rating.toFixed(1).replace(".", ",")}
          <span>·</span> ${product.reviews} ulasan
        </div>
      </div>
    </article>`;
}

/* ---------------- Header, drawer, search ---------------- */

const drawerTemplate = `
  <div class="drawer" id="cartDrawer" aria-hidden="true">
    <div class="drawer__scrim" data-drawer-close></div>
    <aside class="drawer__panel" role="dialog" aria-modal="true" aria-label="Keranjang belanja">
      <div class="drawer__head">
        <h2>Keranjang <span data-drawer-count style="color:var(--muted);font-family:var(--ff-body);font-size:.8rem"></span></h2>
        <button class="icon-btn" data-drawer-close aria-label="Tutup keranjang">${ICONS.close}</button>
      </div>
      <div class="drawer__body" data-drawer-body></div>
      <div class="drawer__foot" data-drawer-foot hidden></div>
    </aside>
  </div>`;

const searchTemplate = `
  <div class="search-modal" id="searchModal" role="dialog" aria-modal="true" aria-label="Cari produk">
    <div class="search-modal__box">
      <form role="search">
        ${ICONS.search}
        <input type="search" name="q" placeholder="Cari kemeja, lilin, tas…" aria-label="Kata kunci pencarian" autocomplete="off">
        <button type="button" class="icon-btn" data-search-close aria-label="Tutup pencarian">${ICONS.close}</button>
      </form>
      <p class="search-modal__hint">Tekan Enter untuk melihat hasil. Coba “linen”, “keramik”, atau “tas”.</p>
    </div>
  </div>`;

const mobileNavTemplate = `
  <div class="mobile-nav" id="mobileNav" aria-hidden="true">
    <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <div class="mobile-nav__head">
        <a class="brand" href="index.html">RUPA<span>.</span></a>
        <button class="icon-btn" data-menu-close aria-label="Tutup menu">${ICONS.close}</button>
      </div>
      <a href="index.html">Beranda</a>
      <a href="shop.html">Semua produk</a>
      <a href="shop.html?category=pakaian">Pakaian</a>
      <a href="shop.html?category=rumah">Rumah</a>
      <a href="shop.html?category=aksesori">Aksesori</a>
      <a href="cart.html">Keranjang</a>
      <div class="mobile-nav__foot">
        Gratis pengiriman di atas ${rp(FREE_SHIPPING_MIN)}<br>
        halo@rupa.studio
      </div>
    </div>
    <div class="mobile-nav__scrim" data-menu-close></div>
  </div>`;

function syncCartUI() {
  const count = cart.count();
  qsa("[data-cart-count]").forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0 && el.classList.contains("cart-count--soft");
  });
  const drawer = qs("#cartDrawer");
  if (drawer) renderDrawer();
  if (document.body.dataset.page === "cart") renderCartPage();
  if (document.body.dataset.page === "checkout" && !document.body.dataset.done) {
    renderCheckoutSummary();
  }
}

function renderDrawer() {
  const drawer = qs("#cartDrawer");
  if (!drawer) return;
  const lines = cart.lines();
  const body = qs("[data-drawer-body]", drawer);
  const foot = qs("[data-drawer-foot]", drawer);
  const countEl = qs("[data-drawer-count]", drawer);
  if (countEl) countEl.textContent = lines.length ? `(${cart.count()})` : "";

  if (!lines.length) {
    body.innerHTML = `
      <div class="drawer-empty">
        ${ICONS.bag}
        <p>Keranjangmu masih kosong.</p>
        <a class="btn btn--sm" href="shop.html">Mulai belanja</a>
      </div>`;
    foot.hidden = true;
    return;
  }

  body.innerHTML = lines
    .map(
      (line) => `
      <div class="drawer-item">
        <img src="${productImage(line.product, 1)}" alt="${escapeHtml(
        line.product.name
      )}" width="68" height="85">
        <div>
          <a class="drawer-item__name" href="product.html?id=${line.id}">${escapeHtml(
        line.product.name
      )}</a>
          <div class="drawer-item__opt">${escapeHtml(line.size)} · ${rp(
        line.product.price
      )}</div>
          <div class="qty qty--sm">
            <button data-drawer-qty="${line.id}|${line.size}|-${
        line.qty
      }" aria-label="Kurangi jumlah">−</button>
            <span>${line.qty}</span>
            <button data-drawer-qty="${line.id}|${line.size}|${
        line.qty + 1
      }" aria-label="Tambah jumlah">${ICONS.plus}</button>
          </div>
        </div>
        <div style="text-align:right;display:grid;gap:8px;justify-items:end">
          <span class="drawer-item__price">${rp(line.lineTotal)}</span>
          <button class="cart-row__remove" data-drawer-remove="${line.id}|${
        line.size
      }" aria-label="Hapus ${escapeHtml(line.product.name)}">Hapus</button>
        </div>
      </div>`
    )
    .join("");

  const sub = cart.subtotal();
  foot.hidden = false;
  foot.innerHTML = `
    <div class="drawer__row"><span>Subtotal</span><b>${rp(sub)}</b></div>
    <p class="summary__note">${
      sub >= FREE_SHIPPING_MIN
        ? "Pengiriman gratis sudah termasuk."
        : `Tambah ${rp(FREE_SHIPPING_MIN - sub)} lagi untuk gratis pengiriman.`
    }</p>
    <a class="btn btn--primary btn--block" href="checkout.html">Lanjut ke pembayaran ${ICONS.arrow}</a>
    <a class="btn btn--ghost btn--block" href="cart.html">Lihat keranjang</a>`;
}

function openDrawer() {
  const drawer = qs("#cartDrawer");
  if (!drawer) return;
  renderDrawer();
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  drawer.dataset.returnFocus = "1";
  qs("[data-drawer-close]", drawer)?.focus();
}

function closeDrawer() {
  const drawer = qs("#cartDrawer");
  if (!drawer) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
}

function initChrome() {
  document.body.insertAdjacentHTML("beforeend", drawerTemplate + searchTemplate + mobileNavTemplate);

  qsa("[data-cart-open]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer();
    })
  );

  const searchModal = qs("#searchModal");
  const searchInput = qs("input", searchModal);

  qsa("[data-search-open]").forEach((el) =>
    el.addEventListener("click", () => {
      searchModal.classList.add("is-open");
      document.body.classList.add("is-locked");
      setTimeout(() => searchInput.focus(), 60);
    })
  );

  qsa("[data-search-close]").forEach((el) =>
    el.addEventListener("click", closeSearch)
  );

  function closeSearch() {
    searchModal.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  searchModal.addEventListener("click", (e) => {
    if (e.target === searchModal) closeSearch();
  });

  qs("form", searchModal).addEventListener("submit", (e) => {
    e.preventDefault();
    const term = searchInput.value.trim();
    window.location.href = term
      ? `shop.html?q=${encodeURIComponent(term)}`
      : "shop.html";
  });

  const mobileNav = qs("#mobileNav");
  qsa("[data-menu-open]").forEach((el) =>
    el.addEventListener("click", () => {
      mobileNav.classList.add("is-open");
      document.body.classList.add("is-locked");
    })
  );
  qsa("[data-menu-close]").forEach((el) =>
    el.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeDrawer();
    closeSearch();
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  });

  // Delegasi klik global (drawer, wishlist, quick add)
  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-drawer-close]");
    if (close) closeDrawer();

    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) {
      e.preventDefault();
      const active = wishlist.toggle(wishBtn.dataset.wish);
      wishBtn.classList.toggle("is-active", active);
      wishBtn.setAttribute("aria-pressed", String(active));
      toast(active ? "Disimpan ke wishlist" : "Dihapus dari wishlist");
      return;
    }

    const quick = e.target.closest("[data-quick-add]");
    if (quick) {
      e.preventDefault();
      const product = findProduct(quick.dataset.quickAdd);
      if (product) cart.add(product.id, product.sizes[0], 1);
      return;
    }

    const qtyBtn = e.target.closest("[data-drawer-qty]");
    if (qtyBtn) {
      const [id, size, qty] = qtyBtn.dataset.drawerQty.split("|");
      cart.setQty(id, size, Number(qty));
      return;
    }

    const removeBtn = e.target.closest("[data-drawer-remove]");
    if (removeBtn) {
      const [id, size] = removeBtn.dataset.drawerRemove.split("|");
      cart.remove(id, size);
    }
  });

  syncCartUI();
}

/* ---------------- Reveal animation ---------------- */

function initReveal(root = document) {
  const items = qsa("[data-reveal]", root);
  if (!("IntersectionObserver" in window) || document.visibilityState === "hidden") {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add("is-in"), i * 45);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -60px", threshold: 0.05 }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------------- Home ---------------- */

function initHome() {
  qsa("[data-art]").forEach((img) => {
    img.src = artwork(
      img.dataset.art,
      Number(img.dataset.artVariant || 0),
      img.dataset.artCat || "default"
    );
  });

  const catGrid = qs("#catGrid");
  if (catGrid) {
    catGrid.innerHTML = CATEGORIES.map(
      (cat, i) => `
      <a class="cat" href="shop.html?category=${cat.slug}" data-reveal>
        <img src="${artwork("kategori-" + cat.slug, i, cat.slug)}" alt="${cat.label}" width="800" height="1000" loading="lazy">
        <span class="cat__label">${cat.label}<i>→</i></span>
      </a>`
    ).join("");
  }

  const featured = qs("#featuredGrid");
  if (featured) {
    featured.innerHTML = PRODUCTS.filter((p) => p.featured)
      .slice(0, 8)
      .map(cardTemplate)
      .join("");
  }

  initReveal();
}

/* ---------------- Shop ---------------- */

function initShop() {
  const params = new URLSearchParams(window.location.search);
  const state = {
    cats: new Set(params.get("category") ? [params.get("category")] : []),
    q: params.get("q") || "",
    maxPrice: 700000,
    saleOnly: false,
    sort: "featured",
  };

  const grid = qs("#shopGrid");
  const countEl = qs("#shopCount");
  const chipsEl = qs("#activeChips");
  const searchInput = qs("#shopSearch");
  const sortSelect = qs("#shopSort");
  const priceRange = qs("#priceRange");
  const priceOut = qs("#priceValue");
  const catFilters = qs("#catFilters");
  const saleFilter = qs("#saleFilter");
  const filterBox = qs("#filters");

  catFilters.innerHTML = CATEGORIES.map(
    (cat) => `
    <li>
      <label class="check">
        <input type="checkbox" value="${cat.slug}" ${
      state.cats.has(cat.slug) ? "checked" : ""
    }>
        <span>${cat.label}</span>
        <span class="count">${
          PRODUCTS.filter((p) => p.category === cat.slug).length
        }</span>
      </label>
    </li>`
  ).join("");

  if (searchInput) searchInput.value = state.q;

  function filtered() {
    const term = state.q.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      if (state.cats.size && !state.cats.has(p.category)) return false;
      if (state.saleOnly && !p.oldPrice) return false;
      if (p.price > state.maxPrice) return false;
      if (
        term &&
        !(
          p.name.toLowerCase().includes(term) ||
          p.desc.toLowerCase().includes(term) ||
          catLabel(p.category).toLowerCase().includes(term)
        )
      )
        return false;
      return true;
    });

    if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (state.sort === "featured")
      list = [...list].sort(
        (a, b) => Number(b.featured) - Number(a.featured) || b.reviews - a.reviews
      );
    return list;
  }

  function renderChips() {
    const chips = [];
    state.cats.forEach((slug) =>
      chips.push({ type: "cat", value: slug, label: catLabel(slug) })
    );
    if (state.saleOnly) chips.push({ type: "sale", value: "1", label: "Sedang diskon" });
    if (state.maxPrice < 700000)
      chips.push({
        type: "price",
        value: "1",
        label: `Maks ${rp(state.maxPrice)}`,
      });
    if (state.q) chips.push({ type: "q", value: state.q, label: `“${state.q}”` });

    chipsEl.innerHTML = chips
      .map(
        (chip) => `
      <span class="chip">${escapeHtml(chip.label)}
        <button data-chip="${chip.type}" data-chip-value="${escapeHtml(
          chip.value
        )}" aria-label="Hapus filter ${escapeHtml(chip.label)}">✕</button>
      </span>`
      )
      .join("");
    chipsEl.hidden = chips.length === 0;
  }

  function render() {
    const list = filtered();
    countEl.textContent = `${list.length} produk`;
    grid.innerHTML = list.length
      ? list.map(cardTemplate).join("")
      : `<div class="empty" style="grid-column:1/-1">
           <h3>Tidak ada produk yang cocok</h3>
           <p>Coba longgarkan filter atau gunakan kata kunci lain.</p>
           <button class="btn btn--ghost btn--sm" data-reset>Reset filter</button>
         </div>`;
    renderChips();
    initReveal(grid);
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.cats.size) p.set("category", [...state.cats][0]);
    if (state.q) p.set("q", state.q);
    const url = p.toString() ? `?${p}` : window.location.pathname;
    history.replaceState(null, "", url);
  }

  function reset() {
    state.cats.clear();
    state.q = "";
    state.maxPrice = 700000;
    state.saleOnly = false;
    state.sort = "featured";
    if (searchInput) searchInput.value = "";
    if (priceRange) priceRange.value = 700000;
    if (priceOut) priceOut.textContent = rp(700000);
    if (saleFilter) saleFilter.checked = false;
    qsa("input[type=checkbox]", catFilters).forEach((i) => (i.checked = false));
    if (sortSelect) sortSelect.value = "featured";
    syncUrl();
    render();
  }

  catFilters.addEventListener("change", (e) => {
    const cb = e.target.closest("input[type=checkbox]");
    if (!cb) return;
    if (cb.checked) state.cats.add(cb.value);
    else state.cats.delete(cb.value);
    syncUrl();
    render();
  });

  if (saleFilter) {
    saleFilter.checked = false;
    saleFilter.addEventListener("change", () => {
      state.saleOnly = saleFilter.checked;
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      render();
    });
  }

  if (priceRange) {
    priceRange.addEventListener("input", () => {
      state.maxPrice = Number(priceRange.value);
      priceOut.textContent = rp(state.maxPrice);
      render();
    });
  }

  let timer;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.q = searchInput.value.trim();
        syncUrl();
        render();
      }, 180);
    });
  }

  qs("#shopReset")?.addEventListener("click", reset);

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset]")) reset();
    const chipBtn = e.target.closest("[data-chip]");
    if (!chipBtn) return;
    const type = chipBtn.dataset.chip;
    if (type === "cat") state.cats.delete(chipBtn.dataset.chipValue);
    if (type === "sale") {
      state.saleOnly = false;
      if (saleFilter) saleFilter.checked = false;
    }
    if (type === "price") {
      state.maxPrice = 700000;
      if (priceRange) priceRange.value = 700000;
      priceOut.textContent = rp(700000);
    }
    if (type === "q") {
      state.q = "";
      if (searchInput) searchInput.value = "";
    }
    qsa("input[type=checkbox]", catFilters).forEach((cb) => {
      cb.checked = state.cats.has(cb.value);
    });
    syncUrl();
    render();
  });

  qs("#filterToggle")?.addEventListener("click", () => {
    filterBox.classList.toggle("is-open");
  });

  render();
  initReveal();
}

/* ---------------- Product detail ---------------- */

function initProduct() {
  const id = new URLSearchParams(window.location.search).get("id");
  const product = findProduct(id);
  const root = qs("#pdpRoot");

  if (!product) {
    qs("#pdpCrumbs").innerHTML = `<a href="index.html">Beranda</a><span>/</span><a href="shop.html">Toko</a>`;
    root.innerHTML = `
      <div class="empty" style="grid-column:1/-1;margin-top:24px">
        <h3>Produk tidak ditemukan</h3>
        <p>Mungkin tautannya sudah berubah. Lihat koleksi lain kami.</p>
        <a class="btn btn--primary btn--sm" href="shop.html">Kembali ke toko</a>
      </div>`;
    return;
  }

  document.title = `${product.name} — RUPA`;
  qs("#pdpCrumbs").innerHTML = `<a href="index.html">Beranda</a><span>/</span>
    <a href="shop.html">Toko</a><span>/</span>
    <a href="shop.html?category=${product.category}">${catLabel(
    product.category
  )}</a><span>/</span><span style="color:var(--ink)">${escapeHtml(
    product.name
  )}</span>`;

  const save = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  root.innerHTML = `
    <div class="pdp__gallery">
      <div class="pdp__stage">
        <img id="pdpStage" src="${productImage(product, 0)}" alt="${escapeHtml(
    product.name
  )}" width="800" height="1000">
      </div>
      <div class="pdp__thumbs" aria-label="Gambar produk">
        ${[0, 1, 2, 3]
          .map(
            (v) => `
          <button class="${v === 0 ? "is-active" : ""}" data-thumb="${v}" aria-label="Gambar ${v + 1}">
            <img src="${productImage(product, v)}" alt="" width="200" height="200">
          </button>`
          )
          .join("")}
      </div>
    </div>

    <div class="pdp__info">
      <p class="pdp__cat">${catLabel(product.category)}</p>
      <h1>${escapeHtml(product.name)}</h1>
      <div class="pdp__rating">
        <span class="stars">${stars(product.rating)}</span>
        ${product.rating.toFixed(1).replace(".", ",")} · ${product.reviews} ulasan
      </div>

      <div class="pdp__price">
        <span>${rp(product.price)}</span>
        ${product.oldPrice ? `<s>${rp(product.oldPrice)}</s>` : ""}
        ${save ? `<span class="pdp__save">−${save}%</span>` : ""}
      </div>

      <p class="pdp__desc">${escapeHtml(product.desc)}</p>

      <div class="option-label"><span>Ukuran</span><b id="sizeEcho">${
        product.sizes[0]
      }</b></div>
      <div class="size-list" role="group" aria-label="Pilih ukuran">
        ${product.sizes
          .map(
            (s, i) =>
              `<button class="size${
                i === 0 ? " is-active" : ""
              }" data-size="${s}">${s}</button>`
          )
          .join("")}
      </div>

      <div class="option-label"><span>Warna</span><b>Sesuai gambar</b></div>
      <div class="swatches" role="group" aria-label="Pilih warna">
        ${(product.colors || [])
          .map(
            (c, i) =>
              `<button class="swatch${
                i === 0 ? " is-active" : ""
              }" style="background:${c}" data-color="${c}" aria-label="Warna ${i + 1}"></button>`
          )
          .join("")}
      </div>

      <div class="pdp__buy">
        <div class="qty">
          <button data-qty="-1" aria-label="Kurangi jumlah">−</button>
          <span id="pdpQty">1</span>
          <button data-qty="1" aria-label="Tambah jumlah">${ICONS.plus}</button>
        </div>
        <button class="btn btn--primary" id="addToCart">Tambah ke keranjang</button>
      </div>

      <ul class="pdp__assur">
        <li>${ICONS.truck} Gratis pengiriman di atas ${rp(
    FREE_SHIPPING_MIN
  )} — tiba 2–4 hari kerja</li>
        <li>${ICONS.refresh} Pengembalian gratis 30 hari, tanpa pertanyaan</li>
        <li>${ICONS.shield} Pembayaran aman &amp; terenkripsi</li>
      </ul>

      <div class="acc">
        <div class="acc__item is-open">
          <button class="acc__btn" aria-expanded="true">Detail bahan &amp; ukuran <i>+</i></button>
          <div class="acc__panel">
            <ul>${product.details.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
          </div>
        </div>
        <div class="acc__item">
          <button class="acc__btn" aria-expanded="false">Pengiriman &amp; pengembalian <i>+</i></button>
          <div class="acc__panel">
            <p>Pesanan dikirim dari Yogyakarta dalam 1 × 24 jam. Gratis pengiriman
            untuk pesanan di atas ${rp(
              FREE_SHIPPING_MIN
            )}, selain itu dikenakan ${rp(
    SHIPPING_COST
  )}. Pengembalian gratis dalam 30 hari selama barang belum dipakai.</p>
          </div>
        </div>
        <div class="acc__item">
          <button class="acc__btn" aria-expanded="false">Perawatan <i>+</i></button>
          <div class="acc__panel">
            <p>Cuci dengan air dingin dan deterjen lembut. Hindari mesin pengering
            untuk menjaga bentuk kain. Setrika suhu sedang dari sisi dalam.</p>
          </div>
        </div>
      </div>
    </div>`;

  let selectedSize = product.sizes[0];
  let qty = 1;

  qsa("[data-size]", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      qsa("[data-size]", root).forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      selectedSize = btn.dataset.size;
      qs("#sizeEcho").textContent = selectedSize;
    })
  );

  qsa("[data-color]", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      qsa("[data-color]", root).forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    })
  );

  qsa("[data-thumb]", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      const v = Number(btn.dataset.thumb);
      qs("#pdpStage").src = productImage(product, v);
      qsa("[data-thumb]", root).forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    })
  );

  qsa("[data-qty]", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      qty = Math.max(1, Math.min(99, qty + Number(btn.dataset.qty)));
      qs("#pdpQty").textContent = qty;
    })
  );

  qs("#addToCart").addEventListener("click", () => {
    cart.add(product.id, selectedSize, qty);
    openDrawer();
  });

  qsa(".acc__btn", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    })
  );

  const related = qs("#relatedGrid");
  if (related) {
    const pool = PRODUCTS.filter(
      (p) => p.id !== product.id && p.category === product.category
    );
    const filler = PRODUCTS.filter(
      (p) => p.id !== product.id && p.category !== product.category
    );
    related.innerHTML = [...pool, ...filler]
      .slice(0, 4)
      .map(cardTemplate)
      .join("");
  }

  initReveal();
}

/* ---------------- Cart page ---------------- */

function renderCartPage() {
  const root = qs("#cartRoot");
  if (!root) return;
  const lines = cart.lines();

  if (!lines.length) {
    root.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <h3>Keranjangmu masih kosong</h3>
        <p>Mulai dari koleksi yang paling sering dipilih pelanggan kami.</p>
        <a class="btn btn--primary" href="shop.html">Belanja sekarang ${ICONS.arrow}</a>
      </div>`;
    return;
  }

  const t = totals();
  const promo = getPromo();
  const remaining = Math.max(0, FREE_SHIPPING_MIN - t.subtotal);
  const progress = Math.min(100, (t.subtotal / FREE_SHIPPING_MIN) * 100);

  root.innerHTML = `
    <div>
      <div class="cart-list">
        ${lines
          .map(
            (line) => `
          <div class="cart-row">
            <a href="product.html?id=${line.id}">
              <img class="cart-row__img" src="${productImage(line.product, 1)}" alt="${escapeHtml(
              line.product.name
            )}" width="92" height="115">
            </a>
            <div class="cart-row__main">
              <a class="cart-row__name" href="product.html?id=${line.id}">${escapeHtml(
              line.product.name
            )}</a>
              <span class="cart-row__opt">Ukuran ${escapeHtml(
                line.size
              )} · ${catLabel(line.product.category)}</span>
              <div class="cart-row__ctrl">
                <div class="qty qty--sm">
                  <button data-cart-qty="${line.id}|${line.size}|${
              line.qty - 1
            }" aria-label="Kurangi jumlah">−</button>
                  <span>${line.qty}</span>
                  <button data-cart-qty="${line.id}|${line.size}|${
              line.qty + 1
            }" aria-label="Tambah jumlah">${ICONS.plus}</button>
                </div>
                <button class="cart-row__remove" data-cart-remove="${line.id}|${
              line.size
            }">Hapus</button>
              </div>
            </div>
            <div class="cart-row__price">
              ${rp(line.lineTotal)}
              <small>${rp(line.product.price)} / pcs</small>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:22px;flex-wrap:wrap;gap:12px">
        <a class="link-arrow" href="shop.html">← Lanjut belanja</a>
        <button class="cart-row__remove" data-clear-cart>Kosongkan keranjang</button>
      </div>
    </div>

    <aside class="summary">
      <h2>Ringkasan pesanan</h2>
      ${
        remaining > 0
          ? `<div>
               <p class="mini-msg mini-msg--warn" style="margin-bottom:8px">Tambah ${rp(
                 remaining
               )} lagi untuk gratis pengiriman.</p>
               <div class="progress"><i style="width:${progress}%"></i></div>
             </div>`
          : `<p class="mini-msg">✓ Pengiriman gratis untuk pesanan ini.</p>`
      }
      <div class="summary__row"><span>Subtotal (${cart.count()} barang)</span><span>${rp(
        t.subtotal
      )}</span></div>
      ${
        t.discount
          ? `<div class="summary__row"><span>Diskon ${promo}</span><span>−${rp(
              t.discount
            )}</span></div>`
          : ""
      }
      <div class="summary__row"><span>Pengiriman</span><span>${
        t.shipping === 0 ? "Gratis" : rp(t.shipping)
      }</span></div>
      <div class="summary__row summary__row--total"><span>Total</span><b>${rp(
        t.total
      )}</b></div>

      <div>
        <div class="promo">
          <input class="input" id="promoInput" placeholder="Kode promo" aria-label="Kode promo" value="${
            promo || ""
          }">
          <button class="btn btn--sm" id="promoBtn">Pakai</button>
        </div>
        <p class="summary__note" style="margin-top:8px">Coba <b>RUPA10</b> atau <b>HEMAT50</b>.</p>
      </div>

      <a class="btn btn--primary btn--block" href="checkout.html">Lanjut ke pembayaran ${ICONS.arrow}</a>
      <p class="summary__note">${ICONS.shield} Pembayaran diproses secara aman. Ini demo
      frontend — tidak ada transaksi nyata.</p>
    </aside>`;
}

function initCartPage() {
  renderCartPage();
  const root = qs("#cartRoot");

  root.addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-cart-qty]");
    if (qtyBtn) {
      const [id, size, qty] = qtyBtn.dataset.cartQty.split("|");
      cart.setQty(id, size, Number(qty));
      return;
    }
    const removeBtn = e.target.closest("[data-cart-remove]");
    if (removeBtn) {
      const [id, size] = removeBtn.dataset.cartRemove.split("|");
      cart.remove(id, size);
      toast("Produk dihapus dari keranjang");
      return;
    }
    if (e.target.closest("[data-clear-cart]")) {
      if (confirm("Kosongkan semua produk di keranjang?")) {
        cart.clear();
        toast("Keranjang dikosongkan");
      }
      return;
    }
    if (e.target.closest("#promoBtn")) {
      const input = qs("#promoInput");
      const code = input.value.trim().toUpperCase();
      if (!code) return;
      if (PROMO_CODES[code]) {
        storage.set(PROMO_KEY, code);
        toast(`Kode ${code} dipakai — ${PROMO_CODES[code].label}`);
      } else {
        storage.set(PROMO_KEY, null);
        toast("Kode promo tidak dikenal");
      }
      renderCartPage();
    }
  });
}

/* ---------------- Checkout ---------------- */

function renderCheckoutSummary() {
  const box = qs("#checkoutSummary");
  if (!box) return;
  const lines = cart.lines();
  const t = totals();
  const promo = getPromo();

  if (!lines.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="order-mini">
      ${lines
        .map(
          (line) => `
        <div class="order-mini__row">
          <div style="position:relative">
            <img src="${productImage(line.product, 1)}" alt="" width="48" height="60">
            <span style="position:absolute;top:-6px;right:-6px;background:var(--ink);color:#fff;border-radius:50%;width:18px;height:18px;font-size:.66rem;display:grid;place-items:center">${
              line.qty
            }</span>
          </div>
          <div><b>${escapeHtml(line.product.name)}</b><small>${escapeHtml(
            line.size
          )}</small></div>
          <span>${rp(line.lineTotal)}</span>
        </div>`
        )
        .join("")}
    </div>
    <div class="summary__row"><span>Subtotal</span><span>${rp(t.subtotal)}</span></div>
    ${
      t.discount
        ? `<div class="summary__row"><span>Diskon ${promo}</span><span>−${rp(
            t.discount
          )}</span></div>`
        : ""
    }
    <div class="summary__row"><span>Pengiriman</span><span>${
      t.shipping === 0 ? "Gratis" : rp(t.shipping)
    }</span></div>
    <div class="summary__row summary__row--total"><span>Total</span><b>${rp(
      t.total
    )}</b></div>
    <p class="summary__note">${ICONS.leaf} Setiap pesanan dikemas tanpa plastik
    sekali pakai. Terima kasih sudah memilih dengan sadar.</p>`;
}

function initCheckout() {
  const root = qs("#checkoutRoot");
  const lines = cart.lines();

  if (!lines.length) {
    root.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <h3>Tidak ada yang bisa dibayar</h3>
        <p>Keranjangmu kosong. Pilih produk dulu, ya.</p>
        <a class="btn btn--primary" href="shop.html">Ke halaman toko</a>
      </div>`;
    return;
  }

  renderCheckoutSummary();

  const promoInput = qs("#checkoutPromo");
  const promoBtn = qs("#checkoutPromoBtn");
  if (promoInput && getPromo()) promoInput.value = getPromo();
  promoBtn?.addEventListener("click", () => {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      storage.set(PROMO_KEY, code);
      toast(`Kode ${code} dipakai — ${PROMO_CODES[code].label}`);
    } else {
      storage.set(PROMO_KEY, null);
      toast("Kode promo tidak dikenal");
    }
    renderCheckoutSummary();
  });

  const form = qs("#checkoutForm");
  const fields = {
    name: { el: qs("#fName"), test: (v) => v.trim().length >= 3 },
    email: { el: qs("#fEmail"), test: (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) },
    phone: { el: qs("#fPhone"), test: (v) => v.replace(/\D/g, "").length >= 9 },
    address: { el: qs("#fAddress"), test: (v) => v.trim().length >= 8 },
    city: { el: qs("#fCity"), test: (v) => v.trim().length >= 3 },
    zip: { el: qs("#fZip"), test: (v) => /^\d{5}$/.test(v.trim()) },
  };

  Object.values(fields).forEach(({ el }) => {
    el.addEventListener("input", () => {
      if (el.closest(".field").classList.contains("has-error") && el.value) {
        el.closest(".field").classList.remove("has-error");
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    let firstInvalid = null;

    Object.values(fields).forEach(({ el, test }) => {
      const field = el.closest(".field");
      const ok = test(el.value || "");
      field.classList.toggle("has-error", !ok);
      if (!ok) {
        valid = false;
        if (!firstInvalid) firstInvalid = el;
      }
    });

    const payment = qs('input[name="payment"]:checked');
    if (!payment) {
      toast("Pilih metode pembayaran dulu");
      valid = false;
    }

    if (!valid) {
      firstInvalid?.focus();
      toast("Lengkapi data pengiriman terlebih dahulu");
      return;
    }

    const orderId =
      "RPA-" +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      Math.floor(Math.random() * 90 + 10);

    const t = totals();
    storage.set("rupa_last_order", {
      id: orderId,
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      total: t.total,
      payment: payment ? payment.value : "-",
      at: new Date().toISOString(),
    });

    document.body.dataset.done = "1";
    const itemsCount = cart.count();
    cart.clear();

    root.innerHTML = `
      <div class="success">
        <div class="success__mark">${ICONS.check}</div>
        <p class="eyebrow" style="justify-content:center"><span class="dot"></span>Pesanan diterima</p>
        <h1 style="margin-top:10px">Terima kasih, ${escapeHtml(
          fields.name.el.value.trim().split(" ")[0]
        )}!</h1>
        <p>Pesanan berisi ${itemsCount} barang sudah kami catat dan akan dikirim
        ke ${escapeHtml(fields.city.el.value.trim())} dalam 2–4 hari kerja.</p>
        <span class="success__id">${orderId}</span>
        <p style="font-size:.82rem;color:var(--muted)">Konfirmasi dikirim ke
        ${escapeHtml(fields.email.el.value.trim())}. Total ${rp(t.total)}.</p>
        <div class="success__actions">
          <a class="btn btn--primary" href="shop.html">Belanja lagi</a>
          <a class="btn btn--ghost" href="index.html">Ke beranda</a>
        </div>
        <p class="summary__note" style="justify-content:center;margin-top:22px">
          Ini demo frontend tanpa backend — tidak ada pembayaran yang diproses.
        </p>
      </div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------------- Boot ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  initChrome();
  const page = document.body.dataset.page;

  if (page === "home") initHome();
  if (page === "shop") initShop();
  if (page === "product") initProduct();
  if (page === "cart") initCartPage();
  if (page === "checkout") initCheckout();

  // Form newsletter (semua halaman)
  qsa("[data-newsletter]").forEach((form) =>
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = qs("input", form);
      if (!input.value.includes("@")) {
        toast("Masukkan alamat email yang valid");
        input.focus();
        return;
      }
      toast("Terima kasih! Cek kotak masukmu untuk kode selamat datang.");
      form.reset();
    })
  );
});
