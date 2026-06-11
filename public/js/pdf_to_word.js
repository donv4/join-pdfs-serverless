// PDF to Word Converter - Fixed Path Setup
// Note: Since this version doesn't export an ES module, we load it dynamically or attach it to the window.
import 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js';

// Access the library via the global window fallback initialized by the script
const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];

// Configure the worker to match the exact same build path
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('PDF to Word converter loaded');
    
    // Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const convertBtn = document.getElementById('convertBtn');
    const progressOverlay = document.getElementById('progressOverlay');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultSection = document.getElementById('resultSection');
    const downloadBtn = document.getElementById('downloadBtn');
    const newConvertBtn = document.getElementById('newConvertBtn');
    
    let currentFile = null;
    let pdfDoc = null;
    let currentDownloadUrl = null;
    
    // Safety check
    if (!browseBtn) {
        console.error('Browse button not found');
        return;
    }
    
    // File selection - make sure button works
    browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Also allow clicking on the upload zone background
    if (uploadZone) {
        uploadZone.addEventListener('click', (e) => {
            // Don't trigger if clicking the button
            if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
                fileInput.click();
            }
        });
    }
    
    // Drag and drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                await handleFileSelect(file);
            } else {
                alert('Please drop a PDF file only.');
            }
        });
    }

    // Set up action triggers
    if (convertBtn) {
        convertBtn.addEventListener('click', convertToWord);
    }

    if (newConvertBtn) {
        newConvertBtn.addEventListener('click', resetConverter);
    }
    
    async function handleFileSelect(file) {
        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB');
            return;
        }
        
        currentFile = file;
        
        fileName.textContent = 'Loading PDF...';
        fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        fileInfo.style.display = 'block';
        if (resultSection) resultSection.style.display = 'none';
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdfDoc = await loadingTask.promise;
            
            fileName.textContent = file.name;
            console.log(`PDF loaded: ${pdfDoc.numPages} pages`);
            convertBtn.disabled = false;
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF file. Please ensure it\'s a valid PDF.');
            fileInfo.style.display = 'none';
            currentFile = null;
            pdfDoc = null;
            convertBtn.disabled = true;
        }
    }
    
    async function extractTextFromPDF() {
        if (!pdfDoc) {
            throw new Error('No PDF document loaded');
        }
        
        let fullText = '';
        const numPages = pdfDoc.numPages;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            if (progressText && progressFill) {
                progressText.textContent = `Extracting text from page ${pageNum} of ${numPages}...`;
                progressFill.style.width = `${(pageNum / numPages) * 70}%`;
            }
            
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Reconstruct lines using item mapping
            let lastY = null;
            let pageText = '';
            
            for (const item of textContent.items) {
                // Introduce structural breaks if element heights shift down substantially
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
            }
            
            fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return fullText;
    }
    
    function createWordDocument(text, originalFileName) {
        // Syntax Fix: Fixed the broken quote escape pattern below
        const escapedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        const wordHtml = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${originalFileName.replace('.pdf', '')}</title>
            <style>
                body {
                    font-family: Calibri, Arial, sans-serif;
                    line-height: 1.6;
                    margin: 2.54cm;
                    font-size: 12pt;
                }
                pre {
                    white-space: pre-wrap;
                    font-family: Calibri, Arial, sans-serif;
                    font-size: 12pt;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <h1>Converted from: ${originalFileName}</h1>
            <hr>
            <pre>${escapedText}</pre>
            <p style="margin-top: 40px; font-size: 10pt; color: #666;">
                Converted by Join-PDFs.com
            </p>
        </body>
        </html>`;
        
        const blob = new Blob([wordHtml], { type: 'application/msword' });
        
        // Revoke the old object URL if one exists to prevent browser memory leaks
        if (currentDownloadUrl) {
            URL.revokeObjectURL(currentDownloadUrl);
        }
        
        currentDownloadUrl = URL.createObjectURL(blob);
        return currentDownloadUrl;
    }
    
    async function convertToWord() {
        if (!pdfDoc) {
            alert('Please select a valid PDF file first.');
            return;
        }
        
        if (progressOverlay) {
            progressOverlay.style.display = 'flex';
            if (progressText) progressText.textContent = 'Preparing conversion...';
            if (progressFill) progressFill.style.width = '10%';
        }
        
        try {
            const extractedText = await extractTextFromPDF();
            
            if (progressFill && progressText) {
                progressFill.style.width = '85%';
                progressText.textContent = 'Creating Word document...';
            }
            
            const downloadUrl = createWordDocument(extractedText, currentFile.name);
            
            if (progressFill && progressText) {
                progressFill.style.width = '100%';
                progressText.textContent = 'Conversion complete!';
            }
            
            setTimeout(() => {
                if (progressOverlay) progressOverlay.style.display = 'none';
                if (resultSection) resultSection.style.display = 'block';
                if (downloadBtn) {
                    downloadBtn.href = downloadUrl;
                    downloadBtn.download = currentFile.name.replace(/\.pdf$/i, '.doc');
                }
                if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
        } catch (error) {
            console.error('Conversion error:', error);
            if (progressOverlay) progressOverlay.style.display = 'none';
            alert('Error converting PDF: ' + error.message);
        }
    }

    function resetConverter() {
        currentFile = null;
        pdfDoc = null;
        if (fileInput) fileInput.value = '';
        if (fileInfo) fileInfo.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';
        if (convertBtn) convertBtn.disabled = true;
        if (currentDownloadUrl) {
            URL.revokeObjectURL(currentDownloadUrl);
            currentDownloadUrl = null;
        }
        if (uploadZone) uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
