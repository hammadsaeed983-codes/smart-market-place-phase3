import Order from '../models/Order.js';
import Customer from '../models/Customer.js';

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching orders.' });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(order);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.status(500).json({ error: 'Server error while fetching order.' });
  }
};

// Place a new order
export const createOrder = async (req, res) => {
  try {
    const { customerName, customerEmail, address, items } = req.body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return res.status(400).json({ error: 'customerName, customerEmail, and items are required.' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const newOrder = new Order({
      customerName,
      customerEmail,
      address: address || '',
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      total,
      status: 'Processing'
    });

    await newOrder.save();

    // Update or create customer
    let customer = await Customer.findOne({ email: customerEmail.toLowerCase() });
    if (customer) {
      customer.totalOrders += 1;
      customer.totalSpent = parseFloat((customer.totalSpent + total).toFixed(2));
      if (customerName && customer.name !== customerName) {
        customer.name = customerName; // Update name if it changed
      }
      if (address && !customer.address) {
        customer.address = address;
      }
      await customer.save();
    } else {
      customer = new Customer({
        name: customerName,
        email: customerEmail.toLowerCase(),
        address: address || '',
        totalOrders: 1,
        totalSpent: total
      });
      await customer.save();
    }

    res.status(201).json({ message: 'Order placed successfully.', order: newOrder });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Server error while processing order.' });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ message: 'Order status updated.', order });
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating order status.' });
  }
};
