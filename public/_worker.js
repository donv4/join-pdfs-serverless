// public/_worker.js - EXPANDED SELF-LEARNING CORE ROUTER
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
        if (detectedTopic === 'pricing' && (cleanMsg.includes('how much') || cleanMsg.includes('pay') || cleanMsg.includes('buy'))) {
          response = "Our Premium plans unlock instant keys upon completion. View specific tier parameters right on our /pricing layout page!";
          matched = true;
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
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid message payload processing' }), { status: 500 });
      }
    }

    // ─── 2. VERIFY KEY ENDPOINT ───
    if (url.pathname === "/api/verify-key" && request.method === "POST") {
      try {
        const { licenseKey } = await request.json();
        if (!licenseKey) return new Response(JSON.stringify({ valid: false, error: 'Key missing' }), { status: 400 });

        const kvStore = env.JOIN_PDFS_STORE;
        if (!kvStore) return new Response(JSON.stringify({ valid: false, error: 'DB Offline' }), { status: 500 });

        const keyData = await kvStore.get(licenseKey);
        if (!keyData) return new Response(JSON.stringify({ valid: false, error: 'Invalid license key' }), { status: 404 });

        const parsedData = JSON.parse(keyData);
        return new Response(JSON.stringify({ valid: true, plan: parsedData.plan || 'Premium' }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ valid: false, error: 'Crash' }), { status: 500 });
      }
    }

    // ─── 3. STATIC FILES REWRITE ACCELERATOR ───
    return env.ASSETS.fetch(request);
  }
};
