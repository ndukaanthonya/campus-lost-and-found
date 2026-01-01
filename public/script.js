document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('lostItemForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // This will work now because the script waited for the HTML
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
                    form.reset(); // Clears the form without refreshing the whole page
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

// Your search function for the bottom section
function searchItems() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.querySelectorAll('.item-card');
    let noResults = document.getElementById('noResults');
    let found = false;

    cards.forEach(card => {
        let title = card.querySelector('h3').innerText.toLowerCase();
        if (title.includes(input)) {
            card.style.display = "block";
            found = true;
        } else {
            card.style.display = "none";
        }
    });

    noResults.style.display = found ? "none" : "block";
}