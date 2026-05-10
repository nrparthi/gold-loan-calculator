require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const os = require('os');
const { google } = require('googleapis');
const cloudinary = require('cloudinary').v2;
const db = require('./db');

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const publicId = `${folder}/${filename.replace(/\.[^.]+$/, '')}`;
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'auto', overwrite: true },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });
};

// ── Google Drive helpers ──────────────────────────────────────────────────────
const TOKENS_FILE = path.join(__dirname, 'google_tokens.json');
const DRIVE_CFG_FILE = path.join(__dirname, 'drive_config.json');

const getOAuthClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/api/auth/google/callback`
);

const loadTokens = () => {
  if (!fs.existsSync(TOKENS_FILE)) return null;
  return JSON.parse(fs.readFileSync(TOKENS_FILE));
};

const getAuthorizedDrive = () => {
  const tokens = loadTokens();
  if (!tokens) return null;
  const auth = getOAuthClient();
  auth.setCredentials(tokens);
  auth.on('tokens', (t) => {
    const saved = loadTokens() || {};
    fs.writeFileSync(TOKENS_FILE, JSON.stringify({ ...saved, ...t }));
  });
  return google.drive({ version: 'v3', auth });
};

const getDriveConfig = () => {
  if (!fs.existsSync(DRIVE_CFG_FILE)) return {};
  return JSON.parse(fs.readFileSync(DRIVE_CFG_FILE));
};

// Find or create a folder inside a parent
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", process.env.BASE_URL || "*"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use('/api/', limiter);
app.use(express.json());

// Configure Multer — use memory storage so we can write to organized paths
const DEFAULT_UPLOADS_DIR = path.join(__dirname, 'uploads');
const upload = multer({ storage: multer.memoryStorage() });

// Serve default uploads dir first; then fall through to any custom branch storage paths
app.use('/uploads', express.static(DEFAULT_UPLOADS_DIR));
app.use('/uploads', async (req, res) => {
  try {
    const branches = await db.query('SELECT storage_path FROM branches WHERE storage_path IS NOT NULL');
    for (const row of branches.rows) {
      const filePath = path.join(row.storage_path, req.path);
      if (fs.existsSync(filePath)) return res.sendFile(filePath);
    }
  } catch (err) {
    console.error('Upload serve error:', err.message);
  }
  res.status(404).send('Not found');
});


// Database Initialization (Optional for Postgres as we usually run schema.sql)
// But I'll add a simple check to seed admin if empty
const initDb = async () => {
  try {
    // Add role column if not exists
    await db.query(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'branch'`);

    // Bank amount tracking columns
    await db.query(`ALTER TABLE loans ADD COLUMN IF NOT EXISTS bank_amount DECIMAL(12,2) DEFAULT 0`);
    await db.query(`ALTER TABLE loans ADD COLUMN IF NOT EXISTS bank_settled_amount DECIMAL(12,2) DEFAULT 0`);

    // Carry forward for partial interest payments
    await db.query(`ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS carry_forward DECIMAL(12,2) DEFAULT 0`);

    // Part payments log table
    await db.query(`CREATE TABLE IF NOT EXISTS part_payments (
      id VARCHAR(50) PRIMARY KEY,
      loan_id VARCHAR(50) REFERENCES loans(id) ON DELETE CASCADE,
      amount DECIMAL(12,2) NOT NULL,
      payment_date DATE,
      payment_mode VARCHAR(20) DEFAULT 'CASH',
      balance_after DECIMAL(12,2),
      is_foreclosure BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Seed or sync super admin credentials from env vars (skip if not configured)
    const saUsername = process.env.SUPER_ADMIN_USERNAME;
    const saPassword = process.env.SUPER_ADMIN_PASSWORD;
    if (saUsername && saPassword) {
      const saHash = await bcrypt.hash(saPassword, 10);
      const saExists = await db.query('SELECT id FROM branches WHERE role = $1', ['super_admin']);
      if (saExists.rows.length === 0) {
        await db.query(
          `INSERT INTO branches (id, username, password, branch_name, default_interest_rate, gold_rate, silver_rate, role) VALUES ($1, $2, $3, $4, 1.5, 8000, 100, 'super_admin')`,
          [Date.now().toString(), saUsername, saHash, 'Super Admin']
        );
        console.log(`Super admin created (username: ${saUsername})`);
      } else {
        await db.query(
          `UPDATE branches SET username = $1, password = $2 WHERE role = 'super_admin'`,
          [saUsername, saHash]
        );
        console.log(`Super admin credentials synced (username: ${saUsername})`);
      }
    } else {
      console.log('SUPER_ADMIN_USERNAME/PASSWORD not set — skipping super admin setup');
    }

    const res = await db.query("SELECT count(*) FROM branches WHERE role != 'super_admin'");
    if (parseInt(res.rows[0].count) === 0) {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminUsername && adminPassword) {
        const adminId = (Date.now() + 1).toString();
        const hash = await bcrypt.hash(adminPassword, 10);
        await db.query(
          `INSERT INTO branches (id, username, password, branch_name, default_interest_rate, gold_rate, silver_rate) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [adminId, adminUsername, hash, 'Main Branch', 1.5, 8000, 100]
        );
        console.log(`Default branch created (username: ${adminUsername})`);
        const defaults = [
          ['1', 'admin', 'CHAIN', 'GOLD'],
          ['2', 'admin', 'RING', 'GOLD'],
          ['3', 'admin', 'AARAM', 'GOLD'],
          ['4', 'admin', 'NECKLES', 'GOLD'],
          ['5', 'admin', 'BANGLES', 'GOLD'],
          ['6', 'admin', 'PLATE', 'SILVER'],
          ['7', 'admin', 'ANKLET', 'SILVER'],
          ['8', 'admin', 'COIN', 'SILVER']
        ];
        for (const d of defaults) {
          await db.query(`INSERT INTO ornaments_config (id, branch_id, name, metal_type) VALUES ($1, $2, $3, $4)`, d);
        }
      } else {
        console.log('ADMIN_USERNAME/PASSWORD not set — skipping default branch setup');
      }
    }
  } catch (err) {
    console.error('DB Init Error:', err);
  }
};
initDb();

// Routes

// 1. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query(`SELECT * FROM branches WHERE username = $1`, [username]);
    const row = result.rows[0];
    
    if (!row) return res.status(401).json({ error: 'Invalid username or password' });
    
    const isMatch = await bcrypt.compare(password, row.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });
    
    // Map snake_case to camelCase for frontend consistency
    const mappedData = {
      id: row.id,
      username: row.username,
      branchName: row.branch_name,
      defaultInterestRate: row.default_interest_rate,
      goldRate: row.gold_rate,
      silverRate: row.silver_rate,
      role: row.role || 'branch'
    };

    const token = jwt.sign({ id: row.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    res.json({ ...mappedData, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2a. Google Drive OAuth routes
app.get('/api/auth/google', (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return res.status(400).json({ error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in .env' });
  const url = getOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent'
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const auth = getOAuthClient();
    const { tokens } = await auth.getToken(req.query.code);
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens));
    res.send('<html><body><script>window.close();</script><p>Connected! You can close this window.</p></body></html>');
  } catch (err) {
    res.status(500).send('Authentication failed: ' + err.message);
  }
});

app.get('/api/auth/google/status', async (_req, res) => {
  const tokens = loadTokens();
  if (!tokens) return res.json({ connected: false });
  try {
    const auth = getOAuthClient();
    auth.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const info = await oauth2.userinfo.get();
    const cfg = getDriveConfig();
    res.json({ connected: true, email: info.data.email, folderId: cfg.folderId || '', folderName: cfg.folderName || '' });
  } catch {
    res.json({ connected: false });
  }
});

app.post('/api/auth/google/disconnect', (_req, res) => {
  if (fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE);
  if (fs.existsSync(DRIVE_CFG_FILE)) fs.unlinkSync(DRIVE_CFG_FILE);
  res.json({ message: 'Disconnected' });
});

// List Drive folders for folder picker
app.get('/api/auth/google/folders', async (req, res) => {
  const drive = getAuthorizedDrive();
  if (!drive) return res.status(401).json({ error: 'Not connected' });
  const parentId = req.query.parentId || 'root';
  try {
    const list = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id,name)',
      orderBy: 'name',
      spaces: 'drive'
    });
    res.json({ folders: list.data.files, parentId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google/folder', (req, res) => {
  const { folderId, folderName } = req.body;
  if (!folderId) return res.status(400).json({ error: 'folderId is required' });
  try {
    fs.writeFileSync(DRIVE_CFG_FILE, JSON.stringify({ folderId, folderName }));
    res.json({ message: 'Folder saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save folder config' });
  }
});

// 2b. Upload photo — tries Google Drive first, falls back to local storage
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { customerId, loanId, photoType } = req.query;
  const ext = path.extname(req.file.originalname) || '.jpg';
  const filename = (photoType === 'ornament')
    ? `ornament_${Date.now()}${ext}`
    : `${photoType || 'photo'}${ext}`;

  // Cloudinary upload
  try {
    const folder = loanId ? `gold-loans/${customerId || 'unknown'}/${loanId}` : `gold-loans/${customerId || 'unknown'}`;
    const url = await uploadToCloudinary(req.file.buffer, folder, filename);
    return res.json({ url, storage: 'cloudinary' });
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// 3. Get all loans for a specific branch (JOIN with Customers)
app.get('/api/loans', async (req, res) => {
  const { branchId, role } = req.query;
  const isSuperAdmin = role === 'super_admin';
  if (!branchId && !isSuperAdmin) return res.status(400).json({ error: 'branchId is required' });

  try {
    const result = isSuperAdmin
      ? await db.query(`
          SELECT l.*, c.name as customer_name, c.phone as customer_phone, c.address, c.gender, c.photo as customer_photo, c.aadhar_photo,
          b.branch_name,
          (SELECT COUNT(*) FROM interest_payments ip WHERE ip.loan_id = l.id AND ip.status != 'paid') as pending_count,
          (SELECT MIN(ip2.due_date) FROM interest_payments ip2 WHERE ip2.loan_id = l.id AND ip2.status != 'paid') as next_due_date
          FROM loans l
          LEFT JOIN customers c ON l.guardian_name = c.id
          LEFT JOIN branches b ON l.branch_id = b.id
          ORDER BY l.created_at DESC
        `)
      : await db.query(`
          SELECT l.*, c.name as customer_name, c.phone as customer_phone, c.address, c.gender, c.photo as customer_photo, c.aadhar_photo,
          (SELECT COUNT(*) FROM interest_payments ip WHERE ip.loan_id = l.id AND ip.status != 'paid') as pending_count,
          (SELECT MIN(ip2.due_date) FROM interest_payments ip2 WHERE ip2.loan_id = l.id AND ip2.status != 'paid') as next_due_date
          FROM loans l
          LEFT JOIN customers c ON l.guardian_name = c.id
          WHERE l.branch_id = $1
          ORDER BY l.created_at DESC
        `, [branchId]);
    
    const loans = result.rows.map(row => ({
      ...row,
      branchId: row.branch_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerId: row.guardian_name, 
      loanDate: row.loan_date,
      loanTime: row.loan_time,
      ornamentCategory: row.ornament_category,
      interestRate: row.interest_rate,
      processingFee: row.processing_fee,
      paymentMode: row.payment_mode,
      bankName: row.bank_name,
      loanAmount: row.loan_amount,
      amountGiven: row.amount_given,
      ornaments: row.ornaments,
      totalInterestPaid: row.total_interest_paid,
      monthlyInterest: row.monthly_interest,
      customerPhoto: row.customer_photo,
      aadharPhoto: row.aadhar_photo,
      ornamentPhoto: row.ornament_photo,
      bankLoanNumber: row.bank_loan_number,
      area: row.area,
      bankAmount: row.bank_amount,
      bankSettledAmount: row.bank_settled_amount,
      nextDueDate: row.next_due_date ? new Date(row.next_due_date).toISOString().split('T')[0] : null,
      branchName: row.branch_name || null
    }));
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.1 Get customer details by phone (From Customers Table)
app.get('/api/customers/history/:customerId', async (req, res) => {
  const { customerId } = req.params;
  try {
    // Match loans where BOTH guardian_name = customerId AND id starts with customerId
    const result = await db.query(`
      SELECT l.id, l.loan_date, l.loan_amount, l.amount_given, l.status, l.monthly_interest,
             l.total_interest_paid, l.processing_fee, l.ornament_category, l.ornaments,
             l.guardian_name
      FROM loans l
      WHERE l.guardian_name = $1
        AND l.id LIKE $2
      ORDER BY l.loan_date DESC
    `, [customerId, `${customerId}-%`]);
    res.json(result.rows.map(r => ({
      id: r.id,
      loanDate: r.loan_date,
      loanAmount: r.loan_amount,
      amountGiven: r.amount_given,
      status: r.status,
      monthlyInterest: r.monthly_interest,
      totalInterestPaid: r.total_interest_paid,
      processingFee: r.processing_fee,
      ornamentCategory: r.ornament_category,
      ornamentCount: Array.isArray(r.ornaments) ? r.ornaments.length : (r.ornaments ? JSON.parse(r.ornaments).length : 0)
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/customers/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const result = await db.query(
      'SELECT id as customer_id, name as customer_name, address, gender, photo as customer_photo, aadhar_photo FROM customers WHERE phone = $1',
      [phone]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.2 Get next loan number for a branch
app.get('/api/next-loan-number', async (req, res) => {
  const { branchId } = req.query;
  if (!branchId) return res.status(400).json({ error: 'branchId is required' });
  try {
    const result = await db.query('SELECT COUNT(*) FROM loans WHERE branch_id = $1', [branchId]);
    const nextNum = parseInt(result.rows[0].count) + 1;
    res.json({ nextLoanNumber: `L-${1000 + nextNum}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.3 Get interest payments for a loan
app.get('/api/loans/:id/interests', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM interest_payments WHERE loan_id = $1 ORDER BY due_date ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.4 Record a new interest payment
app.post('/api/interests/record', async (req, res) => {
  const { loanId, dueDate, amount, paidAmount, paymentMode, paymentDate } = req.body;
  if (!loanId || !dueDate || !amount) return res.status(400).json({ error: 'loanId, dueDate and amount are required' });
  const due = parseFloat(amount);
  const paid = parseFloat(paidAmount ?? amount); // paidAmount can be less than amount (partial)
  const carryForward = Math.max(0, due - paid);
  const status = carryForward > 0 ? 'partial' : 'paid';
  try {
    await db.query(`
      INSERT INTO interest_payments (loan_id, due_date, amount, status, paid_amount, payment_date, payment_mode, carry_forward)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [loanId, dueDate, due, status, paid, paymentDate || new Date().toISOString().split('T')[0], paymentMode || 'CASH', carryForward]);

    await db.query(`UPDATE loans SET total_interest_paid = total_interest_paid + $1 WHERE id = $2`, [paid, loanId]);

    res.json({ message: 'Payment recorded successfully', carryForward, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.5 Update existing payment (for legacy support if needed)
app.post('/api/interests/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { paidAmount, paymentDate, paymentMode } = req.body;
  try {
    const result = await db.query(`
      UPDATE interest_payments 
      SET paid_amount = $1, payment_date = $2, payment_mode = $3, status = 'paid'
      WHERE id = $4
      RETURNING loan_id, amount
    `, [paidAmount, paymentDate || new Date().toISOString().split('T')[0], paymentMode || 'CASH', id]);
    
    if (result.rows.length > 0) {
      const { loan_id, amount } = result.rows[0];
      await db.query(`UPDATE loans SET total_interest_paid = total_interest_paid + $1 WHERE id = $2`, [amount, loan_id]);
    }
    
    res.json({ message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create a new loan
app.post('/api/loans', async (req, res) => {
  const loan = req.body;
  if (!loan.branchId) return res.status(400).json({ error: 'branchId is required' });

  try {
    // 1. Manage Customer
    let customerId = loan.customerId;
    if (!customerId) {
      customerId = `C-${Date.now().toString().slice(-4)}${Math.random().toString(36).substring(2, 3).toUpperCase()}`;
    }

    // UPSERT Customer
    await db.query(`
      INSERT INTO customers (id, branch_id, name, phone, address, gender, photo, aadhar_photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        gender = EXCLUDED.gender,
        photo = EXCLUDED.photo,
        aadhar_photo = EXCLUDED.aadhar_photo
    `, [customerId, loan.branchId, loan.customerName, loan.customerPhone, loan.address, loan.gender, loan.customerPhoto, loan.aadharPhoto]);

    // Fetch the actual customer ID (ON CONFLICT keeps the existing ID, not the new one)
    const customerRow = await db.query('SELECT id FROM customers WHERE phone = $1', [loan.customerPhone]);
    const actualCustomerId = customerRow.rows[0]?.id || customerId;

    // 2. Determine Loan Number
    const countResult = await db.query('SELECT COUNT(*) FROM loans WHERE branch_id = $1', [loan.branchId]);
    const loanCount = parseInt(countResult.rows[0].count) + 1;
    const loanNumber = `L-${1000 + loanCount}`;
    const finalLoanId = `${actualCustomerId}-${loanNumber}`;

    // 3. Insert Loan (Simplified - only loan specific details)
    const query = `
      INSERT INTO loans (
        id, branch_id, guardian_name,
        loan_date, loan_time, ornament_category, interest_rate, processing_fee,
        payment_mode, bank_name, bank_loan_number, area, loan_amount, amount_given, ornaments, 
        status, total_interest_paid, monthly_interest, ornament_photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19)
    `;

    const params = [
      finalLoanId,
      loan.branchId,
      actualCustomerId, // guardian_name (FK to customers.id)
      loan.loanDate || new Date().toISOString().split('T')[0],
      loan.loanTime || '00:00:00',
      loan.ornamentCategory,
      parseFloat(loan.interestRate || 0),
      parseFloat(loan.processingFee || 0),
      loan.paymentMode,
      loan.bankName,
      loan.bankLoanNumber,
      loan.area,
      parseFloat(loan.loanAmount || 0),
      parseFloat(loan.amountGiven || 0),
      JSON.stringify(loan.ornaments || []),
      'active',
      parseFloat(loan.monthlyInterest || 0), // total_interest_paid starts with first month
      parseFloat(loan.monthlyInterest || 0), // monthly_interest
      loan.ornamentPhoto
    ];

    await db.query(query, params);

    // 4. Generate Initial Monthly Interest Record (Paid Upfront)
    const monthlyInt = parseFloat(loan.monthlyInterest || 0);
    const startDate = new Date(loan.loanDate || new Date());
    
    await db.query(`
      INSERT INTO interest_payments (loan_id, due_date, amount, status, paid_amount, payment_date, payment_mode)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [finalLoanId, startDate.toISOString().split('T')[0], monthlyInt, 'paid', monthlyInt, startDate.toISOString().split('T')[0], loan.paymentMode || 'CASH']);

    // (The total_interest_paid is already set in the INSERT statement above)

    res.status(201).json({ id: finalLoanId, customerId: actualCustomerId, loanNumber, message: 'Loan created and initial interest recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 4.1 Update a loan
app.put('/api/loans/:id', async (req, res) => {
  const { id } = req.params;
  const loan = req.body;
  
  try {
    // 1. Update Customer Details in Customers table
    if (loan.customerId) {
      await db.query(`
        UPDATE customers SET 
          name = $1, phone = $2, address = $3, gender = $4, photo = $5, aadhar_photo = $6
        WHERE id = $7
      `, [loan.customerName, loan.customerPhone, loan.address, loan.gender, loan.customerPhoto, loan.aadharPhoto, loan.customerId]);
    }

    // 2. Update Loan Details
    const query = `
      UPDATE loans SET
        guardian_name = $1, ornament_category = $2, interest_rate = $3, processing_fee = $4,
        payment_mode = $5, bank_name = $6, bank_loan_number = $7, area = $8,
        loan_amount = $9, amount_given = $10,
        ornaments = $11, status = $12, total_interest_paid = $13,
        monthly_interest = $14, ornament_photo = $15,
        bank_amount = $16, bank_settled_amount = $17
      WHERE id = $18
    `;

    const params = [
      loan.customerId,
      loan.ornamentCategory,
      parseFloat(loan.interestRate),
      parseFloat(loan.processingFee),
      loan.paymentMode,
      loan.bankName,
      loan.bankLoanNumber,
      loan.area,
      parseFloat(loan.loanAmount),
      parseFloat(loan.amountGiven),
      JSON.stringify(loan.ornaments),
      loan.status,
      parseFloat(loan.totalInterestPaid),
      parseFloat(loan.monthlyInterest),
      loan.ornamentPhoto,
      parseFloat(loan.bankAmount || 0),
      parseFloat(loan.bankSettledAmount || 0),
      id
    ];

    await db.query(query, params);

    // When a loan is closed, remove unpaid interest records so pending counts stay accurate
    if (loan.status === 'closed') {
      await db.query(`DELETE FROM interest_payments WHERE loan_id = $1 AND status = 'pending'`, [id]);
    }

    res.json({ message: 'Loan and customer details updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.2 Delete a loan
app.delete('/api/loans/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Loan Renewal — closes old loan, creates a fresh loan with renewed status
app.post('/api/loans/:id/renew', async (req, res) => {
  const { renewalDate, loanAmount, interestRate } = req.body;
  if (!loanAmount || !interestRate) return res.status(400).json({ error: 'loanAmount and interestRate are required' });
  const date = renewalDate || new Date().toISOString().split('T')[0];
  try {
    // 1. Fetch old loan
    const oldResult = await db.query('SELECT * FROM loans WHERE id = $1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ error: 'Loan not found' });
    const old = oldResult.rows[0];

    // 2. Close old loan
    await db.query(`UPDATE loans SET status = 'closed' WHERE id = $1`, [req.params.id]);

    // 3. Generate new loan ID
    const countResult = await db.query('SELECT COUNT(*) FROM loans WHERE branch_id = $1', [old.branch_id]);
    const loanCount = parseInt(countResult.rows[0].count) + 1;
    const loanNumber = `L-${1000 + loanCount}`;
    const newId = `${old.guardian_name}-${loanNumber}`;

    // 4. Calculate new values
    const newLoanAmount = parseFloat(loanAmount);
    const newInterestRate = parseFloat(interestRate);
    const newMonthly = (newLoanAmount * newInterestRate) / 100;
    const processingFee = parseFloat(old.processing_fee || 0);
    const amountGiven = Math.max(0, newLoanAmount - processingFee - newMonthly);

    // 5. Insert new loan (same customer/ornaments, new terms)
    await db.query(`
      INSERT INTO loans (
        id, branch_id, guardian_name,
        loan_date, loan_time, ornament_category, interest_rate, processing_fee,
        payment_mode, bank_name, bank_loan_number, area, loan_amount, amount_given, ornaments,
        status, total_interest_paid, monthly_interest, ornament_photo,
        bank_amount, bank_settled_amount
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,$20,$21)
    `, [
      newId, old.branch_id, old.guardian_name,
      date, old.loan_time || '00:00:00', old.ornament_category, newInterestRate, processingFee,
      old.payment_mode, old.bank_name, old.bank_loan_number, old.area,
      newLoanAmount, amountGiven, JSON.stringify(old.ornaments || []),
      'renewed', newMonthly, newMonthly, old.ornament_photo,
      parseFloat(old.bank_amount || 0), parseFloat(old.bank_settled_amount || 0)
    ]);

    // 6. First month interest paid upfront (same as new loan creation)
    if (newMonthly > 0) {
      await db.query(`
        INSERT INTO interest_payments (loan_id, due_date, amount, status, paid_amount, payment_date, payment_mode)
        VALUES ($1, $2, $3, 'paid', $3, $2, $4)
      `, [newId, date, newMonthly, old.payment_mode || 'CASH']);
    }

    res.json({ success: true, newLoanId: newId, loanNumber });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Part Payment / Foreclosure
app.post('/api/loans/:id/part-payment', async (req, res) => {
  const { amount, paymentDate, paymentMode, isFull } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
  try {
    const result = await db.query('SELECT loan_amount, amount_given, monthly_interest, interest_rate FROM loans WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Loan not found' });
    const newLoanAmount = Math.max(0, parseFloat(row.loan_amount) - parseFloat(amount));
    const newMonthlyInterest = (newLoanAmount * parseFloat(row.interest_rate)) / 100;
    const isForeclosure = isFull || newLoanAmount === 0;
    const status = isForeclosure ? 'closed' : 'active';
    // Only reduce loan_amount (outstanding principal) — amount_given stays as original disbursement
    await db.query(
      `UPDATE loans SET loan_amount = $1, monthly_interest = $2, status = $3 WHERE id = $4`,
      [newLoanAmount, newMonthlyInterest, status, req.params.id]
    );
    await db.query(
      `INSERT INTO part_payments (id, loan_id, amount, payment_date, payment_mode, balance_after, is_foreclosure) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [Date.now().toString(), req.params.id, parseFloat(amount), paymentDate || new Date().toISOString().split('T')[0], paymentMode || 'CASH', newLoanAmount, isForeclosure]
    );
    res.json({ success: true, loanAmount: newLoanAmount, amountGiven: parseFloat(row.amount_given), monthlyInterest: newMonthlyInterest, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/loans/:id/part-payments', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM part_payments WHERE loan_id = $1 ORDER BY payment_date ASC, created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Ornament Config Routes
app.get('/api/settings/ornaments', async (req, res) => {
  const branchId = req.query.branchId;
  try {
    const result = await db.query('SELECT * FROM ornaments_config WHERE branch_id = $1 OR branch_id = $2', [branchId, 'admin']);
    const rows = result.rows.map(row => ({
      ...row,
      branchId: row.branch_id,
      metalType: row.metal_type
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/ornaments', async (req, res) => {
  const { branchId, name, metalType } = req.body;
  const id = Date.now().toString();
  try {
    await db.query(
      `INSERT INTO ornaments_config (id, branch_id, name, metal_type) VALUES ($1, $2, $3, $4)`,
      [id, branchId, name, metalType]
    );
    res.status(201).json({ id, name, metalType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Branch Management (Super Admin only)
const requireSuperAdmin = async (req, res, next) => {
  const { adminId } = req.query;
  if (!adminId) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await db.query('SELECT role FROM branches WHERE id = $1', [adminId]);
    if (!result.rows[0] || result.rows[0].role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch (err) {
    next(err);
  }
};

app.get('/api/branches', requireSuperAdmin, async (_req, res) => {
  try {
    const result = await db.query(`SELECT id, username, branch_name, gold_rate, silver_rate, default_interest_rate, role FROM branches WHERE role != 'super_admin' ORDER BY branch_name`);
    res.json(result.rows.map(r => ({ id: r.id, username: r.username, branchName: r.branch_name, goldRate: r.gold_rate, silverRate: r.silver_rate, defaultInterestRate: r.default_interest_rate })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/branches', requireSuperAdmin, async (req, res) => {
  const { branchName, username, password } = req.body;
  if (!branchName || !username || !password) return res.status(400).json({ error: 'All fields are required' });
  try {
    const exists = await db.query('SELECT id FROM branches WHERE username = $1', [username]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Username already taken' });
    const id = Date.now().toString();
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO branches (id, username, password, branch_name, default_interest_rate, gold_rate, silver_rate) VALUES ($1, $2, $3, $4, 1.5, 8000, 100)`,
      [id, username, hash, branchName]
    );
    res.json({ id, username, branchName });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/branches/:id', requireSuperAdmin, async (req, res) => {
  try {
    const loans = await db.query('SELECT COUNT(*) FROM loans WHERE branch_id = $1', [req.params.id]);
    if (parseInt(loans.rows[0].count) > 0) return res.status(400).json({ error: 'Cannot delete branch with existing loans' });
    await db.query('DELETE FROM branches WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Branch Settings Routes
app.get('/api/settings/branch/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT gold_rate, silver_rate, default_interest_rate, storage_path FROM branches WHERE id = $1`,
      [req.params.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Branch not found' });
    res.json({
      goldRate: row.gold_rate,
      silverRate: row.silver_rate,
      defaultInterestRate: row.default_interest_rate,
      storagePath: row.storage_path || DEFAULT_UPLOADS_DIR
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/branch/:id', async (req, res) => {
  const { goldRate, silverRate, defaultInterestRate, storagePath } = req.body;
  try {
    await db.query(
      `UPDATE branches SET gold_rate = $1, silver_rate = $2, default_interest_rate = $3, storage_path = $4 WHERE id = $5`,
      [goldRate, silverRate, defaultInterestRate, storagePath || null, req.params.id]
    );
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/settings/ornaments/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM ornaments_config WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Ornament deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fs/dirs', (req, res) => {
  const reqPath = req.query.path || os.homedir();
  try {
    const entries = fs.readdirSync(reqPath, { withFileTypes: true });
    const dirs = entries
      .filter(e => { try { return e.isDirectory() && !e.name.startsWith('.'); } catch { return false; } })
      .map(e => ({ name: e.name, fullPath: path.join(reqPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const parent = path.dirname(reqPath);
    res.json({ current: reqPath, dirs, parent: parent !== reqPath ? parent : null });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404 for unmatched API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — catches any unhandled errors from async routes
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
