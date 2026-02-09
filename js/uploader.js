// Import Firebase functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { db, storage } from "./firebaseConfig.js";

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const uploadForm = document.getElementById('coinUploadForm');
    const editForm = document.getElementById('coinEditForm');
    const coinImageUrlInput = document.getElementById('coinImageUrl');
    const editCoinImageUrlInput = document.getElementById('editCoinImageUrl');
    const imagePreview = document.getElementById('imagePreview');
    const editImagePreview = document.getElementById('editImagePreview');
    const statusMessage = document.getElementById('statusMessage');
    const deleteStatusMessage = document.getElementById('deleteStatusMessage');
    const editStatusMessage = document.getElementById('editStatusMessage');
    const coinsListForDeletion = document.getElementById('coinsListForDeletion');

    // Add loading status class to CSS
    const style = document.createElement('style');
    style.textContent = `
        .status-loading {
            background-color: #e2f0fb;
            color: #0066cc;
        }
    `;
    document.head.appendChild(style);

    console.log('Uploader initialized');

    // Preview image when URL changes for add form
    if (coinImageUrlInput) {
        coinImageUrlInput.addEventListener('input', (e) => {
            previewImage(e.target.value.trim(), imagePreview);
        });
    }

    // Preview image when URL changes for edit form
    if (editCoinImageUrlInput) {
        editCoinImageUrlInput.addEventListener('input', (e) => {
            previewImage(e.target.value.trim(), editImagePreview);
        });
    }

    // Common image preview function
    function previewImage(url, previewElement) {
        if (!url) {
            previewElement.innerHTML = '';
            return;
        }

        // Simple URL validation
        try {
            new URL(url);
            const img = document.createElement('img');
            img.src = url;
            img.onerror = () => {
                img.src = 'https://via.placeholder.com/400x400?text=Image+Error';
                img.title = 'Could not load image from URL';
            };
            previewElement.innerHTML = '';
            previewElement.appendChild(img);
        } catch (error) {
            console.error('Invalid URL:', error);
        }
    }

    // Compress image to reduce size for Firestore storage (max 1MB per field)
    function compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    // Create canvas and draw resized image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64 with compression
                    const base64 = canvas.toDataURL('image/jpeg', quality);

                    // Check size and reduce quality if still too large
                    if (base64.length > 900000 && quality > 0.3) {
                        console.log('Image still too large, reducing quality...');
                        resolve(compressImage(file, maxWidth, quality - 0.1));
                    } else {
                        resolve(base64);
                    }
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Handle add form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                console.log('Form submitted');

                // Get form values
                const name = document.getElementById('coinName').value;
                const price = parseFloat(document.getElementById('coinPrice').value);
                const material = document.getElementById('coinMaterial').value;
                const era = document.getElementById('coinEra').value;
                const region = document.getElementById('coinRegion').value;
                const diameter = parseFloat(document.getElementById('coinDiameter').value);
                const weight = parseFloat(document.getElementById('coinWeight').value);
                const date = document.getElementById('coinDate').value;
                const description = document.getElementById('coinDescription').value;
                let imageUrl = coinImageUrlInput.value.trim();

                // Get file input
                const fileInput = document.getElementById('coinImageFile');
                const imageFile = fileInput && fileInput.files[0];

                // Validate form data - only check if image URL is provided when present
                if (imageUrl) {
                    try {
                        new URL(imageUrl);
                    } catch (error) {
                        throw new Error('Please enter a valid image URL');
                    }
                }

                // Show loading message
                showStatus('Saving coin...', 'loading', statusMessage);

                // If file is provided, convert to base64
                if (imageFile) {
                    try {
                        console.log('Converting image to base64...');
                        showStatus('Processing image...', 'loading', statusMessage);

                        // Compress and convert file to base64
                        imageUrl = await compressImage(imageFile, 800, 0.7);

                        console.log('Image converted to base64 successfully, size:', imageUrl.length);
                        showStatus('Saving coin...', 'loading', statusMessage);
                    } catch (convertError) {
                        console.error('Error converting image:', convertError);
                        throw new Error('Failed to process image: ' + convertError.message);
                    }
                }

                // Create coin data object - only include fields that have values
                const coinData = {
                    createdAt: new Date()
                };

                // Only add properties that have values
                if (name) coinData.name = name;
                if (price) coinData.price = price;
                if (description) coinData.description = description;
                if (imageUrl) coinData.imageUrl = imageUrl;
                if (era) coinData.era = era;
                if (region) coinData.region = region;
                if (material) coinData.material = material;
                if (diameter) coinData.diameter = diameter;
                if (weight) coinData.weight = weight;
                if (date) coinData.date = date;

                console.log('Adding coin data to Firestore...');

                try {
                    // Add coin data to Firestore
                    const coinId = await addCoinToFirestore(coinData);
                    console.log('Coin added successfully with ID:', coinId);

                    // Format price for display
                    const formattedPrice = formatPrice(price);

                    // Show success message
                    // Show success message
                    showCustomPopup(`Coin "${name}" successfully added!`, 'success');
                    statusMessage.style.display = 'none';

                    // Reset form
                    uploadForm.reset();
                    imagePreview.innerHTML = '';
                } catch (error) {
                    console.error('Error adding coin to Firestore:', error);
                    throw new Error('Failed to save coin data: ' + error.message);
                }

            } catch (error) {
                console.error('Error in form submission:', error);
                showCustomPopup(error.message, 'error');
                statusMessage.style.display = 'none';
            }
        });
    }

    // Handle edit form submission
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                console.log('Edit form submitted');

                // Get form values
                const coinId = document.getElementById('editCoinId').value;
                const name = document.getElementById('editCoinName').value;
                const price = parseFloat(document.getElementById('editCoinPrice').value);
                const material = document.getElementById('editCoinMaterial').value;
                const era = document.getElementById('editCoinEra').value;
                const region = document.getElementById('editCoinRegion').value;
                const diameter = parseFloat(document.getElementById('editCoinDiameter').value);
                const weight = parseFloat(document.getElementById('editCoinWeight').value);
                const date = document.getElementById('editCoinDate').value;
                const description = document.getElementById('editCoinDescription').value;
                const imageUrl = editCoinImageUrlInput.value.trim();

                // Validate form data - only check if image URL is provided when present
                if (imageUrl) {
                    try {
                        new URL(imageUrl);
                    } catch (error) {
                        throw new Error('Please enter a valid image URL');
                    }
                } else {
                    throw new Error('Please enter an image URL');
                }

                // Show loading message
                showStatus('Updating coin...', 'loading', editStatusMessage);

                // Create updated coin data object - only include fields that have values
                const coinData = {
                    updatedAt: new Date()
                };

                // Only add properties that have values
                if (name) coinData.name = name;
                if (price) coinData.price = price;
                if (description) coinData.description = description;
                if (imageUrl) coinData.imageUrl = imageUrl;
                if (era) coinData.era = era;
                if (region) coinData.region = region;
                if (material) coinData.material = material;
                if (diameter) coinData.diameter = diameter;
                if (weight) coinData.weight = weight;
                if (date) coinData.date = date;

                console.log('Updating coin data in Firestore...');

                try {
                    // Update coin data in Firestore
                    await updateCoinInFirestore(coinId, coinData);
                    console.log('Coin updated successfully with ID:', coinId);

                    // Format price for display
                    const formattedPrice = formatPrice(price);

                    // Show success message
                    // Show success message
                    showCustomPopup(`Coin "${name}" successfully updated!`, 'success');
                    editStatusMessage.style.display = 'none';

                    // Go back to the coins list and refresh it

                    // Go back to the coins list and refresh it
                    setTimeout(() => {
                        document.getElementById('edit-form-back-btn').click();
                        loadCoinsForDeletion();
                    }, 1500);

                } catch (error) {
                    console.error('Error updating coin in Firestore:', error);
                    throw new Error('Failed to update coin data: ' + error.message);
                }

            } catch (error) {
                console.error('Error in edit form submission:', error);
                showCustomPopup(error.message, 'error');
                editStatusMessage.style.display = 'none';
            }
        });
    }

    // Add coin to Firestore
    async function addCoinToFirestore(coinData) {
        // db is imported from firebaseConfig.js
        const docRef = await addDoc(collection(db, "coins"), coinData);
        return docRef.id;
    }

    // Update coin in Firestore
    async function updateCoinInFirestore(coinId, coinData) {
        await updateDoc(doc(db, "coins", coinId), coinData);
    }

    // Format price with space between thousands
    function formatPrice(price) {
        if (price === undefined || price === null) {
            return '0.00';
        }
        return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    // Show status message
    function showStatus(message, type, statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message status-${type}`;
        statusElement.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    // Load coins for deletion and editing
    window.loadCoinsForDeletion = async function () {
        if (!coinsListForDeletion) return;

        try {
            // Show loader
            coinsListForDeletion.innerHTML = `
                <div class="loader-container">
                    <div class="loader"></div>
                </div>
            `;

            // Get coins from Firestore
            const coins = await getCoinsFromFirestore();

            if (coins.length === 0) {
                coinsListForDeletion.innerHTML = `
                    <p style="text-align: center; padding: 2rem;">No coins found in the database.</p>
                `;
                return;
            }

            // Create HTML for coins list
            let coinsHTML = '';

            coins.forEach(coin => {
                coinsHTML += `
                    <div class="coin-item" data-id="${coin.id}">
                        <div class="coin-item-info">
                            <img src="${coin.imageUrl}" alt="${coin.name}" class="coin-item-image">
                            <div class="coin-item-details">
                                <h3>${coin.name}</h3>
                                <p>R${formatPrice(coin.price)} - ${coin.era}</p>
                            </div>
                        </div>
                        <div class="coin-item-actions">
                            <button class="edit-btn" data-id="${coin.id}">Edit</button>
                            <button class="delete-btn" data-id="${coin.id}" data-name="${coin.name}">Delete</button>
                        </div>
                    </div>
                `;
            });

            // Update the coins list
            coinsListForDeletion.innerHTML = coinsHTML;

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const coinId = e.target.getAttribute('data-id');
                    const coinName = e.target.getAttribute('data-name');

                    if (confirm(`Are you sure you want to delete "${coinName}"? This action cannot be undone.`)) {
                        await deleteCoin(coinId, coinName);
                    }
                });
            });

            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const coinId = e.target.getAttribute('data-id');
                    await loadCoinForEditing(coinId);
                });
            });

        } catch (error) {
            console.error('Error loading coins for deletion:', error);
            coinsListForDeletion.innerHTML = `
                <p style="text-align: center; padding: 2rem; color: #d9534f;">
                    Error loading coins. Please try again later.
                </p>
            `;
        }
    };

    // Load a specific coin for editing
    async function loadCoinForEditing(coinId) {
        try {
            // Show loading status
            showStatus('Loading coin data...', 'loading', deleteStatusMessage);

            // Get the coin data from Firestore
            const docRef = doc(db, "coins", coinId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Coin not found');
            }

            const coin = {
                id: docSnap.id,
                ...docSnap.data()
            };

            // Populate the edit form
            document.getElementById('editCoinId').value = coin.id;
            document.getElementById('editCoinName').value = coin.name;
            document.getElementById('editCoinPrice').value = coin.price;
            document.getElementById('editCoinMaterial').value = coin.material;
            document.getElementById('editCoinEra').value = coin.era;
            document.getElementById('editCoinRegion').value = coin.region;
            document.getElementById('editCoinDiameter').value = coin.diameter;
            document.getElementById('editCoinWeight').value = coin.weight;
            document.getElementById('editCoinDate').value = coin.date || '';
            document.getElementById('editCoinDescription').value = coin.description;
            document.getElementById('editCoinImageUrl').value = coin.imageUrl;

            // Preview the image
            previewImage(coin.imageUrl, editImagePreview);

            // Hide the status message
            deleteStatusMessage.style.display = 'none';

            // Show the edit form
            document.getElementById('delete-content').style.display = 'none';
            document.getElementById('edit-content').style.display = 'block';

        } catch (error) {
            console.error('Error loading coin for editing:', error);
            showStatus(`Error: ${error.message}`, 'error', deleteStatusMessage);
        }
    }

    // Get coins from Firestore
    async function getCoinsFromFirestore() {
        const q = query(collection(db, "coins"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const coins = [];

        querySnapshot.forEach(doc => {
            coins.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return coins;
    }

    // Delete a coin
    async function deleteCoin(coinId, coinName) {

        try {
            showStatus(`Deleting coin "${coinName}"...`, 'loading', deleteStatusMessage);

            await deleteDoc(doc(db, "coins", coinId));

            // Show success message
            showStatus(`Coin "${coinName}" successfully deleted!`, 'success', deleteStatusMessage);

            // Remove the coin from the list
            const coinElement = document.querySelector(`.coin-item[data-id="${coinId}"]`);
            if (coinElement) {
                coinElement.style.opacity = '0';
                setTimeout(() => {
                    coinElement.remove();

                    // Check if there are no more coins
                    if (document.querySelectorAll('.coin-item').length === 0) {
                        coinsListForDeletion.innerHTML = `
                            <p style="text-align: center; padding: 2rem;">No coins found in the database.</p>
                        `;
                    }
                }, 300);
            }

        } catch (error) {
            console.error('Error deleting coin:', error);
            showCustomPopup(`Error deleting coin: ${error.message}`, 'error');
        }
    }
}); 