// --- 1. Load Items & Sort by Status ---
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
            
            // Add Admin Controls if we are on manage.html
            const isAdmin = window.location.pathname.includes('manage.html');
            let adminHTML = '';
            
            if (isAdmin) {
                adminHTML = `
                    <div class="admin-tools" style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                        ${!isClaimed ? `<button onclick="updateStatus('${item._id}', 'claimed')" style="background:#2e7d32; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;">Mark Claimed</button>` : ''}
                        <button onclick="deleteItem('${item._id}')" style="background:#d32f2f; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Delete</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="margin-bottom:15px;"><i class="fa-solid ${item.iconClass || 'fa-box'} fa-3x" style="color: ${isClaimed ? '#666' : '#2e7d32'};"></i></div>
                <h3>${item.name} ${isClaimed ? '(Claimed ✅)' : ''}</h3>
                <p><strong>At:</strong> ${item.location}</p>
                <small>${item.date}</small>
                ${adminHTML}
            `;

            if (isClaimed) {
                if (claimedGrid) claimedGrid.appendChild(card);
            } else {
                if (activeGrid) activeGrid.appendChild(card);
            }
        });
    } catch (err) { console.error(err); }
}

// --- 2. Admin Actions: Update Status ---
async function updateStatus(id, newStatus) {
    if (!confirm("Mark this item as successfully claimed?")) return;
    try {
        await fetch(`/api/items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        loadItems(); // Refresh view
    } catch (err) { alert("Error updating item"); }
}

// --- 3. Admin Actions: Delete (Trash Can) ---
async function deleteItem(id) {
    if (!confirm("Are you sure you want to permanently delete this record?")) return;
    try {
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        loadItems(); // Refresh view
    } catch (err) { alert("Error deleting item"); }
}

// --- 2. Smart Search Logic ---
function searchItems() {
    let input = document.getElementById('searchInput').value.toLowerCase().trim();
    let cards = document.querySelectorAll('.item-card');
    let noResults = document.getElementById('noResults');
    let foundCount = 0;

    const stopWords = ["i", "am", "looking", "for", "my", "at", "the", "with", "a"];
    let keywords = input.split(/\s+/).filter(word => !stopWords.includes(word) && word.length > 0);

    cards.forEach(card => {
        let content = card.innerText.toLowerCase();
        // If search is empty, show all. If not, check if any keyword matches content.
        let isMatch = keywords.length === 0 || keywords.some(word => content.includes(word));
        
        if (isMatch) {
            card.style.display = "block";
            foundCount++;
        } else {
            card.style.display = "none";
        }
    });

    if (noResults) noResults.style.display = foundCount > 0 ? "none" : "block";
}

// --- 3. Patient AI Voice Search ---
function initVoiceSearch() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    const searchInput = document.getElementById('searchInput');

    if (voiceBtn && 'webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        let isListening = false;

        voiceBtn.onclick = () => {
            if (!isListening) {
                try {
                    recognition.start();
                    isListening = true;
                    voiceBtn.classList.add('listening');
                    if (voiceStatus) voiceStatus.style.display = 'block';
                } catch (e) { console.log("Recognition already started"); }
            } else {
                recognition.stop();
            }
        };

        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            if (searchInput) {
                searchInput.value = transcript;
                searchItems();
            }
        };

        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.remove('listening');
            if (voiceStatus) voiceStatus.style.display = 'none';
        };
    }
}

// --- 4. Initialization & Form Handling ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Load Data
    loadItems();
    initVoiceSearch();

    // B. Dark Mode Logic
    const body = document.body;
    const toggleBtn = document.getElementById('dark-mode-toggle');
    
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-theme');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const isDark = body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            toggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    }

    // C. Form Submission (Fixes the Refresh Problem)
    const lostItemForm = document.getElementById('lostItemForm');
    if (lostItemForm) {
        lostItemForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // <--- CRITICAL FIX: Stops page reload

            const submitBtn = lostItemForm.querySelector('button');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Publishing...";
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById('itemName').value,
                iconClass: document.getElementById('itemIcon').value,
                location: document.getElementById('location').value,
                date: document.getElementById('lostDate').value,
                details: document.getElementById('details').value
            };

            try {
                const res = await fetch('/api/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (res.ok) {
                    alert("🎉 Item published successfully!");
                    lostItemForm.reset();
                    loadItems(); // Refresh the grid
                } else {
                    alert("Error saving item.");
                }
            } catch (err) {
                console.error("Submission Error:", err);
                alert("Server error. Please try again later.");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});