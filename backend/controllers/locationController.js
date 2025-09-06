import Location from '../models/Location.js';

export const getAllLocations = async (req, res) => {
  try {
    const location = await Location.findOne();
    if (!location) return res.status(404).json({ msg: 'No current location found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getCurrentLocation = async (req, res) => {
  try {
    const location = await Location.findOne();
    if (!location) return res.status(404).json({ msg: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const addLocation = async (req, res) => {
  const { date, location, state, startTime, endTime, coordinates } = req.body;
  try {
    if (!date || !location || !state || !startTime || !endTime) {
      return res.status(400).json({ msg: 'All required fields must be provided' });
    }
    const existingLocation = await Location.findOne();
    if (existingLocation) {
      return res.status(400).json({ msg: 'A current location already exists. Please edit or delete it first.' });
    }
    const newLocation = new Location({
      date,
      currentLocation: location, // Map location to currentLocation
      state,
      startTime,
      endTime,
      coordinates,
    });
    await newLocation.save();
    const io = req.app.get('io');
    io.emit('locationUpdate', newLocation);
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { date, location, state, startTime, endTime, coordinates } = req.body;
  try {
    const existingLocation = await Location.findById(id);
    if (!existingLocation) {
      return res.status(404).json({ msg: 'Location not found' });
    }
    if (!date || !location || !state || !startTime || !endTime) {
      return res.status(400).json({ msg: 'All required fields must be provided' });
    }
    existingLocation.date = date;
    existingLocation.currentLocation = location; // Map location to currentLocation
    existingLocation.state = state;
    existingLocation.startTime = startTime;
    existingLocation.endTime = endTime;
    existingLocation.coordinates = coordinates;
    existingLocation.updatedAt = Date.now();
    await existingLocation.save();
    const io = req.app.get('io');
    io.emit('locationUpdate', existingLocation);
    res.json(existingLocation);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ msg: 'Location not found' });
    }
    await location.deleteOne();
    const io = req.app.get('io');
    io.emit('locationUpdate', null);
    res.json({ msg: 'Location deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};