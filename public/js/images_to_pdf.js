// Images to PDF JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('images_to_pdf.js loaded!');

    // DOM Elements
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

    // State
    let images = [];
    let startTime = null;

    // Initialize
    initEventListeners();
    updateQualityDisplay();

    function initEventListeners() {
        // File selection
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('drop', handleDrop);
        
        // Quality slider
        imageQuality.addEventListener('input', updateQualityDisplay);
        
        // Buttons
        convertBtn.addEventListener('click', handleConvert);
        clearBtn.addEventListener('click', clearImages);
        newConvertBtn.addEventListener('click', resetPage);
        
        // Download button
        downloadBtn.addEventListener('click', (e) => {
            if (!downloadBtn.href || downloadBtn.href === '#') {
                e.preventDefault();
                alert('Please convert images first');
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
        fileInput.value = ''; // Reset input
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
                imageElement.innerHTML = `
                    <img src="${e.target.result}" alt="${image.name}" class="image-preview">
                    <div class="image-info">
                        <div class="image-name">${image.name}</div>
                        <div class="image-size">${formatFileSize(image.size)}</div>
                    </div>
                    <button class="remove-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imageList.appendChild(imageElement);
                
                // Add remove listener
                const removeBtn = imageElement.querySelector('.remove-image');
                removeBtn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index);
                    images.splice(idx, 1);
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
        
        // Show/hide sections
        imageOptionsSection.style.display = hasImages ? 'block' : 'none';
        imageListSection.style.display = hasImages ? 'block' : 'none';
        
        // Enable/disable buttons
        convertBtn.disabled = images.length === 0;
        clearBtn.disabled = images.length === 0;
        
        // Update button text
        convertBtn.innerHTML = images.length === 1 
            ? '<i class="fas fa-file-pdf"></i> Convert to PDF'
            : `<i class="fas fa-file-pdf"></i> Convert ${images.length} Images to PDF`;
    }

    async function handleConvert() {
        if (images.length === 0) {
            alert('Please select at least one image');
            return;
        }
        
        startTime = Date.now();
        showProgress('Preparing images...');
        
        const formData = new FormData();
        images.forEach((image, index) => {
            formData.append('files', image);
        });
        
        // Add options
        formData.append('page_size', pageSize.value);
        formData.append('orientation', orientation.value);
        formData.append('margin', margin.value);
        formData.append('quality', imageQuality.value);
        
        try {
            const response = await fetch('/api/images-to-pdf', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess(result);
            } else {
                throw new Error(result.error || 'Conversion failed');
            }
        } catch (error) {
            hideProgress();
            alert(`Error: ${error.message}`);
        }
    }

    function showProgress(message) {
        document.getElementById('progressText').textContent = message;
        progressOverlay.style.display = 'flex';
        
        // Simulate progress for better UX
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress >= 90) {
                clearInterval(progressInterval);
                return;
            }
            progress += 10;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressPercent').textContent = progress + '%';
        }, 300);
    }

    function hideProgress() {
        progressOverlay.style.display = 'none';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressPercent').textContent = '0%';
    }

    function showSuccess(result) {
        hideProgress();
        
        const processTime = ((Date.now() - startTime) / 1000).toFixed(1);
        successImages.textContent = images.length;
        successPages.textContent = images.length; // One page per image
        successTime.textContent = `${processTime}s`;
        
        if (result.download_url) {
            downloadBtn.href = result.download_url;
            downloadBtn.download = result.filename || 'converted.pdf';
        }
        
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
        clearImages();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
});