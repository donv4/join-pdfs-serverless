## 📝 Updated README.md

Here's a comprehensive update based on today's fixes:

```markdown
# Join-PDFs Serverless Platform

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?logo=astro)](https://astro.build)

**Join-PDFs** is a free, serverless PDF processing platform that runs entirely in your browser. Merge, split, compress, and convert PDFs without uploading files to any server.

🔗 **Live Site:** [https://join-pdfs.com](https://join-pdfs.com)

## ✨ Features

- 🔒 **100% Client-Side Processing** - Your files never leave your computer
- 📄 **Merge PDFs** - Combine multiple PDFs into one document
- ✂️ **Split PDFs** - Extract specific pages or page ranges
- 🗜️ **Compress PDFs** - Reduce file size while maintaining quality
- 🖼️ **Images to PDF** - Convert JPG, PNG, WebP to PDF with customizable options
- 📸 **PDF to Image** - Extract pages as PNG/JPG images
- 📝 **PDF to Word/Excel/PPT/Text** - Convert to editable formats
- 🎨 **Image Editor & Collage Maker** - Create stunning visuals
- 🌙 **Dark Mode** - Easy on the eyes

## 🏗️ Project Architecture

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | Astro (Static HTML compilation) |
| **Hosting Platform** | Cloudflare Pages (Edge deployment) |
| **Backend APIs** | Native Cloudflare Workers (`public/_worker.js`) |
| **Database** | Cloudflare KV Namespace Store |

## 📁 Project Structure

```
join-pdfs-serverless/
├── public/
│   ├── _worker.js            # Cloudflare Worker (APIs)
│   ├── _headers              # CSP & security headers
│   ├── js/
│   │   ├── lib/              # PDF libraries (pdf-lib, pdf.js, jszip)
│   │   └── *.js              # Page-specific JavaScript
│   └── css/                  # Stylesheets
├── src/
│   ├── layouts/              # Astro layout components
│   └── pages/                # Astro pages (tools)
└── package.json
```

## 🚀 Quick Deploy

```powershell
npm run deploy
```

## 🔧 Key Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **PDF-lib dynamic import failing** | Load via `<script>` tag, access via `window.PDFLib` |
| **Local libraries not copying to build** | Added `copy-libs` script in package.json |
| **CSP blocking CDN resources** | Whitelisted unpkg, jsdelivr, cdnjs in headers |
| **Double file dialog popup** | Removed duplicate inline scripts, single event listener |
| **PDF.js module 404 errors** | Use correct CDN paths (`/build/` vs root) |
| **Dark mode hardcoded backgrounds** | CSS variables (`var(--bg-primary)`) |

## 📚 Library Loading Patterns

### For PDF-lib (Images to PDF, Merge, etc.):
```astro
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js" slot="extra-head" />
```
```javascript
const { PDFDocument } = window.PDFLib;
```

### For PDF.js (PDF to Word, Text extraction):
```astro
<script type="module" src="/js/pdf_to_word.js"></script>
```
```javascript
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/pdf.worker.min.js';
```

## 🛡️ Security Headers

CSP configured in `public/_headers`:
- `script-src` includes all required CDNs
- `worker-src 'self' blob:` for PDF workers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

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

## 🐛 Troubleshooting

### PDF to Word button not working?
1. Check console for 404 errors on pdf.mjs
2. Verify worker URL is accessible
3. Ensure script has `type="module"`

### Images to PDF not working?
1. Verify PDF-lib script tag is present
2. Use `window.PDFLib.PDFDocument`, not dynamic import

### Double file dialog?
1. Remove duplicate inline scripts
2. Keep only one event listener per button

## 📄 License

MIT License

---

Built with ❤️ by the Join-PDFs team
```

## 🚀 Commit the README

```powershell
git add README.md
git commit -m "docs: update README with today's fixes and patterns"
git push origin main
```
