// 1. Function to fetch and display items from the database
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        const grid = document.getElementById('itemsGrid');
        
        if (!grid) return; // Safety check
        grid.innerHTML = ''; // Clear the grid before loading

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="status">Reported</div>
                <h3>${item.name}</h3>
                <p><strong>Location:</strong> ${item.location}</p>
                <p>${item.details || 'No extra details'}</p>
                <small>Date: ${item.date}</small>
                <br><br>
                <button onclick="claimItem('${item.name}')">I Found This!</button>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading items:", err);
    }
}

// 2. Handle Form Submission and DOM Loading
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of items from database
    loadItems();

    const form = document.getElementById('lostItemForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            console.log("Submit button clicked! Processing...");

            const formData = {
                name: document.getElementById('itemName').value,
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
                    alert("Report Submitted Successfully! ✅");
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

// 4. Function to handle claiming an item
function claimItem(itemName) {
    alert(`Thank you! A notification has been sent regarding the "${itemName}". Please check your campus email for meeting details.`);
}