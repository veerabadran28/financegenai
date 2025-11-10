#!/usr/bin/env python3
"""
AWS Textract Document Processor
Enterprise-grade document processing using AWS Textract
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

try:
    import boto3
    from botocore.exceptions import ClientError, BotoCoreError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logging.warning("boto3 not available - AWS Textract will not work")


logger = logging.getLogger(__name__)


class TextractProcessor:
    """AWS Textract document processor with table and form extraction"""

    def __init__(self, aws_config: dict, api_mode: str = 'analyze'):
        """
        Initialize Textract processor

        Args:
            aws_config: AWS configuration dict with region_name, credentials
            api_mode: 'detect' for simple text or 'analyze' for tables/forms
        """
        if not BOTO3_AVAILABLE:
            raise ImportError("boto3 is required for TextractProcessor. Install with: pip install boto3")

        self.api_mode = api_mode
        self.client = None

        try:
            self.client = boto3.client('textract', **aws_config)
            logger.info(f"✅ AWS Textract initialized (region: {aws_config.get('region_name')}, mode: {api_mode})")
        except Exception as e:
            logger.error(f"Failed to initialize AWS Textract client: {e}")
            raise

    def _is_supported_format(self, file_path: str, file_type: str) -> bool:
        """Check if document format is supported by AWS Textract"""
        # Textract supports: PDF, PNG, JPG, JPEG, TIFF
        supported_types = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/tiff'
        ]

        # Check MIME type
        if file_type in supported_types:
            return True

        # Check file extension as fallback
        ext = Path(file_path).suffix.lower()
        supported_exts = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif']
        return ext in supported_exts

    async def process_document(
        self,
        file_path: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        Process document using AWS Textract

        Args:
            file_path: Path to the document file
            file_type: MIME type of the file

        Returns:
            Structured document data with tables, chunks, and metadata
        """
        logger.info(f"Processing document with AWS Textract: {file_path}")

        try:
            # Validate format before sending to Textract
            if not self._is_supported_format(file_path, file_type):
                logger.warning(f"Unsupported format for Textract: {file_type} - {file_path}")
                raise Exception(f"Format not supported by Textract: {file_type}. Supported: PDF, PNG, JPG, TIFF")

            # Read document bytes
            with open(file_path, 'rb') as doc_file:
                doc_bytes = doc_file.read()

            # Call appropriate Textract API
            if self.api_mode == 'detect':
                response = self._detect_document_text(doc_bytes)
            else:  # analyze
                response = self._analyze_document(doc_bytes)

            # Extract data from response
            full_text = self._extract_text_from_blocks(response.get('Blocks', []))
            tables = self._extract_tables_from_blocks(response.get('Blocks', [])) if self.api_mode == 'analyze' else []
            chunks = self._create_chunks_from_blocks(response.get('Blocks', []))
            metadata = self._extract_metadata(response, file_path, full_text)

            return {
                "success": True,
                "processor": f"textract_{self.api_mode}",
                "fileName": os.path.basename(file_path),
                "content": full_text,
                "type": file_type,
                "metadata": metadata,
                "tables": tables,
                "layout": self._extract_layout_info(response.get('Blocks', [])),
                "chunks": chunks,
                "processedAt": datetime.now().isoformat()
            }

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            logger.error(f"AWS Textract API error ({error_code}): {error_msg}")
            raise Exception(f"Textract API error: {error_code} - {error_msg}")

        except Exception as e:
            logger.error(f"Textract processing error: {e}")
            raise

    def _detect_document_text(self, doc_bytes: bytes) -> dict:
        """Call Textract DetectDocumentText API (simple text extraction)"""
        try:
            response = self.client.detect_document_text(
                Document={'Bytes': doc_bytes}
            )
            return response
        except Exception as e:
            logger.error(f"DetectDocumentText API call failed: {e}")
            raise

    def _analyze_document(self, doc_bytes: bytes) -> dict:
        """Call Textract AnalyzeDocument API (with tables and forms)"""
        try:
            response = self.client.analyze_document(
                Document={'Bytes': doc_bytes},
                FeatureTypes=['TABLES', 'FORMS']  # Enable table and form extraction
            )
            return response
        except Exception as e:
            logger.error(f"AnalyzeDocument API call failed: {e}")
            raise

    def _extract_text_from_blocks(self, blocks: List[dict]) -> str:
        """Extract full text from Textract blocks in reading order"""
        lines = []

        for block in blocks:
            if block.get('BlockType') == 'LINE':
                text = block.get('Text', '').strip()
                if text:
                    lines.append(text)

        return '\n'.join(lines)

    def _extract_tables_from_blocks(self, blocks: List[dict]) -> List[Dict[str, Any]]:
        """Extract structured tables from Textract blocks"""
        tables = []

        # Create block map for easy lookup
        block_map = {block['Id']: block for block in blocks}

        # Find all table blocks
        table_blocks = [b for b in blocks if b.get('BlockType') == 'TABLE']

        for idx, table_block in enumerate(table_blocks):
            table_data = self._parse_table_block(table_block, block_map)

            if table_data:
                tables.append({
                    "id": f"table-{idx}",
                    "title": f"Table {idx + 1}",
                    "headers": table_data.get('headers', []),
                    "rows": table_data.get('rows', []),
                    "markdown": self._table_to_markdown(
                        table_data.get('headers', []),
                        table_data.get('rows', [])
                    ),
                    "pageNumber": table_block.get('Page', None),
                    "confidence": table_block.get('Confidence', 0)
                })

        return tables

    def _parse_table_block(self, table_block: dict, block_map: dict) -> Optional[dict]:
        """Parse a single table block into structured data"""
        relationships = table_block.get('Relationships', [])

        # Find CHILD cells
        cell_ids = []
        for rel in relationships:
            if rel.get('Type') == 'CHILD':
                cell_ids = rel.get('Ids', [])
                break

        if not cell_ids:
            return None

        # Organize cells by row and column
        cells_by_position = {}
        for cell_id in cell_ids:
            cell_block = block_map.get(cell_id)
            if not cell_block or cell_block.get('BlockType') != 'CELL':
                continue

            row_index = cell_block.get('RowIndex', 1) - 1  # 0-indexed
            col_index = cell_block.get('ColumnIndex', 1) - 1  # 0-indexed

            # Extract cell text
            cell_text = self._get_cell_text(cell_block, block_map)

            if row_index not in cells_by_position:
                cells_by_position[row_index] = {}
            cells_by_position[row_index][col_index] = cell_text

        # Convert to list format
        if not cells_by_position:
            return None

        max_row = max(cells_by_position.keys())
        max_col = max(max(row.keys()) for row in cells_by_position.values())

        # Build table grid
        table_grid = []
        for row_idx in range(max_row + 1):
            row = []
            for col_idx in range(max_col + 1):
                cell_text = cells_by_position.get(row_idx, {}).get(col_idx, '')
                row.append(cell_text)
            table_grid.append(row)

        if len(table_grid) == 0:
            return None

        # First row as headers, rest as data
        return {
            'headers': table_grid[0] if len(table_grid) > 0 else [],
            'rows': table_grid[1:] if len(table_grid) > 1 else []
        }

    def _get_cell_text(self, cell_block: dict, block_map: dict) -> str:
        """Extract text from a cell block"""
        cell_text = []

        relationships = cell_block.get('Relationships', [])
        for rel in relationships:
            if rel.get('Type') == 'CHILD':
                for child_id in rel.get('Ids', []):
                    child_block = block_map.get(child_id)
                    if child_block and child_block.get('BlockType') == 'WORD':
                        word_text = child_block.get('Text', '')
                        if word_text:
                            cell_text.append(word_text)

        return ' '.join(cell_text)

    def _table_to_markdown(self, headers: List[str], rows: List[List[str]]) -> str:
        """Convert table to markdown format"""
        if not headers:
            return ""

        md_lines = []

        # Headers
        md_lines.append("| " + " | ".join(headers) + " |")

        # Separator
        md_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")

        # Rows
        for row in rows:
            # Pad row if needed
            padded_row = row + [""] * (len(headers) - len(row))
            md_lines.append("| " + " | ".join(padded_row[:len(headers)]) + " |")

        return "\n".join(md_lines)

    def _create_chunks_from_blocks(self, blocks: List[dict]) -> List[Dict[str, Any]]:
        """Create intelligent chunks from Textract blocks"""
        chunks = []
        chunk_id = 0

        # Group blocks by page
        pages = {}
        for block in blocks:
            if block.get('BlockType') == 'LINE':
                page_num = block.get('Page', 1)
                if page_num not in pages:
                    pages[page_num] = []
                pages[page_num].append(block.get('Text', ''))

        # Create chunks per page
        for page_num in sorted(pages.keys()):
            page_text = '\n'.join(pages[page_num])

            if page_text.strip():
                chunks.append({
                    "id": f"chunk-{chunk_id}",
                    "content": page_text.strip(),
                    "startIndex": 0,  # Could calculate based on cumulative text
                    "endIndex": len(page_text),
                    "type": "page",
                    "metadata": {
                        "pageNumber": page_num,
                        "source": "textract"
                    }
                })
                chunk_id += 1

        return chunks

    def _extract_layout_info(self, blocks: List[dict]) -> Dict[str, Any]:
        """Extract document layout information"""
        page_count = 0

        for block in blocks:
            page_num = block.get('Page', 0)
            if page_num > page_count:
                page_count = page_num

        return {
            "hasMultipleColumns": False,  # Textract doesn't directly provide this
            "pageCount": page_count,
            "sections": []
        }

    def _extract_metadata(
        self,
        response: dict,
        file_path: str,
        content: str
    ) -> Dict[str, Any]:
        """Extract document metadata"""
        blocks = response.get('Blocks', [])

        page_count = 0
        for block in blocks:
            page_num = block.get('Page', 0)
            if page_num > page_count:
                page_count = page_num

        return {
            "pageCount": page_count,
            "wordCount": len(content.split()),
            "characterCount": len(content),
            "language": response.get('DocumentMetadata', {}).get('Language', 'en'),
            "title": os.path.basename(file_path),
            "processor": f"textract_{self.api_mode}",
            "textractJobId": response.get('JobId', None)
        }
