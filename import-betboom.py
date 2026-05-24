#!/usr/bin/env python3
"""Import BetBoom matches into TT Predict DB"""
import json, sqlite3, uuid
from datetime import datetime, timedelta

db = sqlite3.connect('/var/www/tt-predict/db/custom.db')

with open('/var/www/tt-predict-bot/uploads/betboom_matches.json') as f:
    data = json.load(f)

prematch = data.get('prematch', [])
live = data.get('live', [])
all_matches = prematch + live
print(f"Found {len(all_matches)} matches from BetBoom")

now = datetime.now()
inserted = 0
skipped = 0

for m in all_matches:
    p1 = m.get('player1', '').strip()
    p2 = m.get('player2', '').strip()
    if not p1 or not p2:
        skipped += 1
        continue

    st = m.get('startTime', '')
    start_time = None
    if 'Завтра' in st:
        tomorrow = now + timedelta(days=1)
        time_part = st.split('в')[-1].strip() if 'в' in st else '12:00'
        try:
            h, mi = map(int, time_part.split(':'))
            start_time = tomorrow.replace(hour=h, minute=mi).strftime('%Y-%m-%dT%H:%M:%S')
        except:
            start_time = tomorrow.strftime('%Y-%m-%dT12:00:00')
    elif 'Сегодня' in st:
        time_part = st.split('в')[-1].strip() if 'в' in st else '12:00'
        try:
            h, mi = map(int, time_part.split(':'))
            start_time = now.replace(hour=h, minute=mi).strftime('%Y-%m-%dT%H:%M:%S')
        except:
            start_time = now.strftime('%Y-%m-%dT12:00:00')
    else:
        start_time = now.strftime('%Y-%m-%dT12:00:00')

    match_id = str(uuid.uuid4())
    is_live = m.get('isLive', False)
    raw_json = json.dumps(m, ensure_ascii=False)

    try:
        db.execute(
            "INSERT OR IGNORE INTO Match (id, player1, player2, league, startTime, status, score1, score2, source, sport, rawJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (match_id, p1, p2, m.get('tournament', ''), start_time,
             'live' if is_live else 'upcoming', 0, 0, 'betboom', 'tennis',
             raw_json, now.strftime('%Y-%m-%dT%H:%M:%S'), now.strftime('%Y-%m-%dT%H:%M:%S'))
        )
        inserted += 1

        odds_id = str(uuid.uuid4())
        db.execute(
            "INSERT OR IGNORE INTO BookmakerOdds (id, matchId, source, odds1, odds2, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
            (odds_id, match_id, 'betboom', m.get('odds1', 0), m.get('odds2', 0), now.strftime('%Y-%m-%dT%H:%M:%S'))
        )
    except Exception as e:
        print(f"Error: {e}")
        skipped += 1

# Bankroll
ts = now.strftime('%Y-%m-%dT%H:%M:%S')
try:
    db.execute(
        "INSERT OR IGNORE INTO Bankroll (id, initialAmount, currentAmount, strategy, riskLevel, flatAmount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ('bk1', 5000, 5000, 'flat', 'medium', 50, ts, ts)
    )
except:
    pass

# AiBankroll
try:
    db.execute(
        "INSERT OR IGNORE INTO AiBankroll (id, label, initialAmount, currentAmount, peakAmount, flatAmount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ('aibk1', 'AI v2 RAG', 5000, 5000, 5000, 50, ts, ts)
    )
except:
    pass

# CollectionLog
try:
    db.execute(
        "INSERT INTO CollectionLog (id, source, status, matchesFound, duration, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), 'betboom', 'success', len(all_matches), 1500, ts)
    )
except:
    pass

db.commit()
db.close()
print(f"Done! Inserted: {inserted}, Skipped: {skipped}")
