import MenuItem from '../models/MenuItem.js';

export const getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const addMenuItem = async (req, res) => {
  const { name, description, price, category, image, prepTime } = req.body;
  try {
    const menuItem = new MenuItem({ name, description, price, category, image, prepTime });
    await menuItem.save();
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!menuItem) return res.status(404).json({ msg: 'Menu item not found' });
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const menuItem = await MenuItem.findByIdAndDelete(id);
    if (!menuItem) return res.status(404).json({ msg: 'Menu item not found' });
    res.json({ msg: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};