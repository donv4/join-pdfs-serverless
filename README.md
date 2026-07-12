markdown
# Join-PDFs Serverless Platform

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?logo=astro)](https://astro.build)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Join-PDFs** is a free, serverless media processing platform that runs entirely in your browser. Merge, split, compress, and convert PDFs, create logos, make collages, extract audio from videos, and more — all without uploading files to any server.

🔗 **Live Site:** [https://join-pdfs.com](https://join-pdfs.com)

## ✨ Features

### PDF Tools
- 🔒 **100% Client-Side Processing** - Your files never leave your computer
- 📄 **Merge PDFs** - Combine multiple PDFs into one document
- ✂️ **Split PDFs** - Extract specific pages or page ranges
- 🗜️ **Compress PDFs** - Reduce file size while maintaining quality
- 🖼️ **Images to PDF** - Convert JPG, PNG, WebP to PDF
- 📸 **PDF to Image** - Extract pages as PNG/JPG images
- 📝 **PDF to Word** - Convert to editable Word documents
- 📊 **PDF to Excel** - Extract tables to Excel spreadsheets
- 📽️ **PDF to PowerPoint** - Each page becomes a slide
- 📄 **PDF to Text** - Extract plain text from PDFs

### Creative Tools
- 🎨 **Logo Maker** - Design custom logos with shapes, text, and gradients
- 🖼️ **Collage Maker** - Create photo collages with customizable layouts
- 🎬 **AV Toolkit** - Extract audio (WAV) and capture frames from videos

### Media Processing
- 🎵 **Audio Extraction** - Extract audio tracks as WAV files
- 📸 **Frame Capture** - Save video frames as JPEG images
- 🎨 **Image Editor** - Basic image editing tools
- 🎭 **Collage Maker** - Grid layouts with spacing and borders

## 🏗️ Project Architecture

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | Astro (Static HTML compilation) |
| **Hosting Platform** | Cloudflare Pages (Edge deployment) |
| **Backend APIs** | Native Cloudflare Workers (`public/_worker.js`) |
| **Database** | Cloudflare KV Namespace Store |

## 📁 Project Structure
join-pdfs-serverless/
├── public/
│ ├── _worker.js # Cloudflare Worker (APIs)
│ ├── _headers # CSP & security headers
│ ├── js/
│ │ ├── lib/ # PDF libraries (pdf-lib, pdf.js, jszip)
│ │ ├── av_toolkit.js # AV Toolkit logic
│ │ ├── collage_maker.js # Collage Maker logic
│ │ ├── logo_maker.js # Logo Maker logic
│ │ └── *.js # Other page-specific JS
│ └── css/ # Stylesheets
├── src/
│ ├── layouts/ # Astro layout components
│ └── pages/ # Astro pages (all tools)
└── package.json

text

## 🚀 Quick Deploy

```powershell
npm run deploy
🛠️ Technology Stack
Library	Version	Purpose
PDF.js	2.16.105	PDF text extraction
PDF-lib	1.17.1	PDF creation/manipulation
SheetJS (XLSX)	0.18.5	Excel file generation
PptxGenJS	3.12.0	PowerPoint creation
Fabric.js	5.3.0	Canvas manipulation (Logo Maker)
🔧 Key Challenges & Solutions
Challenge	Solution
PDF-lib dynamic import failing	Load via <script> tag, access via window.PDFLib
PDF.js module loading	Use CDN with proper worker configuration
Local libraries not copying	Added copy-libs script in package.json
CSP blocking resources	Whitelisted unpkg, jsdelivr, cdnjs
Double file dialog	Removed duplicate inline scripts
Audio extraction	Web Audio API + WAV encoding
📚 Library Loading Patterns
For PDF-lib (Images to PDF, Merge, etc.):
astro
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js" slot="extra-head" />
javascript
const { PDFDocument } = window.PDFLib;
For PDF.js (PDF to Text, Word, Excel):
astro
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js" slot="extra-head"></script>
<script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
</script>
For SheetJS (PDF to Excel):
astro
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" slot="extra-head"></script>
For PptxGenJS (PDF to PowerPoint):
astro
<script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js" slot="extra-head"></script>
🛡️ Security Headers
CSP configured in public/_headers:

script-src includes all required CDNs

worker-src 'self' blob: for PDF workers

X-Frame-Options: DENY

X-Content-Type-Options: nosniff

📝 Build Scripts
json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && npm run copy-libs",
    "copy-libs": "xcopy /E /I /Y public\\js\\lib dist\\js\\lib",
    "deploy": "npm run build && npx wrangler pages deploy dist --project-name=join-pdfs --branch=main"
  }
}
🎯 Tool Status
Tool	Status	Type
Images to PDF	✅ Working	PDF-lib
PDF to Image	✅ Working	PDF.js
Merge PDF	✅ Working	PDF-lib
Split PDF	✅ Working	PDF-lib
Compress PDF	✅ Working	PDF-lib
PDF to Word	✅ Working	PDF.js
PDF to Excel	✅ Working	PDF.js + SheetJS
PDF to PowerPoint	✅ Working	PDF.js + PptxGenJS
PDF to Text	✅ Working	PDF.js
Logo Maker	✅ Working	Fabric.js
Collage Maker	✅ Working	Canvas API
AV Toolkit	✅ Working	Web Audio API
🐛 Troubleshooting
Library not loading?
Check console for 404 errors

Verify CDN URLs are accessible

Ensure slot="extra-head" is on script tags

Double file dialog?
Remove duplicate inline scripts

Keep only one event listener per button

Audio extraction fails?
Ensure file contains an audio track

Try a different file format (MP4, WebM)

Check browser console for errors

📄 License
MIT License

Built with ❤️ by the Join-PDFs team

text

## 🚀 Commit the README

```powershell
# Add the updated README
git add README.md

# Commit
git commit -m "docs: update README with all tools and patterns

- Added AV Toolkit documentation
- Added PDF to PowerPoint and Excel
- Updated library versions and patterns
- Added troubleshooting section
- Complete tool status table"

# Push
git push origin main