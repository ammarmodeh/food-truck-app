import Location from '../models/Location.js';

export const getCurrentLocation = async (req, res) => {
  try {
    const location = await Location.findOne().sort({ updatedAt: -1 });
    if (!location) return res.status(404).json({ msg: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateCurrentLocation = async (req, res) => {
  const { currentLocation, coordinates } = req.body;
  try {
    let location = await Location.findOne();
    if (!location) {
      location = new Location({ currentLocation, coordinates });
    } else {
      location.currentLocation = currentLocation;
      location.coordinates = coordinates;
      location.updatedAt = Date.now();
    }
    await location.save();

    const io = req.app.get('io');
    io.emit('locationUpdate', location);

    res.json(location);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};