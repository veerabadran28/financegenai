#!/usr/bin/env python3
"""
Startup script for FastMCP Document Analysis Server
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Start the FastMCP server"""
    print("🚀 Starting FastMCP Document Analysis Server...")
    
    # Check if we're in the right directory
    if not Path("requirements.txt").exists():
        print("❌ Error: requirements.txt not found. Make sure you're in the mcp-server directory.")
        sys.exit(1)
    
    # Install dependencies if needed
    try:
        import fastmcp
        print("✅ FastMCP already installed")
    except ImportError:
        print("📦 Installing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed")
    
    # Start the server
    print("🌟 Starting server on http://localhost:8000")
    print("📚 MCP tools available for document analysis")
    print("🔗 Connect your React app to this MCP server")
    print()
    
    # Run the main server
    subprocess.run([sys.executable, "main.py"])

if __name__ == "__main__":
    main()