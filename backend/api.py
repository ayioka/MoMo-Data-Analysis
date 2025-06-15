from flask import Flask, jsonify, request
import sqlite3
from datetime import datetime

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('momo_transactions.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    type_filter = request.args.get('type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = 'SELECT * FROM transactions'
    conditions = []
    params = []
    
    if type_filter:
        conditions.append('type = ?')
        params.append(type_filter)
    
    if date_from:
        conditions.append('date >= ?')
        params.append(date_from)
    
    if date_to:
        conditions.append('date <= ?')
        params.append(date_to)
    
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    
    query += ' ORDER BY date DESC'
    
    cursor.execute(query, params)
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(transactions)

@app.route('/api/transactions/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT 
        type, 
        COUNT(*) as count, 
        SUM(amount) as total_amount,
        strftime("%Y-%m", date) as month
    FROM transactions
    GROUP BY type, month
    ORDER BY month
    ''')
    
    stats = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(stats)

@app.route('/api/transactions/summary', methods=['GET'])
def get_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total_transactions FROM transactions')
    total_transactions = cursor.fetchone()[0]
    
    cursor.execute('SELECT SUM(amount) as total_amount FROM transactions')
    total_amount = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(DISTINCT recipient_number) as unique_recipients FROM transactions')
    unique_recipients = cursor.fetchone()[0]
    
    cursor.execute('''
    SELECT 
        strftime("%Y-%m", date) as month,
        COUNT(*) as count,
        SUM(amount) as amount
    FROM transactions
    GROUP BY month
    ORDER BY month
    ''')
    
    monthly_stats = [dict(row) for row in cursor.fetchall()]
    
    summary = {
        'total_transactions': total_transactions,
        'total_amount': total_amount,
        'unique_recipients': unique_recipients,
        'monthly_stats': monthly_stats
    }
    
    conn.close()
    return jsonify(summary)

@app.route('/api/transactions/<int:tx_id>', methods=['GET'])
def get_transaction(tx_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (tx_id,))
    transaction = cursor.fetchone()
    
    if transaction:
        transaction = dict(transaction)
    else:
        transaction = {}
    
    conn.close()
    return jsonify(transaction)

if __name__ == '__main__':
    app.run(debug=True)