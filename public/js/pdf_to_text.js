// PDF to Text Converter - Pure Client-Side with PDF.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF to Text converter loaded - client-side mode');
    
    // Elements
    const uploadArea = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const actionButtons = document.getElementById('actionButtons');
    const fileInfo = document.getElementById('fileInfoSection');
    const fileName = document.getElementById('fileNameDisplay');
    const fileSize = document.getElementById('fileSizeDisplay');
    const convertBtn = document.getElementById('extractBtn');
    const cancelBtn = document.getElementById('clearBtn');
    const progressOverlay = document.getElementById('progressOverlay');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultSection = document.getElementById('successOverlay');
    const textPreview = document.getElementById('textPreview');
    const pageCount = document.getElementById('pageCount');
    const charCount = document.getElementById('textLength');
    const resultSize = document.getElementById('successSize');
    const extractStats = document.getElementById('extractStats');
    const successPages = document.getElementById('successPages');
    const successChars = document.getElementById('successChars');
    const downloadBtn = document.getElementById('downloadBtn');
    const newFileBtn = document.getElementById('newExtractBtn');
    const preserveFormattingCheckbox = document.getElementById('preserveFormatting');
    const addPageNumbersCheckbox = document.getElementById('addPageNumbers');
    
    let currentFile = null;
    let pdfDoc = null;
    let extractedText = '';
    
    // Check if PDF.js is loaded
    function isPDFjsLoaded() {
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js not loaded');
            return false;
        }
        return true;
    }
    
    // File selection - single source to avoid double popup
    function openFileDialog() {
        fileInput.click();
    }
    
    // Use the existing browse button from the DOM
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFileDialog();
        });
    }
    
    // Click on upload area background
    if (uploadArea) {
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.classList.contains('upload-icon') || e.target.tagName === 'H3' || e.target.tagName === 'P') {
                openFileDialog();
            }
        });
    }
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                await handleFileSelect(file);
            } else {
                showNotification('Please drop a PDF file only', 'error');
            }
        });
    }
    
    async function handleFileSelect(file) {
        if (file.type !== 'application/pdf') {
            showNotification('Please select a PDF file', 'error');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            showNotification('File size must be less than 50MB', 'error');
            return;
        }
        
        currentFile = file;
        
        // Update UI
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        if (actionButtons) actionButtons.style.display = 'flex';
        if (fileInfo) fileInfo.style.display = 'block';
        if (extractStats) extractStats.style.display = 'block';
        
        // Load PDF to get page count
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdfDoc = await loadingTask.promise;
            
            if (pageCount) pageCount.textContent = pdfDoc.numPages;
            showNotification(`PDF loaded: ${pdfDoc.numPages} pages. Click "Extract Text" to continue.`, 'success');
        } catch (error) {
            console.error('Error loading PDF:', error);
            showNotification('Error loading PDF file. Please ensure it\'s a valid PDF.', 'error');
        }
    }
    
    async function extractTextFromPDF() {
        if (!pdfDoc) {
            throw new Error('No PDF document loaded');
        }
        
        let fullText = '';
        const numPages = pdfDoc.numPages;
        const preserveFormatting = preserveFormattingCheckbox ? preserveFormattingCheckbox.checked : true;
        const addPageNumbers = addPageNumbersCheckbox ? addPageNumbersCheckbox.checked : true;
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            if (progressText) {
                progressText.textContent = `Extracting text from page ${pageNum} of ${numPages}...`;
                progressFill.style.width = `${(pageNum / numPages) * 90}%`;
            }
            
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            let pageText = textContent.items.map(item => item.str).join(preserveFormatting ? ' ' : '');
            
            // Clean up excessive spaces
            pageText = pageText.replace(/\s+/g, ' ').trim();
            
            if (addPageNumbers) {
                fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
            } else {
                fullText += pageText + '\n\n';
            }
            
            // Small delay to prevent UI freezing
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return fullText;
    }
    
    // Extract button
    if (convertBtn) {
        convertBtn.addEventListener('click', async function() {
            if (!pdfDoc) {
                showNotification('Please select a valid PDF file first', 'error');
                return;
            }
            
            if (!isPDFjsLoaded()) {
                showNotification('PDF library still loading. Please wait and try again.', 'error');
                return;
            }
            
            // Show progress
            progressOverlay.style.display = 'flex';
            progressText.textContent = 'Preparing extraction...';
            progressFill.style.width = '10%';
            
            try {
                extractedText = await extractTextFromPDF();
                
                progressFill.style.width = '95%';
                progressText.textContent = 'Creating text file...';
                
                // Update character count
                const charCountValue = extractedText.length;
                if (charCount) charCount.textContent = charCountValue.toLocaleString();
                
                // Show results
                showResults({
                    page_count: pdfDoc.numPages,
                    char_count: charCountValue,
                    text: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : ''),
                    full_text: extractedText,
                    filename: currentFile.name.replace(/\.pdf$/i, '') + '_extracted.txt',
                    file_size_kb: Math.round(extractedText.length / 1024)
                });
                
            } catch (error) {
                console.error('Extraction error:', error);
                progressOverlay.style.display = 'none';
                showNotification('Error extracting text: ' + error.message, 'error');
            }
        });
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            resetUI();
        });
    }
    
    function showResults(result) {
        console.log("Show results called");
        
        progressFill.style.width = '100%';
        progressText.textContent = 'Complete!';
        
        // Update success overlay stats
        if (successPages) successPages.textContent = result.page_count || '0';
        if (successChars) successChars.textContent = result.char_count?.toLocaleString() || '0';
        if (resultSize) resultSize.textContent = result.file_size_kb ? result.file_size_kb + ' KB' : 'N/A';
        
        // Show preview
        if (textPreview) {
            textPreview.textContent = result.text || 'No text extracted';
        }
        
        // Set up download button
        if (downloadBtn) {
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                const blob = new Blob([result.full_text || extractedText], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename || 'extracted_text.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotification('Text downloaded!', 'success');
            };
        }
        
        // Hide progress and show results
        setTimeout(() => {
            progressOverlay.style.display = 'none';
            if (resultSection) resultSection.style.display = 'block';
            if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
        
        showNotification('Text extraction successful! Click Download to save.', 'success');
    }
    
    // New file button
    if (newFileBtn) {
        newFileBtn.addEventListener('click', resetUI);
    }
    
    function resetUI() {
        currentFile = null;
        pdfDoc = null;
        extractedText = '';
        fileInput.value = '';
        if (actionButtons) actionButtons.style.display = 'none';
        if (fileInfo) fileInfo.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';
        if (extractStats) extractStats.style.display = 'none';
        if (textPreview) textPreview.textContent = '';
        if (pageCount) pageCount.textContent = '0';
        if (charCount) charCount.textContent = '0';
        if (fileName) fileName.textContent = '---';
        if (fileSize) fileSize.textContent = '---';
        
        showNotification('Ready for new file', 'info');
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#4a6cf7'}; 
            color: white; padding: 12px 24px; border-radius: 8px;
            z-index: 9999; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.innerHTML = `${message} <button style="margin-left: 12px; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>`;
        document.body.appendChild(notification);
        
        notification.querySelector('button').addEventListener('click', () => notification.remove());
        setTimeout(() => notification.remove(), 4000);
    }
});