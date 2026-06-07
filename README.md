Great! Here's an updated README.md that reflects your actual project (Join-PDFs Serverless Platform) instead of the Astro starter template:

```markdown
# Join-PDFs Serverless Platform

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?logo=astro)](https://astro.build)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Join-PDFs** is a free, serverless PDF processing platform that runs entirely in your browser. Merge, split, compress, and convert PDFs without uploading files to any server — everything happens locally on your machine.

🔗 **Live Site:** [https://join-pdfs.com](https://join-pdfs.com)

## ✨ Features

- 🔒 **100% Client-Side Processing** - Your files never leave your computer
- 📄 **Merge PDFs** - Combine multiple PDFs into one document
- ✂️ **Split PDFs** - Extract specific pages or page ranges
- 🗜️ **Compress PDFs** - Reduce file size while maintaining quality
- 🖼️ **Images to PDF** - Convert JPG, PNG, WebP to PDF
- 📸 **PDF to Image** - Extract pages as PNG/JPG images
- 📝 **PDF to Word/Excel/PPT/Text** - Convert to editable formats
- 🎨 **Image Editor & Collage Maker** - Create stunning visuals
- 🤖 **AI Assistant** - Get help with PDF tasks
- 🌙 **Dark Mode** - Easy on the eyes
- 📱 **Mobile Responsive** - Works on all devices

## 🏗️ Project Architecture

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | Astro (Static HTML compilation) |
| **Hosting Platform** | Cloudflare Pages (Edge deployment) |
| **Backend APIs** | Native Cloudflare Workers (`public/_worker.js`) |
| **Database** | Cloudflare KV Namespace Store |
| **KV Binding** | `JOIN_PDFS_STORE` |

## 📁 Project Structure

```
join-pdfs-serverless/
├── public/
│   ├── _headers              # CSP & security headers
│   ├── _worker.js            # Cloudflare Worker (APIs)
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side JavaScript
│   │   └── lib/              # Local PDF libraries
│   ├── fonts/                # Local Font Awesome fonts
│   └── vendor/               # Vendor assets
├── src/
│   ├── layouts/              # Astro layout components
│   │   └── Layout.astro      # Main layout template
│   └── pages/                # Astro pages
│       ├── index.astro       # Homepage
│       ├── split.astro       # PDF split tool
│       ├── merge.astro       # PDF merge tool
│       ├── compress.astro    # PDF compression
│       └── ...               # Other tool pages
├── functions/                # Cloudflare Pages Functions
├── package.json              # Dependencies
└── astro.config.mjs          # Astro configuration
```

## 🧞 Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview build locally before deploying |
| `npx wrangler pages deploy dist` | Deploy to Cloudflare Pages |

## 🚀 Deployment

### One-Command Deployment

```powershell
npm run build
Remove-Item .wrangler/ -Recurse -Force -ErrorAction SilentlyContinue
npx wrangler pages deploy dist --no-config --project-name=join-pdfs --branch=main
```

### Environment Variables / KV Namespace

Make sure your Cloudflare Pages project has a KV namespace bound as `JOIN_PDFS_STORE` for the license verification and learning system.

## 🛡️ Security Headers

The site uses a strict Content Security Policy (CSP) configured via `public/_headers`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`

## 🔧 Key Challenges Overcome

| Challenge | Solution |
|-----------|----------|
| **Nested folder structure causing build failures** | Flattened project to single root directory |
| **Astro vs Cloudflare router conflicts (ASSETS error)** | Forced static output mode (`output: 'static'`) |
| **API 404/405 errors** | Migrated to unified `public/_worker.js` |
| **Chat widget event overlaps** | Isolated namespaces (`page-` prefix) |
| **Broken CDN stylesheets** | Local bundle via npm (`bootstrap`) |
| **Dark mode hardcoded backgrounds** | CSS variables (`var(--bg-primary)`) |
| **CSP blocking PDF libraries** | Local library hosting (`/js/lib/`) |

## 📚 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | AI assistant with self-learning system |
| `/api/verify-key` | POST | Premium license key verification |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or building your own PDF tools!

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering by Mozilla
- [PDF-lib](https://pdf-lib.org/) - PDF manipulation
- [JSZip](https://stuk.github.io/jszip/) - ZIP file generation
- [Font Awesome](https://fontawesome.com/) - Icons
- [Astro](https://astro.build) - Static site framework
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting & edge functions

---

Built with ❤️ by the Join-PDFs team
```

This README now accurately reflects:
- Your actual project (not the Astro template)
- The technologies you're using
- The challenges you overcame
- The deployment commands that actually work
- The security features you implemented

Save this as `README.md` in your project root, then commit and push it:

```powershell
git add README.md
git commit -m "docs: update README with actual project details"
git push origin main
```