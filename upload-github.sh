#!/bin/bash
# 🦞 OpenClaw Dashboard — 上傳 GitHub 腳本
# 使用方式: ./upload-github.sh

set -e

echo "🦞 OpenClaw Dashboard — GitHub 上傳工具"
echo ""

# 檢查 gh CLI
if ! command -v gh &> /dev/null; then
  echo "正在安裝 GitHub CLI..."
  brew install gh
fi

# 檢查登入狀態
if ! gh auth status &> /dev/null; then
  echo "📡 請先登入 GitHub："
  gh auth login --web --git-protocol https
fi

# 取得 GitHub 使用者名稱
GH_USER=$(gh api user --jq '.login')
echo "✅ 已登入: $GH_USER"

# 建立 repo
echo "📦 建立 GitHub repo: openclaw-dashboard"
gh repo create openclaw-dashboard --public \
  --description "🦞 OpenClaw 任務指揮中心 — 即時監控你的 AI Agent" \
  --source . --push

echo ""
echo "🎉 上傳成功！"
echo "🔗 https://github.com/$GH_USER/openclaw-dashboard"
