// Load header and footer components
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Determine if we're in the root or pages directory
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const componentPath = isInPagesDir ? '' : 'pages/';
        
        // Load header
        const headerResponse = await fetch(componentPath + 'header.html');
        const headerHtml = await headerResponse.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;
        
        // Load footer
        const footerResponse = await fetch(componentPath + 'footer.html');
        const footerHtml = await footerResponse.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
        
        // Set copyright year
        updateCopyrightYear();
        
        // Update navigation links if needed
        if (isInPagesDir) {
            adjustNavigationLinks();
        }
        
        // Set active navigation item based on current page
        setActiveNavItem();
    } catch (error) {
        console.error('Error loading components:', error);
    }
});

// Helper function to set the current year in the copyright notice
function updateCopyrightYear() {
    const yearElements = document.querySelectorAll('.copyright-year');
    const currentYear = new Date().getFullYear();
    
    if (yearElements.length === 0) {
        // If no specific elements with the class exist, try to find the copyright text
        const copyrightElements = document.querySelectorAll('.copyright p');
        copyrightElements.forEach(element => {
            // Replace any year or © YEAR pattern with the current year
            element.innerHTML = element.innerHTML.replace(/©\s*\d{4}|©/, '© ' + currentYear);
        });
    } else {
        // Update elements with the copyright-year class
        yearElements.forEach(el => {
            el.textContent = currentYear;
        });
    }
}

// Helper function to adjust navigation links when in the pages directory
function adjustNavigationLinks() {
    setTimeout(() => {
        const links = document.querySelectorAll('nav a, .footer-section a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === 'index.html') {
                link.setAttribute('href', '../index.html');
            } else if (href && href.startsWith('pages/')) {
                link.setAttribute('href', href.replace('pages/', ''));
            }
        });
    }, 100);
}

// Helper function to set the active navigation item
function setActiveNavItem() {
    // Get current page filename
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    
    // Remove any existing 'active' classes
    setTimeout(() => {
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add 'active' class to the current page's nav link
        if (currentPage === 'index.html' || path.endsWith('/')) {
            document.getElementById('nav-home')?.classList.add('active');
        } else if (currentPage === 'about.html') {
            document.getElementById('nav-about')?.classList.add('active');
        } else if (currentPage === 'contact.html') {
            document.getElementById('nav-contact')?.classList.add('active');
        }
    }, 100);
} 