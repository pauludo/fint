import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all subscriptions with burn statistics and renewal alerts
router.get('/', async (req, res) => {
  try {
    const subscriptions = await query.all(
      `SELECT s.*,
              c.name as category_name, c.icon as category_icon, c.color as category_color,
              a.name as account_name, a.color as account_color
       FROM subscriptions s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN accounts a ON s.account_id = a.id
       WHERE s.user_id = ?
       ORDER BY s.next_renewal_date ASC`,
      [req.user.id]
    );

    const now = new Date();
    let totalMonthlyBurn = 0;
    let totalAnnualBurn = 0;
    let upcomingRenewals = [];

    const enriched = subscriptions.map(sub => {
      let monthlyCost = sub.amount;
      if (sub.billing_cycle === 'yearly') monthlyCost = sub.amount / 12;
      else if (sub.billing_cycle === 'quarterly') monthlyCost = sub.amount / 3;
      else if (sub.billing_cycle === 'weekly') monthlyCost = sub.amount * 4.33;

      const annualCost = monthlyCost * 12;

      if (sub.is_active) {
        totalMonthlyBurn += monthlyCost;
        totalAnnualBurn += annualCost;
      }

      // Calculate days until next renewal
      const renewalDate = new Date(sub.next_renewal_date);
      const diffTime = renewalDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isUpcoming = daysUntil >= 0 && daysUntil <= (sub.reminder_days || 7);
      if (isUpcoming && sub.is_active) {
        upcomingRenewals.push({
          ...sub,
          daysUntil,
          monthlyCost: Math.round(monthlyCost * 100) / 100
        });
      }

      return {
        ...sub,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        annualCost: Math.round(annualCost * 100) / 100,
        daysUntil,
        isUpcoming
      };
    });

    res.json({
      totalCount: subscriptions.length,
      activeCount: subscriptions.filter(s => s.is_active).length,
      totalMonthlyBurn: Math.round(totalMonthlyBurn * 100) / 100,
      totalAnnualBurn: Math.round(totalAnnualBurn * 100) / 100,
      upcomingRenewals,
      subscriptions: enriched
    });
  } catch (err) {
    console.error('Fetch subscriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Create subscription
router.post('/', async (req, res) => {
  try {
    const { name, amount, billing_cycle, category_id, account_id, next_renewal_date, reminder_days, notes, website } = req.body;

    if (!name || amount === undefined || !next_renewal_date) {
      return res.status(400).json({ error: 'Name, amount, and next renewal date required' });
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await query.run(
      `INSERT INTO subscriptions (id, user_id, name, amount, billing_cycle, category_id, account_id, next_renewal_date, reminder_days, notes, website, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        req.user.id,
        name,
        Math.abs(parseFloat(amount)),
        billing_cycle || 'monthly',
        category_id || null,
        account_id || null,
        next_renewal_date,
        reminder_days || 3,
        notes || '',
        website || ''
      ]
    );

    const created = await query.get(
      `SELECT s.*, c.name as category_name, a.name as account_name
       FROM subscriptions s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN accounts a ON s.account_id = a.id
       WHERE s.id = ?`,
      [id]
    );

    res.status(201).json(created);
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, billing_cycle, category_id, account_id, next_renewal_date, reminder_days, notes, website, is_active } = req.body;

    const existing = await query.get(`SELECT * FROM subscriptions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await query.run(
      `UPDATE subscriptions
       SET name = ?, amount = ?, billing_cycle = ?, category_id = ?, account_id = ?,
           next_renewal_date = ?, reminder_days = ?, notes = ?, website = ?, is_active = ?
       WHERE id = ? AND user_id = ?`,
      [
        name ?? existing.name,
        amount !== undefined ? Math.abs(parseFloat(amount)) : existing.amount,
        billing_cycle ?? existing.billing_cycle,
        category_id !== undefined ? category_id : existing.category_id,
        account_id !== undefined ? account_id : existing.account_id,
        next_renewal_date ?? existing.next_renewal_date,
        reminder_days ?? existing.reminder_days,
        notes ?? existing.notes,
        website ?? existing.website,
        is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        id,
        req.user.id
      ]
    );

    const updated = await query.get(
      `SELECT s.*, c.name as category_name, a.name as account_name
       FROM subscriptions s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN accounts a ON s.account_id = a.id
       WHERE s.id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err) {
    console.error('Update subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query.run(`DELETE FROM subscriptions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true, message: 'Subscription removed' });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Auto-detect potential subscriptions from transactions history
router.get('/detect-recurring', async (req, res) => {
  try {
    const candidateRows = await query.all(
      `SELECT merchant, amount, category_id, account_id, COUNT(id) as occurrences,
              MAX(date) as last_date, MIN(date) as first_date
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND date >= date('now', '-90 days')
       GROUP BY merchant, amount
       HAVING occurrences >= 2
       ORDER BY occurrences DESC`,
      [req.user.id]
    );

    const activeSubs = await query.all(`SELECT name FROM subscriptions WHERE user_id = ?`, [req.user.id]);
    const activeNames = new Set(activeSubs.map(s => s.name.toLowerCase()));

    const detected = candidateRows
      .filter(r => !activeNames.has(r.merchant.toLowerCase()))
      .map(r => {
        const lastD = new Date(r.last_date);
        const nextEstimated = new Date(lastD.getFullYear(), lastD.getMonth() + 1, lastD.getDate()).toISOString().split('T')[0];

        return {
          merchant: r.merchant,
          amount: r.amount,
          occurrences: r.occurrences,
          suggestedBillingCycle: 'monthly',
          lastChargedDate: r.last_date,
          suggestedNextDate: nextEstimated,
          categoryId: r.category_id,
          accountId: r.account_id
        };
      });

    res.json(detected);
  } catch (err) {
    console.error('Detect recurring error:', err);
    res.status(500).json({ error: 'Failed to detect recurring transactions' });
  }
});

export default router;
