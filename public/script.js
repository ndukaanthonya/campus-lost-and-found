document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    if (window.location.pathname.includes('manage.html')) {
        loadReservations();
    }
    setupDarkMode();
});

// --- DARK MODE ---
function setupDarkMode() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
    
    toggleBtn?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
}

// --- DATA LOADING ---
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        const activeGrid = document.getElementById('itemsGrid');
        const claimedGrid = document.getElementById('claimedGrid');
        
        if (activeGrid) activeGrid.innerHTML = '';
        if (claimedGrid) claimedGrid.innerHTML = '';

        items.reverse().forEach(item => {
            const isClaimed = item.status === 'claimed';
            const isAdminPage = window.location.pathname.includes('manage.html');
            const card = document.createElement('div');
            card.className = 'item-card';
            
            let actionButtons = '';
            if (isAdminPage) {
                actionButtons = `
                    <div class="admin-tools" style="margin-top:10px;">
                        ${!isClaimed ? `<button onclick="updateStatus('${item._id}', 'claimed')" class="claim-btn">Claimed</button>` : ''}
                        <button onclick="deleteItem('${item._id}')" class="delete-btn">Delete</button>
                    </div>`;
            } else if (!isClaimed) {
                actionButtons = `<button class="claim-btn" style="width:100%; margin-top:10px; background-color:#2e7d32;" onclick="openModal('${item._id}', '${item.name}')">Reserve Item</button>`;
            }

            card.innerHTML = `
                <div style="margin-bottom:15px;"><i class="fa-solid ${item.iconClass || 'fa-box'} fa-3x" style="color: ${isClaimed ? '#999' : '#2e7d32'};"></i></div>
                <h3>${item.name}</h3>
                <p><strong>Found at:</strong> ${item.location}</p>
                <small>${item.date}</small>
                ${actionButtons}
            `;

            if (isClaimed) claimedGrid?.appendChild(card);
            else activeGrid?.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

// --- SEARCH ---
function searchItems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const activeCards = document.querySelectorAll('#itemsGrid .item-card');
    activeCards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
    });
}

// --- RESERVATION MODAL ---
function openModal(id, name) {
    document.getElementById('reserveModal').style.display = 'flex';
    document.getElementById('modalItemName').innerText = name;
    document.getElementById('resItemId').value = id;
    document.getElementById('resItemTitle').value = name;
}

function closeModal() { document.getElementById('reserveModal').style.display = 'none'; }

document.getElementById('reserveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        itemId: document.getElementById('resItemId').value,
        itemName: document.getElementById('resItemTitle').value,
        fullName: document.getElementById('resFullName').value,
        email: document.getElementById('resEmail').value,
        phone: document.getElementById('resPhone').value,
        userType: document.getElementById('resUserType').value,
        comment: document.getElementById('resComment').value
    };

    const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    if (res.ok) { 
        alert('Success! Admin will review your request.'); 
        closeModal(); 
        document.getElementById('reserveForm').reset();
    }
});

// --- ADMIN: LOAD RESERVATIONS ---
async function loadReservations() {
    const resList = document.getElementById('reservationList');
    if (!resList) return;
    const response = await fetch('/api/reservations');
    const data = await response.json();
    resList.innerHTML = data.map(r => `
        <div class="item-card" style="text-align:left; border-left:5px solid #2e7d32; padding:15px; margin-bottom:10px;">
            <h4>Item: ${r.itemName}</h4>
            <p><strong>Sender:</strong> ${r.fullName} (${r.userType})</p>
            <p><strong>Contact:</strong> ${r.phone}</p>
            <p><strong>Message:</strong> ${r.comment}</p>
        </div>
    `).join('');
}