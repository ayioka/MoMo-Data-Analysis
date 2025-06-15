import xml.etree.ElementTree as ET
import sqlite3
import re
import json
import os

print("🚀 Starting Full MTN MoMo Data Pipeline...")

base_dir = os.path.dirname(__file__)
xml_file = os.path.join(base_dir, 'modified_sms_v2.xml')
db_file = os.path.join(base_dir, 'momo.db')
json_file = os.path.join(base_dir, 'data.json')
log_file = os.path.join(base_dir, 'unprocessed.txt')

if not os.path.exists(xml_file):
    print("❌ XML file not found:", xml_file)
    exit()

tree = ET.parse(xml_file)
root = tree.getroot()
print(f"📄 Found {len(root.findall('sms'))} SMS messages")

conn = sqlite3.connect(db_file)
cur = conn.cursor()

cur.execute('DROP TABLE IF EXISTS transactions')
cur.execute('''
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT,
    type TEXT,
    name TEXT,
    amount INTEGER,
    date TEXT,
    balance INTEGER,
    fee INTEGER,
    raw TEXT
)
''')

patterns = {
    'incoming': r'You have received (\d+[,\d]*) RWF from (.+?) \(',
    'payment': r'Your payment of (\d+[,\d]*) RWF to (.+?) \d+ has been completed',
    'deposit': r'bank deposit of (\d+[,\d]*) RWF.*?at (\d{4}-\d{2}-\d{2}.*?)\. Your NEW BALANCE :(\d+[,\d]*) RWF',
    'transfer': r'transferred to (.+?) \(\d+\).*?at (\d{4}-\d{2}-\d{2}.*?) \. Fee was: (\d+[,\d]*) RWF. New balance: (\d+[,\d]*) RWF',
    'withdrawal': r'withdrawn (\d+[,\d]*) RWF.*?at (\d{4}-\d{2}-\d{2}.*?) .*?Your new balance: (\d+[,\d]*) RWF. Fee paid: (\d+[,\d]*) RWF',
    'cashpower': r'Your payment of (\d+[,\d]*) RWF to MTN Cash Power.*?completed at (\d{4}-\d{2}-\d{2}.*?)\. Fee was (\d+[,\d]*) RWF. Your new balance: (\d+[,\d]*) RWF',
    'airtime': r'Your payment of (\d+[,\d]*) RWF to Airtime.*?completed at (\d{4}-\d{2}-\d{2}.*?)\. Fee was (\d+[,\d]*) RWF. Your new balance: (\d+[,\d]*) RWF'
}

open(log_file, 'w').close()

for sms in root.findall('sms'):
    body = sms.attrib['body']
    tx_id = re.search(r'TxId: ?(\d+)', body)
    tx_id = tx_id.group(1) if tx_id else None
    inserted = False

    for key, pattern in patterns.items():
        match = re.search(pattern, body)
        if match:
            if key == 'incoming':
                amount, name = match.groups()
                cur.execute('INSERT INTO transactions (tx_id, type, name, amount, date, balance, fee, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (tx_id, key, name, int(str(amount).replace(',', '')), None, None, 0, body))
            elif key == 'payment':
                amount, name = match.groups()
                date = re.search(r'at (\d{4}-\d{2}-\d{2}.*?)\.', body).group(1)
                balance = re.search(r'Your new balance: ?([\d,]+) RWF', body)
                balance = int(str(balance.group(1)).replace(',', '')) if balance else None
                cur.execute('INSERT INTO transactions (tx_id, type, name, amount, date, balance, fee, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (tx_id, key, name, int(str(amount).replace(',', '')), date, balance, 0, body))
            elif key in ['deposit', 'cashpower', 'airtime']:
                amount, date, balance = match.groups()[:3]
                fee = match.group(3) if len(match.groups()) > 3 else 0
                cur.execute('INSERT INTO transactions (tx_id, type, name, amount, date, balance, fee, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (tx_id, key, '', int(str(amount).replace(',', '')), date, int(str(balance).replace(',', '')), int(str(fee).replace(',', '')), body))
            elif key == 'transfer':
                name, date, fee, balance = match.groups()
                amount = re.search(r'\*165\*S\*(\d+[,\d]*) RWF', body).group(1)
                cur.execute('INSERT INTO transactions (tx_id, type, name, amount, date, balance, fee, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (tx_id, key, name, int(str(amount).replace(',', '')), date, int(str(balance).replace(',', '')), int(str(fee).replace(',', '')), body))
            elif key == 'withdrawal':
                amount, date, balance, fee = match.groups()
                cur.execute('INSERT INTO transactions (tx_id, type, name, amount, date, balance, fee, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (tx_id, key, '', int(str(amount).replace(',', '')), date, int(str(balance).replace(',', '')), int(str(fee).replace(',', '')), body))
            inserted = True
            break

    if not inserted:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(body + "\n")

conn.commit()
print("📦 Data inserted into SQLite database")

cur.execute('SELECT tx_id, type, name, amount, date, balance, fee, raw FROM transactions')
rows = cur.fetchall()
keys = ['tx_id', 'type', 'name', 'amount', 'date', 'balance', 'fee', 'raw']
json_data = [dict(zip(keys, row)) for row in rows]

with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print("✅ Exported data to:", json_file)

conn.close()
print("🎉 All done!")
