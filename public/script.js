// --- 1. Load Items from Database ---
async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        const grid = document.getElementById('itemsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        items.reverse().forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div style="margin-bottom:15px;"><i class="fa-solid ${item.iconClass || 'fa-box'} fa-3x" style="color: #2e7d32;"></i></div>
                <h3>${item.name}</h3>
                <p><strong>At:</strong> ${item.location}</p>
                <small>${item.date}</small>
            `;
            grid.appendChild(card);
        });
    } catch (err) { console.error(err); }
}

// --- 2. Smart Search Logic ---
function searchItems() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let cards = document.querySelectorAll('.item-card');
    let foundCount = 0;
    const stopWords = ["i", "am", "looking", "for", "my", "at", "the"];
    let keywords = input.split(" ").filter(w => !stopWords.includes(w));

    cards.forEach(card => {
        let content = card.innerText.toLowerCase();
        let isMatch = keywords.some(word => content.includes(word));
        if (input === "" || isMatch) {
            card.style.display = "block";
            foundCount++;
        } else { card.style.display = "none"; }
    });
    document.getElementById('noResults').style.display = foundCount > 0 ? "none" : "block";
}

// --- 3. Patient AI Voice Search ---
const voiceBtn = document.getElementById('voiceSearchBtn');
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    let isListening = false;

    voiceBtn.addEventListener('click', () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            voiceBtn.classList.add('listening');
            document.getElementById('voiceStatus').style.display = 'block';
        } else { recognition.stop(); }
    });

    recognition.onresult = (event) => {
        let transcript = Array.from(event.results).map(result => result[0].transcript).join('');
        document.getElementById('searchInput').value = transcript;
        searchItems();
    };

    recognition.onend = () => {
        isListening = false;
        voiceBtn.classList.remove('listening');
        document.getElementById('voiceStatus').style.display = 'none';
    };
}

// --- 4. Dark Mode & Form Handling ---
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');

    document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

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
        if (res.ok) { alert("Success!"); form.reset(); loadItems(); }
    });
});