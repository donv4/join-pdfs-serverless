// All JavaScript inside DOMContentLoaded to ensure proper scope
document.addEventListener('DOMContentLoaded', function() {
    // ===== GLOBAL VARIABLES =====
    let canvas;
    let isPlaceholderVisible;
    let isPremiumUser = false;
    let currentPremiumKey = '';

    // Undo/Redo stack
    let undoStack = [];
    let redoStack = [];
    const MAX_UNDO_STEPS = 20;

    // Context menu variables
    let contextMenu = document.getElementById('contextMenu');
    let textEditModal = document.getElementById('textEditModal');
    let selectedShape = null;
    let isAddingTextToShape = false;
    let lastRightClickPosition = { x: 0, y: 0 };

    // SVG Paths for shapes
    const shapePaths = {
        'circle': null,
        'square': null,
        'triangle': null,
        'star': 'M 50,5 L 61,37 L 95,37 L 68,57 L 79,89 L 50,70 L 21,89 L 32,57 L 5,37 L 39,37 Z',
        'heart': 'M 50,15 C 60,5 80,5 90,15 100,25 100,45 90,55 80,65 70,75 60,85 50,75 40,65 30,55 20,45 20,25 30,15 40,5 60,5 70,15 Z',
        'pdf-icon': 'M 20,10 L 80,10 L 80,40 L 60,40 L 60,70 L 20,70 Z M 30,20 L 70,20 L 70,30 L 30,30 Z M 30,40 L 50,40 L 50,50 L 30,50 Z M 30,55 L 50,55 L 50,60 L 30,60 Z',
        'document': 'M 20,10 L 70,10 L 70,40 L 50,40 L 50,70 L 20,70 Z M 30,20 L 60,20 L 60,30 L 30,30 Z M 30,40 L 40,40 L 40,45 L 30,45 Z M 30,50 L 40,50 L 40,55 L 30,55 Z M 30,60 L 40,60 L 40,65 L 30,65 Z',
        'checkmark': 'M 20,40 L 35,55 L 65,25 L 60,20 L 35,45 L 25,35 Z'
    };

    // Template configurations
    const templateConfigs = {
        'simple': {
            backgroundColor: '#ffffff',
            objects: [
                { type: 'rect', width: 200, height: 100, fill: '#4a6cf7', left: 300, top: 200 },
                { type: 'text', text: 'BRAND', fontSize: 40, fontFamily: 'Arial', fill: '#ffffff', left: 300, top: 220 }
            ]
        },
        'badge': {
            backgroundColor: '#f8f9fa',
            objects: [
                { type: 'circle', radius: 60, fill: '#333333', left: 350, top: 190 },
                { type: 'text', text: 'B', fontSize: 50, fontFamily: 'Arial', fill: '#ffffff', left: 350, top: 190, originX: 'center', originY: 'center' }
            ]
        },
        'modern': {
            backgroundColor: 'linear-gradient(135deg, #667eea, #764ba2)',
            objects: [
                { type: 'text', text: 'MODERN', fontSize: 48, fontFamily: 'Arial', fill: '#ffffff', left: 300, top: 220, fontWeight: 'bold' }
            ]
        },
        'vintage': {
            backgroundColor: '#f5e6d3',
            objects: [
                { type: 'text', text: 'VINTAGE', fontSize: 48, fontFamily: 'Times New Roman', fill: '#8b4513', left: 300, top: 220, fontWeight: 'bold' }
            ]
        }
    };

    // ===== CANVAS INITIALIZATION =====
    canvas = new fabric.Canvas('logoCanvas', {
        backgroundColor: '#ffffff',
        selection: true,
        selectionColor: 'rgba(74, 108, 247, 0.3)',
        selectionBorderColor: '#4a6cf7',
        selectionLineWidth: 2,
        preserveObjectStacking: true
    });
    isPlaceholderVisible = true;

    // ===== DRAGGABLE TEMPLATES SYSTEM =====
    function setupDraggableTemplates() {
        const templateCards = document.querySelectorAll('.template-preview');
        
        templateCards.forEach(card => {
            card.addEventListener('dragstart', function(e) {
                const templateType = this.getAttribute('data-template');
                if (this.classList.contains('premium') && !isPremiumUser) {
                    e.preventDefault();
                    alert('🔒 Premium template! Upgrade to use professional templates.');
                    return;
                }
                this.classList.add('dragging');
                e.dataTransfer.setData('text/plain', templateType);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            card.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                document.getElementById('logoCanvas').classList.remove('canvas-drop-zone');
            });
        });
        
        const canvasElement = document.getElementById('logoCanvas');
        canvasElement.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.classList.add('canvas-drop-zone');
        });
        
        canvasElement.addEventListener('dragleave', function() {
            this.classList.remove('canvas-drop-zone');
        });
        
        canvasElement.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('canvas-drop-zone');
            const templateType = e.dataTransfer.getData('text/plain');
            if (!templateType) return;
            
            const draggedCard = document.querySelector(`.template-preview[data-template="${templateType}"]`);
            if (draggedCard && draggedCard.classList.contains('premium') && !isPremiumUser) {
                alert('🔒 Premium template! Upgrade to use professional templates.');
                return;
            }
            
            applyTemplate(templateType);
        });
    }

    function applyTemplate(templateType) {
        const config = templateConfigs[templateType];
        if (!config) return;
        
        canvas.clear();
        if (config.backgroundColor) canvas.backgroundColor = config.backgroundColor;
        
        config.objects.forEach(objConfig => {
            let fabricObj;
            const left = objConfig.left || canvas.width / 2;
            const top = objConfig.top || canvas.height / 2;
            
            if (objConfig.type === 'rect') {
                fabricObj = new fabric.Rect({ width: objConfig.width, height: objConfig.height, fill: objConfig.fill, left: left - (objConfig.width / 2), top: top - (objConfig.height / 2), selectable: true });
            } else if (objConfig.type === 'circle') {
                fabricObj = new fabric.Circle({ radius: objConfig.radius, fill: objConfig.fill, left: left, top: top, selectable: true });
            } else if (objConfig.type === 'text') {
                fabricObj = new fabric.Text(objConfig.text, { fontSize: objConfig.fontSize, fontFamily: objConfig.fontFamily, fill: objConfig.fill, left: left, top: top, originX: objConfig.originX || 'left', originY: objConfig.originY || 'top', fontWeight: objConfig.fontWeight, selectable: true });
            }
            
            if (fabricObj) canvas.add(fabricObj);
        });
        
        canvas.renderAll();
        updatePlaceholder();
        updateLayersList();
        saveState();
    }

    // ===== CONTEXT MENU LAYERS =====
    function isShapeObject(obj) {
        return obj && ['circle', 'rect', 'triangle', 'path', 'group', 'text'].includes(obj.type);
    }

    function getShapeFromObject(obj) {
        if (obj.type === 'group') {
            const shapePart = obj._objects.find(item => ['circle', 'rect', 'triangle', 'path'].includes(item.type));
            return shapePart || obj._objects[0];
        }
        return obj;
    }

    function showContextMenu(x, y, target) {
        selectedShape = target;
        lastRightClickPosition = { x: x, y: y };
        contextMenu.style.display = 'block';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
    }

    function hideContextMenu() {
        if (contextMenu) contextMenu.style.display = 'none';
    }

    // ===== TEXT INTERACTION MODAL =====
    function showTextEditModal(shape = null, isNewText = false) {
        if (shape) {
            selectedShape = shape;
            if (!isNewText && shape.type === 'group') {
                const textObj = shape._objects.find(item => item.type === 'text');
                if (textObj) document.getElementById('shapeTextInput').value = textObj.text || '';
            } else if (!isNewText && shape.type === 'text') {
                document.getElementById('shapeTextInput').value = shape.text || '';
            } else {
                document.getElementById('shapeTextInput').value = '';
            }
        }
        textEditModal.style.display = 'flex';
        document.getElementById('shapeTextInput').focus();
    }

    function hideTextEditModal() {
        textEditModal.style.display = 'none';
        selectedShape = null;
    }

    function addTextToExistingShape(shape, textData) {
        const textObj = new fabric.Text(textData.text, {
            left: shape.left + (shape.width || 100) / 2,
            top: shape.top + (shape.height || 100) / 2,
            fontSize: parseInt(textData.fontSize),
            fontFamily: textData.fontFamily,
            fill: textData.color,
            originX: 'center',
            originY: 'center'
        });

        if (shape.type === 'group') {
            shape.addWithUpdate(textObj);
        } else {
            const group = new fabric.Group([shape, textObj], { left: shape.left, top: shape.top, selectable: true });
            canvas.remove(shape);
            canvas.add(group);
            canvas.setActiveObject(group);
        }
        canvas.renderAll();
        saveState();
    }

    function updateShapeText(shape, textData) {
        if (shape.type === 'group') {
            const textObj = shape._objects.find(item => item.type === 'text');
            if (textObj) textObj.set({ text: textData.text, fill: textData.color, fontSize: parseInt(textData.fontSize), fontFamily: textData.fontFamily });
        } else if (shape.type === 'text') {
            shape.set({ text: textData.text, fill: textData.color, fontSize: parseInt(textData.fontSize), fontFamily: textData.fontFamily });
        }
        canvas.renderAll();
        saveState();
    }

    function applyGradientToSelectedShape(color1, color2) {
        if (!selectedShape) return;
        const shapeObj = getShapeFromObject(selectedShape);
        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: shapeObj.width || 100, y2: shapeObj.height || 100 },
            colorStops: [{ offset: 0, color: color1 }, { offset: 1, color: color2 }]
        });
        shapeObj.set('fill', gradient);
        canvas.renderAll();
        saveState();
    }

    function changeShapeColor(color) {
        if (!selectedShape) return;
        getShapeFromObject(selectedShape).set('fill', color);
        canvas.renderAll();
        saveState();
    }

    // ===== UNDO / REDO MANAGERS =====
    function saveState() {
        undoStack.push(JSON.stringify(canvas.toJSON()));
        if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
        redoStack = [];
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        const uBtn = document.getElementById('undoBtn');
        const rBtn = document.getElementById('redoBtn');
        if (uBtn) uBtn.disabled = undoStack.length === 0;
        if (rBtn) rBtn.disabled = redoStack.length === 0;
    }

    function undo() {
        if (undoStack.length === 0) return;
        redoStack.push(JSON.stringify(canvas.toJSON()));
        canvas.loadFromJSON(JSON.parse(undoStack.pop()), () => { canvas.renderAll(); updatePlaceholder(); updateLayersList(); updateUndoRedoButtons(); });
    }

    function redo() {
        if (redoStack.length === 0) return;
        undoStack.push(JSON.stringify(canvas.toJSON()));
        canvas.loadFromJSON(JSON.parse(redoStack.pop()), () => { canvas.renderAll(); updatePlaceholder(); updateLayersList(); updateUndoRedoButtons(); });
    }

    // ===== DISPLAY HELPER BUFFERS =====
    function updatePlaceholder() {
        document.getElementById('canvasPlaceholder').style.display = canvas.getObjects().length === 0 ? 'block' : 'none';
    }

    function updateLayersList() {
        const dBtn = document.getElementById('deleteSelected');
        if (dBtn) dBtn.disabled = !canvas.getActiveObject();
        const list = document.getElementById('layersList');
        const objects = canvas.getObjects();
        if (objects.length === 0) {
            list.innerHTML = '<p class="empty-state">No layers yet. Add text or shapes to see layers.</p>';
            return;
        }
        let html = '';
        objects.forEach((obj, idx) => {
            const isActive = canvas.getActiveObject() === obj;
            html += `<div class="layer-item" style="border-left-color: ${isActive ? '#4a6cf7' : '#ccc'}; background: ${isActive ? '#e8f4ff' : '#f8f9fa'};">
                <span>Layer ${idx + 1} (${obj.type})</span>
                <div>
                    <button onclick="window.selectLayer(${idx})"><i class="fas fa-mouse-pointer"></i></button>
                    <button onclick="window.deleteLayer(${idx})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    }

    window.selectLayer = function(idx) {
        canvas.setActiveObject(canvas.getObjects()[idx]);
        canvas.renderAll();
        updateLayersList();
    };

    window.deleteLayer = function(idx) {
        canvas.remove(canvas.getObjects()[idx]);
        updatePlaceholder();
        updateLayersList();
        saveState();
    };

    // ===== VERIFY PREMIUM ACCESS =====
    async function checkPremiumKey() {
        const store = localStorage.getItem('premium_key');
        if (!store) return;
        try {
            const check = await fetch('/api/verify-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: store })
            });
            const res = await check.json();
            if (res.valid) {
                isPremiumUser = true;
                updatePremiumUI(true);
            }
        } catch (err) { console.error(err); }
    }

    function updatePremiumUI(isPremium) {
        document.querySelectorAll('.premium-feature, .premium-option').forEach(el => {
            if (isPremium) el.classList.remove('premium-locked');
        });
    }

    // ===== SHAPE CONFIGURATION UTILITIES =====
    function createShape(shapeType, color) {
        let obj;
        const opts = { fill: color, left: canvas.width/2 - 50, top: canvas.height/2 - 50, selectable: true };
        if (shapeType === 'circle') obj = new fabric.Circle({ ...opts, radius: 50 });
        else if (shapeType === 'square') obj = new fabric.Rect({ ...opts, width: 100, height: 100 });
        else if (shapePaths[shapeType]) obj = new fabric.Path(shapePaths[shapeType], opts);
        return obj;
    }

    // ===== MOUSE AND REGULAR CLICK ATTACHMENTS =====
    canvas.on('mouse:down', function(options) {
        if (options.button === 3) {
            options.e.preventDefault();
            if (options.target && isShapeObject(options.target)) {
                showContextMenu(options.e.clientX, options.e.clientY, options.target);
            }
        }
    });

    document.addEventListener('click', (e) => { if (!contextMenu.contains(e.target)) hideContextMenu(); });

    document.getElementById('addTextToShape').addEventListener('click', () => { showTextEditModal(selectedShape, true); hideContextMenu(); });
    document.getElementById('editShapeText').addEventListener('click', () => { showTextEditModal(selectedShape, false); hideContextMenu(); });
    document.getElementById('deleteShape').addEventListener('click', () => { canvas.remove(selectedShape); canvas.renderAll(); updatePlaceholder(); updateLayersList(); saveState(); hideContextMenu(); });

    document.getElementById('saveTextEdit').addEventListener('click', () => {
        const textData = {
            text: document.getElementById('shapeTextInput').value,
            color: document.getElementById('shapeTextColor').value,
            fontSize: document.getElementById('shapeTextSize').value,
            fontFamily: document.getElementById('shapeFontSelect').value
        };
        if (selectedShape) {
            if (selectedShape.type === 'text') updateShapeText(selectedShape, textData);
            else addTextToExistingShape(selectedShape, textData);
        }
        hideTextEditModal();
    });

    document.getElementById('cancelTextEdit').addEventListener('click', hideTextEditModal);

    document.getElementById('addTextBtn').addEventListener('click', () => {
        const textObj = new fabric.Text(document.getElementById('textInput').value || 'LOGO', {
            left: canvas.width/2,
            top: canvas.height/2,
            fontSize: parseInt(document.getElementById('textSize').value),
            fontFamily: document.getElementById('fontSelect').value,
            fill: document.getElementById('textColor').value
        });
        canvas.add(textObj);
        updatePlaceholder();
        updateLayersList();
        saveState();
    });

    document.getElementById('addShapeBtn').addEventListener('click', () => {
        const type = document.getElementById('shapeSelect').value;
        if (!type) return;
        const shape = createShape(type, document.getElementById('shapeColorPicker').value);
        if (shape) { canvas.add(shape); updatePlaceholder(); updateLayersList(); saveState(); }
    });

    document.getElementById('clearCanvas').addEventListener('click', () => {
        if (confirm('Clear Canvas?')) { canvas.clear(); updatePlaceholder(); updateLayersList(); saveState(); }
    });

    document.getElementById('downloadLogo').addEventListener('click', () => {
        const format = document.getElementById('formatSelect').value;
        const link = document.createElement('a');
        link.download = `logo.${format}`;
        link.href = canvas.toDataURL({ format: format, quality: parseFloat(document.getElementById('qualitySelect').value) });
        link.click();
    });

        // ===== IMAGE UPLOAD =====
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUploadInput = document.getElementById('imageUpload');
    const uploadAreaDiv = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const addToCanvasBtn = document.getElementById('addToCanvasBtn');
    const removePreviewBtn = document.getElementById('removePreviewBtn');

        // ===== TEXT SIZE DISPLAY =====
    const textSize = document.getElementById('textSize');
    const textSizeValue = document.getElementById('textSizeValue');
    if (textSize && textSizeValue) {
        textSize.addEventListener('input', (e) => {
            textSizeValue.textContent = e.target.value + 'px';
        });
    }
    
    const shapeTextSize = document.getElementById('shapeTextSize');
    const shapeTextSizeValue = document.getElementById('shapeTextSizeValue');
    if (shapeTextSize && shapeTextSizeValue) {
        shapeTextSize.addEventListener('input', (e) => {
            shapeTextSizeValue.textContent = e.target.value + 'px';
        });
    }
    
    // ===== COLOR OPTIONS =====
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            const color = option.getAttribute('data-color');
            const shapeColorPicker = document.getElementById('shapeColorPicker');
            if (shapeColorPicker) shapeColorPicker.value = color;
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });
    
    // ===== BOLD & ITALIC =====
    const boldBtn = document.getElementById('boldBtn');
    if (boldBtn) {
        boldBtn.addEventListener('click', () => {
            const activeObj = canvas.getActiveObject();
            if (activeObj && activeObj.type === 'text') {
                const isBold = activeObj.fontWeight === 'bold';
                activeObj.set('fontWeight', isBold ? 'normal' : 'bold');
                canvas.renderAll();
                saveState();
            }
        });
    }
    
    const italicBtn = document.getElementById('italicBtn');
    if (italicBtn) {
        italicBtn.addEventListener('click', () => {
            const activeObj = canvas.getActiveObject();
            if (activeObj && activeObj.type === 'text') {
                const isItalic = activeObj.fontStyle === 'italic';
                activeObj.set('fontStyle', isItalic ? 'normal' : 'italic');
                canvas.renderAll();
                saveState();
            }
        });
    }
    
    // ===== BACKGROUND COLOR =====
    const bgColor = document.getElementById('bgColor');
    if (bgColor) {
        bgColor.addEventListener('change', (e) => {
            canvas.setBackgroundColor(e.target.value, () => canvas.renderAll());
            saveState();
        });
    }
    
    const transparentBg = document.getElementById('transparentBg');
    if (transparentBg) {
        transparentBg.addEventListener('click', () => {
            canvas.setBackgroundColor('rgba(0,0,0,0)', () => canvas.renderAll());
            if (bgColor) bgColor.value = '#ffffff';
            saveState();
        });
    }
    
    // ===== DELETE SELECTED =====
    const deleteSelected = document.getElementById('deleteSelected');
    if (deleteSelected) {
        deleteSelected.addEventListener('click', () => {
            const activeObj = canvas.getActiveObject();
            if (activeObj) {
                canvas.remove(activeObj);
                canvas.renderAll();
                updatePlaceholder();
                updateLayersList();
                saveState();
            }
        });
    }
    
    // ===== UNDO/REDO =====
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', () => undo());
    
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', () => redo());
    
    // Store uploaded image data globally
    window.uploadedImageData = null;
    
    // Browse button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload button clicked');
            imageUploadInput.click();
        });
        console.log('Upload button listener attached');
    } else {
        console.error('Upload button not found!');
    }
    
    // File input change
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            console.log('File selected:', file?.name);
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (previewImage) previewImage.src = event.target.result;
                    if (uploadPreview) uploadPreview.style.display = 'block';
                    window.uploadedImageData = event.target.result;
                    console.log('Image loaded for preview');
                };
                reader.readAsDataURL(file);
            } else if (file) {
                alert('Please select an image file (PNG, JPG, etc.)');
            }
        });
    }
    
    // Click on upload area (the drag-drop zone)
    if (uploadAreaDiv) {
        uploadAreaDiv.addEventListener('click', function(e) {
            // Don't trigger if clicking the button itself (already handled)
            if (e.target.id !== 'uploadBtn' && (!uploadBtn || !uploadBtn.contains(e.target))) {
                imageUploadInput.click();
            }
        });
    }
    
    // Add to Canvas button
    if (addToCanvasBtn) {
        addToCanvasBtn.addEventListener('click', () => {
            if (window.uploadedImageData) {
                fabric.Image.fromURL(window.uploadedImageData, (img) => {
                    img.set({
                        left: canvas.width / 2 - (img.width || 100) / 2,
                        top: canvas.height / 2 - (img.height || 100) / 2,
                        selectable: true,
                        hasControls: true,
                        hasBorders: true
                    });
                    canvas.add(img);
                    canvas.renderAll();
                    canvas.setActiveObject(img);
                    updatePlaceholder();
                    updateLayersList();
                    saveState();
                    
                    // Clear preview
                    if (uploadPreview) uploadPreview.style.display = 'none';
                    if (imageUploadInput) imageUploadInput.value = '';
                    window.uploadedImageData = null;
                });
            } else {
                alert('Please select an image first');
            }
        });
    }
    
    // Remove Preview button
    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            if (uploadPreview) uploadPreview.style.display = 'none';
            window.uploadedImageData = null;
            if (imageUploadInput) imageUploadInput.value = '';
        });
    }

    // ===== BOOT INTERFACE NODES =====
    setupDraggableTemplates();
    updatePlaceholder();
    checkPremiumKey();
});
