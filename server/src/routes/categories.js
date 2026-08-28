import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all categories for user + shared system categories
router.get('/', async (req, res) => {
  try {
    const categories = await query.all(
      `SELECT c.*,
              (SELECT COUNT(id) FROM transactions WHERE category_id = c.id AND user_id = ?) as transaction_count
       FROM categories c
       WHERE c.user_id = ? OR c.user_id IS NULL
       ORDER BY c.type DESC, c.name ASC`,
      [req.user.id, req.user.id]
    );

    res.json(categories);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create custom category
router.post('/', async (req, res) => {
  try {
    const { name, type, icon, color, parent_id } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Category name and type are required' });
    }

    const id = `cat_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await query.run(
      `INSERT INTO categories (id, user_id, name, type, icon, color, parent_id, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, req.user.id, name, type, icon || 'tag', color || '#64748B', parent_id || null]
    );

    const created = await query.get(`SELECT * FROM categories WHERE id = ?`, [id]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon, color, parent_id } = req.body;

    const existing = await query.get(`SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await query.run(
      `UPDATE categories
       SET name = ?, type = ?, icon = ?, color = ?, parent_id = ?
       WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [
        name ?? existing.name,
        type ?? existing.type,
        icon ?? existing.icon,
        color ?? existing.color,
        parent_id !== undefined ? parent_id : existing.parent_id,
        id,
        req.user.id
      ]
    );

    const updated = await query.get(`SELECT * FROM categories WHERE id = ?`, [id]);
    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query.get(`SELECT * FROM categories WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Custom category not found or is a system default.' });
    }

    // Unassign transactions
    await query.run(`UPDATE transactions SET category_id = NULL WHERE category_id = ? AND user_id = ?`, [id, req.user.id]);
    await query.run(`DELETE FROM categories WHERE id = ? AND user_id = ?`, [id, req.user.id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
