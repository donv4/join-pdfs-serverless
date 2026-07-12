// public/js/flipbook.js - Accessibility Zoom Matrix Engine

(function() {
    // 1. Inject core dependencies cleanly in chronological order
    const pdfScript = document.createElement('script');
    pdfScript.src = '/js/lib/pdf.min.js';
    pdfScript.async = false;
    document.head.appendChild(pdfScript);

    pdfScript.onload = () => {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/lib/pdf.worker.min.js';
            // Launch application mechanics only when dependencies hit the window tree
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initFlipbookApplication);
            } else {
                initFlipbookApplication();
            }
        }
    };

    function initFlipbookApplication() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const bookViewport = document.getElementById('bookViewport');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumLabel = document.getElementById('pageNumLabel');
        const resetBtn = document.getElementById('resetBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const stageWrapper = document.querySelector('.stage-wrapper');

        // Target all Zoom Controller selectors
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomLabel = document.getElementById('zoomLabel');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');

        const fsZoomSlider = document.getElementById('fsZoomSlider');
        const fsZoomLabel = document.getElementById('fsZoomLabel');
        const fsZoomInBtn = document.getElementById('fsZoomInBtn');
        const fsZoomOutBtn = document.getElementById('fsZoomOutBtn');
        
        const fsPrevBtn = document.getElementById('fsPrevBtn');
        const fsNextBtn = document.getElementById('fsNextBtn');
        const fsExitBtn = document.getElementById('fsExitBtn');

        let pdfDoc = null;
        let pageCount = 0;
        let currentPagePair = 0; 
        let renderedPages = [];
        let isDragging = false;
        let startX = 0;

        if (!dropZone) return; // Route safety shield check

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) loadPDF(e.target.files);
        });

        // Unified 400% Zoom Matrix Engine
        function applyZoom(val) {
            val = Math.max(0.7, Math.min(4.0, parseFloat(val)));
            
            bookViewport.style.setProperty('--zoom-factor', val);
            if (zoomSlider) zoomSlider.value = val;
            if (fsZoomSlider) fsZoomSlider.value = val;
            
            const percentageString = `${Math.round(val * 100)}%`;
            if (zoomLabel) zoomLabel.innerText = percentageString;
            if (fsZoomLabel) fsZoomLabel.innerText = percentageString;
        }

        // Attach range inputs
        if (zoomSlider) zoomSlider.addEventListener('input', (e) => applyZoom(parseFloat(e.target.value)));
        if (fsZoomSlider) fsZoomSlider.addEventListener('input', (e) => applyZoom(parseFloat(e.target.value)));

        // Attach desktop button actions
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                applyZoom(parseFloat(zoomSlider.value) + 0.1);
            });
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                applyZoom(parseFloat(zoomSlider.value) - 0.1);
            });
        }

        // Attach fullscreen HUD button actions
        if (fsZoomInBtn) {
            fsZoomInBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                applyZoom(parseFloat(fsZoomSlider.value) + 0.1);
            });
        }
        if (fsZoomOutBtn) {
            fsZoomOutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                applyZoom(parseFloat(fsZoomSlider.value) - 0.1);
            });
        }

        async function loadPDF(file) {
            dropZone.style.display = 'none';
            bookViewport.style.display = 'block';
            document.querySelector('.nav-controls').style.display = 'flex';
            applyZoom(1.0);

            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file[0]); // Target explicit file blobs inside list
            fileReader.onload = async function() {
                const typedarray = new Uint8Array(this.result);
                try {
                    pdfDoc = await window.pdfjsLib.getDocument({data: typedarray}).promise;
                    pageCount = pdfDoc.numPages;
                    await renderAllPages();
                    buildFlipbookStructures();
                } catch (err) {
                    console.error("PDF Parsing Error:", err);
                    alert("Error loading PDF document layout layers.");
                }
            };
        }

        async function renderAllPages() {
            renderedPages = [];
            // Vector clarity resolution multiplier (2.5) guarantees legibility at 400% scale
            const renderScale = 2.5; 
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: renderScale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                renderedPages.push(canvas);
            }
        }

        function buildFlipbookStructures() {
            bookViewport.innerHTML = '';
            let sheetIndex = 0;
            for (let i = 0; i < renderedPages.length; i += 2) {
                const pageSheet = document.createElement('div');
                pageSheet.className = `flip-page right-side`;
                pageSheet.style.zIndex = pageCount - sheetIndex;
                pageSheet.dataset.spreadIndex = sheetIndex;

                const frontFace = document.createElement('div');
                frontFace.className = 'page-face front';
                frontFace.appendChild(renderedPages[i]);
                pageSheet.appendChild(frontFace);

                const backFace = document.createElement('div');
                backFace.className = 'page-face back';
                if (renderedPages[i + 1]) {
                    backFace.appendChild(renderedPages[i + 1]);
                } else {
                    backFace.style.background = '#f1f1f1';
                }
                pageSheet.appendChild(backFace);

                bookViewport.appendChild(pageSheet);
                sheetIndex++;
            }
            setupDragEngine();
            updateControlState();
        }

        function setupDragEngine() {
            bookViewport.addEventListener('pointerdown', (e) => {
                isDragging = true;
                startX = e.clientX;
                bookViewport.setPointerCapture(e.pointerId);
            });

            bookViewport.addEventListener('pointermove', (e) => { if (!isDragging) return; });

            bookViewport.addEventListener('pointerup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                bookViewport.releasePointerCapture(e.pointerId);

                const deltaX = e.clientX - startX;
                const threshold = 50; 

                if (deltaX < -threshold) turnForward();
                else if (deltaX > threshold) turnBackward();
            });
        }

        function turnForward() {
            const sheets = document.querySelectorAll('.flip-page');
            if (currentPagePair < sheets.length) {
                const targetSheet = sheets[currentPagePair];
                targetSheet.classList.add('flipped');
                targetSheet.style.zIndex = currentPagePair + 1;
                currentPagePair++;
                updateControlState();
            }
        }

        function turnBackward() {
            const sheets = document.querySelectorAll('.flip-page');
            if (currentPagePair > 0) {
                currentPagePair--;
                const targetSheet = sheets[currentPagePair];
                targetSheet.classList.remove('flipped');
                targetSheet.style.zIndex = pageCount - currentPagePair;
                updateControlState();
            }
        }

        function updateControlState() {
            const sheets = document.querySelectorAll('.flip-page');
            const disablePrev = currentPagePair === 0;
            const disableNext = currentPagePair >= sheets.length;

            if (prevBtn) prevBtn.disabled = disablePrev;
            if (fsPrevBtn) fsPrevBtn.disabled = disablePrev;
            if (nextBtn) nextBtn.disabled = disableNext;
            if (fsNextBtn) fsNextBtn.disabled = disableNext;

            if (pageNumLabel) pageNumLabel.innerText = `Spread ${currentPagePair + 1} / ${sheets.length || 1}`;
            
            sheets.forEach((sheet, idx) => {
                if (idx === currentPagePair || idx === currentPagePair - 1) {
                    sheet.style.pointerEvents = 'auto';
                } else {
                    sheet.style.pointerEvents = 'none';
                }
            });
        }

        if (nextBtn) nextBtn.addEventListener('click', turnForward);
        if (fsNextBtn) fsNextBtn.addEventListener('click', turnForward);
        if (prevBtn) prevBtn.addEventListener('click', turnBackward);
        if (fsPrevBtn) fsPrevBtn.addEventListener('click', turnBackward);

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    if (stageWrapper.requestFullscreen) stageWrapper.requestFullscreen();
                    else if (stageWrapper.webkitRequestFullscreen) stageWrapper.webkitRequestFullscreen();
                    applyZoom(1.4); 
                }
            });
        }

        if (fsExitBtn) {
            fsExitBtn.addEventListener('click', () => {
                if (document.fullscreenElement) document.exitFullscreen();
            });
        }

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) applyZoom(1.0);
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                pdfDoc = null; pageCount = 0; currentPagePair = 0; renderedPages = [];
                bookViewport.innerHTML = ''; fileInput.value = '';
                bookViewport.style.display = 'none';
                document.querySelector('.nav-controls').style.display = 'none';
                dropZone.style.display = 'block';
            });
        }
    }
})();
