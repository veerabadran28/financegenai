# 🚀 Steps to Run Insights-B Locally

This guide provides detailed instructions for running the Insights-B application (v2.0) on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### **Required:**
- **Node.js** 18.x or higher - [Download](https://nodejs.org/)
- **npm** 9.x or higher (comes with Node.js)
- **Python** 3.9 or higher - [Download](https://www.python.org/downloads/)
- **pip** (Python package manager - comes with Python)
- **OpenAI API Key** - [Get yours here](https://platform.openai.com/api-keys)

### **Optional:**
- **Supabase Account** - For conversation persistence - [Sign up](https://supabase.com/)

### **Verify Installation:**

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher

# Check Python version
python --version
# Should output: Python 3.9.x or higher

# Check pip version
pip --version
# Should output: pip 23.x.x or higher
```

---

## 📁 Step 1: Get the Code

### **Option A: Pull Latest Changes (If Already Cloned)**

```bash
cd C:\Users\veera\PythonProjects\project24\financegenai
git pull origin claude/access-check-011CUwmLgpwnY1EKQJBComVb
```

### **Option B: Clone Repository (First Time)**

```bash
cd C:\Users\veera\PythonProjects\project24
git clone https://github.com/yourusername/financegenai.git
cd financegenai
git checkout claude/access-check-011CUwmLgpwnY1EKQJBComVb
```

---

## ⚙️ Step 2: Install Dependencies

### **2.1 Install Frontend Dependencies**

```bash
# From project root
npm install
```

**Expected output:**
```
added 500+ packages in 30s
```

### **2.2 Install Backend (MCP Server) Dependencies**

```bash
# Navigate to MCP server directory
cd mcp-server

# Install Python packages
pip install -r requirements.txt

# Go back to project root
cd ..
```

**Expected output:**
```
Successfully installed docling-2.9.0 docling-core-2.5.2 pymupdf-1.24.0 ...
```

**⏱️ Note:** Docling installation may take 3-5 minutes as it downloads AI models (~500MB).

**If installation fails:**
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Retry installation
cd mcp-server
pip install -r requirements.txt
```

---

## 🔑 Step 3: Configure Environment Variables

### **3.1 Create `.env` File**

**If `.env` doesn't exist:**
```bash
# From project root
copy .env.example .env
# On Mac/Linux: cp .env.example .env
```

### **3.2 Edit `.env` File**

Open `.env` in your text editor and add your keys:

```env
# Required: OpenAI API Key
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Required: MCP Server URL (for document processing)
# Default for local development:
VITE_MCP_SERVER_URL=http://localhost:8000

# Optional: Supabase (for conversation persistence)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**🔑 Get your OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in `.env` file

**⚠️ Important:**
- Replace `sk-your-actual-openai-api-key-here` with your real API key
- Supabase variables are optional (app works without them)
- Never commit `.env` file to Git (it's in `.gitignore`)

---

## 🚀 Step 4: Start the Application

You need **TWO terminals** running simultaneously:

### **Terminal 1: Start MCP Backend Server**

```bash
# Navigate to MCP server directory
cd C:\Users\veera\PythonProjects\project24\financegenai\mcp-server

# Start the server
python start.py
```

**✅ Success indicators:**
```
✅ Docling initialized successfully
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**⚠️ If you see:** "Docling not available, will use fallback processor only"
- Don't worry! PyMuPDF fallback will be used automatically
- Documents will still process, just with less advanced table extraction
- You can try installing Docling separately later

**Keep this terminal running!**

### **Terminal 2: Start Frontend Dev Server**

Open a **new terminal** (keep Terminal 1 running):

```bash
# Navigate to project root
cd C:\Users\veera\PythonProjects\project24\financegenai

# Start frontend
npm run dev
```

**✅ Success indicators:**
```
VITE v5.4.2  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Keep this terminal running too!**

---

## 🌐 Step 5: Open the Application

### **5.1 Open in Browser**

Navigate to: **http://localhost:5173**

You should see the Insights-B interface with:
- ✅ Insights-B logo
- ✅ Web/Work mode toggle (top right)
- ✅ "OpenAI Connected" status in sidebar
- ✅ Upload Documents button
- ✅ Chat interface

### **5.2 Verify Everything is Working**

Open **Browser Developer Console** (Press F12), then run:

```javascript
// Check environment variables
console.log('API Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('MCP Server URL:', import.meta.env.VITE_MCP_SERVER_URL);

// Check MCP server connectivity
fetch('http://localhost:8000/tools/get_system_stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
  .then(res => res.json())
  .then(data => console.log('✅ MCP Server connected:', data))
  .catch(err => console.error('❌ MCP Server unreachable:', err));
```

**Expected output:**
```
API Key: Set
MCP Server URL: http://localhost:8000
✅ MCP Server connected: {success: true, ...}
```

---

## 📊 Step 6: Test Document Upload (Optional but Recommended)

### **6.1 Upload a Test Document**

1. Click **"Upload Documents"** button in sidebar
2. Select your **BOA quarterly results PDF** (or any PDF/DOCX file)
3. Watch for processing message: **"🚀 Processing documents with Docling (Enterprise AI)..."**

### **6.2 Verify Processing**

After upload completes, you should see:

```
📄 Document Processing Complete

✅ Successfully processed 1 document:

• BOA_Q3_2025.pdf - 5,234 words, 15 pages, 5 tables (docling)

📊 Extracted 5 structured tables with preserved formatting!

🎯 Ready for analysis! Ask me questions about your documents and data.
```

### **6.3 Ask a Question**

Try asking:
```
What is the net interest income? Give me the numbers in billions.
```

**Expected:** Accurate answer with numbers from extracted tables! ✅

---

## 🎯 Quick Reference - Daily Startup

After initial setup, starting the app is quick:

### **Every Time You Want to Use the App:**

**Terminal 1 (Backend):**
```bash
cd C:\Users\veera\PythonProjects\project24\financegenai\mcp-server
python start.py
```

**Terminal 2 (Frontend):**
```bash
cd C:\Users\veera\PythonProjects\project24\financegenai
npm run dev
```

**Browser:**
```
http://localhost:5173
```

---

## 🛑 Stopping the Application

### **To Stop the Servers:**

**In each terminal, press:**
```
CTRL + C
```

**Then close the terminals.**

**To restart later:** Just follow the Quick Reference above.

---

## 🔧 Troubleshooting

### **Issue 1: Port 8000 Already in Use**

```bash
# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -i :8000
kill -9 <process_id>

# Then restart MCP server
cd mcp-server
python start.py
```

### **Issue 2: Python Command Not Found**

Try these alternatives:
```bash
python3 start.py
py start.py
```

Check Python installation:
```bash
python --version
python3 --version
py --version
```

### **Issue 3: pip install Fails**

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install packages one by one
pip install fastmcp==0.2.0
pip install openai==1.54.3
pip install docling==2.9.0
pip install pymupdf==1.24.0
```

### **Issue 3a: python-magic / libmagic Error (Windows)**

**Error:** `ImportError: failed to find libmagic. Check your installation`

**This is now FIXED in the latest code!** Just pull the latest changes:

```bash
cd C:\Users\veera\PythonProjects\project24\financegenai
git pull origin claude/access-check-011CUwmLgpwnY1EKQJBComVb

# Reinstall with updated requirements
cd mcp-server
pip install -r requirements.txt
```

**What was fixed:**
- ✅ Windows now uses `python-magic-bin` (includes libmagic DLL)
- ✅ Linux/Mac use standard `python-magic`
- ✅ Import is now optional (won't crash if missing)

**If still having issues:**
```bash
# Uninstall old python-magic
pip uninstall python-magic

# Install Windows-compatible version
pip install python-magic-bin==0.4.14
```

### **Issue 3b: PyPDF2 Deprecation Warning**

**Warning:** `PyPDF2 is deprecated. Please move to the pypdf library instead.`

**This is now FIXED!** The latest code uses `pypdf` instead of `PyPDF2`.

```bash
# Pull latest changes
git pull origin claude/access-check-011CUwmLgpwnY1EKQJBComVb

# Reinstall dependencies
cd mcp-server
pip install -r requirements.txt
```

### **Issue 4: Frontend Can't Connect to Backend**

**Check:**
1. ✅ Backend terminal shows "Uvicorn running on http://0.0.0.0:8000"
2. ✅ `.env` file has `VITE_MCP_SERVER_URL=http://localhost:8000`
3. ✅ Restart frontend after changing `.env` (CTRL+C, then `npm run dev`)

**Test backend manually:**
```bash
# In browser or new terminal
curl -X POST http://localhost:8000/tools/get_system_stats -H "Content-Type: application/json" -d "{}"
```

Should return JSON with `success: true`

### **Issue 5: Document Upload Fails**

**Check MCP server terminal for errors**

Common causes:
- ❌ Backend not running → Start it!
- ❌ File too large (>50MB) → Use smaller file
- ❌ Unsupported format → Use PDF, DOCX, PPTX, XLSX, TXT

### **Issue 6: OpenAI API Key Invalid**

**Error:** "🔑 API Key Error: Your OpenAI API key is invalid."

**Solutions:**
1. Verify key starts with `sk-`
2. Check `.env` file: `VITE_OPENAI_API_KEY=sk-...`
3. Ensure no extra spaces or quotes
4. Restart frontend (CTRL+C, then `npm run dev`)
5. Check OpenAI account has credits

### **Issue 7: Docling Installation Failed**

**If Docling won't install:**

```bash
# Check Python version (must be 3.9+)
python --version

# Try installing separately
pip install docling==2.9.0 docling-core==2.5.2

# Check disk space (needs ~500MB)
```

**If still fails:**
- ✅ PyMuPDF fallback will be used automatically
- ✅ Documents will still process
- ⚠️ Table extraction will be less advanced

---

## ✅ Verification Checklist

Before testing, ensure:

- [ ] **Node.js & Python installed** (check versions)
- [ ] **Git repository cloned** or pulled latest
- [ ] **npm install completed** (frontend dependencies)
- [ ] **pip install completed** (backend dependencies)
- [ ] **.env file created** with OpenAI API key
- [ ] **Backend running** (Terminal 1 - port 8000)
- [ ] **Frontend running** (Terminal 2 - port 5173)
- [ ] **Browser open** at http://localhost:5173
- [ ] **"OpenAI Connected"** showing in sidebar
- [ ] **MCP connectivity test** passes (console)

---

## 📚 Additional Resources

- **Main README**: See `README.md` for full documentation
- **Architecture**: v2.0 with Docling enterprise document processing
- **Troubleshooting**: See README.md "Troubleshooting" section
- **OpenAI Docs**: https://platform.openai.com/docs
- **Docling Info**: https://github.com/DS4SD/docling

---

## 🎉 Success!

Once both servers are running and browser shows the UI:

✅ **You're ready to use Insights-B!**

**Test it:**
1. Upload a document (PDF, DOCX, etc.)
2. Ask questions about the content
3. Get accurate answers with table data extraction!

**Enjoy your enterprise-grade document analysis chatbot!** 🚀

---

## 💡 Tips

- **Keep both terminals open** while using the app
- **Check terminal logs** if something goes wrong
- **Use F12 Developer Console** for debugging
- **Restart servers** if you change `.env` file
- **Pull latest code** regularly: `git pull origin <branch>`

---

**Need Help?** Check the troubleshooting section or consult the main README.md for detailed documentation.

**Happy Analyzing! 📊✨**
