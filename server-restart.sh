#!/bin/bash
# ============================================
# TT Predict — ВОССТАНОВЛЕНИЕ
# Сервер: 2.26.122.152
# Запуск: bash server-restart.sh
# ============================================

set -e

cd /var/www/tt-predict

echo ">>> [1/5] Остановка старых процессов..."
pm2 delete tt-predict 2>/dev/null || true
pm2 delete ufc-predict 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
sleep 2

echo ">>> [2/5] Установка зависимостей..."
npm install --production 2>&1 | tail -5

echo ">>> [3/5] Сборка Next.js..."
npm run build 2>&1 | tail -20

echo ">>> [4/5] Запуск TT Predict через PM2..."
pm2 start npm --name "tt-predict" -- start
pm2 save

echo ">>> [5/5] Проверка..."
sleep 5
pm2 list --no-color

# Verify it's responding
for i in $(seq 1 10); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
    if [ "$CODE" = "200" ]; then
        echo "✅ TT Predict запущен! HTTP 200 на localhost:3001"
        echo "🌐 Сайт: http://2.26.122.152:8080"
        exit 0
    fi
    echo "Ожидание... ($i/10) HTTP: $CODE"
    sleep 3
done

echo "⚠️ Next.js не ответил за 30 сек. Смотри логи:"
pm2 logs tt-predict --lines 50 --nostream
