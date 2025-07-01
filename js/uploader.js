// Import Firebase functions
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
                const imageUrl = coinImageUrlInput.value.trim();
                
                // Validate form data
                if (!imageUrl) {
                    throw new Error('Please enter a valid image URL');
                }
                
                try {
                    new URL(imageUrl);
                } catch (error) {
                    throw new Error('Please enter a valid image URL');
                }
                
                // Show loading message
                showStatus('Saving coin...', 'loading', statusMessage);
                
                // Create coin data object
                const coinData = {
                    name,
                    price,
                    description,
                    imageUrl,
                    era,
                    region,
                    material,
                    diameter,
                    weight,
                    date,
                    createdAt: new Date()
                };
                
                console.log('Adding coin data to Firestore...');
                
                try {
                    // Add coin data to Firestore
                    const coinId = await addCoinToFirestore(coinData);
                    console.log('Coin added successfully with ID:', coinId);
                    
                    // Format price for display
                    const formattedPrice = formatPrice(price);
                    
                    // Show success message
                    showStatus(`Coin "${name}" (R${formattedPrice}) successfully added!`, 'success', statusMessage);
                    
                    // Reset form
                    uploadForm.reset();
                    imagePreview.innerHTML = '';
                } catch (error) {
                    console.error('Error adding coin to Firestore:', error);
                    throw new Error('Failed to save coin data: ' + error.message);
                }
                
            } catch (error) {
                console.error('Error in form submission:', error);
                showStatus(`Error: ${error.message}`, 'error', statusMessage);
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
                
                // Validate form data
                if (!imageUrl) {
                    throw new Error('Please enter a valid image URL');
                }
                
                try {
                    new URL(imageUrl);
                } catch (error) {
                    throw new Error('Please enter a valid image URL');
                }
                
                // Show loading message
                showStatus('Updating coin...', 'loading', editStatusMessage);
                
                // Create updated coin data object
                const coinData = {
                    name,
                    price,
                    description,
                    imageUrl,
                    era,
                    region,
                    material,
                    diameter,
                    weight,
                    date,
                    updatedAt: new Date()
                };
                
                console.log('Updating coin data in Firestore...');
                
                try {
                    // Update coin data in Firestore
                    await updateCoinInFirestore(coinId, coinData);
                    console.log('Coin updated successfully with ID:', coinId);
                    
                    // Format price for display
                    const formattedPrice = formatPrice(price);
                    
                    // Show success message
                    showStatus(`Coin "${name}" (R${formattedPrice}) successfully updated!`, 'success', editStatusMessage);
                    
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
                showStatus(`Error: ${error.message}`, 'error', editStatusMessage);
            }
        });
    }
    
    // Add coin to Firestore
    async function addCoinToFirestore(coinData) {
        if (!window.firebaseDb) {
            console.error('Firestore not initialized');
            throw new Error('Firestore not initialized. Please check Firebase configuration.');
        }
        
        const db = window.firebaseDb;
        const docRef = await addDoc(collection(db, "coins"), coinData);
        return docRef.id;
    }
    
    // Update coin in Firestore
    async function updateCoinInFirestore(coinId, coinData) {
        if (!window.firebaseDb) {
            console.error('Firestore not initialized');
            throw new Error('Firestore not initialized');
        }
        
        const db = window.firebaseDb;
        await updateDoc(doc(db, "coins", coinId), coinData);
    }
    
    // Format price with space between thousands
    function formatPrice(price) {
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
    window.loadCoinsForDeletion = async function() {
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
            const db = window.firebaseDb;
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
        if (!window.firebaseDb) {
            console.error('Firestore not initialized');
            throw new Error('Firestore not initialized');
        }
        
        const db = window.firebaseDb;
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
        if (!window.firebaseDb) {
            console.error('Firestore not initialized');
            throw new Error('Firestore not initialized');
        }
        
        try {
            showStatus(`Deleting coin "${coinName}"...`, 'loading', deleteStatusMessage);
            
            const db = window.firebaseDb;
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
            showStatus(`Error deleting coin: ${error.message}`, 'error', deleteStatusMessage);
        }
    }
}); 