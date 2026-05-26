// Compress Page JavaScript - Single Page PDF Compressor
document.addEventListener('DOMContentLoaded', function() {
    console.log('compress.js loaded! DOM ready!');

    // DOM Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const compressBtn = document.getElementById('compressBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statsBar = document.getElementById('statsBar');
    const fileInfoSection = document.getElementById('fileInfoSection');
    const progressOverlay = document.getElementById('progressOverlay');
    const successOverlay = document.getElementById('successOverlay');
    const downloadBtn = document.getElementById('downloadBtn');
    const newCompressBtn = document.getElementById('newCompressBtn');

    // Compression settings elements
    const compressionOptions = document.querySelectorAll('.compression-option');
    const compressImages = document.getElementById('compressImages');
    const removeMetadata = document.getElementById('removeMetadata');
    const downsampleImages = document.getElementById('downsampleImages');
    const imageQuality = document.getElementById('imageQuality');
    const qualityValue = document.getElementById('qualityValue');

    // File info elements
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const pageCount = document.getElementById('pageCount');
    const fileAdded = document.getElementById('fileAdded');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const reductionPercent = document.getElementById('reductionPercent');
    const previewOriginal = document.getElementById('previewOriginal');
    const previewCompressed = document.getElementById('previewCompressed');
    const previewReduction = document.getElementById('previewReduction');
    const previewSavings = document.getElementById('previewSavings');

    // Success modal elements
    const successReduction = document.getElementById('successReduction');
    const successSaved = document.getElementById('successSaved');
    const successTime = document.getElementById('successTime');

    // State
    let currentFile = null;
    let compressionLevel = 'recommended';
    let startTime = null;

    // Initialize
    initEventListeners();
    updatePreview();

    // ==================== EVENT LISTENERS ====================
    function initEventListeners() {
        console.log('Initializing event listeners...');

        // Upload Zone Events (Drag & Drop only, no click)
        if (uploadZone) {
            uploadZone.addEventListener('dragover', handleDragOver);
            uploadZone.addEventListener('dragleave', handleDragLeave);
            uploadZone.addEventListener('drop', handleDrop);
            console.log('Drag & drop events added');
        }

        // Browse Button
        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Browse button clicked');
                fileInput.click();
            });
        }

        // File Input
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('File input changed');
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
            });
        }

        // Clear Button
        if (clearBtn) {
            clearBtn.addEventListener('click', clearFile);
        }

        // Compress Button
        if (compressBtn) {
            compressBtn.addEventListener('click', startCompression);
        }

        // New Compress Button (in success modal)
        if (newCompressBtn) {
            newCompressBtn.addEventListener('click', startNewCompression);
        }

        // Download Button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', handleDownload);
        }

        // Compression Options
        compressionOptions.forEach(option => {
            option.addEventListener('click', function() {
                compressionOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                compressionLevel = this.dataset.level;
                console.log('Compression level set to:', compressionLevel);
                updatePreview();
            });
        });

        // Advanced Options
        if (compressImages) {
            compressImages.addEventListener('change', updatePreview);
        }
        if (removeMetadata) {
            removeMetadata.addEventListener('change', updatePreview);
        }
        if (downsampleImages) {
            downsampleImages.addEventListener('change', updatePreview);
        }
        if (imageQuality) {
            imageQuality.addEventListener('input', function() {
                qualityValue.textContent = this.value;
                updatePreview();
            });
        }

        console.log('Event listeners setup complete');
    }

    // ==================== DRAG & DROP HANDLERS ====================
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!uploadZone.contains(e.relatedTarget)) {
            uploadZone.classList.remove('dragover');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Only take the first file for compression
            handleFile(files[0]);

            // If multiple files were dropped, show notification
            if (files.length > 1) {
                showNotification('Only the first file will be compressed. Please compress files one at a time.', 'warning');
            }
        }
    }

    // ==================== FILE HANDLING ====================
    function handleFile(file) {
        console.log('Handling file:', file.name);

        // Validate file type
        if (file.type !== 'application/pdf') {
            showNotification(`"${file.name}" is not a PDF file`, 'error');
            return;
        }

        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            showNotification(`"${file.name}" exceeds 50MB limit`, 'error');
            return;
        }

        // Estimate page count based on file size
        const estimatedPages = Math.max(1, Math.floor(file.size / 50000));

        // Create file object
        currentFile = {
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            pages: estimatedPages,
            addedTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        console.log('File added:', currentFile);
        updateFileInfo();
        getCompressionPreview(); // Get preview from server
        showNotification(`"${file.name}" added for compression`, 'success');
    }

    // ==================== GET COMPRESSION PREVIEW FROM SERVER ====================
    async function getCompressionPreview() {
        if (!currentFile) return;

        try {
            // Create FormData for preview
            const formData = new FormData();
            formData.append('file', currentFile.file);
            formData.append('compression_level', compressionLevel);
            formData.append('image_quality', imageQuality.value);

            // Send to server for preview
            const response = await fetch('/api/compress/simulate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to get compression preview');
            }

            const result = await response.json();

            if (result.success) {
                updatePreviewWithData(result);
            }

        } catch (error) {
            console.error('Preview error:', error);
            // Fall back to local calculation
            updatePreview();
        }
    }

    function updateFileInfo() {
        if (!currentFile) {
            // Hide file info section
            fileInfoSection.style.display = 'none';
            statsBar.style.display = 'none';

            // Disable buttons
            compressBtn.disabled = true;
            clearBtn.disabled = true;
            return;
        }

        // Show file info section
        fileInfoSection.style.display = 'block';
        statsBar.style.display = 'flex';

        // Update file details
        fileName.textContent = currentFile.name;
        fileSize.textContent = formatFileSize(currentFile.size);
        pageCount.textContent = `${currentFile.pages} pages`;
        fileAdded.textContent = currentFile.addedTime;
        originalSize.textContent = formatFileSize(currentFile.size);

        // Enable buttons
        compressBtn.disabled = false;
        clearBtn.disabled = false;
    }

    function clearFile() {
        if (currentFile) {
            console.log('Clearing file:', currentFile.name);
            currentFile = null;
            updateFileInfo();
            updatePreview();
            showNotification('File removed', 'info');

            // Reset file input
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }

    // ==================== COMPRESSION PREVIEW ====================
    function updatePreview() {
        if (!currentFile) {
            resetPreview();
            return;
        }

        // Local calculation (fallback)
        const reduction = calculateLocalReduction();
        const compressedSize = Math.floor(currentFile.size * (1 - reduction/100));

        updatePreviewUI(currentFile.size, compressedSize, reduction);
    }

    function updatePreviewWithData(result) {
        if (!currentFile) return;

        updatePreviewUI(
            result.original_size,
            result.compressed_size,
            result.reduction_percent
        );
    }

    function updatePreviewUI(originalSizeBytes, compressedSizeBytes, reduction) {
        const savingsBytes = originalSizeBytes - compressedSizeBytes;

        // Update preview elements
        compressedSize.textContent = formatFileSize(compressedSizeBytes);
        reductionPercent.textContent = `${reduction}%`;
        previewOriginal.textContent = formatFileSize(originalSizeBytes);
        previewCompressed.textContent = formatFileSize(compressedSizeBytes);
        previewReduction.textContent = `${reduction}%`;
        previewSavings.textContent = formatFileSize(savingsBytes);

        // Update color based on reduction
        updateReductionColor(reduction);
    }

    function resetPreview() {
        compressedSize.textContent = '0 KB';
        reductionPercent.textContent = '0%';
        previewOriginal.textContent = '0 KB';
        previewCompressed.textContent = '0 KB';
        previewReduction.textContent = '0%';
        previewSavings.textContent = '0 KB';
    }

    function calculateLocalReduction() {
        // Set base reduction based on level
        let baseReduction;
        switch(compressionLevel) {
            case 'extreme':
                baseReduction = 75;
                break;
            case 'light':
                baseReduction = 30;
                break;
            case 'recommended':
            default:
                baseReduction = 60;
        }

        // Adjust based on quality
        const quality = parseInt(imageQuality.value) / 100;
        let reduction = baseReduction * (1.5 - quality * 0.5);

        // Adjust based on advanced options
        if (compressImages && compressImages.checked) reduction *= 1.2;
        if (removeMetadata && removeMetadata.checked) reduction *= 1.05;
        if (downsampleImages && downsampleImages.checked) reduction *= 1.1;

        // Ensure reasonable bounds
        return Math.max(10, Math.min(90, reduction));
    }

    function updateReductionColor(reduction) {
        const reductionElement = reductionPercent;
        const previewReductionElement = previewReduction;

        if (reduction >= 70) {
            reductionElement.style.color = 'var(--success-color)';
            previewReductionElement.style.color = 'var(--success-color)';
        } else if (reduction >= 40) {
            reductionElement.style.color = 'var(--warning-color)';
            previewReductionElement.style.color = 'var(--warning-color)';
        } else {
            reductionElement.style.color = 'var(--error-color)';
            previewReductionElement.style.color = 'var(--error-color)';
        }
    }

    // ==================== REAL COMPRESSION PROCESS ====================
    async function startCompression() {
        console.log('Starting compression...');

        if (!currentFile) {
            showNotification('Please select a PDF file to compress', 'error');
            return;
        }

        // Validate before proceeding
        if (currentFile.size > 20 * 1024 * 1024) {
            if (!confirm(`You are about to compress "${currentFile.name}" (${formatFileSize(currentFile.size)}). This may take a moment. Continue?`)) {
                return;
            }
        }

        // Start timer
        startTime = Date.now();

        // Show progress
        showProgress('Preparing compression...', 10);
        progressOverlay.style.display = 'flex';

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', currentFile.file);
            formData.append('compression_level', compressionLevel);
            formData.append('compress_images', compressImages.checked);
            formData.append('remove_metadata', removeMetadata.checked);
            formData.append('downsample_images', downsampleImages.checked);
            formData.append('image_quality', imageQuality.value);

            // Send to server
            showProgress('Uploading to server...', 30);

            const response = await fetch('/api/compress', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            showProgress('Compressing PDF...', 70);

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Compression failed');
            }

            showProgress('Finalizing...', 90);

            // Store download URL
            if (downloadBtn) {
                downloadBtn.dataset.downloadUrl = result.download_url;
                downloadBtn.dataset.filename = `compressed_${currentFile.name}`;
            }

            // Show success modal
            showSuccessModal(result);

            showProgress('Complete!', 100);

        } catch (error) {
            console.error('Compression error:', error);
            showNotification(`Compression failed: ${error.message}`, 'error');
        } finally {
            setTimeout(() => {
                progressOverlay.style.display = 'none';
            }, 500);
        }
    }

    function showProgress(text, percent) {
        console.log('Progress:', percent + '%', text);

        const progressTextEl = document.getElementById('progressText');
        const progressFillEl = document.getElementById('progressFill');
        const progressPercentEl = document.getElementById('progressPercent');
        const progressFileEl = document.getElementById('progressFile');

        if (progressTextEl) progressTextEl.textContent = text;
        if (progressFillEl) progressFillEl.style.width = `${percent}%`;
        if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
        if (progressFileEl && currentFile) {
            progressFileEl.textContent = `Processing: ${currentFile.name}`;
        }
    }

    // ==================== SUCCESS MODAL ====================
    function showSuccessModal(result) {
        console.log('Showing success modal');

        // Update success stats
        successReduction.textContent = `${result.reduction_percent}%`;
        successSaved.textContent = formatFileSize(result.saved_bytes);
        successTime.textContent = `${result.processing_time}s`;

        // Show success overlay
        successOverlay.style.display = 'flex';

        // Store download data
        if (downloadBtn) {
            downloadBtn.href = result.download_url;
            downloadBtn.download = `compressed_${result.original_filename}`;
        }
    }

    async function handleDownload(e) {
        e.preventDefault();
        console.log('Download button clicked');

        // Use the actual download URL from server
        const downloadUrl = downloadBtn.href;

        if (!downloadUrl || downloadUrl === '#') {
            showNotification('No compressed file available', 'error');
            return;
        }

        try {
            showNotification('Starting download...', 'info');

            // The download will be handled by the browser via the link's href
            // We just need to trigger it
            window.location.href = downloadUrl;

        } catch (error) {
            console.error('Download error:', error);
            showNotification('Download failed. Please try again.', 'error');
        }
    }

    function startNewCompression() {
        console.log('Starting new compression');

        // Reset everything
        currentFile = null;
        startTime = null;

        // Hide success modal
        successOverlay.style.display = 'none';

        // Clear file input
        if (fileInput) {
            fileInput.value = '';
        }

        // Update UI
        updateFileInfo();
        resetPreview();

        showNotification('Ready to compress another file', 'info');
    }

    // ==================== UTILITY FUNCTIONS ====================
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function showNotification(message, type = 'info') {
        console.log('Notification:', type, message);

        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Define icons and colors
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.borderLeftColor = colors[type] || colors.info;

        notification.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"
               style="color: ${colors[type] || colors.info}; font-size: 20px;">
            </i>
            <div style="flex: 1; margin-left: 12px;">
                <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div style="color: #666; font-size: 14px;">
                    ${message}
                </div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove after 4 seconds
        const autoRemove = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        }, 4000);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 400);
        });
    }
});