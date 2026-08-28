import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Update user preferences (currency, dark_mode, anthropic_api_key, name)
router.put('/profile', async (req, res) => {
  try {
    const { name, base_currency, dark_mode, anthropic_api_key } = req.body;

    const existing = await query.get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query.run(
      `UPDATE users
       SET name = ?, base_currency = ?, dark_mode = ?, anthropic_api_key = ?
       WHERE id = ?`,
      [
        name ?? existing.name,
        base_currency ?? existing.base_currency,
        dark_mode !== undefined ? (dark_mode ? 1 : 0) : existing.dark_mode,
        anthropic_api_key !== undefined ? anthropic_api_key : existing.anthropic_api_key,
        req.user.id
      ]
    );

    const updated = await query.get(
      `SELECT id, email, name, base_currency, dark_mode, anthropic_api_key, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );

    const { anthropic_api_key: key, ...safeUser } = updated;
    res.json({
      user: safeUser,
      hasCustomApiKey: Boolean(key && key.trim())
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const user = await query.get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Clear all user data to start 100% fresh
router.post('/clear-all-data', async (req, res) => {
  try {
    await query.run(`DELETE FROM transactions WHERE user_id = ?`, [req.user.id]);
    await query.run(`DELETE FROM budgets WHERE user_id = ?`, [req.user.id]);
    await query.run(`DELETE FROM subscriptions WHERE user_id = ?`, [req.user.id]);
    await query.run(`DELETE FROM goals WHERE user_id = ?`, [req.user.id]);
    await query.run(`DELETE FROM ai_insights WHERE user_id = ?`, [req.user.id]);
    await query.run(`UPDATE accounts SET balance = 0.00 WHERE user_id = ?`, [req.user.id]);

    res.json({ success: true, message: 'All transactions, budgets, subscriptions, and goals cleared to a fresh slate.' });
  } catch (err) {
    console.error('Clear data error:', err);
    res.status(500).json({ error: 'Failed to clear user data' });
  }
});

// Full data export (GDPR / Portability)
router.get('/export-all', async (req, res) => {
  try {
    const accounts = await query.all(`SELECT * FROM accounts WHERE user_id = ?`, [req.user.id]);
    const categories = await query.all(`SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL`, [req.user.id]);
    const transactions = await query.all(`SELECT * FROM transactions WHERE user_id = ?`, [req.user.id]);
    const budgets = await query.all(`SELECT * FROM budgets WHERE user_id = ?`, [req.user.id]);
    const subscriptions = await query.all(`SELECT * FROM subscriptions WHERE user_id = ?`, [req.user.id]);
    const goals = await query.all(`SELECT * FROM goals WHERE user_id = ?`, [req.user.id]);

    const backup = {
      exportedAt: new Date().toISOString(),
      user: req.user,
      accounts,
      categories,
      transactions,
      budgets,
      subscriptions,
      goals
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fintrack_backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (err) {
    console.error('Export all error:', err);
    res.status(500).json({ error: 'Failed to export full user data' });
  }
});

export default router;
