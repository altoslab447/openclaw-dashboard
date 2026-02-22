const fs = require('fs');
const path = require('path');

// ===== 可配置路徑：環境變數 > 預設 ~/.openclaw =====
const OPENCLAW_DIR = process.env.OPENCLAW_HOME || path.join(process.env.HOME || process.env.USERPROFILE || '', '.openclaw');

function getWorkspaceDir() {
  // 嘗試讀取 openclaw.json 中的 workspace 設定
  try {
    const configRaw = fs.readFileSync(path.join(OPENCLAW_DIR, 'openclaw.json'), 'utf-8');
    const config = JSON.parse(configRaw);
    if (config.agents?.defaults?.workspace) {
      return config.agents.defaults.workspace;
    }
  } catch { }
  return path.join(OPENCLAW_DIR, 'workspace');
}

const WORKSPACE_DIR = getWorkspaceDir();

function readFileSync(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseKanban() {
  const raw = readFileSync(path.join(WORKSPACE_DIR, 'KANBAN.md'));
  if (!raw) return { active: [], backlog: [], completed: [], raw: '' };

  const sections = { active: [], backlog: [], completed: [] };
  let current = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (/進行中|Active|active/i.test(trimmed) && trimmed.startsWith('##')) {
      current = 'active';
    } else if (/規劃中|Backlog|backlog/i.test(trimmed) && trimmed.startsWith('##')) {
      current = 'backlog';
    } else if (/已完成|Completed|completed|Done/i.test(trimmed) && trimmed.startsWith('##')) {
      current = 'completed';
    } else if (current && trimmed.startsWith('- ')) {
      const text = trimmed.replace(/^- (\[.\] )?/, '').trim();
      if (text) {
        const isChecked = /^\[x\]/i.test(trimmed.replace('- ', ''));
        sections[current].push({ text, done: isChecked, raw: trimmed });
      }
    }
  }

  const lastUpdatedMatch = raw.match(/最後更新[：:]\s*(.+)/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null;

  return { ...sections, lastUpdated, raw };
}

function parseSessionState() {
  const raw = readFileSync(path.join(WORKSPACE_DIR, 'SESSION-STATE.md'));
  if (!raw) return {};

  const result = { raw };

  function extractField(fieldName) {
    const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\*\\*${escaped}\\*\\*[：:]\\s*(.+)`, 'i');
    const m = raw.match(re);
    if (!m) return null;
    return m[1].replace(/`/g, '').replace(/\*\*/g, '').trim();
  }

  result.agentIdentity = extractField('Agent Identity') || null;
  result.walletAddress = extractField('Wallet Address') || null;
  result.acpStatus = extractField('ACP Service Status') || null;
  result.serviceItem = extractField('服務項目') || null;
  result.runtime = extractField('Runtime') || null;
  result.role = extractField('角色') || null;

  const tasks = [];
  const taskRegex = /\d+\.\s+(.+)/g;
  let m;
  while ((m = taskRegex.exec(raw)) !== null) {
    tasks.push(m[1].trim());
  }
  if (tasks.length) result.coreTasks = tasks;

  return result;
}

function parseIdentity() {
  const identity = readFileSync(path.join(WORKSPACE_DIR, 'IDENTITY.md'));
  const soul = readFileSync(path.join(WORKSPACE_DIR, 'SOUL.md'));

  const result = {};

  if (identity) {
    const nameMatch = identity.match(/Name:\*?\*?\s*(.+)/);
    if (nameMatch) result.name = nameMatch[1].replace(/\*\*/g, '').trim();

    const roleMatch = identity.match(/Role:\*?\*?\s*(.+)/);
    if (roleMatch) result.role = roleMatch[1].replace(/\*\*/g, '').trim();

    const vibeMatch = identity.match(/Vibe:\*?\*?\s*(.+)/);
    if (vibeMatch) result.vibe = vibeMatch[1].replace(/\*\*/g, '').trim();

    const skillMatch = identity.match(/Core Skill:\*?\*?\s*(.+)/);
    if (skillMatch) result.coreSkill = skillMatch[1].replace(/\*\*/g, '').trim();

    const emojiMatch = identity.match(/Emoji:\*?\*?\s*(.+)/);
    if (emojiMatch) result.emoji = emojiMatch[1].replace(/\*\*/g, '').trim();
  }

  if (soul) {
    const truths = [];
    const truthRegex = /\*\*(.+?)\*\*\.?\s*(.+)/g;
    let m;
    while ((m = truthRegex.exec(soul)) !== null) {
      truths.push({ key: m[1].trim(), value: m[2].trim() });
    }
    result.coreTruths = truths;
    result.soulRaw = soul;
  }

  result.identityRaw = identity;
  return result;
}

function parseMemory() {
  const memory = readFileSync(path.join(WORKSPACE_DIR, 'MEMORY.md'));
  const plan = readFileSync(path.join(WORKSPACE_DIR, 'SOVEREIGN_PLAN.md'));

  const result = { entries: [], plan: null };

  if (memory) {
    const sections = [];
    let currentSection = null;
    for (const line of memory.split('\n')) {
      if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: line.replace('## ', '').trim(), items: [] };
      } else if (currentSection && line.trim().startsWith('- ')) {
        currentSection.items.push(line.trim().replace(/^- /, ''));
      }
    }
    if (currentSection) sections.push(currentSection);
    result.entries = sections;
    result.memoryRaw = memory;
  }

  if (plan) {
    const planSections = [];
    let currentSection = null;
    for (const line of plan.split('\n')) {
      if (line.startsWith('### ')) {
        if (currentSection) planSections.push(currentSection);
        currentSection = { title: line.replace('### ', '').trim(), items: [] };
      } else if (currentSection && line.trim().startsWith('- ')) {
        currentSection.items.push(line.trim().replace(/^- /, ''));
      }
    }
    if (currentSection) planSections.push(currentSection);
    result.plan = {
      title: (plan.match(/^# (.+)/m) || ['', ''])[1].trim(),
      goal: (plan.match(/\*\*終極目標\*\*[：:]\s*(.+)/) || ['', ''])[1].trim(),
      sections: planSections
    };
    result.planRaw = plan;
  }

  return result;
}

function parseSkills() {
  const skillsDir = path.join(WORKSPACE_DIR, 'skills');
  const skills = [];

  try {
    const entries = fs.readdirSync(skillsDir);
    for (const entry of entries) {
      const fullPath = path.join(skillsDir, entry);
      const stat = fs.statSync(fullPath);

      const skill = { name: entry, type: stat.isDirectory() ? 'directory' : 'symlink', path: fullPath };

      if (stat.isDirectory()) {
        const metaContent = readFileSync(path.join(fullPath, '_meta.json'));
        if (metaContent) {
          try { skill.meta = JSON.parse(metaContent); } catch { }
        }

        const skillMd = readFileSync(path.join(fullPath, 'SKILL.md'));
        if (skillMd) {
          const descMatch = skillMd.match(/description:\s*["']?(.+?)["']?\s*$/m);
          if (descMatch) skill.description = descMatch[1];
          skill.hasSkillMd = true;
        }

        const pkgJson = readFileSync(path.join(fullPath, 'package.json'));
        if (pkgJson) {
          try {
            const pkg = JSON.parse(pkgJson);
            skill.version = pkg.version;
            skill.packageName = pkg.name;
          } catch { }
        }
      } else {
        const content = readFileSync(fullPath);
        if (content) skill.target = content.trim();
      }

      skills.push(skill);
    }
  } catch { }

  return skills;
}

function parseCronJobs() {
  const raw = readFileSync(path.join(OPENCLAW_DIR, 'cron', 'jobs.json'));
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    return (data.jobs || []).map(job => ({
      id: job.id,
      name: job.name,
      enabled: job.enabled,
      schedule: job.schedule,
      sessionTarget: job.sessionTarget,
      payload: job.payload?.message?.substring(0, 200) + (job.payload?.message?.length > 200 ? '...' : ''),
      state: {
        lastStatus: job.state?.lastStatus || 'unknown',
        lastRunAt: job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : null,
        nextRunAt: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
        lastDuration: job.state?.lastDurationMs,
        lastError: job.state?.lastError || null,
        consecutiveErrors: job.state?.consecutiveErrors || 0
      }
    }));
  } catch {
    return [];
  }
}

function parseConfig() {
  const raw = readFileSync(path.join(OPENCLAW_DIR, 'openclaw.json'));
  if (!raw) return {};

  try {
    const config = JSON.parse(raw);

    const models = [];
    if (config.models?.providers) {
      for (const [provider, data] of Object.entries(config.models.providers)) {
        for (const model of (data.models || [])) {
          models.push({
            id: `${provider}/${model.id}`,
            name: model.name,
            reasoning: model.reasoning,
            contextWindow: model.contextWindow,
            maxTokens: model.maxTokens
          });
        }
      }
    }

    const activeModels = config.agents?.defaults?.models ? Object.keys(config.agents.defaults.models) : [];
    const primaryModel = config.agents?.defaults?.model?.primary || 'unknown';

    const gateway = {
      port: config.gateway?.port,
      mode: config.gateway?.mode,
      bind: config.gateway?.bind,
      tailscale: config.gateway?.tailscale?.mode
    };

    const channels = {};
    if (config.channels) {
      for (const [name, ch] of Object.entries(config.channels)) {
        channels[name] = { enabled: ch.enabled, streamMode: ch.streamMode };
      }
    }

    const plugins = {};
    if (config.plugins?.entries) {
      for (const [name, pl] of Object.entries(config.plugins.entries)) {
        plugins[name] = { enabled: pl.enabled };
      }
    }

    return {
      version: config.meta?.lastTouchedVersion,
      lastTouched: config.meta?.lastTouchedAt,
      primaryModel, activeModels, models, gateway, channels, plugins,
      maxConcurrent: config.agents?.defaults?.maxConcurrent,
      subagentModel: config.agents?.defaults?.subagents?.model,
      subagentMaxConcurrent: config.agents?.defaults?.subagents?.maxConcurrent
    };
  } catch {
    return {};
  }
}

function parseStability() {
  const raw = readFileSync(path.join(WORKSPACE_DIR, 'STABILITY.md'));
  if (!raw) return { sections: [], raw: '' };

  const sections = [];
  let currentSection = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.replace('## ', '').trim(), items: [] };
    } else if (currentSection && line.trim().startsWith('- ')) {
      currentSection.items.push(line.trim().replace(/^- /, ''));
    }
  }
  if (currentSection) sections.push(currentSection);

  return { sections, raw };
}

// 讀取最近 N 行日誌
function readRecentLogs(n = 100) {
  const logPath = path.join(OPENCLAW_DIR, 'logs', 'gateway.log');
  const raw = readFileSync(logPath);
  if (!raw) return [];

  const lines = raw.split('\n').filter(l => l.trim());
  return lines.slice(-n).map(line => parseSingleLogLine(line));
}

// 解析單行日誌
function parseSingleLogLine(line) {
  // 格式: 2026-02-22T00:12:50.918+08:00 [tag] message
  // 或: 2026-02-21T16:12:50.918Z [tag] message
  const match = line.match(/^(\S+)\s+\[([^\]]+)\]\s*(.*)/);
  if (match) {
    return {
      timestamp: match[1],
      tag: match[2],
      message: match[3],
      raw: line
    };
  }
  return { timestamp: null, tag: null, message: line, raw: line };
}

// 解析每日記憶日誌
function parseDailyLogs(maxDays = 7) {
  const memoryDir = path.join(WORKSPACE_DIR, 'memory');
  const logs = [];

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (!entry.endsWith('.md')) continue;
        // 匹配 YYYY-MM-DD 格式的檔名
        const dateMatch = entry.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) continue;

        const filePath = path.join(dir, entry);
        const raw = readFileSync(filePath);
        if (!raw || raw.trim().length === 0) continue;

        const stat = fs.statSync(filePath);
        const sections = [];
        let currentSection = null;

        for (const line of raw.split('\n')) {
          if (line.startsWith('## ')) {
            if (currentSection) sections.push(currentSection);
            currentSection = { title: line.replace('## ', '').trim(), items: [] };
          } else if (currentSection && line.trim().startsWith('- ')) {
            currentSection.items.push(line.trim().replace(/^- /, ''));
          }
        }
        if (currentSection) sections.push(currentSection);

        // 提取標題
        const titleMatch = raw.match(/^# (.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : entry.replace('.md', '');

        logs.push({
          date: dateMatch[1],
          filename: entry,
          title,
          sections,
          modifiedAt: stat.mtime.toISOString(),
          isArchive: dir.includes('archive')
        });
      }
    } catch { }
  }

  scanDir(memoryDir);
  // 也掃描 archive 子目錄
  const archiveDir = path.join(memoryDir, 'archive');
  if (fs.existsSync(archiveDir)) {
    scanDir(archiveDir);
  }

  // 按日期排序（最新的在前面），取最近 N 天
  logs.sort((a, b) => b.date.localeCompare(a.date));
  return logs.slice(0, maxDays);
}

// 解析近期會話活動 (sessions.json)
function parseRecentSessions(maxSessions = 20) {
  const sessionsFile = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions', 'sessions.json');
  try {
    const raw = fs.readFileSync(sessionsFile, 'utf-8');
    const data = JSON.parse(raw);

    const sessions = [];
    for (const [key, meta] of Object.entries(data)) {
      const updatedAt = meta.updatedAt;
      if (!updatedAt || updatedAt === 0) continue;

      // 判斷 session 類型
      let sessionType = 'unknown';
      let icon = '💬';
      if (key.includes(':cron:')) { sessionType = 'cron'; icon = '⏰'; }
      else if (key.includes(':subagent:')) { sessionType = 'subagent'; icon = '🤖'; }
      else if (key.includes(':group:')) { sessionType = 'group'; icon = '👥'; }
      else if (key === 'agent:main:main') { sessionType = 'dm'; icon = '💬'; }
      else if (key.includes(':topic:')) { sessionType = 'topic'; icon = '📌'; }
      else { sessionType = 'other'; icon = '📡'; }

      // 提取來源標籤
      const origin = meta.origin?.label || meta.origin?.surface || '';
      const channel = meta.channel || meta.lastChannel || '';

      sessions.push({
        key,
        sessionId: meta.sessionId || '',
        type: sessionType,
        icon,
        channel,
        model: meta.model || '',
        modelProvider: meta.modelProvider || '',
        totalTokens: meta.totalTokens || 0,
        inputTokens: meta.inputTokens || 0,
        outputTokens: meta.outputTokens || 0,
        chatType: meta.chatType || '',
        origin,
        updatedAt: new Date(updatedAt).toISOString(),
        updatedAtMs: updatedAt
      });
    }

    // 按最後活動時間排序
    sessions.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    return sessions.slice(0, maxSessions);
  } catch {
    return [];
  }
}

// 從 session JSONL 提取最近對話摘要
function parseSessionSummaries(maxSessions = 5, maxMsgs = 5) {
  const sessionsDir = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions');
  const sessionsFile = path.join(sessionsDir, 'sessions.json');
  try {
    const raw = fs.readFileSync(sessionsFile, 'utf-8');
    const meta = JSON.parse(raw);

    // 找到最近有活動的 sessions（排除 cron）
    const candidates = [];
    for (const [key, m] of Object.entries(meta)) {
      if (!m.updatedAt || m.updatedAt === 0) continue;
      if (key.includes(':cron:')) continue; // 跳過 cron sessions
      const sessionId = m.sessionId;
      if (!sessionId) continue;
      const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
      if (!fs.existsSync(jsonlPath)) continue;
      candidates.push({ key, sessionId, updatedAt: m.updatedAt, jsonlPath, origin: m.origin?.label || '' });
    }
    candidates.sort((a, b) => b.updatedAt - a.updatedAt);

    const results = [];
    for (const c of candidates.slice(0, maxSessions)) {
      try {
        const content = fs.readFileSync(c.jsonlPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        // 從尾端找最近的 user 訊息
        const userMsgs = [];
        for (let i = lines.length - 1; i >= 0 && userMsgs.length < maxMsgs; i--) {
          try {
            const entry = JSON.parse(lines[i]);
            if (entry.type !== 'message') continue;
            const msg = entry.message;
            if (!msg || msg.role !== 'user') continue;

            let text = msg.content;
            if (Array.isArray(text)) {
              text = text.filter(p => p.type === 'text').map(p => p.text).join(' ');
            }
            if (typeof text !== 'string') continue;

            // 移除系統 metadata
            if (text.includes('Conversation info')) {
              const parts = text.split('\n\n');
              text = parts[parts.length - 1];
            }
            // 移除 "System:" 前綴的系統通知
            if (text.startsWith('System:')) continue;
            text = text.trim();
            if (!text || text.length < 3) continue;

            userMsgs.unshift({ text: text.substring(0, 200), timestamp: entry.timestamp });
          } catch { }
        }

        results.push({
          key: c.key,
          origin: c.origin,
          updatedAt: new Date(c.updatedAt).toISOString(),
          messages: userMsgs
        });
      } catch { }
    }
    return results;
  } catch {
    return [];
  }
}

// 計算過去 N 天的 token 用量趨勢
function parseTokenTrend(days = 7) {
  const sessionsFile = path.join(OPENCLAW_DIR, 'agents', 'main', 'sessions', 'sessions.json');
  try {
    const raw = fs.readFileSync(sessionsFile, 'utf-8');
    const data = JSON.parse(raw);

    // 按天彙總 token
    const dayMap = {};
    for (const [key, meta] of Object.entries(data)) {
      const ts = meta.updatedAt;
      if (!ts || ts === 0) continue;
      const day = new Date(ts).toISOString().substring(0, 10);
      if (!dayMap[day]) dayMap[day] = { totalTokens: 0, inputTokens: 0, outputTokens: 0, sessions: 0 };
      dayMap[day].totalTokens += (meta.totalTokens || 0);
      dayMap[day].inputTokens += (meta.inputTokens || 0);
      dayMap[day].outputTokens += (meta.outputTokens || 0);
      dayMap[day].sessions += 1;
    }

    // 產生最近 N 天的資料（含無活動的天數）
    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const day = d.toISOString().substring(0, 10);
      result.push({
        date: day,
        totalTokens: dayMap[day]?.totalTokens || 0,
        inputTokens: dayMap[day]?.inputTokens || 0,
        outputTokens: dayMap[day]?.outputTokens || 0,
        sessions: dayMap[day]?.sessions || 0
      });
    }
    return result;
  } catch {
    return [];
  }
}

function getOpenClawDir() {
  return OPENCLAW_DIR;
}

function getWorkspaceDirPath() {
  return WORKSPACE_DIR;
}

module.exports = {
  parseKanban, parseSessionState, parseIdentity, parseMemory,
  parseSkills, parseCronJobs, parseConfig, parseStability,
  readRecentLogs, parseSingleLogLine, parseDailyLogs,
  parseRecentSessions, parseSessionSummaries, parseTokenTrend,
  getOpenClawDir, getWorkspaceDirPath
};


