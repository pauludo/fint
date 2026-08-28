import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Get transactions with search, filtering, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'DESC',
      limit = 100,
      offset = 0
    } = req.query;

    let whereConditions = ['t.user_id = ?'];
    let params = [req.user.id];

    if (search && search.trim()) {
      whereConditions.push('(t.merchant LIKE ? OR t.notes LIKE ? OR t.tags LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (accountId) {
      whereConditions.push('t.account_id = ?');
      params.push(accountId);
    }

    if (categoryId) {
      whereConditions.push('t.category_id = ?');
      params.push(categoryId);
    }

    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      whereConditions.push('t.type = ?');
      params.push(type);
    }

    if (startDate) {
      whereConditions.push('t.date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('t.date <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Count total
    const countResult = await query.get(
      `SELECT COUNT(t.id) as total FROM transactions t WHERE ${whereClause}`,
      params
    );

    // Allowed sort columns
    const allowedSorts = {
      date: 't.date',
      amount: 't.amount',
      merchant: 't.merchant',
      created_at: 't.created_at'
    };
    const sortCol = allowedSorts[sortBy] || 't.date';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT t.*,
             a.name as account_name, a.type as account_type, a.color as account_color,
             c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${orderDir}, t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const transactions = await query.all(sql, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      total: countResult?.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      transactions
    });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create single transaction
router.post('/', async (req, res) => {
  try {
    const { account_id, date, amount, type, category_id, merchant, notes, is_recurring, tags, status } = req.body;

    if (!account_id || !date || amount === undefined || !merchant || !type) {
      return res.status(400).json({ error: 'Account, date, amount, merchant, and type are required.' });
    }

    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const parsedAmount = Math.abs(parseFloat(amount));

    await query.run(
      `INSERT INTO transactions (id, user_id, account_id, date, amount, type, category_id, merchant, notes, is_recurring, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        account_id,
        date,
        parsedAmount,
        type,
        category_id || null,
        merchant,
        notes || '',
        is_recurring ? 1 : 0,
        tags || '',
        status || 'posted'
      ]
    );

    // Update account balance
    const delta = type === 'income' ? parsedAmount : -parsedAmount;
    await query.run(`UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?`, [delta, account_id, req.user.id]);

    const created = await query.get(
      `SELECT t.*,
              a.name as account_name, a.color as account_color,
              c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    res.status(201).json(created);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update single transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { account_id, date, amount, type, category_id, merchant, notes, is_recurring, tags, status } = req.body;

    const existing = await query.get(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const newAmount = amount !== undefined ? Math.abs(parseFloat(amount)) : existing.amount;
    const newType = type || existing.type;
    const newAccountId = account_id || existing.account_id;

    // Revert old account balance effect
    const oldDelta = existing.type === 'income' ? -existing.amount : existing.amount;
    await query.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [oldDelta, existing.account_id]);

    // Apply new account balance effect
    const newDelta = newType === 'income' ? newAmount : -newAmount;
    await query.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [newDelta, newAccountId]);

    await query.run(
      `UPDATE transactions
       SET account_id = ?, date = ?, amount = ?, type = ?, category_id = ?, merchant = ?, notes = ?, is_recurring = ?, tags = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        newAccountId,
        date ?? existing.date,
        newAmount,
        newType,
        category_id !== undefined ? category_id : existing.category_id,
        merchant ?? existing.merchant,
        notes ?? existing.notes,
        is_recurring !== undefined ? (is_recurring ? 1 : 0) : existing.is_recurring,
        tags ?? existing.tags,
        status ?? existing.status,
        id,
        req.user.id
      ]
    );

    const updated = await query.get(
      `SELECT t.*,
              a.name as account_name, a.color as account_color,
              c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete single transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query.get(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Revert account balance effect
    const delta = existing.type === 'income' ? -existing.amount : existing.amount;
    await query.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [delta, existing.account_id]);

    await query.run(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [id, req.user.id]);

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Bulk Delete transactions
router.post('/bulk-delete', async (req, res) => {
  try {
    const { transactionIds } = req.body;
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'Array of transactionIds required' });
    }

    for (const id of transactionIds) {
      const tx = await query.get(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
      if (tx) {
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        await query.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [delta, tx.account_id]);
        await query.run(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [id, req.user.id]);
      }
    }

    res.json({ success: true, count: transactionIds.length });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Failed to delete selected transactions' });
  }
});

// Bulk Recategorize transactions
router.post('/bulk-recategorize', async (req, res) => {
  try {
    const { transactionIds, categoryId } = req.body;
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ error: 'Array of transactionIds required' });
    }

    const placeholders = transactionIds.map(() => '?').join(',');
    await query.run(
      `UPDATE transactions SET category_id = ? WHERE id IN (${placeholders}) AND user_id = ?`,
      [categoryId || null, ...transactionIds, req.user.id]
    );

    res.json({ success: true, count: transactionIds.length });
  } catch (err) {
    console.error('Bulk recategorize error:', err);
    res.status(500).json({ error: 'Failed to recategorize transactions' });
  }
});

// CSV Import
router.post('/import-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const { defaultAccountId } = req.body;
    if (!defaultAccountId) {
      return res.status(400).json({ error: 'defaultAccountId required for CSV import' });
    }

    const categories = await query.all(`SELECT id, name FROM categories WHERE user_id = ? OR user_id IS NULL`, [req.user.id]);
    const categoryMap = {};
    for (const c of categories) {
      categoryMap[c.name.toLowerCase()] = c.id;
    }

    const results = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csvParser())
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        let importedCount = 0;

        for (const row of results) {
          // Normalize column names
          const keys = Object.keys(row);
          const getVal = (possibleKeys) => {
            const foundKey = keys.find(k => possibleKeys.some(pk => k.toLowerCase().includes(pk)));
            return foundKey ? row[foundKey] : null;
          };

          const rawDate = getVal(['date', 'posted', 'time']);
          const rawAmount = getVal(['amount', 'price', 'total', 'debit', 'credit']);
          const rawMerchant = getVal(['description', 'merchant', 'payee', 'name', 'memo']) || 'Imported Transaction';
          const rawCategory = getVal(['category', 'type', 'tag']);

          if (!rawAmount) continue;

          let amount = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, ''));
          if (isNaN(amount)) continue;

          let type = amount < 0 ? 'expense' : 'income';
          let absAmount = Math.abs(amount);

          let parsedDate = new Date().toISOString().split('T')[0];
          if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              parsedDate = d.toISOString().split('T')[0];
            }
          }

          let matchedCatId = null;
          if (rawCategory) {
            const catLower = rawCategory.toLowerCase();
            for (const [name, id] of Object.entries(categoryMap)) {
              if (catLower.includes(name) || name.includes(catLower)) {
                matchedCatId = id;
                break;
              }
            }
          }

          const txId = `tx_csv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          await query.run(
            `INSERT INTO transactions (id, user_id, account_id, date, amount, type, category_id, merchant, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Imported via CSV', 'posted')`,
            [txId, req.user.id, defaultAccountId, parsedDate, absAmount, type, matchedCatId, rawMerchant.trim()]
          );

          const delta = type === 'income' ? absAmount : -absAmount;
          await query.run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [delta, defaultAccountId]);
          importedCount++;
        }

        res.json({
          success: true,
          importedCount,
          totalRows: results.length,
          message: `Successfully imported ${importedCount} transactions.`
        });
      });
  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// CSV Export
router.get('/export-csv', async (req, res) => {
  try {
    const { startDate, endDate, accountId } = req.query;
    let whereConditions = ['t.user_id = ?'];
    let params = [req.user.id];

    if (startDate) {
      whereConditions.push('t.date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('t.date <= ?');
      params.push(endDate);
    }
    if (accountId) {
      whereConditions.push('t.account_id = ?');
      params.push(accountId);
    }

    const transactions = await query.all(
      `SELECT t.date, t.merchant, t.amount, t.type, c.name as category, a.name as account, t.notes
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY t.date DESC`,
      params
    );

    let csv = 'Date,Merchant,Amount,Type,Category,Account,Notes\n';
    for (const t of transactions) {
      csv += `"${t.date}","${(t.merchant || '').replace(/"/g, '""')}",${t.amount},"${t.type}","${t.category || ''}","${t.account || ''}","${(t.notes || '').replace(/"/g, '""')}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

export default router;
