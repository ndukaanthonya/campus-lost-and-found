// --- 1. Load Items & Handle Grid Separation ---
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
            
            // Check if we are on the admin page to show controls
            const isAdminPage = window.location.pathname.includes('manage.html');
            let adminButtons = '';
            
            if (isAdminPage) {
                adminButtons = `
                    <div class="admin-tools" style="margin-top:15px; border-top:1px solid #ddd; padding-top:10px;">
                        ${!isClaimed ? `<button onclick="updateStatus('${item._id}', 'claimed')" class="claim-btn">Claimed</button>` : ''}
                        <button onclick="deleteItem('${item._id}')" class="delete-btn">Delete</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="margin-bottom:15px;"><i class="fa-solid ${item.iconClass || 'fa-box'} fa-3x" style="color: ${isClaimed ? '#999' : '#2e7d32'};"></i></div>
                <h3>${item.name} ${isClaimed ? '✅' : ''}</h3>
                <p><strong>Found at:</strong> ${item.location}</p>
                <small>${item.date}</small>
                ${adminButtons}
            `;

            if (isClaimed) {
                if (claimedGrid) claimedGrid.appendChild(card);
            } else {
                if (activeGrid) activeGrid.appendChild(card);
            }
        });
    } catch (err) { console.error("Error loading items:", err); }
}

// --- 2. Admin Actions (PATCH & DELETE) ---
async function updateStatus(id, newStatus) {
    if (!confirm("Move this item to the Claimed Archive?")) return;
    const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) loadItems();
}

async function deleteItem(id) {
    if (!confirm("Permanently delete this record?")) return;
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) loadItems();
}

// --- 3. Initializing Everything ---
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    
    // Dark Mode Toggle Logic
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');
    
    toggleBtn?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    // Form Submission for New Items
    const form = document.getElementById('lostItemForm');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('itemName').value,
            iconClass: document.getElementById('itemIcon').value,
            location: document.getElementById('location').value,
            date: document.getElementById('lostDate').value,
            details: document.getElementById('details').value
        };
        const res = await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) { form.reset(); loadItems(); alert("Item Published!"); }
    });
});