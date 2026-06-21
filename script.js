// ============================================================
//  MarketX — Frontend Script
//  Connects to Express API at localhost:3001
// ============================================================

const API_BASE = 'http://localhost:3001/api';

// ─── UTILITY: Toast Notification ───────────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'error' ? '❌' : '✅'}</span>
        <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ─── CART HELPERS ───────────────────────────────────────────────────────────
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart  = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.innerText = count;
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 300);
    });
}

// ─── HOME PAGE: Product Listing ─────────────────────────────────────────────
const productList = document.getElementById('productList');

if (productList) {
    let allProducts = [];
    let activeCategory = 'All';

    // Load products from API
    async function loadProducts(category = 'All') {
        productList.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
        try {
            const url = category === 'All'
                ? `${API_BASE}/products`
                : `${API_BASE}/products?category=${encodeURIComponent(category)}`;
            const res  = await fetch(url);
            const data = await res.json();
            allProducts = data;
            renderProducts(data);
        } catch (err) {
            productList.innerHTML = `<p style="color:var(--text-muted); padding:20px;">⚠️ Could not load products. Make sure the server is running on port 3001.</p>`;
        }
    }

    function renderProducts(products) {
        productList.innerHTML = '';
        if (products.length === 0) {
            productList.innerHTML = '<p style="color:var(--text-muted); padding:20px;">No products found in this category.</p>';
            return;
        }
        products.forEach(product => {
            const stockLabel = product.stock > 10
                ? `<span class="card-stock">In stock (${product.stock})</span>`
                : product.stock > 0
                    ? `<span class="card-stock low">⚠️ Low stock (${product.stock})</span>`
                    : `<span class="card-stock out">❌ Out of stock</span>`;

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                    <span class="card-category-badge">${product.category}</span>
                    <button class="card-quick-add" onclick="quickAddToCart(event, '${product.id}')" title="Add to cart">+</button>
                </div>
                <div class="card-body">
                    <h3>${product.name}</h3>
                    <div class="card-price">$${product.price.toLocaleString()}</div>
                    ${stockLabel}
                    <button class="view-btn" onclick="viewProduct('${product.id}')">View Details →</button>
                </div>
            `;
            productList.appendChild(card);
        });
    }

    // Category filtering
    function setActiveCategory(category) {
        activeCategory = category;

        // Top filter buttons
        document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        // Sidebar links
        document.querySelectorAll('.sidebar-filter').forEach(link => {
            link.classList.toggle('active', link.dataset.category === category);
        });

        loadProducts(category);
    }

    // Wire up category filter buttons
    document.querySelectorAll('#categoryFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setActiveCategory(btn.dataset.category));
    });
    document.querySelectorAll('.sidebar-filter').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveCategory(link.dataset.category);
        });
    });

    // Search filter (client-side on already-loaded data)
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const filtered = allProducts.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
            renderProducts(filtered);
        });
    }

    // Initial load
    loadProducts();
    updateCartCount();
}

// ─── Quick Add to Cart from index page ─────────────────────────────────────
async function quickAddToCart(event, productId) {
    event.stopPropagation();
    try {
        const res     = await fetch(`${API_BASE}/products/${productId}`);
        const product = await res.json();
        addProductToCart(product);
        showToast(`${product.name} added to cart!`);
    } catch {
        showToast('Could not add product. Server offline?', 'error');
    }
}

// ─── Navigate to Product Detail Page ───────────────────────────────────────
function viewProduct(id) {
    localStorage.setItem('currentProductId', id);
    window.location.href = 'product.html';
}

// ─── PRODUCT DETAIL PAGE ───────────────────────────────────────────────────
if (document.getElementById('productName')) {
    async function loadProductDetail() {
        const productId = localStorage.getItem('currentProductId');
        if (!productId) { window.location.href = 'index.html'; return; }

        try {
            const res     = await fetch(`${API_BASE}/products/${productId}`);
            const product = await res.json();

            document.getElementById('productName').innerText      = product.name;
            document.getElementById('productPrice').innerText     = `$${product.price.toLocaleString()}`;
            document.getElementById('productCategory').innerText  = product.category;
            document.getElementById('productImg').src             = product.image;
            document.getElementById('productImg').alt             = product.name;
            document.title                                        = `${product.name} | MarketX`;

            const desc = document.getElementById('productDescription');
            if (desc && product.description) desc.innerText = product.description;

            const stockEl = document.getElementById('productStock');
            if (stockEl) {
                if (product.stock > 10)     stockEl.innerText = `✅ In Stock (${product.stock} units)`;
                else if (product.stock > 0) stockEl.innerText = `⚠️ Low Stock — only ${product.stock} left!`;
                else                        stockEl.innerText = '❌ Out of Stock';
            }

            // Store product for addToCart
            localStorage.setItem('currentProduct', JSON.stringify(product));
        } catch {
            document.getElementById('productName').innerText = 'Product not found.';
        }
    }

    loadProductDetail();
    updateCartCount();
}

// ─── Add current product to cart (product page) ─────────────────────────────
function addToCart() {
    const product = JSON.parse(localStorage.getItem('currentProduct'));
    if (!product) return;
    addProductToCart(product);

    const btn = document.getElementById('addToCartBtn');
    if (btn) {
        btn.innerText = '✅ Added to Cart!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => {
            btn.innerText = '🛒 Add to Cart';
            btn.style.background = '';
        }, 2200);
    }
    showToast(`${product.name} added to cart!`);
}

// ─── Core: add item to localStorage cart ────────────────────────────────────
function addProductToCart(product) {
    let cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
}

// ─── CART PAGE ───────────────────────────────────────────────────────────────
if (document.getElementById('cartItems')) {
    renderCartPage();
    updateCartCount();
}

function renderCartPage() {
    const cart      = getCart();
    const container = document.getElementById('cartItems');
    let subtotal    = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything yet.</p>
                <a href="index.html" class="btn-primary" style="display:inline-block; margin-top:20px; text-decoration:none;">Shop Now →</a>
            </div>
        `;
        document.getElementById('checkoutBtn').disabled = true;
        document.getElementById('checkoutBtn').style.opacity = '0.5';
    } else {
        container.innerHTML = '';
        cart.forEach((item, index) => {
            subtotal += item.price * item.quantity;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div>
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-detail">$${item.price.toLocaleString()} × ${item.quantity}</div>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="remove-btn" onclick="removeItem(${index})">✕</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    const tax   = subtotal * 0.05;
    const total = subtotal + tax;
    document.getElementById('subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').innerText      = `$${tax.toFixed(2)}`;
    document.getElementById('total').innerText    = `$${total.toFixed(2)}`;
}

function removeItem(index) {
    let cart = getCart();
    const removed = cart.splice(index, 1)[0];
    saveCart(cart);
    renderCartPage();
    showToast(`${removed.name} removed from cart.`, 'error');
}

// ─── Checkout Modal ──────────────────────────────────────────────────────────
function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) { showToast('Your cart is empty!', 'error'); return; }
    const modal = document.getElementById('checkoutModal');
    if (modal) { modal.style.display = 'flex'; }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
}

async function placeOrder() {
    const name    = document.getElementById('checkoutName')?.value.trim();
    const email   = document.getElementById('checkoutEmail')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();

    if (!name || !email) { showToast('Please fill in your name and email.', 'error'); return; }

    const cart = getCart();
    const items = cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));

    try {
        const res  = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerName: name, customerEmail: email, address, items })
        });
        const data = await res.json();

        if (res.ok) {
            closeCheckoutModal();
            saveCart([]);
            renderCartPage();
            showToast(`Order #${data.order.id} placed successfully! 🎉`);
        } else {
            showToast(data.error || 'Order failed.', 'error');
        }
    } catch {
        showToast('Server is offline. Please start the backend.', 'error');
    }
}

// ─── Initial cart count on all pages ────────────────────────────────────────
updateCartCount();