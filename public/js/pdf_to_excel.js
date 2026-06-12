// PDF to Excel Converter - Client-side with PDF.js and SheetJS
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF to Excel converter loaded');
    
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
    
    // Wait for libraries to be ready with retry
    async function waitForLibraries() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (typeof pdfjsLib !== 'undefined' && typeof XLSX !== 'undefined') {
                console.log('Libraries loaded successfully');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.error('Libraries failed to load:', {
            pdfjs: typeof pdfjsLib,
            xlsx: typeof XLSX
        });
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
        
        // Update UI to show selected file
        uploadArea.innerHTML = `
            <i class="fas fa-file-pdf upload-icon" style="color: #e25555;"></i>
            <h3>${file.name}</h3>
            <p class="upload-hint">${formatFileSize(file.size)} • Ready to extract</p>
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
            <i class="fas fa-file-excel upload-icon"></i>
            <h3>Drop your PDF file here</h3>
            <p class="upload-hint">or click to browse your computer</p>
            <button class="browse-btn" id="browseBtn">
                <i class="fas fa-folder-open"></i> Choose PDF File
            </button>
            <p class="file-info">Maximum file size: 50MB • Extracts tables to .xlsx format</p>
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
        
        // Show progress while waiting for libraries
        showProgress('Loading libraries...');
        
        const librariesReady = await waitForLibraries();
        if (!librariesReady) {
            hideProgress();
            showNotification('Libraries failed to load. Please refresh the page and try again.', 'error');
            return;
        }
        
        showProgress('Extracting tables from PDF...');
        
        try {
            const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer.slice(0) });
            const pdfDoc = await loadingTask.promise;
            
            const workbook = XLSX.utils.book_new();
            let tablesExtractedCount = 0;
            
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                progressText.textContent = `Processing page ${pageNum} of ${pdfDoc.numPages}...`;
                progressFill.style.width = `${(pageNum / pdfDoc.numPages) * 70}%`;
                
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                if (textContent.items.length === 0) continue;
                
                // Group text items by Y coordinate (rows)
                const rowsMap = {};
                textContent.items.forEach(item => {
                    const yCoord = Math.round(item.transform[5]);
                    if (!rowsMap[yCoord]) rowsMap[yCoord] = [];
                    rowsMap[yCoord].push(item);
                });
                
                const sortedYCoords = Object.keys(rowsMap).sort((a, b) => b - a);
                const sheetData = [];
                
                sortedYCoords.forEach(y => {
                    const lineItems = rowsMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
                    const rowValues = lineItems.map(item => item.str.trim()).filter(str => str !== '');
                    if (rowValues.length > 0) {
                        sheetData.push(rowValues);
                    }
                });
                
                if (sheetData.length > 0) {
                    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum}`);
                    tablesExtractedCount++;
                }
            }
            
            if (tablesExtractedCount === 0) {
                const fallbackSheet = XLSX.utils.aoa_to_sheet([["No table data detected in this PDF"]]);
                XLSX.utils.book_append_sheet(workbook, fallbackSheet, "Extraction Result");
            }
            
            progressFill.style.width = '90%';
            progressText.textContent = 'Creating Excel file...';
            
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const outFilename = selectedFile.name.replace(/\.pdf$/i, '') + '_extracted.xlsx';
            const downloadUrl = URL.createObjectURL(excelBlob);
            downloadBtn.href = downloadUrl;
            downloadBtn.download = outFilename;
            
            showSuccess({
                tables_found: tablesExtractedCount,
                filename: outFilename
            });
            
        } catch (error) {
            console.error('Conversion error:', error);
            hideProgress();
            showNotification('Error extracting tables: ' + error.message, 'error');
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
                <span class="stat-label">Pages Processed:</span>
                <strong class="stat-value">${result.tables_found}</strong>
            </div>
            <div class="stat-item">
                <span class="stat-label">Output Format:</span>
                <strong class="stat-value">Excel (.xlsx)</strong>
            </div>
        `;
        
        setTimeout(() => {
            progressOverlay.style.display = 'none';
            successOverlay.style.display = 'flex';
        }, 400);
    }
    
    convertAnotherBtn.addEventListener('click', () => {
        successOverlay.style.display = 'none';
        resetFileSelection();
        if (downloadBtn.href) {
            URL.revokeObjectURL(downloadBtn.href);
        }
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
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }
    
    convertBtn.disabled = true;
});