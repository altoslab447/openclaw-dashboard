import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const {
    parseKanban, parseSessionState, parseIdentity, parseMemory,
    parseSkills, parseCronJobs, parseConfig, parseStability,
    readRecentLogs, parseSingleLogLine,
    getOpenClawDir, getWorkspaceDirPath
} = require('./parsers.cjs');

const app = express();
const PORT = process.env.PORT || 3456;
const OPENCLAW_DIR = getOpenClawDir();
const WORKSPACE_DIR = getWorkspaceDirPath();

// ===== 啟動檢查 =====
if (!fs.existsSync(OPENCLAW_DIR)) {
    console.error(`\n❌ 找不到 OpenClaw 目錄: ${OPENCLAW_DIR}`);
    console.error(`   請確認 OpenClaw 已安裝，或設定環境變數 OPENCLAW_HOME。`);
    console.error(`   範例: OPENCLAW_HOME=/path/to/.openclaw node server.js\n`);
    process.exit(1);
}

console.log(`📂 OpenClaw 目錄: ${OPENCLAW_DIR}`);
console.log(`📂 工作區目錄: ${WORKSPACE_DIR}`);

app.use(cors());

// Serve React build (dist/) with SPA fallback
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_EXISTS = fs.existsSync(DIST_DIR);

if (DIST_EXISTS) {
    app.use(express.static(DIST_DIR));
} else {
    // Fallback to legacy public/ if dist/ not built yet
    const PUBLIC_DIR = path.join(__dirname, 'public');
    if (fs.existsSync(PUBLIC_DIR)) {
        app.use(express.static(PUBLIC_DIR));
    }
}

// ===== REST API =====
app.get('/api/agent', (req, res) => {
    res.json({ identity: parseIdentity(), session: parseSessionState() });
});

app.get('/api/kanban', (req, res) => res.json(parseKanban()));
app.get('/api/skills', (req, res) => res.json(parseSkills()));
app.get('/api/cron', (req, res) => res.json(parseCronJobs()));
app.get('/api/memory', (req, res) => res.json(parseMemory()));
app.get('/api/config', (req, res) => res.json(parseConfig()));
app.get('/api/stability', (req, res) => res.json(parseStability()));

app.get('/api/logs', (req, res) => {
    const count = Math.min(parseInt(req.query.count) || 100, 500);
    res.json(readRecentLogs(count));
});

app.get('/api/all', (req, res) => {
    res.json({
        agent: { identity: parseIdentity(), session: parseSessionState() },
        kanban: parseKanban(),
        skills: parseSkills(),
        cron: parseCronJobs(),
        memory: parseMemory(),
        config: parseConfig(),
        stability: parseStability(),
        timestamp: new Date().toISOString()
    });
});

// SPA fallback — serve index.html for all non-API routes
if (DIST_EXISTS) {
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(DIST_DIR, 'index.html'));
        }
    });
}

// ===== HTTP + WebSocket 伺服器 =====
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 廣播給所有連線的客戶端
function broadcast(type, data) {
    const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(msg);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('📡 WebSocket 客戶端已連線');
    ws.send(JSON.stringify({ type: 'connected', data: { message: '🦞 已連線至任務指揮中心' } }));

    ws.on('close', () => {
        console.log('📡 WebSocket 客戶端已斷線');
    });
});

// ===== 即時日誌監控 =====
const LOG_PATH = path.join(OPENCLAW_DIR, 'logs', 'gateway.log');
let lastLogSize = 0;

try {
    if (fs.existsSync(LOG_PATH)) {
        lastLogSize = fs.statSync(LOG_PATH).size;
    }
} catch { }

// 使用 chokidar 監控日誌檔案變更
if (fs.existsSync(path.dirname(LOG_PATH))) {
    const logWatcher = chokidar.watch(LOG_PATH, {
        persistent: true,
        usePolling: true,
        interval: 1000,
        ignoreInitial: true
    });

    logWatcher.on('change', () => {
        try {
            const stat = fs.statSync(LOG_PATH);
            if (stat.size > lastLogSize) {
                const fd = fs.openSync(LOG_PATH, 'r');
                const buffer = Buffer.alloc(stat.size - lastLogSize);
                fs.readSync(fd, buffer, 0, buffer.length, lastLogSize);
                fs.closeSync(fd);

                const newContent = buffer.toString('utf-8');
                const newLines = newContent.split('\n').filter(l => l.trim());

                newLines.forEach(line => {
                    const parsed = parseSingleLogLine(line);
                    broadcast('log', parsed);
                });
            } else if (stat.size < lastLogSize) {
                broadcast('log', { timestamp: new Date().toISOString(), tag: 'system', message: '日誌已輪替', raw: '' });
            }
            lastLogSize = stat.size;
        } catch (err) {
            console.error('日誌監控錯誤:', err.message);
        }
    });

    console.log(`👁️  即時監控日誌: ${LOG_PATH}`);
}

// ===== 監控工作區檔案變更 =====
if (fs.existsSync(WORKSPACE_DIR)) {
    const watchPatterns = [
        path.join(WORKSPACE_DIR, 'KANBAN.md'),
        path.join(WORKSPACE_DIR, 'SESSION-STATE.md'),
        path.join(WORKSPACE_DIR, 'IDENTITY.md'),
        path.join(WORKSPACE_DIR, 'SOUL.md'),
        path.join(WORKSPACE_DIR, 'MEMORY.md'),
        path.join(WORKSPACE_DIR, 'SOVEREIGN_PLAN.md'),
        path.join(WORKSPACE_DIR, 'STABILITY.md'),
        path.join(OPENCLAW_DIR, 'cron', 'jobs.json'),
        path.join(OPENCLAW_DIR, 'openclaw.json')
    ].filter(p => fs.existsSync(p));

    if (watchPatterns.length > 0) {
        const fileWatcher = chokidar.watch(watchPatterns, {
            persistent: true,
            usePolling: true,
            interval: 2000,
            ignoreInitial: true
        });

        fileWatcher.on('change', (filePath) => {
            const basename = path.basename(filePath);
            console.log(`🔄 檔案變更: ${basename}`);
            broadcast('data-changed', { file: basename, path: filePath });
        });

        console.log(`👁️  監控 ${watchPatterns.length} 個工作區檔案`);
    }
}

// ===== 啟動 =====
server.listen(PORT, () => {
    console.log(`\n🦞 OpenClaw 任務指揮中心已啟動`);
    console.log(`   🌐 http://localhost:${PORT}`);
    console.log(`   📡 WebSocket ws://localhost:${PORT}`);
    if (!DIST_EXISTS) {
        console.log(`\n   ⚠️  React build 尚未完成，執行 npm run build 生成前端。`);
        console.log(`   💡 開發模式: npm run dev (後端 3456 + 前端 3457)\n`);
    } else {
        console.log();
    }
});
