const http = require('http');

const CONFIG = {
    version: "5.0.0-PRO-RAILWAY",
    defaultUUID: "d3b07384-d113-40e4-a138-1672da205556",
    proxyIPs: ["104.16.1.1", "104.17.1.1", "162.159.138.1"],
    sniList: ["varzesh3.com", "filimo.com", "aparat.com"],
    path: "/?ed=2048"
};

const server = http.createServer((req, res) => {
    const host = req.headers.host || "srm-panel.railway.app";
    const url = new URL(req.url, `http://${host}`);

    if (url.pathname === "/sub") {
        res.writeHead(200, { "Content-Type": "text/plain;charset=utf-8" });
        let output = "";
        CONFIG.proxyIPs.forEach((ip, idx) => {
            output += `vless://${CONFIG.defaultUUID}@${ip}:443?encryption=none&security=tls&sni=${CONFIG.sniList[0]}&type=ws&host=${host}&path=${encodeURIComponent(CONFIG.path)}#SRM-Railway-${idx+1}\n`;
        });
        res.end(Buffer.from(output).toString('base64'));
        return;
    }

    res.writeHead(200, { "Content-Type": "text/html;charset=UTF-8" });
    res.end(`<h1>SRM Panel is Online!</h1><p>پنل شما با موفقیت اجرا شد.</p>`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
