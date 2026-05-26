// ===== PDF TO POWERPOINT CONVERTER =====
// JavaScript for PDF to PowerPoint conversion page

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
    
    // ===== FILE SELECTION =====
    
    // Browse button click
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pdfFileInput.click();
    });
    
    // File input change
    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Drag and drop functionality
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
                showNotification('Please select a PDF file', 'error');
            }
        }
    });
    
    // Click on upload area
    uploadArea.addEventListener('click', () => {
        pdfFileInput.click();
    });
    
    // ===== FILE HANDLING =====
    
    function handleFileSelection(file) {
        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            showNotification('File size exceeds 50MB limit', 'error');
            return;
        }
        
        // Check file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showNotification('Please select a PDF file', 'error');
            return;
        }
        
        selectedFile = file;
        
        // Update UI to show selected file
        uploadArea.innerHTML = `
            <i class="fas fa-file-pdf upload-icon"></i>
            <h3>${file.name}</h3>
            <p class="upload-hint">${formatFileSize(file.size)} • Ready to convert</p>
            <button class="btn-secondary" id="changeFileBtn">
                <i class="fas fa-exchange-alt"></i> Change File
            </button>
        `;
        
        // Add event listener to change file button
        setTimeout(() => {
            document.getElementById('changeFileBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                resetFileSelection();
            });
        }, 100);
        
        // Enable convert button
        convertBtn.disabled = false;
        
        showNotification('PDF file selected and ready for conversion', 'success');
    }
    
    function resetFileSelection() {
        selectedFile = null;
        uploadArea.innerHTML = `
            <i class="fas fa-file-powerpoint upload-icon"></i>
            <h3>Drop your PDF file here</h3>
            <p class="upload-hint">or click to browse your computer</p>
            <button class="browse-btn" id="browseBtn">
                <i class="fas fa-folder-open"></i> Choose PDF File
            </button>
            <p class="file-info">Maximum file size: 50MB • Converts to .pptx format</p>
        `;
        
        // Re-attach event listeners
        setTimeout(() => {
            document.getElementById('browseBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                pdfFileInput.click();
            });
        }, 100);
        
        convertBtn.disabled = true;
    }
    
    // ===== CONVERSION =====
    
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showNotification('Please select a PDF file first', 'error');
            return;
        }
        
        // Show progress overlay
        showProgress('Converting PDF to PowerPoint...');
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        try {
            // Simulate progress for better UX
            simulateProgress();
            
            // Send to server for conversion
            const response = await fetch('/pdf-to-powerpoint', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Show success with stats
                showSuccess(result);
            } else {
                hideProgress();
                showNotification(result.error || 'Conversion failed', 'error');
            }
            
        } catch (error) {
            hideProgress();
            showNotification('Network error. Please try again.', 'error');
            console.error('Conversion error:', error);
        }
    });
    
    // ===== PROGRESS MANAGEMENT =====
    
    function showProgress(message) {
        progressText.textContent = message;
        progressOverlay.style.display = 'flex';
        progressFill.style.width = '10%';
    }
    
    function simulateProgress() {
        let progress = 10;
        const interval = setInterval(() => {
            progress += 5;
            progressFill.style.width = progress + '%';
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 300);
    }
    
    function hideProgress() {
        progressOverlay.style.display = 'none';
        progressFill.style.width = '0%';
    }
    
    // ===== SUCCESS MANAGEMENT =====
    
    function showSuccess(result) {
        // Update progress to 100%
        progressFill.style.width = '100%';
        
        // Update success stats
        successStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Slides Created</span>
                <span class="stat-value">${result.slides || 1}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Format</span>
                <span class="stat-value">PowerPoint (.pptx)</span>
            </div>
        `;
        
        // Set download link
        downloadBtn.href = result.download_url;
        downloadBtn.download = result.filename || 'presentation.pptx';
        
        // Switch to success overlay
        setTimeout(() => {
            progressOverlay.style.display = 'none';
            successOverlay.style.display = 'flex';
        }, 500);
    }
    
    // Convert another button
    convertAnotherBtn.addEventListener('click', () => {
        successOverlay.style.display = 'none';
        resetFileSelection();
    });
    
    // ===== UTILITY FUNCTIONS =====
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
    
    // Initialize button state
    convertBtn.disabled = true;
});