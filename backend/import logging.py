import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processing.log', mode='w'),  # overwrite log file each run
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('data_processor')

logger.info("Logging setup confirmed: This message should appear in processing.log and console.")
