
CREATE TYPE transaction_type AS ENUM (
    'incoming_money',
    'payment_to_code_holder',
    'transfer_to_mobile',
    'bank_deposit',
    'airtime_bill_payment',
    'cash_power_bill_payment',
    'third_party_transaction',
    'agent_withdrawal',
    'bank_transfer',
    'internet_bundle_purchase',
    'voice_bundle_purchase',
    'unknown'
);

CREATE TYPE transaction_status AS ENUM (
    'completed',
    'pending',
    'failed',
    'cancelled'
);

CREATE TABLE sms_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_message TEXT NOT NULL,
    transaction_type transaction_type DEFAULT 'unknown',
    transaction_id VARCHAR(255),
    amount DECIMAL(15, 2),
    fee DECIMAL(10, 2) DEFAULT 0,
    sender_name VARCHAR(255),
    receiver_name VARCHAR(255),
    phone_number VARCHAR(20),
    agent_name VARCHAR(255),
    agent_phone VARCHAR(20),
    service_provider VARCHAR(255),
    bundle_type VARCHAR(100),
    bundle_size VARCHAR(100),
    validity_days INTEGER,
    transaction_date TIMESTAMP,
    status transaction_status DEFAULT 'completed',
    description TEXT,
    metadata JSON,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_transaction_id ON sms_transactions (transaction_id);
CREATE INDEX idx_transaction_date ON sms_transactions (transaction_date);
