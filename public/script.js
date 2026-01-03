// Global Variables
let currentTheme = localStorage.getItem('theme') || 'light';
let items = [];
let reservations = [];
let currentUser = null;

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const itemsGrid = document.getElementById('items-grid');
const claimedGrid = document.getElementById('claimed-grid');
const activeCount = document.getElementById('active-count');
const claimedCount = document.getElementById('claimed-count');
const reportForm = document.getElementById('report-form');
const reportItemForm = document.getElementById('report-item-form');
const reservationModal = document.getElementById('reservation-modal');
const reservationForm = document.getElementById('reservation-form');
const closeModal = document.getElementById('close-modal');
const cancelReservation = document.getElementById('cancel-reservation');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

// Admin Elements
const loginSection = document.getElementById('login-section');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const adminUsernameDisplay = document.getElementById('admin-username-display');
const adminNavBtns = document.querySelectorAll('.admin-nav-btn');
const adminTabs = document.querySelectorAll('.admin-tab');
const adminItemForm = document.getElementById('admin-item-form');
const adminItemsTable = document.getElementById('admin-items-table');
const reservationsList = document.getElementById('reservations-list');
const adminSearch = document.getElementById('admin-search');
const statusFilter = document.getElementById('status-filter');
const reservationFilter = document.getElementById('reservation-filter');

// Initialize Theme
function initTheme() {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        themeToggle.textContent = 'Light Mode';
    } else {
        document.body.classList.remove('dark-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        themeToggle.textContent = 'Dark Mode';
    }
}

// Toggle Theme
function toggleTheme() {
    if (currentTheme === 'light') {
        currentTheme = 'dark';
        document.body.classList.add('dark-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        themeToggle.textContent = 'Light Mode';
    } else {
        currentTheme = 'light';
        document.body.classList.remove('dark-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        themeToggle.textContent = 'Dark Mode';
    }
    
    localStorage.setItem('theme', currentTheme);
}

// Fetch Items from API
async function fetchItems() {
    try {
        const response = await fetch('/api/items');
        if (!response.ok) throw new Error('Failed to fetch items');
        
        items = await response.json();
        renderItems();
        updateItemCounts();
        
        // Update admin dashboard if on manage page
        if (window.location.pathname.includes('manage') && currentUser) {
            renderAdminItems();
            updateAdminStats();
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        showNotification('Failed to load items. Please try again.', 'error');
    }
}

// Render Items to Grids
function renderItems(filter = '') {
    const activeItems = items.filter(item => item.status === 'active');
    const claimedItems = items.filter(item => item.status === 'claimed');
    
    // Apply search filter if provided
    const filteredActive = filter ? 
        activeItems.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.location.toLowerCase().includes(filter.toLowerCase()) ||
            item.description?.toLowerCase().includes(filter.toLowerCase())
        ) : activeItems;
    
    const filteredClaimed = filter ? 
        claimedItems.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.location.toLowerCase().includes(filter.toLowerCase()) ||
            item.description?.toLowerCase().includes(filter.toLowerCase())
        ) : claimedItems;
    
    // Render active items
    itemsGrid.innerHTML = filteredActive.length > 0 ? 
        filteredActive.map(item => createItemCard(item)).join('') :
        '<div class="no-items"><p>No active items found. Check back later!</p></div>';
    
    // Render claimed items
    claimedGrid.innerHTML = filteredClaimed.length > 0 ? 
        filteredClaimed.map(item => createItemCard(item)).join('') :
        '<div class="no-items"><p>No claimed items yet.</p></div>';
    
    // Add event listeners to claim buttons
    document.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            const item = items.find(i => i._id === itemId);
            openReservationModal(item);
        });
    });
}

// Create Item Card HTML
function createItemCard(item) {
    const isClaimed = item.status === 'claimed';
    const date = new Date(item.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    return `
        <div class="item-card ${isClaimed ? 'claimed' : ''}">
            <div class="item-header">
                <div class="item-icon">
                    <i class="${item.iconClass}"></i>
                </div>
                <div class="item-status">
                    ${isClaimed ? 'CLAIMED' : 'ACTIVE'}
                </div>
            </div>
            <div class="item-body">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-details">
                    <div class="item-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location}</span>
                    </div>
                    <div class="item-detail">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${date}</span>
                    </div>
                    ${item.description ? `
                    <div class="item-detail">
                        <i class="fas fa-info-circle"></i>
                        <span>${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="item-footer">
                <button class="claim-btn" 
                    data-item-id="${item._id}"
                    ${isClaimed ? 'disabled' : ''}>
                    ${isClaimed ? 'Already Claimed' : 'Claim This Item'}
                </button>
            </div>
        </div>
    `;
}

// Update Item Counts
function updateItemCounts() {
    const activeItems = items.filter(item => item.status === 'active');
    const claimedItems = items.filter(item => item.status === 'claimed');
    
    activeCount.textContent = activeItems.length;
    claimedCount.textContent = claimedItems.length;
}

// Search Items
function searchItems() {
    const query = searchInput.value.trim();
    renderItems(query);
}

// Open Reservation Modal
function openReservationModal(item) {
    document.getElementById('reservation-item-id').value = item._id;
    document.getElementById('reservation-item-name').value = item.name;
    reservationModal.classList.remove('hidden');
}

// Close Reservation Modal
function closeReservationModal() {
    reservationModal.classList.add('hidden');
    reservationForm.reset();
}

// Submit Reservation
async function submitReservation(e) {
    e.preventDefault();
    
    const reservationData = {
        itemId: document.getElementById('reservation-item-id').value,
        itemName: document.getElementById('reservation-item-name').value,
        fullName: document.getElementById('full-name').value,
        userType: document.getElementById('user-type').value,
        comment: document.getElementById('reservation-comment').value,
        contactInfo: document.getElementById('contact-info').value
    };
    
    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservationData)
        });
        
        if (!response.ok) throw new Error('Failed to submit reservation');
        
        const result = await response.json();
        showNotification('Reservation submitted successfully! The admin will contact you.', 'success');
        closeReservationModal();
        
        // Refresh reservations if on admin page
        if (window.location.pathname.includes('manage') && currentUser) {
            fetchReservations();
        }
    } catch (error) {
        console.error('Error submitting reservation:', error);
        showNotification('Failed to submit reservation. Please try again.', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <p>${message}</p>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else {
        notification.style.backgroundColor = '#2196f3';
    }
    
    // Add close button event
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: 15px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
}

// Page Navigation
function navigateToPage(page) {
    // Hide all sections
    sections.forEach(section => {
        if (section.id !== 'hero') {
            section.classList.add('hidden');
        }
    });
    
    // Update active nav link
    navLinks.forEach(link => {
        if (link.dataset.page === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show target section
    if (page === 'home') {
        document.getElementById('items-grid').parentElement.classList.remove('hidden');
        document.getElementById('claimed-grid').parentElement.classList.remove('hidden');
    } else if (page === 'report') {
        reportForm.classList.remove('hidden');
        // Set default date to today
        document.getElementById('item-date').valueAsDate = new Date();
    } else if (page === 'search') {
        document.getElementById('items-grid').parentElement.classList.remove('hidden');
        document.getElementById('claimed-grid').parentElement.classList.remove('hidden');
        searchInput.focus();
    }
}

// Submit Report Form (Public)
async function submitReportForm(e) {
    e.preventDefault();
    
    const itemData = {
        name: document.getElementById('item-name').value,
        iconClass: document.getElementById('item-icon').value,
        location: document.getElementById('item-location').value,
        date: document.getElementById('item-date').value,
        description: document.getElementById('item-description').value
    };
    
    try {
        // In a real app, this would require authentication
        // For now, we'll show a message
        showNotification('Item reporting is only available to administrators. Please contact the security office.', 'info');
        reportItemForm.reset();
        navigateToPage('home');
    } catch (error) {
        console.error('Error submitting report:', error);
        showNotification('Failed to submit report. Please try again.', 'error');
    }
}

// Admin Functions
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.username;
            adminUsernameDisplay.textContent = currentUser;
            loginSection.classList.add('hidden');
            dashboard.classList.remove('hidden');
            loadAdminData();
        } else {
            loginSection.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}

async function adminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        currentUser = data.username;
        adminUsernameDisplay.textContent = currentUser;
        
        loginSection.classList.add('hidden');
        dashboard.classList.remove('hidden');
        loadAdminData();
        
        showNotification('Login successful!', 'success');
        loginForm.reset();
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('login-error').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('login-error').classList.add('hidden');
        }, 3000);
    }
}

async function adminLogout() {
    try {
        await fetch('/api/admin/logout', {
            method: 'POST'
        });
        
        currentUser = null;
        loginSection.classList.remove('hidden');
        dashboard.classList.add('hidden');
        showNotification('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function switchAdminTab(tabId) {
    // Update active nav button
    adminNavBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show active tab
    adminTabs.forEach(tab => {
        if (tab.id === `${tabId}-tab`) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

async function loadAdminData() {
    await fetchItems();
    await fetchReservations();
    updateAdminStats();
    
    // Initialize chart
    if (window.Chart) {
        initCategoryChart();
    }
}

async function fetchReservations() {
    try {
        const response = await fetch('/api/reservations');
        if (!response.ok) throw new Error('Failed to fetch reservations');
        
        reservations = await response.json();
        renderReservations();
    } catch (error) {
        console.error('Error fetching reservations:', error);
    }
}

function renderReservations(filter = 'all') {
    let filteredReservations = reservations;
    
    if (filter !== 'all') {
        filteredReservations = reservations.filter(r => r.status === filter);
    }
    
    // Update pending count badge
    const pendingCount = reservations.filter(r => r.status === 'pending').length;
    document.getElementById('pending-count').textContent = pendingCount;
    
    if (filteredReservations.length === 0) {
        reservationsList.innerHTML = '<div class="no-reservations"><p>No reservations found.</p></div>';
        return;
    }
    
    reservationsList.innerHTML = filteredReservations.map(reservation => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-item">${reservation.itemName}</div>
                <div class="reservation-status status-${reservation.status}">
                    ${reservation.status.toUpperCase()}
                </div>
            </div>
            <div class="reservation-details">
                <div class="reservation-detail">
                    <span class="reservation-label">Claimant:</span>
                    <span>${reservation.fullName} (${reservation.userType})</span>
                </div>
                <div class="reservation-detail">
                    <span class="reservation-label">Contact:</span>
                    <span>${reservation.contactInfo}</span>
                </div>
                <div class="reservation-detail">
                    <span class="reservation-label">Date:</span>
                    <span>${new Date(reservation.reservationDate).toLocaleDateString()}</span>
                </div>
                ${reservation.comment ? `
                <div class="reservation-detail">
                    <span class="reservation-label">Comment:</span>
                    <span>${reservation.comment}</span>
                </div>
                ` : ''}
            </div>
            ${reservation.status === 'pending' ? `
            <div class="reservation-actions">
                <button class="btn-primary btn-sm" onclick="updateReservationStatus('${reservation._id}', 'approved')">
                    Approve
                </button>
                <button class="btn-secondary btn-sm" onclick="updateReservationStatus('${reservation._id}', 'rejected')">
                    Reject
                </button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

async function updateReservationStatus(reservationId, status) {
    try {
        const response = await fetch(`/api/reservations/${reservationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update reservation');
        
        showNotification(`Reservation ${status} successfully`, 'success');
        await fetchReservations();
        
        // If approved, update item status
        if (status === 'approved') {
            const reservation = reservations.find(r => r._id === reservationId);
            if (reservation && reservation.itemId) {
                await updateItemStatus(reservation.itemId._id, 'claimed');
            }
        }
    } catch (error) {
        console.error('Error updating reservation:', error);
        showNotification('Failed to update reservation', 'error');
    }
}

function renderAdminItems(filter = '', statusFilterValue = 'all') {
    let filteredItems = [...items];
    
    // Apply search filter
    if (filter) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.location.toLowerCase().includes(filter.toLowerCase())
        );
    }
    
    // Apply status filter
    if (statusFilterValue !== 'all') {
        filteredItems = filteredItems.filter(item => item.status === statusFilterValue);
    }
    
    if (filteredItems.length === 0) {
        adminItemsTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No items found.
                </td>
            </tr>
        `;
        return;
    }
    
    adminItemsTable.innerHTML = filteredItems.map(item => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="${item.iconClass}" style="font-size: 1.2rem;"></i>
                    <span>${item.name}</span>
                </div>
            </td>
            <td>${item.location}</td>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-${item.status}">
                    ${item.status.toUpperCase()}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-status" onclick="toggleItemStatus('${item._id}')" 
                        title="${item.status === 'active' ? 'Mark as Claimed' : 'Mark as Active'}">
                        <i class="fas fa-${item.status === 'active' ? 'check' : 'undo'}"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteItem('${item._id}')" title="Delete Item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function toggleItemStatus(itemId) {
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    
    const newStatus = item.status === 'active' ? 'claimed' : 'active';
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update item');
        
        showNotification(`Item marked as ${newStatus}`, 'success');
        await fetchItems(); // Refresh items
    } catch (error) {
        console.error('Error updating item:', error);
        showNotification('Failed to update item', 'error');
    }
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Note: You'll need to add a DELETE endpoint in server.js
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete item');
        
        showNotification('Item deleted successfully', 'success');
        await fetchItems(); // Refresh items
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Failed to delete item', 'error');
    }
}

async function updateItemStatus(itemId, status) {
    try {
        await fetch(`/api/items/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        await fetchItems(); // Refresh items
    } catch (error) {
        console.error('Error updating item status:', error);
    }
}

async function submitAdminItemForm(e) {
    e.preventDefault();
    
    const itemData = {
        name: document.getElementById('admin-item-name').value,
        iconClass: document.getElementById('admin-item-icon').value,
        location: document.getElementById('admin-item-location').value,
        date: document.getElementById('admin-item-date').value,
        status: document.getElementById('admin-item-status').value,
        description: document.getElementById('admin-item-details').value
    };
    
    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });
        
        if (!response.ok) throw new Error('Failed to add item');
        
        const result = await response.json();
        showNotification('Item added successfully', 'success');
        adminItemForm.reset();
        
        // Set default date to today
        document.getElementById('admin-item-date').valueAsDate = new Date();
        
        // Refresh items
        await fetchItems();
        
        // Switch to items tab
        switchAdminTab('items');
    } catch (error) {
        console.error('Error adding item:', error);
        showNotification('Failed to add item', 'error');
    }
}

function updateAdminStats() {
    const totalItems = items.length;
    const activeItems = items.filter(item => item.status === 'active').length;
    const claimedItems = items.filter(item => item.status === 'claimed').length;
    const totalReservations = reservations.length;
    
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('active-items').textContent = activeItems;
    document.getElementById('claimed-items').textContent = claimedItems;
    document.getElementById('total-reservations').textContent = totalReservations;
}

function initCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Count items by icon category
    const categories = {
        'Phone': items.filter(item => item.iconClass.includes('mobile')).length,
        'Wallet': items.filter(item => item.iconClass.includes('wallet')).length,
        'Keys': items.filter(item => item.iconClass.includes('key')).length,
        'ID Card': items.filter(item => item.iconClass.includes('id-card')).length,
        'Laptop': items.filter(item => item.iconClass.includes('laptop')).length,
        'Other': items.filter(item => item.iconClass.includes('question-circle')).length
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#4caf50',
                    '#2196f3',
                    '#ff9800',
                    '#9c27b0',
                    '#f44336',
                    '#795548'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize Application
function init() {
    // Set default date for forms
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('item-date')) {
        document.getElementById('item-date').value = today;
        document.getElementById('item-date').max = today;
    }
    
    if (document.getElementById('admin-item-date')) {
        document.getElementById('admin-item-date').value = today;
        document.getElementById('admin-item-date').max = today;
    }
    
    // Initialize theme
    initTheme();
    
    // Check if we're on the main page or admin page
    if (window.location.pathname.includes('manage')) {
        // Admin page initialization
        checkAdminAuth();
        
        // Event Listeners for Admin
        if (loginForm) {
            loginForm.addEventListener('submit', adminLogin);
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', adminLogout);
        }
        
        // Admin tab navigation
        adminNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                switchAdminTab(btn.dataset.tab);
            });
        });
        
        // Admin form submission
        if (adminItemForm) {
            adminItemForm.addEventListener('submit', submitAdminItemForm);
        }
        
        // Admin search and filter
        if (adminSearch) {
            adminSearch.addEventListener('input', (e) => {
                const filterValue = e.target.value;
                const statusValue = statusFilter.value;
                renderAdminItems(filterValue, statusValue);
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                const filterValue = adminSearch.value;
                const statusValue = e.target.value;
                renderAdminItems(filterValue, statusValue);
            });
        }
        
        if (reservationFilter) {
            reservationFilter.addEventListener('change', (e) => {
                renderReservations(e.target.value);
            });
        }
    } else {
        // Main page initialization
        fetchItems();
        
        // Event Listeners
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        if (searchInput) {
            searchInput.addEventListener('keyup', searchItems);
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', searchItems);
        }
        
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToPage(link.dataset.page);
            });
        });
        
        // Report form
        if (reportItemForm) {
            reportItemForm.addEventListener('submit', submitReportForm);
            
            const cancelReport = document.getElementById('cancel-report');
            if (cancelReport) {
                cancelReport.addEventListener('click', () => {
                    reportItemForm.reset();
                    navigateToPage('home');
                });
            }
        }
        
        // Reservation modal
        if (reservationForm) {
            reservationForm.addEventListener('submit', submitReservation);
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', closeReservationModal);
        }
        
        if (cancelReservation) {
            cancelReservation.addEventListener('click', closeReservationModal);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === reservationModal) {
                closeReservationModal();
            }
        });
        
        // Map modal
        const mapModal = document.getElementById('map-modal');
        const closeMap = document.querySelector('.close-map');
        const mapTriggers = document.querySelectorAll('[data-action="show-map"]');
        
        if (closeMap && mapModal) {
            closeMap.addEventListener('click', () => {
                mapModal.classList.add('hidden');
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === mapModal) {
                    mapModal.classList.add('hidden');
                }
            });
        }
        
        if (mapTriggers.length > 0) {
            mapTriggers.forEach(trigger => {
                trigger.addEventListener('click', () => {
                    mapModal.classList.remove('hidden');
                });
            });
        }
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);