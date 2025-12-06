import Settings from '../models/Settings.js';

// @desc Get settings
// @route GET /api/settings
// @access Admin
export const getSettings = async (req, res) => {
  try {
    // Get the first (and only) settings document
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
};

// @desc Update settings
// @route PUT /api/settings
// @access Admin
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Get the existing settings
    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = await Settings.create(updates);
    } else {
      // Update existing settings
      Object.keys(updates).forEach(key => {
        settings[key] = updates[key];
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error while updating settings' });
  }
};

// @desc Reset settings to defaults
// @route POST /api/settings/reset
// @access Admin
export const resetSettings = async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});

    // Create fresh default settings
    const settings = await Settings.create({});

    res.json(settings);
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Server error while resetting settings' });
  }
};
