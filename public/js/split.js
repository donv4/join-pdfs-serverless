// public/js/split.js - Simplified version
class PDFSplitter {
    constructor() {
        this.currentFile = null;
        this.totalPageCount = 0;
        this.selectedPages = new Set();
        this.currentMethod = 'range';
        this.ranges = [];
        this.pdfDataUri = null;
        this.isProcessingFile = false;

        this.initializeElements();
        this.setupEventListeners();
        this.initializePagePreviews();
        
        // Check if libraries are available
        this.checkLibraries();
    }

    checkLibraries() {
        // Wait for libraries to be available (they should load from HTML)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const interval = setInterval(() => {
            attempts++;
            
            if (window.pdfjsLib && window.PDFLib && window.JSZip) {
                // Set worker
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
                clearInterval(interval);
                console.log('✅ Libraries ready');
                this.librariesReady = true;
                
                // Enable any pending UI
                if (this.pendingFile) {
                    this.processSelectedFile(this.pendingFile);
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error('Libraries failed to load');
                alert('Failed to load PDF libraries. Please check your internet connection and refresh the page.');
            }
        }, 100);
    }

    initializeElements() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.splitOptions = document.getElementById('splitOptions');
        this.actionButtons = document.querySelector('.action-buttons');

        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.totalPages = document.getElementById('totalPages');
        this.pageCountElement = document.getElementById('pageCount');

        this.splitMethods = document.querySelectorAll('.split-method');
        this.rangesList = document.getElementById('rangesList');
        this.addRangeBtn = document.getElementById('addRangeBtn');
        this.fromPageInput = document.getElementById('fromPage');
        this.toPageInput = document.getElementById('toPage');

        this.pagesGrid = document.getElementById('pagesGrid');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.clearSelectionBtn = document.getElementById('clearSelectionBtn');

        this.selectionPreview = document.getElementById('selectionPreview');
        this.selectedCount = document.getElementById('selectedCount');
        this.selectedPagesList = document.getElementById('selectedPagesList');
        this.filesCount = document.getElementById('filesCount');

        this.clearBtn = document.getElementById('clearBtn');
        this.processSplitBtn = document.getElementById('processSplitBtn');

        this.progressOverlay = document.getElementById('progressOverlay');
        this.successOverlay = document.getElementById('successOverlay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');

        this.filesCreated = document.getElementById('filesCreated');
        this.totalPagesProcessed = document.getElementById('totalPagesProcessed');
        this.downloadLink = document.getElementById('downloadLink');
        this.newSplitBtn = document.getElementById('newSplitBtn');
    }

    setupEventListeners() {
        if (this.fileInput) this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        if (this.browseBtn) this.browseBtn.addEventListener('click', () => this.fileInput.click());

        if (this.uploadZone) {
            this.uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadZone.classList.add('dragover');
            });
            this.uploadZone.addEventListener('dragleave', () => {
                this.uploadZone.classList.remove('dragover');
            });
            this.uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadZone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    this.fileInput.files = e.dataTransfer.files;
                    this.handleFileSelect({ target: { files: e.dataTransfer.files } });
                }
            });
        }

        this.splitMethods.forEach(method => {
            method.addEventListener('click', () => this.setActiveMethod(method.dataset.method));
        });

        if (this.addRangeBtn) this.addRangeBtn.addEventListener('click', () => this.addRange());
        if (this.fromPageInput) this.fromPageInput.addEventListener('input', () => this.updateCurrentRange());
        if (this.toPageInput) this.toPageInput.addEventListener('input', () => this.updateCurrentRange());

        if (this.selectAllBtn) this.selectAllBtn.addEventListener('click', () => this.selectAllPages());
        if (this.clearSelectionBtn) this.clearSelectionBtn.addEventListener('click', () => this.clearAllPages());

        if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.resetUI());
        if (this.processSplitBtn) this.processSplitBtn.addEventListener('click', () => this.splitPDF());
        if (this.newSplitBtn) this.newSplitBtn.addEventListener('click', () => this.resetUI());
    }

    initializePagePreviews() {
        if (this.rangesList) this.rangesList.innerHTML = '';
    }

    async handleFileSelect(event) {
        if (this.isProcessingFile) return;
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a valid PDF file.');
            return;
        }

        this.currentFile = file;
        if (this.fileName) this.fileName.textContent = file.name;
        if (this.fileSize) this.fileSize.textContent = this.formatFileSize(file.size);

        if (!window.pdfjsLib || !window.PDFLib || !window.JSZip) {
            this.showProgress('Loading Libraries...', 'Please wait...');
            this.pendingFile = file;
            return;
        }
        
        await this.processSelectedFile();
    }

    async processSelectedFile() {
        if (!this.currentFile) return;
        
        this.isProcessingFile = true;
        this.showProgress('Reading PDF...', 'Parsing page matrices locally...');

        try {
            const arrayBuffer = await this.currentFile.arrayBuffer();
            this.pdfDataUri = arrayBuffer;

            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDoc = await loadingTask.promise;
            
            this.totalPageCount = pdfDoc.numPages;

            const statsBar = document.getElementById('statsBar');
            if (statsBar) statsBar.style.display = 'flex';
            if (this.totalPages) this.totalPages.textContent = this.totalPageCount;
            if (this.pageCountElement) this.pageCountElement.textContent = `${this.totalPageCount} pages`;

            if (this.fromPageInput) {
                this.fromPageInput.max = this.totalPageCount;
                this.fromPageInput.value = 1;
            }
            if (this.toPageInput) {
                this.toPageInput.max = this.totalPageCount;
                this.toPageInput.value = this.totalPageCount;
            }

            if (this.splitOptions) this.splitOptions.style.display = 'block';
            if (this.clearBtn) this.clearBtn.disabled = false;
            if (this.processSplitBtn) this.processSplitBtn.disabled = false;

            this.initializePages();
            this.hideProgress();
            this.pendingFile = null;
        } catch (error) {
            this.hideProgress();
            console.error('PDF loading error:', error);
            alert(`Could not open the PDF document: ${error.message}`);
        } finally {
            this.isProcessingFile = false;
        }
    }

    initializePages() {
        if (!this.pagesGrid) return;
        
        this.pagesGrid.innerHTML = '';
        this.selectedPages.clear();

        for (let i = 1; i <= this.totalPageCount; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-checkbox';
            pageDiv.style.cssText = 'display: inline-block; margin: 5px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
            pageDiv.innerHTML = `
                <input type="checkbox" id="page-${i}" value="${i}" style="margin-right: 5px;" />
                <label for="page-${i}">Page ${i}</label>
            `;
            
            const checkbox = pageDiv.querySelector('input');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) this.selectedPages.add(i);
                else this.selectedPages.delete(i);
                this.updateSelectionPreview();
            });
            this.pagesGrid.appendChild(pageDiv);
        }
        
        this.updateSelectionPreview();
    }

    selectAllPages() {
        this.selectedPages.clear();
        for (let i = 1; i <= this.totalPageCount; i++) {
            this.selectedPages.add(i);
            const box = document.getElementById(`page-${i}`);
            if (box) box.checked = true;
        }
        this.updateSelectionPreview();
    }

    clearAllPages() {
        this.selectedPages.clear();
        for (let i = 1; i <= this.totalPageCount; i++) {
            const box = document.getElementById(`page-${i}`);
            if (box) box.checked = false;
        }
        this.updateSelectionPreview();
    }

    setActiveMethod(method) {
        this.currentMethod = method;
        this.splitMethods.forEach(m => {
            if (m.dataset.method === method) {
                m.classList.add('active');
            } else {
                m.classList.remove('active');
            }
        });

        const rangeSettings = document.getElementById('rangeSettings');
        const customSelectionSettings = document.getElementById('customSelectionSettings');

        if (method === 'range') {
            if (rangeSettings) rangeSettings.style.display = 'block';
            if (customSelectionSettings) customSelectionSettings.style.display = 'none';
        } else {
            if (rangeSettings) rangeSettings.style.display = 'none';
            if (customSelectionSettings) customSelectionSettings.style.display = 'block';
        }

        this.updateSelectionPreview();
    }

    addRange() {
        const from = parseInt(this.fromPageInput.value);
        const to = parseInt(this.toPageInput.value);

        if (isNaN(from) || isNaN(to) || from < 1 || to < from || to > this.totalPageCount) {
            alert(`Please enter a valid page range sequence between 1 and ${this.totalPageCount}.`);
            return;
        }

        const rangeText = `Pages ${from}-${to}`;
        const existingRanges = Array.from(this.rangesList.querySelectorAll('.range-item span')).map(s => s.textContent);
        if (existingRanges.includes(rangeText)) return;

        const item = document.createElement('div');
        item.className = 'range-item';
        item.style.cssText = 'background: #f1f5f9; padding: 8px; margin: 4px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px;';
        item.innerHTML = `
            <span>Pages ${from}-${to}</span>
            <button type="button" class="remove-range-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold; padding: 0 4px;">&times;</button>
        `;

        item.querySelector('.remove-range-btn').addEventListener('click', () => {
            item.remove();
            this.recalculateRangeSelection();
        });

        this.rangesList.appendChild(item);

        for (let i = from; i <= to; i++) {
            this.selectedPages.add(i);
            const box = document.getElementById(`page-${i}`);
            if (box) box.checked = true;
        }
        this.updateSelectionPreview();
    }

    recalculateRangeSelection() {
        this.selectedPages.clear();
        
        for (let i = 1; i <= this.totalPageCount; i++) {
            const box = document.getElementById(`page-${i}`);
            if (box) box.checked = false;
        }

        const rangeItems = this.rangesList.querySelectorAll('.range-item span');
        rangeItems.forEach(item => {
            const text = item.textContent.replace('Pages ', '');
            const [from, to] = text.split('-').map(n => parseInt(n));
            for (let i = from; i <= to; i++) {
                this.selectedPages.add(i);
                const box = document.getElementById(`page-${i}`);
                if (box) box.checked = true;
            }
        });

        this.updateSelectionPreview();
    }

    updateCurrentRange() {
        let from = parseInt(this.fromPageInput.value);
        let to = parseInt(this.toPageInput.value);
        if (isNaN(from)) from = 1;
        if (isNaN(to)) to = this.totalPageCount;
        if (from < 1) this.fromPageInput.value = 1;
        if (to > this.totalPageCount) this.toPageInput.value = this.totalPageCount;
    }

    updateSelectionPreview() {
        if (!this.selectionPreview) return;
        
        const outputCount = this.currentMethod === 'single' ? this.selectedPages.size : this.rangesList.children.length;

        if (outputCount === 0 && this.selectedPages.size === 0) {
            this.selectionPreview.style.display = 'none';
            return;
        }
        
        if (this.selectedCount) this.selectedCount.textContent = `${this.selectedPages.size} pages selected`;
        if (this.selectedPagesList) this.selectedPagesList.textContent = Array.from(this.selectedPages).sort((a,b)=>a-b).join(', ');
        if (this.filesCount) this.filesCount.textContent = outputCount;
        this.selectionPreview.style.display = 'block';
    }

    async splitPDF() {
        if (!this.pdfDataUri) return;
        
        if (!window.PDFLib || !window.JSZip) {
            alert('Libraries are still loading, please wait a moment and try again.');
            return;
        }

        this.showProgress('Processing...', 'Assembling file arrays locally...');

        try {
            const srcPdfDoc = await window.PDFLib.PDFDocument.load(this.pdfDataUri);
            const zip = new window.JSZip();
            let fileCounter = 0;

            if (this.currentMethod === 'single') {
                const pages = Array.from(this.selectedPages).sort((a,b)=>a-b);
                if (pages.length === 0) {
                    alert('Please select at least one page to extract.');
                    this.hideProgress();
                    return;
                }
                for (const pageNum of pages) {
                    const newPdf = await window.PDFLib.PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(srcPdfDoc, [pageNum - 1]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();
                    zip.file(`extracted-page-${pageNum}.pdf`, pdfBytes);
                    fileCounter++;
                }
            } else {
                const rangeItems = this.rangesList.querySelectorAll('.range-item span');
                if (rangeItems.length === 0) {
                    alert('Please add at least one page range to extract.');
                    this.hideProgress();
                    return;
                }
                for (const item of rangeItems) {
                    const text = item.textContent.replace('Pages ', '');
                    const [from, to] = text.split('-').map(n => parseInt(n));
                    
                    if (isNaN(from) || isNaN(to)) continue;

                    const newPdf = await window.PDFLib.PDFDocument.create();
                    const indices = [];
                    for (let i = from; i <= to; i++) indices.push(i - 1);
                    
                    const copiedPages = await newPdf.copyPages(srcPdfDoc, indices);
                    copiedPages.forEach(p => newPdf.addPage(p));
                    
                    const pdfBytes = await newPdf.save();
                    zip.file(`range-${from}-to-${to}.pdf`, pdfBytes);
                    fileCounter++;
                }
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            if (this.downloadLink) {
                this.downloadLink.href = URL.createObjectURL(zipBlob);
                this.downloadLink.download = 'split-documents-archive.zip';
            }

            if (this.filesCreated) this.filesCreated.textContent = fileCounter;
            if (this.totalPagesProcessed) this.totalPagesProcessed.textContent = this.selectedPages.size;
            
            this.hideProgress();
            if (this.successOverlay) this.successOverlay.style.display = 'flex';
        } catch (err) {
            this.hideProgress();
            alert('Could not split the PDF. Please try again.');
            console.error(err);
        }
    }

    resetUI() {
        window.location.reload();
    }

    showProgress(title, message) {
        if (!this.progressOverlay) return;
        if (this.progressText) this.progressText.textContent = message;
        if (this.progressPercent) this.progressPercent.textContent = '100%';
        if (this.progressFill) this.progressFill.style.width = '100%';
        this.progressOverlay.style.display = 'flex';
    }

    hideProgress() {
        if (this.progressOverlay) this.progressOverlay.style.display = 'none';
    }

    formatFileSize(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + " MB";
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pdfSplitter = new PDFSplitter();
    });
} else {
    window.pdfSplitter = new PDFSplitter();
}