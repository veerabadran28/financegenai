# Enterprise Document Processing

## Overview

This MCP server provides **enterprise-grade document processing** with a hybrid approach:
- **Primary**: AWS Textract for high-quality OCR, table extraction, and form detection
- **Fallback**: PyMuPDF + pdfplumber for local, offline processing

This architecture is designed to be **reusable across projects** and **enterprise-friendly** (no HuggingFace dependencies).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Document Upload (PDF, images, etc.)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           DocumentProcessor (Orchestrator)               │
│  • Checks configuration                                  │
│  • Validates file size/page limits                       │
│  • Selects appropriate processor                         │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ TextractProcessor│    │  LocalProcessor  │
│                  │    │                  │
│ • AWS API calls  │    │ • PyMuPDF text   │
│ • Table extract  │    │ • pdfplumber     │
│ • Form extract   │    │   tables         │
└──────────────────┘    └──────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Unified JSON Output  │
         │  • text               │
         │  • tables             │
         │  • chunks             │
         │  • metadata           │
         └───────────────────────┘
```

## Features

### AWS Textract (Primary)
- ✅ **High-quality OCR** for scanned documents
- ✅ **Advanced table extraction** with cell-level accuracy
- ✅ **Form/Key-value extraction** (invoices, forms)
- ✅ **Multi-page support** with page-level metadata
- ✅ **Enterprise-grade** reliability and performance
- ⚠️ **Requires AWS credentials** and incurs API costs

### Local Processing (Fallback)
- ✅ **Fast text extraction** with PyMuPDF
- ✅ **Enhanced table detection** with pdfplumber
- ✅ **100% offline** - no cloud dependencies
- ✅ **No costs** - runs entirely locally
- ✅ **Windows/Linux/Mac** compatible
- ⚠️ Limited OCR capabilities (best for digital PDFs)

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Enable AWS Textract
AWS_TEXTRACT_ENABLED=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here      # Optional - can use IAM role
AWS_SECRET_ACCESS_KEY=your_secret    # Optional - can use IAM role

# API Mode: 'detect' (simple, cheap) or 'analyze' (tables, expensive)
TEXTRACT_API_MODE=analyze

# Cost Controls
TEXTRACT_MAX_FILE_SIZE_MB=10
TEXTRACT_MAX_PAGES=100

# Local Fallback
USE_LOCAL_FALLBACK=true
ENABLE_PDFPLUMBER=true
```

### Configuration Presets

#### Preset 1: Local-Only (Development/Testing)
```bash
AWS_TEXTRACT_ENABLED=false
USE_LOCAL_FALLBACK=true
```

#### Preset 2: AWS Primary (Enterprise Production)
```bash
AWS_TEXTRACT_ENABLED=true
AWS_REGION=us-east-1
TEXTRACT_API_MODE=analyze
USE_LOCAL_FALLBACK=true
```

#### Preset 3: Cost-Conscious
```bash
AWS_TEXTRACT_ENABLED=true
TEXTRACT_API_MODE=detect          # Cheaper API
TEXTRACT_MAX_FILE_SIZE_MB=5       # Limit file size
USE_LOCAL_FALLBACK=true
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd mcp-server
pip install -r requirements.txt
```

### 2. Configure AWS (if using Textract)

#### Option A: IAM Role (Recommended for EC2/ECS/Lambda)
No explicit credentials needed - the server will use the IAM role automatically.

#### Option B: Explicit Credentials
```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

Or add to `.env` file.

### 3. AWS IAM Permissions

Your AWS user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText",
        "textract:AnalyzeDocument"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Start the Server

```bash
python start.py
```

## Usage

### Process a Document

The `process_document` tool automatically selects the best processor:

```python
# Document is uploaded via REST API
# The processor will:
# 1. Check if Textract is enabled and configured
# 2. Validate file size against limits
# 3. Try Textract if applicable
# 4. Fall back to local processing if needed
```

### Output Format

All processors return a consistent format:

```json
{
  "success": true,
  "processor": "textract_analyze",  // or "local_pymupdf_pdfplumber"
  "fileName": "document.pdf",
  "content": "Full extracted text...",
  "type": "application/pdf",
  "metadata": {
    "pageCount": 5,
    "wordCount": 1234,
    "characterCount": 8765,
    "language": "en"
  },
  "tables": [
    {
      "id": "table-0",
      "title": "Table 1",
      "headers": ["Column 1", "Column 2"],
      "rows": [["Data 1", "Data 2"]],
      "markdown": "| Column 1 | Column 2 |\n|---|---|...",
      "pageNumber": 2
    }
  ],
  "layout": {
    "pageCount": 5,
    "hasMultipleColumns": false,
    "sections": []
  },
  "chunks": [
    {
      "id": "chunk-0",
      "content": "Page 1 text...",
      "type": "page",
      "metadata": {"pageNumber": 1}
    }
  ],
  "processedAt": "2025-11-10T12:34:56.789Z"
}
```

## Cost Estimation

### AWS Textract Pricing (as of 2024)

| API | Cost per 1000 Pages | Use Case |
|-----|---------------------|----------|
| DetectDocumentText | ~$1.50 | Simple text extraction |
| AnalyzeDocument (Tables) | ~$50 | Table & form extraction |

**Example**: Processing 1000 pages/month with `analyze` mode = ~$50/month

### Cost Optimization Tips

1. **Use `detect` mode** for simple documents without tables
2. **Set file size limits** to avoid processing large documents
3. **Enable local fallback** for non-critical documents
4. **Use IAM roles** instead of explicit credentials

## Troubleshooting

### Issue: "boto3 not available"
**Solution**: Install AWS SDK
```bash
pip install boto3
```

### Issue: "Access Denied" from AWS
**Solution**: Check IAM permissions and credentials
```bash
aws textract detect-document-text --help  # Test AWS CLI access
```

### Issue: "pdfplumber not available"
**Solution**: Install pdfplumber
```bash
pip install pdfplumber
```

### Issue: Local processing slow
**Solution**:
- Disable pdfplumber: `ENABLE_PDFPLUMBER=false`
- Use PyMuPDF only for faster (but less accurate) processing

## Reusability

This processor is designed to be **reused across projects**:

### In Another Project

1. Copy the `mcp-server/processors/` directory
2. Copy `config.py` and `.env.example`
3. Import and use:

```python
from document_processor import DocumentProcessor
from config import ProcessorConfig

# Use with custom config
config = ProcessorConfig()
processor = DocumentProcessor(config)

result = await processor.process_document("file.pdf", "application/pdf")
```

### Standalone Library

The processors can work independently:

```python
# Use Textract directly
from processors.textract_processor import TextractProcessor

processor = TextractProcessor(
    aws_config={'region_name': 'us-east-1'},
    api_mode='analyze'
)
result = await processor.process_document("file.pdf", "application/pdf")

# Use local processor directly
from processors.local_processor import LocalProcessor

processor = LocalProcessor(enable_pdfplumber=True)
result = await processor.process_document("file.pdf", "application/pdf")
```

## Migration from Docling

This implementation **replaces Docling** completely:

| Feature | Docling | New Implementation |
|---------|---------|-------------------|
| HuggingFace dependency | ❌ Required | ✅ Not needed |
| Enterprise-friendly | ⚠️ Limited | ✅ Yes |
| Cloud processing | ❌ No | ✅ AWS Textract |
| Local processing | ✅ Yes | ✅ Enhanced |
| Table extraction | ⚠️ Basic | ✅ Advanced |
| Cost | Free | AWS costs apply |

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review AWS Textract [documentation](https://docs.aws.amazon.com/textract/)
3. Check pdfplumber [docs](https://github.com/jsvine/pdfplumber)

## License

This code is part of the financegenai project and follows the same license.
