import Schedule from '../models/Schedule.js';

export const getSchedules = async (req, res) => {
  const { view } = req.query; // 'week' or 'month'
  try {
    let schedules;
    if (view === 'week') {
      const now = new Date();
      const startDate = new Date(now.setHours(0, 0, 0, 0));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      schedules = await Schedule.find({
        date: { $gte: startDate, $lte: endDate },
      }).sort('date');
    } else if (view === 'month') {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      schedules = await Schedule.find({
        date: { $gte: startDate, $lte: endDate },
      }).sort('date');
    } else {
      schedules = await Schedule.find().sort('date'); // Fetch all schedules if no view parameter
    }
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