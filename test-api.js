/**
 * RollPoint E-Commerce API End-to-End Verification Test Script
 */
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { ...(options.headers || {}) };
    let payload = null;

    if (options.body) {
      if (typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(options.body);
      } else {
        payload = String(options.body);
      }
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const reqOptions = {
      method: options.method || 'GET',
      headers,
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting RollPoint Full-Stack Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Server health check returns online');

    // 2. Settings check
    const settingsRes = await request('/api/settings');
    assert(settingsRes.status === 200 && settingsRes.data.settings.websiteName, 'Website settings fetched successfully');

    // 3. Categories check
    const catsRes = await request('/api/products/categories');
    assert(catsRes.status === 200 && Array.isArray(catsRes.data.categories) && catsRes.data.categories.length > 0, 'Categories loaded with counts');

    // 4. Products check
    const prodsRes = await request('/api/products');
    assert(prodsRes.status === 200 && Array.isArray(prodsRes.data.products) && prodsRes.data.products.length > 0, `Products loaded (${prodsRes.data.products.length} products found)`);

    // 5. Single Product PDP
    const firstSlug = prodsRes.data.products[0].slug;
    const singleProdRes = await request(`/api/products/${firstSlug}`);
    assert(singleProdRes.status === 200 && singleProdRes.data.product.slug === firstSlug, `Single PDP loaded for '${firstSlug}'`);

    // 6. Admin Login
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@rollpoint.pk',
        password: 'admin123'
      }
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Admin login succeeds with JWT token');
    const adminToken = loginRes.data.token;
    const authHeaders = { 'Authorization': `Bearer ${adminToken}` };

    // 7. Admin Stats
    const statsRes = await request('/api/auth/stats', { headers: authHeaders });
    assert(statsRes.status === 200 && statsRes.data.stats.totalProducts > 0, 'Admin stats endpoint verified');

    // 8. Order Placement Flow
    const testOrderPayload = {
      productId: prodsRes.data.products[0].id,
      quantity: 2,
      customerName: 'Muhammad Ali',
      customerPhone: '03001234567',
      customerEmail: 'ali@example.com',
      customerAddress: 'House 42, Street 7, Sector F-8/2',
      customerCity: 'Islamabad',
      customerNotes: 'Please ring the bell twice'
    };

    const orderRes = await request('/api/orders', {
      method: 'POST',
      body: testOrderPayload
    });

    assert(orderRes.status === 201 && orderRes.data.orderId.startsWith('ORD-'), `Order created with unique Order ID: ${orderRes.data?.orderId}`);
    assert(orderRes.data.whatsappUrl && orderRes.data.whatsappUrl.includes('03089134302') || orderRes.data.whatsappUrl.includes('923089134302'), 'WhatsApp URL generated targeting 03089134302');
    assert(orderRes.data.order.shipping === 250, 'Shipping calculated as fixed Rs. 250');
    assert(orderRes.data.order.grandTotal === (prodsRes.data.products[0].price * 2) + 250, 'Grand total correctly computed as (Price x Qty) + 250');

    // 9. Admin Order Status Update
    const createdOrderId = orderRes.data.orderId;
    const updateOrderRes = await request(`/api/orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'Confirmed' }
    });
    assert(updateOrderRes.status === 200 && updateOrderRes.data.order.orderStatus === 'Confirmed', `Admin updated order status to 'Confirmed'`);

    // 10. Review Submission & Moderation
    const reviewRes = await request('/api/reviews', {
      method: 'POST',
      body: {
        slug: firstSlug,
        name: 'Zahid Khan',
        rating: 5,
        text: 'Top notch thermal rolls, crisp dark prints on our cash registers!'
      }
    });
    assert(reviewRes.status === 201 && reviewRes.data.review.status === 'pending', 'Customer review submitted with pending status');

    const createdReviewId = reviewRes.data.review.id;
    const approveReviewRes = await request(`/api/reviews/${createdReviewId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'approved' }
    });
    assert(approveReviewRes.status === 200 && approveReviewRes.data.review.status === 'approved', 'Admin approved review and triggered product rating update');

    // 11. Admin Settings Update
    const updateSettingsRes = await request('/api/settings', {
      method: 'PUT',
      headers: authHeaders,
      body: {
        websiteName: 'RollPoint',
        tagline: 'Counter supplies, delivered.',
        whatsappNumber: '0308 9134302',
        whatsappIntl: '923089134302',
        shippingRate: 250
      }
    });
    assert(updateSettingsRes.status === 200 && updateSettingsRes.data.settings.websiteName === 'RollPoint', 'Admin updated website settings');

    // 12. Admin Category Creation
    const testCatSlug = `test-cat-${Date.now()}`;
    const testCatName = `Test Scanners ${Date.now()}`;
    const createCatRes = await request('/api/products/categories', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: testCatName,
        slug: testCatSlug,
        tagline: 'Wireless scanners for counters'
      }
    });
    assert(createCatRes.status === 201 && createCatRes.data.category.slug === testCatSlug, 'Admin created new category');

    // 13. Admin Product in New Category
    const createProdInCatRes = await request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Test Scanner Unit',
        price: 4500,
        category: testCatSlug,
        stock: 5
      }
    });
    assert(createProdInCatRes.status === 201 && createProdInCatRes.data.product.category === testCatSlug, 'Product created in new category');
    const testProdId = createProdInCatRes.data.product.id;

    // 14. Admin Delete Category with Shift Option
    const shiftDelCatRes = await request(`/api/products/categories/${testCatSlug}`, {
      method: 'DELETE',
      headers: authHeaders,
      body: {
        action: 'shift',
        targetCategorySlug: 'other-products'
      }
    });
    assert(shiftDelCatRes.status === 200 && shiftDelCatRes.data.ok === true, 'Admin deleted category with product shift option');

    // 15. Verify Product Shifted
    const verifyShiftProdRes = await request(`/api/products/id/${testProdId}`);
    assert(verifyShiftProdRes.status === 200 && verifyShiftProdRes.data.product.category === 'other-products', 'Product category successfully updated to destination category');

    // Cleanup test product
    await request(`/api/products/${testProdId}`, { method: 'DELETE', headers: authHeaders });

    // 16. Admin Delete Category with Permanent Product Deletion Option
    const testCatSlug2 = `test-cat-del-${Date.now()}`;
    await request('/api/products/categories', {
      method: 'POST',
      headers: authHeaders,
      body: { name: `Test Delete Category ${Date.now()}`, slug: testCatSlug2 }
    });
    const createProd2 = await request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'Product to be deleted', price: 100, category: testCatSlug2, stock: 1 }
    });
    const prod2Id = createProd2.data.product.id;

    const permDelRes = await request(`/api/products/categories/${testCatSlug2}`, {
      method: 'DELETE',
      headers: authHeaders,
      body: { action: 'delete' }
    });
    assert(permDelRes.status === 200 && permDelRes.data.ok === true, 'Admin deleted category with permanent product deletion option');

    const verifyDeletedProd = await request(`/api/products/id/${prod2Id}`);
    assert(verifyDeletedProd.status === 404, 'Product was permanently deleted along with category');

    console.log(`\n=====================================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log(`=====================================================\n`);

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

// Give server 1 second to be ready if called directly
setTimeout(runTests, 1200);
