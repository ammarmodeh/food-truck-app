import Schedule from '../models/Schedule.js';

export const getSchedules = async (req, res) => {
  const { view } = req.query; // 'week' or 'month'
  try {
    const now = new Date();
    let startDate, endDate;

    if (view === 'week') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else if (view === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      return res.status(400).json({ msg: 'Invalid view parameter' });
    }

    const schedules = await Schedule.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort('date');
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const addSchedule = async (req, res) => {
  const { date, location, state, startTime, endTime, coordinates } = req.body;
  try {
    const schedule = new Schedule({ date, location, state, startTime, endTime, coordinates });
    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
    res.json({ msg: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};