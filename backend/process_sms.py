import xml.etree.ElementTree as ET
import sqlite3
import re
import os
from datetime import datetime

def get_data_directory():
    """Get the directory where data files should be stored"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

def parse_xml(xml_file):
    """Parse the XML file and return SMS elements"""
    try:
        # Try to find the file in several possible locations
        possible_paths = [
            xml_file,
            os.path.join(get_data_directory(), xml_file),
            os.path.join(os.path.dirname(__file__), xml_file)
        ]
        
        found_path = None
        for path in possible_paths:
            if os.path.exists(path):
                found_path = path
                break
        
        if not found_path:
            raise FileNotFoundError(f"Could not find XML file at any of these locations: {possible_paths}")
        
        tree = ET.parse(found_path)
        return tree.getroot().findall('sms')
    except ET.ParseError as e:
        print(f"Error parsing XML file: {e}")
        return []

def categorize_transaction(body):
    """Categorize transaction based on message content"""
    if not body:
        return 'Unknown'
    
    body = body.lower()
    if 'received' in body and 'from' in body:
        return 'Incoming Money'
    elif 'payment of' in body and 'to' in body:
        return 'Payment to Code Holder'
    elif 'transferred to' in body:
        return 'Transfer to Mobile Number'
    elif 'bank deposit' in body:
        return 'Bank Deposit'
    elif 'airtime' in body:
        return 'Airtime Bill Payment'
    elif 'cash power' in body:
        return 'Cash Power Bill Payment'
    elif 'third party' in body or ('by' in body and 'on your momo account' in body):
        return 'Third Party Transaction'
    elif 'withdrawn' in body and 'agent' in body:
        return 'Withdrawal from Agent'
    elif 'bank transfer' in body:
        return 'Bank Transfer'
    elif 'bundle' in body or 'internet' in body or 'voice' in body:
        return 'Bundle Purchase'
    return 'Other'

def extract_amount(body):
    """Extract amount from message body"""
    amount_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?) RWF'
    matches = re.findall(amount_pattern, body)
    if matches:
        return int(matches[0].replace(',', ''))
    return 0

def extract_phone_number(body):
    """Extract phone number from message body"""
    phone_pattern = r'(\d{9,12})'
    matches = re.findall(phone_pattern, body)
    return matches[0] if matches else None

def extract_date(timestamp):
    """Convert timestamp to formatted date string"""
    try:
        return datetime.fromtimestamp(int(timestamp)/1000).strftime('%Y-%m-%d %H:%M:%S')
    except:
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def create_database():
    """Create SQLite database and tables"""
    db_path = os.path.join(get_data_directory(), 'momo_transactions.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT,
        type TEXT,
        amount INTEGER,
        recipient TEXT,
        recipient_number TEXT,
        date TEXT,
        fee INTEGER,
        balance INTEGER,
        message TEXT
    )
    ''')
    
    conn.commit()
    return conn

def process_sms(sms_list, conn):
    """Process SMS messages and insert into database"""
    cursor = conn.cursor()
    
    for sms in sms_list:
        try:
            body = sms.get('body', '')
            date = extract_date(sms.get('date', '0'))
            tx_type = categorize_transaction(body)
            
            amount = extract_amount(body)
            recipient = 'Unknown'
            recipient_number = extract_phone_number(body) if extract_phone_number(body) else 'Unknown'
            
            fee_match = re.search(r'Fee was:? (\d+) RWF', body)
            fee = int(fee_match.group(1)) if fee_match else 0
            
            balance_match = re.search(r'balance:? (\d{1,3}(?:,\d{3})*(?:\.\d{2})?) RWF', body)
            balance = int(balance_match.group(1).replace(',', '')) if balance_match else 0
            
            tx_id_match = re.search(r'(?:TxId:|Transaction Id:|Financial Transaction Id:)\s*(\d+)', body)
            tx_id = tx_id_match.group(1) if tx_id_match else None
            
            cursor.execute('''
            INSERT INTO transactions (transaction_id, type, amount, recipient, recipient_number, date, fee, balance, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (tx_id, tx_type, amount, recipient, recipient_number, date, fee, balance, body))
        except Exception as e:
            print(f"Error processing SMS: {e}")
            continue
    
    conn.commit()

def main():
    """Main function to process the XML file"""
    xml_file = 'modified_sms_v2.xml'
    
    print("Starting SMS data processing...")
    print(f"Looking for XML file: {xml_file}")
    
    sms_list = parse_xml(xml_file)
    if not sms_list:
        print("No SMS messages found or error parsing XML")
        return
    
    print(f"Found {len(sms_list)} SMS messages to process")
    
    conn = create_database()
    print("Database connection established")
    
    process_sms(sms_list, conn)
    print("Finished processing SMS messages")
    
    conn.close()
    print("Database connection closed")

if __name__ == '__main__':
    main()