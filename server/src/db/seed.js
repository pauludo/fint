import bcrypt from 'bcryptjs';
import { query, initDb } from './database.js';

export async function seedDatabase() {
  await initDb();

  console.log('Seeding demo data...');

  // 1. Create Default Demo User
  const demoUserId = 'usr_demo_fintech_2026';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  await query.run(
    `INSERT OR REPLACE INTO users (id, email, password_hash, name, base_currency, dark_mode)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'demo@fintrack.ai', passwordHash, 'Alex Morgan', 'USD', 1]
  );

  // 2. Clear old data for demo user
  await query.run(`DELETE FROM accounts WHERE user_id = ?`, [demoUserId]);
  await query.run(`DELETE FROM categories WHERE user_id = ?`, [demoUserId]);
  await query.run(`DELETE FROM transactions WHERE user_id = ?`, [demoUserId]);
  await query.run(`DELETE FROM budgets WHERE user_id = ?`, [demoUserId]);
  await query.run(`DELETE FROM goals WHERE user_id = ?`, [demoUserId]);
  await query.run(`DELETE FROM subscriptions WHERE user_id = ?`, [demoUserId]);
  await query.run(`DELETE FROM ai_insights WHERE user_id = ?`, [demoUserId]);

  // 3. Default System Categories
  const categories = [
    { id: 'cat_income_salary', name: 'Salary & Wages', type: 'income', icon: 'briefcase', color: '#10B981' },
    { id: 'cat_income_freelance', name: 'Freelance & Side Gig', type: 'income', icon: 'laptop', color: '#059669' },
    { id: 'cat_income_invest', name: 'Dividends & Interest', type: 'income', icon: 'trending-up', color: '#34D399' },
    { id: 'cat_housing', name: 'Housing & Rent', type: 'expense', icon: 'home', color: '#6366F1' },
    { id: 'cat_groceries', name: 'Groceries & Supermarket', type: 'expense', icon: 'shopping-cart', color: '#14B8A6' },
    { id: 'cat_dining', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B' },
    { id: 'cat_transport', name: 'Transportation & Gas', type: 'expense', icon: 'car', color: '#3B82F6' },
    { id: 'cat_utilities', name: 'Utilities & Bills', type: 'expense', icon: 'zap', color: '#EAB308' },
    { id: 'cat_subscriptions', name: 'Digital Subscriptions', type: 'expense', icon: 'tv', color: '#8B5CF6' },
    { id: 'cat_entertainment', name: 'Entertainment & Leisure', type: 'expense', icon: 'film', color: '#EC4899' },
    { id: 'cat_health', name: 'Health & Fitness', type: 'expense', icon: 'activity', color: '#EF4444' },
    { id: 'cat_shopping', name: 'Shopping & Retail', type: 'expense', icon: 'shopping-bag', color: '#F97316' },
    { id: 'cat_travel', name: 'Travel & Vacation', type: 'expense', icon: 'plane', color: '#06B6D4' },
    { id: 'cat_personal', name: 'Personal Care', type: 'expense', icon: 'smile', color: '#A855F7' }
  ];

  for (const cat of categories) {
    await query.run(
      `INSERT INTO categories (id, user_id, name, type, icon, color, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [cat.id, demoUserId, cat.name, cat.type, cat.icon, cat.color]
    );
  }

  // 4. Accounts
  const accounts = [
    {
      id: 'acc_checking',
      name: 'Chase Premier Checking',
      type: 'checking',
      balance: 4850.25,
      currency: 'USD',
      color: '#3B82F6',
      icon: 'landmark',
      institution: 'Chase Bank',
      account_number_last4: '4821'
    },
    {
      id: 'acc_savings',
      name: 'Marcus High-Yield Savings',
      type: 'savings',
      balance: 18450.00,
      currency: 'USD',
      color: '#10B981',
      icon: 'vault',
      institution: 'Goldman Sachs',
      account_number_last4: '9012'
    },
    {
      id: 'acc_credit',
      name: 'Amex Gold Card',
      type: 'credit',
      balance: -1245.80,
      currency: 'USD',
      color: '#F59E0B',
      icon: 'credit-card',
      institution: 'American Express',
      account_number_last4: '3004'
    },
    {
      id: 'acc_cash',
      name: 'Cash Wallet',
      type: 'cash',
      balance: 320.00,
      currency: 'USD',
      color: '#64748B',
      icon: 'wallet',
      institution: 'Physical Cash',
      account_number_last4: '0000'
    }
  ];

  for (const acc of accounts) {
    await query.run(
      `INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon, institution, account_number_last4)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [acc.id, demoUserId, acc.name, acc.type, acc.balance, acc.currency, acc.color, acc.icon, acc.institution, acc.account_number_last4]
    );
  }

  // 5. Generate Dates for 3 months (Current month, M-1, M-2)
  const now = new Date();
  const getMonthStr = (offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonth = getMonthStr(0);
  const prevMonth1 = getMonthStr(1);
  const prevMonth2 = getMonthStr(2);

  // 6. Realistic Transactions
  const rawTransactions = [
    // --- Current Month (Month 0) ---
    { d: 1, acc: 'acc_checking', amt: 4200.00, type: 'income', cat: 'cat_income_salary', m: 'TechCorp Global Inc.', n: 'Bi-weekly Direct Deposit Payroll', rec: 1 },
    { d: 1, acc: 'acc_checking', amt: 1750.00, type: 'expense', cat: 'cat_housing', m: 'Avalon Bay Properties', n: 'Monthly Apartment Rent', rec: 1 },
    { d: 2, acc: 'acc_credit', amt: 14.99, type: 'expense', cat: 'cat_subscriptions', m: 'Spotify Premium', n: 'Family plan subscription', rec: 1 },
    { d: 3, acc: 'acc_credit', amt: 84.50, type: 'expense', cat: 'cat_groceries', m: 'Trader Joe’s', n: 'Weekly fresh produce & essentials' },
    { d: 4, acc: 'acc_credit', amt: 32.40, type: 'expense', cat: 'cat_dining', m: 'Sweetgreen', n: 'Salad lunch with coworker' },
    { d: 5, acc: 'acc_credit', amt: 20.00, type: 'expense', cat: 'cat_subscriptions', m: 'OpenAI ChatGPT Plus', n: 'AI Pro workspace', rec: 1 },
    { d: 6, acc: 'acc_checking', amt: 45.00, type: 'expense', cat: 'cat_transport', m: 'Chevron Gas Station', n: 'Fuel refill' },
    { d: 7, acc: 'acc_credit', amt: 125.80, type: 'expense', cat: 'cat_dining', m: 'Nobu Japanese Bistro', n: 'Weekend celebratory dinner' },
    { d: 8, acc: 'acc_checking', amt: 95.00, type: 'expense', cat: 'cat_utilities', m: 'ConEdison Electric', n: 'Electric & Gas utility bill', rec: 1 },
    { d: 9, acc: 'acc_credit', amt: 65.00, type: 'expense', cat: 'cat_health', m: 'Equinox Fitness Club', n: 'Monthly gym membership', rec: 1 },
    { d: 10, acc: 'acc_credit', amt: 142.30, type: 'expense', cat: 'cat_groceries', m: 'Whole Foods Market', n: 'Organic groceries & snacks' },
    { d: 11, acc: 'acc_credit', amt: 18.50, type: 'expense', cat: 'cat_dining', m: 'Blue Bottle Coffee', n: 'Espresso & pastry' },
    { d: 12, acc: 'acc_credit', amt: 79.99, type: 'expense', cat: 'cat_shopping', m: 'Amazon.com', n: 'Ergonomic mouse & desk cable organizer' },
    { d: 13, acc: 'acc_checking', amt: 650.00, type: 'income', cat: 'cat_income_freelance', m: 'Design Sprint Studio', n: 'Frontend consulting milestone' },
    { d: 14, acc: 'acc_credit', amt: 22.99, type: 'expense', cat: 'cat_subscriptions', m: 'Netflix 4K HDR', n: 'Monthly streaming plan', rec: 1 },
    { d: 15, acc: 'acc_checking', amt: 4200.00, type: 'income', cat: 'cat_income_salary', m: 'TechCorp Global Inc.', n: 'Bi-weekly Direct Deposit Payroll', rec: 1 },
    { d: 16, acc: 'acc_credit', amt: 54.20, type: 'expense', cat: 'cat_dining', m: 'Chipotle Mexican Grill', n: 'Dinner takeout for two' },
    { d: 17, acc: 'acc_credit', amt: 35.00, type: 'expense', cat: 'cat_entertainment', m: 'AMC Theatres IMAX', n: 'Movie premiere tickets' },
    { d: 18, acc: 'acc_credit', amt: 110.00, type: 'expense', cat: 'cat_groceries', m: 'Costco Wholesale', n: 'Household bulk supplies' },
    { d: 19, acc: 'acc_checking', amt: 75.00, type: 'expense', cat: 'cat_utilities', m: 'Verizon Fios Fiber', n: 'Gigabit home internet', rec: 1 },
    { d: 20, acc: 'acc_credit', amt: 24.50, type: 'expense', cat: 'cat_transport', m: 'Uber Technologies', n: 'Ride to downtown meeting' },
    { d: 21, acc: 'acc_credit', amt: 88.00, type: 'expense', cat: 'cat_personal', m: 'Sephora Skincare', n: 'Moisturizer & grooming supplies' },
    { d: 22, acc: 'acc_credit', amt: 48.90, type: 'expense', cat: 'cat_dining', m: 'Ramen Tatsu-Ya', n: 'Tonkotsu ramen dinner' },
    { d: 23, acc: 'acc_savings', amt: 72.40, type: 'income', cat: 'cat_income_invest', m: 'Marcus Goldman Sachs', n: 'High-yield savings monthly interest', rec: 1 },

    // --- Previous Month (Month -1) ---
    { m_off: 1, d: 1, acc: 'acc_checking', amt: 4200.00, type: 'income', cat: 'cat_income_salary', m: 'TechCorp Global Inc.', n: 'Bi-weekly Payroll', rec: 1 },
    { m_off: 1, d: 1, acc: 'acc_checking', amt: 1750.00, type: 'expense', cat: 'cat_housing', m: 'Avalon Bay Properties', n: 'Monthly Rent', rec: 1 },
    { m_off: 1, d: 2, acc: 'acc_credit', amt: 14.99, type: 'expense', cat: 'cat_subscriptions', m: 'Spotify Premium', n: 'Subscription', rec: 1 },
    { m_off: 1, d: 3, acc: 'acc_credit', amt: 112.40, type: 'expense', cat: 'cat_groceries', m: 'Trader Joe’s', n: 'Weekly groceries' },
    { m_off: 1, d: 5, acc: 'acc_credit', amt: 20.00, type: 'expense', cat: 'cat_subscriptions', m: 'OpenAI ChatGPT Plus', n: 'AI workspace', rec: 1 },
    { m_off: 1, d: 7, acc: 'acc_checking', amt: 88.50, type: 'expense', cat: 'cat_utilities', m: 'ConEdison Electric', n: 'Utility bill', rec: 1 },
    { m_off: 1, d: 8, acc: 'acc_credit', amt: 65.00, type: 'expense', cat: 'cat_health', m: 'Equinox Fitness Club', n: 'Gym membership', rec: 1 },
    { m_off: 1, d: 9, acc: 'acc_credit', amt: 94.20, type: 'expense', cat: 'cat_dining', m: 'Osteria Italian Grill', n: 'Dinner with friends' },
    { m_off: 1, d: 12, acc: 'acc_credit', amt: 135.00, type: 'expense', cat: 'cat_groceries', m: 'Whole Foods Market', n: 'Weekly groceries' },
    { m_off: 1, d: 14, acc: 'acc_credit', amt: 22.99, type: 'expense', cat: 'cat_subscriptions', m: 'Netflix 4K HDR', n: 'Streaming', rec: 1 },
    { m_off: 1, d: 15, acc: 'acc_checking', amt: 4200.00, type: 'income', cat: 'cat_income_salary', m: 'TechCorp Global Inc.', n: 'Bi-weekly Payroll', rec: 1 },
    { m_off: 1, d: 16, acc: 'acc_checking', amt: 75.00, type: 'expense', cat: 'cat_utilities', m: 'Verizon Fios', n: 'Internet', rec: 1 },
    { m_off: 1, d: 18, acc: 'acc_credit', amt: 245.00, type: 'expense', cat: 'cat_shopping', m: 'Nordstrom', n: 'Autumn jacket & shoes' },
    { m_off: 1, d: 20, acc: 'acc_credit', amt: 58.00, type: 'expense', cat: 'cat_transport', m: 'Chevron Gas', n: 'Gas' },
    { m_off: 1, d: 22, acc: 'acc_credit', amt: 165.40, type: 'expense', cat: 'cat_dining', m: 'Steakhouse 44', n: 'Team dinner' },
    { m_off: 1, d: 25, acc: 'acc_credit', amt: 89.00, type: 'expense', cat: 'cat_entertainment', m: 'Ticketmaster Concert', n: 'Indie concert tickets' },
    { m_off: 1, d: 28, acc: 'acc_savings', amt: 71.80, type: 'income', cat: 'cat_income_invest', m: 'Marcus Goldman Sachs', n: 'Savings interest', rec: 1 },

    // --- Month -2 ---
    { m_off: 2, d: 1, acc: 'acc_checking', amt: 4200.00, type: 'income', cat: 'cat_income_salary', m: 'TechCorp Global Inc.', n: 'Bi-weekly Payroll', rec: 1 },
    { m_off: 2, d: 1, acc: 'acc_checking', amt: 1750.00, type: 'expense', cat: 'cat_housing', m: 'Avalon Bay Properties', n: 'Rent', rec: 1 },
    { m_off: 2, d: 2, acc: 'acc_credit', amt: 14.99, type: 'expense', cat: 'cat_subscriptions', m: 'Spotify Premium', n: 'Subscription', rec: 1 },
    { m_off: 2, d: 4, acc: 'acc_credit', amt: 120.00, type: 'expense', cat: 'cat_groceries', m: 'Trader Joe’s', n: 'Groceries' },
    { m_off: 2, d: 5, acc: 'acc_credit', amt: 20.00, type: 'expense', cat: 'cat_subscriptions', m: 'OpenAI ChatGPT Plus', n: 'AI workspace', rec: 1 },
    { m_off: 2, d: 7, acc: 'acc_checking', amt: 92.00, type: 'expense', cat: 'cat_utilities', m: 'ConEdison Electric', n: 'Electricity', rec: 1 },
    { m_off: 2, d: 8, acc: 'acc_credit', amt: 65.00, type: 'expense', cat: 'cat_health', m: 'Equinox Fitness Club', n: 'Gym', rec: 1 },
    { m_off: 2, d: 11, acc: 'acc_credit', amt: 85.00, type: 'expense', cat: 'cat_dining', m: 'Bar Harbor Seafood', n: 'Dinner' },
    { m_off: 2, d: 14, acc: 'acc_credit', amt: 22.99, type: 'expense', cat: 'cat_subscriptions', m: 'Netflix 4K HDR', n: 'Streaming', rec: 1 },
    { m_off: 2, d: 15, acc: 'acc_checking', amt: 4200.00, type: 'income', cat: 'cat_income_salary', m: 'TechCorp Global Inc.', n: 'Bi-weekly Payroll', rec: 1 },
    { m_off: 2, d: 17, acc: 'acc_checking', amt: 800.00, type: 'income', cat: 'cat_income_freelance', m: 'Alpha Labs UI', n: 'Design sprint' },
    { m_off: 2, d: 18, acc: 'acc_checking', amt: 75.00, type: 'expense', cat: 'cat_utilities', m: 'Verizon Fios', n: 'Fiber internet', rec: 1 },
    { m_off: 2, d: 20, acc: 'acc_credit', amt: 148.00, type: 'expense', cat: 'cat_groceries', m: 'Whole Foods Market', n: 'Groceries' },
    { m_off: 2, d: 24, acc: 'acc_credit', amt: 450.00, type: 'expense', cat: 'cat_travel', m: 'Delta Air Lines', n: 'Flight tickets to conference' },
    { m_off: 2, d: 28, acc: 'acc_savings', amt: 70.10, type: 'income', cat: 'cat_income_invest', m: 'Marcus Goldman Sachs', n: 'Savings interest', rec: 1 }
  ];

  let txIndex = 1;
  for (const t of rawTransactions) {
    const offset = t.m_off || 0;
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, Math.min(t.d, 28));
    const dateStr = targetDate.toISOString().split('T')[0];
    const txId = `tx_${offset}_${txIndex++}`;

    await query.run(
      `INSERT INTO transactions (id, user_id, account_id, date, amount, type, category_id, merchant, notes, is_recurring, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted')`,
      [txId, demoUserId, t.acc, dateStr, t.amt, t.type, t.cat, t.m, t.n || '', t.rec || 0]
    );
  }

  // 7. Monthly Budgets for Current & Previous Month
  const budgetLimits = [
    { cat: 'cat_housing', limit: 1800, rollover: 0 },
    { cat: 'cat_groceries', limit: 550, rollover: 1 },
    { cat: 'cat_dining', limit: 350, rollover: 0 },
    { cat: 'cat_transport', limit: 200, rollover: 1 },
    { cat: 'cat_utilities', limit: 200, rollover: 0 },
    { cat: 'cat_subscriptions', limit: 100, rollover: 0 },
    { cat: 'cat_entertainment', limit: 150, rollover: 1 },
    { cat: 'cat_shopping', limit: 250, rollover: 0 },
    { cat: 'cat_health', limit: 120, rollover: 0 },
    { cat: 'cat_personal', limit: 100, rollover: 0 }
  ];

  for (const b of budgetLimits) {
    // Current month
    await query.run(
      `INSERT INTO budgets (id, user_id, category_id, month, limit_amount, rollover_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`bgt_${currentMonth}_${b.cat}`, demoUserId, b.cat, currentMonth, b.limit, b.rollover]
    );
    // Prev month
    await query.run(
      `INSERT INTO budgets (id, user_id, category_id, month, limit_amount, rollover_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`bgt_${prevMonth1}_${b.cat}`, demoUserId, b.cat, prevMonth1, b.limit, b.rollover]
    );
  }

  // 8. Subscriptions
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const next2Weeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().split('T')[0];

  const subscriptions = [
    {
      id: 'sub_netflix',
      name: 'Netflix 4K Premium',
      amount: 22.99,
      billing_cycle: 'monthly',
      cat: 'cat_subscriptions',
      acc: 'acc_credit',
      next: nextWeek,
      remind: 3,
      notes: 'Entertainment family plan'
    },
    {
      id: 'sub_spotify',
      name: 'Spotify Family',
      amount: 14.99,
      billing_cycle: 'monthly',
      cat: 'cat_subscriptions',
      acc: 'acc_credit',
      next: next2Weeks,
      remind: 3,
      notes: 'Music & Podcasts'
    },
    {
      id: 'sub_openai',
      name: 'OpenAI ChatGPT Plus',
      amount: 20.00,
      billing_cycle: 'monthly',
      cat: 'cat_subscriptions',
      acc: 'acc_credit',
      next: nextMonthDate,
      remind: 2,
      notes: 'Coding and productivity assistant'
    },
    {
      id: 'sub_gym',
      name: 'Equinox Gym Membership',
      amount: 65.00,
      billing_cycle: 'monthly',
      cat: 'cat_health',
      acc: 'acc_credit',
      next: nextWeek,
      remind: 5,
      notes: 'Tier 1 club access'
    },
    {
      id: 'sub_cloud',
      name: 'iCloud 2TB Storage',
      amount: 9.99,
      billing_cycle: 'monthly',
      cat: 'cat_subscriptions',
      acc: 'acc_credit',
      next: nextMonthDate,
      remind: 1,
      notes: 'Family backup storage'
    },
    {
      id: 'sub_github',
      name: 'GitHub Copilot Individual',
      amount: 10.00,
      billing_cycle: 'monthly',
      cat: 'cat_subscriptions',
      acc: 'acc_credit',
      next: next2Weeks,
      remind: 3,
      notes: 'Developer tools'
    }
  ];

  for (const s of subscriptions) {
    await query.run(
      `INSERT INTO subscriptions (id, user_id, name, amount, billing_cycle, category_id, account_id, next_renewal_date, reminder_days, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, demoUserId, s.name, s.amount, s.billing_cycle, s.cat, s.acc, s.next, s.remind, s.notes]
    );
  }

  // 9. Goals (Savings + Debt Payoff)
  const goals = [
    {
      id: 'goal_emergency',
      name: '6-Month Emergency Reserve',
      target: 25000.00,
      current: 18450.00,
      target_date: `${now.getFullYear() + 1}-06-30`,
      type: 'savings',
      acc: 'acc_savings',
      color: '#10B981',
      icon: 'shield-check'
    },
    {
      id: 'goal_vacation',
      name: 'Tokyo & Kyoto Vacation 2027',
      target: 4500.00,
      current: 2150.00,
      target_date: `${now.getFullYear() + 1}-04-15`,
      type: 'savings',
      acc: 'acc_checking',
      color: '#3B82F6',
      icon: 'plane'
    },
    {
      id: 'goal_debt_payoff',
      name: 'Amex Card Zero-Balance Payoff',
      target: 3500.00,
      current: 2254.20, // Paid down amount
      target_date: `${now.getFullYear()}-12-31`,
      type: 'debt',
      acc: 'acc_credit',
      interest_rate: 19.99,
      min_payment: 120.00,
      color: '#F59E0B',
      icon: 'credit-card'
    }
  ];

  for (const g of goals) {
    await query.run(
      `INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, type, account_id, interest_rate, minimum_payment, color, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, demoUserId, g.name, g.target, g.current, g.target_date, g.type, g.acc, g.interest_rate || 0, g.min_payment || 0, g.color, g.icon]
    );
  }

  // 10. AI Proactive Insights & Anomaly Alerts
  const insights = [
    {
      id: 'ins_1',
      type: 'budget_warning',
      title: 'Food & Dining is at 78% of budget',
      description: 'You have spent $273.70 of your $350.00 dining budget with 14 days remaining in the month. Consider cooking 2 extra meals this week to stay on target.',
      impact_level: 'high',
      category_id: 'cat_dining'
    },
    {
      id: 'ins_2',
      type: 'saving_opportunity',
      title: 'High recurring digital subscription burn',
      description: 'You are currently spending $142.97/month across 6 active recurring services. Consolidating or pausing unused subscriptions could save up to $359/year.',
      impact_level: 'medium',
      category_id: 'cat_subscriptions'
    },
    {
      id: 'ins_3',
      type: 'milestone',
      title: 'Emergency Fund 74% Complete!',
      description: 'You are just $6,550 away from your 6-month safety net goal. At your current average monthly savings rate of $820, you will reach full security by January.',
      impact_level: 'low',
      category_id: null
    },
    {
      id: 'ins_4',
      type: 'anomaly',
      title: 'Unusual restaurant charge detected',
      description: 'Your $125.80 charge at Nobu Japanese Bistro is 214% higher than your typical median restaurant spend of $40.00.',
      impact_level: 'medium',
      category_id: 'cat_dining'
    }
  ];

  for (const ins of insights) {
    await query.run(
      `INSERT INTO ai_insights (id, user_id, type, title, description, impact_level, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ins.id, demoUserId, ins.type, ins.title, ins.description, ins.impact_level, ins.category_id]
    );
  }

  console.log('✅ Demo data successfully seeded for demo@fintrack.ai');
}

// Auto-run if executed directly
if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
