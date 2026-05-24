#!/usr/bin/env python3
"""Seed predictors directly into DB"""
import sqlite3, uuid
from datetime import datetime

db = sqlite3.connect('/var/www/tt-predict/db/custom.db')
ts = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

predictors = [
    ('TT_Picks_Pro', 'telegram', 72, 180, 130, 0.78, '🔮', 'tennis', True, 450),
    ('TableTennisGuru', 'youtube', 70, 250, 175, 0.75, '📊', 'tennis', True, 380),
    ('PingPongMaster', 'telegram', 68, 320, 218, 0.72, '🏓', 'tennis', True, 520),
    ('SpinKing_TT', 'twitter', 66, 150, 99, 0.70, '👑', 'tennis', True, 200),
    ('TT_Analytics', 'youtube', 65, 420, 273, 0.68, '📈', 'tennis', True, 680),
    ('ProPaddle', 'telegram', 64, 200, 128, 0.73, '🎯', 'tennis', True, 310),
    ('AcePredictor', 'twitter', 63, 175, 110, 0.71, '🃏', 'tennis', True, 250),
    ('ChopBlock_Bets', 'telegram', 62, 290, 180, 0.67, '🪵', 'tennis', True, 400),
    ('TT_Oracle', 'youtube', 61, 500, 305, 0.65, '🔮', 'tennis', True, 850),
    ('SmashBet', 'telegram', 60, 130, 78, 0.69, '💥', 'tennis', False, 180),
    ('BetKing_TT', 'telegram', 58, 210, 122, 0.64, '🤴', 'tennis', False, 290),
    ('TT_Insider', 'twitter', 57, 340, 194, 0.62, '🕵️', 'tennis', False, 450),
    ('PaddlePredict', 'youtube', 56, 160, 90, 0.63, '🎯', 'tennis', False, 220),
    ('TableTennisPro', 'telegram', 55, 280, 154, 0.60, '🏆', 'tennis', False, 350),
    ('LoopDrive_Bet', 'telegram', 55, 190, 105, 0.61, '🔄', 'tennis', False, 240),
    ('TT_Winners', 'twitter', 54, 230, 124, 0.59, '🏆', 'tennis', False, 300),
    ('SpinServe_Analysis', 'youtube', 53, 310, 164, 0.58, '📊', 'tennis', False, 420),
    ('PingPongProphet', 'telegram', 52, 270, 140, 0.57, '🔮', 'tennis', False, 350),
    ('RallyMaster', 'twitter', 51, 145, 74, 0.56, '⚡', 'tennis', False, 190),
    ('TT_Edge', 'telegram', 50, 380, 190, 0.55, '🔪', 'tennis', False, 480),
    ('TT_Bets_Daily', 'telegram', 48, 220, 106, 0.52, '📅', 'tennis', False, 280),
    ('PongPredictor', 'youtube', 47, 180, 85, 0.50, '🏓', 'tennis', False, 230),
    ('TableTennisTips', 'twitter', 46, 350, 161, 0.49, '💡', 'tennis', False, 440),
    ('TT_SmartBet', 'telegram', 45, 260, 117, 0.48, '🧠', 'tennis', False, 320),
    ('BackhandWinner', 'telegram', 44, 150, 66, 0.47, '💪', 'tennis', False, 190),
    ('ServeAce_Picks', 'youtube', 43, 200, 86, 0.46, '🎯', 'tennis', False, 250),
    ('TT_BettingBot', 'telegram', 42, 440, 185, 0.45, '🤖', 'tennis', False, 550),
    ('PingPongPicks', 'twitter', 41, 170, 70, 0.44, '🏓', 'tennis', False, 210),
    ('Forehand_Forecast', 'telegram', 40, 300, 120, 0.43, '🎾', 'tennis', False, 370),
    ('TT_MatchDay', 'telegram', 39, 260, 101, 0.42, '🗓️', 'tennis', False, 320),
]

inserted = 0
for p in predictors:
    name, platform, wr, total, correct, conf, emoji, spec, verified, followers = p
    try:
        db.execute(
            """INSERT OR IGNORE INTO Predictor
            (id, name, channel, platform, bio, specialization, avatarEmoji, followers,
             totalTips, correctTips, winRate, avgConfidence, avgOdds, currentStreak, bestStreak,
             monthlyData, tags, lastActive, verified, qualityScore, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (str(uuid.uuid4()), name, '', platform, '', spec, emoji, followers,
             total, correct, float(wr), conf, 0, 0, 0,
             '{}', '', ts, verified, float(wr) * 1.2, True, ts, ts)
        )
        inserted += 1
    except Exception as e:
        print(f"Error: {name}: {e}")

db.commit()
db.close()
print(f"Done! Inserted {inserted} predictors")
