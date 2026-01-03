document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    if (window.location.pathname.includes('manage.html')) {
        loadReservations();
    }
    
    // Dark Mode Toggle Logic
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
    toggleBtn?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
});

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
            const card = document.createElement('div');
            card.className = 'item-card';
            
            const isAdminPage = window.location.pathname.includes('manage.html');
            let actionButtons = isAdminPage ? `
                <div class="admin-tools">
                    ${!isClaimed ? `<button onclick="updateStatus('${item._id}', 'claimed')" class="claim-btn">Mark Claimed</button>` : ''}
                    <button onclick="deleteItem('${item._id}')" class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>` : 
                (!isClaimed ? `<button onclick="openModal('${item._id}', '${item.name}')" class="claim-btn" style="width:100%; margin-top:10px;">Reserve Item</button>` : '');

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

function searchItems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const activeCards = document.querySelectorAll('#itemsGrid .item-card');
    activeCards.forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(query) ? "block" : "none";
    });
}

// Admin Actions
async function updateStatus(id, status) {
    await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status })
    });
    loadItems();
}

async function deleteItem(id) {
    if(confirm("Delete this item permanently?")) {
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        loadItems();
    }
}

// Intake Form Submission
document.getElementById('lostItemForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemData = {
        name: document.getElementById('itemName').value,
        location: document.getElementById('location').value,
        date: document.getElementById('lostDate').value,
        iconClass: document.getElementById('itemIcon').value,
        details: document.getElementById('details').value
    };

    const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });

    if (res.ok) {
        alert("Item Published!");
        document.getElementById('lostItemForm').reset();
        loadItems();
    }
});

// Modal Logic
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
        alert("Reservation Request Sent!");
        closeModal();
    }
});

async function loadReservations() {
    const list = document.getElementById('reservationList');
    if(!list) return;
    const res = await fetch('/api/reservations');
    const data = await res.json();
    list.innerHTML = data.map(r => `
        <div class="item-card" style="text-align:left; border-left:5px solid #2e7d32;">
            <h4 style="color:#2e7d32">Item: ${r.itemName}</h4>
            <p><strong>From:</strong> ${r.fullName} (${r.userType})</p>
            <p><strong>Contact:</strong> ${r.phone} | ${r.email}</p>
            <p><strong>Message:</strong> ${r.comment}</p>
            <small>${new Date(r.dateSent).toLocaleString()}</small>
        </div>
    `).join('');
}