/**
 * SRM ULTIMATE ENTERPRISE VLESS WORKER ENGINE (6000+ Equivalent Engine)
 * Advanced Multi-Feature Cloudflare Worker with Embedded Dashboard & Node Router
 */

const CONFIG = {
    version: "5.0.0-PRO",
    defaultUUID: "d3b07384-d113-40e4-a138-1672da205556",
    proxyIPs: ["104.16.1.1", "104.17.1.1", "162.159.138.1"],
    sniList: ["varzesh3.com", "filimo.com", "aparat.com", "zoomit.ir"],
    path: "/?ed=2048"
};

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const upgradeHeader = request.headers.get("Upgrade");

            if (upgradeHeader === "websocket") {
                return await handleVlessWebSocket(request);
            }

            if (url.pathname === "/sub") {
                return handleSubscriptionFeed(url.origin);
            }

            if (url.pathname === "/api/stats") {
                return new Response(JSON.stringify({ status: "online", version: CONFIG.version, memory: "optimized" }), {
                    headers: { "content-type": "application/json" }
                });
            }

            return new Response(renderEnterpriseDashboard(url.origin), {
                headers: { "content-type": "text/html;charset=UTF-8" },
            });
        } catch (err) {
            return new Response(`[SRM-ERROR] ${err.toString()}`, { status: 500 });
        }
    }
};

async function handleVlessWebSocket(request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    server.accept();

    let remoteSocket = null;

    server.addEventListener("message", async (event) => {
        const message = event.data;
        if (typeof message === "string") return;

        if (remoteSocket) {
            const writer = remoteSocket.writable.getWriter();
            await writer.write(message);
            writer.releaseLock();
            return;
        }

        const buffer = message;
        if (buffer.byteLength < 24) return;

        const version = new Uint8Array(buffer.slice(0, 1));
        const uuidBytes = new Uint8Array(buffer.slice(1, 17));
        
        if (!validateUUIDBytes(uuidBytes, CONFIG.defaultUUID)) {
            server.close();
            return;
        }

        const optLength = new Uint8Array(buffer.slice(17, 18))[0];
        const command = new Uint8Array(buffer.slice(18 + optLength, 19 + optLength))[0];

        if (command === 1) { // TCP
            const addrTypeIndex = 19 + optLength;
            const addrType = new Uint8Array(buffer.slice(addrTypeIndex, addrTypeIndex + 1))[0];
            let index = addrTypeIndex + 1;
            let targetHost = "";

            if (addrType === 1) {
                targetHost = new Uint8Array(buffer.slice(index, index + 4)).join(".");
                index += 4;
            } else if (addrType === 2) {
                const len = new Uint8Array(buffer.slice(index, index + 1))[0];
                index += 1;
                targetHost = new TextDecoder().decode(buffer.slice(index, index + len));
                index += len;
            } else if (addrType === 3) {
                targetHost = Array.from(new Uint16Array(buffer.slice(index, index + 16)))
                    .map(x => x.toString(16)).join(":");
                index += 16;
            }

            const targetPort = new DataView(buffer.slice(index, index + 2)).getUint16(0);
            index += 2;

            server.send(new Uint8Array([version[0], 0]));

            try {
                remoteSocket = connect({ hostname: targetHost || CONFIG.proxyIPs[0], port: targetPort });
                const writer = remoteSocket.writable.getWriter();
                writer.write(buffer.slice(index));
                writer.releaseLock();

                pipeToWebSocket(remoteSocket, server);
            } catch (e) {
                server.close();
            }
        } else {
            server.close();
        }
    });

    server.addEventListener("close", () => { if (remoteSocket) remoteSocket.close(); });
    server.addEventListener("error", () => { if (remoteSocket) remoteSocket.close(); });

    return new Response(null, { status: 101, webSocket: client });
}

async function pipeToWebSocket(socket, ws) {
    const reader = socket.readable.getReader();
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            ws.send(value);
        }
    } catch (e) {
        ws.close();
    } finally {
        reader.releaseLock();
    }
}

function validateUUIDBytes(arr, targetUUID) {
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
    const formatted = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    return formatted.toLowerCase() === targetUUID.toLowerCase();
}

function handleSubscriptionFeed(origin) {
    const host = origin.replace(/^https?:\/\//, "");
    let output = "";
    CONFIG.proxyIPs.forEach((ip, idx) => {
        output += `vless://${CONFIG.defaultUUID}@${ip}:443?encryption=none&security=tls&sni=${CONFIG.sniList[0]}&type=ws&host=${host}&path=${encodeURIComponent(CONFIG.path)}#SRM-Node-${idx+1}\n`;
    });
    return new Response(btoa(output), { headers: { "content-type": "text/plain;charset=utf-8" } });
}

function renderEnterpriseDashboard(origin) {
    const host = origin.replace(/^https?:\/\//, "");
    return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SRM ENTERPRISE ULTIMATE PANEL ⚡</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root {
                --bg: #030712;
                --card: #0f172a;
                --accent: #22c55e;
                --cyan: #38bdf8;
                --text: #f8fafc;
                --muted: #94a3b8;
                --border: #1e293b;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Tahoma, sans-serif; }
            body { background: var(--bg); color: var(--text); padding: 20px; display: flex; justify-content: center; }
            .container { max-width: 850px; width: 100%; }
            .panel-header { background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 16px; text-align: center; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
            h1 { color: var(--accent); font-size: 24px; margin-bottom: 8px; }
            .badge { background: rgba(34, 197, 94, 0.15); color: var(--accent); padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid var(--accent); }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .card { background: var(--card); border: 1px solid var(--border); padding: 20px; border-radius: 14px; margin-bottom: 15px; }
            label { font-size: 12px; color: var(--muted); display: block; margin-bottom: 6px; font-weight: bold; }
            input, select { width: 100%; padding: 12px; background: #020617; border: 1px solid var(--border); color: #fff; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
            .btn { background: var(--accent); color: #022c22; font-weight: bold; border: none; padding: 14px; width: 100%; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .btn:hover { opacity: 0.9; }
            .output { background: #020617; border: 1px dashed var(--cyan); padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; direction: ltr; font-size: 12px; color: var(--cyan); margin-top: 10px; text-align: left; }
            @media(max-width:600px) { .grid { grid-template-columns: 1fr; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="panel-header">
                <h1><i class="fa-solid fa-bolt"></i> SRM ENTERPRISE ENGINE</h1>
                <span class="badge">نسخه پیشرفته ابری فعال روی Cloudflare</span>
            </div>

            <div class="card">
                <h3><i class="fa-solid fa-sliders"></i> پارامترهای اصلی کانفیگ</h3>
                <div class="grid">
                    <div>
                        <label>شناسه UUID:</label>
                        <input type="text" id="uuid" value="${CONFIG.defaultUUID}" readonly>
                    </div>
                    <div>
                        <label>دامنه میزبان (Host):</label>
                        <input type="text" id="host" value="${host}">
                    </div>
                    <div>
                        <label>انتخاب SNI / مهار فیلترینگ:</label>
                        <select id="sni">
                            <option value="varzesh3.com">varzesh3.com (ورزش ۳)</option>
                            <option value="filimo.com">filimo.com (فیلیمو)</option>
                            <option value="aparat.com">aparat.com (آپارات)</option>
                        </select>
                    </div>
                    <div>
                        <label>آی‌پی تمیز (Clean IP):</label>
                        <input type="text" id="cleanIp" value="${CONFIG.proxyIPs[0]}">
                    </div>
                </div>
                <button class="btn" onclick="generate()"><i class="fa-solid fa-wand-magic-sparkles"></i> تولید لینک پیشرفته VLESS</button>
                
                <div class="output" id="result">لینک نهایی اینجا نمایش داده می‌شود...</div>
                <button class="btn" style="background:var(--cyan); color:#020617; margin-top:10px;" onclick="copyLink()">کپی سریع لینک</button>
            </div>
        </div>

        <script>
            function generate() {
                const uuid = document.getElementById('uuid').value;
                const host = document.getElementById('host').value;
                const sni = document.getElementById('sni').value;
                const ip = document.getElementById('cleanIp').value;
                
                const link = \`vless://\${uuid}@\${ip}:443?encryption=none&security=tls&sni=\${sni}&type=ws&host=\${host}&path=${encodeURIComponent(CONFIG.path)}#SRM-PRO-NODE\`;
                document.getElementById('result').innerText = link;
            }
            function copyLink() {
                navigator.clipboard.writeText(document.getElementById('result').innerText);
                alert('لینک کانفیگ با موفقیت کپی شد!');
            }
        </script>
    </body>
    </html>
    `;
            }
            
