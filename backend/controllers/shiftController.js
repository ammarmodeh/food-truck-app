import Shift from '../models/Shift.js';
import { logAction } from './auditController.js';

export const startShift = async (req, res) => {
  const { startCash } = req.body;
  const userId = req.user._id;

  try {
    // Check if user already has an open shift
    const existingShift = await Shift.findOne({ user: userId, status: 'Open' });
    if (existingShift) {
      return res.status(400).json({ msg: 'You already have an open shift.' });
    }

    const shift = new Shift({
      user: userId,
      startCash,
      startTime: Date.now(),
      status: 'Open',
    });
    await shift.save();

    await logAction(userId, 'SHIFT_OPEN', { shiftId: shift._id, startCash }, req.ip);
    res.json(shift);
  } catch (err) {
    console.error('Start shift error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const endShift = async (req, res) => {
  const { endCash } = req.body;
  const userId = req.user._id;

  try {
    const shift = await Shift.findOne({ user: userId, status: 'Open' });
    if (!shift) return res.status(404).json({ msg: 'No open shift found.' });

    // Calculate expected cash (Start Cash + Cash Sales - Refunds)
    // Note: This simple calculation assumes all refunds are cash or handled properly. 
    // Ideally we track cash refunds separately from card refunds.
    // For now: Expected = Start + Cash Sales.
    const expectedCash = shift.startCash + shift.sales.cash;

    shift.endCash = endCash;
    shift.expectedCash = expectedCash;
    shift.status = 'Closed';
    shift.endTime = Date.now();
    await shift.save();

    await logAction(userId, 'SHIFT_CLOSE', {
      shiftId: shift._id,
      endCash,
      expectedCash,
      discrepancy: endCash - expectedCash
    }, req.ip);

    res.json(shift);
  } catch (err) {
    console.error('End shift error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ user: req.user._id, status: 'Open' });
    res.json(shift || null);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
