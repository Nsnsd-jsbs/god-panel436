// SRM Enterprise Beast Panel - Custom Auth & Core Engine
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// دیتابیس داخلی انحصاری SRM
const db = {
    clients: new Map()
};

// اطلاعات ورود ادمین (قابل تغییر به دلخواه)
const ADMIN_USER = "srm";
const ADMIN_PASS = "srm2026";
const activeSessions = new Set();

// میدلور بررسی نشست ادمین
const checkSession = (req, res, next) => {
    const sessionToken = req.headers['authorization']?.split(' ')[1] || req.query.token;
    if (!sessionToken || !activeSessions.has(sessionToken)) {
        return res.status(401).json({ success: false, message: "نشست نامعتبر است. لطفا دوباره وارد شوید." });
    }
    next();
};

// صفحه ورود (Login Page) - کاملاً اختصاصی و دارک با استایل شیک SRM
app.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ورود به پنل مدیریت SRM</title>
    <style>
        :root {
            --bg-deep: #030407;
            --bg-card: #0b0c14;
            --accent-primary: #6366f1;
            --accent-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
            --text-main: #f1f5f9;
            --text-muted: #64748b;
            --border-color: rgba(255, 255, 255, 0.08);
            --error: #f43f5e;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
        body { background: var(--bg-deep); color: var(--text-main); display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
        .login-card { background: var(--bg-card); border: 1px solid var(--border-color); padding: 40px; border-radius: 24px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); position: relative; }
        .brand-logo { width: 56px; height: 56px; background: var(--accent-gradient); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; color: #fff; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5); }
        .title { font-size: 20px; font-weight: 800; margin-bottom: 8px; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 30px; }
        .input-group { margin-bottom: 20px; }
        label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; }
        input { width: 100%; background: #030407; border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 12px; color: #fff; font-size: 14px; outline: none; transition: 0.3s; }
        input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
        .btn-login { background: var(--accent-gradient); color: #fff; border: none; padding: 16px; width: 100%; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); transition: 0.3s; }
        .btn-login:hover { opacity: 0.9; transform: translateY(-2px); }
        .error-msg { color: var(--error); font-size: 12px; margin-top: 12px; text-align: center; display: none; }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="brand-logo">S</div>
        <div class="title">ورود به هسته مرکزی SRM</div>
        <div class="subtitle">لطفا نام کاربری و رمز عبور مدیریت را وارد کنید</div>
        
        <div class="input-group">
            <label>نام کاربری</label>
            <input type="text" id="username" placeholder="مثال: srm">
        </div>
        <div class="input-group">
            <label>رمز عبور</label>
            <input type="password" id="password" placeholder="••••••••">
        </div>
        <button class="btn-login" onclick="doLogin()">ورود به پنل مدیریت</button>
        <div id="errorMsg" class="error-msg">نام کاربری یا رمز عبور اشتباه است!</div>
    </div>

    <script>
        function doLogin() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    // انتقال امن ادمین به پنل اصلی با توکن سشن
                    localStorage.setItem('srm_token', data.token);
                    window.location.href = '/panel?token=' + data.token;
                } else {
                    document.getElementById('errorMsg').style.display = 'block';
                }
            });
        }
    </script>
</body>
</html>
    `);
});

// API احراز هویت
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.add(token);
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, message: "احراز هویت ناموفق" });
});

// روت اصلی هدایت به لاگین
app.get('/', (req, res) => {
    res.redirect('/login');
});

// داشبورد اصلی مدیریت SRM (فقط بعد از لاگین موفق باز میشه)
app.get('/panel', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>پنل مدیریت قدرتمند SRM</title>
    <style>
        :root {
            --bg-deep: #030407;
            --bg-surface: #0b0c14;
            --bg-card: #12131d;
            --accent-primary: #6366f1;
            --accent-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
            --text-main: #f1f5f9;
            --text-muted: #64748b;
            --border-color: rgba(255, 255, 255, 0.06);
            --success: #10b981;
            --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
        body { background-color: var(--bg-deep); color: var(--text-main); display: flex; height: 100vh; overflow: hidden; }
        aside { width: 280px; background: var(--bg-surface); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 10; }
        .brand-box { padding: 30px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 14px; }
        .brand-logo { width: 44px; height: 44px; background: var(--accent-gradient); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: #fff; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5); }
        .brand-title { font-size: 16px; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .brand-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .nav-menu { list-style: none; padding: 24px 16px; display: flex; flex-direction: column; gap: 10px; }
        .nav-item { padding: 14px 18px; border-radius: 12px; background: var(--accent-gradient); color: #fff; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35); }
        main { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.08), transparent 50%), var(--bg-deep); overflow-y: auto; }
        header { padding: 24px 40px; background: rgba(11, 12, 20, 0.8); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 5; }
        .header-title h1 { font-size: 20px; font-weight: 700; }
        .header-title p { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .logout-btn { background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #f43f5e; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .content-body { padding: 40px; max-width: 1400px; margin: 0 auto; width: 100%; }
        .glass-panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 32px; box-shadow: var(--shadow); margin-bottom: 32px; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
        .panel-title { font-size: 18px; font-weight: 700; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } body { flex-direction: column; height: auto; overflow: auto; } aside { width: 100%; } }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
        .input-field { background: var(--bg-deep); border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 12px; color: var(--text-main); font-size: 14px; outline: none; }
        .input-field:focus { border-color: var(--accent-primary); }
        .btn-primary { background: var(--accent-gradient); color: #fff; border: none; padding: 16px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); width: 100%; }
        .output-box { background: var(--bg-deep); border: 1px dashed var(--accent-primary); padding: 20px; border-radius: 14px; margin-top: 20px; display: none; word-break: break-all; }
        .output-box h4 { font-size: 13px; color: var(--accent-primary); margin-bottom: 8px; }
        .output-box a { color: #38bdf8; font-family: monospace; font-size: 14px; text-decoration: none; }
        .table-container { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: right; }
        th { padding: 16px; font-size: 13px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border-color); }
        td { padding: 18px 16px; font-size: 14px; border-bottom: 1px solid var(--border-color); }
    </style>
</head>
<body>
    <aside>
        <div class="brand-box">
            <div class="brand-logo">S</div>
            <div>
                <div class="brand-title">SRM ENTERPRISE</div>
                <div class="brand-subtitle">پنل انحصاری مدیریت شاپ</div>
            </div>
        </div>
        <ul class="nav-menu">
            <li class="nav-item">⚡ مدیریت کاربران و ساب</li>
        </ul>
    </aside>
    <main>
        <header>
            <div class="header-title">
                <h1>داشبورد مرکزی SRM</h1>
                <p>خوش آمدید ادمین عزیز؛ سیستم پایدار و امن آماده‌ست</p>
            </div>
            <button class="logout-btn" onclick="logout()">خروج از حساب</button>
        </header>
        <div class="content-body">
            <div class="glass-panel">
                <div class="panel-header"><div class="panel-title">➕ ایجاد مشتری و صدور اشتراک جدید</div></div>
                <div class="form-grid">
                    <div class="input-group"><label>نام کاربری مشتری</label><input type="text" id="username" class="input-field" placeholder="مثال: parsa_vip"></div>
                    <div class="input-group"><label>حجم سهمیه</label><input type="text" id="trafficLimit" class="input-field" value="100GB"></div>
                    <div class="input-group"><label>مدت انقضا</label><input type="text" id="expireDays" class="input-field" value="۳۰ روزه"></div>
                </div>
                <button class="btn-primary" onclick="createClient()">تایید، ثبت در دیتابیس و تولید لینک ساب</button>
                <div id="subResult" class="output-box">
                    <h4>🔗 لینک سابسکریپشن اختصاصی (مخصوص V2RayNG و وب‌پیج):</h4>
                    <a id="subLinkText" href="#" target="_blank"></a>
                </div>
            </div>
            <div class="glass-panel">
                <div class="panel-header"><div class="panel-title">👥 لیست مشتریان ثبت‌شده در سیستم</div></div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>نام مشتری</th><th>UUID</th><th>سهمیه حجم</th><th>اعتبار</th><th>لینک ساب</th></tr></thead>
                        <tbody id="clientsTable"><tr><td colspan="5" style="text-align: center; color: var(--text-muted);">در حال بارگذاری...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
    <script>
        const token = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('srm_token');
        if(!token) { window.location.href = '/login'; }

        function loadClients() {
            fetch('/api/clients/list?token=' + token)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    const tbody = document.getElementById('clientsTable');
                    tbody.innerHTML = '';
                    if(data.clients.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">هیچ کاربری ثبت نشده است.</td></tr>';
                        return;
                    }
                    data.clients.forEach(c => {
                        tbody.innerHTML += '<tr><td><b>'+c.username+'</b></td><td style="font-family:monospace; color:#a5b4fc;">'+c.uuid.substring(0,8)+'...</td><td>'+c.trafficLimit+'</td><td>'+c.expireDays+'</td><td><a href="/sub/'+c.subId+'" target="_blank" style="color:#38bdf8; text-decoration:none; font-weight:bold;">مشاهده ساب</a></td></tr>';
                    });
                } else {
                    window.location.href = '/login';
                }
            });
        }

        function createClient() {
            const username = document.getElementById('username').value;
            const trafficLimit = document.getElementById('trafficLimit').value;
            const expireDays = document.getElementById('expireDays').value;
            if(!username) { alert('لطفا نام کاربری را وارد کنید!'); return; }

            fetch('/api/clients/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ username, trafficLimit, expireDays })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    const box = document.getElementById('subResult');
                    const link = document.getElementById('subLinkText');
                    box.style.display = 'block';
                    link.href = data.subLink;
                    link.innerText = data.subLink;
                    loadClients();
                } else { alert(data.message); }
            });
        }

        function logout() {
            localStorage.removeItem('srm_token');
            window.location.href = '/login';
        }

        loadClients();
    </script>
</body>
</html>
    `);
});

// API لیست کلاینت‌ها
app.get('/api/clients/list', (req, res) => {
    const token = req.query.token;
    if (!token || !activeSessions.has(token)) return res.json({ success: false });
    const clientsList = Array.from(db.clients.values());
    res.json({ success: true, clients: clientsList });
});

// API افزودن کلاینت
app.post('/api/clients/add', checkSession, (req, res) => {
    const { username, trafficLimit, expireDays } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "اطلاعات ناقص است!" });

    const uuid = crypto.randomUUID();
    const subId = crypto.createHash('sha256').update(username + uuid).digest('hex').substring(0, 16);

    const clientData = { username, uuid, trafficLimit: trafficLimit || "100GB", expireDays: expireDays || "۳۰ روزه", subId };
    db.clients.set(subId, clientData);

    res.json({ success: true, subLink: `https://${req.get('host')}/sub/${subId}` });
});

// موتور دوگانه سابسکریپشن (تشخیص اتوماتیک V2RayNG یا نمایش وب‌سایت با حجم و انقضا)
app.get('/sub/:subId', (req, res) => {
    const client = db.clients.get(req.params.subId);
    if (!client) return res.status(404).send("اشتراک یافت نشد!");

    const userAgent = req.headers['user-agent'] || '';
    const u = client.uuid;

    const configs = [
        `vless://${u}@104.18.0.1:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=varzesh3.com&fp=chrome#SRM-Vision-01`,
        `vless://${u}@104.18.0.1:2052?encryption=none&security=reality&sni=varzesh3.com&fp=chrome#SRM-gRPC-02`,
        `vless://${u}@104.18.0.2:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=filimo.com&fp=chrome#SRM-Filimo-03`,
        `vless://${u}@104.18.0.3:443?encryption=none&security=reality&sni=digikala.com&fp=chrome#SRM-Digikala-04`
    ];

    // اگر درخواست از مرورگر بود -> وب‌پیج شیک حجم و انقضا با لیست کانفیگ‌ها
    if (!userAgent.includes('v2rayNG') && !userAgent.includes('V2Box') && !userAgent.includes('Clash') && !userAgent.includes('Go-http-client')) {
        let configsHtml = configs.map((cfg, idx) => `
            <div style="background: #030407; border: 1px solid rgba(255,255,255,0.06); padding: 12px; border-radius: 10px; margin-bottom: 8px; font-size: 11px; font-family: monospace; color: #38bdf8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                کانفیگ ${idx + 1}: ${cfg}
            </div>
        `).join('');

        return res.send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>اشتراک SRM - ${client.username}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
                body { background: #030407; color: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
                .card { background: #0b0c14; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 30px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
                .title { font-size: 18px; font-weight: 800; color: #6366f1; margin-bottom: 20px; text-align: center; }
                .info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                .info-item { background: #12131d; border: 1px solid rgba(255,255,255,0.06); padding: 16px; border-radius: 14px; text-align: center; }
                .info-item span { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; }
                .info-item b { font-size: 16px; color: #10b981; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="title">⚡ وضعیت اشتراک SRM: ${client.username}</div>
                <div class="info-box">
                    <div class="info-item"><span>سهمیه حجم</span><b>${client.trafficLimit}</b></div>
                    <div class="info-item"><span>مدت اعتبار</span><b>${client.expireDays}</b></div>
                </div>
                <div style="
