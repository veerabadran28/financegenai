#!/usr/bin/env python3
"""
Quick diagnostic script to check if new document processor is available
"""

import sys
import os

print("=" * 60)
print("Document Processor Diagnostic")
print("=" * 60)

# Check if new files exist
print("\n1. Checking for new files...")
new_files = [
    'config.py',
    'document_processor.py',
    'processors/__init__.py',
    'processors/textract_processor.py',
    'processors/local_processor.py',
    '.env.example'
]

all_exist = True
for file in new_files:
    exists = os.path.exists(file)
    status = "✓" if exists else "✗"
    print(f"   {status} {file}")
    if not exists:
        all_exist = False

if not all_exist:
    print("\n❌ NEW CODE NOT FOUND!")
    print("\nYou need to pull the latest changes:")
    print("   git pull origin claude/fix-disconnected-status-011CUyMuRwPWtjCuyXJpUR7E")
    sys.exit(1)

print("\n✓ All new files found!")

# Check if dependencies are installed
print("\n2. Checking dependencies...")
deps = {
    'boto3': 'AWS SDK',
    'pdfplumber': 'Enhanced table extraction',
    'dotenv': 'Configuration management (python-dotenv)'
}

missing_deps = []
for module, description in deps.items():
    try:
        __import__(module)
        print(f"   ✓ {module} - {description}")
    except ImportError:
        print(f"   ✗ {module} - {description}")
        missing_deps.append(module)

if missing_deps:
    print(f"\n⚠ Missing dependencies: {', '.join(missing_deps)}")
    print("   Install with: pip install -r requirements.txt")
else:
    print("\n✓ All dependencies installed!")

# Check main.py import
print("\n3. Checking main.py import...")
try:
    with open('main.py', 'r') as f:
        content = f.read()
        if 'from document_processor import get_processor' in content:
            print("   ✓ main.py imports NEW document_processor")
        elif 'from docling_processor import get_processor' in content:
            print("   ✗ main.py imports OLD docling_processor")
            print("   Update needed!")
        else:
            print("   ? Could not determine import")
except Exception as e:
    print(f"   ✗ Error reading main.py: {e}")

# Check .env configuration
print("\n4. Checking configuration...")
if os.path.exists('.env'):
    print("   ✓ .env file exists")
    try:
        with open('.env', 'r') as f:
            content = f.read()
            if 'AWS_TEXTRACT_ENABLED' in content:
                print("   ✓ Configuration looks correct")
            else:
                print("   ⚠ .env might be incomplete")
    except Exception as e:
        print(f"   ✗ Error reading .env: {e}")
else:
    print("   ⚠ .env file not found (will use defaults)")
    print("   Create from: copy .env.example .env")

print("\n" + "=" * 60)
print("Diagnostic complete!")
print("=" * 60)
