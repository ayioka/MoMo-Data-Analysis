/**
 * Sample XML Generator for Testing SMS Data Processing
 * Run with: npx ts-node src/scripts/generate-sample-xml.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const names = [
  'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson', 'Carol Brown',
  'David Miller', 'Eva Davis', 'Frank Garcia', 'Grace Rodriguez', 'Henry Martinez',
  'Ivy Lopez', 'Jack Anderson', 'Kate Thomas', 'Liam Jackson', 'Maya White',
  'Noah Harris', 'Olivia Clark', 'Paul Lewis', 'Quinn Lee', 'Ruby Walker',
  'Samuel Hall', 'Tina Allen', 'Uma Young', 'Victor King', 'Wendy Wright',
];

const agentNames = [
  'Agent Alpha', 'Agent Beta', 'Agent Gamma', 'Agent Delta', 'Agent Echo',
  'MTN Store Kigali', 'MTN Store Nyamirambo', 'MTN Store Kimisagara',
];

const phoneNumbers = [
  '250788123456', '250788234567', '250788345678', '250788456789', '250788567890',
  '250789123456', '250789234567', '250789345678', '250789456789', '250789567890',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAmount(min: number = 1000, max: number = 50000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(): string {
  const start = new Date(2024, 0, 1);
  const end = new Date(2024, 11, 31);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().replace('T', ' ').slice(0, 19);
}

function generateTransactionId(): string {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateSmsMessages(count: number = 1600): string[] {
  const messages: string[] = [];

  for (let i = 0; i < count; i++) {
    const messageType = Math.floor(Math.random() * 11);
    let message = '';

    switch (messageType) {
      case 0: // Incoming Money
        {
          const amount = getRandomAmount();
          const sender = getRandomElement(names);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `You have received ${amount} RWF from ${sender}. Transaction ID: ${txId}. Date: ${date}.`;
        }
        break;

      case 1: // Payment to Code Holder
        {
          const amount = getRandomAmount();
          const receiver = getRandomElement(names);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `TxId: ${txId}. Your payment of ${amount} RWF to ${receiver} has been completed. Date: ${date}.`;
        }
        break;

      case 2: // Airtime Bill Payment
        {
          const amount = getRandomAmount(500, 5000);
          const fee = Math.floor(amount * 0.02);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `*162*TxId:${txId}*S*Your payment of ${amount} RWF to Airtime has been completed. Fee: ${fee} RWF. Date: ${date}.`;
        }
        break;

      case 3: // Agent Withdrawal
        {
          const amount = getRandomAmount(5000, 100000);
          const customer = getRandomElement(names);
          const agent = getRandomElement(agentNames);
          const agentPhone = getRandomElement(phoneNumbers);
          const date = getRandomDate();
          message = `You ${customer} have via agent: ${agent} (${agentPhone}), withdrawn ${amount} RWF on ${date}.`;
        }
        break;

      case 4: // Internet Bundle Purchase
        {
          const bundles = ['1GB', '2GB', '5GB', '10GB', '20GB'];
          const bundle = getRandomElement(bundles);
          const amount = getRandomAmount(1000, 15000);
          const days = [7, 15, 30, 60][Math.floor(Math.random() * 4)];
          message = `Yello! You have purchased an internet bundle of ${bundle} for ${amount} RWF valid for ${days} days.`;
        }
        break;

      case 5: // Voice Bundle Purchase
        {
          const bundles = ['100 minutes', '200 minutes', '500 minutes', '1000 minutes'];
          const bundle = getRandomElement(bundles);
          const amount = getRandomAmount(1000, 8000);
          const days = [7, 15, 30][Math.floor(Math.random() * 3)];
          message = `Voice bundle ${bundle} purchased for ${amount} RWF. Valid for ${days} days.`;
        }
        break;

      case 6: // Transfer to Mobile
        {
          const amount = getRandomAmount();
          const phone = getRandomElement(phoneNumbers);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `Transfer of ${amount} RWF to ${phone} completed. TxId: ${txId}. ${date}`;
        }
        break;

      case 7: // Bank Deposit
        {
          const amount = getRandomAmount(10000, 500000);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `Bank deposit of ${amount} RWF completed. TxId: ${txId}. ${date}`;
        }
        break;

      case 8: // Cash Power Bill Payment
        {
          const amount = getRandomAmount(2000, 25000);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `EUCL payment of ${amount} RWF completed. TxId: ${txId}. ${date}`;
        }
        break;

      case 9: // Third Party Transaction
        {
          const amount = getRandomAmount();
          const initiator = getRandomElement(names);
          const txId = generateTransactionId();
          message = `Payment initiated by ${initiator}. Amount: ${amount} RWF. TxId: ${txId}`;
        }
        break;

      case 10: // Bank Transfer
        {
          const amount = getRandomAmount(50000, 1000000);
          const txId = generateTransactionId();
          const date = getRandomDate();
          message = `Bank transfer of ${amount} RWF completed. TxId: ${txId}. ${date}`;
        }
        break;
    }

    messages.push(message);
  }

  return messages;
}

function generateXmlFile(messages: string[], filename: string = 'sample-sms-data.xml'): void {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<sms_data>\\n';
  
  messages.forEach(message => {
    xml += `  <sms>\\n    <body>${message}</body>\\n  </sms>\\n`;
  });
  
  xml += '</sms_data>';

  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, xml, 'utf8');
  
  console.log(`Generated ${messages.length} SMS messages in ${filename}`);
  console.log(`File saved to: ${filePath}`);
}

// Generate sample data
const sampleMessages = generateSmsMessages(1600);
generateXmlFile(sampleMessages, 'sample-sms-data.xml');

// Also generate a smaller test file
const testMessages = generateSmsMessages(50);
generateXmlFile(testMessages, 'test-sms-data.xml');

export { generateSmsMessages, generateXmlFile };
