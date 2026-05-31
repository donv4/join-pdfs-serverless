// public/js/split.js - SERVERLESS HYBRID BROWSER CLIENT
class PDFSplitter {
    constructor() {
        this.currentFile = null;
        this.totalPageCount = 0;
        this.selectedPages = new Set();
        this.currentMethod = 'range';
        this.ranges = [];
        this.pdfDataUri = null;
        this.isProcessingFile = false; // Protects from race condition loop blocks

        this.initializeElements();
        this.setupEventListeners();
        this.initializePagePreviews();
        this.loadLibraries();
    }

    // Load necessary third-party browser bundles dynamically with explicit valid distribution CDN endpoints
    loadLibraries() {
        if (!window.PDFLib) {
            const script1 = document.createElement('script');
            script1.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
            document.head.appendChild(script1);
        }
        
        if (!window.pdfjsLib) {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
            document.head.appendChild(script2);
            
            script2.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            };
        }
        
        if (!window.JSZip) {
            const script3 = document.createElement('script');
            script3.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.head.appendChild(script3);
        }
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
                    // Do not trigger handleFileSelect manually if native change handles pick it up
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
            alert('Please select a valid PDF file archive.');
            return;
        }

        this.isProcessingFile = true;
        this.currentFile = file;
        if (this.fileName) this.fileName.textContent = file.name;
        if (this.fileSize) this.fileSize.textContent = this.formatFileSize(file.size);

        this.showProgress('Reading PDF...', 'Parsing page matrices locally...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDataUri = arrayBuffer;

            // Check if library failed to bind safely due to network delays
            if (!window.pdfjsLib) {
                throw new Error("Library pdfjsLib failed to initiate on document runtime node.");
            }

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
        } catch (error) {
            this.hideProgress();
            alert('Could not open the PDF document layout safely client-side.');
            console.error(error);
        } finally {
            this.isProcessingFile = false;
        }
    }

    initializePages() {
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

        // Visually toggle UI panels based on selected splitting strategy
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

        // Prevent layout crashes by strictly validating numerical bounds
        if (isNaN(from) || isNaN(to) || from < 1 || to < from || to > this.totalPageCount) {
            alert(`Please enter a valid page range sequence between 1 and ${this.totalPageCount}.`);
            return;
        }

        // Prevent duplicate range row entry overhead
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

        // Wire delete buttons up directly to scrub ranges gracefully
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
        
        // Reset all grid checkboxes visually
        for (let i = 1; i <= this.totalPageCount; i++) {
            const box = document.getElementById(`page-${i}`);
            if (box) box.checked = false;
        }

        // Read remaining active ranges and re-assert state arrays
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

    // NATIVE BROWSER ASSEMBLY METHOD - ZERO SERVER DEPENDENCY
    async splitPDF() {
        if (!this.pdfDataUri) return;
        
        if (!window.PDFLib || !window.JSZip) {
            alert('Core slicing libraries are still configuring, please wait 2 seconds and try again.');
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
                    alert('Please select at least one page sheet checkbox to split.');
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
                    alert('Please specify and add at least one custom extraction page range list channel.');
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
            alert('Could not isolate and slice page arrays.');
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

document.addEventListener('DOMContentLoaded', () => {
    new PDFSplitter();
});
