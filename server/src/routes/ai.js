import express from 'express';
import { askFinances, suggestBudget, getStructuredFinancialContext } from '../services/aiService.js';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Ask finances natural language endpoint
router.post('/ask', async (req, res) => {
  try {
    const { question, conversationHistory } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Check if user has their own Anthropic key stored
    const user = await query.get(`SELECT anthropic_api_key FROM users WHERE id = ?`, [req.user.id]);
    const customApiKey = user?.anthropic_api_key;

    const response = await askFinances({
      userId: req.user.id,
      question: question.trim(),
      conversationHistory: conversationHistory || [],
      customApiKey
    });

    res.json(response);
  } catch (err) {
    console.error('AI ask error:', err);
    res.status(500).json({ error: 'Failed to process AI finance query' });
  }
});

// Proactive AI Insights
router.get('/insights', async (req, res) => {
  try {
    const insights = await query.all(
      `SELECT * FROM ai_insights WHERE user_id = ? AND is_dismissed = 0 ORDER BY created_at DESC`,
      [req.user.id]
    );

    // If none exist, create fresh proactive insights
    if (insights.length === 0) {
      const context = await getStructuredFinancialContext(req.user.id);
      // Auto-generate fresh insight
      const insId = `ins_gen_${Date.now()}`;
      const title = `Monthly Free Cash Flow Health`;
      const desc = `You are maintaining a strong financial cushion. Your net assets currently exceed liabilities by $${context.netWorthSummary.netWorth.toLocaleString()}.`;

      await query.run(
        `INSERT INTO ai_insights (id, user_id, type, title, description, impact_level)
         VALUES (?, ?, 'tip', ?, ?, 'low')`,
        [insId, req.user.id, title, desc]
      );

      const generated = await query.all(`SELECT * FROM ai_insights WHERE user_id = ? AND is_dismissed = 0`, [req.user.id]);
      return res.json(generated);
    }

    res.json(insights);
  } catch (err) {
    console.error('Fetch insights error:', err);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

// Dismiss insight
router.post('/insights/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    await query.run(`UPDATE ai_insights SET is_dismissed = 1 WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Dismiss insight error:', err);
    res.status(500).json({ error: 'Failed to dismiss insight' });
  }
});

// AI Budget Suggestion based on 3 months of spending
router.get('/suggest-budget', async (req, res) => {
  try {
    const suggestions = await suggestBudget(req.user.id);
    res.json({
      month: new Date().toISOString().slice(0, 7),
      suggestions
    });
  } catch (err) {
    console.error('AI suggest budget error:', err);
    res.status(500).json({ error: 'Failed to generate AI budget suggestions' });
  }
});

export default router;
