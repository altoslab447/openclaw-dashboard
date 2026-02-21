// ===== OpenClaw 任務指揮中心 — 前端邏輯 v2 =====

const API_BASE = '';
let ws = null;
let autoScroll = true;
let logCount = 0;
const MAX_LOG_LINES = 500;

// ===== 時鐘 =====
function updateClock() {
    const now = new Date();
    const opts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Taipei' };
    document.getElementById('clock').textContent = now.toLocaleString('zh-TW', opts);
}
setInterval(updateClock, 1000);
updateClock();

// ===== WebSocket 連線 =====
function connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        updateWsIndicator(true);
        console.log('🦞 WebSocket 已連線');
    };

    ws.onclose = () => {
        updateWsIndicator(false);
        console.log('📡 WebSocket 已斷線，3 秒後重連...');
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
        updateWsIndicator(false);
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleWsMessage(msg);
        } catch { }
    };
}

function updateWsIndicator(connected) {
    const el = document.getElementById('wsIndicator');
    const textEl = el.querySelector('.ws-text');
    if (connected) {
        el.classList.add('connected');
        textEl.textContent = '即時連線';
    } else {
        el.classList.remove('connected');
        textEl.textContent = '重連中...';
    }
}

function handleWsMessage(msg) {
    switch (msg.type) {
        case 'log':
            appendLogEntry(msg.data);
            break;
        case 'data-changed':
            console.log(`🔄 檔案變更: ${msg.data.file}`);
            refresh(); // 檔案變更時自動刷新所有資料
            break;
        case 'connected':
            appendLogEntry({ timestamp: new Date().toISOString(), tag: 'system', message: msg.data.message });
            break;
    }
}

// ===== 日誌面板 =====
function appendLogEntry(entry) {
    const container = document.getElementById('logContainer');

    // 移除空狀態提示
    const emptyEl = container.querySelector('.log-empty');
    if (emptyEl) emptyEl.remove();

    const div = document.createElement('div');
    div.className = 'log-entry log-new-indicator';

    const timeStr = entry.timestamp ? formatLogTime(entry.timestamp) : '';
    const tagClass = getTagClass(entry.tag);
    const isError = entry.message && (entry.message.includes('error') || entry.message.includes('Error') || entry.message.includes('❌'));

    div.innerHTML = `
    <span class="log-time">${escHtml(timeStr)}</span>
    <span class="log-tag ${tagClass}">${escHtml(entry.tag || 'info')}</span>
    <span class="log-msg${isError ? ' error-msg' : ''}">${escHtml(entry.message || '')}</span>
  `;

    container.appendChild(div);
    logCount++;

    // 限制日誌行數
    while (logCount > MAX_LOG_LINES) {
        const first = container.querySelector('.log-entry');
        if (first) { first.remove(); logCount--; }
        else break;
    }

    // 自動捲動
    if (autoScroll) {
        container.scrollTop = container.scrollHeight;
    }
}

function formatLogTime(ts) {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
        return ts.substring(11, 19);
    }
}

function getTagClass(tag) {
    if (!tag) return 'system';
    const t = tag.toLowerCase();
    if (t.includes('gateway')) return 'gateway';
    if (t.includes('agent')) return 'agent';
    if (t.includes('ws')) return 'ws';
    if (t.includes('heartbeat')) return 'heartbeat';
    if (t.includes('error') || t.includes('err')) return 'error';
    return 'system';
}

async function loadInitialLogs() {
    try {
        const res = await fetch(`${API_BASE}/api/logs?count=50`);
        if (!res.ok) return;
        const logs = await res.json();
        logs.forEach(entry => appendLogEntry(entry));
    } catch { }
}

// ===== 資料載入 =====
async function fetchAll() {
    try {
        const res = await fetch(`${API_BASE}/api/all`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('載入資料失敗:', err);
        return null;
    }
}

// ===== 渲染：代理人身份 =====
function renderAgent(data) {
    if (!data) return;
    const { identity, session } = data;

    document.getElementById('agentEmoji').textContent = identity.emoji || '🤖';
    document.getElementById('agentName').textContent = identity.name || '未知代理人';
    document.getElementById('agentRole').textContent = identity.role || '';
    document.getElementById('agentVibe').textContent = identity.vibe || '';
    document.getElementById('agentCoreSkill').textContent = identity.coreSkill || '';

    const wallet = session.walletAddress || '—';
    const walletEl = document.getElementById('agentWallet');
    walletEl.textContent = wallet.length > 20 ? wallet.substring(0, 8) + '...' + wallet.substring(wallet.length - 6) : wallet;
    walletEl.title = wallet;

    document.getElementById('agentAcp').textContent = session.acpStatus || '—';
    document.getElementById('agentService').textContent = session.serviceItem || '—';

    const statusBadge = document.getElementById('agentStatus');
    const acp = session.acpStatus || '';
    const isOnline = acp.includes('已上線') || acp.includes('Open');
    statusBadge.textContent = isOnline ? '在線' : '離線';
    statusBadge.className = `status-badge ${isOnline ? 'online' : 'offline'}`;

    const truthsEl = document.getElementById('soulTruths');
    truthsEl.innerHTML = '';
    if (identity.coreTruths) {
        identity.coreTruths.forEach(t => {
            const tag = document.createElement('span');
            tag.className = 'soul-tag';
            tag.innerHTML = `<strong>${escHtml(t.key)}</strong> ${escHtml(t.value)}`;
            truthsEl.appendChild(tag);
        });
    }
}

// ===== 渲染：任務看板 =====
function renderKanban(data) {
    if (!data) return;
    renderColumn('activeItems', data.active);
    renderColumn('backlogItems', data.backlog);
    renderColumn('completedItems', data.completed);
    document.getElementById('activeCount').textContent = data.active.length;
    document.getElementById('backlogCount').textContent = data.backlog.length;
    document.getElementById('completedCount').textContent = data.completed.length;
    if (data.lastUpdated) {
        document.getElementById('kanbanUpdated').textContent = `更新: ${data.lastUpdated}`;
    }
}

function renderColumn(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>暫無項目</div>';
        return;
    }
    items.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = `kanban-card${item.done ? ' done' : ''}`;

        let text = item.text;
        const tagMatch = text.match(/【(.+?)】/);
        let tagHtml = '';
        if (tagMatch) {
            tagHtml = `<span class="card-tag">${escHtml(tagMatch[1])}</span>`;
            text = text.replace(/【.+?】/, '').trim();
        }
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/^[：:]\s*/, '');
        card.innerHTML = `${tagHtml}${text}`;
        container.appendChild(card);
    });
}

// ===== 渲染：已安裝技能 =====
function renderSkills(data) {
    if (!data) return;
    const grid = document.getElementById('skillsGrid');
    grid.innerHTML = '';
    document.getElementById('skillCount').textContent = data.length;
    if (data.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔧</div>尚未安裝技能</div>';
        return;
    }
    const icons = { '1password': '🔐', 'coding-agent': '💻', 'openclaw-acp': '🤖', 'summarize': '📝', 'yahoo-finance': '📈' };
    data.forEach(skill => {
        const card = document.createElement('div');
        card.className = 'skill-card';
        const icon = icons[skill.name] || '🛠';
        const version = skill.version ? `v${skill.version}` : '';
        const type = skill.type === 'directory' ? '本地套件' : '連結';
        card.innerHTML = `
      <div class="skill-icon">${icon}</div>
      <div class="skill-name">${escHtml(skill.name)}</div>
      <div class="skill-type">${escHtml(type)}${version ? ' · ' + escHtml(version) : ''}</div>
      ${skill.description ? `<div class="skill-desc">${escHtml(skill.description)}</div>` : ''}
    `;
        grid.appendChild(card);
    });
}

// ===== 渲染：排程任務 =====
function renderCron(data) {
    if (!data) return;
    const list = document.getElementById('cronList');
    list.innerHTML = '';
    document.getElementById('cronCount').textContent = data.length;
    if (data.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏰</div>暫無排程任務</div>';
        return;
    }
    data.forEach(job => {
        const card = document.createElement('div');
        card.className = 'cron-card';
        const status = !job.enabled ? 'disabled' : (job.state.lastStatus === 'ok' ? 'ok' : 'error');
        const statusIcon = status === 'ok' ? '✅' : status === 'error' ? '❌' : '⏸️';
        const statusLabel = status === 'ok' ? '正常' : status === 'error' ? '錯誤' : '已停用';

        let scheduleText = '';
        if (job.schedule) {
            if (job.schedule.kind === 'cron') {
                scheduleText = `cron: ${job.schedule.expr}`;
                if (job.schedule.tz) scheduleText += ` (${job.schedule.tz})`;
            } else if (job.schedule.kind === 'every') {
                const hrs = Math.round(job.schedule.everyMs / 3600000);
                scheduleText = `每 ${hrs} 小時`;
            }
        }

        const lastRun = job.state.lastRunAt ? formatTime(job.state.lastRunAt) : '—';
        const nextRun = job.state.nextRunAt ? formatTime(job.state.nextRunAt) : '—';
        const duration = job.state.lastDuration ? `${(job.state.lastDuration / 1000).toFixed(1)}秒` : '';

        card.innerHTML = `
      <div class="cron-status-icon ${status}">${statusIcon}</div>
      <div class="cron-info">
        <h4>${escHtml(job.name)}</h4>
        <div class="cron-schedule">${escHtml(scheduleText)}</div>
      </div>
      <div class="cron-meta">
        <span class="cron-badge ${status}">${statusLabel}</span>
        <div class="cron-time">上次: ${escHtml(lastRun)}${duration ? ' · ' + duration : ''}</div>
        ${nextRun !== '—' ? `<div class="cron-time">下次: ${escHtml(nextRun)}</div>` : ''}
      </div>
      ${job.state.lastError ? `<div class="cron-error-msg">⚠️ ${escHtml(job.state.lastError)}</div>` : ''}
    `;
        list.appendChild(card);
    });
}

// ===== 渲染：系統設定 =====
function renderConfig(data) {
    if (!data) return;
    const content = document.getElementById('configContent');
    content.innerHTML = '';

    const gw = data.gateway || {};
    content.appendChild(createConfigSection('🌐 閘道器', [
        ['連接埠', gw.port], ['模式', gw.mode], ['綁定', gw.bind], ['Tailscale', gw.tailscale], ['版本', data.version]
    ]));

    const modelsSection = document.createElement('div');
    modelsSection.className = 'config-section';
    modelsSection.innerHTML = `<h4>🧠 模型配置</h4>`;

    const primaryRow = document.createElement('div');
    primaryRow.className = 'config-row';
    primaryRow.innerHTML = `<span class="config-key">主模型</span><span class="model-tag primary">${escHtml(data.primaryModel || '—')}</span>`;
    modelsSection.appendChild(primaryRow);

    if (data.activeModels && data.activeModels.length > 0) {
        const modelsDiv = document.createElement('div');
        modelsDiv.style.cssText = 'margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;';
        data.activeModels.forEach(m => {
            const tag = document.createElement('span');
            tag.className = 'model-tag';
            tag.textContent = m;
            modelsDiv.appendChild(tag);
        });
        modelsSection.appendChild(modelsDiv);
    }

    const concRow = document.createElement('div');
    concRow.className = 'config-row';
    concRow.style.marginTop = '8px';
    concRow.innerHTML = `<span class="config-key">並發數</span><span class="config-val">主: ${data.maxConcurrent || '—'} · 子代理: ${data.subagentMaxConcurrent || '—'} (${escHtml(data.subagentModel || '—')})</span>`;
    modelsSection.appendChild(concRow);
    content.appendChild(modelsSection);

    const channelsSection = createConfigSection('📡 頻道與插件', []);
    if (data.channels) {
        Object.entries(data.channels).forEach(([name, ch]) => {
            const row = document.createElement('div');
            row.className = 'config-row';
            row.innerHTML = `<span class="config-key">${escHtml(name)}</span><span class="config-val">${ch.enabled ? '✅ 已啟用' : '❌ 已停用'}${ch.streamMode ? ' · ' + ch.streamMode : ''}</span>`;
            channelsSection.appendChild(row);
        });
    }
    if (data.plugins) {
        Object.entries(data.plugins).forEach(([name, pl]) => {
            const row = document.createElement('div');
            row.className = 'config-row';
            row.innerHTML = `<span class="config-key">插件: ${escHtml(name)}</span><span class="config-val">${pl.enabled ? '✅' : '❌'}</span>`;
            channelsSection.appendChild(row);
        });
    }
    content.appendChild(channelsSection);
}

function createConfigSection(title, rows) {
    const section = document.createElement('div');
    section.className = 'config-section';
    section.innerHTML = `<h4>${title}</h4>`;
    rows.forEach(([key, val]) => {
        const row = document.createElement('div');
        row.className = 'config-row';
        row.innerHTML = `<span class="config-key">${escHtml(key)}</span><span class="config-val">${escHtml(String(val ?? '—'))}</span>`;
        section.appendChild(row);
    });
    return section;
}

// ===== 渲染：記憶與進化計畫 =====
function renderMemory(data) {
    if (!data) return;
    const content = document.getElementById('memoryContent');
    content.innerHTML = '';

    if (data.plan) {
        const planSection = document.createElement('div');
        planSection.className = 'memory-section';
        planSection.innerHTML = `<h4>🦞 ${escHtml(data.plan.title || '進化計畫')}</h4>`;

        if (data.plan.goal) {
            const goalDiv = document.createElement('div');
            goalDiv.className = 'plan-goal';
            goalDiv.textContent = `🎯 ${data.plan.goal}`;
            planSection.appendChild(goalDiv);
        }

        if (data.plan.sections) {
            data.plan.sections.forEach(sec => {
                const h5 = document.createElement('div');
                h5.className = 'memory-item';
                h5.innerHTML = `<strong>${escHtml(sec.title)}</strong>`;
                planSection.appendChild(h5);
                sec.items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'memory-item';
                    div.style.paddingLeft = '12px';
                    div.innerHTML = `→ ${formatMd(item)}`;
                    planSection.appendChild(div);
                });
            });
        }
        content.appendChild(planSection);
    }

    if (data.entries && data.entries.length > 0) {
        data.entries.forEach(sec => {
            const section = document.createElement('div');
            section.className = 'memory-section';
            section.innerHTML = `<h4>📂 ${escHtml(sec.title)}</h4>`;
            sec.items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'memory-item';
                div.innerHTML = formatMd(item);
                section.appendChild(div);
            });
            content.appendChild(section);
        });
    }
}

// ===== 工具函式 =====
function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatMd(text) {
    if (!text) return '';
    let s = escHtml(text);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:0.9em;">$1</code>');
    return s;
}

function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return '剛剛';
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    if (diffHr < 24) return `${diffHr} 小時前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

// ===== 主刷新 =====
async function refresh() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    const data = await fetchAll();
    if (data) {
        renderAgent(data.agent);
        renderKanban(data.kanban);
        renderSkills(data.skills);
        renderCron(data.cron);
        renderConfig(data.config);
        renderMemory(data.memory);
        renderDailyLogs(data.dailyLogs);
    }
    setTimeout(() => btn.classList.remove('spinning'), 800);
}

// ===== 渲染：每日活動紀錄 =====
function renderDailyLogs(data) {
    if (!data) return;
    const timeline = document.getElementById('dailyTimeline');
    timeline.innerHTML = '';
    document.getElementById('dailyLogCount').textContent = `${data.length} 天`;

    if (data.length === 0) {
        timeline.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div>暫無每日紀錄</div>';
        return;
    }

    data.forEach((log, idx) => {
        const card = document.createElement('div');
        card.className = `daily-card${idx === 0 ? ' expanded' : ''}`;

        const dateLabel = formatDateLabel(log.date);
        const sectionCount = log.sections.reduce((sum, s) => sum + s.items.length, 0);

        card.innerHTML = `
      <div class="daily-card-header">
        <div class="daily-date">
          <span class="daily-date-badge">${escHtml(log.date)}</span>
          <span class="daily-title">${escHtml(log.title)}${log.isArchive ? '<span class="daily-archive-tag">歸檔</span>' : ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:0.68rem;color:var(--text-muted);">${sectionCount} 筆紀錄 · ${dateLabel}</span>
          <span class="daily-toggle">▼</span>
        </div>
      </div>
      <div class="daily-card-body">
        ${log.sections.map(sec => `
          <div class="daily-section">
            <div class="daily-section-title">${escHtml(sec.title)}</div>
            ${sec.items.map(item => `<div class="daily-item">${formatMd(item)}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    `;

        // 點擊展開/收合
        card.querySelector('.daily-card-header').addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        timeline.appendChild(card);
    });
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today - target) / 86400000);

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    if (diffDays < 7) return `${diffDays} 天前`;
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    refresh();
    loadInitialLogs();
    connectWebSocket();

    // 手動刷新按鈕
    document.getElementById('refreshBtn').addEventListener('click', refresh);

    // 自動捲動開關
    document.getElementById('autoScrollToggle').addEventListener('change', (e) => {
        autoScroll = e.target.checked;
    });

    // 清除日誌
    document.getElementById('clearLogsBtn').addEventListener('click', () => {
        const container = document.getElementById('logContainer');
        container.innerHTML = '<div class="log-empty">日誌已清除</div>';
        logCount = 0;
    });

    // 定期刷新 (作為 WebSocket 的備援)
    setInterval(refresh, 60000);
});
