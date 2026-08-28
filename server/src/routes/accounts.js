import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all accounts for current user
router.get('/', async (req, res) => {
  try {
    const accounts = await query.all(
      `SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC`,
      [req.user.id]
    );

    // Compute updated balance with transactions if needed, and count transactions
    const enrichedAccounts = await Promise.all(
      accounts.map(async (acc) => {
        const stats = await query.get(
          `SELECT COUNT(id) as tx_count,
                  COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_flow
           FROM transactions
           WHERE account_id = ?`,
          [acc.id]
        );
        return {
          ...acc,
          transaction_count: stats?.tx_count || 0
        };
      })
    );

    res.json(enrichedAccounts);
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create new account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, currency, color, icon, institution, account_number_last4 } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Account name and type are required' });
    }

    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await query.run(
      `INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon, institution, account_number_last4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        name,
        type,
        parseFloat(balance) || 0.0,
        currency || 'USD',
        color || '#3B82F6',
        icon || 'wallet',
        institution || '',
        account_number_last4 || ''
      ]
    );

    const created = await query.get(`SELECT * FROM accounts WHERE id = ?`, [id]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create account error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance, currency, color, icon, institution, account_number_last4 } = req.body;

    const existing = await query.get(`SELECT * FROM accounts WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await query.run(
      `UPDATE accounts
       SET name = ?, type = ?, balance = ?, currency = ?, color = ?, icon = ?, institution = ?, account_number_last4 = ?
       WHERE id = ? AND user_id = ?`,
      [
        name ?? existing.name,
        type ?? existing.type,
        balance !== undefined ? parseFloat(balance) : existing.balance,
        currency ?? existing.currency,
        color ?? existing.color,
        icon ?? existing.icon,
        institution ?? existing.institution,
        account_number_last4 ?? existing.account_number_last4,
        id,
        req.user.id
      ]
    );

    const updated = await query.get(`SELECT * FROM accounts WHERE id = ?`, [id]);
    res.json(updated);
  } catch (err) {
    console.error('Update account error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query.get(`SELECT * FROM accounts WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await query.run(`DELETE FROM accounts WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true, message: 'Account and associated transactions removed' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
