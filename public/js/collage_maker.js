// public/js/collage_maker.js - PURE CLIENT-SIDE CANVAS COLLAGE MAKER
class PhotoCollageMaker {
    constructor() {
        this.images = []; // Holds loaded Image objects
        this.currentCols = 2;
        this.currentRows = 2;
        this.canvasWidth = 1200;
        this.canvasHeight = 1200;
        this.textOverlays = [];

        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadZone = document.getElementById('uploadZone');
        this.imageInput = document.getElementById('imageInput');
        this.canvas = document.getElementById('collageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.placeholder = document.getElementById('canvasPlaceholder');
        this.thumbnails = document.getElementById('thumbnails');
        this.spacingSlider = document.getElementById('spacingSlider');
        this.bgColor = document.getElementById('bgColor');
        this.borderSlider = document.getElementById('borderSlider');
        this.borderColor = document.getElementById('borderColor');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.formatSelect = document.getElementById('formatSelect');

        // Setup base target sizing for canvas element
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
    }

    setupEventListeners() {
        // Upload Handlers
        this.uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); this.uploadZone.style.borderColor = '#0070f3'; });
        this.uploadZone.addEventListener('dragleave', () => { this.uploadZone.style.borderColor = '#ccc'; });
        this.uploadZone.addEventListener('drop', (e) => { e.preventDefault(); this.handleFiles(e.dataTransfer.files); });
        this.imageInput.addEventListener('change', (e) => { this.handleFiles(e.target.files); });

        // Layout Picker Handlers
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCols = parseInt(e.target.dataset.cols);
                this.currentRows = parseInt(e.target.dataset.rows);
                this.renderCollage();
            });
        });

        // Live Real-time Slider Adjustments
        this.spacingSlider.addEventListener('input', () => this.renderCollage());
        this.bgColor.addEventListener('input', () => this.renderCollage());
        this.borderSlider.addEventListener('input', () => this.renderCollage());
        this.borderColor.addEventListener('input', () => this.renderCollage());

        // Text Injections
        document.getElementById('addTextBtn').addEventListener('click', () => this.addTextOverlay());

        // Master Download Trigger
        this.downloadBtn.addEventListener('click', () => this.downloadCollageImage());
    }

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.images.push(img);
                    this.addThumbnailView(event.target.result);
                    this.renderCollage();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    addThumbnailView(src) {
        if (this.placeholder) this.placeholder.style.display = 'none';
        this.canvas.style.display = 'block';

        const thumb = document.createElement('div');
        thumb.className = 'thumb-item';
        thumb.style.position = 'relative';
        thumb.innerHTML = `
            <img src="${src}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin: 5px; border: 2px solid #ccc;"/>
            <button class="del-thumb" style="position: absolute; top: 0; right: 0; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; cursor: pointer;">×</button>
        `;
        
        const idx = this.images.length - 1;
        thumb.querySelector('.del-thumb').addEventListener('click', () => {
            this.images.splice(idx, 1);
            thumb.remove();
            if (this.images.length === 0) {
                this.placeholder.style.display = 'flex';
                this.canvas.style.display = 'none';
            }
            this.renderCollage();
        });

        this.thumbnails.appendChild(thumb);
    }

    renderCollage() {
        if (this.images.length === 0) return;

        // 1. Clean the master canvas surface layer using background selections
        this.ctx.fillStyle = this.bgColor.value;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const spacing = parseInt(this.spacingSlider.value);
        const borderSize = parseInt(this.borderSlider.value);
        const totalSlots = this.currentCols * this.currentRows;

        // Calculate single grid grid cell parameters
        const cellWidth = (this.canvasWidth - (spacing * (this.currentCols + 1))) / this.currentCols;
        const cellHeight = (this.canvasHeight - (spacing * (this.currentRows + 1))) / this.currentRows;

        for (let i = 0; i < totalSlots; i++) {
            if (!this.images[i]) break; // Leave empty if slots exceed active photos uploaded

            const col = i % this.currentCols;
            const row = Math.floor(i / this.currentCols);

            const x = spacing + col * (cellWidth + spacing);
            const y = spacing + row * (cellHeight + spacing);

            // Render explicit design borders if slider parameters are set
            if (borderSize > 0) {
                this.ctx.fillStyle = this.borderColor.value;
                this.ctx.fillRect(x, y, cellWidth, cellHeight);
            }

            const imgX = x + borderSize;
            const imgY = y + borderSize;
            const imgW = cellWidth - (borderSize * 2);
            const imgH = cellHeight - (borderSize * 2);

            // Execute clean center-cropped aspect ratio positioning onto grid cell
            this.drawAspectCroppedImage(this.images[i], imgX, imgY, imgW, imgH);
        }

        // 2. Render Text Overlays
        this.textOverlays.forEach(textObj => {
            this.ctx.fillStyle = textObj.color;
            this.ctx.font = `bold ${textObj.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(textObj.text, textObj.x, textObj.y);
        });
    }

    drawAspectCroppedImage(img, x, y, w, h) {
        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sx, sy, sw, sh;

        if (imgRatio > targetRatio) {
            sh = img.height;
            sw = sh * targetRatio;
            sx = (img.width - sw) / 2;
            sy = 0;
        } else {
            sw = img.width;
            sh = sw / targetRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
        }
        this.ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }

    addTextOverlay() {
        const textStr = document.getElementById('textInput').value.trim();
        if (!textStr) return;

        this.textOverlays.push({
            text: textStr,
            color: document.getElementById('textColor').value,
            size: parseInt(document.getElementById('textSize').value) * 1.5, // Scale factor for hi-res canvas output
            x: this.canvasWidth / 2,
            y: this.canvasHeight - 100
        });

        document.getElementById('textInput').value = '';
        this.renderCollage();
    }

    downloadCollageImage() {
        if (this.images.length === 0) {
            alert('Please upload photos first before processing a download.');
            return;
        }
        const format = this.formatSelect.value;
        const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
        const url = this.canvas.toDataURL(mimeType, 0.92);
        
        const link = document.createElement('a');
        link.download = `collage_${Date.now()}.${format}`;
        link.href = url;
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PhotoCollageMaker();
});
