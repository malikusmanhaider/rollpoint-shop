/* ================================================================
   ROLLPOINT — ADMIN CONTROLLER & UI
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
        <p>Access the RollPoint management system for products, orders, and website settings.</p>
        
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
          UI.toast('Welcome to RollPoint Admin Dashboard', 'check-circle-2', 'success');
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
            <i data-lucide="layers"></i> Categories
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
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
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

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    tabEl.innerHTML = `<div style="text-align:center;padding:80px 20px;min-height:65vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px"><span class="spinner" style="border-top-color:var(--accent);width:32px;height:32px"></span><span style="font-size:13px;color:var(--muted)">Loading section…</span></div>`;

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
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
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

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Dashboard Overview</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Real-time statistics across products, orders, and reviews.</p>
      </div>
      <div class="admin-header-actions">
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
      <div class="stat-card gold">
        <div class="stat-label"><span>Pending Orders</span><i data-lucide="clock"></i></div>
        <div class="stat-value">${stats.pendingOrders}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label"><span>Confirmed Orders</span><i data-lucide="check-circle-2"></i></div>
        <div class="stat-value">${stats.confirmedOrders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><span>Delivered Orders</span><i data-lucide="truck"></i></div>
        <div class="stat-value">${stats.deliveredOrders}</div>
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
        <button class="btn btn-outline btn-sm" id="btn-manage-categories">
          <i data-lucide="layers"></i> Manage Categories
        </button>
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

    document.getElementById('btn-manage-categories')?.addEventListener('click', () => {
      this.currentTab = 'categories';
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelector('[data-tab="categories"]')?.classList.add('active');
      this.loadTabContent();
    });

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
  openProductModal(prod = null) {
    const isEdit = Boolean(prod);
    const modal = document.getElementById('admin-modal-content');
    const overlay = document.getElementById('admin-modal-overlay');

    let imagesList = prod && prod.images ? [...prod.images] : [];
    let specsMap = prod && prod.specifications ? (prod.specifications instanceof Map ? Object.fromEntries(prod.specifications) : prod.specifications) : {};

    modal.innerHTML = `
    <div class="admin-modal-header">
      <h3>${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
      <button class="icon-btn" id="modal-close-btn"><i data-lucide="x"></i></button>
    </div>
    <form id="product-edit-form" class="admin-modal-body">
      <div class="form-grid">
        <div class="field full">
          <label for="pm-name">Product Name *</label>
          <input id="pm-name" type="text" required value="${esc(prod?.name || '')}" placeholder="e.g. Thermal Roll 80mm × 80m">
        </div>
        <div class="field">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label for="pm-category" style="margin:0">Category *</label>
            <button type="button" class="btn btn-outline btn-sm" id="btn-quick-add-cat" style="font-size:11.5px;padding:2px 8px;gap:4px">
              <i data-lucide="plus" style="width:12px;height:12px"></i> Add Category
            </button>
          </div>
          <div id="quick-cat-box" style="display:none;background:var(--paper-deep);padding:10px 12px;border-radius:10px;margin-bottom:10px;border:1px solid var(--line-2)">
            <div style="font-weight:600;font-size:12.5px;margin-bottom:6px;color:var(--ink)">Create New Category</div>
            <div style="display:flex;gap:6px">
              <input type="text" id="quick-cat-name-input" placeholder="Category name (e.g. Scanners)" style="flex:1;height:32px;font-size:13px;padding:0 8px;background:var(--surface);border:1px solid var(--line-2);border-radius:6px">
              <button type="button" class="btn btn-accent btn-sm" id="btn-save-quick-cat" style="font-size:12px;height:32px;padding:0 10px">Save</button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-cancel-quick-cat" style="font-size:12px;height:32px;padding:0 8px">Cancel</button>
            </div>
          </div>
          <select id="pm-category" required>
            ${this.categoriesCache.map(c => `
              <option value="${c.slug}" ${prod?.category === c.slug ? 'selected' : ''}>${esc(c.name)}</option>
            `).join('')}
          </select>
        </div>
        <div class="field">
          <label for="pm-slug">Slug <small>(optional, auto-generated if blank)</small></label>
          <input id="pm-slug" type="text" value="${esc(prod?.slug || '')}" placeholder="e.g. thermal-roll-80x80">
        </div>
        <div class="field">
          <label for="pm-price">Price (Rs.) *</label>
          <input id="pm-price" type="number" min="0" required value="${prod?.price || ''}" placeholder="340">
        </div>
        <div class="field">
          <label for="pm-oldprice">Old Price (Rs.) <small>(for discount tag)</small></label>
          <input id="pm-oldprice" type="number" min="0" value="${prod?.oldPrice || ''}" placeholder="420">
        </div>
        <div class="field">
          <label for="pm-stock">Stock Quantity *</label>
          <input id="pm-stock" type="number" min="0" required value="${prod?.stock !== undefined ? prod.stock : 100}">
        </div>
        <div class="field">
          <label for="pm-keywords">Keywords <small>(comma separated)</small></label>
          <input id="pm-keywords" type="text" value="${esc(prod?.keywords?.join(', ') || '')}" placeholder="80mm, receipt roll, bpa free">
        </div>
        <div class="field full">
          <label for="pm-short">Short Description</label>
          <textarea id="pm-short" rows="2" placeholder="Brief 1-2 sentence overview for cards and PDP...">${esc(prod?.shortDescription || '')}</textarea>
        </div>
        <div class="field full">
          <label for="pm-desc">Full Description</label>
          <textarea id="pm-desc" rows="4" placeholder="Detailed product specifications, features, and packing...">${esc(prod?.description || '')}</textarea>
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
          <label>Product Images</label>
          <div style="display:flex;gap:10px;margin-top:6px">
            <input type="text" id="pm-add-image-url" placeholder="Paste image URL (https://...)" style="flex:1">
            <button type="button" class="btn btn-outline btn-sm" id="btn-add-img-url">Add URL</button>
          </div>
          <div style="margin-top:12px">
            <label class="upload-dropzone">
              <input type="file" id="pm-file-upload" accept="image/*" style="display:none">
              <i data-lucide="upload-cloud" style="width:28px;height:28px;color:var(--accent);margin:0 auto 6px"></i>
              <div style="font-weight:600;font-size:14px">Upload image from your computer</div>
              <small style="color:var(--muted)">PNG, JPG, WEBP up to 5MB</small>
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

    // Inline Quick Add Category
    const quickBox = document.getElementById('quick-cat-box');
    const quickInput = document.getElementById('quick-cat-name-input');
    const quickBtn = document.getElementById('btn-quick-add-cat');
    const saveQuickBtn = document.getElementById('btn-save-quick-cat');
    const cancelQuickBtn = document.getElementById('btn-cancel-quick-cat');

    if (quickBtn && quickBox) {
      quickBtn.addEventListener('click', () => {
        quickBox.style.display = quickBox.style.display === 'none' ? 'block' : 'none';
        if (quickBox.style.display === 'block') quickInput?.focus();
      });

      cancelQuickBtn?.addEventListener('click', () => {
        quickBox.style.display = 'none';
        if (quickInput) quickInput.value = '';
      });

      const handleQuickSave = async () => {
        const catName = quickInput?.value.trim();
        if (!catName) {
          UI.toast('Please enter a category name', 'alert-circle', 'error');
          return;
        }
        saveQuickBtn.disabled = true;
        saveQuickBtn.textContent = '…';
        try {
          const res = await Api.adminCreateCategory({ name: catName });
          this.categoriesCache.push(res.category);
          const sel = document.getElementById('pm-category');
          if (sel) {
            const opt = document.createElement('option');
            opt.value = res.category.slug;
            opt.textContent = res.category.name;
            opt.selected = true;
            sel.appendChild(opt);
          }
          quickBox.style.display = 'none';
          if (quickInput) quickInput.value = '';
          UI.toast(`Category "${res.category.name}" added and selected!`, 'check-circle-2', 'success');
        } catch (err) {
          UI.toast(err.message || 'Failed to create category', 'alert-circle', 'error');
        } finally {
          saveQuickBtn.disabled = false;
          saveQuickBtn.textContent = 'Save';
        }
      };

      saveQuickBtn?.addEventListener('click', handleQuickSave);
      quickInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleQuickSave();
        }
      });
    }

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

    // Add image URL
    const renderImagesGrid = () => {
      const grid = document.getElementById('modal-image-grid');
      grid.innerHTML = imagesList.map((src, idx) => `
        <div class="image-thumb-card">
          <img src="${src}" alt="">
          <button type="button" class="img-remove-btn" data-idx="${idx}">×</button>
        </div>
      `).join('');
      grid.querySelectorAll('.img-remove-btn').forEach(b => {
        b.addEventListener('click', () => {
          imagesList.splice(parseInt(b.dataset.idx, 10), 1);
          renderImagesGrid();
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

    // File upload
    document.getElementById('pm-file-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        UI.toast('Uploading image…');
        const res = await Api.adminUploadImage(file);
        if (res.ok && res.url) {
          imagesList.push(res.url);
          renderImagesGrid();
          UI.toast('Image uploaded successfully');
        }
      } catch (err) {
        UI.toast(err.message || 'Upload failed', 'alert-circle', 'error');
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
        featured
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

  closeModal() {
    document.getElementById('admin-modal-overlay').classList.remove('show');
  },

  // -------------------------------------------------------------
  // TAB: Categories Management
  // -------------------------------------------------------------
  async renderTabCategories(container) {
    const [cats, prodsRes] = await Promise.all([
      Api.getCategories({ includeAll: true }),
      Api.adminGetProducts()
    ]);
    this.categoriesCache = cats || [];
    this.productsCache = prodsRes.products || [];

    // Compute live count of products in each category
    const countMap = {};
    this.productsCache.forEach(p => {
      countMap[p.category] = (countMap[p.category] || 0) + 1;
    });
    this.categoriesCache.forEach(c => {
      c.count = countMap[c.slug] || 0;
    });

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Categories Management</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Create categories, monitor product counts, and delete categories with product migration or removal.</p>
      </div>
      <div class="admin-header-actions">
        <button class="btn btn-accent btn-sm" id="btn-add-cat-view">
          <i data-lucide="plus"></i> Add New Category
        </button>
      </div>
    </div>

    <div class="admin-table-wrap">
      <div class="admin-table-header">
        <span style="font-size:14px;font-weight:600">All Categories (<span id="cat-total-count">${this.categoriesCache.length}</span>)</span>
      </div>

      <div id="admin-categories-table-body">
        ${this.renderCategoriesTableHtml(this.categoriesCache)}
      </div>
    </div>`;

    document.getElementById('btn-add-cat-view')?.addEventListener('click', () => this.openAddCategoryModal());
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
          <th>Slug</th>
          <th>Tagline / Description</th>
          <th>Total Products</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${categories.map(c => `
          <tr>
            <td>
              <b style="font-size:14.5px;color:var(--ink)">${esc(c.name)}</b>
            </td>
            <td>
              <span class="mono" style="font-size:12px;background:var(--paper-deep);padding:3px 8px;border-radius:4px">/${esc(c.slug)}</span>
            </td>
            <td>
              <span style="font-size:13px;color:var(--muted)">${esc(c.tagline || '—')}</span>
            </td>
            <td>
              <span style="font-family:var(--fm);font-size:12px;padding:4px 10px;border-radius:999px;background:${c.count > 0 ? 'rgba(209,74,14,0.12)' : 'var(--paper-deep)'};color:${c.count > 0 ? 'var(--accent)' : 'var(--muted)'};font-weight:700">
                ${c.count} ${c.count === 1 ? 'Product' : 'Products'}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <a class="btn-icon-sm" href="#/category/${c.slug}" target="_blank" title="View category on storefront"><i data-lucide="external-link"></i></a>
                <button class="btn-icon-sm danger" data-action="delete-category" data-slug="${c.slug}" data-name="${esc(c.name)}" data-count="${c.count}" title="Delete category"><i data-lucide="trash-2"></i></button>
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

    table.querySelectorAll('[data-action="delete-category"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        const name = btn.dataset.name;
        const count = parseInt(btn.dataset.count, 10) || 0;
        this.openDeleteCategoryModal(slug, name, count);
      });
    });
  },

  openAddCategoryModal(onSuccessCallback = null) {
    const modal = document.getElementById('admin-modal-content');
    const overlay = document.getElementById('admin-modal-overlay');

    modal.innerHTML = `
    <div class="admin-modal-header">
      <h3>Add New Category</h3>
      <button class="icon-btn" id="cat-modal-close-btn"><i data-lucide="x"></i></button>
    </div>
    <form id="category-create-form" class="admin-modal-body">
      <div class="form-grid">
        <div class="field full">
          <label for="cat-name">Category Name *</label>
          <input id="cat-name" type="text" required placeholder="e.g. Barcode Scanners" autofocus>
        </div>
        <div class="field full">
          <label for="cat-slug">Slug <small>(optional, auto-generated from name)</small></label>
          <input id="cat-slug" type="text" placeholder="e.g. barcode-scanners">
        </div>
        <div class="field full">
          <label for="cat-tagline">Tagline / Short description <small>(optional)</small></label>
          <input id="cat-tagline" type="text" placeholder="e.g. 1D &amp; 2D wireless handheld scanners">
        </div>
      </div>
    </form>
    <div class="admin-modal-footer">
      <button class="btn btn-outline" id="cat-modal-cancel-btn">Cancel</button>
      <button class="btn btn-accent" id="btn-save-new-category">
        <i data-lucide="plus"></i> Create Category
      </button>
    </div>`;

    overlay.classList.add('show');
    refreshIcons(modal);

    const close = () => this.closeModal();
    document.getElementById('cat-modal-close-btn').addEventListener('click', close);
    document.getElementById('cat-modal-cancel-btn').addEventListener('click', close);

    const form = document.getElementById('category-create-form');
    const saveBtn = document.getElementById('btn-save-new-category');

    const handleSave = async (e) => {
      e?.preventDefault();
      const name = document.getElementById('cat-name').value.trim();
      const slug = document.getElementById('cat-slug').value.trim();
      const tagline = document.getElementById('cat-tagline').value.trim();

      if (!name) {
        UI.toast('Category name is required', 'alert-circle', 'error');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span> Creating…';

      try {
        const res = await Api.adminCreateCategory({ name, slug, tagline });
        UI.toast(`Category "${res.category.name}" created!`, 'check-circle-2', 'success');
        this.closeModal();

        const updatedCats = await Api.getCategories({ includeAll: true });
        this.categoriesCache = updatedCats || [];

        if (onSuccessCallback) {
          onSuccessCallback(res.category);
        } else if (this.currentTab === 'categories') {
          this.loadTabContent();
        }
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i data-lucide="plus"></i> Create Category';
        refreshIcons(saveBtn);
        UI.toast(err.message || 'Failed to create category', 'alert-circle', 'error');
      }
    };

    form.addEventListener('submit', handleSave);
    saveBtn.addEventListener('click', handleSave);
  },

  openDeleteCategoryModal(slug, name, count) {
    const modal = document.getElementById('admin-modal-content');
    const overlay = document.getElementById('admin-modal-overlay');

    const otherCategories = (this.categoriesCache || []).filter(c => c.slug !== slug);

    if (count === 0) {
      modal.innerHTML = `
      <div class="admin-modal-header">
        <h3>Delete Category</h3>
        <button class="icon-btn" id="del-cat-close-btn"><i data-lucide="x"></i></button>
      </div>
      <div class="admin-modal-body" style="padding:24px 28px">
        <p style="font-size:15px;color:var(--ink);margin-bottom:8px">Are you sure you want to delete category <strong>"${esc(name)}"</strong>?</p>
        <p style="font-size:13.5px;color:var(--muted)">This category currently has 0 products and can be safely deleted.</p>
      </div>
      <div class="admin-modal-footer">
        <button class="btn btn-outline" id="btn-cancel-del-cat">Cancel</button>
        <button class="btn btn-danger" id="btn-confirm-cat-action">
          <i data-lucide="trash-2"></i> Delete Category
        </button>
      </div>`;

      overlay.classList.add('show');
      refreshIcons(modal);

      document.getElementById('del-cat-close-btn').addEventListener('click', () => this.closeModal());
      document.getElementById('btn-cancel-del-cat').addEventListener('click', () => this.closeModal());

      const confirmBtn = document.getElementById('btn-confirm-cat-action');
      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner"></span> Deleting…';
        try {
          const res = await Api.adminDeleteCategory(slug, { action: 'delete' });
          UI.toast(res.message || `Category "${name}" deleted`, 'check-circle-2', 'success');
          this.closeModal();

          const [updatedCats, prodsRes] = await Promise.all([
            Api.getCategories({ includeAll: true }),
            Api.adminGetProducts()
          ]);
          this.categoriesCache = updatedCats || [];
          this.productsCache = prodsRes.products || [];
          this.loadTabContent();
        } catch (err) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<i data-lucide="trash-2"></i> Delete Category';
          refreshIcons(confirmBtn);
          UI.toast(err.message || 'Failed to delete category', 'alert-circle', 'error');
        }
      });
      return;
    }

    // Category HAS products: show option to permanently delete products or shift them
    const canShift = otherCategories.length > 0;
    const defaultAction = canShift ? 'shift' : 'delete';

    modal.innerHTML = `
    <div class="admin-modal-header">
      <h3>Delete Category: ${esc(name)}</h3>
      <button class="icon-btn" id="del-cat-close-btn"><i data-lucide="x"></i></button>
    </div>
    <div class="admin-modal-body" style="padding:22px 26px">
      <div style="background:rgba(209,74,14,0.08);border:1px solid rgba(209,74,14,0.22);border-radius:12px;padding:12px 16px;margin-bottom:18px;display:flex;gap:12px;align-items:flex-start">
        <i data-lucide="alert-triangle" style="width:20px;height:20px;color:var(--accent);flex-shrink:0;margin-top:2px"></i>
        <div style="font-size:13.5px;line-height:1.5">
          Category <strong>"${esc(name)}"</strong> currently contains <strong>${count} product(s)</strong>.
          <br>Please select what should happen to these products:
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        ${canShift ? `
          <label class="cat-delete-option ${defaultAction === 'shift' ? 'active' : ''}" id="opt-shift-card">
            <input type="radio" name="cat-del-action" value="shift" ${defaultAction === 'shift' ? 'checked' : ''}>
            <div>
              <div class="cat-del-title"><i data-lucide="arrow-right-left"></i> Shift Products to Another Category</div>
              <div class="cat-del-desc">Keep all ${count} product(s) safe by moving them into another category before deleting "${esc(name)}".</div>
            </div>
          </label>
        ` : `
          <div style="font-size:13px;color:var(--muted);padding:8px 4px">
            <em>(No other categories exist to shift products into. Create another category first if you want to keep these products.)</em>
          </div>
        `}

        <label class="cat-delete-option ${defaultAction === 'delete' ? 'active' : ''}" id="opt-delete-card">
          <input type="radio" name="cat-del-action" value="delete" ${defaultAction === 'delete' ? 'checked' : ''}>
          <div>
            <div class="cat-del-title danger"><i data-lucide="trash-2"></i> Permanently Delete Products</div>
            <div class="cat-del-desc">Permanently remove all ${count} product(s) and their reviews from your database.</div>
          </div>
        </label>
      </div>

      ${canShift ? `
        <div id="shift-target-container" style="margin-top:16px;background:var(--paper-deep);padding:14px;border-radius:10px;border:1px solid var(--line-2);display:${defaultAction === 'shift' ? 'block' : 'none'}">
          <label for="shift-target-select" style="font-size:13px;font-weight:700;display:block;margin-bottom:6px;color:var(--ink)">
            Select Destination Category for the ${count} product(s):
          </label>
          <select id="shift-target-select" style="width:100%;height:40px;border:1px solid var(--line-2);border-radius:8px;padding:0 12px;font-size:14px;background:var(--surface)">
            ${otherCategories.map(c => `
              <option value="${c.slug}">${esc(c.name)} (${c.count || 0} products)</option>
            `).join('')}
          </select>
        </div>
      ` : ''}
    </div>
    <div class="admin-modal-footer">
      <button class="btn btn-outline" id="btn-cancel-del-cat">Cancel</button>
      <button class="btn ${defaultAction === 'shift' ? 'btn-accent' : 'btn-danger'}" id="btn-confirm-cat-action">
        ${defaultAction === 'shift' 
          ? '<i data-lucide="arrow-right-left"></i> Shift Products &amp; Delete Category'
          : '<i data-lucide="trash-2"></i> Permanently Delete Category &amp; Products'}
      </button>
    </div>`;

    overlay.classList.add('show');
    refreshIcons(modal);

    document.getElementById('del-cat-close-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-cancel-del-cat').addEventListener('click', () => this.closeModal());

    const shiftCard = document.getElementById('opt-shift-card');
    const deleteCard = document.getElementById('opt-delete-card');
    const targetContainer = document.getElementById('shift-target-container');
    const confirmBtn = document.getElementById('btn-confirm-cat-action');

    const updateActionUI = (action) => {
      if (action === 'shift') {
        shiftCard?.classList.add('active');
        deleteCard?.classList.remove('active');
        if (targetContainer) targetContainer.style.display = 'block';
        confirmBtn.className = 'btn btn-accent';
        confirmBtn.innerHTML = '<i data-lucide="arrow-right-left"></i> Shift Products &amp; Delete Category';
      } else {
        shiftCard?.classList.remove('active');
        deleteCard?.classList.add('active');
        if (targetContainer) targetContainer.style.display = 'none';
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.innerHTML = '<i data-lucide="trash-2"></i> Permanently Delete Category &amp; Products';
      }
      refreshIcons(confirmBtn);
    };

    modal.querySelectorAll('input[name="cat-del-action"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateActionUI(e.target.value);
      });
    });

    confirmBtn.addEventListener('click', async () => {
      const selectedRadio = modal.querySelector('input[name="cat-del-action"]:checked');
      const action = selectedRadio ? selectedRadio.value : 'delete';
      let targetCategorySlug = null;

      if (action === 'shift') {
        const targetSelect = document.getElementById('shift-target-select');
        targetCategorySlug = targetSelect ? targetSelect.value : null;
        if (!targetCategorySlug) {
          UI.toast('Please select a destination category to shift products to.', 'alert-circle', 'error');
          return;
        }
      }

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner"></span> Processing…';

      try {
        const res = await Api.adminDeleteCategory(slug, { action, targetCategorySlug });
        UI.toast(res.message || 'Category deleted successfully', 'check-circle-2', 'success');
        this.closeModal();

        const [updatedCats, prodsRes] = await Promise.all([
          Api.getCategories({ includeAll: true }),
          Api.adminGetProducts()
        ]);
        this.categoriesCache = updatedCats || [];
        this.productsCache = prodsRes.products || [];
        this.loadTabContent();
      } catch (err) {
        confirmBtn.disabled = false;
        updateActionUI(action);
        UI.toast(err.message || 'Failed to delete category', 'alert-circle', 'error');
      }
    });
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
            <td>${esc(o.productName)} <span class="mono">× ${o.quantity}</span></td>
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
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>${esc(o.productName)} (× ${o.quantity})</span>
              <span class="mono">${formatPrice(o.productTotal)}</span>
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
    const [s, prodsRes] = await Promise.all([
      Api.getSettings(),
      Api.adminGetProducts().catch(() => Api.getProducts({ limit: 200 }).catch(() => []))
    ]);
    const allProducts = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.products || []);
    const currentAdmin = Api.getAdminUser() || { name: 'Admin', email: 'admin@rollpoint.pk' };

    container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Website Theme &amp; Settings</h1>
        <p style="color:var(--muted);font-size:14px;margin-top:4px">Configure store branding, WhatsApp ordering number, theme colors, shipping rates, and admin login credentials.</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:24px;max-width:820px">
      <!-- Store Settings Card -->
      <div class="admin-card" style="padding:30px">
        <h3 style="font-size:18px;margin-bottom:18px;display:flex;align-items:center;gap:8px">
          <i data-lucide="sliders" style="color:var(--accent)"></i> Store &amp; Brand Settings
        </h3>
        <form id="site-settings-form" novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="st-name">Website / Store Name</label>
              <input id="st-name" type="text" value="${esc(s.websiteName || 'RollPoint')}" required>
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
                        ${esc(p.name)} (${typeof formatPrice === 'function' ? formatPrice(p.price) : 'Rs. ' + p.price})
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
                  <div style="width:160px;height:125px;border-radius:var(--r);overflow:hidden;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <img id="st-hero-preview" src="${esc(s.heroImage || 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg')}" alt="Hero Preview" style="width:100%;height:100%;object-fit:cover">
                  </div>
                  <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px">
                    <div class="field">
                      <label for="st-hero-img">Image URL</label>
                      <input id="st-hero-img" type="text" value="${esc(s.heroImage || 'https://picsum.photos/seed/rp-hero-counter/900/760.jpg')}" placeholder="Paste Image URL or upload below" style="background:#fff">
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                      <label class="upload-dropzone" style="flex:1;padding:10px;cursor:pointer;background:#fff">
                        <input type="file" id="st-hero-file-upload" accept="image/*" style="display:none">
                        <i data-lucide="upload-cloud" style="width:20px;height:20px;color:var(--accent);margin:0 auto 2px"></i>
                        <div style="font-weight:600;font-size:12px">Upload Image from PC</div>
                        <small style="color:var(--muted);font-size:10px">PNG, JPG, WEBP up to 5MB</small>
                      </label>
                      <button type="button" class="btn btn-outline btn-sm" id="btn-use-prod-img" style="align-self:center;height:fit-content;padding:10px 12px;white-space:nowrap" title="Auto-fill image from selected product">
                        <i data-lucide="sparkles"></i> Use Product's Image
                      </button>
                    </div>
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

    // "Use Product's Image" quick button helper
    const btnUseProdImg = document.getElementById('btn-use-prod-img');
    const heroProductSelect = document.getElementById('st-hero-product');
    if (heroProductSelect && heroImgInput && heroPreview) {
      heroProductSelect.addEventListener('change', () => {
        const selectedSlug = heroProductSelect.value;
        if (!selectedSlug) return;
        const prod = allProducts.find(p => p.slug === selectedSlug);
        if (prod && prod.images && prod.images.length > 0) {
          if (!heroImgInput.value || heroImgInput.value.includes('picsum.photos')) {
            heroImgInput.value = prod.images[0];
            heroPreview.src = prod.images[0];
          }
        }
      });
    }

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
        heroProductSlug: document.getElementById('st-hero-product').value.trim(),
        usp1Title: document.getElementById('st-usp1-title').value.trim(),
        usp1Sub: document.getElementById('st-usp1-sub').value.trim(),
        usp2Title: document.getElementById('st-usp2-title').value.trim(),
        usp2Sub: document.getElementById('st-usp2-sub').value.trim(),
        usp3Title: document.getElementById('st-usp3-title').value.trim(),
        usp3Sub: document.getElementById('st-usp3-sub').value.trim(),
        usp4Title: document.getElementById('st-usp4-title').value.trim(),
        usp4Sub: document.getElementById('st-usp4-sub').value.trim(),
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
