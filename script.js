// Replace with your actual Colab ngrok URL
const COLAB_API_URL = 'https://your-ngrok-url.ngrok-free.app/predict';

let co2Chart = null;

async function calculateImpact() {
    // Get input values
    const species = document.getElementById('species').value;
    const numTrees = parseInt(document.getElementById('numTrees').value);
    const years = parseInt(document.getElementById('years').value);

    // Validate inputs
    if (!species || !numTrees || !years) {
        showError('Please fill in all fields');
        return;
    }

    // Show loading, hide previous results/errors
    showLoading();
    hideResults();
    hideError();

    try {
        // Call Colab API
        const response = await fetch(COLAB_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                species: species,
                num_trees: numTrees,
                years: years
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            displayResults(data);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }

    } catch (error) {
        console.error('Error:', error);
        showError('Failed to calculate impact. Please try again later.');
    } finally {
        hideLoading();
    }
}

function displayResults(data) {
    // Update total CO2
    document.getElementById('totalCo2').textContent = 
        Math.round(data.final_co2).toLocaleString();
    document.getElementById('resultYears').textContent = data.years;

    // Create chart
    createChart(data.results);

    // Create table
    createTable(data.results);

    // Show results section
    showResults();
}

function createChart(results) {
    const ctx = document.getElementById('co2Chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (co2Chart) {
        co2Chart.destroy();
    }

    const years = results.map(r => r.year);
    const cumulativeCO2 = results.map(r => r.total_co2);

    co2Chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Cumulative CO₂ Sequestered (tons)',
                data: cumulativeCO2,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO₂ (metric tons)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                }
            }
        }
    });
}

function createTable(results) {
    const tableContainer = document.getElementById('breakdownTable');
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Biomass per Tree (kg)</th>
                    <th>CO₂ per Tree (kg)</th>
                    <th>Total CO₂ (tons)</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(result => {
        tableHTML += `
            <tr>
                <td>${result.year}</td>
                <td>${result.biomass_per_tree}</td>
                <td>${result.co2_per_tree}</td>
                <td>${result.total_co2.toLocaleString()}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
}

// UI Helper functions
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

// Initialize with some default values or example
document.addEventListener('DOMContentLoaded', function() {
    // You can add any initialization code here
});