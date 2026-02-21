const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { WebSocketServer } = require('ws');
const chokidar = require('chokidar');
const {
    parseKanban, parseSessionState, parseIdentity, parseMemory,
    parseSkills, parseCronJobs, parseConfig, parseStability,
    readRecentLogs, parseSingleLogLine, parseDailyLogs,
    getOpenClawDir, getWorkspaceDirPath
} = require('./parsers');

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
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/api/daily-logs', (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    res.json(parseDailyLogs(days));
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
        dailyLogs: parseDailyLogs(7),
        timestamp: new Date().toISOString()
    });
});

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
                // 讀取新增的部分
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
                // 日誌被截斷（輪替），重設大小
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
        path.join(OPENCLAW_DIR, 'openclaw.json'),
        path.join(WORKSPACE_DIR, 'memory')
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
    console.log(`   📡 WebSocket ws://localhost:${PORT}\n`);
});
