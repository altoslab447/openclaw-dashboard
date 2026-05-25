# OpenClaw Mission Control (Dashboard)

> OpenClaw 工作流的監控與營運看板原型：任務、排程、設定與日誌一頁掌握。

<div align="center">

![OpenClaw Dashboard Preview](https://raw.githubusercontent.com/altoslab447/openclaw-dashboard/main/public/preview.png)

**[English](#english)** · **[中文](#功能特色)**

</div>

---

## 功能特色

- 🧾 **工作區概覽** — 顯示本地設定與基本狀態（唯讀）
- 📋 **任務看板** — 即時解析 `KANBAN.md`，三欄式看板（進行中 / 規劃中 / 已完成）
- 🛠 **已安裝技能** — 列出所有 Skills 及描述
- ⏰ **排程任務** — 從 `cron/jobs.json` 讀取定時任務狀態（正常 / 錯誤 / 已停用）
- ⚙️ **系統設定** — 模型配置、閘道器、頻道與插件一覽
- 🧠 **記憶與計畫** — 時間軸與摘要（以本地檔案為準）
- 📜 **即時日誌** — WebSocket 即時串流 Gateway 日誌，終端機風格顯示
- 🔄 **多國語言** — 支援繁體中文與英文切換 🌐
- ✨ **現代 UI** — 採用 React + Tailwind CSS + Framer Motion 打造的高科技感介面

## 快速開始

### 前置需求

- [Node.js](https://nodejs.org/) v18+
- OpenClaw 執行環境已安裝並初始化（本機需存在 `~/.openclaw/` 或等效目錄）

### 安裝與啟動

```bash
# 複製專案
git clone https://github.com/altoslab447/openclaw-dashboard.git
cd openclaw-dashboard

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

打開瀏覽器訪問 **http://localhost:5173** (Vite 預設連接埠) 🚀

## 技術架構

本專案採用現代前端技術棧：

- **Frontend**: React 18, Vite, Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Express + WebSocket (Server-side parsing)
- **Real-time**: Chokidar (File watching) + Socket.io

## 配置環境變數

| 變數 | 說明 | 預設值 |
|---|---|---|
| `OPENCLAW_HOME` | OpenClaw 資料目錄路徑 | `~/.openclaw` |
| `PORT` | 伺服器連接埠 (API/Server) | `3456` |

```bash
# 自訂路徑範例
OPENCLAW_HOME=/custom/path/.openclaw PORT=3456 npm run dev
```

## 資料來源

Dashboard 直接讀取你本地的 OpenClaw 檔案（唯讀）：

| 檔案 | 用途 |
|---|---|
| `KANBAN.md` | 看板任務 |
| `IDENTITY.md` / `SOUL.md` | 工作區 metadata（若存在） |
| `MEMORY.md` | 工作記錄（若存在） |
| `cron/jobs.json` | 排程任務 |
| `openclaw.json` | 系統設定 |
| `logs/gateway.log` | 即時日誌 |

---

<a name="english"></a>

## English

### OpenClaw Mission Control 🦞

A real-time, high-tech dashboard for monitoring your OpenClaw AI Agent — featuring kanban boards, skill analysis, cron jobs, and live logs. 💅

### Quick Start

```bash
git clone https://github.com/altoslab447/openclaw-dashboard.git
cd openclaw-dashboard
npm install
npm run dev
# Open http://localhost:5173
```

### Features

- **Agent Identity** — Name, role, wallet, and ACP status
- **Kanban Board** — Dynamic parsing of `KANBAN.md`
- **Skill Analysis** — Real-time overview of installed capabilities
- **Cron Jobs** — Monitor scheduled tasks and system reliability
- **Live Logs** — Terminal-style WebSocket log streaming
- **Multilingual** — Native support for Traditional Chinese and English
- **Modern UI** — Built with React, Tailwind CSS, and Framer Motion

### Technology Stack

- **React 18 / Vite**
- **Tailwind CSS**
- **Framer Motion** (Smooth transitions & animations)
- **Lucide Icons**
- **Express / WebSocket** (Backend data provider)

## 授權

[MIT License](LICENSE) - Altos Lab
