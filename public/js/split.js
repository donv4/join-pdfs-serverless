// public/js/split.js - SERVERLESS HYBRID BROWSER CLIENT
class PDFSplitter {
    constructor() {
        this.currentFile = null;
        this.totalPageCount = 0;
        this.selectedPages = new Set();
        this.currentMethod = 'range';
        this.ranges = [];
        this.pdfDataUri = null;

        this.initializeElements();
        this.setupEventListeners();
        this.initializePagePreviews();
        this.loadLibraries();
    }

    // Load necessary third-party browser bundles dynamically to prevent layout rendering drops
    loadLibraries() {
        if (!window.PDFLib) {
            const script1 = document.createElement('script');
            script1.src = 'https://unpkg.com';
            document.head.appendChild(script1);
        }
        if (!window.pdfjsLib) {
            const script2 = document.createElement('script');
            script2.src = 'https://cloudflare.com';
            document.head.appendChild(script2);
            // Configure worker route explicitly
            script2.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cloudflare.com';
            };
        }
        if (!window.JSZip) {
            const script3 = document.createElement('script');
            script3.src = 'https://cloudflare.com';
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
                    this.handleFileSelect({ target: this.fileInput });
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
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please select a valid PDF file archive.');
            return;
        }

        this.currentFile = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);

        this.showProgress('Reading PDF...', 'Parsing page matrices locally...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDataUri = arrayBuffer;

            // Use client-side pdfjsLib to parse total document arrays instantly
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDoc = await loadingTask.promise;
            
            this.totalPageCount = pdfDoc.numPages;

            // Update user dashboard nodes
            const statsBar = document.getElementById('statsBar');
            if (statsBar) statsBar.style.display = 'flex';
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
            document.getElementById('totalPages').textContent = this.totalPageCount;

            if (this.pageCountElement) this.pageCountElement.textContent = `${this.totalPageCount} pages`;

            this.fromPageInput.max = this.totalPageCount;
            this.toPageInput.max = this.totalPageCount;
            this.fromPageInput.value = 1;
            this.toPageInput.value = this.totalPageCount;

            this.splitOptions.style.display = 'block';
            this.clearBtn.disabled = false;
            this.processSplitBtn.disabled = false;

            this.initializePages();
            this.hideProgress();
        } catch (error) {
            this.hideProgress();
            alert('Could not open the PDF document layout safely client-side.');
            console.error(error);
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
            if (m.dataset.method === method) m.classList.add('active');
            else m.classList.remove('active');
        });
        this.updateSelectionPreview();
    }

    addRange() {
        const from = parseInt(this.fromPageInput.value);
        const to = parseInt(this.toPageInput.value);

        if (from > 0 && to >= from && to <= this.totalPageCount) {
            const item = document.createElement('div');
            item.className = 'range-item';
            item.style.cssText = 'background: #f1f5f9; padding: 8px; margin: 4px; border-radius: 4px; display: inline-block;';
            item.innerHTML = `<span>Pages ${from}-${to}</span>`;
            this.rangesList.appendChild(item);

            for (let i = from; i <= to; i++) {
                this.selectedPages.add(i);
                const box = document.getElementById(`page-${i}`);
                if (box) box.checked = true;
            }
            this.updateSelectionPreview();
        }
    }

    updateCurrentRange() {
        let from = parseInt(this.fromPageInput.value);
        let to = parseInt(this.toPageInput.value);
        if (from < 1) this.fromPageInput.value = 1;
        if (to > this.totalPageCount) this.toPageInput.value = this.totalPageCount;
    }

    updateSelectionPreview() {
        if (this.selectedPages.size === 0) {
            this.selectionPreview.style.display = 'none';
            return;
        }
        this.selectedCount.textContent = `${this.selectedPages.size} pages selected`;
        this.selectedPagesList.textContent = Array.from(this.selectedPages).sort((a,b)=>a-b).join(', ');
        this.filesCount.textContent = this.currentMethod === 'single' ? this.selectedPages.size : this.rangesList.children.length;
        this.selectionPreview.style.display = 'block';
    }

    // NATIVE BROWSER ASSEMBLY METHOD - ZERO SERVER DEPENDENCY
    async splitPDF() {
        if (!this.pdfDataUri) return;
        this.showProgress('Processing...', 'Assembling file arrays locally...');

        try {
            const srcPdfDoc = await PDFLib.PDFDocument.load(this.pdfDataUri);
            const zip = new JSZip();
            let fileCounter = 0;

            if (this.currentMethod === 'single') {
                const pages = Array.from(this.selectedPages).sort((a,b)=>a-b);
                for (const pageNum of pages) {
                    const newPdf = await PDFLib.PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(srcPdfDoc, [pageNum - 1]);
                    newPdf.addPage(copiedPage);
                    const pdfBytes = await newPdf.save();
                    zip.file(`extracted-page-${pageNum}.pdf`, pdfBytes);
                    fileCounter++;
                }
            } else {
                // Range execution loop blocks
                const rangeItems = this.rangesList.querySelectorAll('.range-item span');
                for (const item of rangeItems) {
                    const text = item.textContent.replace('Pages ', '');
                    const [from, to] = text.split('-').map(n => parseInt(n));
                    
                    const newPdf = await PDFLib.PDFDocument.create();
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
            this.downloadLink.href = URL.createObjectURL(zipBlob);
            this.downloadLink.download = 'split-documents-archive.zip';

            this.filesCreated.textContent = fileCounter;
            this.totalPagesProcessed.textContent = this.selectedPages.size;
            
            this.hideProgress();
            this.successOverlay.style.display = 'flex';
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
        this.progressText.textContent = message;
        this.progressPercent.textContent = '100%';
        this.progressFill.style.width = '100%';
        this.progressOverlay.style.display = 'flex';
    }

    hideProgress() {
        this.progressOverlay.style.display = 'none';
    }

    formatFileSize(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + " MB";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PDFSplitter();
});