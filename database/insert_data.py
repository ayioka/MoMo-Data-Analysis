# import cleaned data from the cleaned data file(example)
from cleaning_script import cleaned_data
import sqlite3
import os

# Connect to DB
conn = sqlite3.connect("database/momo_data.db")
cursor = conn.cursor()

# Enable foreign keys
cursor.execute("PRAGMA foreign_keys = ON;")

# Insert categories
categories_set = set([item["category"] for item in cleaned_data])
category_id_map = {}

for category in categories_set:
    cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (category,))
    conn.commit()
    cursor.execute("SELECT id FROM categories WHERE name = ?", (category,))
    category_id = cursor.fetchone()[0]
    category_id_map[category] = category_id

# Insert transactions
for entry in cleaned_data:
    cursor.execute("""
        INSERT OR IGNORE INTO transactions 
        (amount, fee, balance, date, direction, message, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        entry["amount"],
        entry["fee"],
        entry["balance"],
        entry["date"],
        entry["direction"],
        entry["message"],
        category_id_map[entry["category"]]
    ))

conn.commit()
conn.close()
