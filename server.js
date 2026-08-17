// SRM Single-File Luxury Panel - Ready for Action
const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const usersDatabase = new Map();
const activeSubscriptions = new Map();
const activeTunnels = new Map([
    ['tunnel-1', { name: 'تانل اول🛡️', type: 'gRPC over SNI', host: 'varzesh3.com', status: 'Active & National Net Optimized', latency: '35ms' }],
    ['tunnel-2', { name: 'تانل دوم🛡️', type: 'WebSocket TLS', host: 'filimo.com', status: 'Active & Secure', latency: '42ms' }]
]);

const ADMIN_API_TOKEN = process.env.API_TOKEN || "SRM_SECURE_TOKEN_999";

const verifyApiToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.query.token;
    if (!token || token !== ADMIN_API_TOKEN) {
        return res.status(401).json({ success: false, error: "دسترسی غیرمجاز! توکن امنیتی API نامعتبر است." });
    }
    next();
};

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>SRM Luxury Panel - All in One</title>
    <style>
        :root { --bg: #0b0f19; --card: #111827; --accent: #6366f1; --text: #f3f4f6; --muted: #9ca3af; --border: #1f2937; --success: #10b981; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: Tahoma, sans-serif; }
        body { background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }
        aside { width: 260px; background: var(--card); border-left: 1px solid var(--border); display: flex; flex-direction: column; }
        .logo { padding: 25px; font-size: 18px; font-weight: bold; color: var(--accent); text-align: center; border-bottom: 1px solid var(--border); }
        .menu { list-style: none; padding: 20px; }
        .menu li { padding: 12px; margin-bottom: 8px; border-radius: 8px; cursor: pointer; color: var(--muted); }
        .menu li.active { background: var(--accent); color: #fff; }
        main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        header { padding: 20px 30px; background: var(--card); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .content { padding: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: var(--card); border: 1px solid var(--border); padding: 20px; border-radius: 12px; }
        .card h3 { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
        .card .val { font-size: 22px; font-weight: bold; color: var(--success); }
        .box { background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 12px; }
        .btn { background: var(--accent); color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    </style>
</head>
<body>
    <aside>
        <div class="logo">⚡ SRM PANEL PRO</div>
        <ul class="menu">
            <li class="active">📊 داشبورد اصلی</li>
            <li>👥 مدیریت کاربران</li>
            <li>🔗 تانل اول🛡️ و دوم🛡️</li>
            <li>⚙️ کانفیگ‌های ساب</li>
        </ul>
    </aside>
    <main>
        <header>
            <h1>پنل اختصاصی SRM (آماده‌ی تست)</h1>
            <span>وضعیت: <strong style="color:var(--success)">● آنلاین</strong></span>
        </header>
        <div class="content">
            <div class="grid">
                <div class="card"><h3>امنیت توکن</h3><div class="val" style="font-size:15px; color:var(--accent)">فعال (Bearer)</div></div>
                <div class="card"><h3>تانل‌های نت ملی</h3><div class="val" style="font-size:15px">فعال و پایدار</div></div>
                <div class="card"><h3>مصرف رم</h3><div class="val" id="ram">بارگذاری...</div></div>
                <div class="card"><h3>کانفیگ ساب</h3><div class="val">۱۲ اپراتور مجزا</div></div>
            </div>
            <div class="box">
                <h2>کنترلر هسته تک‌فایلی</h2>
                <p style="color:var(--muted); line-height:1.6;">آماده برای ساخت اکانت و گرفتن خروجی سابسکریپشن.</p><br>
                <button class="btn" onclick="loadStats()">بروزرسانی وضعیت سرور</button>
            </div>
        </div>
    </main>
    <script>
        function loadStats() {
            fetch('/api/stats', { headers: { 'Authorization': 'Bearer SRM_SECURE_TOKEN_999' } })
            .then(res => res.json())
            .then(data => { if(data.success) { document.getElementById('ram').innerText = data.stats.memory.usagePercent; alert('وضعیت سرور بروز شد!'); } });
        }
    </script>
</body>
</html>
    `);
});

app.get('/api/stats', verifyApiToken, (req, res) => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    res.json({
        success: true,
        stats: {
            hostname: os.hostname(),
            uptimeHours: (os.uptime() / 3600).toFixed(2),
            cpuCores: os.cpus().length,
            memory: { totalMB: (totalMemory / 1048576).toFixed(2), usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2) + "%" }
        }
    });
});

app.get('/api/users/list', verifyApiToken, (req, res) => {
    const usersList = Array.from(usersDatabase.entries()).map(([id, data]) => ({ userId: id, ...data }));
    res.json({ success: true, totalUsers: usersList.length, users: usersList });
});

app.post('/api/users/create', verifyApiToken, (req, res) => {
    const { username, uuid, trafficLimit } = req.body;
    if (!username || !uuid) return res.status(400).json({ success: false, error: "نام کاربری و UUID الزامی است!" });
    if (usersDatabase.has(username)) return res.status(400).json({ success: false, error: "کاربر وجود دارد!" });

    const newUser = { username, uuid, trafficLimit: trafficLimit || "100GB", status: "Active" };
    usersDatabase.set(username, newUser);
    res.json({ success: true, message: `کاربر ${username} ایجاد شد!`, userInfo: newUser });
});

app.get('/api/tunnels/list', verifyApiToken, (req, res) => {
    res.json({ success: true, netMode: "National Network (نت ملی)", tunnels: Array.from(activeTunnels.entries()).map(([id, data]) => ({ tunnelId: id, ...data })) });
});

app.post('/sub/create', (req, res) => {
    const { username, uuid } = req.body;
    if (!username || !uuid) return res.status(400).json({ success: false, error: "اطلاعات ناقص است!" });
    const subId = Buffer.from(username + Date.now()).toString('base64');
    activeSubscriptions.set(subId, { username, uuid });
    res.json({ success: true, subscriptionLink: `https://${req.get('host')}/sub/${subId}` });
});

app.get('/sub/:subId', (req, res) => {
    const userData = activeSubscriptions.get(req.params.subId);
    if (!userData) return res.status(404).send("Subscription not found!");
    const u = userData.uuid;

    const configs = [
        `vless://${u}@104.18.0.1:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=varzesh3.com&fp=chrome#اپراتور1🛡️`,
        `vless://${u}@104.18.0.1:8443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=varzesh3.com&fp=chrome#اپراتور2🛡️`,
        `vless://${u}@104.18.0.1:2052?encryption=none&flow=xtls-rprx-vision&security=reality&sni=varzesh3.com&fp=chrome#اپراتور3🛡️`,
        `vless://${u}@104.18.0.2:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=filimo.com&fp=chrome#اپراتور4🛡️`,
        `vless://${u}@104.18.0.2:8443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=filimo.com&fp=chrome#اپراتور5🛡️`,
        `vless://${u}@104.18.0.2:2052?encryption=none&flow=xtls-rprx-vision&security=reality&sni=filimo.com&fp=chrome#اپراتور6🛡️`,
        `vless://${u}@104.18.0.3:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=digikala.com&fp=chrome#اپراتور7🛡️`,
        `vless://${u}@104.18.0.3:8443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=digikala.com&fp=chrome#اپراتور8🛡️`,
        `vless://${u}@104.18.0.3:2052?encryption=none&flow=xtls-rprx-vision&security=reality&sni=digikala.com&fp=chrome#اپراتور9🛡️`,
        `vless://${u}@104.18.0.4:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=tsetmc.com&fp=chrome#اپراتور10🛡️`,
        `vless://${u}@104.18.0.4:8443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=tsetmc.com&fp=chrome#اپراتور11🛡️`,
        `vless://${u}@104.18.0.4:2052?encryption=none&flow=xtls-rprx-vision&security=reality&sni=tsetmc.com&fp=chrome#اپراتور12🛡️`
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(Buffer.from(configs).toString('base64'));
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "مسیر مورد نظر یافت نشد!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SRM Single-File Luxury Panel is running on port ${PORT}`);
});
        
