import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import { logAction } from './auditController.js';
import Stripe from 'stripe';

export const placeOrder = async (req, res) => {
  const { items, paymentMethod, paymentIntentId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let totalPrice = 0;
    let totalPrepTime = 0;

    for (let item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) return res.status(404).json({ msg: `Menu item ${item.menuItem} not found` });
      totalPrice += menuItem.price * item.qty;
      totalPrepTime += (menuItem.prepTime || 5) * item.qty;
    }

    const queueLength = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    const estimatedWait = totalPrepTime + (queueLength * 5);

    const order = new Order({
      user: userId,
      items,
      totalPrice,
      estimatedWait,
      phone: user.phone,
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: paymentMethod === 'Card' ? 'Paid' : 'Pending',
      stripePaymentIntentId: paymentIntentId,
    });
    await order.save();

    const io = req.app.get('io');
    const queueUpdate = { length: queueLength + 1, estimatedWait };
    io.emit('queueUpdate', queueUpdate);

    res.json(order);
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.menuItem');
    res.json(orders);
  } catch (err) {
    console.error('Get my orders error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('refundedBy', 'name username')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    order.status = status;
    order.updatedAt = Date.now();
    if (status === 'Delivered') order.deliveredAt = Date.now();
    if (status === 'Cancelled') order.cancelledAt = Date.now();
    if (status === 'Ready') order.readyAt = Date.now();
    if (status === 'Preparing') order.preparingAt = Date.now(); // Added to track when order enters Preparing
    await order.save();

    const io = req.app.get('io');
    const queueLength = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    const pendingOrders = await Order.find({ status: { $in: ['Pending', 'Preparing'] } });
    const estimatedWait = pendingOrders.reduce((total, order) => total + (order.estimatedWait || 5), 0);
    const queueUpdate = { length: queueLength, estimatedWait };
    io.emit('queueUpdate', queueUpdate);

    // Emit orderStatusUpdate for all relevant status changes
    if (['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].includes(status)) {
      io.to(order.user.toString()).emit('orderStatusUpdate', { orderId: id, status });
      io.emit('orderStatusUpdate', { orderId: id, status }); // Broadcast to all clients (including admins)
    }

    res.json(order);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

export const getQueue = async (req, res) => {
  try {
    const queueLength = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    const pendingOrders = await Order.find({ status: { $in: ['Pending', 'Preparing'] } });
    const estimatedWait = pendingOrders.reduce((total, order) => total + (order.estimatedWait || 5), 0);
    res.json({ length: queueLength, estimatedWait });
  } catch (err) {
    console.error('Get queue error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

export const refundOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // Stripe Refund Logic
    if (order.paymentMethod === 'Card' && order.stripePaymentIntentId) {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('Stripe Secret Key missing for refund.');
        return res.status(500).json({ msg: 'Server error: Stripe not configured for refunds' });
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
        });
        console.log(`Stripe refund successful for order ${id}`);
      } catch (stripeErr) {
        console.error('Stripe refund failed:', stripeErr);
        return res.status(500).json({ msg: 'Stripe refund failed', error: stripeErr.message });
      }
    }

    order.status = 'Cancelled';
    order.paymentStatus = 'Refunded';
    order.cancelledAt = Date.now();
    order.refundedBy = req.user._id;
    order.refundedAt = Date.now();
    order.refundReason = req.body.reason || 'Refunded by POS staff';
    await order.save();

    // Populate refundedBy user info for response
    await order.populate('refundedBy', 'name username');


    const io = req.app.get('io');
    io.emit('orderStatusUpdate', { orderId: id, status: 'Cancelled' });

    await logAction(req.user._id, 'REFUND_ORDER', { orderId: id, amount: order.totalPrice, stripeRefund: !!order.stripePaymentIntentId }, req.ip);

    res.json(order);
  } catch (err) {
    console.error('Refund order error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};