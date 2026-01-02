// --- 1. INITIALIZATION (Runs when page loads) ---
document.addEventListener('DOMContentLoaded', () => {
    loadItems(); // Load the found items
    if (window.location.pathname.includes('manage.html')) {
        loadReservations(); // Only load reservations if on Admin page
    }
    setupDarkMode(); // Start the Dark Mode logic
    setupVoiceSearch(); // Start the AI Voice logic
});

// --- 2. DARK MODE LOGIC ---
function setupDarkMode() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    
    // Check if user previously chose dark mode
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    toggleBtn?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// --- 3. AI VOICE SEARCH LOGIC ---
function setupVoiceSearch() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    const searchInput = document.getElementById('searchInput');

    // Check if the browser supports Voice
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        voiceBtn.addEventListener('click', () => {
            recognition.start();
            voiceStatus.style.display = 'block'; // Show "AI is listening"
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript;
            searchItems(); // Filter the items immediately
            voiceStatus.style.display = 'none';
        };

        recognition.onend = () => { voiceStatus.style.display = 'none'; };
    }
}

// --- 4. DATA LOADING (Items & Reservations) ---
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
                    <div class="admin-tools">
                        ${!isClaimed ? `<button onclick="updateStatus('${item._id}', 'claimed')" class="claim-btn">Claimed</button>` : ''}
                        <button onclick="deleteItem('${item._id}')" class="delete-btn">Delete</button>
                    </div>`;
            } else if (!isClaimed) {
                actionButtons = `<button class="claim-btn" style="width:100%; margin-top:10px;" onclick="openModal('${item._id}', '${item.name}')">Reserve Item</button>`;
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

// --- 5. SEARCH LOGIC ---
function searchItems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const activeCards = document.querySelectorAll('#itemsGrid .item-card');
    activeCards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? "block" : "none";
    });
}

// --- 6. MODAL CONTROL ---
function openModal(id, name) {
    document.getElementById('reserveModal').style.display = 'flex';
    document.getElementById('modalItemName').innerText = name;
    document.getElementById('resItemId').value = id;
    document.getElementById('resItemTitle').value = name;
}

function closeModal() { document.getElementById('reserveModal').style.display = 'none'; }