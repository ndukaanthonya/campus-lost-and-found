// Function to fetch and display items from the database
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        const grid = document.getElementById('itemsGrid');
        grid.innerHTML = ''; // Clear the grid

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p><strong>Location:</strong> ${item.location}</p>
                <p>${item.details}</p>
                <small>Date: ${item.date}</small>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading items:", err);
    }
}

// Handle Form Submission
document.getElementById('lostItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Submit button clicked! sending data...");

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
            alert("Report saved to cloud! ✅");
            document.getElementById('lostItemForm').reset();
            loadItems(); // Refresh the list
        } else {
            alert("Server error. Check terminal.");
        }
    } catch (err) {
        console.error("Connection failed:", err);
        alert("Cannot reach server. Is it running?");
    }
});

// Load items when page first opens
loadItems();