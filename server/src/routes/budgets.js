import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get budgets for a given month (defaults to current YYYY-MM)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || currentMonth;

    // Previous month string for rollover calculation
    const [year, m] = month.split('-').map(Number);
    const prevDate = new Date(year, m - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Get all expense categories
    const categories = await query.all(
      `SELECT id, name, icon, color FROM categories WHERE (user_id = ? OR user_id IS NULL) AND type = 'expense' ORDER BY name ASC`,
      [req.user.id]
    );

    // Get user defined budgets for requested month
    const userBudgets = await query.all(
      `SELECT * FROM budgets WHERE user_id = ? AND month = ?`,
      [req.user.id, month]
    );
    const budgetMap = {};
    for (const b of userBudgets) {
      budgetMap[b.category_id] = b;
    }

    // Get transaction spending per category for requested month
    const spendingRows = await query.all(
      `SELECT category_id, SUM(amount) as total_spent
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
       GROUP BY category_id`,
      [req.user.id, month]
    );
    const spendingMap = {};
    for (const s of spendingRows) {
      if (s.category_id) spendingMap[s.category_id] = (spendingMap[s.category_id] || 0) + s.total_spent;
    }

    // ─── Merge active subscription costs into category spending ───────────────
    // Subscriptions are tracked separately but should count toward the budget
    // for their assigned category in the current month.
    const activeSubs = await query.all(
      `SELECT s.category_id, s.amount, s.billing_cycle
       FROM subscriptions s
       WHERE s.user_id = ? AND s.is_active = 1 AND s.category_id IS NOT NULL`,
      [req.user.id]
    );
    for (const sub of activeSubs) {
      let monthlyCost = sub.amount;
      if (sub.billing_cycle === 'yearly')    monthlyCost = sub.amount / 12;
      else if (sub.billing_cycle === 'quarterly') monthlyCost = sub.amount / 3;
      else if (sub.billing_cycle === 'weekly')    monthlyCost = sub.amount * 4.33;
      spendingMap[sub.category_id] = (spendingMap[sub.category_id] || 0) + monthlyCost;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Get previous month spending and budget for rollover calculation
    const prevBudgets = await query.all(
      `SELECT * FROM budgets WHERE user_id = ? AND month = ? AND rollover_enabled = 1`,
      [req.user.id, prevMonth]
    );
    const prevSpendingRows = await query.all(
      `SELECT category_id, SUM(amount) as total_spent
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
       GROUP BY category_id`,
      [req.user.id, prevMonth]
    );
    const prevSpendingMap = {};
    for (const s of prevSpendingRows) {
      prevSpendingMap[s.category_id] = s.total_spent;
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const enrichedBudgets = categories.map(cat => {
      const budgetObj = budgetMap[cat.id];
      const limit = budgetObj ? budgetObj.limit_amount : 0;
      const spent = spendingMap[cat.id] || 0;
      const isRollover = budgetObj ? Boolean(budgetObj.rollover_enabled) : false;

      let rolloverAmount = 0;
      if (isRollover) {
        const prevBgt = prevBudgets.find(pb => pb.category_id === cat.id);
        if (prevBgt) {
          const prevSpent = prevSpendingMap[cat.id] || 0;
          rolloverAmount = Math.max(0, prevBgt.limit_amount - prevSpent);
        }
      }

      const effectiveLimit = limit + rolloverAmount;
      const remaining = effectiveLimit - spent;
      const percentUsed = effectiveLimit > 0 ? Math.round((spent / effectiveLimit) * 100) : (spent > 0 ? 100 : 0);

      let status = 'ok';
      if (effectiveLimit > 0 && percentUsed >= 100) {
        status = 'exceeded';
      } else if (effectiveLimit > 0 && percentUsed >= 80) {
        status = 'warning';
      } else if (effectiveLimit === 0 && spent > 0) {
        // Has spending but no limit set — flag as a warning so user sets a budget
        status = 'warning';
      }

      // Include in summary: categories with a limit OR categories with real spending
      if (effectiveLimit > 0) {
        totalBudget += effectiveLimit;
        totalSpent += spent;
      } else if (spent > 0) {
        // Count unbudgeted spending in the overall total spent
        totalSpent += spent;
      }

      return {
        id: budgetObj ? budgetObj.id : null,
        category_id: cat.id,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color,
        month,
        base_limit: limit,
        rollover_amount: rolloverAmount,
        effective_limit: effectiveLimit,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percent_used: percentUsed,
        status,
        rollover_enabled: isRollover,
        has_spending: spent > 0,
        has_limit: effectiveLimit > 0
      };
    });

    // Sort: categories with spending or a limit first, then alphabetical
    enrichedBudgets.sort((a, b) => {
      const aActive = a.has_spending || a.has_limit ? 1 : 0;
      const bActive = b.has_spending || b.has_limit ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return a.category_name.localeCompare(b.category_name);
    });

    res.json({
      month,
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalRemaining: Math.round((totalBudget - totalSpent) * 100) / 100,
      overallPercentUsed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      budgets: enrichedBudgets
    });
  } catch (err) {
    console.error('Fetch budgets error:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create or update a budget limit
router.post('/', async (req, res) => {
  try {
    const { category_id, month, limit_amount, rollover_enabled } = req.body;

    if (!category_id || !month || limit_amount === undefined) {
      return res.status(400).json({ error: 'Category, month (YYYY-MM), and limit_amount required.' });
    }

    const id = `bgt_${month}_${category_id}_${req.user.id.slice(-4)}`;
    const parsedLimit = Math.max(0, parseFloat(limit_amount));

    await query.run(
      `INSERT INTO budgets (id, user_id, category_id, month, limit_amount, rollover_enabled)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, category_id, month) DO UPDATE SET
       limit_amount = excluded.limit_amount,
       rollover_enabled = excluded.rollover_enabled`,
      [id, req.user.id, category_id, month, parsedLimit, rollover_enabled ? 1 : 0]
    );

    const updated = await query.get(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.category_id = ? AND b.month = ?`,
      [req.user.id, category_id, month]
    );

    res.json(updated);
  } catch (err) {
    console.error('Save budget error:', err);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// Bulk upsert budgets (useful for AI suggestions apply)
router.post('/bulk-upsert', async (req, res) => {
  try {
    const { month, items } = req.body;
    if (!month || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Month and items array required' });
    }

    for (const item of items) {
      if (!item.categoryId || item.limitAmount === undefined) continue;
      const id = `bgt_${month}_${item.categoryId}_${req.user.id.slice(-4)}`;
      const parsedLimit = Math.max(0, parseFloat(item.limitAmount));

      await query.run(
        `INSERT INTO budgets (id, user_id, category_id, month, limit_amount, rollover_enabled)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, category_id, month) DO UPDATE SET
         limit_amount = excluded.limit_amount`,
        [id, req.user.id, item.categoryId, month, parsedLimit, item.rolloverEnabled ? 1 : 0]
      );
    }

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error('Bulk upsert budget error:', err);
    res.status(500).json({ error: 'Failed to bulk update budgets' });
  }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query.run(`DELETE FROM budgets WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true, message: 'Budget removed' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
