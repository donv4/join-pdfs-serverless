// Images to PDF JavaScript - Pure Client-Side
document.addEventListener('DOMContentLoaded', function() {
    console.log('images_to_pdf.js loaded - client-side mode');

    // DOM Elements (same as before)
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const imageOptionsSection = document.getElementById('imageOptionsSection');
    const imageListSection = document.getElementById('imageListSection');
    const imageList = document.getElementById('imageList');
    const progressOverlay = document.getElementById('progressOverlay');
    const successOverlay = document.getElementById('successOverlay');
    const downloadBtn = document.getElementById('downloadBtn');
    const newConvertBtn = document.getElementById('newConvertBtn');

    // Options elements
    const pageSize = document.getElementById('pageSize');
    const orientation = document.getElementById('orientation');
    const margin = document.getElementById('margin');
    const imageQuality = document.getElementById('imageQuality');
    const qualityValue = document.getElementById('qualityValue');
    const imageCount = document.getElementById('imageCount');

    // Success modal elements
    const successImages = document.getElementById('successImages');
    const successPages = document.getElementById('successPages');
    const successTime = document.getElementById('successTime');

    // Progress elements
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressFile = document.getElementById('progressFile');

    // State
    let images = [];
    let startTime = null;
    let pdfDoc = null;

    // Initialize
    initEventListeners();
    updateQualityDisplay();

    function initEventListeners() {
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('drop', handleDrop);
        
        imageQuality.addEventListener('input', updateQualityDisplay);
        
        convertBtn.addEventListener('click', handleConvert);
        clearBtn.addEventListener('click', clearImages);
        newConvertBtn.addEventListener('click', resetPage);
        
        downloadBtn.addEventListener('click', (e) => {
            if (!downloadBtn.href || downloadBtn.href === '#') {
                e.preventDefault();
            }
        });
    }

    function updateQualityDisplay() {
        qualityValue.textContent = imageQuality.value;
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
        fileInput.value = '';
    }

    function handleFiles(fileList) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        const newImages = Array.from(fileList).filter(file => 
            validTypes.includes(file.type) || 
            file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)
        );
        
        if (newImages.length === 0) {
            alert('Please select image files only (JPG, PNG, GIF, BMP, WebP)');
            return;
        }
        
        if (images.length + newImages.length > 20) {
            alert('Maximum 20 images allowed. Please remove some images first.');
            return;
        }
        
        images.push(...newImages);
        updateImageList();
        updateUI();
    }

    function updateImageList() {
        imageList.innerHTML = '';
        images.forEach((image, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageElement = document.createElement('div');
                imageElement.className = 'image-item';
                imageElement.setAttribute('data-index', index);
                imageElement.innerHTML = `
                    <img src="${e.target.result}" alt="${image.name}" class="image-preview">
                    <div class="image-info">
                        <div class="image-name">${escapeHtml(image.name)}</div>
                        <div class="image-size">${formatFileSize(image.size)}</div>
                    </div>
                    <button class="remove-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imageList.appendChild(imageElement);
                
                const removeBtn = imageElement.querySelector('.remove-image');
                removeBtn.addEventListener('click', () => {
                    images.splice(index, 1);
                    updateImageList();
                    updateUI();
                });
            };
            reader.readAsDataURL(image);
        });
        
        imageCount.textContent = `${images.length} image${images.length !== 1 ? 's' : ''}`;
    }

    function updateUI() {
        const hasImages = images.length > 0;
        imageOptionsSection.style.display = hasImages ? 'block' : 'none';
        imageListSection.style.display = hasImages ? 'block' : 'none';
        convertBtn.disabled = images.length === 0;
        clearBtn.disabled = images.length === 0;
        
        convertBtn.innerHTML = images.length === 1 
            ? '<i class="fas fa-file-pdf"></i> Convert to PDF'
            : `<i class="fas fa-file-pdf"></i> Convert ${images.length} Images to PDF`;
    }

    // ========== CLIENT-SIDE CONVERSION USING PDF-LIB ==========
    async function handleConvert() {
        if (images.length === 0) {
            alert('Please select at least one image');
            return;
        }
        
        // Check if PDF-lib is loaded
        if (!window.PDFLib || !window.PDFLib.PDFDocument) {
            alert('PDF library is still loading. Please wait a moment and try again.');
            return;
        }
        
        startTime = Date.now();
        showProgress(0, `Processing 0/${images.length} images`);
        
        try {
            // Use the global PDFLib object
            const { PDFDocument, PageSizes, degrees } = window.PDFLib;
            
            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();
            
            // Get page size
            const pageSizePoints = getPageSizePoints(pageSize.value);
            
            // Process each image
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                updateProgress(i, images.length, `Processing ${image.name}`);
                
                const arrayBuffer = await image.arrayBuffer();
                
                let embeddedImage;
                if (image.type === 'image/jpeg' || image.type === 'image/jpg') {
                    embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
                } else if (image.type === 'image/png') {
                    embeddedImage = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    embeddedImage = await embedImageViaCanvas(arrayBuffer, image.type, pdfDoc, parseInt(imageQuality.value));
                }
                
                const imgWidth = embeddedImage.width;
                const imgHeight = embeddedImage.height;
                
                let pageWidth, pageHeight;
                const orient = orientation.value;
                
                if (orient === 'auto') {
                    pageWidth = imgWidth;
                    pageHeight = imgHeight;
                } else if (orient === 'landscape') {
                    pageWidth = Math.max(pageSizePoints.width, pageSizePoints.height);
                    pageHeight = Math.min(pageSizePoints.width, pageSizePoints.height);
                } else {
                    pageWidth = Math.min(pageSizePoints.width, pageSizePoints.height);
                    pageHeight = Math.max(pageSizePoints.width, pageSizePoints.height);
                }
                
                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                
                const marginPx = parseInt(margin.value);
                const maxWidth = pageWidth - (marginPx * 2);
                const maxHeight = pageHeight - (marginPx * 2);
                const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                const drawWidth = imgWidth * scale;
                const drawHeight = imgHeight * scale;
                const x = marginPx + (maxWidth - drawWidth) / 2;
                const y = marginPx + (maxHeight - drawHeight) / 2;
                
                page.drawImage(embeddedImage, { x, y, width: drawWidth, height: drawHeight });
            }
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const processTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            showSuccess(url, processTime);
            
        } catch (error) {
            console.error('Conversion error:', error);
            hideProgress();
            alert(`Conversion failed: ${error.message}\n\nPlease refresh and try again.`);
        }
    }
    
    // Helper: Get page size in points
    function getPageSizePoints(size) {
        const sizes = {
            'A4': { width: 595, height: 842 },      // A4 in points
            'Letter': { width: 612, height: 792 },  // Letter in points
            'Legal': { width: 612, height: 1008 },  // Legal in points
            'Fit': { width: 0, height: 0 }          // Will use image dimensions
        };
        return sizes[size] || sizes['Letter'];
    }
    
    // Helper: Embed non-JPEG/PNG images via canvas
    async function embedImageViaCanvas(arrayBuffer, mimeType, pdfDoc, quality) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([arrayBuffer], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to PNG (PDF-lib supports PNG best)
                    canvas.toBlob(async (pngBlob) => {
                        const pngBuffer = await pngBlob.arrayBuffer();
                        const embedded = await pdfDoc.embedPng(pngBuffer);
                        URL.revokeObjectURL(url);
                        resolve(embedded);
                    }, 'image/png', quality / 100);
                } catch (err) {
                    URL.revokeObjectURL(url);
                    reject(err);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Failed to load image: ${mimeType}`));
            };
            
            img.src = url;
        });
    }
    
    function showProgress(current, total, message) {
        progressOverlay.style.display = 'flex';
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        progressFill.style.width = percent + '%';
        progressPercent.textContent = percent + '%';
        if (progressFile) progressFile.textContent = message;
        document.getElementById('progressText').textContent = 'Converting Images to PDF...';
    }
    
    function updateProgress(current, total, fileMessage) {
        const percent = Math.round((current / total) * 100);
        progressFill.style.width = percent + '%';
        progressPercent.textContent = percent + '%';
        if (progressFile) progressFile.textContent = fileMessage;
    }
    
    function hideProgress() {
        progressOverlay.style.display = 'none';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        if (progressFile) progressFile.textContent = 'Preparing...';
    }
    
    function showSuccess(downloadUrl, processTime) {
        hideProgress();
        
        successImages.textContent = images.length;
        successPages.textContent = images.length;
        successTime.textContent = `${processTime}s`;
        
        downloadBtn.href = downloadUrl;
        downloadBtn.download = `images-to-pdf-${Date.now()}.pdf`;
        
        // Clean up blob URL when download happens
        const originalClick = downloadBtn.onclick;
        downloadBtn.onclick = (e) => {
            // Don't revoke immediately - browser needs time to download
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        };
        
        successOverlay.style.display = 'flex';
    }
    
    function clearImages() {
        if (images.length > 0 && !confirm('Remove all images?')) {
            return;
        }
        images = [];
        updateImageList();
        updateUI();
    }
    
    function resetPage() {
        successOverlay.style.display = 'none';
        if (downloadBtn.href && downloadBtn.href !== '#') {
            URL.revokeObjectURL(downloadBtn.href);
        }
        downloadBtn.href = '#';
        clearImages();
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
});