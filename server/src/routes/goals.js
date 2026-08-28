import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all goals (savings + debt payoff)
router.get('/', async (req, res) => {
  try {
    const goals = await query.all(
      `SELECT g.*, a.name as account_name, a.balance as account_balance
       FROM goals g
       LEFT JOIN accounts a ON g.account_id = a.id
       WHERE g.user_id = ?
       ORDER BY g.created_at ASC`,
      [req.user.id]
    );

    // Compute average monthly net savings rate over past 3 months
    const savingsNetRow = await query.get(
      `SELECT AVG(monthly_net) as avg_savings_rate
       FROM (
         SELECT strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as monthly_net
         FROM transactions
         WHERE user_id = ? AND date >= date('now', '-3 months')
         GROUP BY strftime('%Y-%m', date)
       )`,
      [req.user.id]
    );

    const avgMonthlyNetSavings = Math.max(100, savingsNetRow?.avg_savings_rate || 500);

    const enrichedGoals = goals.map(goal => {
      const remaining = Math.max(0, goal.target_amount - goal.current_amount);
      const percent = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;

      // Project months needed
      const monthsNeeded = remaining > 0 ? Math.ceil(remaining / (avgMonthlyNetSavings * 0.4)) : 0;
      const projectedCompletionDate = new Date();
      projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + monthsNeeded);

      // Debt payoff simulation if type === 'debt'
      let debtPayoffStats = null;
      if (goal.type === 'debt') {
        const principal = goal.target_amount - goal.current_amount;
        const apr = (goal.interest_rate || 19.99) / 100;
        const monthlyRate = apr / 12;
        const monthlyPayment = Math.max(goal.minimum_payment || 50, principal * 0.03);

        let balance = principal;
        let months = 0;
        let totalInterestPaid = 0;

        while (balance > 0 && months < 360) {
          const interest = balance * monthlyRate;
          totalInterestPaid += interest;
          balance = balance + interest - monthlyPayment;
          months++;
          if (balance <= 0) break;
        }

        debtPayoffStats = {
          currentDebtRemaining: Math.round(principal * 100) / 100,
          estimatedMonthsToPayoff: months,
          estimatedTotalInterest: Math.round(totalInterestPaid * 100) / 100,
          recommendedMonthlyPayment: Math.round(monthlyPayment * 100) / 100
        };
      }

      return {
        ...goal,
        remaining_amount: Math.round(remaining * 100) / 100,
        percent_complete: percent,
        projected_completion_date: projectedCompletionDate.toISOString().split('T')[0],
        debt_payoff_stats: debtPayoffStats
      };
    });

    res.json({
      avgMonthlyNetSavings: Math.round(avgMonthlyNetSavings * 100) / 100,
      goals: enrichedGoals
    });
  } catch (err) {
    console.error('Fetch goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal
router.post('/', async (req, res) => {
  try {
    const { name, target_amount, current_amount, target_date, type, account_id, interest_rate, minimum_payment, color, icon } = req.body;

    if (!name || target_amount === undefined) {
      return res.status(400).json({ error: 'Name and target_amount required.' });
    }

    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await query.run(
      `INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, type, account_id, interest_rate, minimum_payment, color, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        name,
        Math.abs(parseFloat(target_amount)),
        parseFloat(current_amount) || 0.0,
        target_date || null,
        type || 'savings',
        account_id || null,
        parseFloat(interest_rate) || 0.0,
        parseFloat(minimum_payment) || 0.0,
        color || '#10B981',
        icon || 'target'
      ]
    );

    const created = await query.get(`SELECT * FROM goals WHERE id = ?`, [id]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal / Add contribution
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_amount, current_amount, target_date, type, account_id, interest_rate, minimum_payment, color, icon } = req.body;

    const existing = await query.get(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await query.run(
      `UPDATE goals
       SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, type = ?,
           account_id = ?, interest_rate = ?, minimum_payment = ?, color = ?, icon = ?
       WHERE id = ? AND user_id = ?`,
      [
        name ?? existing.name,
        target_amount !== undefined ? Math.abs(parseFloat(target_amount)) : existing.target_amount,
        current_amount !== undefined ? Math.abs(parseFloat(current_amount)) : existing.current_amount,
        target_date ?? existing.target_date,
        type ?? existing.type,
        account_id !== undefined ? account_id : existing.account_id,
        interest_rate !== undefined ? parseFloat(interest_rate) : existing.interest_rate,
        minimum_payment !== undefined ? parseFloat(minimum_payment) : existing.minimum_payment,
        color ?? existing.color,
        icon ?? existing.icon,
        id,
        req.user.id
      ]
    );

    const updated = await query.get(`SELECT * FROM goals WHERE id = ?`, [id]);
    res.json(updated);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query.run(`DELETE FROM goals WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true, message: 'Goal removed' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
