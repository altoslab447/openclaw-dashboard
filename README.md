# 🦞 OpenClaw 任務指揮中心

> 即時監控你的 OpenClaw AI Agent — 任務看板、技能、排程任務、系統狀態一目了然。

<div align="center">

**[English](#english)** · **[中文](#功能特色)**

</div>

---

## 功能特色

- 🤖 **代理人身份** — 顯示你的 Agent 名稱、角色、錢包地址與 ACP 狀態
- 📋 **任務看板** — 即時解析 `KANBAN.md`，三欄式看板（進行中 / 規劃中 / 已完成）
- 🛠 **已安裝技能** — 列出所有 Skills 及描述
- ⏰ **排程任務** — 從 `cron/jobs.json` 讀取定時任務狀態（正常 / 錯誤 / 已停用）
- ⚙️ **系統設定** — 模型配置、閘道器、頻道與插件一覽
- 🧠 **記憶與計畫** — 長期記憶 + 進化計畫時間軸
- 📜 **即時日誌** — WebSocket 即時串流 Gateway 日誌，終端機風格顯示
- 🔄 **自動刷新** — 檔案變更時自動更新所有面板

## 快速開始

### 前置需求

- [Node.js](https://nodejs.org/) v18+
- [OpenClaw](https://openclaw.ai/) 已安裝並初始化 (`~/.openclaw/` 目錄存在)

### 安裝

```bash
git clone https://github.com/altoslab/openclaw-dashboard.git
cd openclaw-dashboard
npm install
```

### 啟動

```bash
npm start
```

打開瀏覽器訪問 **http://localhost:3456** 🎉

### 環境變數

| 變數 | 說明 | 預設值 |
|---|---|---|
| `OPENCLAW_HOME` | OpenClaw 資料目錄路徑 | `~/.openclaw` |
| `PORT` | 伺服器連接埠 | `3456` |

```bash
# 自訂路徑範例
OPENCLAW_HOME=/custom/path/.openclaw PORT=8080 npm start
```

## 技術架構

```
openclaw-dashboard/
├── server.js          # Express + WebSocket 伺服器
├── parsers.js         # Markdown/JSON 檔案解析器
├── public/
│   ├── index.html     # 儀表板介面
│   ├── style.css      # 深色主題樣式
│   └── app.js         # 前端邏輯 + WebSocket 客戶端
├── .env.example       # 環境變數範例
├── package.json
├── LICENSE            # MIT
└── README.md
```

### 資料來源

Dashboard 直接讀取你本地的 OpenClaw 檔案（唯讀），不會修改任何資料：

| 檔案 | 用途 |
|---|---|
| `KANBAN.md` | 看板任務 |
| `SESSION-STATE.md` | Agent 運行狀態 |
| `IDENTITY.md` / `SOUL.md` | Agent 身份與個性 |
| `MEMORY.md` | 長期記憶 |
| `SOVEREIGN_PLAN.md` | 進化計畫 |
| `cron/jobs.json` | 排程任務 |
| `openclaw.json` | 系統設定 |
| `logs/gateway.log` | 即時日誌 |

## API 端點

| 端點 | 說明 |
|---|---|
| `GET /api/agent` | 代理人身份 + 狀態 |
| `GET /api/kanban` | 看板任務 |
| `GET /api/skills` | 已安裝技能 |
| `GET /api/cron` | 排程任務 |
| `GET /api/memory` | 記憶與計畫 |
| `GET /api/config` | 系統設定 |
| `GET /api/logs?count=100` | 最近日誌 |
| `GET /api/all` | 全部資料 |
| `WebSocket ws://` | 即時日誌 + 檔案變更推送 |

## 貢獻

歡迎提交 Issue 或 Pull Request！

1. Fork 此專案
2. 建立你的 Feature Branch (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m '新增超棒功能'`)
4. 推送 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

[MIT License](LICENSE)

---

<a name="english"></a>

## English

### OpenClaw Mission Control 🦞

A real-time dashboard for monitoring your OpenClaw AI Agent — kanban board, skills, cron jobs, system status, and live logs.

### Quick Start

```bash
git clone https://github.com/altoslab/openclaw-dashboard.git
cd openclaw-dashboard
npm install
npm start
# Open http://localhost:3456
```

### Configuration

| Variable | Description | Default |
|---|---|---|
| `OPENCLAW_HOME` | Path to OpenClaw data directory | `~/.openclaw` |
| `PORT` | Server port | `3456` |

### Features

- **Agent Identity** — Name, role, wallet, ACP status
- **Kanban Board** — Parse `KANBAN.md` into 3-column board
- **Installed Skills** — List all skills with descriptions
- **Cron Jobs** — Schedule status with error tracking
- **System Config** — Models, gateway, channels overview
- **Memory & Plan** — Long-term memory + evolution plan
- **Live Logs** — WebSocket real-time gateway log streaming
- **Auto Refresh** — File change detection via chokidar

### License

[MIT](LICENSE)
