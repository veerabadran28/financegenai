#!/usr/bin/env python3
"""
Configuration Management for Document Processing
Centralized configuration for AWS Textract, local processing, and more
"""

import os
from typing import Optional
from pathlib import Path


class ProcessorConfig:
    """Configuration for document processors"""

    # AWS Textract Configuration
    AWS_TEXTRACT_ENABLED: bool = os.getenv('AWS_TEXTRACT_ENABLED', 'false').lower() == 'true'
    AWS_REGION: str = os.getenv('AWS_REGION', 'us-east-1')
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv('AWS_SECRET_ACCESS_KEY')

    # Textract API Options
    # Use 'detect' for simple text extraction (cheaper) or 'analyze' for tables/forms (more expensive)
    TEXTRACT_API_MODE: str = os.getenv('TEXTRACT_API_MODE', 'analyze')  # 'detect' or 'analyze'

    # Cost Controls
    TEXTRACT_MAX_FILE_SIZE_MB: int = int(os.getenv('TEXTRACT_MAX_FILE_SIZE_MB', '10'))
    TEXTRACT_MAX_PAGES: int = int(os.getenv('TEXTRACT_MAX_PAGES', '100'))

    # Fallback Configuration
    USE_LOCAL_FALLBACK: bool = os.getenv('USE_LOCAL_FALLBACK', 'true').lower() == 'true'

    # Local Processing Options
    ENABLE_PDFPLUMBER: bool = os.getenv('ENABLE_PDFPLUMBER', 'true').lower() == 'true'
    ENABLE_PYMUPDF: bool = os.getenv('ENABLE_PYMUPDF', 'true').lower() == 'true'

    # Processing Options
    CHUNK_SIZE: int = int(os.getenv('CHUNK_SIZE', '1500'))  # Characters per chunk
    EXTRACT_IMAGES: bool = os.getenv('EXTRACT_IMAGES', 'false').lower() == 'true'

    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_PROCESSOR_SELECTION: bool = os.getenv('LOG_PROCESSOR_SELECTION', 'true').lower() == 'true'

    @classmethod
    def validate_aws_config(cls) -> bool:
        """Validate AWS configuration is complete"""
        if not cls.AWS_TEXTRACT_ENABLED:
            return False

        # Check if we have either explicit credentials or can use IAM role
        has_explicit_creds = cls.AWS_ACCESS_KEY_ID and cls.AWS_SECRET_ACCESS_KEY

        # If running on EC2/ECS/Lambda, boto3 will use IAM role automatically
        # So we don't strictly need explicit credentials
        return True  # Let boto3 handle credential resolution

    @classmethod
    def should_use_textract(cls, file_size_bytes: int, page_count: Optional[int] = None) -> bool:
        """Determine if Textract should be used based on file characteristics"""
        if not cls.AWS_TEXTRACT_ENABLED:
            return False

        if not cls.validate_aws_config():
            return False

        # Check file size limit
        file_size_mb = file_size_bytes / (1024 * 1024)
        if file_size_mb > cls.TEXTRACT_MAX_FILE_SIZE_MB:
            return False

        # Check page count limit (if known)
        if page_count and page_count > cls.TEXTRACT_MAX_PAGES:
            return False

        return True

    @classmethod
    def get_aws_credentials(cls) -> dict:
        """Get AWS credentials configuration"""
        config = {
            'region_name': cls.AWS_REGION
        }

        # Only add explicit credentials if provided
        if cls.AWS_ACCESS_KEY_ID and cls.AWS_SECRET_ACCESS_KEY:
            config['aws_access_key_id'] = cls.AWS_ACCESS_KEY_ID
            config['aws_secret_access_key'] = cls.AWS_SECRET_ACCESS_KEY

        return config

    @classmethod
    def get_processor_mode(cls) -> str:
        """Get current processor mode for logging"""
        if cls.AWS_TEXTRACT_ENABLED and cls.validate_aws_config():
            return f"hybrid (AWS Textract {cls.TEXTRACT_API_MODE} + local fallback)"
        elif cls.USE_LOCAL_FALLBACK:
            return "local-only (PyMuPDF + pdfplumber)"
        else:
            return "disabled"

    @classmethod
    def print_config(cls):
        """Print current configuration (for debugging)"""
        print(f"""
Document Processor Configuration:
=================================
Mode: {cls.get_processor_mode()}

AWS Textract:
  Enabled: {cls.AWS_TEXTRACT_ENABLED}
  Region: {cls.AWS_REGION}
  API Mode: {cls.TEXTRACT_API_MODE}
  Max File Size: {cls.TEXTRACT_MAX_FILE_SIZE_MB} MB
  Max Pages: {cls.TEXTRACT_MAX_PAGES}
  Credentials: {'Explicit' if cls.AWS_ACCESS_KEY_ID else 'IAM Role/Environment'}

Local Processing:
  Fallback Enabled: {cls.USE_LOCAL_FALLBACK}
  PyMuPDF: {cls.ENABLE_PYMUPDF}
  pdfplumber: {cls.ENABLE_PDFPLUMBER}
  Chunk Size: {cls.CHUNK_SIZE} chars

Other:
  Extract Images: {cls.EXTRACT_IMAGES}
  Log Level: {cls.LOG_LEVEL}
""")


# Export singleton instance
config = ProcessorConfig()
