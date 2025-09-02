import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';

export const placeOrder = async (req, res) => {
  const { items } = req.body;
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
    });
    await order.save();

    const io = req.app.get('io');
    const queueUpdate = { length: queueLength + 1, estimatedWait };
    console.log('Emitting queueUpdate (placeOrder):', queueUpdate);
    io.emit('queueUpdate', queueUpdate);

    console.log(`Order placed for user: ${user.phone}, Order ID: ${order._id}`);

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
      .populate('items.menuItem')
      .sort({ createdAt: -1 }); // Sort by newest first
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
    await order.save();

    const io = req.app.get('io');
    const queueLength = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    const pendingOrders = await Order.find({ status: { $in: ['Pending', 'Preparing'] } });
    const estimatedWait = pendingOrders.reduce((total, order) => total + (order.estimatedWait || 5), 0);
    const queueUpdate = { length: queueLength, estimatedWait };
    console.log('Emitting queueUpdate (updateOrderStatus):', queueUpdate);
    io.emit('queueUpdate', queueUpdate);

    if (status === 'Ready' || status === 'Delivered' || status === 'Cancelled') {
      console.log(`Emitting orderStatusUpdate for user ${order.user}, Order ID: ${id}, Status: ${status}`);
      io.to(order.user.toString()).emit('orderStatusUpdate', { orderId: id, status });
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
    const queueUpdate = { length: queueLength, estimatedWait };
    console.log('Sending queue data:', queueUpdate);
    res.json(queueUpdate);
  } catch (err) {
    console.error('Get queue error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};