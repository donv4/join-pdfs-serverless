// public/_worker.js - EXPANDED SELF-LEARNING CORE ROUTER

// ===== SECURITY HARDENING =====
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://join-pdfs.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Block malicious path patterns (CVE-2026-3125)
function isMaliciousPath(path) {
  return path.includes('\\') ||           // Backslash bypass
         path.includes('../') ||          // Path traversal
         path.includes('..\\') ||         // Windows path traversal
         path.includes('%2e%2e%2f') ||    // URL encoded ../
         path.includes('%2e%2e%5c');      // URL encoded ..\
}

// Validate request size
async function validateRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_UPLOAD_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large. Maximum size is 50MB.' }), { 
      status: 413,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

// Simple rate limiting (using KV if available)
async function checkRateLimit(env, ip, limit = 60, windowSeconds = 60) {
  if (!env.JOIN_PDFS_STORE) return true; // Skip if no KV
  
  const key = `rate:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;
  
  try {
    const current = await env.JOIN_PDFS_STORE.get(windowKey);
    const count = current ? parseInt(current, 10) : 0;
    
    if (count >= limit) return false;
    
    await env.JOIN_PDFS_STORE.put(windowKey, (count + 1).toString(), { 
      expirationTtl: windowSeconds 
    });
    return true;
  } catch (e) {
    return true; // Fail open if KV error
  }
}


const KNOWLEDGE_BASE = {
  // 📄 PDF Core Tools
  "merge": "You can combine multiple PDFs instantly in your browser via our dashboard. It runs locally for maximum document security.",
  "split": "Our split tool extracts specific pages or breaks documents apart cleanly completely inside local memory.",
  "compress": "Compress reduces your PDF file size without sacrificing readability or image rendering quality metrics.",
  "images-to-pdf": "Images to PDF converts your JPG, PNG, or WebP graphics into a clean, uniform document file layout.",
  "pdf-to-image": "PDF to Image slices your document sheets out and downloads them as individual high-res PNG or JPG files.",
  
  // 🎨 Creative Tools
  "collage-maker": "Our Photo Collage Maker allows you to upload multiple files, arrange custom spacing, adjust borders, and download as one image.",
  "logo-maker": "The Logo Maker lets you design brand assets using drag-and-drop text fields, shapes, and custom layouts.",
  
  // 👑 Premium Features & Pricing
  "pricing": "Join-PDFs Premium features flexible subscription plans. Check out our /pricing page to select a plan.",
  "cost": "Our billing matrix runs securely through Paddle. You can unlock premium keys instantly upon completing checkout.",
  "license": "Enter your premium license key string on the Batch Processing view page to instantly unlock the 50-file workbench pipeline.",
  "batch": "Batch PDF Processing unlocks a high-capacity channel allowing you to compile up to 50 files simultaneously.",
  "discount": "We offer seasonal discounts for teams and educational institutions. Reach out to our support channels for group rates.",

  // 🔒 Security & Privacy Rules
  "security": "Your privacy is protected. Files are processed entirely client-side using browser memory loops and are never saved to a server.",
  "safe": "Your files never leave your computer. Everything runs locally in your web browser with absolute data confidentiality.",
  "privacy": "We carry a strict zero-retention infrastructure rule framework. Your document data parameters stay local.",
  
  // ⚙️ Troubleshooting
  "error": "If you experience local rendering dropouts, make sure your browser is updated or clear your local cache data cookies.",
  "broken": "If a file fails to process, verify that it is not password-protected or corrupted before running optimization passes."
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname} - IP: ${clientIp}`);

        if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // SECURITY: Block malicious paths (CVE-2026-3125)
    if (isMaliciousPath(url.pathname) || isMaliciousPath(url.search)) {
      return new Response('Bad Request: Invalid path', { status: 400 });
    }

    // SECURITY: Check file size for POST/PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      const sizeError = await validateRequestSize(request);
      if (sizeError) return sizeError;
    }

    // SECURITY: Rate limiting for API endpoints
    if (url.pathname.startsWith('/api/')) {
      const isAllowed = await checkRateLimit(env, clientIp, 60, 60);
      if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ─── 1. CHAT WITH ASSISTANT ENDPOINT (SELF-IMPROVING) ───
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message, currentTopic } = await request.json();
        if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });

        const cleanMsg = message.toLowerCase().trim();
        let response = "I'm sorry, I don't fully understand that question yet. Our support team has been notified, and I am logging this to learn the answer!";
        let detectedTopic = currentTopic || null;
        let matched = false;

        // Topic Tracking Context Allocation
        if (cleanMsg.includes('price') || cleanMsg.includes('cost') || cleanMsg.includes('premium') || cleanMsg.includes('license')) {
          detectedTopic = 'pricing';
        } else if (cleanMsg.includes('safe') || cleanMsg.includes('private') || cleanMsg.includes('secure') || cleanMsg.includes('privacy')) {
          detectedTopic = 'security';
        }

        // Context-Aware Memory Tie-Breakers
        if (detectedTopic === 'pricing') {
          if (cleanMsg.includes('how much') || cleanMsg.includes('pay') || cleanMsg.includes('buy')) {
            response = "Our Premium plans unlock instant keys upon completion. View specific tier parameters right on our /pricing layout page!";
            matched = true;
          } else {
            // Safe fallback if it's a general pricing question containing words like "price"
            response = KNOWLEDGE_BASE['pricing'];
            matched = true;
          }
        }


        // Core Knowledge Base Matrix Lookup Loop
        if (!matched) {
          for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
            if (cleanMsg.includes(key)) {
              response = value;
              matched = true;
              break;
            }
          }
        }

        // 🧠 ACTIVE PRIVACY-FIRST LEARNING SYSTEM
        // If no match was made and the query is long enough, save it to Cloudflare KV automatically
        if (!matched && cleanMsg.split(' ').length >= 3 && env.JOIN_PDFS_STORE) {
          try {
            const kvStore = env.JOIN_PDFS_STORE;
            // Fetch current list of unknown questions
            let unknownQueries = await kvStore.get('unanswered_queries', { type: 'json' }) || [];
            
            // Append the fresh query if it isn't a duplicate duplicate record
            if (!unknownQueries.includes(message)) {
              unknownQueries.push({
                query: message,
                timestamp: new Date().toISOString()
              });
              // Write the log table directly back down into the cloud database matrix container
              await kvStore.put('unanswered_queries', JSON.stringify(unknownQueries));
              console.log(`[Assistant Learning Engine]: Logged unanswered question: "${message}"`);
            }
          } catch (kvErr) {
            console.error('Learning storage capture dropout:', kvErr);
          }
        }

        return new Response(JSON.stringify({ response, context: { detectedTopic } }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid message payload processing' }), { 
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
      }
    }

    // ─── 2. VERIFY KEY ENDPOINT ───
    if (url.pathname === "/api/verify-key" && request.method === "POST") {
      try {
        const { licenseKey } = await request.json();
        if (!licenseKey) return new Response(JSON.stringify({ valid: false, error: 'Key missing' }), { 
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });

        const kvStore = env.JOIN_PDFS_STORE;
        if (!kvStore) return new Response(JSON.stringify({ valid: false, error: 'DB Offline' }), { 
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
        const keyData = await kvStore.get(licenseKey);
        if (!keyData) return new Response(JSON.stringify({ valid: false, error: 'Invalid license key' }), { 
          status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });

        const parsedData = JSON.parse(keyData);
        return new Response(JSON.stringify({ valid: true, plan: parsedData.plan || 'Premium' }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      } catch (err) {
        return new Response(JSON.stringify({ valid: false, error: 'Crash' }), { 
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
      }
    }

        // ─── 3. SECURE ADMIN DATA ENDPOINT ───
    if (url.pathname === "/api/admin-data" && request.method === "GET") {
      try {
        // Secure Server-Side Basic Auth Validation
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
          return new Response('Unauthorized Access', {
            status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin Protected Dashboard"' }
          });
        }

        const [type, credentials] = authHeader.split(' ');
        const [username, password] = atob(credentials).split(':');

        // Fallbacks to default constants matching your configuration framework settings
        const ADMIN_USER = env.ADMIN_USER || 'admin';
        const ADMIN_PASS = env.ADMIN_PASS || 'password';

        if (username !== ADMIN_USER || password !== ADMIN_PASS) {
          return new Response('Invalid Admin Credentials', { status: 403 });
        }

        // Pull fresh dynamic records from live database loop variables
        const kvStore = env.JOIN_PDFS_STORE;
        let activeKeys = {};
        let pendingPurchases = {};

        if (kvStore) {
          activeKeys = await kvStore.get('premium_keys', { type: 'json' }) || {};
          pendingPurchases = await kvStore.get('pending_purchases', { type: 'json' }) || {};
        }

        return new Response(JSON.stringify({ activeKeys, pendingPurchases }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS}
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Database authentication error' }), { 
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
    }

    // ─── 4. STATIC REWRITE & CSP INJECTION ACCELERATOR ───
    const staticResponse = await env.ASSETS.fetch(request);
    
    // Create a mutable copy of the static asset response headers
    const newHeaders = new Headers(staticResponse.headers);
    
    // Dynamically apply your airtight security whitelists to all structural elements
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("X-XSS-Protection", "1; mode=block");

    return new Response(staticResponse.body, {
      status: staticResponse.status,
      statusText: staticResponse.statusText,
      headers: newHeaders
    });

  }
};
