# MarketX — MongoDB E-Commerce Platform

A robust, full-stack e-commerce web application featuring a polished storefront, a secure JWT-authenticated admin dashboard, and a Node.js Express REST API connected to a MongoDB database.

---

## 📁 Organized Project Structure

The project follows a clean architectural division separating the backend API, the storefront, and administrative tools:

```
web-intern-project/
├── backend/                  # REST API Server & Database configuration
│   ├── config/
│   │   └── db.js             # MongoDB connection helper
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── customerController.js
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── models/
│   │   ├── Product.js        # Product schema with _id/id transform
│   │   ├── Order.js          # Order schema with nested items array
│   │   └── Customer.js       # Customer schema tracks spend history
│   ├── routes/
│   │   ├── authRoutes.js     # Admin login and verify routes
│   │   ├── productRoutes.js  # CRUD routes for catalog
│   │   ├── orderRoutes.js    # Placement and fulfillment routes
│   │   └── customerRoutes.js # Customer index
│   └── server.js             # Express app setup & database seeding
│
├── frontend/                 # Storefront static files (served at root /)
│   ├── index.html            # Shop homepage (product listing & search)
│   ├── product.html          # Individual product details page
│   ├── cart.html             # Cart listing & checkout submission modal
│   ├── style.css             # Main styling system (Glow cards, dark mode)
│   └── script.js             # Frontend API request handler
│
├── admin/                    # Admin portal static files (served at /admin)
│   ├── index.html            # Login screen (JWT authenticated)
│   ├── dashboard.html        # Overview of sales & database tables
│   ├── admin.css             # Premium admin panel dark theme
│   └── admin.js              # Table renderer & CRUD requester
│
├── .env                      # Local environment settings (URI & secret)
└── package.json              # Main launcher script (npm start)
```

---

## 🛠️ What We Did Today

### 1. 🗄️ Database Migration (MongoDB & Mongoose)
- **Database Engine**: Transitioned the data storage from flat JSON files to a live MongoDB database (`mongodb://localhost:27017/marketx`).
- **Mongoose Schemas**:
  - **Product Model**: Holds item title, category, description, price, stock, image URL, and creation dates.
  - **Order Model**: Houses client contact details, shipping info, nested array of item objects (ID, quantity, price), subtotal, tax, and order status.
  - **Customer Model**: Auto-created/updated when orders are placed, tracking total orders and lifetime spend.
- **Client-DB Compatibility (id Transform)**: Implemented a schema transform that maps MongoDB's `_id` to `id` for JSON outputs, meaning the storefront and admin panel could communicate with the database with **zero changes** to their existing front-end JavaScript logic.

### 2. 📁 Folder Structure Reorganization
- Isolated backend routes, controllers, schemas, and configurations into `/backend`.
- Moved client-facing web documents (`index.html`, `style.css`, etc.) into a tidy `/frontend` directory.
- Configured static asset serving on the Express server:
  - Serve `/frontend` at the root path (`/`).
  - Serve `/admin` at the admin path (`/admin`).

### 3. 🔒 Security & Middleware Enhancements
- **Helmet**: Integrated security headers (`helmet()`) to protect against clickjacking, sniff attacks, and cross-site scripting (configured to permit external Unsplash & placeholder pictures to render).
- **Rate-Limiting**: Connected `express-rate-limit` to prevent denial-of-service (DoS) and brute force login attempts, capping requests at 200 every 15 minutes per IP.

### 4. 🌱 Automatic Seeding
- Programmed a database initialization check that seeds the database with 5 premium electronic products (iPhone, MacBook, Sony WH-1000XM5, mechanical keyboards, etc.) upon first boot if the collection is empty. This resolves the "no data showing on the website" issue immediately.

---

## 🔌 API Endpoints Map

| Method | Endpoint | Auth | Description | Model |
|--------|----------|------|-------------|-------|
| `POST` | `/api/auth/login` | Public | Admin login -> Returns JWT | — |
| `GET`  | `/api/auth/verify` | JWT | Verifies authentication token | — |
| `GET`  | `/api/products` | Public | List products (supports `?category=`) | `Product` |
| `GET`  | `/api/products/:id` | Public | Fetch single product details | `Product` |
| `POST` | `/api/products` | JWT | Create a new catalog item | `Product` |
| `PUT`  | `/api/products/:id` | JWT | Edit an existing item | `Product` |
| `DELETE`| `/api/products/:id` | JWT | Delete a catalog item | `Product` |
| `GET`  | `/api/orders` | JWT | List all orders | `Order` |
| `POST` | `/api/orders` | Public | Checkout a cart -> Updates/Creates Customer | `Order` & `Customer` |
| `PUT`  | `/api/orders/:id/status` | JWT | Change order state | `Order` |
| `GET`  | `/api/customers` | JWT | List all customers | `Customer` |
| `GET`  | `/api/stats` | JWT | Get total revenues, items, and pending states | Multiple |

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** (v16+ recommended)
- **MongoDB** running locally on port 27017

### ⚙️ Installation
1. Install server dependencies from the root directory:
   ```bash
   npm install
   ```
2. Set up environment variables in the `.env` file at the root:
   ```env
   MONGODB_URI=mongodb://localhost:27017/marketx
   JWT_SECRET=supersecretkey12345
   ```

### 🏃 Running
Start the development server:
```bash
npm start
```
- Storefront: [http://localhost:3001](http://localhost:3001)
- Admin Panel: [http://localhost:3001/admin](http://localhost:3001/admin) (Log in with `admin@marketx.com` / `admin123`)
