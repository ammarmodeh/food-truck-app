import AuditLog from '../models/AuditLog.js';

export const logAction = async (userId, action, details, ip) => {
  try {
    const log = new AuditLog({
      user: userId,
      action,
      details,
      ip,
    });
    await log.save();
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getMyAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
