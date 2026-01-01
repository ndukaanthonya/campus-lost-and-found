// 1. Function to fetch and display items from the database
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        const grid = document.getElementById('itemsGrid');
        
        if (!grid) return; // Safety check
        grid.innerHTML = ''; // Clear the grid before loading

        items.reverse().forEach(item => { // .reverse() shows the newest items first
            const card = document.createElement('div');
            card.className = 'item-card';
            
            // This builds the card using the Icon Class you selected in manage.html
            card.innerHTML = `
                <div class="card-header" style="text-align: center; padding: 15px;">
                    <i class="fa-solid ${item.iconClass || 'fa-box'} fa-3x" style="color: #2e7d32;"></i>
                </div>
                <div class="card-body" style="text-align: center;">
                    <h3>${item.name}</h3>
                    <p><strong>Found at:</strong> ${item.location}</p>
                    <small>Date: ${item.date}</small>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading items:", err);
    }
}

// 2. Handle Form Submission and Page Loading
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of items from database
    loadItems();

    const form = document.getElementById('lostItemForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            console.log("Submit button clicked! Processing...");

            // Grabbing all data including the Font Awesome icon class
            const formData = {
                name: document.getElementById('itemName').value,
                iconClass: document.getElementById('itemIcon').value, 
                location: document.getElementById('location').value,
                date: document.getElementById('lostDate').value,
                details: document.getElementById('details').value
            };

            try {
                const response = await fetch('/api/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert("Item Logged Successfully! ✅");
                    form.reset(); 
                    loadItems(); // Refresh the list automatically
                } else {
                    alert("Error submitting report. ❌");
                }
            } catch (error) {
                console.error("Fetch error:", error);
                alert("Could not connect to the server.");
            }
        });
    }
});

// 3. Smart Search Function
function searchItems() {
    let input = document.getElementById('searchInput').value.toLowerCase().trim();
    let cards = document.querySelectorAll('.item-card');
    let noResults = document.getElementById('noResults');
    let foundCount = 0;

    // Split input into keywords for "Smart Matching"
    let keywords = input.split(" ");

    cards.forEach(card => {
        let title = card.querySelector('h3').innerText.toLowerCase();
        let details = card.querySelector('p').innerText.toLowerCase();
        
        // Smart Logic: Does the item match ANY of the keywords?
        let isMatch = keywords.some(keyword => title.includes(keyword) || details.includes(keyword));

        if (input === "" || isMatch) {
            card.style.display = "block";
            foundCount++;
        } else {
            card.style.display = "none";
        }
    });

    if (noResults) {
        noResults.style.display = foundCount > 0 ? "none" : "block";
    }
}
const toggleBtn = document.getElementById('dark-mode-toggle');
const body = document.body;

// Check if user previously chose dark mode
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-theme');
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        
        // Save the choice so it stays dark even if they refresh
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>'; // Change icon to Sun
        } else {
            localStorage.setItem('theme', 'light');
            toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>'; // Change icon to Moon
        }
    });
}
// AI Voice Search Implementation
const voiceBtn = document.getElementById('voiceSearchBtn');
const voiceStatus = document.getElementById('voiceStatus');
const searchInput = document.getElementById('searchInput');

if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.classList.add('listening');
        voiceStatus.style.display = 'block';
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // The AI removes punctuation and fills the search bar
        searchInput.value = transcript.replace('.', ''); 
        
        voiceBtn.classList.remove('listening');
        voiceStatus.style.display = 'none';
        
        // Trigger the search automatically
        searchItems(); 
    };

    recognition.onerror = () => {
        voiceBtn.classList.remove('listening');
        voiceStatus.style.display = 'none';
        alert("Voice recognition error. Please try again.");
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
        voiceStatus.style.display = 'none';
    };
} else {
    voiceBtn.style.display = 'none'; // Hide if browser doesn't support it
    console.log("Speech recognition not supported in this browser.");
}