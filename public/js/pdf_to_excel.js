// public/js/pdf_to_excel.js - SERVERLESS HYBRID BROWSER CLIENT
document.addEventListener('DOMContentLoaded', function() {
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

    // Load parsing dependencies dynamically to keep the site lightweight on boot
    function loadLibraries() {
        if (!window.pdfjsLib) {
            const script1 = document.createElement('script');
            script1.src = 'https://cloudflare.com';
            document.head.appendChild(script1);
            script1.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cloudflare.com';
            };
        }
        if (!window.XLSX) {
            const script2 = document.createElement('script');
            script2.src = 'https://jsdelivr.net';
            document.head.appendChild(script2);
        }
    }
    loadLibraries();
    
    // ===== FILE SELECTION =====
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pdfFileInput.click();
        });
    }
    
    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                handleFileSelection(file);
            } else {
                showNotification('Please select a valid PDF file archive', 'error');
            }
        }
    });
    
    uploadArea.addEventListener('click', () => {
        pdfFileInput.click();
    });
    
    // ===== FILE HANDLING =====
    async function handleFileSelection(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showNotification('File size exceeds 50MB execution limit', 'error');
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showNotification('Please provide a PDF file', 'error');
            return;
        }
        
        selectedFile = file;
        try {
            pdfArrayBuffer = await file.arrayBuffer();
        } catch (err) {
            showNotification('Could not safely buffer local file.', 'error');
            return;
        }
        
        uploadArea.innerHTML = `
            <i class="fas fa-file-pdf upload-icon" style="color: #e25555;"></i>
            <h3>${file.name}</h3>
            <p class="upload-hint">${formatFileSize(file.size)} • Ready to extract</p>
            <button class="btn-secondary" id="changeFileBtn" style="margin-top: 10px; padding: 6px 12px; border-radius: 4px; border: 1px solid #ccc; background: white;">
                <i class="fas fa-exchange-alt"></i> Change File
            </button>
        `;
        
        setTimeout(() => {
            const changeBtn = document.getElementById('changeFileBtn');
            if (changeBtn) {
                changeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    resetFileSelection();
                });
            }
        }, 100);
        
        convertBtn.disabled = false;
        showNotification('PDF file loaded and ready for spreadsheet generation', 'success');
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
        
        setTimeout(() => {
            const bBtn = document.getElementById('browseBtn');
            if (bBtn) {
                bBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pdfFileInput.click();
                });
            }
        }, 100);
        
        convertBtn.disabled = true;
    }
    
    // ===== BROWSER-BASED GRID CONVERSION ENGINE =====
    convertBtn.addEventListener('click', async () => {
        if (!pdfArrayBuffer) {
            showNotification('Please select a PDF file first', 'error');
            return;
        }
        
        showProgress('Extracting rows and text metrics from document coordinates...');
        simulateProgress();
        
        try {
            // Load buffered PDF into local runtime context memory
            const loadingTask = window.pdfjsLib.getDocument({ data: pdfArrayBuffer });
            const pdfDoc = await loadingTask.promise;
            
            // Core SheetJS workbook container node
            const workbook = XLSX.utils.book_new();
            let tablesExtractedCount = 0;

            // Iterate across pages to extract textual matrices dynamically
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                if (textContent.items.length === 0) continue;

                // Group words sharing horizontal Y-coordinate values into uniform rows
                const rowsMap = {};
                textContent.items.forEach(item => {
                    // Extract spatial coordinates matrix transformations [x, y, w, h]
                    const yCoord = Math.round(item.transform[5]); 
                    if (!rowsMap[yCoord]) rowsMap[yCoord] = [];
                    rowsMap[yCoord].push(item);
                });

                // Sort row arrays downward sequentially across the layout canvas
                const sortedYCoords = Object.keys(rowsMap).sort((a, b) => b - a);
                const sheetData = [];

                sortedYCoords.forEach(y => {
                    // Sort items horizontally left-to-right along the active row vector line
                    const lineItems = rowsMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
                    const rowValues = lineItems.map(item => item.str.trim()).filter(str => str !== '');
                    if (rowValues.length > 0) {
                        sheetData.push(rowValues);
                    }
                });

                if (sheetData.length > 0) {
                    // Convert raw row text metrics cleanly into an official SheetJS worksheet grid
                    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum} Table`);
                    tablesExtractedCount++;
                }
            }

            if (tablesExtractedCount === 0) {
                // Generate a baseline safe fallback grid if no structured lines match character metrics
                const fallbackSheet = XLSX.utils.aoa_to_sheet([["No clear table rows detected on document vectors."]]);
                XLSX.utils.book_append_sheet(workbook, fallbackSheet, "Extraction Sheet");
            }

            // Write spreadsheet parameters straight into local binary system memory channels
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Create localized download uri string
            const outFilename = selectedFile.name.replace(/\.[^/.]+$/, "") + "_extracted_tables.xlsx";
            downloadBtn.href = URL.createObjectURL(excelBlob);
            downloadBtn.download = outFilename;

            showSuccess({
                tables_found: tablesExtractedCount || 1,
                filename: outFilename
            });
            
        } catch (error) {
            hideProgress();
            showNotification('Processing exception errored out during data extraction calculations.', 'error');
            console.error(error);
        }
    });
    
    // ===== PROGRESS CONTROLS =====
    function showProgress(message) {
        progressText.textContent = message;
        progressOverlay.style.display = 'flex';
        progressFill.style.width = '15%';
    }
    
    function simulateProgress() {
        let progress = 15;
        const interval = setInterval(() => {
            progress += 8;
            progressFill.style.width = progress + '%';
            if (progress >= 90) clearInterval(interval);
        }, 200);
    }
    
    function hideProgress() {
        progressOverlay.style.display = 'none';
        progressFill.style.width = '0%';
    }
    
    // ===== SUCCESS OVERLAY REDIRECTS =====
    function showSuccess(result) {
        progressFill.style.width = '100%';
        successStats.innerHTML = `
            <div class="stat-item" style="margin-bottom: 10px; font-size: 15px;">
                <span class="stat-label" style="color: #666; margin-right: 5px;">Sheets Created:</span>
                <strong class="stat-value" style="color: #2ecc71;">${result.tables_found}</strong>
            </div>
            <div class="stat-item" style="font-size: 15px;">
                <span class="stat-label" style="color: #666; margin-right: 5px;">Output Format:</span>
                <strong class="stat-value" style="color: #4a6cf7;">Excel Workbook (.xlsx)</strong>
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
    });
    
    // ===== TOASTER NOTIFICATIONS WORKSPACE =====
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : '#10b981'}; color: white;
            padding: 12px 24px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 999999; font-weight: 600; display: flex; align-items: center; gap: 10px;
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" style="background:transparent; border:none; color:white; font-weight:bold; cursor:pointer;">×</button>
        `;
        
        document.body.appendChild(notification);
        notification.querySelector('.notification-close').addEventListener('click', () => notification.remove());
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 4000);
    }
    
    function formatFileSize(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + " MB";
    }
    
    convertBtn.disabled = true;
});
