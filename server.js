import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Customer from './models/Customer.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import customerRoutes from './routes/customerRoutes.js';

// Middleware imports
import { verifyToken } from './middleware/auth.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve directories in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP to allow external Unsplash/placeholder images & Google Fonts
}));
app.use(cors());
app.use(express.json());

// Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Serve static frontend files from parent/sibling folders
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

// Stats route (Admin only)
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await Customer.countDocuments();

    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Processing').length;
    const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

    res.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      pendingOrders,
      shippedOrders,
      deliveredOrders
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error while calculating stats.' });
  }
});

// Fallback to serving frontend index.html for unknown SPA routes or frontend pages
app.get('/product.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/product.html'));
});
app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/cart.html'));
});

// Start Server and Database Connection
const startServer = async () => {
  // Connect to DB
  await connectDB();

  // Auto-seed database if empty
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    console.log('🌱 Database is empty. Seeding initial products...');
    const seedProducts = [
      {
        name: "iPhone 15 Pro Max",
        price: 1199,
        category: "Phones",
        stock: 15,
        description: "Titanium design, A17 Pro chip, customizable Action button, and the most powerful iPhone camera system ever.",
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "MacBook Pro 16",
        price: 2499,
        category: "Laptops",
        stock: 8,
        description: "M3 Max chip, up to 128GB unified memory, 22 hours of battery life, and a stunning Liquid Retina XDR display.",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "Sony WH-1000XM5",
        price: 399,
        category: "Accessories",
        stock: 25,
        description: "Industry-leading noise canceling headphones with dual processors, 8 microphones, and exceptional call quality.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "iPad Pro 12.9",
        price: 1099,
        category: "Laptops",
        stock: 12,
        description: "M2 chip, brilliant Liquid Retina XDR display, superfast wireless, and compatibility with Apple Pencil.",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "Mechanical Keyboard",
        price: 149,
        category: "Accessories",
        stock: 5,
        description: "Wireless mechanical keyboard with tactile switches, RGB backlighting, and hot-swappable keycaps.",
        image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80"
      }
    ];
    await Product.insertMany(seedProducts);
    console.log('✅ Database seeded successfully!');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 MarketX API running at http://localhost:${PORT}`);
    console.log(`   Admin credentials: admin@marketx.com / admin123`);
  });
};

startServer();
