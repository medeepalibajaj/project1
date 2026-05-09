
// ===================== FTP BACKUP ROUTES =====================

// Check FTP configuration status
app.get('/api/ftp/status', auth, canManageUsers, safeJsonRoute(async (req, res) => {
  const hasAddress = !!process.env.FTP_ADDRESS;
  const hasUser = !!process.env.FTP_USERNAME;
  const hasPass = !!process.env.FTP_PASSWORD;
  const configured = hasAddress && hasUser && hasPass;

  res.json({
    configured,
    address: configured ? process.env.FTP_ADDRESS : null,
    port: parseInt(process.env.FTP_PORT || "21"),
    message: !configured 
      ? "FTP not configured. Add FTP_ADDRESS, FTP_PORT, FTP_USERNAME and FTP_PASSWORD in Railway."
      : "FTP server configured."
  });
}));

// List backup files on FTP server
app.get('/api/ftp/list', auth, canManageUsers, safeJsonRoute(async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_ADDRESS,
      port: parseInt(process.env.FTP_PORT || "21"),
      user: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      secure: false
    });

    const list = await client.list();
    const files = list
      .filter(item => item.type === ftp.FileType.File && item.name.endsWith('.json'))
      .map(item => ({
        name: item.name,
        size: item.size,
        modified: item.modifiedAt
      }))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({ files });
  } catch (err) {
    console.error("FTP list error:", err.message);
    res.status(500).json({ error: "Failed to list FTP files: " + err.message });
  } finally {
    client.close();
  }
}));

// Upload backup to FTP server
app.post('/api/ftp/upload', auth, canManageUsers, safeJsonRoute(async (req, res) => {
  const { year } = req.body;
  if (!year) return res.status(400).json({ error: "Year is required" });

  // Generate encrypted backup data (reuse existing backup logic)
  const tables = ['students', 'fee_payments', 'expenses', 'users', 'settings'];
  const backup = { year, timestamp: new Date().toISOString(), tables: {} };

  for (const t of tables) {
    const rows = await dbAll(`SELECT * FROM ${t} WHERE year = ?`, [year]);
    backup.tables[t] = rows;
  }

  // Encrypt the backup
  const secret = process.env.BACKUP_SECRET || process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "No backup encryption secret configured" });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', crypto.scryptSync(secret, 'salt', 32), iv);
  let encrypted = cipher.update(JSON.stringify(backup), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = {
    iv: iv.toString('hex'),
    authTag,
    data: encrypted,
    version: 1
  };

  const buffer = Buffer.from(JSON.stringify(payload, null, 2));
  const filename = `school-backup-${year}-${Date.now()}.json`;

  // Upload to FTP
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_ADDRESS,
      port: parseInt(process.env.FTP_PORT || "21"),
      user: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      secure: false
    });

    await client.uploadFromBuffer(buffer, filename);
    res.json({ ok: true, filename, size: buffer.length });
  } catch (err) {
    console.error("FTP upload error:", err.message);
    res.status(500).json({ error: "Failed to upload to FTP: " + err.message });
  } finally {
    client.close();
  }
}));

// Download backup from FTP server
app.get('/api/ftp/download', auth, canManageUsers, safeJsonRoute(async (req, res) => {
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: "Filename is required" });
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return res.status(400).json({ error: "Invalid filename" });

  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_ADDRESS,
      port: parseInt(process.env.FTP_PORT || "21"),
      user: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      secure: false
    });

    const chunks = [];
    const writable = new (require('stream').Writable)({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    await client.downloadTo(writable, filename);
    const buffer = Buffer.concat(chunks);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("FTP download error:", err.message);
    res.status(500).json({ error: "Failed to download from FTP: " + err.message });
  } finally {
    client.close();
  }
}));
