import xml.etree.ElementTree as ET
import re
import logging
from datetime import datetime
import os
import json
from backend.database import Database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('data_processor')

class SMSParser:
    def __init__(self, xml_file: str, config_file='backend/config.json'):
        self.xml_file = xml_file
        self.transactions = []
        self.db = Database()
        self.db.initialize_db()
        self.config = self.load_config(config_file)
    
    def load_config(self, config_file):
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading config file: {e}")
            # Return default config if file not found
            return {
                "transaction_types": {},
                "metadata_patterns": {}
            }

    def parse_xml(self) -> list:
        try:
            # Check if file exists
            if not os.path.exists(self.xml_file):
                logger.error(f"XML file not found: {self.xml_file}")
                return []
            
            # Parse XML
            tree = ET.parse(self.xml_file)
            root = tree.getroot()
            logger.info(f"Processing XML file: {self.xml_file}")
            
            # Count total messages
            total_messages = len(root.findall('sms'))
            logger.info(f"Found {total_messages} SMS messages")
            
            # Process each SMS
            for idx, sms in enumerate(root.findall('sms')):
                try:
                    body = sms.find('body').text
                    if not body:
                        logger.warning(f"Empty body for SMS #{idx}")
                        continue
                        
                    transaction = self._parse_sms(body)
                    
                    if transaction:
                        self.transactions.append(transaction)
                        self.db.insert_transaction(transaction)
                    else:
                        logger.warning(f"Unprocessed SMS #{idx}: {body[:50]}...")
                except Exception as e:
                    logger.error(f"Error processing SMS #{idx}: {e}")
            
            logger.info(f"Processed {len(self.transactions)} of {total_messages} transactions")
            return self.transactions
            
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return []

    def _parse_sms(self, body: str) -> dict:
        # Extract metadata
        metadata = self._extract_metadata(body)
        
        # Try to categorize transaction
        for t_type, type_config in self.config.get('transaction_types', {}).items():
            for pattern in type_config.get('patterns', []):
                match = re.search(pattern, body, re.IGNORECASE)
                if match:
                    # Get the first capture group
                    amount_str = match.group(1).replace(',', '')
                    try:
                        amount = int(float(amount_str))
                    except ValueError:
                        logger.warning(f"Could not convert amount: {amount_str} in SMS: {body[:50]}...")
                        amount = 0
                    
                    # Extract counterparty if available
                    counterparty = "Unknown"
                    if 'counterparty_pattern' in type_config:
                        cp_match = re.search(type_config['counterparty_pattern'], body, re.IGNORECASE)
                        if cp_match:
                            counterparty = cp_match.group(1)
                    
                    return {
                        'transaction_id': metadata.get('transaction_id', f"TX{hash(body) & 0xFFFFFFFF}"),
                        'type': t_type,
                        'amount': amount,
                        'date': metadata.get('date', datetime.now().isoformat()),
                        'raw_message': body,
                        'counterparty': counterparty
                    }
        
        logger.info(f"Could not categorize SMS: {body[:100]}...")
        return None

    def _extract_metadata(self, body: str) -> dict:
        metadata = {}
        
        # Extract transaction ID
        for pattern in self.config.get('metadata_patterns', {}).get('transaction_id', []):
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                metadata['transaction_id'] = match.group(1)
                break
        
        # Extract date
        for pattern in self.config.get('metadata_patterns', {}).get('date', []):
            match = re.search(pattern, body)
            if match:
                date_str = " ".join(match.groups()) if len(match.groups()) > 1 else match.group(1)
                try:
                    # Normalize date string
                    if '/' in date_str:
                        metadata['date'] = datetime.strptime(date_str, '%d/%m/%Y %H:%M:%S').isoformat()
                    else:
                        metadata['date'] = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S').isoformat()
                    break
                except ValueError:
                    continue
        
        return metadata

def process_xml_data(xml_file='data/sms_v2.xml'):
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    parser = SMSParser(xml_file)
    transactions = parser.parse_xml()
    logger.info(f"Processed {len(transactions)} transactions")
    return transactions