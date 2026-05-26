// Theme Toggle JavaScript - Supports both desktop and mobile buttons
document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme toggle script loaded');

    // ===== GET ALL THEME TOGGLE ELEMENTS =====
    const themeToggle = document.getElementById('themeToggle');           // Desktop button
    const themeToggleMobile = document.getElementById('themeToggleMobile'); // Mobile button
    
    // Get icons for both buttons (if they exist)
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    const themeIconMobile = themeToggleMobile ? themeToggleMobile.querySelector('i') : null;
    
    const body = document.body;

    // If no theme toggle buttons found at all
    if ((!themeToggle && !themeToggleMobile)) {
        console.warn('No theme toggle buttons found on this page');
        return; // Exit if no buttons found
    }

    // ===== THEME SETUP FUNCTIONS =====
    
    // Update ALL icons based on current theme
    function updateAllIcons() {
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Update desktop button icon (if exists)
        if (themeIcon) {
            themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Update mobile button icon (if exists)
        if (themeIconMobile) {
            themeIconMobile.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Toggle theme function
    function toggleTheme() {
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Remove existing theme classes
        body.classList.remove('dark-mode', 'light-mode');
        
        // Apply new theme
        if (isDarkMode) {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
        
        // Update icons on both buttons
        updateAllIcons();
        
        console.log('Theme toggled to:', isDarkMode ? 'light' : 'dark');
    }

    // Initialize theme based on saved preference or system preference
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Remove any existing theme classes first
        body.classList.remove('dark-mode', 'light-mode');
        
        // Apply theme in order of priority:
        // 1. Saved user preference
        // 2. System preference
        // 3. Default to light
        if (savedTheme === 'dark' || savedTheme === 'light') {
            body.classList.add(savedTheme + '-mode');
        } else if (systemPrefersDark) {
            body.classList.add('dark-mode');
        } else {
            body.classList.add('light-mode');
        }
        
        // Update icons
        updateAllIcons();
    }

    // ===== SETUP EVENT LISTENERS =====
    
    // Add click listeners to both buttons
    function setupEventListeners() {
        // Desktop button
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            themeToggle.addEventListener('touchend', function(e) {
                e.preventDefault();
                themeToggle.click();
            });
        }
        
        // Mobile button
        if (themeToggleMobile) {
            themeToggleMobile.addEventListener('click', toggleTheme);
            themeToggleMobile.addEventListener('touchend', function(e) {
                e.preventDefault();
                themeToggleMobile.click();
            });
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            // Only update if user hasn't set a preference
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    body.classList.remove('light-mode');
                    body.classList.add('dark-mode');
                } else {
                    body.classList.remove('dark-mode');
                    body.classList.add('light-mode');
                }
                updateAllIcons();
            }
        });
    }

    // ===== INITIALIZE EVERYTHING =====
    initTheme();
    setupEventListeners();
    
    // Log initialization status
    const buttonsFound = [];
    if (themeToggle) buttonsFound.push('Desktop');
    if (themeToggleMobile) buttonsFound.push('Mobile');
    console.log('Theme toggle initialized. Buttons found:', buttonsFound.join(' + ') || 'None');
});
