#!/usr/bin/env python3
"""
Enterprise Document Processing Orchestrator
Coordinates between AWS Textract (primary) and local processing (fallback)
Replaces Docling with enterprise-grade, reusable document processing
"""

import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from config import ProcessorConfig
from processors.textract_processor import TextractProcessor
from processors.local_processor import LocalProcessor


logger = logging.getLogger(__name__)


class DocumentProcessor:
    """
    Enterprise document processor with hybrid cloud/local support

    Features:
    - AWS Textract for high-quality OCR, table, and form extraction
    - Local PyMuPDF + pdfplumber fallback for offline/cost-sensitive use
    - Automatic processor selection based on config and file characteristics
    - Consistent output format across all processors
    """

    def __init__(self, config: Optional[ProcessorConfig] = None):
        """
        Initialize document processor with configuration

        Args:
            config: ProcessorConfig instance (uses default if None)
        """
        self.config = config or ProcessorConfig()
        self.textract_processor = None
        self.local_processor = None

        # Initialize processors based on configuration
        self._initialize_processors()

        # Log configuration
        if self.config.LOG_PROCESSOR_SELECTION:
            logger.info(f"📄 Document Processor Mode: {self.config.get_processor_mode()}")

    def _initialize_processors(self):
        """Initialize available processors based on configuration"""

        # Initialize AWS Textract if enabled
        if self.config.AWS_TEXTRACT_ENABLED:
            try:
                aws_config = self.config.get_aws_credentials()
                self.textract_processor = TextractProcessor(
                    aws_config=aws_config,
                    api_mode=self.config.TEXTRACT_API_MODE
                )
                logger.info("✅ AWS Textract processor ready")
            except Exception as e:
                logger.warning(f"Failed to initialize Textract: {e}")
                self.textract_processor = None

        # Initialize local processor if fallback enabled
        if self.config.USE_LOCAL_FALLBACK:
            try:
                self.local_processor = LocalProcessor(
                    enable_pdfplumber=self.config.ENABLE_PDFPLUMBER
                )
                logger.info("✅ Local processor ready")
            except Exception as e:
                logger.error(f"Failed to initialize local processor: {e}")
                self.local_processor = None

    async def process_document(
        self,
        file_path: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        Process document using best available processor

        Selection logic:
        1. Check if Textract is enabled and file meets criteria
        2. Try Textract if applicable
        3. Fall back to local processing on error or if Textract unavailable
        4. Return consistent result format

        Args:
            file_path: Path to the document file
            file_type: MIME type of the file

        Returns:
            Structured document data with tables, chunks, and metadata
        """
        logger.info(f"Processing document: {file_path} (type: {file_type})")

        # Get file size for decision making
        file_size = os.path.getsize(file_path)

        try:
            # Determine which processor to use
            use_textract = self._should_use_textract(file_size)

            # Try Textract first if applicable
            if use_textract and self.textract_processor:
                try:
                    if self.config.LOG_PROCESSOR_SELECTION:
                        logger.info(f"📊 Selected: AWS Textract ({self.config.TEXTRACT_API_MODE})")

                    result = await self.textract_processor.process_document(file_path, file_type)
                    logger.info("✅ Processed with AWS Textract")
                    return result

                except Exception as e:
                    logger.debug(f"Textract not suitable for this document: {e}")
                    if not self.config.USE_LOCAL_FALLBACK:
                        raise  # No fallback available
                    logger.info("Using local processor for this document")
                    if self.config.LOG_PROCESSOR_SELECTION:
                        logger.info("📊 Selected: Local processor (PyMuPDF + pdfplumber)")

            # Use local processor (either as primary or fallback)
            if self.local_processor:
                if self.config.LOG_PROCESSOR_SELECTION and not use_textract:
                    logger.info("📊 Selected: Local processor (PyMuPDF + pdfplumber)")

                result = await self.local_processor.process_document(file_path, file_type)
                logger.info("✅ Processed with local processor")
                return result

            # No processor available
            error_msg = "No document processor available (Textract disabled and local fallback unavailable)"
            logger.error(error_msg)
            return self._create_error_document(file_path, error_msg)

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            return self._create_error_document(file_path, str(e))

    def _should_use_textract(self, file_size_bytes: int) -> bool:
        """
        Determine if Textract should be used based on configuration and file characteristics

        Args:
            file_size_bytes: Size of the file in bytes

        Returns:
            True if Textract should be used, False otherwise
        """
        if not self.textract_processor:
            return False

        return self.config.should_use_textract(file_size_bytes)

    def _create_error_document(
        self,
        file_path: str,
        error: str
    ) -> Dict[str, Any]:
        """Create error document response"""
        error_msg = f"Error processing document: {error}"

        return {
            "success": False,
            "processor": "error",
            "fileName": os.path.basename(file_path),
            "content": error_msg,
            "type": "error",
            "metadata": {
                "wordCount": 0,
                "characterCount": len(error_msg)
            },
            "tables": [],
            "layout": {
                "hasMultipleColumns": False,
                "pageCount": 0,
                "sections": []
            },
            "chunks": [{
                "id": "error-chunk",
                "content": error_msg,
                "startIndex": 0,
                "endIndex": len(error_msg),
                "type": "error",
                "metadata": {}
            }],
            "processedAt": datetime.now().isoformat(),
            "error": error
        }


# Global processor instance
_processor = None


def get_processor(config: Optional[ProcessorConfig] = None) -> DocumentProcessor:
    """
    Get or create global processor instance

    Args:
        config: Optional ProcessorConfig instance

    Returns:
        DocumentProcessor instance
    """
    global _processor
    if _processor is None:
        _processor = DocumentProcessor(config)
    return _processor


def reset_processor():
    """Reset global processor instance (useful for testing or config changes)"""
    global _processor
    _processor = None
