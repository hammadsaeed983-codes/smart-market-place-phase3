import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  address: { type: String, default: '' },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  createdAt: { type: Date, default: Date.now }
});

OrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default mongoose.model('Order', OrderSchema);
