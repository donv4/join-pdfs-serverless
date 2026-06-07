// PDF to Image Converter - Client-side only (no server API)
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF to Image converter loaded');

    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const formatButtons = document.querySelectorAll('.format-btn');
    const qualitySlider = document.getElementById('qualitySlider');
    const convertBtn = document.getElementById('convertBtn');
    const uploadForm = document.getElementById('uploadForm');
    const successMessage = document.getElementById('successMessage');
    const errorContainer = document.getElementById('errorContainer');
    const errorText = document.getElementById('errorText');
    const downloadBtn = document.getElementById('downloadBtn');
    const successStatsText = document.getElementById('successStatsText');
    const downloadNoteText = document.getElementById('downloadNoteText');

    // State
    let currentFile = null;
    let imageBlobs = [];
    let convertedPages = 0;

    // Helper: Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Helper: Show error message
    function showError(message) {
        if (errorText) errorText.textContent = message;
        if (errorContainer) errorContainer.style.display = 'block';
        if (successMessage) successMessage.style.display = 'none';
        
        setTimeout(() => {
            if (errorContainer) errorContainer.style.display = 'none';
        }, 5000);
    }

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                if (fileName) {
                    fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
                }
                if (convertBtn) convertBtn.disabled = false;
                currentFile = file;
                
                // Hide previous messages
                if (successMessage) successMessage.style.display = 'none';
                if (errorContainer) errorContainer.style.display = 'none';
            } else {
                if (fileName) fileName.textContent = 'No file chosen';
                if (convertBtn) convertBtn.disabled = true;
            }
        });
    }
    
    // Format button selection
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            formatButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Quality slider value display
    if (qualitySlider) {
        qualitySlider.addEventListener('input', function() {
            console.log('Quality set to:', this.value);
        });
    }
    
    // Form submission handler - DO THE CONVERSION CLIENT-SIDE
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const file = fileInput.files[0];
            
            if (!file) {
                showError('Please select a PDF file first');
                return;
            }
            
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                showError('Please select a valid PDF file (.pdf)');
                return;
            }
            
            // Validate file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                showError('File size exceeds 50MB limit. Please choose a smaller file.');
                return;
            }
            
            // Show loading state
            if (convertBtn) {
                convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
                convertBtn.disabled = true;
            }
            
            // Hide previous messages
            if (successMessage) successMessage.style.display = 'none';
            if (errorContainer) errorContainer.style.display = 'none';
            
            // Start conversion
            await convertPDFToImages(file);
        });
    }
    
    // Main conversion function
    async function convertPDFToImages(file) {
        // Check if PDF.js is available
        if (!window.pdfjsLib) {
            showError('PDF processing library not loaded. Please refresh the page.');
            resetConvertButton();
            return;
        }
        
        // Configure worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
        
        imageBlobs = [];
        convertedPages = 0;
        
        try {
            // Get settings
            const activeFormatBtn = document.querySelector('.format-btn.active');
            const format = activeFormatBtn ? activeFormatBtn.getAttribute('data-format') : 'jpg';
            const qualitySliderVal = qualitySlider ? parseInt(qualitySlider.value) : 8;
            const jpegQuality = Math.max(0.1, Math.min(1.0, qualitySliderVal / 10));
            
            // Read PDF file
            const arrayBuffer = await file.arrayBuffer();
            
            // Load PDF document
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;
            
            // Show success message container with progress
            if (successMessage) {
                successMessage.style.display = 'block';
            }
            if (successStatsText) {
                successStatsText.textContent = `Processing ${totalPages} page${totalPages > 1 ? 's' : ''}...`;
            }
            
            // Process each page
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                // Update progress
                if (successStatsText) {
                    successStatsText.textContent = `Processing page ${pageNum} of ${totalPages}...`;
                }
                
                // Get PDF page
                const page = await pdf.getPage(pageNum);
                
                // Set viewport scale for good quality
                const scale = 2.0; // 2x scale for better quality
                const viewport = page.getViewport({ scale: scale });
                
                // Create canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Render PDF page to canvas
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                    background: 'white'
                };
                
                await page.render(renderContext).promise;
                
                // Convert canvas to blob based on format
                let blob;
                if (format === 'png') {
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                } else {
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', jpegQuality));
                }
                
                imageBlobs.push({
                    blob: blob,
                    pageNum: pageNum,
                    extension: format
                });
                
                convertedPages++;
            }
            
            // Create ZIP file with all images
            await createAndDownloadZip(format, file.name);
            
        } catch (error) {
            console.error('Conversion error:', error);
            showError(`Conversion failed: ${error.message}`);
            resetConvertButton();
        }
    }
    
    async function createAndDownloadZip(format, originalFileName) {
        // Check if JSZip is available
        if (!window.JSZip) {
            // Load JSZip dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            script.onload = () => createZipWithImages(format, originalFileName);
            script.onerror = () => showError('Failed to load compression library');
            document.head.appendChild(script);
        } else {
            createZipWithImages(format, originalFileName);
        }
    }
    
    function createZipWithImages(format, originalFileName) {
        const zip = new window.JSZip();
        
        // Add each image to ZIP
        imageBlobs.forEach((img) => {
            const filename = `page_${String(img.pageNum).padStart(3, '0')}.${img.extension}`;
            zip.file(filename, img.blob);
        });
        
        // Generate ZIP file
        zip.generateAsync({ type: 'blob' }).then(zipBlob => {
            // Create download URL
            const downloadUrl = URL.createObjectURL(zipBlob);
            const zipFileName = originalFileName.replace('.pdf', '') + '_images.zip';
            
            // Setup download button
            if (downloadBtn) {
                downloadBtn.href = downloadUrl;
                downloadBtn.download = zipFileName;
            }
            
            // Update success message
            if (successStatsText) {
                successStatsText.textContent = `Successfully converted ${convertedPages} page${convertedPages > 1 ? 's' : ''} to ${format.toUpperCase()}`;
            }
            if (downloadNoteText) {
                downloadNoteText.textContent = `Your ZIP file (${(zipBlob.size / 1024 / 1024).toFixed(1)} MB) is ready`;
            }
            
            // Reset convert button
            resetConvertButton();
            
            // Scroll to download button
            if (downloadBtn) {
                downloadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
        }).catch(err => {
            console.error('ZIP creation error:', err);
            showError('Failed to create ZIP file');
            resetConvertButton();
        });
    }
    
    function resetConvertButton() {
        if (convertBtn) {
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Convert to Images';
        }
    }
    
    // Drag and drop functionality
    const uploadArea = document.getElementById('uploadArea');
    
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            uploadArea.style.backgroundColor = 'rgba(106, 17, 203, 0.1)';
            uploadArea.style.border = '2px dashed #6a11cb';
        }
        
        function unhighlight() {
            uploadArea.style.backgroundColor = '';
            uploadArea.style.border = '';
        }
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const file = files[0];
                
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    fileInput.files = files;
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                } else {
                    alert('Please drop a PDF file (.pdf)');
                }
            }
        }
    }
});