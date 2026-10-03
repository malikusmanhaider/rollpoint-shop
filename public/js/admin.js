/* ================================================================
   ROLLSPOINT — ADMIN CONTROLLER & UI
   Full administrative suite: Dashboard metrics, Product CRUD,
   Order Lifecycle, Reviews Moderation, and Theme/Website Settings.
   ================================================================ */

const AdminUI = {
  currentTab: 'dashboard',
  productsCache: [],
  categoriesCache: [],

  // -------------------------------------------------------------
  // Router entry point for #/admin
  // -------------------------------------------------------------
  async render(container) {
    const token = Api.getToken();
    if (!token) {
      this.renderLogin(container);
      return;
    }

    try {
      // Verify token
      const me = await Api.adminGetMe();
      if (!me.ok) throw new Error('Session expired');
      this.renderDashboardLayout(container, me.admin);
    } catch (err) {
      Api.logout();
      this.renderLogin(container);
    }
  },

  // -------------------------------------------------------------
  // Admin Login Screen
  // -------------------------------------------------------------
  renderLogin(container) {
    container.innerHTML = `
    <div class="container admin-login-wrap">
      <div class="admin-card reveal in">
        <div class="lock-ring"><i data-lucide="shield-check"></i></div>
        <h1>Staff Administration</h1>
        <p>Access the RollsPoint management system for products, orders, and website settings.</p>
        
        <form id="admin-login-form" novalidate>
          <div class="field" style="margin-bottom:14px">
            <label for="adm-email">Admin Email</label>
            <input id="adm-email" type="email" placeholder="malikusmanhaider0346@gmail.com" required autocomplete="email">
            <span class="err">Please enter your email address.</span>
          </div>
          <div class="field" style="margin-bottom:20px">
            <label for="adm-pass">Password</label>
            <input id="adm-pass" type="password" placeholder="••••••••" required autocomplete="current-password">
            <span class="err">Please enter your password.</span>
          </div>
          <button class="btn btn-ink btn-block btn-lg" type="submit" id="adm-login-btn">
            Sign In to Dashboard <i data-lucide="arrow-right"></i>
          </button>
        </form>
      </div>
    </div>`;

    refreshIcons(container);

    const form = document.getElementById('admin-login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adm-email').value.trim();
      const password = document.getElementById('adm-pass').value.trim();
      const btn = document.getElementById('adm-login-btn');

      if (!email || !password) {
        UI.toast('Please provide both email and password.', 'alert-circle', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in…';

      try {
        const res = await Api.adminLogin(email, password);
        if (res.ok) {
          UI.toast('Welcome to RollsPoint Admin Dashboard', 'check-circle-2', 'success');
          AdminUI.render(container);
        }
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = 'Sign In to Dashboard <i data-lucide="arrow-right"></i>';
        refreshIcons(btn);
        UI.toast(err.message || 'Login failed', 'alert-triangle', 'error');
      }
    });
  },

  // -------------------------------------------------------------
  // Dashboard Frame & Sidebar
  // -------------------------------------------------------------
  async renderDashboardLayout(container, admin) {
    container.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar-header">
          <span class="brand-name" style="font-size:20px">Roll<em>Admin</em></span>
          <div style="margin-top:6px"><span class="admin-badge">${admin.role || 'Admin'}</span></div>
        </div>

        <nav style="display:flex;flex-direction:column;gap:4px">
          <div class="admin-nav-item ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <i data-lucide="layout-dashboard"></i> Dashboard
          </div>
          <div class="admin-nav-item ${this.currentTab === 'products' ? 'active' : ''}" data-tab="products">
            <i data-lucide="package"></i> Products
          </div>
          <div class="admin-nav-item ${this.currentTab === 'categories' ? 'active' : ''}" data-tab="categories">
            <i data-lucide="folder-tree"></i> Categories
            <span class="nav-count" id="nav-categories-count" style="display:none">0</span>
          </div>
          <div class="admin-nav-item ${this.currentTab === 'orders' ? 'active' : ''}" data-tab="orders">
            <i data-lucide="shopping-bag"></i> Orders
            <span class="nav-count" id="nav-pending-orders" style="display:none">0</span>
          </div>
          <div class="admin-nav-item ${this.currentTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
            <i data-lucide="star"></i> Reviews
            <span class="nav-count" id="nav-pending-reviews" style="display:none">0</span>
          </div>
          <div class="admin-nav-item ${this.currentTab === 'settings' ? 'active' : ''}" data-tab="settings">
            <i data-lucide="sliders"></i> Theme &amp; Settings
          </div>
        </nav>

        <div class="admin-sidebar-foot">
          <div class="admin-user-info">
            <b>${esc(admin.name || admin.email)}</b>
            <span>${esc(admin.email)}</span>
          </div>
          <button class="btn btn-outline btn-block btn-sm" id="admin-logout-btn" style="margin-top:6px">
            <i data-lucide="log-out"></i> Logout
          </button>
        </div>
      </aside>

      <main class="admin-main" id="admin-tab-content">
        <div style="text-align:center;padding:40px"><span class="spinner" style="border-top-color:var(--accent);width:26px;height:26px"></span></div>
      </main>
    </div>

    <div class="admin-modal-overlay" id="admin-modal-overlay">
      <div class="admin-modal" id="admin-modal-content"></div>
    </div>`;

    refreshIcons(container);

    // Bind sidebar tabs
    container.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        container.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.currentTab = item.dataset.tab;
        this.loadTabContent();
      });
    });

    // Logout
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
      Api.logout();
      UI.toast('Logged out successfully');
      this.render(container);
    });

    // Close modal on outside click
    document.getElementById('admin-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'admin-modal-overlay') this.closeModal();
    });

    this.loadTabContent();
  },

  async loadTabContent() {
    const tabEl = document.getElementById('admin-tab-content');
    if (!tabEl) return;

    tabEl.innerHTML = `<div style="text-align:center;padding:50px"><span class="spinner" style="border-top-color:var(--accent);width:28px;height:28px"></span></div>`;

    try {
      switch (this.currentTab) {
        case 'dashboard':
          await this.renderTabDashboard(tabEl);
          break;
        case 'products':
          await this.renderTabProducts(tabEl);
          break;
        case 'categories':
          await this.renderTabCategories(tabEl);
          break;
        case 'orders':
          await this.renderTabOrders(tabEl);
          break;
        case 'reviews':
          await this.renderTabReviews(tabEl);
          break;
        case 'settings':
          await this.renderTabSettings(tabEl);
          break;
      }
      refreshIcons(tabEl);
    } catch (err) {
      tabEl.innerHTML = `<div class="empty-state"><h3>Error loading section</h3><p>${esc(err.message)}</p></div>`;
    }
  },

  // -------------------------------------------------------------
  // TAB 1: Dashboard Overview
  // -------------------------------------------------------------
  async renderTabDashboard(container) {
    const { stats, recentOrders } = await Api.adminGetStats();

    // Update sidebar indicators
    const pOrdersBadge = document.getElementById('nav-pending-orders');
    if (pOrdersBadge) {
      pOrdersBadge.textContent = stats.pendingOrders;
      pOrdersBadge.style.display = stats.pendingOrders > 0 ? 'inline-block' : 'none';
    }
    const pReviewsBadge = document.getElementById('nav-pending-reviews');
    if (pReviewsBadge) {
      pReviewsBadge.textContent = stats.pendingReviews;
      pReviewsBadge.style.display = stats.pendingReviews > 0 ? 'inline-block' : 'none';
    }
    const pCatsBadge = document.getElementById('nav-categories-count');
    if (pCatsBadge && stats.totalCategories !== undefined) {
      pCatsBadge.textContent = stats.totalCategories;
      pCatsBadge.style.display = 'inline-block';
    }

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Dashboard Overview</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Real-time statistics across products, categories, orders, and reviews.</p>
      </div>
      <div class="admin-header-actions">
        <button class="btn btn-outline btn-sm" id="btn-quick-new-category">
          <i data-lucide="folder-plus"></i> Add Category
        </button>
        <button class="btn btn-accent btn-sm" id="btn-quick-new-product">
          <i data-lucide="plus"></i> Add Product
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card accent">
        <div class="stat-label"><span>Total Revenue</span><i data-lucide="banknote"></i></div>
        <div class="stat-value">${formatPrice(stats.totalRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><span>Total Products</span><i data-lucide="package"></i></div>
        <div class="stat-value">${stats.totalProducts}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><span>Categories</span><i data-lucide="folder-tree"></i></div>
        <div class="stat-value">${stats.totalCategories !== undefined ? stats.totalCategories : '—'}</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-label"><span>Pending Orders</span><i data-lucide="clock"></i></div>
        <div class="stat-value">${stats.pendingOrders}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label"><span>Confirmed Orders</span><i data-lucide="check-circle-2"></i></div>
        <div class="stat-value">${stats.confirmedOrders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><span>Pending Reviews</span><i data-lucide="message-square"></i></div>
        <div class="stat-value">${stats.pendingReviews}</div>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <h3 style="font-size:16px">Recent Customer Orders</h3>
        <button class="head-link" id="btn-view-all-orders" style="font-size:11px">View all orders <i data-lucide="arrow-right"></i></button>
      </div>
      ${recentOrders && recentOrders.length ? `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Product &amp; Qty</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${recentOrders.map(o => `
            <tr>
              <td><b class="mono" style="font-size:13px">${esc(o.orderId)}</b></td>
              <td><b>${esc(o.customerName)}</b><br><span style="color:var(--muted);font-size:12px">${esc(o.customerPhone)} · ${esc(o.customerCity)}</span></td>
              <td>${esc(o.productName)} <span class="mono">× ${o.quantity}</span></td>
              <td><b class="mono">${formatPrice(o.grandTotal)}</b></td>
              <td><span class="status-pill ${o.orderStatus.toLowerCase()}">${o.orderStatus}</span></td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon-sm" data-action="admin-view-order" data-id="${o.orderId}" title="View details"><i data-lucide="eye"></i></button>
                  <a class="btn-icon-sm success" href="https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}" target="_blank" title="WhatsApp customer"><i data-lucide="message-circle"></i></a>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : `<div style="padding:30px;text-align:center;color:var(--muted)">No orders placed yet.</div>`}
    </div>`;

    document.getElementById('btn-quick-new-category')?.addEventListener('click', () => this.openCategoryModal());
    document.getElementById('btn-quick-new-product')?.addEventListener('click', () => this.openProductModal());
    document.getElementById('btn-view-all-orders')?.addEventListener('click', () => {
      this.currentTab = 'orders';
      const navItem = document.querySelector('[data-tab="orders"]');
      if (navItem) {
        document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
        navItem.classList.add('active');
      }
      this.loadTabContent();
    });

    container.querySelectorAll('[data-action="admin-view-order"]').forEach(btn => {
      btn.addEventListener('click', () => this.openOrderDetailsModal(btn.dataset.id));
    });
  },

  // -------------------------------------------------------------
  // TAB 2: Products Management
  // -------------------------------------------------------------
  async renderTabProducts(container) {
    const [res, catsRes] = await Promise.all([
      Api.adminGetProducts(),
      Api.getCategories()
    ]);
    this.productsCache = res.products || [];
    this.categoriesCache = catsRes || [];

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Products Management</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Add, edit, change prices, update stock, and publish/unpublish products.</p>
      </div>
      <div class="admin-header-actions">
        <button class="btn btn-accent btn-sm" id="btn-add-product">
          <i data-lucide="plus"></i> Add New Product
        </button>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <div style="display:flex;gap:12px;flex-wrap:wrap;flex:1">
          <input type="search" class="admin-search-input" id="admin-prod-search" placeholder="Search by name, ID, slug…">
          <select class="admin-filter-select" id="admin-prod-cat-filter">
            <option value="">All Categories</option>
            ${this.categoriesCache.map(c => `<option value="${c.slug}">${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        <span style="font-size:13px;color:var(--muted)">Total: <b id="prod-total-count">${this.productsCache.length}</b> products</span>
      </div>

      <div id="admin-products-table-body">
        ${this.renderProductsTableHtml(this.productsCache)}
      </div>
    </div>`;

    document.getElementById('btn-add-product')?.addEventListener('click', () => this.openProductModal());

    const searchInput = document.getElementById('admin-prod-search');
    const catFilter = document.getElementById('admin-prod-cat-filter');

    const filterProducts = () => {
      const q = searchInput.value.toLowerCase().trim();
      const cat = catFilter.value;
      const filtered = this.productsCache.filter(p => {
        const matchesQ = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
        const matchesCat = !cat || p.category === cat;
        return matchesQ && matchesCat;
      });
      document.getElementById('admin-products-table-body').innerHTML = this.renderProductsTableHtml(filtered);
      document.getElementById('prod-total-count').textContent = filtered.length;
      refreshIcons(document.getElementById('admin-products-table-body'));
      this.bindProductTableActions();
    };

    searchInput.addEventListener('input', debounce(filterProducts, 160));
    catFilter.addEventListener('change', filterProducts);

    this.bindProductTableActions();
  },

  renderProductsTableHtml(products) {
    if (!products.length) {
      return `<div style="padding:40px;text-align:center;color:var(--muted)">No products found matching criteria.</div>`;
    }

    return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Rating</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>
              <div class="p-thumb-cell">
                <img class="p-thumb" src="${(p.images && p.images[0]) || 'https://picsum.photos/60/60'}" alt="">
                <div>
                  <b style="font-size:14px">${esc(p.name)}</b>
                  <div class="mono" style="font-size:11px;color:var(--muted)">ID: ${p.id} · /${p.slug}</div>
                  ${p.variations && p.variations.length > 0 ? `
                    <div style="margin-top:3px">
                      <span class="var-badge-summary" style="font-size:11px">
                        ${p.variations.length} ${esc(p.variationTitle || 'Variation')}${p.variations.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </td>
            <td><span class="mono" style="font-size:12px">${esc(p.category)}</span></td>
            <td>
              <b class="mono">${formatPrice(p.price)}</b>
              ${p.oldPrice ? `<br><s class="mono" style="font-size:11px">${formatPrice(p.oldPrice)}</s>` : ''}
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" min="0" value="${p.stock}" class="admin-stock-quick" data-id="${p.id}" style="width:60px;height:30px;padding:2px 6px;border:1px solid var(--line-2);border-radius:6px;font-family:var(--fm);font-size:13px">
              </div>
            </td>
            <td>
              <button class="status-pill ${p.isPublished ? 'approved' : 'rejected'}" data-action="toggle-publish" data-id="${p.id}" style="cursor:pointer">
                ${p.isPublished ? 'Published' : 'Hidden'}
              </button>
            </td>
            <td>
              <span class="mono" style="font-size:12.5px">${p.rating.toFixed(1)} ★ (${p.reviewCount})</span>
            </td>
            <td>
              <div class="table-actions">
                <button class="btn-icon-sm" data-action="edit-product" data-id="${p.id}" title="Edit product"><i data-lucide="edit-3"></i></button>
                <a class="btn-icon-sm" href="#/product/${p.slug}" target="_blank" title="View on customer site"><i data-lucide="external-link"></i></a>
                <button class="btn-icon-sm danger" data-action="delete-product" data-id="${p.id}" title="Delete product"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  },

  bindProductTableActions() {
    const table = document.getElementById('admin-products-table-body');
    if (!table) return;

    // Toggle publish
    table.querySelectorAll('[data-action="toggle-publish"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await Api.adminTogglePublish(btn.dataset.id);
          btn.className = `status-pill ${res.isPublished ? 'approved' : 'rejected'}`;
          btn.textContent = res.isPublished ? 'Published' : 'Hidden';
          UI.toast(`Product is now ${res.isPublished ? 'Published' : 'Hidden'}`);
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });

    // Quick stock edit on blur/change
    table.querySelectorAll('.admin-stock-quick').forEach(input => {
      input.addEventListener('change', async () => {
        const id = input.dataset.id;
        const stock = parseInt(input.value, 10);
        if (isNaN(stock) || stock < 0) return;
        try {
          await Api.adminUpdateStock(id, stock);
          UI.toast(`Stock updated to ${stock}`);
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });

    // Edit product
    table.querySelectorAll('[data-action="edit-product"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = this.productsCache.find(p => p.id === btn.dataset.id);
        if (prod) this.openProductModal(prod);
      });
    });

    // Delete product
    table.querySelectorAll('[data-action="delete-product"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
        try {
          await Api.adminDeleteProduct(btn.dataset.id);
          UI.toast('Product deleted successfully');
          this.loadTabContent();
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });
  },

  // Add / Edit Product Modal
  async openProductModal(prod = null) {
    if (!this.categoriesCache || !this.categoriesCache.length) {
      this.categoriesCache = await Api.getCategories({ includeAll: true }).catch(() => []);
    }
    const isEdit = Boolean(prod);
    const modal = document.getElementById('admin-modal-content');
    const overlay = document.getElementById('admin-modal-overlay');

    let imagesList = prod && prod.images ? [...prod.images] : [];
    let specsMap = prod && prod.specifications ? (prod.specifications instanceof Map ? Object.fromEntries(prod.specifications) : prod.specifications) : {};
    let variationsList = prod && prod.variations ? JSON.parse(JSON.stringify(prod.variations)) : [];
    let variationTitle = (prod && prod.variationTitle) || 'Color Family';

    modal.innerHTML = `
    <div class="admin-modal-header">
      <h3>${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
      <button class="icon-btn" id="modal-close-btn"><i data-lucide="x"></i></button>
    </div>
    <form id="product-edit-form" class="admin-modal-body">
      <div class="form-grid">
        <div class="field full">
          <label for="pm-name">Product Name *</label>
          <input id="pm-name" type="text" required value="${esc(prod?.name || '')}" placeholder="e.g. Pocket Inkless Mini Thermal Printer">
        </div>
        <div class="field">
          <label for="pm-category">Category *</label>
          <select id="pm-category" required>
            ${this.categoriesCache.map(c => `
              <option value="${c.slug}" ${prod?.category === c.slug ? 'selected' : ''}>${esc(c.name)}</option>
            `).join('')}
          </select>
        </div>
        <div class="field">
          <label for="pm-slug">Slug <small>(optional, auto-generated if blank)</small></label>
          <input id="pm-slug" type="text" value="${esc(prod?.slug || '')}" placeholder="e.g. mini-thermal-printer">
        </div>
        <div class="field">
          <label for="pm-price">Main Price (Rs.) *</label>
          <input id="pm-price" type="number" min="0" required value="${prod?.price || ''}" placeholder="2499">
        </div>
        <div class="field">
          <label for="pm-oldprice">Old Price (Rs.) <small>(for discount tag)</small></label>
          <input id="pm-oldprice" type="number" min="0" value="${prod?.oldPrice || ''}" placeholder="3200">
        </div>
        <div class="field">
          <label for="pm-stock">Stock Quantity *</label>
          <input id="pm-stock" type="number" min="0" required value="${prod?.stock !== undefined ? prod.stock : 100}">
        </div>
        <div class="field">
          <label for="pm-keywords">Keywords <small>(comma separated)</small></label>
          <input id="pm-keywords" type="text" value="${esc(prod?.keywords?.join(', ') || '')}" placeholder="mini printer, bluetooth, thermal roll">
        </div>
        <div class="field full">
          <label for="pm-short">Short Description</label>
          <textarea id="pm-short" rows="2" placeholder="Brief 1-2 sentence overview for cards and PDP...">${esc(prod?.shortDescription || '')}</textarea>
        </div>
        <div class="field full">
          <label for="pm-desc">Full Description</label>
          <textarea id="pm-desc" rows="4" placeholder="Detailed product specifications, features, and packing...">${esc(prod?.description || '')}</textarea>
        </div>

        <!-- DARAZ-STYLE PRODUCT VARIATIONS MANAGER -->
        <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">
            <div>
              <label style="font-size:15px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:6px">
                <i data-lucide="layers" style="width:18px;height:18px;color:var(--accent)"></i> Product Variations (Daraz Style)
              </label>
              <p style="font-size:12.5px;color:var(--muted);margin-top:2px">Set options like "Pink Printer", "Blue Printer" with custom images and specific prices.</p>
            </div>
            <button type="button" class="btn btn-accent btn-sm" id="btn-add-var-row">
              <i data-lucide="plus"></i> Add Variation
            </button>
          </div>

          <div style="margin-bottom:12px;display:flex;align-items:center;gap:10px">
            <label for="pm-var-title" style="font-size:12.5px;white-space:nowrap;font-weight:600">Variation Title:</label>
            <input id="pm-var-title" type="text" value="${esc(variationTitle)}" placeholder="e.g. Color Family, Colour Variation, Size, Roll Pack..." style="max-width:320px">
          </div>

          <div id="variation-rows-container"></div>
        </div>

        <!-- Specifications Builder -->
        <div class="field full" style="border-top:1px solid var(--line);padding-top:16px;margin-top:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <label>Specifications Table</label>
            <button type="button" class="btn btn-outline btn-sm" id="btn-add-spec-row"><i data-lucide="plus"></i> Add Spec</button>
          </div>
          <div id="spec-rows-container">
            ${Object.entries(specsMap).map(([k, v]) => `
              <div class="spec-builder-row">
                <input type="text" class="spec-k" placeholder="Specification key (e.g. Width)" value="${esc(k)}">
                <input type="text" class="spec-v" placeholder="Value (e.g. 80 mm)" value="${esc(v)}">
                <button type="button" class="btn-icon-sm danger btn-del-spec"><i data-lucide="trash"></i></button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Images Manager & Upload -->
        <div class="field full" style="border-top:1px solid var(--line);padding-top:16px;margin-top:8px">
          <label>General Product Images</label>
          <div style="display:flex;gap:10px;margin-top:6px">
            <input type="text" id="pm-add-image-url" placeholder="Paste image URL (https://...)" style="flex:1">
            <button type="button" class="btn btn-outline btn-sm" id="btn-add-img-url">Add URL</button>
          </div>
          <div style="margin-top:12px">
            <label class="upload-dropzone">
              <input type="file" id="pm-file-upload" accept="image/*" multiple style="display:none">
              <i data-lucide="upload-cloud" style="width:28px;height:28px;color:var(--accent);margin:0 auto 6px"></i>
              <div style="font-weight:600;font-size:14px">Upload image(s) from your computer</div>
              <small style="color:var(--muted)">PNG, JPG, WEBP — Select multiple photos &amp; drag to re-order</small>
            </label>
          </div>
          <div class="image-list-grid" id="modal-image-grid">
            ${imagesList.map((src, idx) => `
              <div class="image-thumb-card">
                <img src="${src}" alt="">
                <button type="button" class="img-remove-btn" data-idx="${idx}">×</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Toggles -->
        <div class="field" style="flex-direction:row;align-items:center;gap:10px;margin-top:10px">
          <input type="checkbox" id="pm-published" ${prod?.isPublished !== false ? 'checked' : ''} style="width:18px;height:18px">
          <label for="pm-published" style="cursor:pointer">Publish product on store</label>
        </div>
        <div class="field" style="flex-direction:row;align-items:center;gap:10px;margin-top:10px">
          <input type="checkbox" id="pm-featured" ${prod?.featured ? 'checked' : ''} style="width:18px;height:18px">
          <label for="pm-featured" style="cursor:pointer">Feature on Homepage</label>
        </div>
      </div>
    </form>
    <div class="admin-modal-footer">
      <button class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
      <button class="btn btn-accent" id="modal-save-prod-btn">
        <i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Create Product'}
      </button>
    </div>`;

    overlay.classList.add('show');
    refreshIcons(modal);

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());

    // Variations Manager Rendering
    const renderVariationsList = () => {
      const varContainer = document.getElementById('variation-rows-container');
      if (!varContainer) return;

      if (!variationsList.length) {
        varContainer.innerHTML = `
          <div style="background:var(--paper);border:1.5px dashed var(--line-2);border-radius:10px;padding:16px;text-align:center;color:var(--muted);font-size:13px">
            No variations added yet. Click <b>"Add Variation"</b> above to add options like Color or Size.
          </div>`;
        return;
      }

      varContainer.innerHTML = variationsList.map((v, idx) => `
        <div class="variation-builder-card" data-var-idx="${idx}">
          <div class="var-card-header">
            <span>Option #${idx + 1}</span>
            <button type="button" class="btn-icon-sm danger btn-del-var" data-idx="${idx}" title="Remove variation"><i data-lucide="trash-2"></i></button>
          </div>
          <div class="var-card-grid">
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Option Name *</label>
              <input type="text" class="var-name-input" placeholder="e.g. Pink Printer" value="${esc(v.name || '')}">
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Price (Rs.) <small>(blank = main price)</small></label>
              <input type="number" min="0" class="var-price-input" placeholder="e.g. 2499" value="${v.price !== null && v.price !== undefined ? v.price : ''}">
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Old Price (Rs.) <small>(optional)</small></label>
              <input type="number" min="0" class="var-oldprice-input" placeholder="e.g. 3200" value="${v.oldPrice !== null && v.oldPrice !== undefined ? v.oldPrice : ''}">
            </div>
          </div>
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Variation Image</label>
            <div class="var-img-row">
              <div class="var-img-preview-box">
                ${v.image ? `<img src="${v.image}" alt="">` : `<i data-lucide="image"></i>`}
              </div>
              <input type="text" class="var-img-input" placeholder="Paste image URL (https://...) or upload" value="${esc(v.image || '')}" style="flex:1">
              <label class="btn btn-outline btn-sm var-upload-btn-wrap" style="margin:0;cursor:pointer">
                <i data-lucide="upload"></i> Upload
                <input type="file" class="var-file-upload" data-idx="${idx}" accept="image/*">
              </label>
            </div>
          </div>
        </div>
      `).join('');

      refreshIcons(varContainer);

      // Bind input events to keep state
      varContainer.querySelectorAll('.variation-builder-card').forEach(card => {
        const idx = parseInt(card.dataset.varIdx, 10);
        const nameInput = card.querySelector('.var-name-input');
        const priceInput = card.querySelector('.var-price-input');
        const oldPriceInput = card.querySelector('.var-oldprice-input');
        const imgInput = card.querySelector('.var-img-input');
        const fileInput = card.querySelector('.var-file-upload');
        const previewBox = card.querySelector('.var-img-preview-box');

        nameInput.addEventListener('input', (e) => {
          variationsList[idx].name = e.target.value;
        });
        priceInput.addEventListener('input', (e) => {
          variationsList[idx].price = e.target.value !== '' ? parseFloat(e.target.value) : null;
        });
        oldPriceInput.addEventListener('input', (e) => {
          variationsList[idx].oldPrice = e.target.value !== '' ? parseFloat(e.target.value) : null;
        });
        imgInput.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          variationsList[idx].image = val;
          previewBox.innerHTML = val ? `<img src="${val}" alt="">` : `<i data-lucide="image"></i>`;
          refreshIcons(previewBox);
        });

        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            UI.toast('Uploading variation image…');
            const res = await Api.adminUploadImage(file);
            if (res.ok && res.url) {
              variationsList[idx].image = res.url;
              imgInput.value = res.url;
              previewBox.innerHTML = `<img src="${res.url}" alt="">`;
              UI.toast('Variation image uploaded!');
            }
          } catch (err) {
            UI.toast(err.message || 'Upload failed', 'alert-circle', 'error');
          }
        });
      });

      // Bind delete variation button
      varContainer.querySelectorAll('.btn-del-var').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          variationsList.splice(idx, 1);
          renderVariationsList();
        });
      });
    };

    renderVariationsList();

    // Add variation button
    document.getElementById('btn-add-var-row').addEventListener('click', () => {
      variationsList.push({
        name: '',
        price: null,
        oldPrice: null,
        image: ''
      });
      renderVariationsList();
      const lastInput = document.querySelector('#variation-rows-container .variation-builder-card:last-child .var-name-input');
      if (lastInput) lastInput.focus();
    });

    // Add spec row
    document.getElementById('btn-add-spec-row').addEventListener('click', () => {
      const container = document.getElementById('spec-rows-container');
      const div = document.createElement('div');
      div.className = 'spec-builder-row';
      div.innerHTML = `
        <input type="text" class="spec-k" placeholder="Specification key (e.g. Core)">
        <input type="text" class="spec-v" placeholder="Value (e.g. 12.7 mm)">
        <button type="button" class="btn-icon-sm danger btn-del-spec"><i data-lucide="trash"></i></button>
      `;
      container.appendChild(div);
      refreshIcons(div);
      div.querySelector('.btn-del-spec').addEventListener('click', () => div.remove());
    });

    // Delete existing spec rows
    modal.querySelectorAll('.btn-del-spec').forEach(btn => {
      btn.addEventListener('click', (e) => e.target.closest('.spec-builder-row').remove());
    });

    // Multi-Image grid rendering with Drag & Drop reordering and Move controls
    let draggedIdx = null;

    const renderImagesGrid = () => {
      const grid = document.getElementById('modal-image-grid');
      if (!grid) return;

      if (!imagesList.length) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; font-size: 13px; color: var(--muted); padding: 12px 0; text-align: center;">No photos uploaded yet. Select single or multiple photos above.</div>`;
        return;
      }

      grid.innerHTML = imagesList.map((src, idx) => `
        <div class="image-thumb-card" draggable="true" data-idx="${idx}" title="Drag to reorder photo position">
          <div class="img-order-badge ${idx === 0 ? 'is-main' : ''}">${idx === 0 ? '★ 1 (Main)' : `#${idx + 1}`}</div>
          <img src="${src}" alt="" draggable="false">
          <div class="img-control-bar">
            <button type="button" class="img-move-btn btn-move-left" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Left / Previous">‹</button>
            <button type="button" class="img-move-btn btn-move-right" data-idx="${idx}" ${idx === imagesList.length - 1 ? 'disabled' : ''} title="Move Right / Next">›</button>
            <button type="button" class="img-remove-btn" data-idx="${idx}" title="Remove Photo">×</button>
          </div>
        </div>
      `).join('');

      // Bind remove button
      grid.querySelectorAll('.img-remove-btn').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(b.dataset.idx, 10);
          imagesList.splice(idx, 1);
          renderImagesGrid();
        });
      });

      // Bind move left (previous) button
      grid.querySelectorAll('.btn-move-left').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(b.dataset.idx, 10);
          if (idx > 0) {
            const temp = imagesList[idx];
            imagesList[idx] = imagesList[idx - 1];
            imagesList[idx - 1] = temp;
            renderImagesGrid();
          }
        });
      });

      // Bind move right (next) button
      grid.querySelectorAll('.btn-move-right').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(b.dataset.idx, 10);
          if (idx < imagesList.length - 1) {
            const temp = imagesList[idx];
            imagesList[idx] = imagesList[idx + 1];
            imagesList[idx + 1] = temp;
            renderImagesGrid();
          }
        });
      });

      // Drag and Drop event listeners for drag-to-reorder
      const cards = grid.querySelectorAll('.image-thumb-card');
      cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
          draggedIdx = parseInt(card.dataset.idx, 10);
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', draggedIdx);
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          cards.forEach(c => c.classList.remove('drag-over'));
          draggedIdx = null;
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const targetIdx = parseInt(card.dataset.idx, 10);
          if (targetIdx !== draggedIdx) {
            card.classList.add('drag-over');
          }
        });

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          const targetIdx = parseInt(card.dataset.idx, 10);
          if (draggedIdx !== null && draggedIdx !== targetIdx) {
            const movedItem = imagesList.splice(draggedIdx, 1)[0];
            imagesList.splice(targetIdx, 0, movedItem);
            renderImagesGrid();
          }
        });
      });
    };
    renderImagesGrid();

    document.getElementById('btn-add-img-url').addEventListener('click', () => {
      const input = document.getElementById('pm-add-image-url');
      const url = input.value.trim();
      if (url) {
        imagesList.push(url);
        input.value = '';
        renderImagesGrid();
      }
    });

    // File upload (supports single or multiple photo selection)
    document.getElementById('pm-file-upload').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      try {
        if (files.length === 1) {
          UI.toast('Uploading image…');
          const res = await Api.adminUploadImage(files[0]);
          if (res.ok && res.url) {
            imagesList.push(res.url);
            renderImagesGrid();
            UI.toast('Image uploaded successfully');
          }
        } else {
          UI.toast(`Uploading ${files.length} images…`);
          const res = await Api.adminUploadMultipleImages(files);
          if (res.ok && res.urls && res.urls.length) {
            imagesList.push(...res.urls);
            renderImagesGrid();
            UI.toast(`${res.urls.length} images uploaded successfully!`);
          }
        }
      } catch (err) {
        UI.toast(err.message || 'Upload failed', 'alert-circle', 'error');
      } finally {
        e.target.value = ''; // Reset input to allow selecting the same files again if needed
      }
    });

    // Save product
    document.getElementById('modal-save-prod-btn').addEventListener('click', async () => {
      const name = document.getElementById('pm-name').value.trim();
      const category = document.getElementById('pm-category').value;
      const slug = document.getElementById('pm-slug').value.trim();
      const price = parseFloat(document.getElementById('pm-price').value);
      const oldPrice = parseFloat(document.getElementById('pm-oldprice').value) || null;
      const stock = parseInt(document.getElementById('pm-stock').value, 10) || 0;
      const keywords = document.getElementById('pm-keywords').value;
      const shortDescription = document.getElementById('pm-short').value.trim();
      const description = document.getElementById('pm-desc').value.trim();
      const isPublished = document.getElementById('pm-published').checked;
      const featured = document.getElementById('pm-featured').checked;
      const varTitle = document.getElementById('pm-var-title')?.value.trim() || 'Color Family';

      if (!name || isNaN(price) || !category) {
        UI.toast('Please fill in Name, Price, and Category.', 'alert-circle', 'error');
        return;
      }

      // Collect specs
      const specifications = {};
      modal.querySelectorAll('.spec-builder-row').forEach(row => {
        const k = row.querySelector('.spec-k').value.trim();
        const v = row.querySelector('.spec-v').value.trim();
        if (k && v) specifications[k] = v;
      });

      // Filter valid variations
      const cleanVariations = variationsList
        .filter(v => v.name && v.name.trim().length > 0)
        .map(v => ({
          name: v.name.trim(),
          price: v.price !== null && v.price !== undefined && !isNaN(Number(v.price)) ? Number(v.price) : null,
          oldPrice: v.oldPrice !== null && v.oldPrice !== undefined && !isNaN(Number(v.oldPrice)) ? Number(v.oldPrice) : null,
          image: (v.image || '').trim()
        }));

      const payload = {
        name,
        category,
        slug: slug || undefined,
        price,
        oldPrice,
        stock,
        keywords,
        shortDescription,
        description,
        specifications,
        images: imagesList.length ? imagesList : undefined,
        isPublished,
        featured,
        variationTitle: varTitle,
        variations: cleanVariations
      };

      const saveBtn = document.getElementById('modal-save-prod-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Saving…';

      try {
        if (isEdit) {
          await Api.adminUpdateProduct(prod.id, payload);
          UI.toast('Product updated successfully');
        } else {
          await Api.adminCreateProduct(payload);
          UI.toast('Product created successfully');
        }
        this.closeModal();
        this.loadTabContent();
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="check"></i> Save Changes';
        refreshIcons(saveBtn);
        UI.toast(err.message || 'Failed to save product', 'alert-circle', 'error');
      }
    });
  },

  // -------------------------------------------------------------
  // TAB: Categories Management
  // -------------------------------------------------------------
  async renderTabCategories(container) {
    const catsRes = await Api.getCategories({ includeAll: true });
    this.categoriesCache = catsRes || [];

    // Update sidebar categories badge
    const pCatsBadge = document.getElementById('nav-categories-count');
    if (pCatsBadge) {
      pCatsBadge.textContent = this.categoriesCache.length;
      pCatsBadge.style.display = 'inline-block';
    }

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Categories Management</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Create, rename, or permanently delete product categories and manage item reassignments.</p>
      </div>
      <div class="admin-header-actions">
        <button class="btn btn-accent btn-sm" id="btn-add-category">
          <i data-lucide="plus"></i> Add New Category
        </button>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <div style="display:flex;gap:12px;flex-wrap:wrap;flex:1">
          <input type="search" class="admin-search-input" id="admin-cat-search" placeholder="Search categories by name, slug, or tagline…">
        </div>
        <span style="font-size:13px;color:var(--muted)">Total: <b id="cat-total-count">${this.categoriesCache.length}</b> categories</span>
      </div>

      <div id="admin-categories-table-body">
        ${this.renderCategoriesTableHtml(this.categoriesCache)}
      </div>
    </div>`;

    document.getElementById('btn-add-category')?.addEventListener('click', () => this.openCategoryModal());

    const searchInput = document.getElementById('admin-cat-search');
    const filterCategories = () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = this.categoriesCache.filter(c => {
        return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.tagline && c.tagline.toLowerCase().includes(q));
      });
      document.getElementById('admin-categories-table-body').innerHTML = this.renderCategoriesTableHtml(filtered);
      document.getElementById('cat-total-count').textContent = filtered.length;
      refreshIcons(document.getElementById('admin-categories-table-body'));
      this.bindCategoryTableActions();
    };

    searchInput.addEventListener('input', debounce(filterCategories, 160));
    this.bindCategoryTableActions();
  },

  renderCategoriesTableHtml(categories) {
    if (!categories.length) {
      return `<div style="padding:40px;text-align:center;color:var(--muted)">No categories found. Click "Add New Category" above to create one.</div>`;
    }

    return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Category Name</th>
          <th>Slug / URL</th>
          <th>Tagline / Description</th>
          <th>Products Count</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${categories.map(c => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:12px">
                ${c.image ? `
                  <img src="${c.image}" alt="${esc(c.name)}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid var(--line);flex-shrink:0" loading="lazy">
                ` : `
                  <div style="width:40px;height:40px;border-radius:8px;background:var(--paper-deep);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0">
                    <i data-lucide="folder"></i>
                  </div>
                `}
                <div>
                  <b style="font-size:14.5px;display:block">${esc(c.name)}</b>
                </div>
              </div>
            </td>
            <td>
              <span class="mono" style="font-size:12px;background:var(--paper-deep);padding:3px 8px;border-radius:6px">/${esc(c.slug)}</span>
            </td>
            <td>
              <span style="color:var(--muted);font-size:13px">${esc(c.tagline || '—')}</span>
            </td>
            <td>
              <span class="status-pill ${c.count > 0 ? 'approved' : 'pending'}">${c.count} Product${c.count !== 1 ? 's' : ''}</span>
            </td>
            <td>
              <div class="table-actions">
                <button class="btn-icon-sm" data-action="edit-category" data-slug="${c.slug}" title="Edit Category"><i data-lucide="edit-3"></i></button>
                <a class="btn-icon-sm" href="#/category/${c.slug}" target="_blank" title="View category page in store"><i data-lucide="external-link"></i></a>
                <button class="btn-icon-sm danger" data-action="delete-category" data-slug="${c.slug}" title="Delete Category"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  },

  bindCategoryTableActions() {
    const table = document.getElementById('admin-categories-table-body');
    if (!table) return;

    table.querySelectorAll('[data-action="edit-category"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = this.categoriesCache.find(c => c.slug === btn.dataset.slug);
        if (cat) this.openCategoryModal(cat);
      });
    });

    table.querySelectorAll('[data-action="delete-category"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = this.categoriesCache.find(c => c.slug === btn.dataset.slug);
        if (cat) this.openDeleteCategoryModal(cat);
      });
    });
  },

  openCategoryModal(cat = null) {
    const isEdit = Boolean(cat);
    const modal = document.getElementById('admin-modal-content');
    const overlay = document.getElementById('admin-modal-overlay');
    let currentImage = cat?.image || '';

    modal.innerHTML = `
    <div class="admin-modal-header">
      <h3>${isEdit ? 'Edit Category' : 'Add New Category'}</h3>
      <button class="icon-btn" id="modal-close-btn"><i data-lucide="x"></i></button>
    </div>
    <form id="category-edit-form" class="admin-modal-body" novalidate>
      <div class="form-grid">
        <div class="field full">
          <label for="cm-name">Category Name *</label>
          <input id="cm-name" type="text" required value="${esc(cat?.name || '')}" placeholder="e.g. Thermal Paper Rolls">
        </div>
        <div class="field full">
          <label for="cm-slug">URL Slug <small>(auto-generated from name if left blank)</small></label>
          <input id="cm-slug" type="text" value="${esc(cat?.slug || '')}" placeholder="e.g. thermal-paper-rolls">
          <div class="mono" style="font-size:11.5px;color:var(--muted);margin-top:5px">
            Store URL: <b>#/category/<span id="cm-slug-preview">${esc(cat?.slug || 'category-slug')}</span></b>
          </div>
        </div>
        <div class="field full">
          <label for="cm-tagline">Tagline / Short Description <small>(optional subtitle)</small></label>
          <input id="cm-tagline" type="text" value="${esc(cat?.tagline || '')}" placeholder="e.g. Genuine BPA-free thermal rolls for counter cash registers">
        </div>

        <!-- CATEGORY IMAGE CONTROLLER -->
        <div class="field full" style="border-top:1px solid var(--line);padding-top:16px;margin-top:8px">
          <label style="font-weight:700;font-size:14px;color:var(--ink);display:flex;align-items:center;gap:6px">
            <i data-lucide="image" style="width:16px;height:16px;color:var(--accent)"></i> Category Card Image (Square 1:1)
          </label>
          <p style="font-size:12.5px;color:var(--muted);margin:2px 0 10px">This image appears in the "Shop by Category" square cards on the homepage.</p>
          
          <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
            <div id="cm-img-preview-box" style="width:100px;height:100px;border-radius:12px;border:2px dashed var(--line-2);overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--paper-deep);flex-shrink:0;position:relative">
              ${currentImage ? `<img id="cm-preview-img" src="${currentImage}" alt="Category Image" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:11px;color:var(--muted);text-align:center;padding:4px"><i data-lucide="image" style="width:24px;height:24px;display:block;margin:0 auto 4px"></i>No Image</span>`}
            </div>
            <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;gap:8px">
                <input id="cm-image-url" type="url" placeholder="Paste image URL (https://...)" value="${esc(currentImage)}" style="flex:1">
                <button type="button" class="btn btn-outline btn-sm" id="cm-apply-url-btn" title="Apply URL">Apply</button>
              </div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <label class="btn btn-outline btn-sm" style="cursor:pointer;margin:0">
                  <i data-lucide="upload"></i> Upload Image
                  <input type="file" id="cm-file-upload" accept="image/*" style="display:none">
                </label>
                <button type="button" class="btn btn-sm" id="cm-remove-img-btn" style="color:var(--red);background:transparent;border:none;cursor:pointer;display:${currentImage ? 'inline-flex' : 'none'};align-items:center;gap:4px">
                  <i data-lucide="trash-2" style="width:14px;height:14px"></i> Remove Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
    <div class="admin-modal-footer">
      <button class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
      <button class="btn btn-accent" id="modal-save-cat-btn">
        <i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Create Category'}
      </button>
    </div>`;

    overlay.classList.add('show');
    refreshIcons(modal);

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());

    const nameInput = document.getElementById('cm-name');
    const slugInput = document.getElementById('cm-slug');
    const slugPreview = document.getElementById('cm-slug-preview');
    const imgUrlInput = document.getElementById('cm-image-url');
    const previewBox = document.getElementById('cm-img-preview-box');
    const removeImgBtn = document.getElementById('cm-remove-img-btn');

    const updateImgPreview = (url) => {
      currentImage = url.trim();
      imgUrlInput.value = currentImage;
      if (currentImage) {
        previewBox.innerHTML = `<img id="cm-preview-img" src="${currentImage}" alt="Category Image" style="width:100%;height:100%;object-fit:cover">`;
        removeImgBtn.style.display = 'inline-flex';
      } else {
        previewBox.innerHTML = `<span style="font-size:11px;color:var(--muted);text-align:center;padding:4px"><i data-lucide="image" style="width:24px;height:24px;display:block;margin:0 auto 4px"></i>No Image</span>`;
        removeImgBtn.style.display = 'none';
        refreshIcons(previewBox);
      }
    };

    document.getElementById('cm-apply-url-btn').addEventListener('click', () => {
      updateImgPreview(imgUrlInput.value);
    });
    imgUrlInput.addEventListener('change', () => {
      updateImgPreview(imgUrlInput.value);
    });

    document.getElementById('cm-file-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        UI.toast('Uploading category image…');
        const res = await Api.adminUploadImage(file);
        if (res.ok && res.url) {
          updateImgPreview(res.url);
          UI.toast('Category image uploaded successfully!');
        }
      } catch (err) {
        UI.toast(err.message || 'Upload failed', 'alert-circle', 'error');
      }
    });

    removeImgBtn.addEventListener('click', () => {
      updateImgPreview('');
    });

    const slugifyStr = (text) => text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');

    if (!isEdit) {
      nameInput.addEventListener('input', () => {
        if (!slugInput.dataset.manual) {
          const s = slugifyStr(nameInput.value);
          slugInput.value = s;
          slugPreview.textContent = s || 'category-slug';
        }
      });
      slugInput.addEventListener('input', () => {
        slugInput.dataset.manual = 'true';
        slugPreview.textContent = slugifyStr(slugInput.value) || 'category-slug';
      });
    } else {
      slugInput.addEventListener('input', () => {
        slugPreview.textContent = slugifyStr(slugInput.value) || 'category-slug';
      });
    }

    document.getElementById('modal-save-cat-btn').addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const slugVal = slugInput.value.trim();
      const tagline = document.getElementById('cm-tagline').value.trim();
      const image = currentImage;

      if (!name) {
        UI.toast('Please enter a category name.', 'alert-circle', 'error');
        nameInput.focus();
        return;
      }

      const saveBtn = document.getElementById('modal-save-cat-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Saving…';

      try {
        if (isEdit) {
          const res = await Api.adminUpdateCategory(cat.slug, {
            name,
            slug: slugVal,
            tagline,
            image
          });
          UI.toast(res.message || 'Category updated successfully!', 'check-circle-2', 'success');
        } else {
          const res = await Api.adminCreateCategory({
            name,
            slug: slugVal,
            tagline,
            image
          });
          UI.toast(res.message || 'Category created successfully!', 'check-circle-2', 'success');
        }

        this.categoriesCache = await Api.getCategories({ includeAll: true });
        this.closeModal();
        if (this.currentTab === 'categories') {
          this.loadTabContent();
        }
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Create Category'}`;
        refreshIcons(saveBtn);
        UI.toast(err.message || 'Failed to save category', 'alert-circle', 'error');
      }
    });
  },

  openDeleteCategoryModal(cat) {
    const modal = document.getElementById('admin-modal-content');
    const overlay = document.getElementById('admin-modal-overlay');
    const prodCount = cat.count || 0;
    const otherCategories = this.categoriesCache.filter(c => c.slug !== cat.slug);

    modal.innerHTML = `
    <div class="admin-modal-header">
      <h3 style="color:var(--red)"><i data-lucide="alert-triangle" style="width:20px;height:20px;display:inline-block;vertical-align:-3px;margin-right:6px"></i> Delete Category</h3>
      <button class="icon-btn" id="modal-close-btn"><i data-lucide="x"></i></button>
    </div>
    <div class="admin-modal-body">
      <p style="font-size:15px;margin-bottom:14px">
        Are you sure you want to permanently delete category <b>${esc(cat.name)}</b> (<code class="mono">/${esc(cat.slug)}</code>)?
      </p>

      ${prodCount > 0 ? `
        <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:10px;padding:14px;margin-bottom:18px">
          <b style="color:#E65100;display:block;margin-bottom:4px">⚠️ Notice: This category contains ${prodCount} product(s)</b>
          <p style="font-size:13px;color:#795548;margin:0">Please choose how you want to handle the products currently assigned to this category:</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px">
          ${otherCategories.length > 0 ? `
          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:var(--paper);padding:14px;border-radius:10px;border:1px solid var(--line)">
            <input type="radio" name="del-cat-action" value="shift" checked style="margin-top:3px;width:18px;height:18px">
            <div style="flex:1">
              <b style="font-size:14px">Move all ${prodCount} product(s) to another category (Recommended)</b>
              <p style="font-size:12.5px;color:var(--muted);margin:3px 0 8px">Products will not be deleted; their category will be changed.</p>
              <div>
                <select id="del-cat-target-slug" class="admin-filter-select" style="width:100%;max-width:340px">
                  ${otherCategories.map(oc => `
                    <option value="${oc.slug}">${esc(oc.name)} (/${oc.slug})</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </label>
          ` : ''}

          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:rgba(198,40,40,0.04);padding:14px;border-radius:10px;border:1px solid rgba(198,40,40,0.25)">
            <input type="radio" name="del-cat-action" value="delete" ${otherCategories.length === 0 ? 'checked' : ''} style="margin-top:3px;width:18px;height:18px">
            <div>
              <b style="color:var(--red);font-size:14px">Permanently delete category AND all ${prodCount} product(s)</b>
              <p style="font-size:12.5px;color:var(--muted);margin-top:3px">All ${prodCount} products and their customer reviews will be permanently erased from the store and database.</p>
            </div>
          </label>
        </div>
      ` : `
        <p style="color:var(--muted);font-size:13.5px">This category has 0 products and can be deleted safely.</p>
      `}
    </div>
    <div class="admin-modal-footer">
      <button class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
      <button class="btn btn-ink danger" id="modal-confirm-del-cat-btn" style="background:var(--red);color:#fff;border-color:var(--red)">
        <i data-lucide="trash-2"></i> Permanently Delete
      </button>
    </div>`;

    overlay.classList.add('show');
    refreshIcons(modal);

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());

    document.getElementById('modal-confirm-del-cat-btn').addEventListener('click', async () => {
      const btn = document.getElementById('modal-confirm-del-cat-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Deleting…';

      try {
        let payload = {};
        if (prodCount > 0) {
          const actionRadio = document.querySelector('input[name="del-cat-action"]:checked');
          const action = actionRadio ? actionRadio.value : 'shift';
          payload.action = action;
          if (action === 'shift') {
            const targetSelect = document.getElementById('del-cat-target-slug');
            if (!targetSelect || !targetSelect.value) {
              throw new Error('Please choose a destination category.');
            }
            payload.targetCategorySlug = targetSelect.value;
          }
        }

        const res = await Api.adminDeleteCategory(cat.slug, payload);
        UI.toast(res.message || 'Category deleted successfully!', 'check-circle-2', 'success');

        this.categoriesCache = await Api.getCategories({ includeAll: true });
        this.closeModal();
        if (this.currentTab === 'categories') {
          this.loadTabContent();
        }
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="trash-2"></i> Permanently Delete';
        refreshIcons(btn);
        UI.toast(err.message || 'Failed to delete category', 'alert-circle', 'error');
      }
    });
  },

  closeModal() {
    document.getElementById('admin-modal-overlay').classList.remove('show');
  },

  // -------------------------------------------------------------
  // TAB 3: Orders Management
  // -------------------------------------------------------------
  async renderTabOrders(container) {
    const res = await Api.adminGetOrders({ limit: 100 });
    const orders = res.orders || [];

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Orders Management</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Track, filter, verify customer details, and update shipment status.</p>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <div style="display:flex;gap:12px;flex-wrap:wrap;flex:1">
          <input type="search" class="admin-search-input" id="admin-order-search" placeholder="Search by Order ID, name, phone, city…">
          <select class="admin-filter-select" id="admin-order-status-filter">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <span style="font-size:13px;color:var(--muted)">Showing <b>${orders.length}</b> orders</span>
      </div>

      <div id="admin-orders-table-body">
        ${this.renderOrdersTableHtml(orders)}
      </div>
    </div>`;

    const searchInput = document.getElementById('admin-order-search');
    const statusFilter = document.getElementById('admin-order-status-filter');

    const filterOrders = async () => {
      const search = searchInput.value.trim();
      const status = statusFilter.value;
      const filteredRes = await Api.adminGetOrders({ search, status });
      document.getElementById('admin-orders-table-body').innerHTML = this.renderOrdersTableHtml(filteredRes.orders || []);
      refreshIcons(document.getElementById('admin-orders-table-body'));
      this.bindOrderTableActions();
    };

    searchInput.addEventListener('input', debounce(filterOrders, 200));
    statusFilter.addEventListener('change', filterOrders);

    this.bindOrderTableActions();
  },

  renderOrdersTableHtml(orders) {
    if (!orders.length) {
      return `<div style="padding:40px;text-align:center;color:var(--muted)">No orders found.</div>`;
    }

    return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Date</th>
          <th>Customer Info</th>
          <th>Product &amp; Qty</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td><b class="mono" style="font-size:13px">${esc(o.orderId)}</b></td>
            <td><span class="mono" style="font-size:12px">${formatDate(o.orderDate || o.createdAt)}</span></td>
            <td>
              <b>${esc(o.customerName)}</b>
              <div style="font-size:12px;color:var(--muted)">${esc(o.customerPhone)} · ${esc(o.customerCity)}</div>
            </td>
            <td>
              <b>${esc(o.productName)}</b>
              ${(o.selectedVariation && o.selectedVariation.name) ? `
                <div style="margin-top:2px">
                  <span class="var-badge-summary" style="font-size:11px">Var: ${esc(o.selectedVariation.name)}</span>
                </div>
              ` : ''}
              <div class="mono" style="font-size:11.5px;color:var(--muted)">Qty: ${o.quantity} · ${formatPrice(o.productPrice)} each</div>
            </td>
            <td><b class="mono">${formatPrice(o.grandTotal)}</b></td>
            <td>
              <select class="admin-filter-select status-changer" data-id="${o.orderId}" style="height:32px;font-size:12px;font-weight:600">
                ${['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s => `
                  <option value="${s}" ${o.orderStatus === s ? 'selected' : ''}>${s}</option>
                `).join('')}
              </select>
            </td>
            <td>
              <div class="table-actions">
                <button class="btn-icon-sm" data-action="view-order-modal" data-id="${o.orderId}" title="View Order"><i data-lucide="eye"></i></button>
                <a class="btn-icon-sm success" href="https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}" target="_blank" title="WhatsApp Customer"><i data-lucide="message-circle"></i></a>
                <button class="btn-icon-sm danger" data-action="delete-order" data-id="${o.orderId}" title="Delete Order"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  },

  bindOrderTableActions() {
    const table = document.getElementById('admin-orders-table-body');
    if (!table) return;

    table.querySelectorAll('.status-changer').forEach(select => {
      select.addEventListener('change', async () => {
        const orderId = select.dataset.id;
        const newStatus = select.value;
        try {
          await Api.adminUpdateOrderStatus(orderId, newStatus);
          UI.toast(`Order ${orderId} updated to ${newStatus}`);
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });

    table.querySelectorAll('[data-action="view-order-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.openOrderDetailsModal(btn.dataset.id));
    });

    table.querySelectorAll('[data-action="delete-order"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
          await Api.adminDeleteOrder(btn.dataset.id);
          UI.toast('Order deleted successfully');
          this.loadTabContent();
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });
  },

  async openOrderDetailsModal(orderId) {
    try {
      const res = await Api.adminGetOrder(orderId);
      const o = res.order;
      const modal = document.getElementById('admin-modal-content');
      const overlay = document.getElementById('admin-modal-overlay');

      modal.innerHTML = `
      <div class="admin-modal-header">
        <div>
          <h3>Order Details</h3>
          <span class="mono" style="font-size:12px;color:var(--muted)">${esc(o.orderId)} · ${formatDate(o.orderDate || o.createdAt)}</span>
        </div>
        <button class="icon-btn" id="order-modal-close"><i data-lucide="x"></i></button>
      </div>
      <div class="admin-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div style="background:var(--paper);padding:18px;border-radius:12px">
            <h4 style="font-size:14px;margin-bottom:12px;font-family:var(--fm);color:var(--muted);text-transform:uppercase">Customer Information</h4>
            <p style="font-size:15px;font-weight:700">${esc(o.customerName)}</p>
            <p style="font-size:14px;color:var(--ink-2);margin-top:4px"><i data-lucide="phone" style="width:14px;height:14px;display:inline"></i> ${esc(o.customerPhone)}</p>
            ${o.customerEmail ? `<p style="font-size:14px;color:var(--ink-2);margin-top:4px"><i data-lucide="mail" style="width:14px;height:14px;display:inline"></i> ${esc(o.customerEmail)}</p>` : ''}
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line-2)">
              <b style="font-size:13px">Delivery Address:</b>
              <p style="font-size:14px;margin-top:2px">${esc(o.customerAddress)}</p>
              <p style="font-size:14px;font-weight:600;margin-top:2px">City: ${esc(o.customerCity)}</p>
            </div>
            ${o.customerNotes ? `<div style="margin-top:10px;background:var(--surface);padding:8px 10px;border-radius:6px;font-size:13px"><b>Notes:</b> ${esc(o.customerNotes)}</div>` : ''}
          </div>

          <div style="background:var(--paper);padding:18px;border-radius:12px">
            <h4 style="font-size:14px;margin-bottom:12px;font-family:var(--fm);color:var(--muted);text-transform:uppercase">Order Summary</h4>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div>
                <b>${esc(o.productName)}</b>
                ${(o.selectedVariation && o.selectedVariation.name) ? `
                  <div style="margin-top:2px"><span class="var-badge-summary">Variation: ${esc(o.selectedVariation.name)}</span></div>
                ` : ''}
                <div class="mono" style="font-size:12px;color:var(--muted);margin-top:2px">Qty: ${o.quantity} × ${formatPrice(o.productPrice)}</div>
              </div>
              <span class="mono" style="font-weight:700">${formatPrice(o.productTotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:var(--muted);font-size:13.5px">
              <span>Shipping (Flat)</span>
              <span class="mono">${formatPrice(o.shipping)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--line-2);font-weight:700;font-size:17px">
              <span>Grand Total</span>
              <span class="mono">${formatPrice(o.grandTotal)}</span>
            </div>
            <div style="margin-top:18px">
              <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Update Status:</label>
              <select id="modal-order-status" class="admin-filter-select" style="width:100%">
                ${['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s => `
                  <option value="${s}" ${o.orderStatus === s ? 'selected' : ''}>${s}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="admin-modal-footer">
        <a class="btn btn-outline" href="https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}" target="_blank">
          <i data-lucide="message-circle"></i> Chat on WhatsApp
        </a>
        <button class="btn btn-accent" id="modal-save-order-status">Save Status</button>
      </div>`;

      overlay.classList.add('show');
      refreshIcons(modal);

      document.getElementById('order-modal-close').addEventListener('click', () => this.closeModal());
      document.getElementById('modal-save-order-status').addEventListener('click', async () => {
        const newStatus = document.getElementById('modal-order-status').value;
        await Api.adminUpdateOrderStatus(o.orderId, newStatus);
        UI.toast(`Order status updated to ${newStatus}`);
        this.closeModal();
        this.loadTabContent();
      });
    } catch (err) {
      UI.toast(err.message, 'alert-circle', 'error');
    }
  },

  // -------------------------------------------------------------
  // TAB 4: Reviews Moderation
  // -------------------------------------------------------------
  async renderTabReviews(container) {
    const res = await Api.adminGetReviews();
    const reviews = res.reviews || [];

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Customer Reviews Moderation</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Approve, reject, or delete incoming customer reviews. Ratings update automatically.</p>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <div style="display:flex;gap:12px;flex-wrap:wrap;flex:1">
          <select class="admin-filter-select" id="admin-review-status-filter">
            <option value="All">All Reviews</option>
            <option value="pending" selected>Pending Moderation</option>
            <option value="approved">Approved (Public)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <span style="font-size:13px;color:var(--muted)">Showing <b>${reviews.length}</b> reviews</span>
      </div>

      <div id="admin-reviews-table-body">
        ${this.renderReviewsTableHtml(reviews.filter(r => r.status === 'pending'))}
      </div>
    </div>`;

    const statusFilter = document.getElementById('admin-review-status-filter');
    statusFilter.addEventListener('change', async () => {
      const status = statusFilter.value;
      const filteredRes = await Api.adminGetReviews({ status });
      document.getElementById('admin-reviews-table-body').innerHTML = this.renderReviewsTableHtml(filteredRes.reviews || []);
      refreshIcons(document.getElementById('admin-reviews-table-body'));
      this.bindReviewActions();
    });

    this.bindReviewActions();
  },

  renderReviewsTableHtml(reviews) {
    if (!reviews.length) {
      return `<div style="padding:40px;text-align:center;color:var(--muted)">No reviews in this queue.</div>`;
    }

    return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Product</th>
          <th>Rating &amp; Review</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${reviews.map(r => `
          <tr>
            <td><b>${esc(r.name)}</b></td>
            <td><span class="mono" style="font-size:12px">${esc(r.productSlug || r.productId)}</span></td>
            <td>
              <div style="font-size:13px">${stars(r.rating)} <b>${r.rating} / 5</b></div>
              <p style="font-size:13.5px;color:var(--ink-2);margin-top:4px">${esc(r.text)}</p>
            </td>
            <td><span class="mono" style="font-size:12px">${formatDate(r.date || r.createdAt)}</span></td>
            <td><span class="status-pill ${r.status}">${r.status}</span></td>
            <td>
              <div class="table-actions">
                ${r.status !== 'approved' ? `<button class="btn-icon-sm success" data-action="approve-review" data-id="${r._id}" title="Approve Review"><i data-lucide="check"></i></button>` : ''}
                ${r.status !== 'rejected' ? `<button class="btn-icon-sm danger" data-action="reject-review" data-id="${r._id}" title="Reject Review"><i data-lucide="x"></i></button>` : ''}
                <button class="btn-icon-sm" data-action="delete-review" data-id="${r._id}" title="Delete Permanently"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  },

  bindReviewActions() {
    const table = document.getElementById('admin-reviews-table-body');
    if (!table) return;

    table.querySelectorAll('[data-action="approve-review"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await Api.adminUpdateReviewStatus(btn.dataset.id, 'approved');
          UI.toast('Review approved! Product rating updated.');
          this.loadTabContent();
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });

    table.querySelectorAll('[data-action="reject-review"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await Api.adminUpdateReviewStatus(btn.dataset.id, 'rejected');
          UI.toast('Review rejected.');
          this.loadTabContent();
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });

    table.querySelectorAll('[data-action="delete-review"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this review permanently?')) return;
        try {
          await Api.adminDeleteReview(btn.dataset.id);
          UI.toast('Review deleted.');
          this.loadTabContent();
        } catch (err) {
          UI.toast(err.message, 'alert-circle', 'error');
        }
      });
    });
  },

  // -------------------------------------------------------------
  // TAB 5: Theme & Website Settings
  // -------------------------------------------------------------
  async renderTabSettings(container) {
    const [s, productsRes] = await Promise.all([
      Api.getSettings(),
      Api.getProducts({ limit: 100 }).catch(() => [])
    ]);
    const allProducts = Array.isArray(productsRes) ? productsRes : (productsRes?.products || []);
    const currentAdmin = Api.getAdminUser() || { name: 'Admin', email: 'admin@rollpoint.pk' };

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Website Theme &amp; Settings</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Configure store branding, WhatsApp ordering number, theme colors, shipping rates, and admin login credentials.</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:24px;width:100%">
      <!-- Store Settings Card -->
      <div class="admin-card" style="padding:30px">
        <h3 style="font-size:18px;margin-bottom:18px;display:flex;align-items:center;gap:8px">
          <i data-lucide="sliders" style="color:var(--accent)"></i> Store &amp; Brand Settings
        </h3>
        <form id="site-settings-form" novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="st-name">Website / Store Name</label>
              <input id="st-name" type="text" value="${esc(s.websiteName || 'RollsPoint')}" required>
            </div>
            <div class="field">
              <label for="st-tagline">Tagline</label>
              <input id="st-tagline" type="text" value="${esc(s.tagline || 'Counter supplies, delivered.')}">
            </div>

            <div class="field">
              <label for="st-wa-local">WhatsApp Display Number</label>
              <input id="st-wa-local" type="text" value="${esc(s.whatsappNumber || '0308 9134302')}" placeholder="0308 9134302">
            </div>
            <div class="field">
              <label for="st-wa-intl">WhatsApp Target / wa.me Number (No '+' or spaces)</label>
              <input id="st-wa-intl" type="text" value="${esc(s.whatsappIntl || '923089134302')}" placeholder="923089134302">
            </div>

            <div class="field">
              <label for="st-email">Contact Email</label>
              <input id="st-email" type="email" value="${esc(s.contactEmail || 'malikusmanhaider0346@gmail.com')}">
            </div>
            <div class="field">
              <label for="st-shipping">Flat Nationwide Shipping Rate (Rs.)</label>
              <input id="st-shipping" type="number" min="0" value="${s.shippingRate !== undefined ? s.shippingRate : 250}">
            </div>

            <div class="field full">
              <label for="st-address">Warehouse / Physical Address</label>
              <input id="st-address" type="text" value="${esc(s.contactAddress || 'Rehmat Plaza, Pakistan Town Phase 2 Rd, near Allah Wali Masjid, Phase 2 Islamabad, 45720, Pakistan')}">
            </div>
            <div class="field full">
              <label for="st-maps-url">Google Maps Location Link (URL)</label>
              <input id="st-maps-url" type="url" value="${esc(s.googleMapsUrl || 'https://maps.app.goo.gl/N9xDnGzuN3n8PbCD6?g_st=awb')}" placeholder="https://maps.app.goo.gl/...">
            </div>
            <div class="field full">
              <label for="st-hours">Business Hours</label>
              <input id="st-hours" type="text" value="${esc(s.contactHours || 'Mon–Sat · 10:00 am – 8:00 pm')}">
            </div>

            <!-- Homepage Hero Banner Image & Product Link Settings -->
            <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
              <h4 style="font-size:15px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
                <i data-lucide="image" style="color:var(--accent);width:18px;height:18px"></i> Top Banner Picture &amp; Linked Product
              </h4>
              <p style="color:var(--muted);font-size:13px;margin-bottom:14px">User jab homepage ki is picture par click karega to directly aapke select kiye gaye product page par chala jayega.</p>
              
              <div style="display:flex;flex-direction:column;gap:14px;background:var(--paper-2);border:1px solid var(--line);padding:16px;border-radius:var(--r);margin-bottom:12px">
                <div class="field">
                  <label for="st-hero-product" style="font-weight:600">Select Product to Open on Click (Clickable Link)</label>
                  <select id="st-hero-product" style="font-size:14px;background:#fff">
                    <option value="">-- No specific product (Links to All Products) --</option>
                    ${allProducts.map(p => `
                      <option value="${p.slug}" ${s.heroProductSlug === p.slug ? 'selected' : ''}>
                        ${esc(p.name)} (${formatPrice(p.price)})
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
                  <div style="width:140px;height:140px;border-radius:var(--r);overflow:hidden;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <img id="st-hero-preview" src="${esc(s.heroImage || 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg')}" alt="Hero Preview" style="width:100%;height:100%;object-fit:contain;background:#fff">
                  </div>
                  <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px">
                    <div class="field">
                      <label for="st-hero-img">Main Cover Image URL</label>
                      <input id="st-hero-img" type="text" value="${esc(s.heroImage || 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg')}" placeholder="Paste Image URL or upload below" style="background:#fff">
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                      <label class="upload-dropzone" style="flex:1;padding:10px;cursor:pointer;background:#fff">
                        <input type="file" id="st-hero-file-upload" accept="image/*" style="display:none">
                        <i data-lucide="upload-cloud" style="width:20px;height:20px;color:var(--accent);margin:0 auto 2px"></i>
                        <div style="font-weight:600;font-size:12px">Upload Single Cover Image</div>
                        <small style="color:var(--muted);font-size:10px">PNG, JPG, WEBP up to 5MB</small>
                      </label>
                      <button type="button" class="btn btn-outline btn-sm" id="btn-use-prod-img" style="align-self:center;height:fit-content;padding:10px 12px;white-space:nowrap" title="Auto-fill image from selected product">
                        <i data-lucide="sparkles"></i> Use Product's Image
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Hero Multi-Image Slider & Timer Settings -->
                <div style="border-top:1px dashed var(--line);padding-top:14px;margin-top:8px;display:flex;flex-direction:column;gap:12px">
                  <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
                    <div class="field" style="width:200px">
                      <label for="st-hero-interval" style="font-weight:600;display:flex;align-items:center;gap:4px">
                        <i data-lucide="timer" style="width:15px;height:15px;color:var(--accent)"></i> Slide Timer (Seconds)
                      </label>
                      <select id="st-hero-interval" style="background:#fff;font-weight:600">
                        <option value="1" ${s.heroInterval === 1 ? 'selected' : ''}>1 Second (Super Fast)</option>
                        <option value="2" ${s.heroInterval === 2 ? 'selected' : ''}>2 Seconds</option>
                        <option value="3" ${!s.heroInterval || s.heroInterval === 3 ? 'selected' : ''}>3 Seconds (Recommended)</option>
                        <option value="4" ${s.heroInterval === 4 ? 'selected' : ''}>4 Seconds</option>
                        <option value="5" ${s.heroInterval === 5 ? 'selected' : ''}>5 Seconds</option>
                        <option value="8" ${s.heroInterval === 8 ? 'selected' : ''}>8 Seconds</option>
                        <option value="10" ${s.heroInterval === 10 ? 'selected' : ''}>10 Seconds</option>
                      </select>
                    </div>
                    <div style="flex:1;min-width:240px">
                      <label class="upload-dropzone" style="padding:12px;cursor:pointer;background:#fff;border:2px dashed var(--accent)">
                        <input type="file" id="st-hero-multi-file-upload" accept="image/*" multiple style="display:none">
                        <i data-lucide="images" style="width:22px;height:22px;color:var(--accent);margin:0 auto 4px"></i>
                        <div style="font-weight:700;font-size:13px;color:var(--ink)">Upload Multiple Images for Slideshow</div>
                        <small style="color:var(--muted);font-size:11px">Select 2, 5, 10 or more images at once from PC</small>
                      </label>
                    </div>
                  </div>

                  <div class="field">
                    <label for="st-hero-images-txt" style="font-weight:600">Slider Image URLs (One URL per line)</label>
                    <textarea id="st-hero-images-txt" rows="4" style="background:#fff;font-family:monospace;font-size:12px" placeholder="Paste image URLs here (one per line)...">${(s.heroImages || []).join('\n')}</textarea>
                  </div>

                  <div id="st-hero-gallery" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">
                    ${(s.heroImages || []).map((imgUrl, idx) => `
                      <div style="position:relative;width:95px;height:75px;border-radius:6px;overflow:hidden;border:1px solid var(--line);background:#fff">
                        <img src="${esc(imgUrl)}" style="width:100%;height:100%;object-fit:cover">
                        <button type="button" class="btn-remove-hero-img" data-idx="${idx}" style="position:absolute;top:3px;right:3px;background:rgba(217,83,79,0.95);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:13px;font-weight:bold;line-height:1;display:flex;align-items:center;justify-content:center" title="Remove image">×</button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Homepage Text Content Editor (Hero & Headlines) -->
            <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
              <h4 style="font-size:16px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
                <i data-lucide="type" style="color:var(--accent);width:18px;height:18px"></i> Homepage Banner &amp; Hero Text
              </h4>
              <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Aap website ke top hero banner ka saara text (headling, subtitle, buttons, badges) yahan se directly change kar sakte hain.</p>
              
              <div class="form-grid" style="background:var(--paper-2);border:1px solid var(--line);padding:18px;border-radius:var(--r);margin-bottom:16px">
                <div class="field">
                  <label for="st-hero-kicker">Top Tagline / Kicker Badge</label>
                  <input id="st-hero-kicker" type="text" value="${esc(s.heroKicker || '// Counter supplies · Pakistan')}" placeholder="// Counter supplies · Pakistan">
                </div>
                <div class="field">
                  <label for="st-hero-chip">Image Discount Badge</label>
                  <input id="st-hero-chip" type="text" value="${esc(s.heroChip || '−19% on rolls')}" placeholder="−19% on rolls">
                </div>
                <div class="field full">
                  <label for="st-hero-title">Main Hero Headline / Title</label>
                  <input id="st-hero-title" type="text" value="${esc(s.heroTitle || 'Thermal rolls, labels & POS gear — delivered to your counter.')}" style="font-size:15px;font-weight:600">
                </div>
                <div class="field full">
                  <label for="st-hero-subtitle">Hero Subtitle / Description</label>
                  <textarea id="st-hero-subtitle" rows="3">${esc(s.heroSubtitle || 'Genuine BPA-free thermal paper, shipping labels and point-of-sale hardware for shops that never stop. Flat Rs. 250 delivery, cash on delivery, nationwide.')}</textarea>
                </div>
                <div class="field full">
                  <label for="st-hero-stats">Trust Points Bar (Separate with ' · ')</label>
                  <input id="st-hero-stats" type="text" value="${esc(s.heroStats || '1,200+ shops supplied · 48h major-city delivery · 4.8 average rating')}" placeholder="Point 1 · Point 2 · Point 3">
                </div>
                <div class="field">
                  <label for="st-hero-btn1">Button 1 (Primary) Text</label>
                  <input id="st-hero-btn1" type="text" value="${esc(s.heroBtn1Text || 'Shop all products')}">
                </div>
                <div class="field">
                  <label for="st-hero-btn2">Button 2 (Secondary) Text</label>
                  <input id="st-hero-btn2" type="text" value="${esc(s.heroBtn2Text || 'Browse categories')}">
                </div>
              </div>
            </div>

            <!-- 4 Trust / USP Cards Editor -->
            <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
              <h4 style="font-size:16px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
                <i data-lucide="award" style="color:var(--accent);width:18px;height:18px"></i> 4 Trust &amp; Feature Cards (USPs)
              </h4>
              <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Homepage ke banner ke neeche jo 4 white boxes aate hain unka text edit karein:</p>
              
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:16px">
                <!-- Card 1 -->
                <div style="background:var(--paper-2);border:1px solid var(--line);padding:14px;border-radius:var(--r)">
                  <b style="font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:.08em">Card 1 (Delivery)</b>
                  <div class="field" style="margin-top:8px">
                    <label style="font-size:11px">Title</label>
                    <input id="st-usp1-title" type="text" value="${esc(s.usp1Title || 'Flat Rs. 250 delivery')}">
                  </div>
                  <div class="field" style="margin-top:6px">
                    <label style="font-size:11px">Subtitle</label>
                    <input id="st-usp1-sub" type="text" value="${esc(s.usp1Sub || 'Anywhere in Pakistan')}">
                  </div>
                </div>

                <!-- Card 2 -->
                <div style="background:var(--paper-2);border:1px solid var(--line);padding:14px;border-radius:var(--r)">
                  <b style="font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:.08em">Card 2 (Payment)</b>
                  <div class="field" style="margin-top:8px">
                    <label style="font-size:11px">Title</label>
                    <input id="st-usp2-title" type="text" value="${esc(s.usp2Title || 'Cash on delivery')}">
                  </div>
                  <div class="field" style="margin-top:6px">
                    <label style="font-size:11px">Subtitle</label>
                    <input id="st-usp2-sub" type="text" value="${esc(s.usp2Sub || 'Pay when it arrives')}">
                  </div>
                </div>

                <!-- Card 3 -->
                <div style="background:var(--paper-2);border:1px solid var(--line);padding:14px;border-radius:var(--r)">
                  <b style="font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:.08em">Card 3 (Quality)</b>
                  <div class="field" style="margin-top:8px">
                    <label style="font-size:11px">Title</label>
                    <input id="st-usp3-title" type="text" value="${esc(s.usp3Title || 'Genuine stock')}">
                  </div>
                  <div class="field" style="margin-top:6px">
                    <label style="font-size:11px">Subtitle</label>
                    <input id="st-usp3-sub" type="text" value="${esc(s.usp3Sub || 'BPA-free thermal paper')}">
                  </div>
                </div>

                <!-- Card 4 -->
                <div style="background:var(--paper-2);border:1px solid var(--line);padding:14px;border-radius:var(--r)">
                  <b style="font-size:12px;color:var(--accent);text-transform:uppercase;letter-spacing:.08em">Card 4 (Contact)</b>
                  <div class="field" style="margin-top:8px">
                    <label style="font-size:11px">Title</label>
                    <input id="st-usp4-title" type="text" value="${esc(s.usp4Title || 'WhatsApp ordering')}">
                  </div>
                  <div class="field" style="margin-top:6px">
                    <label style="font-size:11px">Subtitle</label>
                    <input id="st-usp4-sub" type="text" value="${esc(s.usp4Sub || '0308 9134302')}">
                  </div>
                </div>
              </div>
            </div>

            <!-- Special Offer / Promotional Deal Banner Settings -->
            <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
              <h4 style="font-size:16px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
                <i data-lucide="tag" style="color:var(--accent);width:18px;height:18px"></i> Promotional Deal Banner &amp; Image
              </h4>
              <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Homepage ke darmiyan mein jo 'Stock-up deal' wala banner hai, uski picture aur text yahan se change karein.</p>
              
              <div style="background:var(--paper-2);border:1px solid var(--line);padding:18px;border-radius:var(--r);margin-bottom:16px">
                <!-- Deal Image Upload & Preview -->
                <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px">
                  <div style="width:200px;height:120px;border-radius:var(--r);overflow:hidden;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <img id="st-deal-preview" src="${esc(s.dealImage || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=880&auto=format&fit=crop&q=80')}" alt="Deal Preview" style="width:100%;height:100%;object-fit:cover">
                  </div>
                  <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px">
                    <div class="field">
                      <label for="st-deal-img">Deal Banner Image URL</label>
                      <input id="st-deal-img" type="text" value="${esc(s.dealImage || 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=880&auto=format&fit=crop&q=80')}" placeholder="Paste image URL or upload below" style="background:#fff">
                    </div>
                    <label class="upload-dropzone" style="padding:10px;cursor:pointer;background:#fff">
                      <input type="file" id="st-deal-file-upload" accept="image/*" style="display:none">
                      <i data-lucide="upload-cloud" style="width:20px;height:20px;color:var(--accent);margin:0 auto 2px"></i>
                      <div style="font-weight:600;font-size:12px">Upload Deal Banner Picture from PC</div>
                      <small style="color:var(--muted);font-size:10px">PNG, JPG, WEBP up to 5MB</small>
                    </label>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="field">
                    <label for="st-deal-kicker">Top Kicker Label</label>
                    <input id="st-deal-kicker" type="text" value="${esc(s.dealKicker || 'Special Mega Offer · 2026')}" placeholder="e.g. Special Mega Offer · 2026">
                  </div>
                  <div class="field">
                    <label for="st-deal-tag">Discount Tag on Picture</label>
                    <input id="st-deal-tag" type="text" value="${esc(s.dealTag || 'Up to 50% Off')}" placeholder="e.g. Up to 50% Off">
                  </div>
                  <div class="field full">
                    <label for="st-deal-title">Deal Main Headline</label>
                    <input id="st-deal-title" type="text" value="${esc(s.dealTitle || 'Hot Selling Gadgets & Essentials')}" style="font-size:15px;font-weight:600">
                  </div>
                  <div class="field full">
                    <label for="st-deal-subtitle">Deal Description</label>
                    <textarea id="st-deal-subtitle" rows="2">${esc(s.dealSubtitle || 'Shop our top trending Mini Thermal Printers, USB Rechargeable Fans & Party Straws at discounted prices with Cash on Delivery nationwide!')}</textarea>
                  </div>
                  <div class="field">
                    <label for="st-deal-btn-text">Button Text</label>
                    <input id="st-deal-btn-text" type="text" value="${esc(s.dealBtnText || 'Explore All Products')}">
                  </div>
                  <div class="field">
                    <label for="st-deal-btn-href">Button Target Link</label>
                    <input id="st-deal-btn-href" type="text" value="${esc(s.dealBtnHref || '#/shop')}" placeholder="#/shop or #/category/slug">
                  </div>
                </div>
              </div>
            </div>

            <!-- Color Theme Settings -->
            <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
              <h4 style="font-size:15px;margin-bottom:12px">Brand Theme Colors</h4>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
                <div class="field">
                  <label>Primary Accent Color</label>
                  <div class="color-picker-group">
                    <input type="color" id="st-col-accent" class="color-picker-input" value="${s.primaryColor || '#D14A0E'}">
                    <input type="text" id="st-col-accent-txt" value="${s.primaryColor || '#D14A0E'}" style="font-family:var(--fm)">
                  </div>
                </div>
                <div class="field">
                  <label>Secondary / Dark Color</label>
                  <div class="color-picker-group">
                    <input type="color" id="st-col-secondary" class="color-picker-input" value="${s.secondaryColor || '#221B10'}">
                    <input type="text" id="st-col-secondary-txt" value="${s.secondaryColor || '#221B10'}" style="font-family:var(--fm)">
                  </div>
                </div>
              </div>
            </div>

            <div class="field full" style="border-top:1px solid var(--line);padding-top:18px;margin-top:10px">
              <label for="st-footer">Footer Brand Description</label>
              <textarea id="st-footer" rows="2">${esc(s.footerAboutText || '')}</textarea>
            </div>
          </div>

          <button class="btn btn-accent btn-lg" type="submit" id="btn-save-settings" style="margin-top:24px">
            <i data-lucide="check"></i> Save Website Settings &amp; Content
          </button>
        </form>
      </div>

      <!-- Admin Account & Security Card (Change Email / Password) -->
      <div class="admin-card" style="padding:30px">
        <h3 style="font-size:18px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <i data-lucide="shield-check" style="color:var(--accent)"></i> Admin Account &amp; Password
        </h3>
        <p style="color:var(--muted);font-size:13px;margin-bottom:20px">Update your admin login email, display name, and password anytime.</p>

        <form id="admin-security-form" novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="adm-set-name">Admin Name</label>
              <input id="adm-set-name" type="text" value="${esc(currentAdmin.name || 'Store Admin')}" required>
            </div>
            <div class="field">
              <label for="adm-set-email">Admin Login Email</label>
              <input id="adm-set-email" type="email" value="${esc(currentAdmin.email || 'admin@rollpoint.pk')}" required>
            </div>
            <div class="field">
              <label for="adm-set-currpass">Current Password <span style="color:var(--accent)">*</span></label>
              <input id="adm-set-currpass" type="password" placeholder="Enter current password to verify" required autocomplete="current-password">
              <span class="muted" style="font-size:11px;margin-top:4px">Required to make changes</span>
            </div>
            <div class="field">
              <label for="adm-set-newpass">New Password (Leave blank to keep same)</label>
              <input id="adm-set-newpass" type="password" placeholder="Enter new password (min 6 chars)" autocomplete="new-password">
            </div>
          </div>

          <button class="btn btn-ink btn-lg" type="submit" id="btn-save-admin-sec" style="margin-top:24px">
            <i data-lucide="lock"></i> Update Admin Credentials
          </button>
        </form>
      </div>
    </div>`;

    // Sync color picker inputs with text inputs
    const syncColor = (colorId, textId) => {
      const c = document.getElementById(colorId);
      const t = document.getElementById(textId);
      c.addEventListener('input', () => t.value = c.value);
      t.addEventListener('input', () => { if (/^#[0-9A-Fa-f]{6}$/.test(t.value)) c.value = t.value; });
    };
    syncColor('st-col-accent', 'st-col-accent-txt');
    syncColor('st-col-secondary', 'st-col-secondary-txt');

    // Hero image preview & file upload listener
    const heroImgInput = document.getElementById('st-hero-img');
    const heroPreview = document.getElementById('st-hero-preview');
    if (heroImgInput && heroPreview) {
      heroImgInput.addEventListener('input', () => {
        const val = heroImgInput.value.trim();
        if (val) heroPreview.src = val;
      });
    }

    const heroFileUpload = document.getElementById('st-hero-file-upload');
    if (heroFileUpload && heroImgInput && heroPreview) {
      heroFileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          UI.toast('Uploading hero image…');
          const res = await Api.adminUploadImage(file);
          if (res.ok && res.url) {
            heroImgInput.value = res.url;
            heroPreview.src = res.url;
            UI.toast('Image uploaded! Click "Save Website Settings" below to apply.', 'check-circle-2', 'success');
          }
        } catch (err) {
          UI.toast(err.message || 'Upload failed', 'alert-circle', 'error');
        }
      });
    }

    // Hero Multi-Image Upload Handler
    const heroMultiUpload = document.getElementById('st-hero-multi-file-upload');
    const heroImagesTxt = document.getElementById('st-hero-images-txt');
    const heroGallery = document.getElementById('st-hero-gallery');

    function renderHeroGallery(urls) {
      if (!heroGallery) return;
      heroGallery.innerHTML = urls.map((url, idx) => `
        <div style="position:relative;width:95px;height:75px;border-radius:6px;overflow:hidden;border:1px solid var(--line);background:#fff">
          <img src="${esc(url)}" style="width:100%;height:100%;object-fit:cover">
          <button type="button" class="btn-remove-hero-img" data-idx="${idx}" style="position:absolute;top:3px;right:3px;background:rgba(217,83,79,0.95);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:13px;font-weight:bold;line-height:1;display:flex;align-items:center;justify-content:center" title="Remove image">×</button>
        </div>
      `).join('');
    }

    if (heroMultiUpload && heroImagesTxt) {
      heroMultiUpload.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        try {
          UI.toast(`Uploading ${files.length} slider images…`);
          const res = await Api.adminUploadMultipleImages(files);
          if (res.ok && res.urls && res.urls.length) {
            const existing = heroImagesTxt.value.split('\n').map(u => u.trim()).filter(Boolean);
            const combined = [...existing, ...res.urls];
            heroImagesTxt.value = combined.join('\n');
            renderHeroGallery(combined);

            if (heroImgInput && (!heroImgInput.value || heroImgInput.value.includes('picsum'))) {
              heroImgInput.value = res.urls[0];
              if (heroPreview) heroPreview.src = res.urls[0];
            }

            UI.toast(`${res.urls.length} images added to Hero Slider! Click "Save Website Settings" to apply.`, 'check-circle-2', 'success');
          }
        } catch (err) {
          UI.toast(err.message || 'Multiple upload failed', 'alert-circle', 'error');
        }
      });

      heroImagesTxt.addEventListener('input', () => {
        const urls = heroImagesTxt.value.split('\n').map(u => u.trim()).filter(Boolean);
        renderHeroGallery(urls);
      });

      if (heroGallery) {
        heroGallery.addEventListener('click', (e) => {
          const btn = e.target.closest('.btn-remove-hero-img');
          if (!btn) return;
          const idx = parseInt(btn.dataset.idx, 10);
          const urls = heroImagesTxt.value.split('\n').map(u => u.trim()).filter(Boolean);
          urls.splice(idx, 1);
          heroImagesTxt.value = urls.join('\n');
          renderHeroGallery(urls);
        });
      }
    }

    // Deal image preview & file upload listener
    const dealImgInput = document.getElementById('st-deal-img');
    const dealPreview = document.getElementById('st-deal-preview');
    if (dealImgInput && dealPreview) {
      dealImgInput.addEventListener('input', () => {
        const val = dealImgInput.value.trim();
        if (val) dealPreview.src = val;
      });
    }

    const dealFileUpload = document.getElementById('st-deal-file-upload');
    if (dealFileUpload && dealImgInput && dealPreview) {
      dealFileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          UI.toast('Uploading deal banner image…');
          const res = await Api.adminUploadImage(file);
          if (res.ok && res.url) {
            dealImgInput.value = res.url;
            dealPreview.src = res.url;
            UI.toast('Deal image uploaded! Click "Save Website Settings" below to apply.', 'check-circle-2', 'success');
          }
        } catch (err) {
          UI.toast(err.message || 'Upload failed', 'alert-circle', 'error');
        }
      });
    }

    // "Use Product's Image" quick button helper
    const btnUseProdImg = document.getElementById('btn-use-prod-img');
    const heroProductSelect = document.getElementById('st-hero-product');
    if (btnUseProdImg && heroProductSelect && heroImgInput && heroPreview) {
      btnUseProdImg.addEventListener('click', () => {
        const selectedSlug = heroProductSelect.value;
        if (!selectedSlug) {
          UI.toast('Please select a product from the dropdown first.', 'alert-circle', 'error');
          return;
        }
        const prod = allProducts.find(p => p.slug === selectedSlug);
        if (prod && prod.images && prod.images.length > 0) {
          heroImgInput.value = prod.images[0];
          heroPreview.src = prod.images[0];
          UI.toast(`Applied image for ${prod.name}! Click Save to apply.`, 'sparkles', 'success');
        } else {
          UI.toast('Selected product has no images.', 'alert-circle', 'error');
        }
      });
    }

    // Website Settings form handler
    document.getElementById('site-settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-settings');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Saving Settings…';

      const payload = {
        websiteName: document.getElementById('st-name').value.trim(),
        tagline: document.getElementById('st-tagline').value.trim(),
        whatsappNumber: document.getElementById('st-wa-local').value.trim(),
        whatsappIntl: document.getElementById('st-wa-intl').value.trim(),
        contactEmail: document.getElementById('st-email').value.trim(),
        shippingRate: parseInt(document.getElementById('st-shipping').value, 10) || 250,
        contactAddress: document.getElementById('st-address').value.trim(),
        googleMapsUrl: document.getElementById('st-maps-url') ? document.getElementById('st-maps-url').value.trim() : '',
        contactHours: document.getElementById('st-hours').value.trim(),
        heroKicker: document.getElementById('st-hero-kicker').value.trim(),
        heroTitle: document.getElementById('st-hero-title').value.trim(),
        heroSubtitle: document.getElementById('st-hero-subtitle').value.trim(),
        heroStats: document.getElementById('st-hero-stats').value.trim(),
        heroChip: document.getElementById('st-hero-chip').value.trim(),
        heroBtn1Text: document.getElementById('st-hero-btn1').value.trim(),
        heroBtn2Text: document.getElementById('st-hero-btn2').value.trim(),
        heroImage: document.getElementById('st-hero-img').value.trim(),
        heroImages: document.getElementById('st-hero-images-txt')
          ? document.getElementById('st-hero-images-txt').value.split('\n').map(u => u.trim()).filter(Boolean)
          : [],
        heroInterval: document.getElementById('st-hero-interval')
          ? parseInt(document.getElementById('st-hero-interval').value, 10) || 3
          : 3,
        heroProductSlug: document.getElementById('st-hero-product').value.trim(),
        usp1Title: document.getElementById('st-usp1-title').value.trim(),
        usp1Sub: document.getElementById('st-usp1-sub').value.trim(),
        usp2Title: document.getElementById('st-usp2-title').value.trim(),
        usp2Sub: document.getElementById('st-usp2-sub').value.trim(),
        usp3Title: document.getElementById('st-usp3-title').value.trim(),
        usp3Sub: document.getElementById('st-usp3-sub').value.trim(),
        usp4Title: document.getElementById('st-usp4-title').value.trim(),
        usp4Sub: document.getElementById('st-usp4-sub').value.trim(),
        dealKicker: document.getElementById('st-deal-kicker') ? document.getElementById('st-deal-kicker').value.trim() : 'Special Mega Offer · 2026',
        dealTitle: document.getElementById('st-deal-title') ? document.getElementById('st-deal-title').value.trim() : 'Hot Selling Gadgets & Essentials',
        dealSubtitle: document.getElementById('st-deal-subtitle') ? document.getElementById('st-deal-subtitle').value.trim() : '',
        dealImage: document.getElementById('st-deal-img') ? document.getElementById('st-deal-img').value.trim() : '',
        dealTag: document.getElementById('st-deal-tag') ? document.getElementById('st-deal-tag').value.trim() : '',
        dealBtnText: document.getElementById('st-deal-btn-text') ? document.getElementById('st-deal-btn-text').value.trim() : 'Explore All Products',
        dealBtnHref: document.getElementById('st-deal-btn-href') ? document.getElementById('st-deal-btn-href').value.trim() : '#/shop',
        primaryColor: document.getElementById('st-col-accent-txt').value.trim(),
        secondaryColor: document.getElementById('st-col-secondary-txt').value.trim(),
        footerAboutText: document.getElementById('st-footer').value.trim()
      };

      try {
        await Api.adminUpdateSettings(payload);
        // Apply changes directly to CSS variables & BUSINESS
        document.documentElement.style.setProperty('--accent', payload.primaryColor);
        document.documentElement.style.setProperty('--ink', payload.secondaryColor);
        BUSINESS = { ...BUSINESS, ...payload };

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="check"></i> Save Website Settings & Content';
        refreshIcons(saveBtn);
        UI.toast('All content & text settings saved live to MongoDB!', 'check-circle-2', 'success');
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="check"></i> Save Website Settings & Content';
        refreshIcons(saveBtn);
        UI.toast(err.message || 'Failed to save settings', 'alert-circle', 'error');
      }
    });

    // Admin Security / Profile update handler
    document.getElementById('admin-security-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const secBtn = document.getElementById('btn-save-admin-sec');
      const name = document.getElementById('adm-set-name').value.trim();
      const email = document.getElementById('adm-set-email').value.trim();
      const currentPassword = document.getElementById('adm-set-currpass').value.trim();
      const newPassword = document.getElementById('adm-set-newpass').value.trim();

      if (!currentPassword) {
        UI.toast('Please enter your current password to confirm.', 'alert-circle', 'error');
        return;
      }

      if (newPassword && newPassword.length < 6) {
        UI.toast('New password must be at least 6 characters long.', 'alert-circle', 'error');
        return;
      }

      secBtn.disabled = true;
      secBtn.innerHTML = '<span class="spinner"></span> Updating Credentials…';

      try {
        const payload = { name, email, currentPassword };
        if (newPassword) payload.newPassword = newPassword;

        const res = await Api.adminUpdateProfile(payload);
        secBtn.disabled = false;
        secBtn.innerHTML = '<i data-lucide="lock"></i> Update Admin Credentials';
        refreshIcons(secBtn);

        // Clear password fields
        document.getElementById('adm-set-currpass').value = '';
        document.getElementById('adm-set-newpass').value = '';

        // Update sidebar user info if exists
        const userInfoEl = document.querySelector('.admin-user-info');
        if (userInfoEl && res.admin) {
          userInfoEl.innerHTML = `<b>${esc(res.admin.name || res.admin.email)}</b><span>${esc(res.admin.email)}</span>`;
        }

        UI.toast(res.message || 'Admin credentials updated successfully!', 'check-circle-2', 'success');
      } catch (err) {
        secBtn.disabled = false;
        secBtn.innerHTML = '<i data-lucide="lock"></i> Update Admin Credentials';
        refreshIcons(secBtn);
        UI.toast(err.message || 'Failed to update credentials', 'alert-circle', 'error');
      }
    });
  }
};
