# Join-PDFs Serverless Platform

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?logo=astro)](https://astro.build)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Join-PDFs** is a free, serverless media processing platform that runs entirely in your browser. Merge, split, compress, and convert PDFs, create logos, make collages, extract audio from videos, optimize resumes, and view documents in 3D — all without uploading files to any server.

🔗 **Live Site:** [https://join-pdfs.com](https://join-pdfs.com)

## ✨ Features

### PDF & Document Tools
- 🔒 **100% Client-Side Processing** - Your files never leave your computer
- 📖 **3D Digital Flipbook Previewer** - Turn static PDFs into interactive 3D digital spreads with canvas drag physics and 400% accessible zoom configurations
- 📄 **DOCX to PDF Converter** - Extract layout content from Word files and compile text vectors to PDF natively via client-side zip decryptions
- 📸 **Meme-to-PDF Bookmaker** - Convert image reaction collections and custom text captions directly into printable table books
- 📄 **Merge PDFs** - Combine multiple PDFs into one document
- ✂️ **Split PDFs** - Extract specific pages or page ranges
- 🗜️ **Compress PDFs** - Reduce file size while maintaining quality
- 🖼️ **Images to PDF** - Convert JPG, PNG, WebP to PDF
- 📸 **PDF to Image** - Extract pages as PNG/JPG images
- 📝 **PDF to Word** - Convert to editable Word documents
- 📊 **PDF to Excel** - Extract tables to Excel spreadsheets
- 📽️ **PDF to PowerPoint** - Each page becomes a slide
- 📄 **PDF to Text** - Extract plain text from PDFs

### Career & Enterprise Tools
- 📝 **ATS Resume Optimizer & Reviewer** - Test resume strings locally against Applicant Tracking Systems to calculate dynamic optimization scores
- ✨ **Smart Resume Builder & Redesigner** - Sync text variables in real-time onto minimal ATS-ready document layouts with session data cross-forwarding triggers

### Creative Tools & Media Processing
- 🎨 **Logo Maker** - Design custom logos with shapes, text, and gradients
- 🖼️ **Collage Maker** - Create photo collages with customizable layouts
- 🎬 **AV Toolkit** - Extract audio (WAV) and capture frames from videos
- 🎵 **Audio Extraction** - Extract audio tracks as WAV files
- 📸 **Frame Capture** - Save video frames as JPEG images
- 🎨 **Image Editor** - Basic image editing tools

## 🏗️ Project Architecture

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | Astro (Static HTML compilation) |
| **Hosting Platform** | Cloudflare Pages (Edge deployment) |
| **Backend APIs** | Native Cloudflare Workers (`public/_worker.js`) |
| **Database** | Cloudflare KV Namespace Store / Local Session Storage Matrix |
| **Merchant of Record** | Paddle Global Buyer Checkout Integration |

## 📁 Project Structure
join-pdfs-serverless/
├── public/
│   ├── _worker.js         # Cloudflare Worker (APIs)
│   ├── _headers           # CSP & security headers whitelisting AdSense/CDNs
│   ├── ads.txt            # Verified Google Publisher Credential Record
│   ├── js/
│   │   ├── lib/           # Core static libraries (pdf-lib, pdf.js, jszip)
│   │   ├── flipbook.js    # 3D Flipbook viewport dragging and zoom logic
│   │   ├── resume_optimizer.js # Resume text keyword scanner array matrix
│   │   ├── resume_builder.js   # Live preview and PDF generation pipeline
│   │   ├── docx_converter.js   # JSZip extraction and XML processing engine
│   │   ├── meme_bookmaker.js   # Image base64 binary byte converter engine
│   │   ├── av_toolkit.js  # AV Toolkit logic
│   │   ├── collage_maker.js # Collage Maker logic
│   │   └── logo_maker.js  # Logo Maker logic
│   └── css/               # Modular page stylesheets
├── src/
│   ├── layouts/           # Astro layout components
│   └── pages/             # Astro dynamic routing paths (38+ views live)
└── package.json

## 🚀 Quick Deploy

```powershell
npm run deploy
```

## 🛠️ Technology Stack

| Library | Version | Purpose |
|---------|---------|---------|
| **PDF.js** | 2.16.105 | PDF text extraction and runtime matrix parsing |
| **PDF-lib** | 1.17.1 | PDF document template geometry generation |
| **SheetJS (XLSX)** | 0.18.5 | Excel spreadsheet compilation |
| **PptxGenJS** | 3.12.0 | PowerPoint slide presentation generation |
| **Fabric.js** | 5.3.0 | Canvas layout vectors manipulation (Logo Maker) |
| **JSZip** | 3.10.1 | Client-side archive decompilation for Office files |

## 🔧 Key Challenges & Solutions
- **CSP Asset Blocking Protection:** Configured `public/_headers` rules to safely whitelist `://googlesyndication.com` (AdSense) alongside performance styling CDNs.
- **Race Condition Sync Freezes:** Unified worker dependencies directly inside `public/js/flipbook.js` execution cycles using explicit execution timing constraints to resolve runtime mapping anomalies.
- **Base64 String Rejections:** Created custom native array mapping utilities (`base64ToUint8Array`) to convert raw text arrays into byte blocks compatible with `pdf-lib`.

## 🛡️ Security Headers
Content Security Policy (CSP) rules inside `public/_headers` are locked down to secure client configurations while enabling ad delivery scripts, Google Analytics, and style packages natively:
- `script-src`: Self-hosted code, Google Tag Manager, AdSense iframes
- `frame-src`: DoubleClick delivery validation streams
- `style-src`: CDNjs FontAwesome icons, jsDelivr Bootstrap components

## 📝 Build Scripts
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && npm run copy-libs",
    "copy-libs": "xcopy /E /I /Y public\\js\\lib dist\\js\\lib",
    "deploy": "npm run build && npx wrangler pages deploy dist --project-name=join-pdfs --branch=main"
  }
}
```

## 🎯 Application Matrix Status

| Tool / Module | Status | Type | Engine |
|---|---|---|---|
| **3D Digital Flipbook** | ✅ Active | Interactive App | `pdf.js` + 3D Transform |
| **ATS Resume Optimizer** | ✅ Active | Analytics Tool | `pdf.js` Text Mining |
| **Smart Resume Builder** | ✅ Active | Document Generator | `pdf-lib` + Session Cache |
| **DOCX to PDF Converter** | ✅ Active | File Processor | `JSZip` + XML Parser |
| **Meme-to-PDF Bookmaker** | ✅ Active | Assembly Utility | `pdf-lib` + Base64 Bytes |
| **Images to PDF** | ✅ Active | Core Processing | `pdf-lib` |
| **PDF to Image** | ✅ Active | Core Processing | `pdf.js` |
| **Merge PDF / Split PDF** | ✅ Active | Core Processing | `pdf-lib` |
| **Compress PDF** | ✅ Active | Core Processing | `pdf-lib` |
| **PDF Conversion Layers** | ✅ Active | Office Suite | `pdf.js` + SheetJS/PptxGenJS |
| **Creative Suite Apps** | ✅ Active | Layout Systems | Fabric.js / Canvas API / Web Audio |

📄 Licensed under the MIT Framework. Built with ❤️ by the Join-PDFs Platform Development Team.
