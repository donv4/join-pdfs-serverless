// AV Toolkit - Pure Client-Side Media Processing
(function() {
    'use strict';
    
    // DOM Elements
    const mediaDropzone = document.getElementById('mediaDropzone');
    const mediaInput = document.getElementById('mediaInput');
    const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const previewAudio = document.getElementById('previewAudio');
    const extractAudioBtn = document.getElementById('extractAudioBtn');
    const captureFrameBtn = document.getElementById('captureFrameBtn');
    const snapshotCanvas = document.getElementById('snapshotCanvas');
    const downloadSection = document.getElementById('downloadSection');
    const downloadLink = document.getElementById('downloadLink');
    
    // State
    let loadedFileBlob = null;
    let isVideo = true;
    
    // Initialize event listeners
    function init() {
        if (!mediaDropzone) {
            console.error('Media dropzone not found');
            return;
        }
        
        mediaDropzone.addEventListener('click', () => mediaInput.click());
        
        mediaDropzone.addEventListener('dragover', handleDragOver);
        mediaDropzone.addEventListener('dragleave', handleDragLeave);
        mediaDropzone.addEventListener('drop', handleDrop);
        
        mediaInput.addEventListener('change', (e) => handleMediaUpload(e.target.files[0]));
        
        if (extractAudioBtn) {
            extractAudioBtn.addEventListener('click', handleAudioExtraction);
        }
        
        if (captureFrameBtn) {
            captureFrameBtn.addEventListener('click', handleFrameCapture);
        }
    }
    
    // Drag and drop handlers
    function handleDragOver(e) {
        e.preventDefault();
        mediaDropzone.style.borderColor = '#3b82f6';
        mediaDropzone.style.background = '#eff6ff';
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        mediaDropzone.style.borderColor = '#cbd5e1';
        mediaDropzone.style.background = '#f8fafc';
    }
    
    function handleDrop(e) {
        e.preventDefault();
        mediaDropzone.style.borderColor = '#cbd5e1';
        mediaDropzone.style.background = '#f8fafc';
        handleMediaUpload(e.dataTransfer.files[0]);
    }
    
    // File upload handler
    function handleMediaUpload(file) {
        if (!file) return;
        
        const fileType = file.type;
        isVideo = fileType.startsWith('video/');
        
        // Validate file type
        if (!fileType.startsWith('video/') && !fileType.startsWith('audio/')) {
            alert('Please select a video or audio file');
            return;
        }
        
        // Validate file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
            alert('File size exceeds 500MB limit');
            return;
        }
        
        loadedFileBlob = file;
        
        // Update metadata display
        document.getElementById('metaName').innerText = truncateFileName(file.name, 50);
        document.getElementById('metaSize').innerText = formatFileSize(file.size);
        document.getElementById('metaType').innerText = fileType.split('/')[0].toUpperCase();
        
        // Set up preview
        const fileUrl = URL.createObjectURL(file);
        
        if (isVideo) {
            previewVideo.style.display = 'block';
            previewAudio.style.display = 'none';
            previewVideo.src = fileUrl;
            previewVideo.load();
        } else {
            previewVideo.style.display = 'none';
            previewAudio.style.display = 'block';
            previewAudio.src = fileUrl;
            previewAudio.load();
        }
        
        // Reset download section
        resetDownloadSection();
        
        // Show preview container
        mediaDropzone.style.display = 'none';
        mediaPreviewContainer.style.display = 'block';
        
        // Enable buttons
        if (captureFrameBtn) captureFrameBtn.disabled = false;
        if (extractAudioBtn) extractAudioBtn.disabled = false;
    }
    
    // Frame capture handler
    function handleFrameCapture() {
        if (!loadedFileBlob || !isVideo) {
            alert('Please load a video file first');
            return;
        }
        
        if (previewVideo.readyState < 2) {
            alert('Video is not ready. Please wait for it to load.');
            return;
        }
        
        const ctx = snapshotCanvas.getContext('2d');
        snapshotCanvas.width = previewVideo.videoWidth;
        snapshotCanvas.height = previewVideo.videoHeight;
        
        if (snapshotCanvas.width === 0 || snapshotCanvas.height === 0) {
            alert('Cannot capture frame: Video dimensions are zero');
            return;
        }
        
        ctx.drawImage(previewVideo, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
        
        const imageUrl = snapshotCanvas.toDataURL('image/jpeg', 0.9);
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `frame-${Date.now()}.jpg`;
        a.click();
        
        // Visual feedback
        const originalText = captureFrameBtn.innerHTML;
        captureFrameBtn.innerHTML = '<i class="fas fa-check"></i> Frame Captured!';
        setTimeout(() => {
            captureFrameBtn.innerHTML = originalText;
        }, 2000);
    }
    
    // Audio extraction handler
    async function handleAudioExtraction() {
        if (!loadedFileBlob) {
            alert('Please load a file first');
            return;
        }
        
        const originalText = extractAudioBtn.innerHTML;
        extractAudioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Audio...';
        extractAudioBtn.disabled = true;
        
        try {
            const arrayBuffer = await loadedFileBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
            
            // Convert to WAV format
            const wavBlob = audioBufferToWav(audioBuffer);
            const wavUrl = URL.createObjectURL(wavBlob);
            
            // Show download link
            downloadLink.href = wavUrl;
            const baseName = loadedFileBlob.name.replace(/\.[^/.]+$/, '') || 'audio';
            downloadLink.download = baseName + '.wav';
            downloadSection.style.display = 'block';
            
            // Success feedback
            extractAudioBtn.innerHTML = '<i class="fas fa-check"></i> Audio Extracted!';
            setTimeout(() => {
                extractAudioBtn.innerHTML = originalText;
                extractAudioBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Audio extraction error:', error);
            let errorMsg = 'Could not extract audio. ';
            if (error.name === 'NotSupportedError') {
                errorMsg += 'This file format may not be supported for audio extraction.';
            } else if (error.name === 'EncodingError') {
                errorMsg += 'The audio track could not be decoded.';
            } else {
                errorMsg += 'Please ensure the file contains an audio track.';
            }
            alert(errorMsg);
            extractAudioBtn.innerHTML = originalText;
            extractAudioBtn.disabled = false;
        }
    }
    
    // Convert AudioBuffer to WAV Blob
    function audioBufferToWav(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        // Get first channel (mono mix if needed)
        let samples = audioBuffer.getChannelData(0);
        let dataLength = samples.length * (bitDepth / 8) * numChannels;
        let buffer = new ArrayBuffer(44 + dataLength);
        let view = new DataView(buffer);
        
        // Write WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
        view.setUint16(32, numChannels * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Write audio data
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const sample = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }
    
    function writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }
    
    // Reset download section
    function resetDownloadSection() {
        downloadSection.style.display = 'none';
        if (downloadLink.href && downloadLink.href.startsWith('blob:')) {
            URL.revokeObjectURL(downloadLink.href);
            downloadLink.href = '#';
        }
    }
    
    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function truncateFileName(name, maxLen) {
        if (name.length <= maxLen) return name;
        const ext = name.split('.').pop();
        const baseName = name.slice(0, maxLen - ext.length - 4);
        return baseName + '...' + ext;
    }
    
    // Start the app
    init();
})();