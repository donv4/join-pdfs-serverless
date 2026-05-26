// FAQ Page JavaScript - Frequently Asked Questions
console.log("Starting faq.js...");

document.addEventListener('DOMContentLoaded', function() {
    console.log('faq.js loaded! DOM ready!');

    // ==================== DOM ELEMENTS ====================
    const searchInput = document.getElementById('faqSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const faqItems = document.querySelectorAll('.faq-item');
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    console.log('DOM Elements found:', {
        searchInput: !!searchInput,
        clearSearchBtn: !!clearSearchBtn,
        categoryTabs: categoryTabs.length,
        faqItems: faqItems.length,
        faqQuestions: faqQuestions.length
    });

    // ==================== INITIALIZE ====================
    initEventListeners();

    // ==================== EVENT LISTENERS ====================
    function initEventListeners() {
        console.log('Setting up FAQ event listeners...');

        // 1. FAQ Question Click (Accordion Toggle)
        faqQuestions.forEach(question => {
            question.addEventListener('click', toggleFAQAnswer);
        });

        // 2. Search Input
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        // 3. Clear Search Button
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', clearSearch);
        }

        // 4. Category Tabs
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', handleCategoryFilter);
        });

        console.log('FAQ event listeners setup complete');
    }

    // ==================== FAQ ACCORDION FUNCTIONS ====================
    function toggleFAQAnswer(event) {
        const question = event.currentTarget;
        const faqItem = question.closest('.faq-item');
        
        // Toggle active class on the FAQ item
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQ items (optional - remove if you want multiple open)
        // document.querySelectorAll('.faq-item.active').forEach(item => {
        //     if (item !== faqItem) item.classList.remove('active');
        // });
        
        // Toggle this item
        faqItem.classList.toggle('active');
        
        console.log('FAQ toggled:', question.textContent.trim(), 'Active:', !isActive);
    }

    // ==================== SEARCH FUNCTIONS ====================
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        console.log('Searching for:', searchTerm);
        
        // Show/hide clear button
        if (clearSearchBtn) {
            clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
        }
        
        // Filter FAQ items
        filterFAQItems(searchTerm, getActiveCategory());
    }

    function clearSearch() {
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        
        // Show all FAQ items
        filterFAQItems('', getActiveCategory());
        console.log('Search cleared');
    }

    // ==================== CATEGORY FILTER FUNCTIONS ====================
    function handleCategoryFilter(event) {
        const tab = event.currentTarget;
        const category = tab.dataset.category;
        
        // Update active tab
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Filter by category
        filterFAQItems(getSearchTerm(), category);
        console.log('Category selected:', category);
    }

    function getActiveCategory() {
        const activeTab = document.querySelector('.category-tab.active');
        return activeTab ? activeTab.dataset.category : 'all';
    }

    function getSearchTerm() {
        return searchInput ? searchInput.value.toLowerCase().trim() : '';
    }

    // ==================== MAIN FILTER FUNCTION ====================
    function filterFAQItems(searchTerm, category) {
        let visibleCount = 0;
        let hasVisibleItems = false;
        
        // First, show all categories and items
        document.querySelectorAll('.faq-category, .faq-item').forEach(el => {
            el.classList.remove('hidden');
        });
        
        // If no filters, we're done
        if (!searchTerm && category === 'all') {
            console.log('No filters applied, showing all items');
            return;
        }
        
        // Apply filters
        faqItems.forEach(item => {
            const faqCategory = item.closest('.faq-category').dataset.category;
            const questionText = item.querySelector('.faq-question').textContent.toLowerCase();
            const answerText = item.querySelector('.faq-answer').textContent.toLowerCase();
            const itemText = questionText + ' ' + answerText;
            
            // Check category filter
            const categoryMatch = category === 'all' || faqCategory === category;
            
            // Check search filter
            const searchMatch = !searchTerm || itemText.includes(searchTerm);
            
            // Show/hide item
            if (categoryMatch && searchMatch) {
                item.classList.remove('hidden');
                visibleCount++;
                hasVisibleItems = true;
            } else {
                item.classList.add('hidden');
            }
            
            // Show/hide category based on visible items
            const categoryEl = item.closest('.faq-category');
            const visibleInCategory = Array.from(categoryEl.querySelectorAll('.faq-item'))
                .some(faq => !faq.classList.contains('hidden'));
            
            if (visibleInCategory) {
                categoryEl.classList.remove('hidden');
            } else {
                categoryEl.classList.add('hidden');
            }
        });
        
        console.log('Filter applied. Visible items:', visibleCount);
    }

    // ==================== INITIAL SETUP ====================
    // Optional: Open first FAQ item by default
    // if (faqItems.length > 0) {
    //     faqItems[0].classList.add('active');
    // }
    
    console.log('FAQ page initialization complete');
});