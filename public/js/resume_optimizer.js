// public/js/resume_optimizer.js - Unified Content-Analysis Engine

(function() {
    const pdfScript = document.createElement('script');
    pdfScript.src = '/js/lib/pdf.min.js';
    pdfScript.async = false;
    document.head.appendChild(pdfScript);

    pdfScript.onload = () => {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/lib/pdf.worker.min.js';
            initResumeApplication();
        }
    };

    function initResumeApplication() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const scorecardDisplay = document.getElementById('scorecardDisplay');
        const rawScoreLabel = document.getElementById('rawScoreLabel');
        const feedbackSummary = document.getElementById('feedbackSummary');
        const wordsList = document.getElementById('wordsList');
        const structureList = document.getElementById('structureList');
        const resetBtn = document.getElementById('resetBtn');

        if (!dropZone) return;

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) parseResumeData(e.target.files[0]);
        });

        // Drag and drop event listeners
        ['dragenter', 'dragover'].forEach(name => {
            dropZone.addEventListener(name, (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#0d6efd';
                dropZone.style.background = '#f0f5ff';
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropZone.addEventListener(name, (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#dee2e6';
                dropZone.style.background = '#f8f9fa';
            });
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.endsWith('.pdf')) {
                parseResumeData(files[0]);
            }
        });

        async function parseResumeData(file) {
            dropZone.style.display = 'none';
            scorecardDisplay.style.display = 'block';
            feedbackSummary.innerText = "Analyzing document metrics securely in-browser...";

            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.onload = async function() {
                const typedarray = new Uint8Array(this.result);
                try {
                    const pdfDoc = await window.pdfjsLib.getDocument({data: typedarray}).promise;
                    let fullText = "";

                    // Extract text strings across all page components
                    for (let i = 1; i <= pdfDoc.numPages; i++) {
                        const page = await pdfDoc.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(" ");
                        fullText += " " + pageText;
                    }

                    evaluateResumeMetrics(fullText, pdfDoc.numPages);
                } catch (err) {
                    console.error(err);
                    alert("Error processing resume data file structures.");
                }
            };
        }

        function evaluateResumeMetrics(text, pages) {
            const lowerText = text.toLowerCase();
            let score = 40; // Starting baseline score
            
            // Evaluation Metrics Configuration Matrix
            const checks = {
                actionVerbs: ["managed", "developed", "led", "designed", "optimized", "implemented", "increased", "created", "executed", "built"],
                contactInfo: ["email", "phone", "linkedin", "github", "address"],
                sections: ["experience", "education", "skills", "projects", "summary"]
            };

            wordsList.innerHTML = "";
            structureList.innerHTML = "";

            // 1. Evaluate Action Verbs
            let foundVerbsCount = 0;
            checks.actionVerbs.forEach(verb => {
                if (lowerText.includes(verb)) foundVerbsCount++;
            });
            if (foundVerbsCount >= 5) {
                score += 20;
                addChecklistItem(wordsList, true, "Strong descriptive action verbs utilized framework metrics.");
            } else {
                addChecklistItem(wordsList, false, `Missing strong action words. Add words like: led, managed, optimized.`);
            }

            // 2. Evaluate Contact Assets
            let foundContactDetails = 0;
            checks.contactInfo.forEach(item => {
                if (lowerText.includes(item) || (item === "linkedin" && lowerText.includes("linkedin.com"))) foundContactDetails++;
            });
            if (foundContactDetails >= 3) {
                score += 20;
                addChecklistItem(structureList, true, "Core personal contact links correctly anchored.");
            } else {
                score -= 10;
                addChecklistItem(structureList, false, "Missing profile anchors. Ensure Phone, Email, and LinkedIn are plain text.");
            }

            // 3. Document Structure Checks
            let foundSections = 0;
            checks.sections.forEach(sec => {
                if (lowerText.includes(sec)) foundSections++;
            });
            if (foundSections >= 4) {
                score += 20;
                addChecklistItem(structureList, true, "Standard industry parsing header modules discovered.");
            } else {
                addChecklistItem(structureList, false, "Fragmented section headers. Ensure titles like 'Experience' or 'Education' are clean.");
            }

            // Page volume parameters check
            if (pages > 2) {
                score -= 10;
                addChecklistItem(structureList, false, "Document footprint exceeds 2 pages. Consider condensing formatting.");
            } else {
                addChecklistItem(structureList, true, "Length constraint remains within optimal parsing bounds.");
            }

            // Guard rails to keep score values cleanly between 0 and 100
            const finalScore = Math.max(0, Math.min(100, score));
            rawScoreLabel.innerText = `${finalScore}`;
            feedbackSummary.innerText = finalScore >= 75 
                ? "Excellent formatting! Your document aligns beautifully with standard Application Tracking Systems (ATS) crawlers."
                : "Parsing checklist flags discovered. Apply adjustments below to shield your resume from automated system drops.";
        }

        function addChecklistItem(container, isPassed, text) {
            const li = document.createElement('div');
            li.className = "checklist-item";
            li.innerHTML = `
                <span class="item-status" style="color: ${isPassed ? '#198754' : '#dc3545'};">${isPassed ? '✅' : '❌'}</span>
                <span class="text-muted">${text}</span>
            `;
            container.appendChild(li);
        }

        resetBtn.addEventListener('click', () => {
            fileInput.value = "";
            scorecardDisplay.style.display = 'none';
            dropZone.style.display = 'block';
        });
    }
})();
