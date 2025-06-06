from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from .database import Database
from .data_processor import SMSParser
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
        # Process the XML data
        parser = SMSParser('data/sms_v2.xml')
        transactions = parser.parse_xml()
        return jsonify({
            'status': 'success',
            'message': f'Processed {len(transactions)} transactions'
        })
    except Exception as e:
        logger.error(f"Error processing data: {e}")
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
    
    # Initialize database
    db.initialize_db()
    
    # Start the server
    app.run(debug=True, port=5000)
