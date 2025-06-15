from flask import Flask, jsonify, request
import sqlite3
from datetime import datetime

app = Flask(__name__)

def get_db_connection():
    # ✅ Updated path to point to the actual database file
    conn = sqlite3.connect('../database/momo_data.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ Collect filter parameters from query string
    type_filter = request.args.get('type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    # ✅ SQL query joining transactions and categories
    query = '''
        SELECT t.*, c.name as category_name 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
    '''
    conditions = []
    params = []

    if type_filter:
        conditions.append('c.name = ?')
        params.append(type_filter)

    if date_from:
        conditions.append('t.date >= ?')
        params.append(date_from)

    if date_to:
        conditions.append('t.date <= ?')
        params.append(date_to)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    query += ' ORDER BY t.date DESC'

    cursor.execute(query, params)
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(transactions)

@app.route('/api/transactions/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ Useful for analytics and charts
    cursor.execute('''
        SELECT 
            c.name as category,
            COUNT(*) as count,
            SUM(t.amount) as total_amount,
            strftime("%Y-%m", t.date) as month
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        GROUP BY c.name, month
        ORDER BY month
    ''')

    stats = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)
