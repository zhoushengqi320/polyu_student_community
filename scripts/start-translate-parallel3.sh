#!/bin/zsh
# 以 3 路并行重启 Ollama，并启动课程概览翻译（可断点续跑）
set -euo pipefail
cd "$(dirname "$0")/.."

export OLLAMA_NUM_PARALLEL=3
export OLLAMA_MAX_QUEUE=128

echo "==> 停止旧翻译进程"
pkill -f 'node scripts/translate-course-overview.mjs' 2>/dev/null || true

echo "==> 停止 Ollama（GUI + serve）"
osascript -e 'tell application "Ollama" to quit' 2>/dev/null || true
sleep 1
pkill -f 'llama-server' 2>/dev/null || true
pkill -f 'Ollama.app/Contents/Resources/ollama' 2>/dev/null || true
sleep 2

if lsof -iTCP:11434 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "==> 强制释放 11434"
  lsof -tiTCP:11434 -sTCP:LISTEN | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "==> 启动 Ollama serve (NUM_PARALLEL=3)"
nohup /Applications/Ollama.app/Contents/Resources/ollama serve > tmp/ollama-serve.log 2>&1 &
echo "ollama_pid=$!"

for i in {1..30}; do
  if curl -sS --connect-timeout 1 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "ollama ready (${i}s)"
    break
  fi
  sleep 1
done

echo "==> 预热模型"
curl -sS http://127.0.0.1:11434/api/generate \
  -d '{"model":"qwen2.5:7b","prompt":"ping","stream":false,"options":{"num_predict":2}}' \
  >/dev/null

echo "==> llama-server 参数（应含 -np 3）"
ps aux | grep '[l]lama-server' | head -3 || true

echo "==> 启动翻译 concurrency=3"
nohup node scripts/translate-course-overview.mjs --concurrency=3 >> tmp/translate-run.log 2>&1 &
echo "translator_pid=$!"
sleep 3
tail -15 tmp/translate-run.log

echo ""
echo "进度看板: npm run translate:progress  →  http://127.0.0.1:3765"
echo "完成。可关闭本终端；进程在后台继续跑。"
