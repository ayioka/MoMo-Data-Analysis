import os
import subprocess
from backend.app import app

def initialize_project():
    # Create required directories
    os.makedirs('data', exist_ok=True)
    os.makedirs('database', exist_ok=True)
    os.makedirs('frontend', exist_ok=True)
    
    print("Project directories created")
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    subprocess.run(['pip', 'install', '-r', 'backend/requirements.txt'], check=True)
    
    print("\nSetup completed successfully!")
    print("You can now run the application with: python run.py --run")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='MTN MoMo Analytics Dashboard')
    parser.add_argument('--setup', action='store_true', help='Initialize project setup')
    parser.add_argument('--run', action='store_true', help='Run the application')
    
    args = parser.parse_args()
    
    if args.setup:
        initialize_project()
    elif args.run:
        # Create sample XML file if it doesn't exist
        if not os.path.exists('data/sms_v2.xml'):
            with open('data/sms_v2.xml', 'w') as f:
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
        <body>Yello! You have purchased an internet bundle of 1GB for 2000 RWF valid for 30 days.</body>
    </sms>
</sms_data>''')
        
        # Start the application
        app.run(debug=True, port=5000)
    else:
        print("Please specify an option: --setup or --run")
