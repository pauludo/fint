import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { seedDatabase } from '../db/seed.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, baseCurrency } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existing = await query.get(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await query.run(
      `INSERT INTO users (id, email, password_hash, name, base_currency, dark_mode)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userId, email.toLowerCase(), passwordHash, name, baseCurrency || 'USD']
    );

    // Seed default categories for new user
    const defaultCategories = [
      { id: `cat_inc_sal_${userId}`, name: 'Salary & Wages', type: 'income', icon: 'briefcase', color: '#10B981' },
      { id: `cat_inc_free_${userId}`, name: 'Freelance & Side Gig', type: 'income', icon: 'laptop', color: '#059669' },
      { id: `cat_house_${userId}`, name: 'Housing & Rent', type: 'expense', icon: 'home', color: '#6366F1' },
      { id: `cat_groc_${userId}`, name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#14B8A6' },
      { id: `cat_din_${userId}`, name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B' },
      { id: `cat_trans_${userId}`, name: 'Transportation', type: 'expense', icon: 'car', color: '#3B82F6' },
      { id: `cat_util_${userId}`, name: 'Utilities & Bills', type: 'expense', icon: 'zap', color: '#EAB308' },
      { id: `cat_subs_${userId}`, name: 'Subscriptions', type: 'expense', icon: 'tv', color: '#8B5CF6' },
      { id: `cat_ent_${userId}`, name: 'Entertainment', type: 'expense', icon: 'film', color: '#EC4899' },
      { id: `cat_health_${userId}`, name: 'Health & Fitness', type: 'expense', icon: 'activity', color: '#EF4444' }
    ];

    for (const c of defaultCategories) {
      await query.run(
        `INSERT INTO categories (id, user_id, name, type, icon, color, is_custom) VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [c.id, userId, c.name, c.type, c.icon, c.color]
      );
    }

    // Create a clean starter checking account with zero balance
    await query.run(
      `INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon)
       VALUES (?, ?, ?, 'checking', 0.00, ?, '#3B82F6', 'landmark')`,
      [`acc_chk_${userId}`, userId, 'Primary Checking', baseCurrency || 'USD']
    );

    const user = { id: userId, email: email.toLowerCase(), name, base_currency: baseCurrency || 'USD' };
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await query.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password_hash, anthropic_api_key, ...safeUser } = user;

    res.json({
      token,
      user: safeUser,
      hasCustomApiKey: Boolean(anthropic_api_key)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// One-click Instant Demo Login
router.post('/demo-login', async (req, res) => {
  try {
    let demoUser = await query.get(`SELECT * FROM users WHERE email = 'demo@fintrack.ai'`);
    if (!demoUser) {
      await seedDatabase();
      demoUser = await query.get(`SELECT * FROM users WHERE email = 'demo@fintrack.ai'`);
    }

    const token = generateToken(demoUser);
    const { password_hash, ...safeUser } = demoUser;

    res.json({
      token,
      user: safeUser,
      isDemo: true
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Failed to authenticate demo user' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await query.get(
      `SELECT id, email, name, base_currency, dark_mode, anthropic_api_key, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { anthropic_api_key, ...safeUser } = user;
    res.json({
      user: safeUser,
      hasCustomApiKey: Boolean(anthropic_api_key)
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

// Reset demo data endpoint
router.post('/reset-demo', authenticateToken, async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Demo environment reset to pristine default state.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

export default router;
