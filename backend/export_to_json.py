import sqlite3
import json

conn = sqlite3.connect('momo.db')
cursor = conn.cursor()

cursor.execute('SELECT tx_id, type, name, amount, date, balance, fee, raw FROM transactions')
rows = cursor.fetchall()

keys = ['tx_id', 'type', 'name', 'amount', 'date', 'balance', 'fee', 'raw']
data = [dict(zip(keys, row)) for row in rows]

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

conn.close()
