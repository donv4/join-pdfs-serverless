// PDF to PowerPoint Converter - Pure Client-Side with PDF.js and PptxGenJS
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF to PowerPoint converter loaded');
    
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const pdfFileInput = document.getElementById('pdfFile');
    const browseBtn = document.getElementById('browseBtn');
    const convertBtn = document.getElementById('convertBtn');
    const progressOverlay = document.getElementById('progressOverlay');
    const successOverlay = document.getElementById('successOverlay');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertAnotherBtn = document.getElementById('convertAnotherBtn');
    const successStats = document.getElementById('successStats');
    
    let selectedFile = null;
    let pdfArrayBuffer = null;
    
    // Check if libraries are loaded
    function areLibrariesReady() {
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js not loaded');
            return false;
        }
        if (typeof PptxGenJS === 'undefined') {
            console.error('PptxGenJS not loaded');
            return false;
        }
        return true;
    }
    
    // Wait for libraries with retry
    async function waitForLibraries() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (areLibrariesReady()) {
                console.log('Libraries ready');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        return false;
    }
    
    // File selection - single source to avoid double popup
    function openFileDialog() {
        pdfFileInput.click();
    }
    
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFileDialog();
        });
    }
    
    // Click on upload area background (not on button)
    if (uploadArea) {
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.classList.contains('upload-icon') || e.target.tagName === 'H3' || e.target.tagName === 'P') {
                openFileDialog();
            }
        });
    }
    
    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
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
                await handleFileSelection(file);
            } else {
                showNotification('Please drop a PDF file only', 'error');
            }
        });
    }
    
    async function handleFileSelection(file) {
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showNotification('File size exceeds 50MB limit', 'error');
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showNotification('Please select a PDF file', 'error');
            return;
        }
        
        selectedFile = file;
        
        try {
            pdfArrayBuffer = await file.arrayBuffer();
        } catch (err) {
            showNotification('Could not read file', 'error');
            return;
        }
        
        // Update UI
        uploadArea.innerHTML = `
            <i class="fas fa-file-pdf upload-icon" style="color: #e25555;"></i>
            <h3>${file.name}</h3>
            <p class="upload-hint">${formatFileSize(file.size)} • Ready to convert</p>
            <button class="btn-secondary" id="changeFileBtn" style="margin-top: 10px;">
                <i class="fas fa-exchange-alt"></i> Change File
            </button>
        `;
        
        const changeBtn = document.getElementById('changeFileBtn');
        if (changeBtn) {
            changeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                resetFileSelection();
            });
        }
        
        convertBtn.disabled = false;
        showNotification('PDF loaded successfully', 'success');
    }
    
    function resetFileSelection() {
        selectedFile = null;
        pdfArrayBuffer = null;
        uploadArea.innerHTML = `
            <i class="fas fa-file-powerpoint upload-icon"></i>
            <h3>Drop your PDF file here</h3>
            <p class="upload-hint">or click to browse your computer</p>
            <button class="browse-btn" id="browseBtn">
                <i class="fas fa-folder-open"></i> Choose PDF File
            </button>
            <p class="file-info">Maximum file size: 50MB • Converts to .pptx format</p>
        `;
        
        // Re-attach browse button listener
        const newBrowseBtn = document.getElementById('browseBtn');
        if (newBrowseBtn) {
            newBrowseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                pdfFileInput.click();
            });
        }
        
        convertBtn.disabled = true;
    }
    
    convertBtn.addEventListener('click', async () => {
        if (!pdfArrayBuffer) {
            showNotification('Please select a PDF file first', 'error');
            return;
        }
        
        showProgress('Loading libraries...');
        
        const librariesReady = await waitForLibraries();
        if (!librariesReady) {
            hideProgress();
            showNotification('Libraries failed to load. Please refresh the page.', 'error');
            return;
        }
        
        showProgress('Processing PDF pages...');
        progressFill.style.width = '10%';
        
        try {
            const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer.slice(0) });
            const pdfDoc = await loadingTask.promise;
            const numPages = pdfDoc.numPages;
            
            // Create PowerPoint presentation
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_WIDE';
            
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                progressText.textContent = `Processing page ${pageNum} of ${numPages}...`;
                progressFill.style.width = `${(pageNum / numPages) * 80}%`;
                
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                
                // Create canvas to render PDF page as image
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                // Get image data
                const imageData = canvas.toDataURL('image/png');
                
                // Add slide with image
                const slide = pptx.addSlide();
                slide.addImage({
                    data: imageData,
                    x: 0,
                    y: 0,
                    w: '100%',
                    h: '100%'
                });
            }
            
            progressFill.style.width = '95%';
            progressText.textContent = 'Creating PowerPoint file...';
            
            // Generate PowerPoint file
            const output = await pptx.write({ outputType: 'blob' });
            const downloadUrl = URL.createObjectURL(output);
            
            const outFilename = selectedFile.name.replace(/\.pdf$/i, '') + '_presentation.pptx';
            
            showSuccess({
                slides: numPages,
                filename: outFilename,
                downloadUrl: downloadUrl
            });
            
        } catch (error) {
            console.error('Conversion error:', error);
            hideProgress();
            showNotification('Error converting PDF: ' + error.message, 'error');
        }
    });
    
    function showProgress(message) {
        progressText.textContent = message;
        progressOverlay.style.display = 'flex';
        progressFill.style.width = '10%';
    }
    
    function hideProgress() {
        progressOverlay.style.display = 'none';
        progressFill.style.width = '0%';
    }
    
    function showSuccess(result) {
        progressFill.style.width = '100%';
        
        successStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Slides Created:</span>
                <strong class="stat-value">${result.slides}</strong>
            </div>
            <div class="stat-item">
                <span class="stat-label">Format:</span>
                <strong class="stat-value">PowerPoint (.pptx)</strong>
            </div>
        `;
        
        downloadBtn.href = result.downloadUrl;
        downloadBtn.download = result.filename;
        
        setTimeout(() => {
            progressOverlay.style.display = 'none';
            successOverlay.style.display = 'flex';
        }, 400);
    }
    
    convertAnotherBtn.addEventListener('click', () => {
        successOverlay.style.display = 'none';
        if (downloadBtn.href) {
            URL.revokeObjectURL(downloadBtn.href);
        }
        resetFileSelection();
    });
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : '#10b981'}; 
            color: white; padding: 12px 24px; border-radius: 8px;
            z-index: 9999; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.innerHTML = `${message} <button style="margin-left: 12px; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>`;
        document.body.appendChild(notification);
        
        notification.querySelector('button').addEventListener('click', () => notification.remove());
        setTimeout(() => notification.remove(), 4000);
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    convertBtn.disabled = true;
});