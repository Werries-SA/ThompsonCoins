// Import Firebase functions
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

// DOM Elements
document.addEventListener('DOMContentLoaded', async () => {
    // Get references to DOM elements
    const coinsContainer = document.querySelector('.coins-container');
    const loaderContainer = document.querySelector('.loader-container');
    const searchInput = document.getElementById('searchInput');
    const eraFilter = document.getElementById('eraFilter');
    const regionFilter = document.getElementById('regionFilter');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const modal = document.getElementById('coinModal');
    const closeModalBtn = document.querySelector('.close-button');

    // Global variable to store the fetched coins
    let coinsData = [];

    try {
        // Show loader while loading coins
        showLoader();

        // Load coins from Firestore
        coinsData = await getCoins();
        console.log("Fetched coins:", coinsData);

        // Hide loader and display coins
        hideLoader();
        displayCoins(coinsData);
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoader();
        showError('Failed to load coins. Please try again later.');
    }

    // Function to show loader
    function showLoader() {
        loaderContainer.style.display = 'flex';
    }

    // Function to hide loader
    function hideLoader() {
        loaderContainer.style.display = 'none';
    }

    // Function to show error message
    function showError(message) {
        coinsContainer.innerHTML = `<p class="coins-error">${message}</p>`;
    }

    // Function to get all coins from Firestore
    async function getCoins() {
        try {
            // db is imported from firebaseConfig.js
            console.log("Fetching coins from Firestore...");
            const q = query(collection(db, "coins"), orderBy("name"));
            const querySnapshot = await getDocs(q);
            const coins = [];

            querySnapshot.forEach((doc) => {
                coins.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return coins;
        } catch (error) {
            console.error("Error getting coins:", error);
            throw error;
        }
    }

    // Display coins function
    function displayCoins(coins) {
        // Clear the container but keep the loader hidden
        coinsContainer.innerHTML = '';

        if (coins.length === 0) {
            coinsContainer.innerHTML = '<p class="no-results">No coins found matching your criteria. Please try a different search.</p>';
            return;
        }

        console.log(`Displaying ${coins.length} coins`);

        coins.forEach(coin => {
            console.log("Rendering coin:", coin.name);
            const coinCard = document.createElement('div');
            coinCard.className = 'coin-card';
            coinCard.setAttribute('data-id', coin.id);

            const images = coin.imageUrls && coin.imageUrls.length > 0 ? coin.imageUrls : (coin.imageUrl ? [coin.imageUrl] : []);
            
            let firstImage = images.length > 0 ? images[0] : 'https://via.placeholder.com/400x400?text=No+Image';
            let imagesHtml = `<img src="${firstImage}" alt="${coin.name}" class="coin-image">`;

            coinCard.innerHTML = `
                ${imagesHtml}
                <div class="coin-info">
                    <h3 class="coin-name">${coin.name}</h3>
                    <p class="coin-price">R${formatPrice(coin.price)}</p>
                    <p class="coin-description">${coin.description}</p>
                    <div class="coin-meta">
                        <span>${coin.era}</span>
                        <span>${coin.material}</span>
                    </div>
                </div>
            `;

            coinsContainer.appendChild(coinCard);
        });
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Search functionality
        searchInput.addEventListener('input', filterCoins);

        // Filter dropdowns
        eraFilter.addEventListener('change', filterCoins);
        regionFilter.addEventListener('change', filterCoins);

        // Reset filters
        resetFiltersBtn.addEventListener('click', resetFilters);

        // Modal handling
        coinsContainer.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    // Filter coins based on search and dropdown filters
    function filterCoins() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedEra = eraFilter.value.toLowerCase();
        const selectedRegion = regionFilter.value.toLowerCase();

        const filteredCoins = coinsData.filter(coin => {
            // Search term matching
            const matchesSearch =
                coin.name.toLowerCase().includes(searchTerm) ||
                coin.description.toLowerCase().includes(searchTerm) ||
                coin.material.toLowerCase().includes(searchTerm);

            // Era filter matching
            const matchesEra = selectedEra === '' || (coin.era && coin.era.toLowerCase() === selectedEra);

            // Region filter matching
            const matchesRegion = selectedRegion === '' || (coin.region && coin.region.toLowerCase() === selectedRegion);

            return matchesSearch && matchesEra && matchesRegion;
        });

        displayCoins(filteredCoins);
    }

    // Reset all filters
    function resetFilters() {
        searchInput.value = '';
        eraFilter.value = '';
        regionFilter.value = '';
        displayCoins(coinsData);
    }

    // Open modal with coin details
    function openModal(e) {
        const coinCard = e.target.closest('.coin-card');
        if (!coinCard) return;

        const coinId = coinCard.getAttribute('data-id');
        const selectedCoin = coinsData.find(coin => coin.id === coinId);

        if (selectedCoin) {
            const images = selectedCoin.imageUrls && selectedCoin.imageUrls.length > 0 ? selectedCoin.imageUrls : (selectedCoin.imageUrl ? [selectedCoin.imageUrl] : []);
            
            let mainImage = images.length > 0 ? images[0] : 'https://via.placeholder.com/400x400?text=No+Image';
            
            let subImagesHtml = '';
            if (images.length > 1) {
                subImagesHtml = `<div class="modal-sub-images-grid" id="modalSubImagesGrid">`;
                const hasMore = images.length > 3;
                
                for (let i = 1; i < images.length; i++) {
                    if (i === 2 && hasMore) {
                        const remaining = images.length - 3;
                        subImagesHtml += `
                            <div class="more-images-container" onclick="showAllModalImages(this)">
                                <img src="${images[i]}" alt="${selectedCoin.name} - View ${i+1}" class="modal-sub-image">
                                <div class="more-images-overlay">+${remaining}</div>
                            </div>
                        `;
                    } else if (i > 2 && hasMore) {
                        subImagesHtml += `<img src="${images[i]}" alt="${selectedCoin.name} - View ${i+1}" class="modal-sub-image hidden-sub-image" style="display: none;">`;
                    } else {
                        subImagesHtml += `<img src="${images[i]}" alt="${selectedCoin.name} - View ${i+1}" class="modal-sub-image">`;
                    }
                }
                subImagesHtml += `</div>`;
            }

            const modalContent = `
                <div class="modal-coin-details">
                    <div class="modal-coin-image-container">
                        <img src="${mainImage}" alt="${selectedCoin.name}" class="modal-coin-image main">
                        ${subImagesHtml}
                    </div>
                    <div class="modal-coin-info">
                        <h2>${selectedCoin.name}</h2>
                        <p class="modal-coin-price">R${formatPrice(selectedCoin.price)}</p>
                        <p class="modal-coin-description">${selectedCoin.description}</p>
                        <div class="modal-coin-details-list">
                            <div class="detail-item">
                                <div class="detail-label">Era:</div>
                                <div>${selectedCoin.era}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Region:</div>
                                <div>${selectedCoin.region}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Material:</div>
                                <div>${selectedCoin.material}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Diameter:</div>
                                <div>${selectedCoin.diameter} mm</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Weight:</div>
                                <div>${selectedCoin.weight} g</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Date:</div>
                                <div>${selectedCoin.date}</div>
                            </div>
                        </div>
                        <a href="/contact/" class="contact-button">Inquire About This Coin</a>
                    </div>
                </div>
            `;

            document.getElementById('modalContent').innerHTML = modalContent;
            modal.style.display = 'flex';
        }
    }

    // Format price with space between thousands
    function formatPrice(price) {
        if (price === undefined || price === null) {
            return '0.00';
        }
        return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
    }

    // Show hidden images inside modal
    window.showAllModalImages = function(containerElement) {
        if (containerElement) {
            const overlay = containerElement.querySelector('.more-images-overlay');
            if (overlay) overlay.style.display = 'none';
            containerElement.style.cursor = 'default';
        }
        const grid = document.getElementById('modalSubImagesGrid');
        if (grid) {
            const hiddenImages = grid.querySelectorAll('.hidden-sub-image');
            hiddenImages.forEach(img => {
                img.style.display = 'block';
            });
        }
    };
}); 