/* ================================================================
   ROLLPOINT — CORE CUSTOMER APPLICATION (MOBILE-FIRST APP EDITION)
   Engineered for maximum mobile retention, app-like speed,
   high-converting checkout, live stock calculations, and WhatsApp flow.
   ================================================================ */

// Live Business Config (loaded dynamically from database settings)
let BUSINESS = {
  name: 'RollPoint',
  tagline: 'Counter supplies, delivered.',
  logo: 'https://res.cloudinary.com/zadbyf6g/image/upload/v1790260393/rollpoint/brand/rollpoint-official-logo.webp',
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
      '*NEW ORDER — ROLLPOINT*',
      '',
      `*Order ID:* ${order.orderId || order.id}`,
      `*Product:* ${order.productName || (order.items && order.items[0]?.name)}`,
      `*Price:* ${formatPrice(order.productPrice || (order.items && order.items[0]?.price))}`,
      `*Quantity:* ${order.quantity || (order.items && order.items[0]?.qty)}`,
      `*Subtotal:* ${formatPrice(order.productTotal || order.subtotal)}`,
      `*Shipping:* ${formatPrice(order.shipping)} (Flat Nationwide Delivery)`,
      `*Total Payable (COD):* ${formatPrice(order.grandTotal || order.total)}`,
      '',
      '*CUSTOMER DETAILS*',
      `*Name:* ${order.customerName || order.customer?.name}`,
      `*WhatsApp:* ${order.customerPhone || order.customer?.phone}`,
      (order.customerEmail || order.customer?.email) ? `*Email:* ${order.customerEmail || order.customer?.email}` : null,
      `*Address:* ${order.customerAddress || order.customer?.address}`,
      `*City:* ${order.customerCity || order.customer?.city}`,
      (order.customerNotes || order.customer?.notes) ? `*Notes:* ${order.customerNotes || order.customer?.notes}` : null,
      '',
      '_Sent via RollPoint Mobile App Checkout_'
    ].filter(Boolean);
    return lines.join('\n');
  }
};

// UI Components
const Components = {
  logo() {
    if (BUSINESS.logo) {
      return `<img src="${BUSINESS.logo}" alt="${esc(BUSINESS.name || 'RollPoint')}" class="brand-logo-img">`;
    }
    return `<svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--ink)"/>
      <circle cx="20" cy="15.5" r="8" stroke="#fff" stroke-width="2.4"/>
      <circle cx="20" cy="15.5" r="2.8" stroke="#fff" stroke-width="2"/>
      <path d="M14 23.5V31l3-2.4 3 2.4 3-2.4 3 2.4v-7.5" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" fill="none"/>
    </svg>`;
  },

  brand() {
    return `<a class="brand" href="#/" aria-label="${BUSINESS.name} home">
      ${this.logo()}
      <div class="brand-text-col">
        <span class="brand-name">${esc(BUSINESS.name || 'RollPoint')}<em>.</em></span>
        <span class="brand-badge">Official Store</span>
      </div>
    </a>`;
  },

  // Category Story Circles (Instagram / Daraz style)
  categoryStories(cats, activeSlug = '') {
    const defaultIcons = {
      'thermal-rolls': 'scroll',
      'labels': 'tag',
      'pos-products': 'printer',
      'mini-printer-paper': 'file-text',
      'other-products': 'package',
      'mini-fans': 'fan'
    };

    const stories = [
      { slug: 'all', name: 'All Aisles', icon: 'sparkles', isAll: true },
      ...cats.map(c => ({
        slug: c.slug,
        name: c.name,
        icon: defaultIcons[c.slug] || 'layers'
      }))
    ];

    return `
    <div class="stories-strip">
      <div class="stories-track">
        ${stories.map(s => {
          const isActive = (!activeSlug && s.isAll) || (activeSlug === s.slug);
          return `
          <a class="story-item ${isActive ? 'active' : ''}" href="${s.isAll ? '#/shop' : `#/category/${s.slug}`}">
            <div class="story-ring">
              <div class="story-avatar">
                <i data-lucide="${s.icon}"></i>
              </div>
            </div>
            <span class="story-label">${esc(s.name)}</span>
          </a>`;
        }).join('')}
      </div>
    </div>`;
  },

  // High-converting 2-column mobile app product card
  productCard(p, catName) {
    const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const out = p.stock <= 0;
    const img0 = (p.images && p.images[0]) || 'https://picsum.photos/600/600';
    const img1 = (p.images && p.images[1]) || img0;
    const categoryTitle = catName || p.categoryName || p.category || '';
    const saveAmt = p.oldPrice && p.oldPrice > p.price ? (p.oldPrice - p.price) : 0;

    return `
    <article class="p-card reveal">
      <a class="p-media" href="#/product/${p.slug}" aria-label="${esc(p.name)}">
        <img class="main" src="${img0}" alt="${esc(p.name)}" loading="lazy">
        <img class="alt" src="${img1}" alt="" loading="lazy" aria-hidden="true">
        <div class="p-badge-group">
          ${out ? '<span class="p-out-badge">Out of stock</span>'
                : disc ? `<span class="p-badge">−${disc}%</span>` : ''}
          <span class="p-cod-tag"><i data-lucide="banknote"></i> COD</span>
        </div>
      </a>
      <div class="p-body">
        <div class="p-meta-row">
          <span class="p-cat">${esc(categoryTitle)}</span>
          <div class="p-rate"><i data-lucide="star"></i><b>${(p.rating || 5.0).toFixed(1)}</b></div>
        </div>
        <h3 class="p-name"><a href="#/product/${p.slug}">${esc(p.name)}</a></h3>
        <div class="p-price-block">
          <div class="p-price">
            <span class="price-now">${formatPrice(p.price)}</span>
            ${p.oldPrice ? `<s class="price-old">${formatPrice(p.oldPrice)}</s>` : ''}
          </div>
          ${saveAmt ? `<span class="p-save-chip">Save ${formatPrice(saveAmt)}</span>` : ''}
        </div>
        <button class="btn btn-order" data-action="order-now" data-id="${p.id}" data-qty="1" ${out ? 'disabled' : ''}>
          <i data-lucide="package"></i> Order Now
        </button>
      </div>
    </article>`;
  },

  // Horizontal Swipeable Product Carousel
  rail(products, railId = '') {
    return `<div class="rail" ${railId ? `id="${railId}"` : ''}>
      ${products.map(p => this.productCard(p, p.categoryName || p.category)).join('')}
    </div>`;
  },

  // Mobile App Section Head
  sectionHead(kicker, title, sub = '', link = null, railId = null) {
    return `<div class="section-head reveal">
      <div>
        <span class="kicker">${kicker}</span>
        <h2>${title}</h2>
        ${sub ? `<p class="head-sub">${sub}</p>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        ${railId ? `<div class="rail-arrows">
          <button class="icon-btn" data-action="rail-prev" data-target="${railId}" aria-label="Scroll left"><i data-lucide="arrow-left"></i></button>
          <button class="icon-btn" data-action="rail-next" data-target="${railId}" aria-label="Scroll right"><i data-lucide="arrow-right"></i></button>
        </div>` : ''}
        ${link ? `<a class="head-link" href="${link.href}">${link.label} <i data-lucide="arrow-right"></i></a>` : ''}
      </div>
    </div>`;
  },

  // 4 App Trust Cards
  trustMatrix() {
    return `
    <div class="trust-matrix reveal">
      <div class="trust-card">
        <div class="trust-ico"><i data-lucide="truck"></i></div>
        <div class="trust-info">
          <b>Flat Rs. 250</b>
          <small>Nationwide delivery</small>
        </div>
      </div>
      <div class="trust-card">
        <div class="trust-ico green"><i data-lucide="banknote"></i></div>
        <div class="trust-info">
          <b>Cash on Delivery</b>
          <small>Pay when received</small>
        </div>
      </div>
      <div class="trust-card">
        <div class="trust-ico"><i data-lucide="shield-check"></i></div>
        <div class="trust-info">
          <b>BPA-Free Paper</b>
          <small>100% Genuine stock</small>
        </div>
      </div>
      <div class="trust-card">
        <div class="trust-ico wa"><i data-lucide="message-circle"></i></div>
        <div class="trust-info">
          <b>WhatsApp Order</b>
          <small>${BUSINESS.whatsappLocal}</small>
        </div>
      </div>
    </div>`;
  },

  // Pakistani Cities Quick Chips for 1-Tap Checkout
  pakistanCityChips() {
    const topCities = [
      'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi',
      'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala',
      'Sialkot', 'Quetta'
    ];
    return `
    <div class="city-chips-label">⚡ 1-Tap Select City:</div>
    <div class="city-chips" id="city-chips">
      ${topCities.map(c => `<button type="button" class="city-chip" data-action="select-city" data-city="${c}">${c}</button>`).join('')}
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
    <div class="receipt">
      ${opts.stamp ? '<div style="background:var(--green);color:#fff;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;width:fit-content;margin:0 auto 10px">ORDER CONFIRMED</div>' : ''}
      <div class="r-brand">${esc(BUSINESS.name.toUpperCase())}</div>
      <div class="r-store">Counter supplies · ${esc(BUSINESS.address.split(',').pop().trim())}</div>
      <div class="r-dash"></div>
      <div class="r-item-name">${esc(p.name)}</div>
      <div class="r-calc">${formatPrice(p.price)} × ${qty} unit${qty > 1 ? 's' : ''}</div>
      <div class="r-line"><span>Subtotal</span><span>${formatPrice(sub)}</span></div>
      <div class="r-line"><span>Shipping (flat)</span><span>${formatPrice(ship)}</span></div>
      <div class="r-dash"></div>
      <div class="r-line r-total"><span>TOTAL PAYABLE (COD)</span><span>${formatPrice(total)}</span></div>
      <div class="r-cod">Cash on delivery · Flat rate nationwide</div>
      ${opts.orderId ? `<div class="r-id">ORDER ID · ${esc(opts.orderId)}</div>` : '<div class="r-id">INSTANT COD ORDER</div>'}
    </div>`;
  },

  reviewsSection(p) {
    const reviewsList = p.reviews || [];
    return `
    <div class="reviews-top">
      <div>
        <h3 style="font-size:18px;margin-bottom:4px">Customer Reviews</h3>
        <div class="rating-summary">
          <span class="rating-avg">${(p.rating || 5.0).toFixed(1)}</span>
          <div>
            ${stars(p.rating || 5.0, 'lg')}
            <small style="color:var(--muted);display:block">${p.reviewCount || reviewsList.length} verified review${(p.reviewCount || reviewsList.length) !== 1 ? 's' : ''}</small>
          </div>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" data-action="review-open" data-slug="${p.slug}">
        <i data-lucide="pen-line"></i> Write Review
      </button>
    </div>

    <form class="review-form" id="review-form" data-form="review" data-slug="${p.slug}" novalidate>
      <div class="form-title">Submit Verified Review</div>
      <div class="form-grid">
        <div class="field">
          <label for="rv-name">Your Name *</label>
          <input id="rv-name" name="name" type="text" placeholder="e.g. Asad Ali" required>
          <span class="err">Please enter your name.</span>
        </div>
        <div class="field">
          <label>Your Rating *</label>
          <div class="rate-pick" id="rate-pick" data-value="5">
            ${[5,4,3,2,1].map(v => `<button type="button" class="rate-btn ${v <= 5 ? 'on' : ''}" data-action="rating-pick" data-value="${v}" aria-label="${v} star${v>1?'s':''}">${STAR}</button>`).join('')}
          </div>
          <span class="err" id="rv-rating-err" style="display:none;color:var(--red);font-size:12px;font-weight:600">Please pick a star rating.</span>
        </div>
        <div class="field full">
          <label for="rv-text">Your Feedback *</label>
          <textarea id="rv-text" name="text" placeholder="Paper quality, print clarity, delivery speed..." required></textarea>
          <span class="err">Please write at least 5 characters.</span>
        </div>
      </div>
      <button class="btn btn-accent btn-sm" type="submit" id="rv-submit-btn" style="margin-top:14px">
        <i data-lucide="check"></i> Submit Review
      </button>
    </form>

    <div class="review-list" id="review-list">
      ${reviewsList.length ? reviewsList.map(r => `
        <article class="review">
          <div class="review-head">
            <span class="avatar">${esc((r.name || '?').trim()[0] || '?').toUpperCase()}</span>
            <div><b>${esc(r.name)}</b><small>${formatDate(r.date || r.createdAt)}</small></div>
            <div style="margin-left:auto">${stars(r.rating)}</div>
          </div>
          <p>${esc(r.text)}</p>
        </article>`).join('') : '<div style="padding:16px 0;color:var(--muted);font-size:13px">No reviews yet. Be the first to review!</div>'}
    </div>`;
  }
};

// Pages
const Pages = {
  // ---------------- HOME PAGE (DARAZ APP EXPERIENCE) ----------------
  home: {
    async load() {
      const [cats, featured, fresh, allProducts] = await Promise.all([
        Api.getCategories(),
        Api.getProducts({ featuredOnly: true }),
        Api.getProducts({ sort: 'newest', limit: 8 }),
        Api.getProducts({ limit: 40 })
      ]);
      return { cats, featured, fresh, allProducts };
    },

    render({ cats, featured, fresh, allProducts }) {
      const flashItems = featured.length >= 3 ? featured.slice(0, 3) : allProducts.slice(0, 3);
      const sastiItems = allProducts.length >= 3 ? allProducts.slice(3, 6) : allProducts.slice(0, 3);

      return `
      <!-- 1. Daraz Choice Upsized Deals Hero Banner -->
      <section class="daraz-hero">
        <div class="daraz-hero-card">
          <div class="daraz-hero-left">
            <div class="daraz-choice-tag">C<span>H</span>OICE</div>
            <div class="daraz-hero-title">UPSIZED DEALS</div>
            <div class="daraz-hero-sub">Extra 6% Off vouchers</div>
            <a class="daraz-shop-pill" href="#/shop">Shop Now</a>
          </div>
          <div class="daraz-hero-right">
            <div class="daraz-sticker-badge">
              <small>AS LOW AS</small>
              <b>Rs. 105</b>
            </div>
            <img class="daraz-hero-img" src="${esc(BUSINESS.heroImage || 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg')}" alt="Deals">
            <span class="daraz-hero-counter">3/15</span>
          </div>
        </div>
      </section>

      <!-- 2. Daraz Black Trust Bar -->
      <div class="daraz-trust-bar">
        <span><i data-lucide="credit-card"></i> Safe Payment</span>
        <div class="daraz-trust-divider"></div>
        <span><i data-lucide="truck"></i> Fast Delivery</span>
        <div class="daraz-trust-divider"></div>
        <span><i data-lucide="rotate-ccw"></i> Free Return</span>
      </div>

      <!-- 3. Daraz Category Icons Strip -->
      <div class="daraz-icon-grid">
        <a class="daraz-icon-card" href="#/category/thermal-rolls">
          <div class="daraz-icon-box yellow">
            <i data-lucide="scroll"></i>
          </div>
          <span class="daraz-icon-label">Everyday Low Price</span>
        </a>

        <a class="daraz-icon-card" href="#/category/labels">
          <div class="daraz-icon-box pink">
            <i data-lucide="tag"></i>
          </div>
          <span class="daraz-icon-label">Beauty Fiesta</span>
        </a>

        <a class="daraz-icon-card" href="#/category/mini-printer-paper">
          <div class="daraz-icon-box blue">
            <i data-lucide="file-text"></i>
          </div>
          <span class="daraz-icon-label">Daraz Pharmacy</span>
        </a>

        <a class="daraz-icon-card" href="#/category/pos-products">
          <div class="daraz-icon-box black">
            <i data-lucide="smartphone"></i>
          </div>
          <span class="daraz-icon-label">Official Mobile</span>
        </a>

        <a class="daraz-icon-card" href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank">
          <div class="daraz-icon-box green">
            <i data-lucide="message-circle"></i>
          </div>
          <span class="daraz-icon-label">Daraz Free</span>
        </a>
      </div>

      <!-- 4. Daraz Fla⚡h Sale Section -->
      <div class="daraz-flash-sec">
        <div class="daraz-flash-head">
          <div class="df-title-row">
            <span class="df-title">Fla<em>⚡</em>h Sale</span>
            <span class="df-timer-pill" id="flash-timer">03 : 42 : 19</span>
          </div>
          <a href="#/shop">Shop More <i data-lucide="chevron-right" style="width:13px;height:13px"></i></a>
        </div>
        <div class="daraz-flash-row">
          ${flashItems.map(p => {
            const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 75;
            return `
            <a class="df-item" href="#/product/${p.slug}">
              <div class="df-item-img">
                <img src="${(p.images && p.images[0]) || 'https://picsum.photos/300/300'}" alt="${esc(p.name)}" loading="lazy">
              </div>
              <span class="df-item-price">${formatPrice(p.price)}</span>
              <span class="df-item-disc">−${disc}%</span>
            </a>`;
          }).join('')}
        </div>
      </div>

      <!-- 7. Daily Sasti CHOICE Section -->
      <div class="daraz-sasti-sec">
        <div class="daraz-sasti-head">
          <h3>Daily Sasti <span>CHOICE</span></h3>
          <a href="#/shop">Shop Now | Free Gift! <i data-lucide="chevron-right" style="width:13px;height:13px"></i></a>
        </div>
        <div class="daraz-sasti-grid">
          ${sastiItems.map(p => `
            <a class="ds-card" href="#/product/${p.slug}">
              <img src="${(p.images && p.images[0]) || 'https://picsum.photos/300/300'}" alt="${esc(p.name)}" loading="lazy">
              <b>${formatPrice(p.price)}</b>
              <small>Min. Spend Rs. 0</small>
            </a>`).join('')}
        </div>
      </div>

      <!-- 8. Just For You Infinite 2-Column Feed -->
      <div class="daraz-jfy-head">
        <span class="daraz-jfy-line"></span>
        <h3>Just For You</h3>
        <span class="daraz-jfy-line"></span>
      </div>
      <div class="container">
        <div class="grid-products" id="daraz-jfy-grid">
          ${allProducts.map(p => Components.productCard(p, p.categoryName || p.category)).join('')}
        </div>
      </div>`;
    },

    mount(data) {
      // 1. Live Flash Sale Countdown Timer (Ticks every second)
      if (window._dealTimerInterval) clearInterval(window._dealTimerInterval);
      let secondsLeft = 3 * 3600 + 42 * 60 + 19;
      window._dealTimerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) secondsLeft = 6 * 3600;
        const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
        const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
        const s = String(secondsLeft % 60).padStart(2, '0');
        const el = document.getElementById('flash-timer');
        if (el) el.textContent = `${h} : ${m} : ${s}`;
      }, 1000);

      // 2. Social Proof Order Notification Ticker
      UI.startSocialProofTicker();
    }
  },

  // ---------------- LISTING PAGE (SHOP / CATEGORY) ----------------
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
      let title = 'All Products', sub = 'Genuine BPA-free thermal rolls, shipping labels & POS equipment.';
      if (cat) { title = cat.name; sub = cat.tagline || `${cat.name} supplies in stock.`; }
      if (params.q) { title = `Results for “${esc(params.q)}”`; sub = `Matching items across the store.`; }

      const crumbs = Components.breadcrumbs([
        { label: 'Home', href: '#/' },
        ...(cat ? [{ label: 'Categories', href: '#/shop' }, { label: cat.name, href: '#' }] : [{ label: 'Shop', href: '#' }])
      ]);

      const storiesHtml = Components.categoryStories(cats, params.category || '');

      const gridHtml = products.length
        ? `<div class="grid-products" id="listing-grid">${products.map(p => Components.productCard(p, p.categoryName || p.category)).join('')}</div>`
        : `<div style="text-align:center;padding:50px 20px;background:var(--surface);border-radius:18px;border:1px solid var(--line);margin:20px 0">
             <i data-lucide="package-search" style="width:48px;height:48px;color:var(--muted);margin-bottom:10px"></i>
             <h3 style="font-size:18px;margin-bottom:6px">No products matched</h3>
             <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Try searching for 80mm, labels, or mini printer paper.</p>
             <a class="btn btn-accent btn-sm" href="#/shop">View All Products</a>
           </div>`;

      return `
      ${storiesHtml}
      <div class="container" style="padding-top:10px">
        ${crumbs}
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;flex-wrap:wrap;gap:8px">
          <div>
            <h1 style="font-size:22px">${title}</h1>
            <p style="font-size:12.5px;color:var(--muted);margin-top:2px">${sub}</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <select data-role="sort" aria-label="Sort products" style="height:36px;padding:0 10px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);font-size:12.5px;font-weight:600">
              <option value="featured" ${params.sort === 'featured' || !params.sort ? 'selected' : ''}>Featured</option>
              <option value="price-asc" ${params.sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-desc" ${params.sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="rating" ${params.sort === 'rating' ? 'selected' : ''}>Top Rated</option>
              <option value="newest" ${params.sort === 'newest' ? 'selected' : ''}>Newest First</option>
            </select>
          </div>
        </div>
        ${gridHtml}
      </div>`;
    },

    mount(data) {
      const sortSelect = document.querySelector('[data-role="sort"]');
      if (sortSelect) {
        sortSelect.addEventListener('change', async () => {
          const sort = sortSelect.value;
          const products = await Api.getProducts({ ...data.params, sort });
          const grid = document.getElementById('listing-grid');
          if (grid) {
            grid.innerHTML = products.map(p => Components.productCard(p, p.categoryName || p.category)).join('');
            refreshIcons(grid);
            hydrateReveals(grid);
          }
        });
      }
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
      const saveAmt = p.oldPrice && p.oldPrice > p.price ? (p.oldPrice - p.price) : 0;

      const stockColor = out ? 'var(--red)' : (low ? 'var(--gold)' : 'var(--green)');
      const stockLabel = out ? 'Out of stock — restocking soon' : (low ? `Low stock — only ${p.stock} units left` : `In Stock · 24h Express Dispatch`);

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
          <!-- Gallery -->
          <div>
            <div class="gallery-main">
              <img id="gallery-main" src="${images[0]}" alt="${esc(p.name)}">
            </div>
            ${images.length > 1 ? `
            <div class="thumbs">
              ${images.map((src, i) => `
                <button class="thumb ${i === 0 ? 'active' : ''}" data-action="select-thumb" data-src="${src}" aria-label="View image ${i + 1}">
                  <img src="${src}" alt="" loading="lazy">
                </button>`).join('')}
            </div>` : ''}
          </div>

          <!-- Product Details -->
          <div class="pdp-info">
            <span class="pdp-cat">${esc(p.categoryName || p.category)}</span>
            <h1>${esc(p.name)}</h1>

            <div class="pdp-rate">
              ${stars(p.rating)}
              <b>${(p.rating || 5.0).toFixed(1)}</b>
              <span style="color:var(--muted);font-size:12px">(${p.reviewCount || 0} reviews)</span>
            </div>

            <!-- Price with Savings Highlight -->
            <div class="price-block">
              <span class="now">${formatPrice(p.price)}</span>
              ${p.oldPrice ? `<s class="old">${formatPrice(p.oldPrice)}</s>` : ''}
              ${saveAmt ? `<span class="save-tag">Save ${formatPrice(saveAmt)} (${disc}% OFF)</span>` : ''}
            </div>

            <p class="pdp-short">${esc(p.shortDescription)}</p>

            <div class="stock-line">
              <span class="stock-dot" style="background:${stockColor}"></span>
              <span>${stockLabel}</span>
            </div>

            <!-- Live Calculation & Buy Section -->
            <div class="buy-row">
              <div class="qty-calc-box">
                <div class="qty" aria-label="Quantity selector">
                  <button data-action="qty-minus" aria-label="Decrease quantity"><i data-lucide="minus"></i></button>
                  <span class="qty-val" id="qty-val">1</span>
                  <button data-action="qty-plus" aria-label="Increase quantity"><i data-lucide="plus"></i></button>
                </div>
                <div class="calc-subtotal" id="pdp-calc-preview">
                  <span>Product Total + Rs. 250 Delivery</span>
                  <b>Total COD: ${formatPrice(OrderMath.total(p.price, 1))}</b>
                </div>
              </div>

              <!-- 2 Big Thumb-Friendly CTAs -->
              <button class="btn btn-accent btn-buy" id="main-buy-btn" data-action="order-now" data-id="${p.id}" ${out ? 'disabled' : ''}>
                <i data-lucide="package"></i> Order Now (Cash on Delivery)
              </button>

              <a class="btn btn-whatsapp btn-buy-wa" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent(`Hi RollPoint! I want to order ${p.name} (Rs. ${p.price}). Please confirm availability.`)}" target="_blank">
                <i data-lucide="message-circle"></i> Quick Order via WhatsApp
              </a>
            </div>

            <ul class="perks">
              <li><i data-lucide="truck"></i>Flat Rs. 250 delivery</li>
              <li><i data-lucide="banknote"></i>Pay upon arrival (COD)</li>
              <li><i data-lucide="shield-check"></i>7-day replacement</li>
            </ul>

            <p class="buy-note mono">Dispatched within 24 hours · Confirmed on WhatsApp</p>
          </div>
        </div>

        <!-- Collapsible Details Accordions -->
        <div class="pdp-detail reveal">
          <details class="pdp-accordion" open>
            <summary>
              <span>Product Description</span>
              <i data-lucide="chevron-down"></i>
            </summary>
            <div class="pdp-accordion-content">
              ${(p.description || p.shortDescription || '').split('\n\n').map(t => `<p style="margin-bottom:8px">${esc(t)}</p>`).join('')}
            </div>
          </details>

          ${Object.keys(specsObj).length ? `
          <details class="pdp-accordion">
            <summary>
              <span>Technical Specifications</span>
              <i data-lucide="chevron-down"></i>
            </summary>
            <div class="pdp-accordion-content">
              <dl class="spec-list">
                ${Object.entries(specsObj).map(([k, v]) => `
                  <div class="spec-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
              </dl>
            </div>
          </details>` : ''}

          <details class="pdp-accordion" id="reviews-accordion" open>
            <summary>
              <span>Customer Reviews (${p.reviewCount || 0})</span>
              <i data-lucide="chevron-down"></i>
            </summary>
            <div class="pdp-accordion-content">
              ${Components.reviewsSection(p)}
            </div>
          </details>
        </div>

        ${related.length ? `
        <section style="margin-top:36px">
          ${Components.sectionHead('You May Also Need', 'Related Supplies', '', { href: `#/category/${p.category}`, label: 'View category' }, 'rel-rail')}
          <div class="rail" id="rel-rail">
            ${related.map(r => Components.productCard(r, r.categoryName || r.category)).join('')}
          </div>
        </section>` : ''}
      </div>`;
    },

    mount(data) {
      if (data && data.p) {
        UI.setupPdpStickyBar(data.p);
      }
    }
  },

  // ---------------- ORDER CHECKOUT FORM (1-MINUTE EXPRESS) ----------------
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

      return `
      <div class="container" style="padding-top:10px">
        ${Components.breadcrumbs([
          { label: 'Home', href: '#/' },
          { label: p.name, href: `#/product/${p.slug}` },
          { label: 'Express Checkout', href: '#' }
        ])}

        <div class="order-grid">
          <div class="order-form-col reveal">
            <span class="kicker">⚡ 1-Minute Express Checkout</span>
            <h1>Complete Your Order</h1>
            <p class="lead">Pay Cash on Delivery. Flat Rs. 250 shipping anywhere in Pakistan.</p>

            <!-- Collapsible Order Summary Dropdown -->
            <div class="mobile-order-summary open" id="mobile-order-summary">
              <div class="summary-toggle" data-action="toggle-summary">
                <span class="sum-left">
                  <i data-lucide="receipt"></i>
                  <span>Order Items (${qty})</span>
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
                  <a href="#/product/${p.slug}">Change</a>
                </div>
                <div style="font-size:13px;display:flex;flex-direction:column;gap:6px">
                  <div style="display:flex;justify-content:space-between;color:var(--muted)"><span>Product Subtotal</span><span>${formatPrice(sub)}</span></div>
                  <div style="display:flex;justify-content:space-between;color:var(--muted)"><span>Nationwide Flat Delivery</span><span>${formatPrice(ship)}</span></div>
                  <div style="border-top:1px dashed var(--line-2);padding-top:6px;display:flex;justify-content:space-between;font-weight:700;font-size:14.5px">
                    <span>Total Payable (COD)</span>
                    <span style="color:var(--accent);font-family:var(--fd)">${formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Checkout Form -->
            <form class="order-form" data-form="order" data-id="${p.id}" novalidate>
              <div class="form-title">
                <i data-lucide="truck"></i> Delivery Information
              </div>
              <div class="form-grid">
                <div class="field">
                  <label for="f-name">Full Name *</label>
                  <input id="f-name" name="name" type="text" placeholder="e.g. Tariq Mehmood" autocomplete="name" required>
                  <span class="err">Please enter your full name.</span>
                </div>
                <div class="field">
                  <label for="f-phone">WhatsApp / Mobile Number *</label>
                  <input id="f-phone" name="phone" type="tel" inputmode="tel" placeholder="0300 1234567" autocomplete="tel" required>
                  <span class="err">Enter a valid 11-digit mobile number (03XXXXXXXXX).</span>
                </div>
                <div class="field full">
                  <label for="f-city">City *</label>
                  <input id="f-city" name="city" type="text" placeholder="e.g. Lahore" autocomplete="address-level2" required>
                  ${Components.pakistanCityChips()}
                  <span class="err">Please enter your city.</span>
                </div>
                <div class="field full">
                  <label for="f-address">Full Delivery Address *</label>
                  <textarea id="f-address" name="address" placeholder="Shop / House #, Street, Plaza name, Area landmark..." autocomplete="street-address" required></textarea>
                  <span class="err">Please enter a complete delivery address.</span>
                </div>
                <div class="field full">
                  <label for="f-notes">Order Notes <small>(Optional)</small></label>
                  <input id="f-notes" name="notes" type="text" placeholder="e.g. Deliver between 10am-5pm">
                </div>
              </div>

              <div class="confirm-wrap">
                <button class="btn btn-accent btn-lg btn-block" type="submit" data-role="confirm-btn">
                  <i data-lucide="check-circle-2"></i> Confirm Order — ${formatPrice(total)} (COD)
                </button>
                <p class="confirm-note">Cash on Delivery · Dispatched within 24 Hours</p>

                <div style="text-align:center;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line-2)">
                  <p style="font-size:12px;color:var(--muted);margin-bottom:8px">Prefer ordering directly on WhatsApp?</p>
                  <a class="btn btn-whatsapp btn-sm btn-block" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent(`Hi RollPoint! I want to order ${p.name} (Qty: ${qty}, Total: ${formatPrice(total)} COD). Please confirm my order.`)}" target="_blank">
                    <i data-lucide="message-circle"></i> Quick Order via WhatsApp
                  </a>
                </div>
              </div>
            </form>
          </div>

          <!-- Thermal Receipt Sidebar -->
          <div class="receipt-col reveal">
            ${Components.receipt(p, qty)}
          </div>
        </div>
      </div>`;
    }
  },

  // ---------------- ORDER CONFIRMATION VIEW ----------------
  orderDone(order, product, qty, whatsappUrl, whatsappMessage) {
    return `
    <div class="container" style="padding-top:20px;padding-bottom:40px">
      <div class="confirm-hero reveal in">
        <span class="ok-ring"><i data-lucide="check"></i></span>
        <h1>Order Received — Thank You!</h1>
        <p>Your order has been recorded in our dispatch system. We are opening <b>WhatsApp (${BUSINESS.whatsappLocal})</b> to confirm your order.</p>
        <span class="order-id-tag">ORDER ID: ${esc(order.orderId || order.id)}</span>
      </div>

      <div style="max-width:540px;margin:0 auto">
        ${Components.receipt(product, qty, { orderId: order.orderId || order.id, stamp: true })}

        <div class="wa-notice-box">
          <i data-lucide="message-circle"></i>
          <div>
            <b>WhatsApp Confirmation</b>
            <p style="margin-top:2px">Tap below if WhatsApp did not open automatically.</p>
          </div>
          <a class="btn btn-accent btn-sm" href="${whatsappUrl}" target="_blank" style="margin-left:auto;white-space:nowrap">
            Open WhatsApp <i data-lucide="external-link"></i>
          </a>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <a class="btn btn-ink btn-block" href="#/">
            <i data-lucide="home"></i> Back to Home
          </a>
          <a class="btn btn-outline btn-block" href="#/shop">
            <i data-lucide="shopping-bag"></i> Browse More
          </a>
        </div>
      </div>
    </div>`;
  },

  // ---------------- ABOUT & CONTACT ----------------
  about: {
    async load() { return {}; },
    render() {
      return `
      <div class="container" style="padding-top:16px;padding-bottom:30px">
        <div class="reveal">
          <span class="kicker">// About RollPoint</span>
          <h1 style="font-size:26px;margin:6px 0 12px">The Store Behind Your Counter</h1>
          <p style="font-size:14px;color:var(--ink-2);line-height:1.6;margin-bottom:14px">${esc(BUSINESS.footerAboutText)}</p>
          <p style="font-size:14px;color:var(--ink-2);line-height:1.6;margin-bottom:20px">We stock high-density BPA-free thermal rolls, shipping barcode labels, barcode scanners, thermal receipt printers, and cash drawers. Dispatched within 24 hours across Pakistan on cash on delivery.</p>

          ${Components.trustMatrix()}

          <!-- Contact Details Card -->
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:18px;margin-top:20px">
            <h3 style="font-size:18px;margin-bottom:14px">Contact & Warehouse</h3>
            <div style="display:flex;flex-direction:column;gap:12px;font-size:13.5px">
              <div style="display:flex;gap:10px">
                <i data-lucide="phone" style="width:18px;height:18px;color:var(--accent)"></i>
                <div><b>Phone / WhatsApp</b><br><span class="mono">${BUSINESS.whatsappLocal}</span></div>
              </div>
              <div style="display:flex;gap:10px">
                <i data-lucide="mail" style="width:18px;height:18px;color:var(--accent)"></i>
                <div><b>Email</b><br><a href="mailto:${BUSINESS.email}" style="color:var(--accent)">${BUSINESS.email}</a></div>
              </div>
              <div style="display:flex;gap:10px">
                <i data-lucide="map-pin" style="width:18px;height:18px;color:var(--accent)"></i>
                <div><b>Warehouse Location</b><br>${BUSINESS.address}<br>
                <a href="${BUSINESS.mapsUrl}" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700;display:inline-flex;align-items:center;gap:4px;margin-top:4px">Open in Google Maps <i data-lucide="external-link" style="width:12px;height:12px"></i></a></div>
              </div>
              <div style="display:flex;gap:10px">
                <i data-lucide="clock" style="width:18px;height:18px;color:var(--accent)"></i>
                <div><b>Working Hours</b><br>${BUSINESS.hours}</div>
              </div>
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
      if (container && window.AdminUI) AdminUI.render(container);
    }
  },

  // ---------------- 404 NOT FOUND ----------------
  notFound: {
    async load() { return {}; },
    render() {
      return `
      <div style="text-align:center;padding:70px 20px">
        <h1 style="font-size:42px;color:var(--accent)">404</h1>
        <h2 style="font-size:20px;margin-bottom:8px">Page Not Found</h2>
        <p style="font-size:13.5px;color:var(--muted);margin-bottom:20px">The product or page you are looking for has been moved or restocked.</p>
        <a class="btn btn-accent btn-sm" href="#/">Back to Home</a>
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

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    UI.startTopLoader();

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
    app.innerHTML = `
      <div class="route-loading-state">
        <span class="spinner"></span>
        <span style="font-size:13px;color:var(--muted);font-weight:600">Loading RollPoint…</span>
      </div>`;

    let data;
    try {
      data = await page.load(params);
      app.innerHTML = page.render(data, params);
    } catch (e) {
      page = Pages.notFound;
      data = await page.load(params);
      app.innerHTML = page.render(data, params);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (page.mount) page.mount(data, params);
    refreshIcons(); hydrateReveals(app);
    UI.setActiveNav();
    UI.setActiveBottomNav();
    UI.updateTitle(cur.path, params);
    if (!cur.path.startsWith('/product')) {
      UI.removePdpStickyBar();
    }
    UI.finishTopLoader();
  }
};

// UI Shell
const UI = {
  startTopLoader() {
    const bar = document.getElementById('top-progress-bar');
    if (!bar) return;
    bar.classList.add('loading');
    bar.style.width = '40%';
    setTimeout(() => {
      if (bar.classList.contains('loading')) bar.style.width = '80%';
    }, 120);
  },

  finishTopLoader() {
    const bar = document.getElementById('top-progress-bar');
    if (!bar) return;
    bar.style.width = '100%';
    setTimeout(() => {
      bar.classList.remove('loading');
      bar.style.opacity = '0';
      setTimeout(() => {
        bar.style.width = '0%';
        bar.style.opacity = '';
      }, 250);
    }, 150);
  },

  renderTopbar() {
    document.getElementById('topbar').innerHTML = `
      <span><i data-lucide="truck"></i> Flat Rs. 250 Delivery</span>
      <span><i data-lucide="banknote"></i> Cash on Delivery Nationwide</span>
      <a href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank"><i data-lucide="message-circle"></i> ${BUSINESS.whatsappLocal}</a>`;
  },

  searchBox(id) {
    return `<div class="search-wrap" id="${id}">
      <div class="daraz-search-box">
        <input class="search-input js-search" type="search" placeholder="Search rolls, shipping labels, printers..." aria-label="Search products" autocomplete="off">
        <div class="daraz-search-actions">
          <button class="daraz-cam-btn" type="button" aria-label="Search by image"><i data-lucide="camera"></i></button>
          <button class="daraz-search-btn" type="button" data-action="search-submit">Search</button>
        </div>
      </div>
      <div class="suggest" hidden></div>
    </div>`;
  },

  renderHeader(cats) {
    document.getElementById('site-header').innerHTML = `
      <div class="daraz-header-wrap">
        <div class="daraz-search-row">
          ${this.searchBox('search-main-bar')}
        </div>
      </div>

      <!-- Desktop Sub-Navigation -->
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
          <a href="#/about" data-nav="about">About & Contact</a>
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
        <span>Aisles</span>
      </a>
      <a class="m-tab wa-tab" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent('Hi RollPoint! I want to order supplies.')}" target="_blank" data-tab="whatsapp">
        <i data-lucide="message-circle"></i>
        <span>WhatsApp</span>
      </a>
      <a class="m-tab" href="#/about" data-tab="about">
        <i data-lucide="phone"></i>
        <span>Contact</span>
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
    } else if (path.startsWith('/about')) {
      document.querySelector('.m-tab[data-tab="about"]')?.classList.add('active');
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
          <div>
            <span class="pdp-sticky-name">${esc(p.name)}</span>
            <span class="pdp-sticky-price">${formatPrice(p.price)}</span>
          </div>
        </div>
        <div class="pdp-sticky-actions">
          <a class="btn pdp-sticky-btn wa-btn" href="https://wa.me/${BUSINESS.whatsappIntl}?text=${encodeURIComponent(`Hi RollPoint! I want to order ${p.name} (Rs. ${p.price}).`)}" target="_blank" title="WhatsApp Order">
            <i data-lucide="message-circle"></i>
          </a>
          <button class="btn btn-accent pdp-sticky-btn" data-action="order-now" data-id="${p.id}" ${out ? 'disabled' : ''}>
            <i data-lucide="package"></i> Order COD
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
      if (rect.bottom < 80) {
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
      <div class="drawer-label">Browse Categories</div>
      ${cats.map(c => `<a class="d-link" href="#/category/${c.slug}">${esc(c.name)}<span>${c.count} items</span></a>`).join('')}
      <div class="drawer-label">Customer Support</div>
      <a class="d-link" href="#/about">About & Location</a>
      <a class="d-link" href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank">WhatsApp Direct Call</a>`;
    document.getElementById('drawer-foot').innerHTML = `
      <a class="btn btn-whatsapp btn-block" href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank">
        <i data-lucide="message-circle"></i> Chat on WhatsApp (${BUSINESS.whatsappLocal})
      </a>`;
  },

  renderFooter(cats) {
    document.getElementById('site-footer').innerHTML = `
      <div class="container foot-main">
        <div class="foot-brand">
          ${Components.brand()}
          <p>${esc(BUSINESS.footerAboutText)}</p>
        </div>
        <div class="foot-col">
          <h4>Aisles</h4>
          <ul>${cats.map(c => `<li><a href="#/category/${c.slug}">${esc(c.name)}<span>${c.count}</span></a></li>`).join('')}</ul>
        </div>
        <div class="foot-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#/">Home</a></li>
            <li><a href="#/shop">All products</a></li>
            <li><a href="#/about">About us</a></li>
            <li><a href="https://wa.me/${BUSINESS.whatsappIntl}" target="_blank">Bulk orders</a></li>
          </ul>
        </div>
        <div class="foot-col">
          <h4>Warehouse & Contact</h4>
          <ul class="foot-contact">
            <li><i data-lucide="phone"></i><span class="mono">${BUSINESS.whatsappLocal}</span></li>
            <li><i data-lucide="mail"></i><a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></li>
            <li><i data-lucide="map-pin"></i><span>${BUSINESS.address}</span></li>
            <li><i data-lucide="clock"></i><span>${BUSINESS.hours}</span></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <div class="container foot-bottom-in">
          <span>© ${new Date().getFullYear()} ${BUSINESS.name}. All rights reserved.</span>
          <span>Flat ${formatPrice(OrderMath.FLAT_SHIPPING)} Nationwide Shipping · Cash on Delivery</span>
          <a class="admin-link" href="#/admin" title="Admin">Admin</a>
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
        `<a class="suggest-all" href="#/search?q=${encodeURIComponent(q)}">See all ${total} results →</a>`
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
      : path.startsWith('/admin') ? 'admin'
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
    else if (path.startsWith('/order')) t = 'Express Checkout · ' + base;
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
  },

  // Social Proof Order Notification Ticker (Popups real orders to keep customer engaged)
  startSocialProofTicker() {
    if (window._socialProofTimer) return;
    const orders = [
      { name: 'Sajjad', city: 'Lahore', item: '10x 80x80 Thermal Rolls', time: '2m ago' },
      { name: 'Kashif', city: 'Karachi', item: '5x 4x6 Shipping Labels', time: '5m ago' },
      { name: 'Usama', city: 'Rawalpindi', item: '1x POS Thermal Printer', time: '9m ago' },
      { name: 'Farhan', city: 'Faisalabad', item: '20x 57x40 POS Rolls', time: '14m ago' },
      { name: 'Noman', city: 'Islamabad', item: '3x Pocket Sticker Rolls', time: '18m ago' }
    ];

    let idx = 0;
    let pill = document.getElementById('social-proof-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'social-proof-pill';
      document.body.appendChild(pill);
    }

    const showNext = () => {
      const o = orders[idx % orders.length];
      idx++;
      pill.innerHTML = `<span class="sp-icon">🛍️</span><span class="sp-text"><b>${o.name}</b> from ${o.city} ordered ${o.item} · <small>${o.time}</small></span>`;
      pill.classList.add('show');
      setTimeout(() => {
        pill.classList.remove('show');
      }, 4200);
    };

    setTimeout(showNext, 3000);
    window._socialProofTimer = setInterval(showNext, 14000);
  }
};

// Event Actions
const Actions = {
  'menu-open':     () => UI.openDrawer(),
  'menu-close':    () => UI.closeDrawer(),
  'toggle-summary':() => document.getElementById('mobile-order-summary')?.classList.toggle('open'),
  'rail-prev':     el => document.getElementById(el.dataset.target)?.scrollBy({ left: -260, behavior: 'smooth' }),
  'rail-next':     el => document.getElementById(el.dataset.target)?.scrollBy({ left: 260, behavior: 'smooth' }),

  'select-thumb': (el) => {
    const main = document.getElementById('gallery-main');
    if (!main) return;
    main.src = el.dataset.src;
    el.closest('.thumbs').querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  },

  'collect-vouchers': (el) => {
    el.textContent = 'Collected ✓';
    el.classList.add('collected');
    UI.toast('All vouchers collected! Extra discount applied.', 'check-circle-2', 'success');
  },

  'search-submit': () => {
    const input = document.querySelector('.js-search:focus') || document.querySelector('.daraz-search-box input') || document.querySelector('.js-search');
    const q = input?.value.trim();
    if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
  },

  'select-city': (el) => {
    const cityInput = document.getElementById('f-city');
    if (!cityInput) return;
    cityInput.value = el.dataset.city;
    document.querySelectorAll('.city-chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    cityInput.closest('.field')?.classList.remove('invalid');
  },

  'qty-minus': () => Actions._qty(-1),
  'qty-plus':  () => Actions._qty(1),
  _qty(d) {
    const el = document.getElementById('qty-val');
    if (!el) return;
    const next = Math.min(99, Math.max(1, (parseInt(el.textContent, 10) || 1) + d));
    el.textContent = next;

    // Update live total preview on PDP
    const priceEl = document.querySelector('.price-block .now');
    const calcPreview = document.getElementById('pdp-calc-preview');
    if (priceEl && calcPreview) {
      const unitPrice = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      const total = OrderMath.total(unitPrice, next);
      calcPreview.innerHTML = `<span>Product Total + Rs. 250 Delivery</span><b>Total COD: ${formatPrice(total)}</b>`;
    }
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
  if (link && link.target !== '_blank') {
    UI.closeDrawer();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const targetHash = link.getAttribute('href');
    if (location.hash === targetHash) {
      Router.render();
    }
  }
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
    ok = mark('address', val('address').length >= 5) && ok;
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
    btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></span> Confirming your order…';

    const p = await Api.getProductById(form.dataset.id);
    const qty = parseInt(new URLSearchParams(location.hash.split('?')[1] || '').get('qty'), 10) || 1;
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
    submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></span> Submitting…';

    try {
      const res = await Api.submitReview(form.dataset.slug, reviewData);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="check"></i> Submit Review';
      refreshIcons(submitBtn);

      form.reset();
      form.classList.remove('open');
      UI.toast(res.message || 'Thank you! Your review has been submitted.', 'check-circle-2', 'success');
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
    }, { threshold: .05, rootMargin: '0px 0px -10px 0px' });
  }
  scope.querySelectorAll('.reveal:not(.in)').forEach(el => revealObserver.observe(el));
}

// Application Bootstrap
(async function init() {
  try {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

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
        logo: settings.logo || BUSINESS.logo,
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
