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
            let adminActions = isAdminPage ? `
                <div class="admin-tools">
                    ${!isClaimed ? `<button onclick="updateStatus('${item._id}', 'claimed')" class="claim-btn">Claimed</button>` : ''}
                    <button onclick="deleteItem('${item._id}')" class="delete-btn">Delete</button>
                </div>` : '';

            card.innerHTML = `
                <div style="margin-bottom:15px;"><i class="fa-solid ${item.iconClass || 'fa-box'} fa-3x" style="color: ${isClaimed ? '#999' : '#2e7d32'};"></i></div>
                <h3>${item.name}</h3>
                <p><strong>Found at:</strong> ${item.location}</p>
                <small>${item.date}</small>
                ${adminActions}
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
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
    });
}

async function updateStatus(id, status) {
    await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status })
    });
    loadItems();
}

async function deleteItem(id) {
    if(confirm("Delete this?")) {
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        loadItems();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
    toggleBtn?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
});