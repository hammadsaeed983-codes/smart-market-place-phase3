import Customer from '../models/Customer.js';

// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching customers.' });
  }
};

// Get single customer
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json(customer);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.status(500).json({ error: 'Server error while fetching customer.' });
  }
};
