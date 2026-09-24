/* ================================================================
   ROLLPOINT — CORE CUSTOMER APPLICATION
   Full-stack integration connecting dynamic MongoDB data,
   thermal receipt engine, order checkout, WhatsApp flow,
   and customer reviews.
   ================================================================ */

// Live Business Config (loaded dynamically from database settings)
let BUSINESS = {
  name: 'RollPoint',
  tagline: 'Counter supplies, delivered.',
  heroKicker: '// Counter supplies · Pakistan',
  heroTitle: 'Thermal rolls, labels & POS gear — delivered to your counter.',
  heroSubtitle: 'Genuine BPA-free thermal paper, shipping labels and point-of-sale hardware for shops that never stop. Flat Rs. 250 delivery, cash on delivery, nationwide.',
  heroStats: '1,200+ shops supplied · 48h major-city delivery · 4.8 average rating',
  heroChip: '−19% on rolls',
  heroBtn1Text: 'Shop all products',
  heroBtn2Text: 'Browse categories',
  heroImage: 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg',
  heroProductSlug: 'thermal-roll-80x80',
  usp1Title: 'Flat Rs. 250 delivery',
  usp1Sub: 'Anywhere in Pakistan',
  usp2Title: 'Cash on delivery',
  usp2Sub: 'Pay when it arrives',
  usp3Title: 'Genuine stock',
  usp3Sub: 'BPA-free thermal paper',
  usp4Title: 'WhatsApp ordering',
  usp4Sub: '0308 9134302',
  whatsappLocal: '0308 9134302',
  whatsappIntl:  '923089134302',
  email: 'malikusmanhaider0346@gmail.com',
  address: 'Rehmat Plaza, Pakistan Town Phase 2 Rd, near Allah Wali Masjid, Phase 2 Islamabad, 45720, Pakistan',
  mapsUrl: 'https://maps.app.goo.gl/N9xDnGzuN3n8PbCD6?g_st=awb',
  hours: 'Mon–Sat · 10:00 am – 8:00 pm',
  shippingRate: 250,
  footerAboutText: 'RollPoint supplies genuine BPA-free thermal rolls, labels and POS hardware to counters across Pakistan — dispatched within 24 hours, delivered on cash-on-delivery.'
};

// Utilities
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatPrice = n => 'Rs. ' + Number(n || 0).toLocaleString('en-US');
const formatDate = iso => { if (!iso) return ''; const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const debounce = (fn, ms = 160) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const STAR = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.7l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.3l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"/></svg>';

function stars(rating, cls = '') {
  const num = Number(rating) || 5;
  const row = STAR.repeat(5);
  const pct = (Math.min(num, 5) / 5 * 100).toFixed(1);
  return `<span class="stars ${cls}" role="img" aria-label="${num} out of 5 stars">
    <span class="stars-row">${row}</span>
    <span class="stars-row stars-fg" style="width:${pct}%">${row}</span>
  </span>`;
}

function refreshIcons(scope = document) {
  try { lucide.createIcons(); } catch (e) {}
}

// Order Math (Fixed Rs. 250 shipping)
const OrderMath = {
  get FLAT_SHIPPING() { return BUSINESS.shippingRate || 250; },
  subtotal(price, qty) { return Number(price) * Number(qty); },
  shipping() { return this.FLAT_SHIPPING; },
  total(price, qty) { return this.subtotal(price, qty) + this.shipping(); },

  buildWhatsAppMessage(order) {
    const lines = [
      '*NEW ORDER*',
      '',
      `*Order ID:* ${order.orderId || order.id}`,
      `*Product:* ${order.productName || (order.items && order.items[0]?.name)}`,
      `*Price:* ${formatPrice(order.productPrice || (order.items && order.items[0]?.price))}`,
      `*Quantity:* ${order.quantity || (order.items && order.items[0]?.qty)}`,
      `*Product Total:* ${formatPrice(order.productTotal || order.subtotal)}`,
      `*Shipping:* ${formatPrice(order.shipping)} (Flat Nationwide)`,
      `*Grand Total:* ${formatPrice(order.grandTotal || order.total)}`,
      '',
      '*CUSTOMER DETAILS*',
      `*Name:* ${order.customerName || order.customer?.name}`,
      `*WhatsApp:* ${order.customerPhone || order.customer?.phone}`,
      (order.customerEmail || order.customer?.email) ? `*Email:* ${order.customerEmail || order.customer?.email}` : null,
      `*Address:* ${order.customerAddress || order.customer?.address}`,
      `*City:* ${order.customerCity || order.customer?.city}`,
      (order.customerNotes || order.customer?.notes) ? `*Notes:* ${order.customerNotes || order.customer?.notes}` : null,
      '',
      '_Sent via RollPoint Web Checkout_'
    ].filter(Boolean);
    return lines.join('\n');
  }
};

// UI Components
const Components = {
  logo(bg = 'var(--ink)', fg = 'var(--paper)') {
    return `<svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="${bg}"/>
      <circle cx="20" cy="15.5" r="8" stroke="${fg}" stroke-width="2.4"/>
      <circle cx="20" cy="15.5" r="2.8" stroke="${fg}" stroke-width="2"/>
      <path d="M14 23.5V31l3-2.4 3 2.4 3-2.4 3 2.4v-7.5" stroke="${fg}" stroke-width="2.4" stroke-linejoin="round" fill="none"/>
    </svg>`;
  },

  brand(dark = false) {
    return `<a class="brand" href="#/" aria-label="${BUSINESS.name} home">
      ${this.logo(dark ? 'var(--inv)' : 'var(--ink)', dark ? 'var(--ink-bg)' : 'var(--paper)')}
      <span class="brand-name">${esc(BUSINESS.name || 'RollPoint')}</span></a>`;
  },

  productCard(p, catName) {
    const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const out = p.stock <= 0;
    const img0 = (p.images && p.images[0]) || 'https://picsum.photos/600/600';
    const img1 = (p.images && p.images[1]) || img0;
    const categoryTitle = catName || p.categoryName || p.category || '';

    return `
    <article class="p-card reveal">
      <a class="p-media" href="#/product/${p.slug}" aria-label="${esc(p.name)}">
        <img class="main" src="${img0}" alt="${esc(p.name)}" loading="lazy">
        <img class="alt" src="${img1}" alt="" loading="lazy" aria-hidden="true">
        ${out ? '<span class="p-out-badge">Out of stock</span>'
              : disc ? `<span class="p-badge">−${disc}%</span>` : ''}
      </a>
      <div class="p-body">
        <span class="p-cat">${esc(categoryTitle)}</span>
        <h3 class="p-name"><a href="#/product/${p.slug}">${esc(p.name)}</a></h3>
        <div class="p-rate">${stars(p.rating)}<b>${(p.rating || 5.0).toFixed(1)}</b><span>(${p.reviewCount || 0})</span></div>
        <p class="p-desc">${esc(p.shortDescription)}</p>
        <div class="p-foot">
          <div class="p-price">
            <span class="price-now">${formatPrice(p.price)}</span>
            ${p.oldPrice ? `<s class="price-old">${formatPrice(p.oldPrice)}</s>` : ''}
          </div>
          <button class="btn btn-order" data-action="order-now" data-id="${p.id}" data-qty="1" ${out ? 'disabled' : ''}>
            <i data-lucide="package"></i> Order Now
          </button>
        </div>
      </div>
    </article>`;
  },

  rail(products, railId = '') {
    return `<div class="rail" ${railId ? `id="${railId}"` : ''}>
      ${products.map(p => this.productCard(p, p.categoryName || p.category)).join('')}
    </div>`;
  },

  sectionHead(kicker, title, sub = '', link = null, railId = null) {
    return `<div class="section-head reveal">
      <div>
        <p class="kicker">${kicker}</p>
        <h2>${title}</h2>
        ${sub ? `<p class="head-sub">${sub}</p>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:18px">
        ${railId ? `<div class="rail-arrows">
          <button class="icon-btn" data-action="rail-prev" data-target="${railId}" aria-label="Scroll left"><i data-lucide="arrow-left"></i></button>
          <button class="icon-btn" data-action="rail-next" data-target="${railId}" aria-label="Scroll right"><i data-lucide="arrow-right"></i></button>
        </div>` : ''}
        ${link ? `<a class="head-link" href="${link.href}">${link.label} <i data-lucide="arrow-right"></i></a>` : ''}
      </div>
    </div>`;
  },

  breadcrumbs(items) {
    return `<nav class="crumbs" aria-label="Breadcrumb">
      ${items.map((it, i) => i === items.length - 1
        ? `<span class="here">${esc(it.label)}</span>`
        : `<a href="${it.href}">${esc(it.label)}</a><i data-lucide="chevron-right"></i>`).join('')}
    </nav>`;
  },

  receipt(p, qty, opts = {}) {
    const sub = OrderMath.subtotal(p.price, qty);
    const ship = OrderMath.shipping();
    const total = OrderMath.total(p.price, qty);
    return `
    <div class="receipt tear-b" style="position:relative">
      ${opts.stamp ? '<span class="stamp">RECEIVED</span>' : ''}
      <div class="r-brand">${esc(BUSINESS.name.toUpperCase())}</div>
      <div class="r-store">Counter supplies · ${esc(BUSINESS.address.split(',').pop().trim())}</div>
      <div class="r-dash"></div>
      <div class="r-item-name">${esc(p.name)}</div>
      <div class="r-calc">${formatPrice(p.price)} × ${qty} unit${qty > 1 ? 's' : ''}</div>
      <div class="r-line"><span>Subtotal</span><span class="dots"></span><span>${formatPrice(sub)}</span></div>
      <div class="r-line"><span>Shipping (flat)</span><span class="dots"></span><span>${formatPrice(ship)}</span></div>
      <div class="r-dash"></div>
      <div class="r-line r-total"><span>TOTAL</span><span class="dots"></span><span>${formatPrice(total)}</span></div>
      <div class="r-cod">Cash on delivery · Flat rate nationwide</div>
      <div class="barcode" aria-hidden="true"></div>
      ${opts.orderId ? `<div class="r-id">${esc(opts.orderId)}</div>` : '<div class="r-id">DRAFT · NOT PAID</div>'}
    </div>`;
  },

  reviewsSection(p) {
    const reviewsList = p.reviews || [];
    return `
    <div class="reviews-top">
      <div style="display:flex;align-items:center;gap:34px;flex-wrap:wrap">
        <h2>Customer reviews</h2>
        <div class="rating-summary">
          <span class="rating-avg">${(p.rating || 5.0).toFixed(1)}</span>
          <div>
            ${stars(p.rating || 5.0, 'lg')}
            <small>${p.reviewCount || reviewsList.length} verified review${(p.reviewCount || reviewsList.length) !== 1 ? 's' : ''}</small>
          </div>
        </div>
      </div>
      <button class="btn btn-outline" data-action="review-open" data-slug="${p.slug}">
        <i data-lucide="pen-line"></i> Write a Review
      </button>
    </div>

    <form class="review-form" id="review-form" data-form="review" data-slug="${p.slug}" novalidate>
      <div class="form-title" style="font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">Submit Your Review</div>
      <div class="form-grid">
        <div class="field">
          <label for="rv-name">Your name *</label>
          <input id="rv-name" name="name" type="text" placeholder="e.g. Sana Malik" required>
          <span class="err">Please enter your name.</span>
        </div>
        <div class="field">
          <label>Your rating *</label>
          <div class="rate-pick" id="rate-pick" data-value="5">
            ${[5,4,3,2,1].map(v => `<button type="button" class="rate-btn ${v <= 5 ? 'on' : ''}" data-action="rating-pick" data-value="${v}" aria-label="${v} star${v>1?'s':''}">${STAR}</button>`).join('')}
          </div>
          <span class="err" id="rv-rating-err" style="display:none;color:var(--red);font-size:12.5px;font-weight:500">Please pick a star rating.</span>
        </div>
        <div class="field full">
          <label for="rv-text">Your review *</label>
          <textarea id="rv-text" name="text" placeholder="How was the product quality and delivery experience?" required></textarea>
          <span class="err">Please write at least 5 characters.</span>
        </div>
      </div>
      <button class="btn btn-accent" type="submit" id="rv-submit-btn" style="margin-top:18px">
        <i data-lucide="check"></i> Submit Review
      </button>
    </form>

    <div class="review-list" id="review-list">
      ${reviewsList.length ? reviewsList.map(r => `
        <article class="review">
          <div class="review-head">
            <span class="avatar">${esc((r.name || '?').trim()[0] || '?').toUpperCase()}</span>
            <div><b>${esc(r.name)}</b><small>${formatDate(r.date || r.createdAt)}</small></div>
            ${stars(r.rating)}
          </div>
          <p>${esc(r.text)}</p>
        </article>`).join('') : '<div style="padding:20px 0;color:var(--muted)">No reviews yet. Be the first to review this product!</div>'}
    </div>`;
  }
};

// Pages
const Pages = {
  // ---------------- HOME PAGE ----------------
  home: {
    async load() {
      const [cats, featured, fresh] = await Promise.all([
        Api.getCategories(),
        Api.getProducts({ featuredOnly: true }),
        Api.getProducts({ sort: 'newest', limit: 8 })
      ]);
      return { cats, featured, fresh };
    },
    render({ cats, featured, fresh }) {
      const tiles = cats.map((c, i) => `
        <a class="cat-tile ${i === 0 ? 't-big' : ''} ${i === cats.length - 1 ? 't-wide' : ''} reveal"
           href="#/category/${c.slug}">
          <img src="https://picsum.photos/seed/rp-cat-${c.slug}/720/560.jpg" alt="${esc(c.name)}" loading="lazy">
          <span class="cat-arrow"><i data-lucide="arrow-up-right"></i></span>
          <span class="cat-info"><b>${esc(c.name)}</b><span>${c.count} product${c.count !== 1 ? 's' : ''}</span></span>
        </a>`).join('');
      const viewAll = `<a class="cat-tile cat-all reveal" href="#/shop">
        <i data-lucide="arrow-right"></i><b>View all products</b></a>`;

      const statParts = (BUSINESS.heroStats || '').split('·').map(s => s.trim()).filter(Boolean);
      const statsHtml = statParts.length ? statParts.map(s => `<span>${esc(s)}</span>`).join('') : `<span>1,200+ shops supplied</span><span>48h major-city delivery</span><span>4.8 average rating</span>`;

      return `
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy reveal">
            <p class="kicker">${esc(BUSINESS.heroKicker || '// Counter supplies · Pakistan')}</p>
            <h1>${esc(BUSINESS.heroTitle || 'Thermal rolls, labels & POS gear — delivered to your counter.')}</h1>
            <p class="hero-sub">${esc(BUSINESS.heroSubtitle || 'Genuine BPA-free thermal paper, shipping labels and point-of-sale hardware for shops that never stop. Flat Rs. 250 delivery, cash on delivery, nationwide.')}</p>
            <div class="hero-cta">
              <a class="btn btn-ink btn-lg" href="#/shop">${esc(BUSINESS.heroBtn1Text || 'Shop all products')} <i data-lucide="arrow-right"></i></a>
              <a class="btn btn-whatsapp btn-lg" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent('Hi RollPoint! I want to order thermal rolls & supplies.')}" target="_blank">
                <i data-lucide="message-circle"></i> Chat on WhatsApp
              </a>
            </div>
            <div class="hero-stats mono">
              ${statsHtml}
            </div>
          </div>
          <div class="hero-visual reveal">
            <a class="hero-photo-link" href="${BUSINESS.heroProductSlug ? `#/product/${esc(BUSINESS.heroProductSlug)}` : '#/shop'}" title="View featured product">
              <figure class="hero-photo">
                <img src="${esc(BUSINESS.heroImage || 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg')}" alt="${esc(BUSINESS.name)} — Counter supplies">
              </figure>
            </a>
            ${BUSINESS.heroChip ? `<span class="hero-chip">${esc(BUSINESS.heroChip)}</span>` : ''}
          </div>
        </div>
      </section>

      <section class="trust">
        <div class="container trust-in">
          <div class="trust-item reveal"><i data-lucide="truck"></i><div><b>${esc(BUSINESS.usp1Title || 'Flat Rs. 250 delivery')}</b><small>${esc(BUSINESS.usp1Sub || 'Anywhere in Pakistan')}</small></div></div>
          <div class="trust-item reveal"><i data-lucide="banknote"></i><div><b>${esc(BUSINESS.usp2Title || 'Cash on delivery')}</b><small>${esc(BUSINESS.usp2Sub || 'Pay when it arrives')}</small></div></div>
          <div class="trust-item reveal"><i data-lucide="badge-check"></i><div><b>${esc(BUSINESS.usp3Title || 'Genuine stock')}</b><small>${esc(BUSINESS.usp3Sub || 'BPA-free thermal paper')}</small></div></div>
          <div class="trust-item reveal"><i data-lucide="message-circle"></i><div><b>${esc(BUSINESS.usp4Title || 'WhatsApp ordering')}</b><small>${esc(BUSINESS.usp4Sub || BUSINESS.whatsappLocal)}</small></div></div>
        </div>
      </section>

      <section class="section" id="home-cats">
        <div class="container">
          ${Components.sectionHead('01 — Catalog', 'Shop by category', 'Six focused aisles — nothing you don’t need, everything your counter does.', { href: '#/shop', label: 'All products' })}
          <div class="mobile-cat-strip">
            <a class="cat-chip active" href="#/shop"><i data-lucide="layout-grid"></i> All Products</a>
            ${cats.map(c => `<a class="cat-chip" href="#/category/${c.slug}">${esc(c.name)}</a>`).join('')}
          </div>
          <div class="cat-grid">${tiles}${viewAll}</div>
        </div>
      </section>

      <section class="section" style="padding-top:8px">
        <div class="container">
          ${Components.sectionHead('02 — Best sellers', 'Featured this week', '', { href: '#/shop', label: 'View all' }, 'feat-rail')}
          <div class="rail-wrap">
            <div class="rail" id="feat-rail">${featured.map(p => Components.productCard(p, p.categoryName || p.category)).join('')}</div>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="deal reveal">
            <div class="deal-copy">
              <p class="kicker">Stock-up deal</p>
              <h2>Buy 10 rolls, pay for 9.</h2>
              <p>Order any ten 80mm or 57mm thermal rolls and the eleventh is on us — applied when our team confirms your order on WhatsApp.</p>
              <a class="btn btn-accent btn-lg" href="#/category/thermal-rolls">Shop thermal rolls <i data-lucide="arrow-right"></i></a>
            </div>
            <div class="deal-media">
              <img src="https://picsum.photos/seed/rp-deal-rolls/880/560.jpg" alt="Stack of thermal rolls" loading="lazy">
              <span class="deal-tag">Up to 19% off rolls</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top:8px">
        <div class="container">
          ${Components.sectionHead('03 — Fresh stock', 'Just arrived', 'The latest additions to our shelves, ready to ship.', { href: '#/shop', label: 'Browse everything' })}
          <div class="grid-products">${fresh.map(p => Components.productCard(p, p.categoryName || p.category)).join('')}</div>
        </div>
      </section>

      <section class="steps">
        <div class="container steps-in">
          <div class="step reveal"><span class="step-num">01</span><div><b>Pick your product</b><p>Choose from rolls, labels and POS gear — no account needed.</p></div></div>
          <div class="step reveal"><span class="step-num">02</span><div><b>Fill the order form</b><p>Name, number, address. Total calculates live, shipping always Rs. 250.</p></div></div>
          <div class="step reveal"><span class="step-num">03</span><div><b>WhatsApp Instant Confirm</b><p>Order saves directly in database and WhatsApp opens with details.</p></div></div>
        </div>
      </section>`;
    }
  },

  // ---------------- LISTING PAGE ----------------
  listing: {
    async load(params) {
      const [cats, all, products] = await Promise.all([
        Api.getCategories(),
        Api.getProducts({}),
        Api.getProducts(params)
      ]);
      return { cats, all, products, params };
    },
    render({ cats, all, products, params }) {
      const cat = params.category ? cats.find(c => c.slug === params.category) : null;
      let title = 'All products', sub = 'Every roll, label and device on our shelves — filter and sort to find what you need.';
      if (cat) { title = cat.name; sub = cat.tagline || `${cat.name} supplies.`; }
      if (params.q) { title = `Results for “${esc(params.q)}”`; sub = 'Matching products from across the store.'; }

      const catLink = (c) => `<a class="${params.category === c.slug ? 'active' : ''}" href="#/category/${c.slug}">${esc(c.name)}<span>${c.count}</span></a>`;
      const chip = c => `<a class="${params.category === c.slug ? 'active' : ''}" href="#/category/${c.slug}">${esc(c.name)}</a>`;

      const crumbs = Components.breadcrumbs([
        { label: 'Home', href: '#/' },
        ...(cat ? [{ label: 'Categories', href: '#/shop' }, { label: cat.name, href: '#' }] : [{ label: 'Shop', href: '#' }])
      ]);

      const grid = products.length
        ? `<div class="grid-products" id="listing-grid">${products.map(p => Components.productCard(p, p.categoryName || p.category)).join('')}</div>`
        : `<div class="empty-state">
             <i data-lucide="package-search"></i>
             <h3>Nothing matched</h3><p>Try a different keyword or browse the full catalog.</p>
             <a class="btn btn-ink" href="#/shop">Browse all products</a>
           </div>`;

      return `
      <div class="container page-head">
        ${crumbs}
        <div class="listing-head"><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>
      </div>
      <div class="container">
        <div class="mobile-filters">
          <a class="${!params.category ? 'active' : ''}" href="#/shop">All</a>
          ${cats.map(chip).join('')}
        </div>
        <div class="listing-grid">
          <aside class="filters">
            <div class="filter-group">
              <h5>Categories</h5>
              <nav class="filter-cat">
                <a class="${!params.category ? 'active' : ''}" href="#/shop">All products<span>${all.length}</span></a>
                ${cats.map(c => catLink(c)).join('')}
              </nav>
            </div>
            <div class="filter-group">
              <h5>Availability</h5>
              <label class="check-row"><input type="checkbox" data-role="stock-toggle" ${params.inStockOnly ? 'checked' : ''}> In stock only</label>
            </div>
          </aside>
          <div>
            <div class="listing-bar">
              <span class="result-count">Showing <b>${products.length}</b> of <b>${all.length}</b> products</span>
              <div class="sort-wrap">
                <span>Sort</span>
                <select data-role="sort" aria-label="Sort products">
                  <option value="featured" ${params.sort === 'featured' || !params.sort ? 'selected' : ''}>Featured</option>
                  <option value="price-asc" ${params.sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                  <option value="price-desc" ${params.sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
                  <option value="rating" ${params.sort === 'rating' ? 'selected' : ''}>Top rated</option>
                  <option value="newest" ${params.sort === 'newest' ? 'selected' : ''}>Newest</option>
                </select>
              </div>
            </div>
            ${grid}
          </div>
        </div>
      </div>`;
    },
    mount(data) {
      const reRun = async () => {
        const sort = document.querySelector('[data-role="sort"]')?.value || 'featured';
        const inStockOnly = document.querySelector('[data-role="stock-toggle"]')?.checked || false;
        const products = await Api.getProducts({ ...data.params, sort, inStockOnly });
        const bar = document.querySelector('.result-count');
        if (bar) bar.innerHTML = `Showing <b>${products.length}</b> of <b>${data.all.length}</b> products`;
        const grid = document.getElementById('listing-grid');
        if (grid) {
          grid.innerHTML = products.map(p => Components.productCard(p, p.categoryName || p.category)).join('');
          refreshIcons(); hydrateReveals(grid);
        }
      };
      document.querySelector('[data-role="sort"]')?.addEventListener('change', reRun);
      document.querySelector('[data-role="stock-toggle"]')?.addEventListener('change', reRun);
    }
  },

  // ---------------- PRODUCT DETAIL PAGE (PDP) ----------------
  product: {
    async load(params) {
      const p = await Api.getProduct(params.slug);
      if (!p) throw new Error('Product not found');
      const related = (await Api.getProducts({ category: p.category }))
        .filter(x => x.id !== p.id).slice(0, 6);
      return { p, related };
    },
    render({ p, related }) {
      const out = p.stock <= 0;
      const low = !out && p.stock <= 10;
      const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
      const stock = out ? { dot: 'var(--red)', label: 'Out of stock — restocking soon' }
        : low ? { dot: 'var(--accent)', label: `Low stock — only ${p.stock} left` }
        : { dot: 'var(--green)', label: `In stock — ${p.stock} units available` };

      const images = (p.images && p.images.length) ? p.images : ['https://picsum.photos/640/640'];
      const specsObj = p.specifications instanceof Map ? Object.fromEntries(p.specifications) : (p.specifications || {});

      return `
      <div class="container pdp">
        ${Components.breadcrumbs([
          { label: 'Home', href: '#/' },
          { label: p.categoryName || p.category, href: `#/category/${p.category}` },
          { label: p.name, href: '#' }
        ])}
        <div class="pdp-grid">
          <div class="reveal">
            <div class="gallery-main"><img id="gallery-main" src="${images[0]}" alt="${esc(p.name)}"></div>
            <div class="thumbs">
              ${images.map((src, i) => `
                <button class="thumb ${i === 0 ? 'active' : ''}" data-action="select-thumb" data-src="${src}" aria-label="View image ${i + 1}">
                  <img src="${src}" alt="" loading="lazy">
                </button>`).join('')}
            </div>
          </div>
          <div class="pdp-info reveal">
            <a class="pdp-cat" href="#/category/${p.category}">${esc(p.categoryName || p.category)}</a>
            <h1>${esc(p.name)}</h1>
            <div class="pdp-rate">
              ${stars(p.rating)}<b>${(p.rating || 5.0).toFixed(1)}</b>
              <button class="pdp-rate-link" data-action="scroll-to" data-target="#reviews" style="all:unset;cursor:pointer;color:var(--muted);text-decoration:underline;text-underline-offset:3px;font-size:14px">(${p.reviewCount || (p.reviews && p.reviews.length) || 0} reviews)</button>
            </div>
            <div class="price-block">
              <span class="now">${formatPrice(p.price)}</span>
              ${p.oldPrice ? `<s class="old">${formatPrice(p.oldPrice)}</s><span class="save-tag">Save ${formatPrice(p.oldPrice - p.price)} · −${disc}%</span>` : ''}
            </div>
            <p class="pdp-short">${esc(p.shortDescription)}</p>
            <div class="stock-line"><span class="stock-dot" style="background:${stock.dot}"></span>${stock.label}</div>
            <div class="buy-row">
              <div class="qty" aria-label="Quantity selector">
                <button data-action="qty-minus" aria-label="Decrease quantity"><i data-lucide="minus"></i></button>
                <span class="qty-val" id="qty-val">1</span>
                <button data-action="qty-plus" aria-label="Increase quantity"><i data-lucide="plus"></i></button>
              </div>
              <button class="btn btn-accent btn-lg btn-buy" id="main-buy-btn" data-action="order-now" data-id="${p.id}" ${out ? 'disabled' : ''}>
                <i data-lucide="package"></i> Order Now (COD)
              </button>
              <a class="btn btn-whatsapp btn-buy-wa" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent(`Hi RollPoint! I want to order ${p.name} (Rs. ${p.price}). Please confirm availability.`)}" target="_blank">
                <i data-lucide="message-circle"></i> Order via WhatsApp
              </a>
            </div>
            <ul class="perks">
              <li><i data-lucide="truck"></i>Flat ${formatPrice(OrderMath.FLAT_SHIPPING)} delivery</li>
              <li><i data-lucide="banknote"></i>Cash on delivery</li>
              <li><i data-lucide="shield-check"></i>7-day replacement</li>
            </ul>
            <p class="buy-note mono">Direct ordering · No account needed · Confirmed on WhatsApp</p>
          </div>
        </div>

        <div class="pdp-detail reveal">
          <div>
            <h2>Description</h2>
            <div class="prose">${(p.description || p.shortDescription || '').split('\n\n').map(t => `<p>${esc(t)}</p>`).join('')}</div>
          </div>
          <div>
            <h2>Specifications</h2>
            <dl class="spec-list">
              ${Object.entries(specsObj).map(([k, v]) => `
                <div class="spec-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
            </dl>
          </div>
        </div>

        <section class="reviews reveal" id="reviews">${Components.reviewsSection(p)}</section>

        ${related.length ? `
        <section style="margin-top:56px">
          ${Components.sectionHead('You may also need', 'Related products', '', { href: `#/category/${p.category}`, label: 'More products' }, 'rel-rail')}
          <div class="rail" id="rel-rail">${related.map(r => Components.productCard(r, r.categoryName || r.category)).join('')}</div>
        </section>` : ''}
      </div>`;
    },
    mount(data) {
      if (data && data.p) {
        UI.setupPdpStickyBar(data.p);
      }
    }
  },

  // ---------------- ORDER FORM PAGE ----------------
  order: {
    async load(params) {
      const p = await Api.getProductById(params.id);
      if (!p) throw new Error('Product not found');
      const qty = Math.min(99, Math.max(1, parseInt(params.qty, 10) || 1));
      if (p.stock <= 0) throw new Error('Product is out of stock');
      return { p, qty };
    },
    render({ p, qty }) {
      const img0 = (p.images && p.images[0]) || 'https://picsum.photos/600/600';
      const sub = OrderMath.subtotal(p.price, qty);
      const ship = OrderMath.shipping();
      const total = OrderMath.total(p.price, qty);

      const mobileSummaryHtml = `
      <div class="mobile-order-summary" id="mobile-order-summary">
        <div class="summary-toggle" data-action="toggle-summary">
          <span class="sum-left">
            <i data-lucide="receipt"></i>
            <span>Order Summary (${qty} item${qty > 1 ? 's' : ''})</span>
          </span>
          <span style="display:flex;align-items:center;gap:8px">
            <span class="sum-price">${formatPrice(total)}</span>
            <i data-lucide="chevron-down"></i>
          </span>
        </div>
        <div class="summary-content">
          <div class="r-item-edit" style="margin-bottom:12px">
            <img src="${img0}" alt="">
            <div><b>${esc(p.name)}</b><small>Qty: ${qty} · ${formatPrice(p.price)} each</small></div>
            <a href="#/product/${p.slug}">Edit</a>
          </div>
          <div style="font-size:13px;color:var(--ink-2);display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatPrice(sub)}</span></div>
            <div style="display:flex;justify-content:space-between"><span>Flat Nationwide Shipping</span><span>${formatPrice(ship)}</span></div>
            <div style="border-top:1px dashed var(--line-2);padding-top:6px;display:flex;justify-content:space-between;font-weight:700;color:var(--ink)">
              <span>Total Payable (COD)</span>
              <span style="color:var(--accent);font-family:var(--fm)">${formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>`;

      return `
      <div class="container">
        ${Components.breadcrumbs([
          { label: 'Home', href: '#/' },
          { label: p.name, href: `#/product/${p.slug}` },
          { label: 'Order form', href: '#' }
        ])}
        <div class="order-grid">
          <div class="order-form-col reveal">
            <p class="kicker">Secure checkout · Cash on delivery</p>
            <h1>Complete your order</h1>
            <p class="lead">Fill in your details below — our team confirms every order on WhatsApp before dispatch.</p>

            ${mobileSummaryHtml}

            <form class="order-form" data-form="order" data-id="${p.id}" novalidate>
              <div class="form-title"><i data-lucide="user"></i> Customer details</div>
              <div class="form-grid">
                <div class="field">
                  <label for="f-name">Customer name *</label>
                  <input id="f-name" name="name" type="text" placeholder="e.g. Ahmed Khan" autocomplete="name" required>
                  <span class="err">Please enter your full name.</span>
                </div>
                <div class="field">
                  <label for="f-phone">Working / WhatsApp number *</label>
                  <input id="f-phone" name="phone" type="tel" inputmode="tel" placeholder="03XX XXXXXXX" autocomplete="tel" required>
                  <span class="err">Enter a valid 11-digit mobile number (03XXXXXXXXX).</span>
                </div>
                <div class="field full">
                  <label for="f-email">Email <small>(optional, for receipt & updates)</small></label>
                  <input id="f-email" name="email" type="email" inputmode="email" placeholder="you@example.com" autocomplete="email">
                  <span class="err">Enter a valid email address.</span>
                </div>
                <div class="field full">
                  <label for="f-address">Full delivery address *</label>
                  <textarea id="f-address" name="address" placeholder="House / shop no., street, area landmark…" autocomplete="street-address" required></textarea>
                  <span class="err">Please enter a complete delivery address (at least 6 characters).</span>
                </div>
                <div class="field">
                  <label for="f-city">City *</label>
                  <input id="f-city" name="city" type="text" placeholder="e.g. Lahore" autocomplete="address-level2" required>
                  <span class="err">Please enter your city.</span>
                </div>
                <div class="field">
                  <label for="f-notes">Order notes <small>(optional)</small></label>
                  <input id="f-notes" name="notes" type="text" placeholder="Special delivery instructions">
                </div>
              </div>

              <div class="confirm-wrap">
                <button class="btn btn-accent btn-lg btn-block" type="submit" data-role="confirm-btn">
                  <i data-lucide="check"></i> Confirm Cash on Delivery
                </button>
                <p class="confirm-note">Cash on delivery · Flat Rs. 250 shipping · Instant WhatsApp confirmation</p>
                <div style="text-align:center;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line-2)">
                  <p style="font-size:12px;color:var(--muted);margin-bottom:8px">Skip typing address? Order directly on WhatsApp:</p>
                  <a class="btn btn-whatsapp btn-sm btn-block" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent(`Hi RollPoint! I want to order ${p.name} (Qty: ${qty}, Total: ${formatPrice(total)} COD). Please confirm my order.`)}" target="_blank">
                    <i data-lucide="message-circle"></i> Quick Order via WhatsApp
                  </a>
                </div>
              </div>
            </form>
          </div>

          <div class="receipt-col reveal">
            <div class="r-item-edit">
              <img src="${img0}" alt="">
              <div><b>${esc(p.name)}</b><small>Qty: ${qty} · ${formatPrice(p.price)} each</small></div>
              <a href="#/product/${p.slug}">Edit</a>
            </div>
            ${Components.receipt(p, qty)}
          </div>
        </div>
      </div>`;
    }
  },

  // ---------------- ORDER CONFIRMATION VIEW ----------------
  orderDone(order, product, qty, whatsappUrl, whatsappMessage) {
    return `
    <div class="confirm-hero reveal in">
      <span class="ok-ring"><i data-lucide="check"></i></span>
      <h1>Order received — thank you!</h1>
      <p>Your order has been recorded in our system. We are opening <b>WhatsApp (${BUSINESS.whatsappLocal})</b> to confirm your order details.</p>
      <span class="order-id-tag">ORDER ID · ${esc(order.orderId || order.id)}</span>
    </div>
    <div class="container confirm-grid reveal in">
      ${Components.receipt(product, qty, { orderId: order.orderId || order.id, stamp: true })}

      <div class="wa-notice-box">
        <i data-lucide="message-circle"></i>
        <div>
          <b>WhatsApp Order Confirmation</b>
          <p style="margin-top:2px">Click the button below if WhatsApp did not open automatically.</p>
        </div>
        <a class="btn btn-accent btn-sm" href="${whatsappUrl}" target="_blank" style="margin-left:auto;white-space:nowrap">
          Open WhatsApp <i data-lucide="external-link"></i>
        </a>
      </div>

      <details class="wa-preview">
        <summary>View order message text</summary>
        <pre>${esc(whatsappMessage || OrderMath.buildWhatsAppMessage(order))}</pre>
      </details>

      <div class="confirm-actions">
        <a class="btn btn-ink" href="#/">Back to shop <i data-lucide="arrow-right"></i></a>
        <a class="btn btn-outline" href="#/product/${product.slug}">View product</a>
      </div>
    </div>`;
  },

  // ---------------- ABOUT & CONTACT ----------------
  about: {
    async load() { return {}; },
    render() {
      return `
      <div class="container">
        <div class="about-grid">
          <div class="reveal">
            <p class="kicker">// About us</p>
            <h1>The store behind your counter.</h1>
            <div class="prose">
              <p>${esc(BUSINESS.footerAboutText)}</p>
              <p>We stock everything that lives next to a cash register: register rolls, jumbo rolls, shipping labels, pocket-printer paper, scanners, printers and cash drawers. Every item is stocked in our own warehouse and dispatched within 24 hours.</p>
              <p>We keep ordering simple on purpose — pick a product, fill one form, confirm on WhatsApp. No accounts, no apps, no waiting.</p>
            </div>
            <div class="faq" style="margin-top:34px">
              <details>
                <summary>How long does delivery take? <i data-lucide="plus"></i></summary>
                <p>Orders dispatch within 24 hours. Major cities typically receive in 2–3 working days; other areas 3–5 working days via courier.</p>
              </details>
              <details>
                <summary>Is cash on delivery available? <i data-lucide="plus"></i></summary>
                <p>Yes — COD is available nationwide. Shipping is a flat Rs. 250 per order, no matter how many rolls you order.</p>
              </details>
              <details>
                <summary>Do you supply in bulk? <i data-lucide="plus"></i></summary>
                <p>Absolutely. For orders of 50+ rolls or recurring monthly supply, message us on WhatsApp (${BUSINESS.whatsappLocal}) for wholesale pricing.</p>
              </details>
            </div>
          </div>
          <div class="reveal">
            <div class="contact-card">
              <h3>Contact us</h3>
              <p>We reply within working hours — usually much faster on WhatsApp.</p>
              <div class="contact-line"><i data-lucide="phone"></i><div><b>Phone / WhatsApp</b><span class="mono">${BUSINESS.whatsappLocal}</span></div></div>
              <div class="contact-line"><i data-lucide="mail"></i><div><b>Email</b><a href="mailto:${BUSINESS.email}" class="mono" style="color:var(--accent);text-decoration:none">${BUSINESS.email}</a></div></div>
              <div class="contact-line"><i data-lucide="map-pin"></i><div><b>Warehouse &amp; Location</b><span>${BUSINESS.address}</span><a href="${BUSINESS.mapsUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;color:var(--accent);font-weight:600;font-size:13px;margin-top:6px;text-decoration:none;"><i data-lucide="map" style="width:14px;height:14px"></i> Open in Google Maps <i data-lucide="external-link" style="width:12px;height:12px"></i></a></div></div>
              <div class="contact-line"><i data-lucide="clock"></i><div><b>Hours</b><span>${BUSINESS.hours}</span></div></div>
              <a class="btn btn-accent btn-block" style="margin-top:20px" href="#/shop">Start an order <i data-lucide="arrow-right"></i></a>
            </div>
          </div>
        </div>
      </div>`;
    }
  },

  // ---------------- ADMIN PANEL ENTRY ----------------
  admin: {
    async load() { return {}; },
    render() {
      return `<div id="admin-root-container"></div>`;
    },
    mount() {
      const container = document.getElementById('admin-root-container');
      if (container) AdminUI.render(container);
    }
  },

  // ---------------- 404 NOT FOUND ----------------
  notFound: {
    async load() { return {}; },
    render() {
      return `<div class="nf-wrap">
        <div class="code">404</div>
        <h1>Page not found</h1>
        <p>The page you’re looking for rolled off the shelf.</p>
        <a class="btn btn-ink btn-lg" href="#/">Back to home</a>
      </div>`;
    }
  }
};

// Router
const Router = {
  routes: [
    { pattern: /^$/,                     page: 'home' },
    { pattern: /^\/$/,                   page: 'home' },
    { pattern: /^\/shop$/,               page: 'listing', params: () => ({}) },
    { pattern: /^\/category\/([\w-]+)$/, page: 'listing', params: m => ({ category: m[1] }) },
    { pattern: /^\/search$/,             page: 'listing', params: () => ({}), useQuery: true },
    { pattern: /^\/product\/([\w-]+)$/,  page: 'product', params: m => ({ slug: m[1] }) },
    { pattern: /^\/order\/([\w-]+)$/,    page: 'order',   params: (m, q) => ({ id: m[1], qty: q.get('qty') }), useQuery: true },
    { pattern: /^\/about$/,              page: 'about' },
    { pattern: /^\/admin$/,              page: 'admin' },
  ],

  current() {
    const h = location.hash;
    if (!h || h === '#') return { path: '/' };
    if (!h.startsWith('#/')) return null;
    const [path, queryStr] = h.slice(1).split('?');
    return { path, query: new URLSearchParams(queryStr || '') };
  },

  async render() {
    const cur = this.current();
    if (cur === null) return;
    UI.closeDrawer(); UI.hideSuggest();

    let match = null, page = null;
    for (const r of this.routes) {
      const m = cur.path.match(r.pattern);
      if (m) { match = r; page = Pages[r.page]; break; }
    }
    if (!match) page = Pages.notFound;

    let params = match && match.params ? match.params(cur.path.match(match.pattern), cur.query) : {};
    if (match && match.useQuery && cur.query) {
      if (cur.query.get('q')) params.q = cur.query.get('q');
      if (cur.query.get('sort')) params.sort = cur.query.get('sort');
    }

    const app = document.getElementById('app');
    app.innerHTML = `<div style="text-align:center;padding:70px 20px"><span class="spinner" style="width:30px;height:30px;border-top-color:var(--accent)"></span></div>`;

    let data;
    try {
      data = await page.load(params);
      app.innerHTML = page.render(data, params);
    } catch (e) {
      page = Pages.notFound;
      data = await page.load(params);
      app.innerHTML = page.render(data, params);
    }

    document.documentElement.scrollTop = 0;
    if (page.mount) page.mount(data, params);
    refreshIcons(); hydrateReveals(app);
    UI.setActiveNav();
    UI.setActiveBottomNav();
    UI.updateTitle(cur.path, params);
    if (!cur.path.startsWith('/product')) {
      UI.removePdpStickyBar();
    }
  }
};

// UI Shell
const UI = {
  renderTopbar() {
    document.getElementById('topbar').innerHTML = `
      <span><i data-lucide="banknote"></i> Cash on delivery nationwide</span>
      <span><i data-lucide="truck"></i> Flat ${formatPrice(OrderMath.FLAT_SHIPPING)} shipping</span>
      <a href="tel:+${BUSINESS.whatsappIntl}"><i data-lucide="phone"></i> ${BUSINESS.whatsappLocal}</a>`;
  },

  searchBox(id) {
    return `<div class="search-wrap" id="${id}">
      <i data-lucide="search" class="search-ico"></i>
      <input class="search-input js-search" type="search" placeholder="Search rolls, labels, printers…" aria-label="Search products" autocomplete="off">
      <span class="search-kbd">/</span>
      <div class="suggest" hidden></div>
    </div>`;
  },

  renderHeader(cats) {
    document.getElementById('site-header').innerHTML = `
      <div class="container masthead-in">
        ${Components.brand()}
        ${this.searchBox('search-desktop')}
        <a class="wa-chip" href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank">
          <i data-lucide="message-circle"></i>
          <span><small>Order on WhatsApp</small><b>${BUSINESS.whatsappLocal}</b></span>
        </a>
        <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
          <a class="icon-btn mobile-only-btn" href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank" aria-label="WhatsApp" style="color:#25D366;border-color:rgba(37,211,102,0.4)">
            <i data-lucide="message-circle"></i>
          </a>
          <button class="icon-btn menu-btn" data-action="menu-open" aria-label="Open menu"><i data-lucide="menu"></i></button>
        </div>
      </div>
      <div class="container mobile-search">${this.searchBox('search-mobile')}</div>
      <nav class="mainnav" aria-label="Primary">
        <div class="container mainnav-in">
          <a href="#/" data-nav="home">Home</a>
          <a href="#/shop" data-nav="shop">All Products</a>
          <div class="nav-drop">
            <a href="#/shop" data-nav="categories">Categories <i data-lucide="chevron-down"></i></a>
            <div class="drop-panel">
              ${cats.map(c => `<a href="#/category/${c.slug}">${esc(c.name)}<span>${c.count}</span></a>`).join('')}
            </div>
          </div>
          <a href="#/about" data-nav="about">About &amp; Contact</a>
        </div>
      </nav>`;
  },

  renderBottomBar(cats = []) {
    const bar = document.getElementById('mobile-bottom-bar');
    if (!bar) return;
    bar.innerHTML = `
      <a class="m-tab" href="#/" data-tab="home">
        <i data-lucide="home"></i>
        <span>Home</span>
      </a>
      <a class="m-tab" href="#/shop" data-tab="shop">
        <i data-lucide="shopping-bag"></i>
        <span>Shop</span>
      </a>
      <a class="m-tab" href="javascript:void(0)" data-action="menu-open" data-tab="categories">
        <i data-lucide="layout-grid"></i>
        <span>Categories</span>
      </a>
      <a class="m-tab wa-tab" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent('Hi RollPoint! I want to inquire about products.')}" target="_blank" data-tab="whatsapp">
        <i data-lucide="message-circle"></i>
        <span>WhatsApp</span>
      </a>
      <a class="m-tab" href="javascript:void(0)" data-action="menu-open" data-tab="menu">
        <i data-lucide="menu"></i>
        <span>Menu</span>
      </a>`;
    refreshIcons(bar);
  },

  setActiveBottomNav() {
    const cur = Router.current();
    const path = cur ? cur.path : '/';
    const tabs = document.querySelectorAll('.m-tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (path === '/' || path === '') {
      document.querySelector('.m-tab[data-tab="home"]')?.classList.add('active');
    } else if (path === '/shop' || path.startsWith('/search') || path.startsWith('/order')) {
      document.querySelector('.m-tab[data-tab="shop"]')?.classList.add('active');
    } else if (path.startsWith('/category')) {
      document.querySelector('.m-tab[data-tab="categories"]')?.classList.add('active');
    }
  },

  setupPdpStickyBar(p) {
    const root = document.getElementById('pdp-sticky-bar-root');
    if (!root) return;
    const img0 = (p.images && p.images[0]) || 'https://picsum.photos/100/100';
    const out = p.stock <= 0;

    root.innerHTML = `
      <div class="pdp-sticky-bar" id="pdp-sticky-bar">
        <div class="pdp-sticky-info">
          <img class="pdp-sticky-img" src="${img0}" alt="">
          <div class="pdp-sticky-text">
            <span class="pdp-sticky-name">${esc(p.name)}</span>
            <span class="pdp-sticky-price">${formatPrice(p.price)}</span>
          </div>
        </div>
        <div class="pdp-sticky-actions">
          <a class="pdp-sticky-btn wa-btn" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent(`Hi RollPoint! I want to order ${p.name} (Rs. ${p.price}).`)}" target="_blank" title="WhatsApp Order">
            <i data-lucide="message-circle"></i>
          </a>
          <button class="btn btn-accent pdp-sticky-btn" data-action="order-now" data-id="${p.id}" ${out ? 'disabled' : ''}>
            <i data-lucide="package"></i> Order Now
          </button>
        </div>
      </div>`;
    refreshIcons(root);

    if (window._pdpStickyHandler) {
      window.removeEventListener('scroll', window._pdpStickyHandler);
    }
    window._pdpStickyHandler = () => {
      const bar = document.getElementById('pdp-sticky-bar');
      if (!bar) return;
      const mainBuy = document.getElementById('main-buy-btn') || document.querySelector('.buy-row');
      if (!mainBuy) return;
      const rect = mainBuy.getBoundingClientRect();
      if (rect.bottom < 60) {
        bar.classList.add('visible');
      } else {
        bar.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', window._pdpStickyHandler, { passive: true });
    window._pdpStickyHandler();
  },

  removePdpStickyBar() {
    if (window._pdpStickyHandler) {
      window.removeEventListener('scroll', window._pdpStickyHandler);
      window._pdpStickyHandler = null;
    }
    const root = document.getElementById('pdp-sticky-bar-root');
    if (root) root.innerHTML = '';
  },

  renderDrawer(cats) {
    document.getElementById('drawer-body').innerHTML = `
      <a class="d-link" href="#/">Home</a>
      <a class="d-link" href="#/shop">All Products <span>${cats.reduce((s, c) => s + c.count, 0)}</span></a>
      <div class="drawer-label">Categories</div>
      ${cats.map(c => `<a class="d-link" href="#/category/${c.slug}">${esc(c.name)}<span>${c.count}</span></a>`).join('')}
      <div class="drawer-label">Company</div>
      <a class="d-link" href="#/about">About &amp; Contact</a>`;
    document.getElementById('drawer-foot').innerHTML = `
      <a class="btn btn-accent btn-block" href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank">
        <i data-lucide="message-circle"></i> Chat on WhatsApp ${BUSINESS.whatsappLocal}</a>`;
  },

  renderFooter(cats) {
    document.getElementById('site-footer').innerHTML = `
      <div class="container foot-main">
        <div class="foot-brand">
          ${Components.brand(true)}
          <p>${esc(BUSINESS.footerAboutText)}</p>
        </div>
        <div class="foot-col">
          <h4>Categories</h4>
          <ul>${cats.map(c => `<li><a href="#/category/${c.slug}">${esc(c.name)}<span class="cnt">${c.count}</span></a></li>`).join('')}</ul>
        </div>
        <div class="foot-col">
          <h4>Quick links</h4>
          <ul>
            <li><a href="#/">Home</a></li>
            <li><a href="#/shop">All products</a></li>
            <li><a href="#/about">About &amp; contact</a></li>
            <li><a href="#/about">Bulk / wholesale orders</a></li>
          </ul>
        </div>
        <div class="foot-col">
          <h4>Contact</h4>
          <ul class="foot-contact">
            <li><i data-lucide="message-circle"></i><span class="mono">WhatsApp · ${BUSINESS.whatsappLocal}</span></li>
            <li><i data-lucide="mail"></i><a href="mailto:${BUSINESS.email}" class="mono" style="color:inherit;text-decoration:none">${BUSINESS.email}</a></li>
            <li><i data-lucide="map-pin"></i><span>${BUSINESS.address}<br><a href="${BUSINESS.mapsUrl}" target="_blank" rel="noopener" style="color:var(--accent);font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:3px;margin-top:3px;text-decoration:none;">View on Google Maps <i data-lucide="external-link" style="width:11px;height:11px"></i></a></span></li>
            <li><i data-lucide="clock"></i><span>${BUSINESS.hours}</span></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <div class="container foot-bottom-in">
          <span>© ${new Date().getFullYear()} ${BUSINESS.name}. All rights reserved.</span>
          <span>Prices include GST · Flat ${formatPrice(OrderMath.FLAT_SHIPPING)} shipping</span>
          <a class="admin-link" href="#/admin" title="Staff Administration">Admin</a>
        </div>
      </div>`;
  },

  openDrawer() {
    document.getElementById('drawer')?.classList.add('show');
    document.getElementById('overlay')?.classList.add('show');
    document.body.style.overflow = 'hidden';
  },
  closeDrawer() {
    document.getElementById('drawer')?.classList.remove('show');
    document.getElementById('overlay')?.classList.remove('show');
    document.body.style.overflow = '';
  },

  async runSuggest(input) {
    const box = input.closest('.search-wrap').querySelector('.suggest');
    const q = input.value.trim();
    if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    const results = await Api.searchProducts(q, 5);
    const total = (await Api.getProducts({ q })).length;
    box.innerHTML = results.length
      ? results.map(p => `
          <a class="suggest-item" href="#/product/${p.slug}">
            <img src="${(p.images && p.images[0]) || 'https://picsum.photos/60/60'}" alt="">
            <span><span class="sg-name">${esc(p.name)}</span><br><span class="sg-cat">${esc(p.categoryName || p.category)}</span></span>
            <span class="sg-price">${formatPrice(p.price)}</span>
          </a>`).join('') +
        `<a class="suggest-all" href="#/search?q=${encodeURIComponent(q)}">See all ${total} result${total !== 1 ? 's' : ''} →</a>`
      : `<div class="suggest-item"><span class="sg-cat">No products matched “${esc(q)}”.</span></div>`;
    box.hidden = false;
  },
  hideSuggest() {
    document.querySelectorAll('.suggest').forEach(b => { b.hidden = true; });
  },

  setActiveNav() {
    const cur = Router.current();
    const path = cur ? cur.path : '/';
    const key = path.startsWith('/product') || path.startsWith('/order') || path === '/shop' || path.startsWith('/search') ? 'shop'
      : path.startsWith('/category') ? 'categories'
      : path.startsWith('/about') ? 'about'
      : path === '/' || path === '' ? 'home' : '';
    document.querySelectorAll('.mainnav-in [data-nav]').forEach(a => {
      if (a.dataset.nav === key) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  },

  updateTitle(path, params) {
    const base = BUSINESS.name + ' — Thermal Rolls, Labels & POS Supplies';
    let t = base;
    if (path.startsWith('/category') && params.category) t = `${params.category} · ${base}`;
    else if (path.startsWith('/search')) t = 'Search · ' + base;
    else if (path === '/shop') t = 'All Products · ' + base;
    else if (path.startsWith('/about')) t = 'About & Contact · ' + base;
    else if (path.startsWith('/admin')) t = 'Admin Dashboard · ' + base;
    else if (path.startsWith('/order')) t = 'Checkout · ' + base;
    document.title = t;
  },

  toast(msg, icon = 'check-circle-2', type = 'success') {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<i data-lucide="${icon}"></i><span>${esc(msg)}</span>`;
    root.appendChild(el); refreshIcons(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 3800);
  }
};

// Event Actions
const Actions = {
  'menu-open':     () => UI.openDrawer(),
  'menu-close':    () => UI.closeDrawer(),
  'toggle-summary':() => document.getElementById('mobile-order-summary')?.classList.toggle('open'),
  'rail-prev':     el => document.getElementById(el.dataset.target)?.scrollBy({ left: -296, behavior: 'smooth' }),
  'rail-next':     el => document.getElementById(el.dataset.target)?.scrollBy({ left: 296, behavior: 'smooth' }),
  'scroll-to':     el => document.querySelector(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),

  'select-thumb': (el) => {
    const main = document.getElementById('gallery-main');
    if (!main) return;
    main.src = el.dataset.src;
    main.style.animation = 'none'; void main.offsetWidth; main.style.animation = '';
    el.closest('.thumbs').querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  },

  'qty-minus': () => Actions._qty(-1),
  'qty-plus':  () => Actions._qty(1),
  _qty(d) {
    const el = document.getElementById('qty-val');
    if (!el) return;
    const next = Math.min(99, Math.max(1, (parseInt(el.textContent, 10) || 1) + d));
    el.textContent = next;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  },

  'order-now': (el) => {
    if (el.disabled) return;
    const id = el.dataset.id;
    const qty = el.dataset.qty || (document.getElementById('qty-val')?.textContent || 1);
    location.hash = `#/order/${id}?qty=${qty}`;
  },

  'review-open': () => {
    const f = document.getElementById('review-form');
    if (f) { f.classList.toggle('open'); if (f.classList.contains('open')) f.querySelector('input')?.focus(); }
  },

  'rating-pick': (el) => {
    const v = +el.dataset.value;
    const pick = document.getElementById('rate-pick');
    pick.dataset.value = v;
    pick.querySelectorAll('.rate-btn').forEach(b => b.classList.toggle('on', +b.dataset.value <= v));
    document.getElementById('rv-rating-err').style.display = 'none';
  }
};

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-action]');
  if (!e.target.closest('.search-wrap')) UI.hideSuggest();
  const link = e.target.closest('a[href^="#/"]');
  if (link) UI.closeDrawer();
  if (!trigger) return;
  const fn = Actions[trigger.dataset.action];
  if (fn) { e.preventDefault?.(); fn(trigger, e); }
});

// Form Validators & Handlers
const validators = {
  order: (form) => {
    const val = n => form.querySelector(`[name="${n}"]`)?.value.trim() || '';
    const mark = (name, ok) => {
      const field = form.querySelector(`[name="${name}"]`)?.closest('.field');
      if (field) field.classList.toggle('invalid', !ok);
      return ok;
    };
    let ok = true;
    ok = mark('name', val('name').length >= 2) && ok;
    ok = mark('phone', /^(\+?92|0)?3\d{2}[- ]?\d{7}$/.test(val('phone').replace(/[\s-]/g, ''))) && ok;
    ok = mark('email', val('email') === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) && ok;
    ok = mark('address', val('address').length >= 6) && ok;
    ok = mark('city', val('city').length >= 2) && ok;
    return ok;
  },
  review: (form) => {
    let ok = true;
    const name = form.querySelector('[name="name"]');
    const text = form.querySelector('[name="text"]');
    const rating = +document.getElementById('rate-pick')?.dataset.value;
    const mark = (input, good) => { input.closest('.field').classList.toggle('invalid', !good); return good; };
    ok = mark(name, name.value.trim().length >= 2) && ok;
    ok = mark(text, text.value.trim().length >= 5) && ok;
    if (!rating) { document.getElementById('rv-rating-err').style.display = 'block'; ok = false; }
    return ok;
  }
};

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();

  // ---------------- Order Confirm ----------------
  if (form.dataset.form === 'order') {
    if (!validators.order(form)) {
      form.querySelector('.field.invalid input, .field.invalid textarea')?.focus();
      UI.toast('Please check the highlighted fields.', 'alert-circle', 'error');
      return;
    }

    const btn = form.querySelector('[data-role="confirm-btn"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Placing your order…';

    const p = await Api.getProductById(form.dataset.id);
    const qty = parseInt(document.querySelector('.r-calc')?.textContent.match(/× (\d+)/)?.[1], 10)
             || parseInt(new URLSearchParams(location.hash.split('?')[1] || '').get('qty'), 10) || 1;
    const val = n => form.querySelector(`[name="${n}"]`)?.value.trim() || '';

    const orderPayload = {
      productId: p.id,
      quantity: qty,
      customerName: val('name'),
      customerPhone: val('phone'),
      customerEmail: val('email'),
      customerAddress: val('address'),
      customerCity: val('city'),
      customerNotes: val('notes')
    };

    try {
      const res = await Api.submitOrder(orderPayload);
      btn.disabled = false; btn.innerHTML = original;

      if (res.ok) {
        document.getElementById('app').innerHTML = Pages.orderDone(res.order, p, qty, res.whatsappUrl, res.whatsappMessage);
        document.documentElement.scrollTop = 0;
        refreshIcons();
        UI.toast('Order placed successfully! Opening WhatsApp…', 'check-circle-2', 'success');

        // Automatically open WhatsApp pre-filled order message
        if (res.whatsappUrl) {
          setTimeout(() => {
            window.open(res.whatsappUrl, '_blank');
          }, 600);
        }
      }
    } catch (err) {
      btn.disabled = false; btn.innerHTML = original;
      UI.toast(err.message || 'Failed to place order. Please try again.', 'alert-triangle', 'error');
    }
  }

  // ---------------- Review Submit ----------------
  if (form.dataset.form === 'review') {
    if (!validators.review(form)) return;
    const rating = +document.getElementById('rate-pick').dataset.value;
    const reviewData = {
      name: form.querySelector('[name="name"]').value.trim(),
      rating,
      text: form.querySelector('[name="text"]').value.trim()
    };

    const submitBtn = document.getElementById('rv-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

    try {
      const res = await Api.submitReview(form.dataset.slug, reviewData);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="check"></i> Submit Review';
      refreshIcons(submitBtn);

      form.reset();
      form.classList.remove('open');
      UI.toast(res.message || 'Thank you! Your review has been submitted for moderation.', 'check-circle-2', 'success');
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="check"></i> Submit Review';
      refreshIcons(submitBtn);
      UI.toast(err.message || 'Failed to submit review.', 'alert-circle', 'error');
    }
  }
});

// Clear invalid state on typing
document.addEventListener('input', (e) => {
  const f = e.target.closest('.field.invalid');
  if (f) f.classList.remove('invalid');
});

// Search input handling
function bindSearch() {
  document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('js-search')) return;
    debounce(() => UI.runSuggest(e.target), 170)();
  });
  document.addEventListener('keydown', (e) => {
    const input = e.target.closest?.('.js-search');
    if (input && e.key === 'Enter') {
      const q = input.value.trim();
      if (q) location.hash = '#/search?q=' + encodeURIComponent(q);
    }
    if (e.key === 'Escape') { UI.hideSuggest(); UI.closeDrawer(); }
    if (e.key === '/' && !input && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault();
      (document.querySelector('#search-desktop .js-search') ||
       document.querySelector('#search-mobile .js-search'))?.focus();
    }
  });
}

// Scroll Reveals
let revealObserver;
function hydrateReveals(scope = document) {
  if (!('IntersectionObserver' in window)) {
    scope.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: .07, rootMargin: '0px 0px -20px 0px' });
  }
  scope.querySelectorAll('.reveal:not(.in)').forEach(el => revealObserver.observe(el));
}

// Application Bootstrap
(async function init() {
  try {
    // 1. Fetch dynamic settings from MongoDB Atlas
    const settings = await Api.getSettings().catch(() => null);
    if (settings) {
      BUSINESS = {
        name: settings.websiteName || BUSINESS.name,
        tagline: settings.tagline || BUSINESS.tagline,
        heroKicker: settings.heroKicker || BUSINESS.heroKicker,
        heroTitle: settings.heroTitle || BUSINESS.heroTitle,
        heroSubtitle: settings.heroSubtitle || BUSINESS.heroSubtitle,
        heroStats: settings.heroStats || BUSINESS.heroStats,
        heroChip: settings.heroChip !== undefined ? settings.heroChip : BUSINESS.heroChip,
        heroBtn1Text: settings.heroBtn1Text || BUSINESS.heroBtn1Text,
        heroBtn2Text: settings.heroBtn2Text || BUSINESS.heroBtn2Text,
        heroImage: settings.heroImage || BUSINESS.heroImage,
        heroProductSlug: settings.heroProductSlug !== undefined ? settings.heroProductSlug : BUSINESS.heroProductSlug,
        usp1Title: settings.usp1Title || BUSINESS.usp1Title,
        usp1Sub: settings.usp1Sub || BUSINESS.usp1Sub,
        usp2Title: settings.usp2Title || BUSINESS.usp2Title,
        usp2Sub: settings.usp2Sub || BUSINESS.usp2Sub,
        usp3Title: settings.usp3Title || BUSINESS.usp3Title,
        usp3Sub: settings.usp3Sub || BUSINESS.usp3Sub,
        usp4Title: settings.usp4Title || BUSINESS.usp4Title,
        usp4Sub: settings.usp4Sub || BUSINESS.usp4Sub,
        whatsappLocal: settings.whatsappNumber || BUSINESS.whatsappLocal,
        whatsappIntl: settings.whatsappIntl || BUSINESS.whatsappIntl,
        email: settings.contactEmail || BUSINESS.email,
        address: settings.contactAddress || BUSINESS.address,
        mapsUrl: settings.googleMapsUrl || BUSINESS.mapsUrl,
        hours: settings.contactHours || BUSINESS.hours,
        shippingRate: settings.shippingRate !== undefined ? settings.shippingRate : BUSINESS.shippingRate,
        footerAboutText: settings.footerAboutText || BUSINESS.footerAboutText
      };

      if (settings.primaryColor) {
        document.documentElement.style.setProperty('--accent', settings.primaryColor);
      }
      if (settings.secondaryColor) {
        document.documentElement.style.setProperty('--ink', settings.secondaryColor);
      }
    }

    // 2. Fetch categories
    const cats = await Api.getCategories().catch(() => []);

    // 3. Render Header, Topbar, Drawer, Footer, Bottom Bar
    UI.renderTopbar();
    UI.renderHeader(cats);
    UI.renderDrawer(cats);
    UI.renderFooter(cats);
    UI.renderBottomBar(cats);
    bindSearch();

    // 4. Initial Route Render
    window.addEventListener('hashchange', () => Router.render());
    await Router.render();
    refreshIcons();
  } catch (err) {
    console.error('App bootstrap error:', err);
  }
})();
