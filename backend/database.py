import sqlite3
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('database')

class Database:
    def __init__(self, db_path='database/momo.db'):
        os.makedirs('database', exist_ok=True)
        self.db_path = db_path
        self.conn = None

    def initialize_db(self):
        try:
            self.conn = sqlite3.connect(self.db_path)
            cursor = self.conn.cursor()
            
            # Create tables
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transaction_types (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY,
                    transaction_id TEXT UNIQUE NOT NULL,
                    type TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    transaction_date TEXT NOT NULL,
                    counterparty TEXT,
                    raw_message TEXT,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insert transaction types if not exists
            transaction_types = [
                ('incoming_money', 'Money received from others'),
                ('payment_code_holder', 'Payment to code holders'),
                ('transfer_mobile', 'Transfer to mobile numbers'),
                ('bank_deposit', 'Bank deposits'),
                ('airtime_payment', 'Airtime bill payments'),
                ('cash_power', 'Cash Power bill payments'),
                ('third_party', 'Transactions initiated by third parties'),
                ('agent_withdrawal', 'Withdrawals from agents'),
                ('bank_transfer', 'Bank transfers'),
                ('bundle_purchase', 'Internet and voice bundle purchases')
            ]
            
            cursor.executemany('''
                INSERT OR IGNORE INTO transaction_types (name, description)
                VALUES (?, ?)
            ''', transaction_types)
            
            self.conn.commit()
            logger.info("Database initialized successfully")
            
        except sqlite3.Error as e:
            logger.error(f"Database initialization error: {e}")
            raise

    def insert_transaction(self, transaction: dict):
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT OR IGNORE INTO transactions (
                    transaction_id, type, amount, transaction_date, counterparty, raw_message
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                transaction['transaction_id'],
                transaction['type'],
                transaction['amount'],
                transaction['date'],
                transaction.get('counterparty', ''),
                transaction['raw_message']
            ))
            self.conn.commit()
            logger.debug(f"Inserted transaction: {transaction['transaction_id']}")
        except sqlite3.Error as e:
            logger.error(f"Insert transaction error: {e}")

    def get_transactions(self, limit=100, offset=0):
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                SELECT * FROM transactions 
                ORDER BY transaction_date DESC
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            return cursor.fetchall()
        except sqlite3.Error as e:
            logger.error(f"Get transactions error: {e}")
            return []

    def get_summary_stats(self):
        try:
            cursor = self.conn.cursor()
            
            # Total transactions
            cursor.execute('SELECT COUNT(*) FROM transactions')
            total_transactions = cursor.fetchone()[0] or 0
            
            # Total volume
            cursor.execute('SELECT SUM(amount) FROM transactions')
            total_volume = cursor.fetchone()[0] or 0
            
            # Successful transactions (assuming all are successful for this example)
            successful = total_transactions
            
            # Transactions by type
            cursor.execute('''
                SELECT type, COUNT(*), SUM(amount) 
                FROM transactions 
                GROUP BY type
            ''')
            by_type = cursor.fetchall()
            
            return {
                'total_transactions': total_transactions,
                'total_volume': total_volume,
                'successful': successful,
                'failed': 0,  # Not implemented in this example
                'by_type': by_type
            }
            
        except sqlite3.Error as e:
            logger.error(f"Get summary stats error: {e}")
            return {}
    
    def get_volume_data(self):
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                SELECT DATE(transaction_date) as day, SUM(amount)
                FROM transactions
                GROUP BY day
                ORDER BY day
            ''')
            results = cursor.fetchall()
            
            labels = [row[0] for row in results]
            data = [row[1] for row in results]
            
            return {
                'labels': labels,
                'data': data
            }
        except sqlite3.Error as e:
            logger.error(f"Get volume data error: {e}")
            return {'labels': [], 'data': []}
    
    def get_type_data(self):
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                SELECT type, COUNT(*), SUM(amount)
                FROM transactions
                GROUP BY type
            ''')
            results = cursor.fetchall()
            
            labels = [row[0] for row in results]
            counts = [row[1] for row in results]
            amounts = [row[2] for row in results]
            
            return {
                'labels': labels,
                'counts': counts,
                'amounts': amounts
            }
        except sqlite3.Error as e:
            logger.error(f"Get type data error: {e}")
            return {'labels': [], 'counts': [], 'amounts': []}
    
    def close(self):
        if self.conn:
            self.conn.close()
