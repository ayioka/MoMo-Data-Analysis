# MTN MoMo SMS Data Analysis Dashboard

## 📌 Project Overview

Welcome to our MTN MoMo Transaction Analytics Dashboard! This full-stack application processes SMS transaction data from MTN Mobile Money, categorizes transactions, stores them in a database, and provides an interactive dashboard for analysis and visualization.

**Developed by:**  
👨‍💻 SHEM AYIOKA  
👩‍💻 ATETE MPETA SHINA
👨‍💻 SAMUEL DUSHIMIMANA

## 🎯 Project Purpose

We created this tool to help MTN Rwanda and its customers gain valuable insights from their mobile money transaction data. Our solution transforms raw SMS data into actionable business intelligence.

## ✨ Key Features

- **SMS Data Processing**: Parses XML-formatted SMS data
- **Transaction Categorization**: Identifies 10+ transaction types
- **Database Storage**: SQLite database for efficient data management
- **Interactive Dashboard**: Visualizations and filters for data exploration
- **API Integration**: RESTful endpoints for data access

## 🛠️ Technologies Used

**Backend:**

- Python 3
- Nestjs Framework
- SQLite (Database)
- lxml (XML Processing)

**Frontend:**

- HTML, CSS, JavaScript
- Chart.js (Visualizations)
- Font Awesome (Icons)

## 🚀 Getting Started

### Prerequisites

- Python
- Modern web browser (Chrome, Firefox, Edge)
- (Optional) Virtual environment (recommended)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/ayioka/momo-data-analysis.git
   cd momo-data-analysis
   ```

2. **Set up virtual environment (recommended)**

   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Prepare your data**
   - Place your MTN MoMo SMS data in XML format at `data/sms_v2.xml`
   - A sample file will be created if none exists

### Running the Application

1. **Start the backend server**

   ```bash
   python run.py --run
   ```

2. **Access the dashboard**
   Open your browser and visit:  
   `http://localhost:5000`

3. **Process your data**
   - Click the "Process Data" button
   - Wait for the processing to complete
   - Explore your transaction data!

## 📂 Project Structure

```
momo-data-analysis/
├── backend/
│   ├── app.py
│   ├── data_processor.py
│   ├── database.py
│   └── config.json
├── frontend/
│   ├── index.html
│   ├── dashboard.js
│   └── styles.css
├── data/
│   └── sms_v2.xml
├── database/
│   └── momo.db
├── run.py
└── README.md
```

## 🔍 How It Works

1. **Data Processing**:

   - Reads SMS data from XML file
   - Categorizes transactions using regex patterns
   - Extracts amounts, dates, and transaction details
   - Stores cleaned data in SQLite database

2. **Dashboard Features**:
   - Transaction volume over time
   - Distribution by transaction type
   - Search and filter functionality
   - Summary statistics

## 🤝 Contributing

We welcome contributions! Please fork the repository and submit pull requests.

## Video walkthrough

Find the Youtube link for the walkthrough of the project and also find the report named report.pdf

https://youtu.be/pZ1Khsin58o?si=vylJPHPGiRgCHxue

## 🙏 Acknowledgments

- Our instructor MR. WAKUMA for guidance
- Open source community for amazing tools
- Nestjs for the backend framework

Shem, Mpeta & Samuel!!!!
