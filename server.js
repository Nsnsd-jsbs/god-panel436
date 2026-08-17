const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = new sqlite3.Database('./srm_ultimate.db', (err) => {
    if (err) console.error('خطا در دیتابیس', err.message);
    else console.log('دیتابیس قدرتمند SRM متصل شد.');
});

db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    gb INTEGER,
    uuid TEXT,
    expire_date TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/', (req, res) => {
    db.all(`SELECT * FROM clients ORDER BY id DESC`, [], (rows_err, rows) => {
        let clientsHtml = '';
        if (rows) {
            rows.forEach(client => {
                const configLink = `vless://${client.uuid}@${req.hostname || 'srm-shop.up.railway.app'}:443?encryption=none&security=tls&type=ws&path=%2Fvless#SRM-${encodeURIComponent(client.name)}-${client.gb}GB`;
                clientsHtml += `
                    <div style="background: #1e293b; padding: 15px; margin: 12px 0; border-radius: 8px; border-right: 4px solid #38bdf8;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span><strong>نام مشتری:</strong> ${client.name}</span>
                            <span style="color: #34d399;">حجم: ${client.gb} گیگ</span>
                        </div>
                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">انقضا: ${client.expire_date}</div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 11px; color: #38bdf8;">${configLink}</div>
                        <a href="/delete/${client.id}" style="display:inline-block; margin-top:8px; color: #f87171; font-size: 12px; text-decoration: none;">حذف اشتراک 🗑️</a>
                    </div>
                `;
            });
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SRM Ultimate Panel</title>
                <style>
                    body { font-family: Tahoma, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 15px; }
                    .container { max-width: 650px; margin: 10px auto; background: #111827; padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.6); }
                    h1 { color: #38bdf8; text-align: center; font-size: 22px; }
                    .card { background: #1f2937; padding: 15px; margin: 15px 0; border-radius: 8px; }
                    label { font-size: 13px; color: #cbd5e1; display: block; margin-top: 8px; }
                    input, select { width: 100%; padding: 10px; margin: 6px 0; background: #0b0f19; border: 1px solid #374151; color: #fff; border-radius: 6px; box-sizing: border-box; }
                    button { background: #0284c7; color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 12px; }
                    button:hover { background: #0ea5e9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>SRM Shop - پنل مدیریت اختصاصی</h1>
                    <div class="card">
                        <h3 style="margin-top: 0; color: #38bdf8; font-size: 16px;">➕ ساخت کانفیگ جدید برای مشتری</h3>
                        <form action="/add" method="POST">
                            <label>نام مشتری:</label>
                            <input type="text" name="name" placeholder="مثلا: علی رضایی" required>
                            <label>حجم (گیگابایت):</label>
                            <input type="number" name="gb" value="30" required>
                            <label>مدت اعتبار (روز):</label>
                            <input type="number" name="days" value="30" required>
                            <button type="submit">تولید و ثبت نهایی کانفیگ</button>
                        </form>
                    </div>
                    <div class="card">
                        <h3 style="margin-top: 0; color: #38bdf8; font-size: 16px;">📋 لیست اشتراک‌های فعال (${rows ? rows.length : 0})</h3>
                        ${clientsHtml || '<p style="color: #94a3b8; text-align:center;">هنوز اشتراکی ثبت نشده است.</p>'}
                    </div>
                </div>
            </body>
            </html>
        `);
    });
});

app.post('/add', (req, res) => {
    const { name, gb, days } = req.body;
    const uuid = crypto.randomUUID();
    
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + parseInt(days || 30));
    const expireFormatted = expireDate.toLocaleDateString('fa-IR');

    db.run(`INSERT INTO clients (name, gb, uuid, expire_date) VALUES (?, ?, ?, ?)`, 
    [name, gb, uuid, expireFormatted], (err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

app.get('/delete/:id', (req, res) => {
    const clientId = req.params.id;
    db.run(`DELETE FROM clients WHERE id = ?`, [clientId], (err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`SRM Ultimate Panel running on port ${PORT}`);
});
