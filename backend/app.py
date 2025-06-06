from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from backend.database import Database
from .data_processor import process_xml_data
import logging
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('api')

# Initialize database
db = Database()

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

@app.route('/api/process', methods=['POST'])
def process_data():
    try:
        # Get XML file path from request or use default
        xml_file = request.json.get('xml_file', 'data/sms_v2.xml') if request.json else 'data/sms_v2.xml'
        
        # Process the XML data
        transactions = process_xml_data(xml_file)
        
        return jsonify({
            'status': 'success',
            'message': f'Processed {len(transactions)} transactions',
            'count': len(transactions)
        })
    except Exception as e:
        logger.error(f"Error processing data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset', methods=['POST'])
def reset_database():
    try:
        success = db.reset_database()
        if success:
            return jsonify({'status': 'success', 'message': 'Database reset successfully'})
        else:
            return jsonify({'error': 'Database reset failed'}), 500
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        
        transactions = db.get_transactions(limit=per_page, offset=offset)
        return jsonify({
            'page': page,
            'per_page': per_page,
            'total': db.get_transactions_count(),
            'transactions': transactions
        })
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/summary', methods=['GET'])
def get_summary():
    try:
        stats = db.get_summary_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error fetching summary: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/chart/volume', methods=['GET'])
def get_volume_data():
    try:
        data = db.get_volume_data()
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error fetching volume data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/chart/types', methods=['GET'])
def get_type_data():
    try:
        data = db.get_type_data()
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error fetching type data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    # Create sample XML if needed
    sample_xml = 'data/sms_v2.xml'
    if not os.path.exists(sample_xml):
        with open(sample_xml, 'w') as f:
            f.write('''<?xml version="1.0" encoding="UTF-8"?>
<sms_data>
    <sms>
        <body>You have received 5000 RWF from John Doe. Transaction ID: 123456. Date: 2024-01-01 10:00:00.</body>
    </sms>
    <sms>
        <body>TxId: 789012. Your payment of 1500 RWF to Jane Smith has been completed. Date: 2024-01-02 14:30:00.</body>
    </sms>
    <sms>
        <body>*162*TxId:345678*S*Your payment of 3000 RWF to Airtime has been completed. Fee: 50 RWF. Date: 2024-01-03 16:00:00.</body>
    </sms>
    <sms>
        <body>You Wakuma Tekalign DEBELA have via agent: Jane Doe (250123456789), withdrawn 20000 RWF on 2024-01-04 12:00:00.</body>
    </sms>
    <sms>
        <body>Yello! You have purchased an internet bundle of 1GB for 2000 RWF valid for 30 days. Date: 2024-01-05 09:15:00</body>
    </sms>
</sms_data>''')
        logger.info(f"Created sample XML file at {sample_xml}")
    
    # Initialize database
    db.initialize_db()
    
    # Start the application
    app.run(debug=True, port=5000, use_reloader=False)