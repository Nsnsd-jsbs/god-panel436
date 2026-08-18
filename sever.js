const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = { clients: new Map() };
const ADMIN_USER = "srm";
const ADMIN_PASS = "srm2026";
const activeSessions = new Set();

const checkAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
    if (!token || !activeSessions.has(token)) return res.status(401).json({ success: false, message: 'Unauthorized' });
    next();
};

app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>ورود به پنل SRM</title><style>body{background:#0b0f19;color:#fff;font-family:Tahoma,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.login-card{background:#131b2e;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.5);width:320px;border:1px solid #1f293d}h2{text-align:center;margin-bottom:20px;color:#38bdf8}input{width:100%;padding:10px;margin-bottom:15px;background:#0b0f19;border:1px solid #334155;border-radius:6px;color:#fff;box-sizing:border-box}button{width:100%;padding:10px;background:#38bdf8;border:none;border-radius:6px;color:#0b0f19;font-weight:bold;cursor:pointer}button:hover{background:#7dd3fc}.error{color:#f87171;text-align:center;font-size:13px;margin-top:10px}</style></head><body><div class="login-card"><h2>پنل مدیریت SRM</h2><input type="text" id="username" placeholder="نام کاربری"><input type="password" id="password" placeholder="رمز عبور"><button onclick="login()">ورود</button><div id="error" class="error"></div></div><script>async function login(){const u=document.getElementById('username').value;const p=document.getElementById('password').value;const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});const data=await res.json();if(data.success){localStorage.setItem('srm_token',data.token);window.location.href='/panel?token='+data.token}else{document.getElementById('error').innerText='اطلاعات ورود اشتباه است'}}</script></body></html>`);
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.add(token);
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/', (req, res) => res.redirect('/login'));

app.get('/panel', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>پنل مدیریت SRM</title><style>body{background:#0b0f19;color:#fff;font-family:Tahoma,sans-serif;padding:20px;margin:0}.container{max-width:600px;margin:40px auto;background:#131b2e;padding:25px;border-radius:12px;border:1px solid #1f293d}h2{color:#38bdf8;text-align:center}.form-group{margin-bottom:15px}label{display:block;margin-bottom:5px;font-size:14px}input{width:100%;padding:10px;background:#0b0f19;border:1px solid #334155;border-radius:6px;color:#fff;box-sizing:border-box}button{width:100%;padding:12px;background:#22c55e;border:none;border-radius:6px;color:#fff;font-weight:bold;cursor:pointer;margin-top:10px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #334155;padding:10px;text-align:center}.result{margin-top:20px;background:#0b0f19;padding:15px;border-radius:6px;word-break:break-all;border:1px solid #334155;color:#38bdf8}</style></head><body><div class="container"><h2>مدیریت اشتراک‌های SRM</h2><div class="form-group"><label>نام مشتری:</label><input type="text" id="clientName"></div><button onclick="createClient()">ایجاد لینک اشتراک</button><div id="resultBox" class="result" style="display:none"><b>لینک:</b> <span id="subLinkText"></span></div><h3>لیست مشتریان</h3><table id="clientsTable"><thead><tr><th>نام</th><th>لینک</th></tr></thead><tbody id="clientsTableBody"></tbody></table></div><script>const token=new URLSearchParams(window.location.search).get('token')||localStorage.getItem('srm_token');async function load(){const res=await fetch('/api/clients/list',{headers:{'Authorization':'Bearer '+token}});const data=await res.json();const tbody=document.getElementById('clientsTableBody');tbody.innerHTML=data.clients.map(c=>'<tr><td>'+c.username+'</td><td><a href="/sub/'+c.subId+'" style="color:#38bdf8">دریافت</a></td></tr>').join('')}async function createClient(){const username=document.getElementById('clientName').value;const res=await fetch('/api/clients/add',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({username})});const data=await res.json();if(data.success){document.getElementById('subLinkText').innerText=data.subLink;document.getElementById('resultBox').style.display='block';load()}}load()</script></body></html>`);
});

app.post('/api/clients/add', checkAuth, (req, res) => {
    const { username } = req.body;
    const uuid = crypto.randomUUID();
    const subId = crypto.randomUUID().substring(0, 16);
    db.clients.set(subId, { username, uuid, subId });
    res.json({ success: true, subLink: `https://${req.get('host')}/sub/${subId}` });
});

app.get('/api/clients/list', checkAuth, (req, res) => {
    res.json({ success: true, clients: Array.from(db.clients.values()) });
});

app.get('/sub/:subId', (req, res) => {
    const client = db.clients.get(req.params.subId);
    if (!client) return res.status(404).send("Not found");
    const u = client.uuid;
    const name = encodeURIComponent(client.username);
    const ports = [2052, 2052, 2052, 443, 443, 443, 8443, 8443, 8443, 2082, 2082, 2082];
    const configs = ports.map((p, i) => `vless://${u}@104.18.0.1:${p}?encryption=none&security=reality&sni=varzesh3.com&fp=chrome#اپراتور${i+1}🛡️-${name}`);
    if (!req.headers['user-agent']?.includes('v2rayNG')) return res.send(`<pre>${configs.join('\n')}</pre>`);
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.send(Buffer.from(configs.join('\n')).toString('base64'));
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
      
