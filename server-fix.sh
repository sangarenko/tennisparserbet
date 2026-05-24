#!/bin/bash
# ============================================
# TT Predict — Диагностика и восстановление
# Сервер: 2.26.122.152
# ============================================

echo "========== 1. ПАМЯТЬ И ДИСК =========="
free -h
echo ""
df -h /
echo ""

echo "========== 2. PM2 СТАТУС =========="
pm2 list --no-color
echo ""

echo "========== 3. NGINX =========="
systemctl status nginx --no-pager | head -10
echo ""

echo "========== 4. ПОРТЫ =========="
ss -tlnp | grep -E ':(3001|8080|80|22)\s'
echo ""

echo "========== 5. ПОСЛЕДНИЕ PM2 ЛОГИ =========="
pm2 logs tt-predict --lines 30 --nostream 2>&1 || echo "Нет логов tt-predict"
echo ""

echo "========== 6. ПОСЛЕДНИЕ ЛОГИ UFC =========="
pm2 logs ufc-predict --lines 10 --nostream 2>&1 || echo "Нет логов ufc-predict"
echo ""

echo "========== 7. ПРОВЕРКА NEXT.JS СБОРКИ =========="
ls -la /var/www/tt-predict/.next/BUILD_ID 2>/dev/null && echo "Build exists" || echo "NO BUILD!"
ls -la /var/www/tt-predict/.next/server/app/ 2>/dev/null | head -5
echo ""

echo "========== 8. БАЗА ДАННЫХ =========="
ls -la /var/www/tt-predict/prisma/db/custom.db 2>/dev/null
sqlite3 /var/www/tt-predict/prisma/db/custom.db "SELECT COUNT(*) as total_matches FROM Match;" 2>/dev/null || echo "Нет sqlite3 или БД"
echo ""

echo "========== 9. ДАННЫЕ: ПОСЛЕДНИЕ МАТЧИ =========="
sqlite3 /var/www/tt-predict/prisma/db/custom.db "SELECT id, player1, player2, tournament, date, result, odds FROM Match ORDER BY date DESC LIMIT 10;" 2>/dev/null
echo ""

echo "========== 10. ДАННЫЕ: СТАВКИ =========="
sqlite3 /var/www/tt-predict/prisma/db/custom.db "SELECT COUNT(*) as total_bets FROM Bet;" 2>/dev/null
sqlite3 /var/www/tt-predict/prisma/db/custom.db "SELECT b.id, b.matchId, m.player1||' vs '||m.player2 as match, b.prediction, b.odds, b.stake, b.result, b.createdAt FROM Bet b LEFT JOIN Match m ON b.matchId = m.id ORDER BY b.createdAt DESC LIMIT 10;" 2>/dev/null
echo ""

echo "========== 11. ДАННЫЕ: БАНКРОЛЛ =========="
sqlite3 /var/www/tt-predict/prisma/db/custom.db "SELECT * FROM Bankroll ORDER BY id DESC LIMIT 5;" 2>/dev/null
echo ""

echo "========== 12. ДАННЫЕ: ПРЕДИКТОРЫ =========="
sqlite3 /var/www/tt-predict/prisma/db/custom.db "SELECT id, name, winRate, totalBets, currentAmount FROM Predictor ORDER BY currentAmount DESC;" 2>/dev/null
echo ""

echo "========== 13. BETBOOM SCRAPER =========="
ls -la /var/www/tt-predict/bot/uploads/betboom_matches.json 2>/dev/null && echo "BetBoom JSON exists" || echo "No BetBoom data"
echo ""

echo "========== 14. КРОН ЗАДАЧИ =========="
crontab -l 2>/dev/null || echo "No crontab"
echo ""

echo "========== 15. SYSTEMD SERVICES =========="
systemctl list-units --type=service --state=running | grep -iE 'nginx|pm2|node|mongo|postgres' 2>/dev/null
echo ""

echo "============================================="
echo "ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "============================================="
