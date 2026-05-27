// Merge Page JavaScript - Multiple PDF Merger
document.addEventListener('DOMContentLoaded', function() {
    console.log('merge.js loaded! DOM ready!');

    // DOM Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const mergeBtn = document.getElementById('mergeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileListSection = document.getElementById('fileListSection');
    const fileList = document.getElementById('fileList');
    const mergeStats = document.getElementById('mergeStats');
    const progressOverlay = document.getElementById('progressOverlay');
    const successOverlay = document.getElementById('successOverlay');
    const downloadBtn = document.getElementById('downloadBtn');
    const newMergeBtn = document.getElementById('newMergeBtn');

    // Stats elements
    const fileCount = document.getElementById('fileCount');
    const totalFiles = document.getElementById('totalFiles');
    const totalPages = document.getElementById('totalPages');
    const totalSize = document.getElementById('totalSize');
    const estimatedTime = document.getElementById('estimatedTime');

    // Success modal elements
    const successFiles = document.getElementById('successFiles');
    const successPages = document.getElementById('successPages');
    const successTime = document.getElementById('successTime');

    // State
    let files = [];
    let startTime = null;

    // Initialize
    initEventListeners();

    function initEventListeners() {
        // File selection
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('drop', handleDrop);
        
        // Buttons
        mergeBtn.addEventListener('click', handleMerge);
        clearBtn.addEventListener('click', clearFiles);
        newMergeBtn.addEventListener('click', resetPage);
        downloadBtn.addEventListener('click', (e) => {
            if (!downloadBtn.href || downloadBtn.href === '#') {
                e.preventDefault();
                alert('Please merge files first');
            }
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    function handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => 
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );
        
        if (newFiles.length === 0) {
            alert('Please select PDF files only');
            return;
        }
        
        files.push(...newFiles);
        updateFileList();
        updateStats();
        updateUI();
    }

    function updateFileList() {
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <div class="file-item-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="file-item-info">
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="file-item-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileElement);
        });
        
        // Add remove listeners
        document.querySelectorAll('.file-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                files.splice(index, 1);
                updateFileList();
                updateStats();
                updateUI();
            });
        });
    }

    function updateStats() {
        const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
        const estimatedPages = Math.ceil(totalSizeBytes / 50000); // Rough estimate
        
        fileCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
        totalFiles.textContent = files.length;
        totalPages.textContent = estimatedPages;
        totalSize.textContent = formatFileSize(totalSizeBytes);
        estimatedTime.textContent = `${Math.max(2, files.length)}s`;
        
        // Show/hide sections
        fileListSection.style.display = files.length > 0 ? 'block' : 'none';
        mergeStats.style.display = files.length > 0 ? 'block' : 'none';
    }

    function updateUI() {
        mergeBtn.disabled = files.length < 2;
        clearBtn.disabled = files.length === 0;
    }

    async function handleMerge() {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge');
            return;
        }
        
        startTime = Date.now();
        showProgress('Reading and compiling document sheets locally...');
        
        try {
            // 1. Dynamically load the high-performance local PDF manipulation script if not present
            if (typeof PDFLib === 'undefined') {
                showProgress('Loading secure rendering matrix engine...');
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cloudflare.com';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            showProgress('Merging document streams completely client-side...');
            
            // 2. Initialize a blank workspace container document
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            // 3. Loop through files in local memory buffers
            for (const file of files) {
                const fileArrayBuffer = await file.arrayBuffer();
                const sourcePdf = await PDFLib.PDFDocument.load(fileArrayBuffer);
                const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            
            // 4. Compile the output bytes into a localized blob URL
            const mergedPdfBytes = await mergedPdf.save();
            const pdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const dynamicDownloadUrl = URL.createObjectURL(pdfBlob);
            
            // 5. Structure a mock return payload matching your success modal layout
            const localResult = {
                success: true,
                download_url: dynamicDownloadUrl,
                filename: `merged_${Date.now()}.pdf`
            };
            
            showSuccess(localResult);

        } catch (error) {
            hideProgress();
            console.error('Local memory document compilation failed:', error);
            alert(`Error: Local processing encountered an issue (${error.message}). Please verify document formats.`);
        }
    }


    function showProgress(message) {
        document.getElementById('progressText').textContent = message;
        progressOverlay.style.display = 'flex';
    }

    function hideProgress() {
        progressOverlay.style.display = 'none';
    }

    function showSuccess(result) {
        hideProgress();
        
        const processTime = ((Date.now() - startTime) / 1000).toFixed(1);
        successFiles.textContent = files.length;
        successPages.textContent = totalPages.textContent;
        successTime.textContent = `${processTime}s`;
        
        if (result.download_url) {
            downloadBtn.href = result.download_url;
            downloadBtn.download = result.filename || 'merged.pdf';
        }
        
        successOverlay.style.display = 'flex';
    }

    function clearFiles() {
        files = [];
        fileInput.value = '';
        updateFileList();
        updateStats();
        updateUI();
    }

    function resetPage() {
        successOverlay.style.display = 'none';
        clearFiles();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});