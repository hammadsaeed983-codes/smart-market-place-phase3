import Product from '../models/Product.js';

// Get all products (supports category filter)
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching products.' });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.status(500).json({ error: 'Server error while fetching product.' });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, price, category, description, image, stock } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required.' });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      category,
      description: description || '',
      image: image || 'https://placehold.co/600x400?text=Product',
      stock: parseInt(stock) || 0
    });

    await product.save();
    res.status(201).json({ message: 'Product created.', product });
  } catch (err) {
    res.status(500).json({ error: 'Server error while creating product.' });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, price, category, description, image, stock } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (stock !== undefined) updateData.stock = parseInt(stock);

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product updated.', product });
  } catch (err) {
    res.status(500).json({ error: 'Server error while updating product.' });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product deleted.', product });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting product.' });
  }
};
