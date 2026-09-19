/* ================================================================
   ROLLPOINT — CLIENT API LAYER
   Production HTTP client talking directly to the Node.js / Express API.
   Handles public queries, order submission, reviews moderation,
   and authenticated admin operations.
   ================================================================ */

const Api = {
  baseUrl: '/api',

  // -------------------------------------------------------------
  // Token & Auth State
  // -------------------------------------------------------------
  getToken() {
    return localStorage.getItem('rp_admin_token');
  },
  setToken(token) {
    if (token) localStorage.setItem('rp_admin_token', token);
    else localStorage.removeItem('rp_admin_token');
  },
  getAdminUser() {
    try {
      return JSON.parse(localStorage.getItem('rp_admin_user') || 'null');
    } catch (e) {
      return null;
    }
  },
  setAdminUser(user) {
    if (user) localStorage.setItem('rp_admin_user', JSON.stringify(user));
    else localStorage.removeItem('rp_admin_user');
  },
  logout() {
    this.setToken(null);
    this.setAdminUser(null);
  },

  // -------------------------------------------------------------
  // Internal Fetch Wrapper
  // -------------------------------------------------------------
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({ ok: false, error: 'Malformed server response' }));

      if (!res.ok) {
        if (res.status === 401 && endpoint.includes('admin')) {
          this.logout();
        }
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // -------------------------------------------------------------
  // Public Catalog & Settings
  // -------------------------------------------------------------
  async getSettings() {
    const res = await this.request('/settings');
    return res.settings;
  },

  async getCategories() {
    const res = await this.request('/products/categories');
    return res.categories || [];
  },

  async getProducts(opts = {}) {
    const params = new URLSearchParams();
    if (opts.category) params.append('category', opts.category);
    if (opts.q) params.append('q', opts.q);
    if (opts.inStockOnly) params.append('inStockOnly', 'true');
    if (opts.featuredOnly) params.append('featuredOnly', 'true');
    if (opts.sort) params.append('sort', opts.sort);
    if (opts.limit) params.append('limit', opts.limit);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request(`/products${queryStr}`);
    return res.products || [];
  },

  async getProduct(slug) {
    const res = await this.request(`/products/${encodeURIComponent(slug)}`);
    return res.product;
  },

  async getProductById(id) {
    const res = await this.request(`/products/id/${encodeURIComponent(id)}`);
    return res.product;
  },

  async searchProducts(q, limit = 5) {
    return this.getProducts({ q, limit });
  },

  // -------------------------------------------------------------
  // Customer Order & Review Submissions
  // -------------------------------------------------------------
  async submitOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async submitReview(slug, reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ slug, ...reviewData })
    });
  },

  // -------------------------------------------------------------
  // Admin Authentication & Profile
  // -------------------------------------------------------------
  async adminLogin(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
      this.setAdminUser(res.admin);
    }
    return res;
  },

  async adminGetMe() {
    return this.request('/auth/me');
  },

  async adminUpdateProfile(profileData) {
    const res = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (res.token) {
      this.setToken(res.token);
      this.setAdminUser(res.admin);
    }
    return res;
  },

  async adminChangePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async adminGetStats() {
    return this.request('/auth/stats');
  },

  // -------------------------------------------------------------
  // Admin Products CRUD
  // -------------------------------------------------------------
  async adminGetProducts(opts = {}) {
    const params = new URLSearchParams();
    if (opts.category) params.append('category', opts.category);
    if (opts.search) params.append('search', opts.search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/products/admin/all${queryStr}`);
  },

  async adminCreateProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async adminUpdateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async adminDeleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  async adminTogglePublish(id) {
    return this.request(`/products/${id}/publish`, {
      method: 'PATCH'
    });
  },

  async adminUpdateStock(id, stock) {
    return this.request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock })
    });
  },

  // -------------------------------------------------------------
  // Admin Orders Management
  // -------------------------------------------------------------
  async adminGetOrders(opts = {}) {
    const params = new URLSearchParams();
    if (opts.status) params.append('status', opts.status);
    if (opts.search) params.append('search', opts.search);
    if (opts.page) params.append('page', opts.page);
    if (opts.limit) params.append('limit', opts.limit);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/orders${queryStr}`);
  },

  async adminGetOrder(id) {
    return this.request(`/orders/${id}`);
  },

  async adminUpdateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async adminDeleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE'
    });
  },

  // -------------------------------------------------------------
  // Admin Reviews Moderation
  // -------------------------------------------------------------
  async adminGetReviews(opts = {}) {
    const params = new URLSearchParams();
    if (opts.status) params.append('status', opts.status);
    if (opts.search) params.append('search', opts.search);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/reviews/admin/all${queryStr}`);
  },

  async adminUpdateReviewStatus(id, status) {
    return this.request(`/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async adminDeleteReview(id) {
    return this.request(`/reviews/${id}`, {
      method: 'DELETE'
    });
  },

  // -------------------------------------------------------------
  // Admin Website Settings & Theme
  // -------------------------------------------------------------
  async adminUpdateSettings(settingsData) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  },

  // -------------------------------------------------------------
  // Admin Image Upload
  // -------------------------------------------------------------
  async adminUploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request('/upload', {
      method: 'POST',
      body: formData
    });
  }
};
