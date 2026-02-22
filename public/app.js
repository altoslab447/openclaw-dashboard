// ===== OpenClaw 任務指揮中心 v4 =====

const API_BASE = '';
let ws = null;
let autoScroll = true;
let logCount = 0;
const MAX_LOG_LINES = 300;

// ===== 時鐘 =====
function updateClock() {
    const now = new Date();
    const opts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Taipei' };
    document.getElementById('clock').textContent = now.toLocaleString('zh-TW', opts);
}
setInterval(updateClock, 1000);
updateClock();

// ===== 工具 =====
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function timeAgo(isoStr) {
    if (!isoStr) return '—';
    const diff = Date.now() - new Date(isoStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return '剛剛';
    if (min < 60) return `${min} 分鐘前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 小時前`;
    return `${Math.floor(hr / 24)} 天前`;
}

function fmtTokens(n) {
    if (!n) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return `${n}`;
}

// ===== API =====
async function fetchAll() {
    try {
        const res = await fetch(`${API_BASE}/api/all`);
        return await res.json();
    } catch (err) {
        console.error('API error:', err);
        return null;
    }
}

// ===== WebSocket =====
function connectWS() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}`);
    const ind = document.getElementById('wsIndicator');

    ws.onopen = () => {
        ind.className = 'ws-indicator';
        ind.querySelector('.ws-text').textContent = '即時連線';
    };
    ws.onclose = () => {
        ind.className = 'ws-indicator offline';
        ind.querySelector('.ws-text').textContent = '已斷線';
        setTimeout(connectWS, 3000);
    };
    ws.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'log-line') appendLog(msg.data);
            else if (msg.type === 'data-changed') refresh();
        } catch { }
    };
}
connectWS();

// ===== 日誌 =====
function appendLog(line) {
    const c = document.getElementById('logContainer');
    if (logCount === 0) c.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'log-line';
    div.innerHTML = fmtLog(line);
    c.appendChild(div);
    logCount++;
    while (c.children.length > MAX_LOG_LINES) c.removeChild(c.firstChild);
    if (autoScroll) c.scrollTop = c.scrollHeight;
}

function fmtLog(raw) {
    if (!raw) return '';
    let h = esc(raw);
    h = h.replace(/^(\d{2}:\d{2}:\d{2})/, '<span class="log-time">$1</span>');
    h = h.replace(/\b(ws)\b/gi, '<span class="log-tag ws">ws</span>');
    h = h.replace(/\b(agent\/embedded)\b/g, '<span class="log-tag agent">agent/embedded</span>');
    h = h.replace(/\b(browser\/chrome)\b/g, '<span class="log-tag browser">browser/chrome</span>');
    h = h.replace(/\b(cron)\b/gi, '<span class="log-tag cron">cron</span>');
    h = h.replace(/\b(error|fail|crash)\b/gi, '<span class="log-tag error">$1</span>');
    return h;
}

// ===== 刷新 =====
async function refresh() {
    const data = await fetchAll();
    if (!data) return;
    renderHero(data.agentStatus);
    renderIntro(data.agent);
    renderTokens(data.sessions, data.tokenTrend);
    renderLearning(data.dailyLogs, data.summaries);
}

// ===== 1. Hero — 龍蝦狀態 =====
function renderHero(s) {
    if (!s) return;
    const el = document.getElementById('heroSection');
    el.className = `section hero-section ${s.status}`;

    const labels = { working: '🟢 正在工作中...', standby: '🟡 待命中', sleeping: '💤 休眠中' };
    document.getElementById('heroStatus').textContent = labels[s.status] || '—';
    document.getElementById('heroSubtitle').textContent = s.lastActivityAt ? `最後活動：${timeAgo(s.lastActivityAt)}` : '';

    const actionEl = document.getElementById('heroAction');
    if (s.lastAction) {
        actionEl.textContent = s.lastAction;
        actionEl.style.display = '';
    } else {
        actionEl.style.display = 'none';
    }
}

// ===== 2. 自我介紹 =====
function renderIntro(agent) {
    if (!agent) return;
    const el = document.getElementById('introContent');
    const id = agent.identity || {};

    const name = id.name || 'Mr. 蝦蝦';
    const role = id.role || '';
    const vibe = id.vibe || '';
    const coreSkill = id.coreSkill || '';

    // coreTruths 特質標籤
    const truths = id.coreTruths || [];
    const traitClasses = { '執行至上': 'exec', '節省為本': 'save', '技術專業': 'tech', '幽默感': 'humor' };

    el.innerHTML = `
        <div class="intro-name">${esc(name)}</div>
        ${role ? `<div class="intro-role">${esc(role)}</div>` : ''}
        ${vibe ? `<div class="intro-bio">「${esc(vibe)}」</div>` : ''}
        ${coreSkill ? `<div class="intro-bio">🎯 ${esc(coreSkill)}</div>` : ''}
        ${truths.length > 0 ? `
            <div class="intro-traits">
                ${truths.map(t => {
        const cls = traitClasses[t.key] || '';
        return `<span class="intro-trait ${cls}" title="${esc(t.value)}">${esc(t.key)}</span>`;
    }).join('')}
            </div>
        ` : ''}
    `;
}

// ===== 3. Token 消耗 =====
function renderTokens(sessions, trend) {
    if (!sessions) return;
    const list = document.getElementById('tokenList');
    list.innerHTML = '';

    const ranked = sessions.filter(s => s.totalTokens > 0).sort((a, b) => b.totalTokens - a.totalTokens);
    const maxT = ranked[0]?.totalTokens || 1;
    const total = ranked.reduce((sum, s) => sum + s.totalTokens, 0);

    document.getElementById('tokenTotal').textContent = fmtTokens(total);

    const labels = { dm: '主要對話', group: '群組對話', cron: '排程任務', subagent: '子代理', topic: '話題', other: '其他' };

    ranked.forEach(s => {
        let name = s.origin || labels[s.type] || s.key;
        if (s.type === 'cron') {
            const m = s.key.match(/cron:([a-f0-9-]+)/);
            name = m ? `排程 ${m[1].substring(0, 8)}` : '排程';
        }
        if (s.type === 'dm' && !s.origin) name = '主要對話';

        const pct = (s.totalTokens / maxT * 100).toFixed(0);
        const row = document.createElement('div');
        row.className = 'token-row';
        row.innerHTML = `
            <div class="token-row-header">
                <span class="token-label">${s.icon} ${esc(name)}</span>
                <span class="token-value">${fmtTokens(s.totalTokens)}</span>
            </div>
            <div class="token-bar-bg"><div class="token-bar-fill" style="width:${pct}%"></div></div>
        `;
        list.appendChild(row);
    });

    // 迷你趨勢
    if (trend?.length > 0) {
        const mini = document.getElementById('tokenTrendMini');
        mini.innerHTML = '';
        const mx = Math.max(...trend.map(d => d.totalTokens), 1);
        trend.forEach((d, i) => {
            const bar = document.createElement('div');
            bar.className = `mini-bar${i === trend.length - 1 ? ' today' : ''}`;
            bar.style.height = `${Math.max(2, (d.totalTokens / mx) * 100)}%`;
            bar.title = `${d.date.substring(5)}: ${fmtTokens(d.totalTokens)}`;
            mini.appendChild(bar);
        });
    }
}

// ===== 4. 最近動態（對話 + 記憶） =====
function renderLearning(logs, summaries) {
    const tl = document.getElementById('learningTimeline');
    tl.innerHTML = '';

    let count = 0;

    // 先顯示最近對話（來自 JSONL）
    if (summaries && summaries.length > 0) {
        summaries.forEach(session => {
            if (!session.messages || session.messages.length === 0) return;
            const block = document.createElement('div');
            block.className = 'learning-day conversation-block';

            const name = session.origin || session.key;
            block.innerHTML = `<div class="learning-date conversation-date">💬 ${esc(name)} · ${timeAgo(session.updatedAt)}</div>`;

            session.messages.forEach(m => {
                const el = document.createElement('div');
                el.className = 'learning-item conversation-msg';
                el.textContent = m.text.length > 150 ? m.text.substring(0, 150) + '...' : m.text;
                block.appendChild(el);
            });

            tl.appendChild(block);
            count++;
        });
    }

    // 再顯示每日記憶日誌
    if (logs && logs.length > 0) {
        logs.forEach(log => {
            const day = document.createElement('div');
            day.className = 'learning-day';

            const now = new Date();
            const ld = new Date(log.date + 'T00:00:00');
            const diff = Math.floor((now - ld) / 86400000);
            let label = log.date;
            if (diff === 0) label = `今天 · ${log.date}`;
            else if (diff === 1) label = `昨天 · ${log.date}`;

            day.innerHTML = `<div class="learning-date">${label}</div>`;

            if (log.sections?.length > 0) {
                log.sections.forEach(sec => {
                    if (sec.items?.length > 0) {
                        sec.items.slice(0, 3).forEach(item => {
                            const el = document.createElement('div');
                            el.className = 'learning-item';
                            el.textContent = item.length > 120 ? item.substring(0, 120) + '...' : item;
                            day.appendChild(el);
                        });
                    } else if (sec.title) {
                        const el = document.createElement('div');
                        el.className = 'learning-item';
                        el.textContent = sec.title;
                        day.appendChild(el);
                    }
                });
            } else {
                const el = document.createElement('div');
                el.className = 'learning-item';
                el.textContent = log.title || '無詳細內容';
                day.appendChild(el);
            }

            tl.appendChild(day);
            count++;
        });
    }

    document.getElementById('learningCount').textContent = count > 0 ? `${count} 則` : '—';
    if (count === 0) tl.innerHTML = '<div class="empty-state">暫無紀錄</div>';
}

// ===== 日誌收起 =====
document.getElementById('logToggle').addEventListener('click', () => {
    document.getElementById('logSection').classList.toggle('collapsed');
});

// ===== 啟動 =====
refresh();
