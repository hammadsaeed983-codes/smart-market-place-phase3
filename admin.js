// ============================================================
//  MarketX Admin Panel — JavaScript
//  Handles: Auth guard, API calls, Products/Orders/Customers CRUD
// ============================================================

const API_BASE = 'http://localhost:3001/api';

// ─── AUTH GUARD ─────────────────────────────────────────────────────────────
// Run on dashboard page only
if (document.getElementById('adminSidebar')) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
    } else {
        // Verify token with server
        fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(r => r.json())
        .then(data => {
            if (!data.valid) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = 'index.html';
            } else {
                initDashboard();
            }
        })
        .catch(() => {
            // Server offline — show warning but don't redirect
            showToast('⚠️ Server connection failed. Start server.js', 'warning');
            initDashboard();
        });
    }
}

// ─── INIT ────────────────────────────────────────────────────────────────────
function initDashboard() {
    // Show admin user info in sidebar
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const emailEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (emailEl && user.email) {
        emailEl.innerText = user.email;
        if (avatarEl) avatarEl.innerText = user.email[0].toUpperCase();
    }

    // Load initial section data
    loadStats();
    loadRecentOrders();
}

// ─── AUTHENTICATED FETCH ─────────────────────────────────────────────────────
async function authFetch(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        'Authorization': 'Bearer ' + token
    };
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
        logout();
        throw new Error('Unauthorized');
    }
    return res;
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

// ─── SECTION NAVIGATION ──────────────────────────────────────────────────────
let currentSection = 'dashboard';
const sectionTitles = {
    dashboard: 'Dashboard',
    products:  'Products',
    orders:    'Orders',
    customers: 'Customers'
};

function showSection(name) {
    // Hide all sections
    document.querySelectorAll('.section-panel').forEach(s => s.classList.remove('active'));
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show selected
    document.getElementById(`section-${name}`)?.classList.add('active');
    document.getElementById(`nav-${name}`)?.classList.add('active');
    document.getElementById('topbarTitle').innerText = sectionTitles[name] || name;

    currentSection = name;

    // Load data for the section
    if (name === 'dashboard')  { loadStats(); loadRecentOrders(); }
    if (name === 'products')   loadProducts();
    if (name === 'orders')     loadOrders();
    if (name === 'customers')  loadCustomers();
}

// ─── TOAST ──────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '✅'}</span>
        <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount) {
    return '$' + (Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status) {
    const map = {
        Processing: 'badge-processing',
        Shipped:    'badge-shipped',
        Delivered:  'badge-delivered',
        Cancelled:  'badge-cancelled'
    };
    const cls = map[status] || 'badge-processing';
    return `<span class="badge ${cls}">${status}</span>`;
}

// ─── LOAD DASHBOARD STATS ────────────────────────────────────────────────────
async function loadStats() {
    try {
        const res  = await authFetch('/stats');
        const data = await res.json();
        document.getElementById('stat-products').innerText  = data.totalProducts  || 0;
        document.getElementById('stat-orders').innerText    = data.totalOrders    || 0;
        document.getElementById('stat-revenue').innerText   = formatCurrency(data.totalRevenue);
        document.getElementById('stat-customers').innerText = data.totalCustomers || 0;
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            showToast('Could not load stats.', 'error');
        }
    }
}

// ─── RECENT ORDERS (dashboard) ───────────────────────────────────────────────
async function loadRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;
    try {
        const res    = await authFetch('/orders');
        const orders = await res.json();
        const recent = orders.slice(-5).reverse();

        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-loading" style="color:var(--text-muted)">No orders yet.</td></tr>';
            return;
        }

        tbody.innerHTML = recent.map(o => `
            <tr>
                <td><code style="font-size:0.78rem; color:var(--text-muted)">${o.id}</code></td>
                <td class="name-col">${o.customerName}</td>
                <td class="price-col">${formatCurrency(o.total)}</td>
                <td>${statusBadge(o.status)}</td>
                <td>${formatDate(o.createdAt)}</td>
            </tr>
        `).join('');
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            tbody.innerHTML = '<tr><td colspan="5" class="table-loading" style="color:var(--danger)">Failed to load orders.</td></tr>';
        }
    }
}

// ════════════════════════════════════════════════════════════
//  PRODUCTS CRUD
// ════════════════════════════════════════════════════════════

let productsCache = [];

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading products...</td></tr>';
    try {
        const res      = await authFetch('/products');
        const products = await res.json();
        productsCache  = products;

        const countEl = document.getElementById('productCount');
        if (countEl) countEl.innerText = `(${products.length})`;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6">
                    <div class="table-empty">
                        <div class="table-empty-icon">📦</div>
                        <p>No products yet. Add your first product!</p>
                    </div>
                </td></tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    <img
                        src="${p.image || 'https://placehold.co/44x44?text=P'}"
                        alt="${p.name}"
                        class="table-image"
                        onerror="this.src='https://placehold.co/44x44?text=No+Img'"
                    >
                </td>
                <td class="name-col">${p.name}</td>
                <td><span class="badge" style="background:rgba(56,189,248,0.1); color:var(--accent); border:1px solid rgba(56,189,248,0.2);">${p.category}</span></td>
                <td class="price-col">${formatCurrency(p.price)}</td>
                <td style="color:${p.stock > 10 ? 'var(--success)' : p.stock > 0 ? 'var(--warning)' : 'var(--danger)'}">${p.stock}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" onclick="openEditProductModal('${p.id}')">✏️ Edit</button>
                        <button class="btn-delete" onclick="confirmDeleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')">🗑️ Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            tbody.innerHTML = '<tr><td colspan="6" class="table-loading" style="color:var(--danger)">Failed to load products.</td></tr>';
        }
    }
}

// Open Add Product Modal
function openAddProductModal() {
    document.getElementById('productModalTitle').innerText = '✨ Add New Product';
    document.getElementById('productModalId').value  = '';
    document.getElementById('pName').value           = '';
    document.getElementById('pPrice').value          = '';
    document.getElementById('pStock').value          = '';
    document.getElementById('pCategory').value       = 'Phones';
    document.getElementById('pImage').value          = '';
    document.getElementById('pDescription').value    = '';
    document.getElementById('productSaveBtn').innerText = '💾 Add Product';
    document.getElementById('productModal').classList.add('open');
}

// Open Edit Product Modal
function openEditProductModal(productId) {
    const p = productsCache.find(x => x.id === productId);
    if (!p) { showToast('Product not found in cache.', 'error'); return; }

    document.getElementById('productModalTitle').innerText = '✏️ Edit Product';
    document.getElementById('productModalId').value  = p.id;
    document.getElementById('pName').value           = p.name;
    document.getElementById('pPrice').value          = p.price;
    document.getElementById('pStock').value          = p.stock;
    document.getElementById('pCategory').value       = p.category;
    document.getElementById('pImage').value          = p.image || '';
    document.getElementById('pDescription').value    = p.description || '';
    document.getElementById('productSaveBtn').innerText = '💾 Save Changes';
    document.getElementById('productModal').classList.add('open');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
}

// Save (Add or Update) Product
async function saveProduct() {
    const id   = document.getElementById('productModalId').value;
    const name = document.getElementById('pName').value.trim();
    const price = document.getElementById('pPrice').value;
    const stock = document.getElementById('pStock').value;
    const category    = document.getElementById('pCategory').value;
    const image       = document.getElementById('pImage').value.trim();
    const description = document.getElementById('pDescription').value.trim();

    if (!name || !price || !category) {
        showToast('Name, price, and category are required.', 'error');
        return;
    }

    const saveBtn = document.getElementById('productSaveBtn');
    saveBtn.disabled  = true;
    saveBtn.innerText = 'Saving...';

    const body = { name, price, stock, category, image, description };

    try {
        let res;
        if (id) {
            res = await authFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        } else {
            res = await authFetch('/products', { method: 'POST', body: JSON.stringify(body) });
        }

        const data = await res.json();
        if (res.ok) {
            showToast(id ? 'Product updated successfully!' : 'Product added successfully!');
            closeProductModal();
            loadProducts();
            loadStats();
        } else {
            showToast(data.error || 'Failed to save product.', 'error');
        }
    } catch (err) {
        if (err.message !== 'Unauthorized') showToast('Server error.', 'error');
    } finally {
        saveBtn.disabled  = false;
        saveBtn.innerText = '💾 Save Product';
    }
}

// Delete Product — confirm dialog
let pendingDeleteFn = null;

function confirmDeleteProduct(productId, productName) {
    document.getElementById('confirmTitle').innerText = `Delete "${productName}"?`;
    document.getElementById('confirmMsg').innerText   = 'This product will be permanently removed. This action cannot be undone.';
    const okBtn = document.getElementById('confirmOkBtn');
    okBtn.onclick = () => deleteProduct(productId);
    document.getElementById('confirmModal').classList.add('open');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open');
}

async function deleteProduct(productId) {
    closeConfirmModal();
    try {
        const res  = await authFetch(`/products/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            showToast(`"${data.product.name}" deleted.`);
            loadProducts();
            loadStats();
        } else {
            showToast(data.error || 'Delete failed.', 'error');
        }
    } catch (err) {
        if (err.message !== 'Unauthorized') showToast('Server error.', 'error');
    }
}

// ════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════

async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Loading orders...</td></tr>';
    try {
        const res    = await authFetch('/orders');
        const orders = await res.json();

        const countEl = document.getElementById('orderCount');
        if (countEl) countEl.innerText = `(${orders.length})`;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7">
                    <div class="table-empty">
                        <div class="table-empty-icon">🛒</div>
                        <p>No orders placed yet.</p>
                    </div>
                </td></tr>
            `;
            return;
        }

        tbody.innerHTML = [...orders].reverse().map(o => `
            <tr>
                <td><code style="font-size:0.76rem; color:var(--text-muted)">${o.id}</code></td>
                <td>
                    <div class="name-col">${o.customerName}</div>
                    <div style="font-size:0.78rem; color:var(--text-muted)">${o.customerEmail}</div>
                </td>
                <td style="color:var(--text-muted); font-size:0.82rem">${o.items?.length || 0} item(s)</td>
                <td class="price-col">${formatCurrency(o.total)}</td>
                <td>${statusBadge(o.status)}</td>
                <td style="color:var(--text-muted); font-size:0.82rem">${formatDate(o.createdAt)}</td>
                <td>
                    <button class="btn-view" onclick="openStatusModal('${o.id}', '${o.status}')">🔄 Status</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            tbody.innerHTML = '<tr><td colspan="7" class="table-loading" style="color:var(--danger)">Failed to load orders.</td></tr>';
        }
    }
}

function openStatusModal(orderId, currentStatus) {
    document.getElementById('statusOrderId').value      = orderId;
    document.getElementById('statusOrderDisplay').value = orderId;
    document.getElementById('statusSelect').value       = currentStatus;
    document.getElementById('statusModal').classList.add('open');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('open');
}

async function updateOrderStatus() {
    const orderId = document.getElementById('statusOrderId').value;
    const status  = document.getElementById('statusSelect').value;

    try {
        const res  = await authFetch(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`Order status updated to "${status}".`);
            closeStatusModal();
            loadOrders();
        } else {
            showToast(data.error || 'Update failed.', 'error');
        }
    } catch (err) {
        if (err.message !== 'Unauthorized') showToast('Server error.', 'error');
    }
}

// ════════════════════════════════════════════════════════════
//  CUSTOMERS
// ════════════════════════════════════════════════════════════

async function loadCustomers() {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading customers...</td></tr>';
    try {
        const res       = await authFetch('/customers');
        const customers = await res.json();

        const countEl = document.getElementById('customerCount');
        if (countEl) countEl.innerText = `(${customers.length})`;

        if (customers.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6">
                    <div class="table-empty">
                        <div class="table-empty-icon">👥</div>
                        <p>No customers yet.</p>
                    </div>
                </td></tr>
            `;
            return;
        }

        tbody.innerHTML = customers.map(c => `
            <tr>
                <td class="name-col">${c.name}</td>
                <td style="color:var(--text-muted)">${c.email}</td>
                <td style="color:var(--text-muted)">${c.phone || '—'}</td>
                <td style="text-align:center; color:var(--accent); font-weight:600">${c.totalOrders || 0}</td>
                <td class="price-col">${formatCurrency(c.totalSpent)}</td>
                <td style="color:var(--text-muted); font-size:0.82rem">${formatDate(c.createdAt)}</td>
            </tr>
        `).join('');
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            tbody.innerHTML = '<tr><td colspan="6" class="table-loading" style="color:var(--danger)">Failed to load customers.</td></tr>';
        }
    }
}

// ─── CLOSE MODALS ON OVERLAY CLICK ───────────────────────────────────────────
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('open');
        }
    });
});
