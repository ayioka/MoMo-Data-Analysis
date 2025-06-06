import xml.etree.ElementTree as ET
import re
import logging
from datetime import datetime
import sqlite3
import os
from .database import Database

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
    TRANSACTION_PATTERNS = {
        'incoming_money': r'received (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) from',
        'payment_code_holder': r'payment of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to',
        'transfer_mobile': r'transfer of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to mobile',
        'bank_deposit': r'deposited (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to your bank',
        'airtime_payment': r'airtime (?:purchase|bill) of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
        'cash_power': r'cash power (?:purchase|bill) of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
        'third_party': r'initiated by third party for (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
        'agent_withdrawal': r'withdrawn (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) via agent',
        'bank_transfer': r'transferred (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to bank',
        'bundle_purchase': r'(?:internet|voice) bundle (?:purchase|for) (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
    }

    def __init__(self, xml_file: str):
        self.xml_file = xml_file
        self.transactions = []
        self.db = Database()
        self.db.initialize_db()

    def parse_xml(self) -> list:
        try:
            tree = ET.parse(self.xml_file)
            root = tree.getroot()
            logger.info(f"Processing XML file: {self.xml_file}")
            
            for idx, sms in enumerate(root.findall('sms')):
                body = sms.find('body').text
                transaction = self._categorize_transaction(body)
                
                if transaction:
                    self.transactions.append(transaction)
                    self.db.insert_transaction(transaction)
                else:
                    logger.warning(f"Unprocessed SMS: {body}")
                    
            logger.info(f"Processed {len(self.transactions)} transactions")
            return self.transactions
            
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return []

    def _categorize_transaction(self, body: str) -> dict:
        # First, try to extract transaction ID and date if available
        tx_id = None
        tx_date = datetime.now()
        
        # Try to extract transaction ID
        tx_id_match = re.search(r'Transaction ID: (\w+)', body)
        if tx_id_match:
            tx_id = tx_id_match.group(1)
        else:
            # Generate a unique ID based on content hash
            tx_id = f"TX{hash(body) & 0xFFFFFFFF}"
        
        # Try to extract date
        date_match = re.search(r'Date: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', body)
        if date_match:
            try:
                tx_date = datetime.strptime(date_match.group(1), '%Y-%m-%d %H:%M:%S')
            except ValueError:
                pass
        
        # Try to categorize transaction
        for t_type, pattern in self.TRANSACTION_PATTERNS.items():
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    amount = int(float(amount_str))
                except ValueError:
                    logger.warning(f"Could not convert amount: {amount_str}")
                    amount = 0
                
                # Extract counterparty if available
                counterparty = None
                if t_type == 'incoming_money':
                    sender_match = re.search(r'from ([A-Za-z\s]+)\.', body)
                    counterparty = sender_match.group(1) if sender_match else "Unknown"
                elif t_type in ['transfer_mobile', 'payment_code_holder']:
                    receiver_match = re.search(r'to ([A-Za-z\s]+)', body)
                    counterparty = receiver_match.group(1) if receiver_match else "Unknown"
                
                return {
                    'transaction_id': tx_id,
                    'type': t_type,
                    'amount': amount,
                    'date': tx_date.isoformat(),
                    'raw_message': body,
                    'counterparty': counterparty
                }
        
        logger.info(f"Could not categorize SMS: {body}")
        return None

def process_xml_data():
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    parser = SMSParser('data/sms_v2.xml')
    transactions = parser.parse_xml()
    logger.info(f"Processed {len(transactions)} transactions")
    return transactions

if __name__ == '__main__':
    process_xml_data()
