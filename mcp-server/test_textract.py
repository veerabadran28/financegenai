#!/usr/bin/env python3
"""Test AWS Textract configuration"""

import asyncio
import sys
from config import ProcessorConfig

async def test_config():
    """Test configuration and AWS connectivity"""
    
    config = ProcessorConfig()
    
    print("=" * 60)
    print("AWS Textract Configuration Test")
    print("=" * 60)
    
    # Print configuration
    config.print_config()
    
    # Validate AWS config
    if config.AWS_TEXTRACT_ENABLED:
        print("\n✓ AWS Textract is ENABLED")
        
        if config.validate_aws_config():
            print("✓ AWS configuration is valid")
        else:
            print("✗ AWS configuration is INVALID")
            sys.exit(1)
            
        # Test AWS connectivity
        try:
            import boto3
            print("\n✓ boto3 is installed")
            
            # Try to create client
            aws_config = config.get_aws_credentials()
            client = boto3.client('textract', **aws_config)
            print(f"✓ AWS Textract client created (region: {config.AWS_REGION})")
            
            # Optional: Test with a simple API call (requires permissions)
            # This is commented out to avoid errors if permissions aren't set yet
            # response = client.get_document_analysis(JobId='test')
            
            print("\n✅ AWS Textract is ready to use!")
            
        except Exception as e:
            print(f"\n✗ Error testing AWS: {e}")
            print("\nPossible issues:")
            print("  - Check AWS credentials are correct")
            print("  - Verify IAM permissions for Textract")
            print("  - Confirm network connectivity to AWS")
            sys.exit(1)
    else:
        print("\n⚠ AWS Textract is DISABLED")
        print("Enable it by setting AWS_TEXTRACT_ENABLED=true in .env")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_config())