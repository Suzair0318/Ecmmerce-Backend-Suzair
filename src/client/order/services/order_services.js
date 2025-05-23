const Order = require("../models/order_models");
const Cart = require("../../cart/models/cart_models");

module.exports = {
  // Create Order from Cart
  createOrderFromCart: async (userId, address) => {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || !cart.items.length) {
      throw new Error("Cart is empty.");
    }
    // Validate cart items and calculate total
    let totalPrice = 0;
    const orderItems = [];
    for (const item of cart.items) {
      if (!item.product || item.quantity > item.product.stock) {
        throw new Error(`Product out of stock: ${item.product?.name}`);
      }
      totalPrice += item.product.price * item.quantity;
      orderItems.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      });
    }
    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalPrice,
      address,
    });

    await order.save();
    // Reduce product stock
    for (const item of cart.items) {
      item.product.stock -= item.quantity;
      await item.product.save();
    }
    // Clear cart
    cart.items = [];
    await cart.save();
    return order;
  },

  // Get User Order History
  getUserOrderHistory: async (userId) => {
    return Order.find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });
  },

  // Search User Order History
  searchUserOrderHistory: async (userId, filters) => {
    const query = { user: userId };
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }
    if (filters.orderId) {
      query._id = filters.orderId;
    }
    return Order.find(query)
      .populate("items.product")
      .sort({ createdAt: -1 });
  },
};
