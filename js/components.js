// Load header and footer components
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load header
        const headerResponse = await fetch('/components/header.html');
        const headerHtml = await headerResponse.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;

        // Setup mobile admin access
        setupMobileAdminAccess();

        // Load footer
        const footerResponse = await fetch('/components/footer.html');
        const footerHtml = await footerResponse.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;

        // Set copyright year
        updateCopyrightYear();



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
        // Add 'active' class to the current page's nav link
        if (path === '/' || path.endsWith('index.html')) {
            document.getElementById('nav-home')?.classList.add('active');
        } else if (path.includes('/about/')) {
            document.getElementById('nav-about')?.classList.add('active');
        } else if (path.includes('/contact/')) {
            document.getElementById('nav-contact')?.classList.add('active');
        }
    }, 100);
}

// Helper function to setup mobile admin access (5 taps on logo)
function setupMobileAdminAccess() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    let tapCount = 0;
    let lastTapTime = 0;

    logo.style.cursor = 'pointer';
    logo.title = 'Thompson Coins and Stones';

    logo.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastTapTime;

        // Reset count if too much time has passed (e.g., 500ms between taps)
        // If it's the first tap, we don't check the difference
        if (tapCount > 0 && timeDiff > 500) {
            tapCount = 0;
        }

        // Increment count
        tapCount++;
        lastTapTime = currentTime;

        console.log(`Logo tap count: ${tapCount}`);

        if (tapCount >= 5) {
            console.log('Admin access triggered!');
            // Authorized
            sessionStorage.setItem('adminAuthorized', 'true');
            sessionStorage.setItem('adminAuthTimestamp', Date.now().toString());

            // Redirect
            window.location.href = '/admin/';

            // Reset
            tapCount = 0;
        }
    });
}

// Custom Popup Notification Function
function showCustomPopup(message, type = 'info') {
    // Check if popup DOM already exists
    let popupOverlay = document.getElementById('custom-popup-overlay');

    // Create DOM structure if it doesn't exist
    if (!popupOverlay) {
        popupOverlay = document.createElement('div');
        popupOverlay.id = 'custom-popup-overlay';
        popupOverlay.className = 'custom-popup-overlay';

        popupOverlay.innerHTML = `
            <div class="custom-popup" id="custom-popup">
                <i class="popup-icon fas" id="popup-icon"></i>
                <p class="popup-message" id="popup-message"></p>
                <button class="popup-close-btn" id="popup-close-btn">Close</button>
            </div>
        `;

        document.body.appendChild(popupOverlay);

        // Add event listeners for closing
        const closeBtn = document.getElementById('popup-close-btn');
        closeBtn.addEventListener('click', closePopup);

        // Close on clicking outside (optional, but good UX)
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closePopup();
            }
        });
    }

    // Get elements
    const popup = document.getElementById('custom-popup');
    const icon = document.getElementById('popup-icon');
    const msgElement = document.getElementById('popup-message');
    const closeBtn = document.getElementById('popup-close-btn');

    // Reset classes
    popup.className = 'custom-popup';
    icon.className = 'popup-icon fas';

    // Set content and styles based on type
    popup.classList.add(type);
    msgElement.textContent = message;

    // Set icon
    if (type === 'success') {
        icon.classList.add('fa-check-circle');
    } else if (type === 'error') {
        icon.classList.add('fa-times-circle');
    } else {
        icon.classList.add('fa-info-circle');
    }

    // Show popup
    popupOverlay.style.display = 'flex';
    // Small delay to allow display change to take effect before opacity transition
    setTimeout(() => {
        popupOverlay.classList.add('show');
    }, 10);

    // Focus close button for accessibility
    closeBtn.focus();
}

// Helper to close popup
function closePopup() {
    const popupOverlay = document.getElementById('custom-popup-overlay');
    if (popupOverlay) {
        popupOverlay.classList.remove('show');
        setTimeout(() => {
            popupOverlay.style.display = 'none';
        }, 300); // Wait for transition
    }
}

// Make functions globally available
window.showCustomPopup = showCustomPopup;
window.closePopup = closePopup; 