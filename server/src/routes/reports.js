import express from 'express';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Comprehensive financial reports & analytics overview
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;

    let dateFilter = '';
    let params = [req.user.id];

    if (startDate && endDate) {
      dateFilter = 'AND t.date >= ? AND t.date <= ?';
      params.push(startDate, endDate);
    } else {
      // Default to last 30 days
      dateFilter = "AND t.date >= date('now', '-30 days')";
    }

    // 1. Totals
    const totals = await query.get(
      `SELECT
         COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
         COUNT(t.id) as total_transactions
       FROM transactions t
       WHERE t.user_id = ? ${dateFilter}`,
      params
    );

    const netSavings = totals.total_income - totals.total_expenses;
    const savingsRate = totals.total_income > 0 ? Math.round((netSavings / totals.total_income) * 100) : 0;

    // 2. Spending by category breakdown
    const categoryBreakdown = await query.all(
      `SELECT c.id, c.name, c.icon, c.color,
              COALESCE(SUM(t.amount), 0) as total_spent,
              COUNT(t.id) as transaction_count
       FROM categories c
       JOIN transactions t ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' ${dateFilter}
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total_spent DESC`,
      params
    );

    const totalCategorySpent = categoryBreakdown.reduce((sum, c) => sum + c.total_spent, 0);
    const enrichedCategories = categoryBreakdown.map(c => ({
      ...c,
      total_spent: Math.round(c.total_spent * 100) / 100,
      percentage: totalCategorySpent > 0 ? Math.round((c.total_spent / totalCategorySpent) * 100) : 0
    }));

    // 3. Multi-month trends (last 6 months)
    const monthlyTrends = await query.all(
      `SELECT strftime('%Y-%m', date) as month,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
       FROM transactions
       WHERE user_id = ? AND date >= date('now', '-6 months')
       GROUP BY strftime('%Y-%m', date)
       ORDER BY month ASC`,
      [req.user.id]
    );

    // 4. Net Worth History and Accounts Summary
    const accounts = await query.all(
      `SELECT name, type, balance, currency, color FROM accounts WHERE user_id = ?`,
      [req.user.id]
    );
    const totalAssets = accounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);

    // 5. Detect Spending Anomalies in this period
    const avgSpendRow = await query.get(
      `SELECT AVG(amount) as avg_spend, MAX(amount) as max_spend
       FROM transactions
       WHERE user_id = ? AND type = 'expense'`,
      [req.user.id]
    );
    const threshold = (avgSpendRow?.avg_spend || 50) * 2.5;

    const anomalies = await query.all(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.amount >= ? ${dateFilter}
       ORDER BY t.amount DESC
       LIMIT 5`,
      [req.user.id, threshold, ...(startDate && endDate ? [startDate, endDate] : [])]
    );

    res.json({
      period,
      summary: {
        totalIncome: Math.round(totals.total_income * 100) / 100,
        totalExpenses: Math.round(totals.total_expenses * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        savingsRate,
        transactionCount: totals.total_transactions,
        totalAssets: Math.round(totalAssets * 100) / 100,
        totalLiabilities: Math.round(totalLiabilities * 100) / 100,
        netWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100
      },
      categoryBreakdown: enrichedCategories,
      monthlyTrends: monthlyTrends.map(m => ({
        month: m.month,
        income: Math.round(m.income * 100) / 100,
        expenses: Math.round(m.expenses * 100) / 100,
        net: Math.round((m.income - m.expenses) * 100) / 100
      })),
      accounts,
      anomalies
    });
  } catch (err) {
    console.error('Fetch reports summary error:', err);
    res.status(500).json({ error: 'Failed to generate financial reports' });
  }
});

export default router;
