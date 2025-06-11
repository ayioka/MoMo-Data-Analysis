import sqlite3

# Connect to SQLite (Create database if it doesn't exist)
conn = sqlite3.connect("momo_data.db")
cursor = conn.cursor()

# Enable foreign keys
cursor.execute("PRAGMA foreign_keys = ON;")

# Create categories table
cursor.execute("""
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
""")

# Create transactions table
cursor.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    fee INTEGER DEFAULT 0,
    balance INTEGER,
    date TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('incoming', 'outgoing')) NOT NULL,
    category_id INTEGER,
    message TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
""")

# Save and close
conn.commit()
conn.close()

print("Database and tables created successfully.")
