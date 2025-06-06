import xml.etree.ElementTree as ET
import re
import logging
from datetime import datetime
import sqlite3
import os
from backend.database import Database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processing.log', mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('data_processor')

class SMSParser:
    TRANSACTION_PATTERNS = {
        'incoming_money': [
            r'received (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) from',
            r'credited with (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) from',
            r'You have received (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) from'
        ],
        'payment_code_holder': [
            r'payment of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to',
            r'paid (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to',
            r'sent (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to'
        ],
        'transfer_mobile': [
            r'transfer of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to mobile',
            r'sent (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to \d+',
            r'Transferred (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to'
        ],
        'bank_deposit': [
            r'deposited (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to your bank',
            r'bank deposit of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
        ],
        'airtime_payment': [
            r'airtime (?:purchase|bill) of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
            r'airtime top-up of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
            r'purchased airtime worth (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
        ],
        'cash_power': [
            r'cash power (?:purchase|bill) of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
            r'electricity payment of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
        ],
        'third_party': [
            r'initiated by third party for (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
            r'third party transaction of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
        ],
        'agent_withdrawal': [
            r'withdrawn (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) via agent',
            r'cash out of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) at agent'
        ],
        'bank_transfer': [
            r'transferred (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+) to bank',
            r'bank transfer of (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
        ],
        'bundle_purchase': [
            r'(?:internet|voice) bundle (?:purchase|for) (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)',
            r'purchased (?:data|voice) bundle worth (?:RWF )?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)'
        ]
    }

    def __init__(self, xml_file: str):
        self.xml_file = xml_file
        self.transactions = []
        self.db = Database()
        self.db.initialize_db()

    def parse_xml(self) -> list:
        try:
            if not os.path.exists(self.xml_file):
                logger.error(f"XML file not found: {self.xml_file}")
                return []

            tree = ET.parse(self.xml_file)
            root = tree.getroot()
            logger.info(f"Processing XML file: {self.xml_file}")

            total_messages = len(root.findall('sms'))
            logger.info(f"Found {total_messages} SMS messages")

            for idx, sms in enumerate(root.findall('sms')):
                try:
                    body = sms.find('body').text
                    if not body:
                        logger.warning(f"Empty body for SMS #{idx}")
                        continue

                    transaction = self._categorize_transaction(body)

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

    def _categorize_transaction(self, body: str) -> dict:
        tx_id_match = re.search(r'(?:Transaction ID:|TxId:|Ref:)\s*([A-Z0-9]+)', body, re.IGNORECASE)
        tx_id = tx_id_match.group(1) if tx_id_match else f"TX{hash(body) & 0xFFFFFFFF}"

        tx_date = datetime.now()
        date_formats = [
            r'Date: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})',
            r'Date: (\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2})',
            r'on (\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2}:\d{2})',
            r'on (\d{2}/\d{2}/\d{4}) at (\d{2}:\d{2}:\d{2})',
            r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'
        ]

        for fmt in date_formats:
            date_match = re.search(fmt, body)
            if date_match:
                date_str = " ".join(date_match.groups()) if len(date_match.groups()) > 1 else date_match.group(1)
                try:
                    if '/' in date_str:
                        tx_date = datetime.strptime(date_str, '%d/%m/%Y %H:%M:%S')
                    else:
                        tx_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    break
                except ValueError:
                    continue

        for t_type, patterns in self.TRANSACTION_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, body, re.IGNORECASE)
                if match:
                    amount_str = match.group(1).replace(',', '')
                    try:
                        amount = int(float(amount_str))
                    except ValueError:
                        logger.warning(f"Could not convert amount: {amount_str} in SMS: {body[:50]}...")
                        amount = 0

                    counterparty = "Unknown"
                    if t_type == 'incoming_money':
                        sender_match = re.search(r'from ([A-Za-z\s]+)\.', body)
                        if sender_match:
                            counterparty = sender_match.group(1)
                    elif t_type in ['transfer_mobile', 'payment_code_holder']:
                        receiver_match = re.search(r'to ([A-Za-z\s]+)', body)
                        if receiver_match:
                            counterparty = receiver_match.group(1)
                    elif t_type == 'agent_withdrawal':
                        agent_match = re.search(r'agent: ([A-Za-z\s]+)', body)
                        if agent_match:
                            counterparty = agent_match.group(1)

                    return {
                        'transaction_id': tx_id,
                        'type': t_type,
                        'amount': amount,
                        'date': tx_date.isoformat(),
                        'raw_message': body,
                        'counterparty': counterparty
                    }

        logger.info(f"Could not categorize SMS: {body[:100]}...")
        return None

def process_xml_data(xml_file='data/sms_v2.xml'):
    os.makedirs('data', exist_ok=True)
    parser = SMSParser(xml_file)
    transactions = parser.parse_xml()
    logger.info(f"Processed {len(transactions)} transactions")
    print(f"✅ Processed {len(transactions)} transactions")  # Optional direct feedback
    return transactions


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
        <body>Transaction ID: TX1234567890 received RWF 1,000 from John Doe on 2023-10-01 at 12:00:00</body>
    </sms>
    <sms>
        <body>Payment of RWF 500 to Jane Smith on 2023-10-02 at 13:30:00</body>
    </sms>
    <sms>
        <body>Transfer of RWF 2,000 to mobile number 0781234567 on 2023-10-03 at 14:45:00</body>
    </sms>
    <sms>
        <body>Bank deposit of RWF 3,500 on 2023-10-04 at 15:00:00</body>
    </sms>
</sms_data>''')                                                     