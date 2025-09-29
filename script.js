// Tree species growth parameters and carbon sequestration models
const treeSpecies = {
    teak: {
        name: "Teak",
        maxAge: 50,
        maxBiomass: 800, // kg per tree
        growthRate: 0.25,
        woodDensity: 0.65, // g/cm³
        carbonFraction: 0.47
    },
    pine: {
        name: "Pine",
        maxAge: 40,
        maxBiomass: 600, // kg per tree
        growthRate: 0.30,
        woodDensity: 0.45,
        carbonFraction: 0.50
    },
    oak: {
        name: "Oak",
        maxAge: 60,
        maxBiomass: 900, // kg per tree
        growthRate: 0.20,
        woodDensity: 0.72,
        carbonFraction: 0.48
    },
    eucalyptus: {
        name: "Eucalyptus",
        maxAge: 30,
        maxBiomass: 500, // kg per tree
        growthRate: 0.35,
        woodDensity: 0.55,
        carbonFraction: 0.49
    }
};

// CO2 to Carbon conversion factor
const CO2_TO_CARBON_RATIO = 3.67; // 44/12 - molecular weight ratio

let co2Chart = null;

function calculateImpact() {
    // Get input values
    const species = document.getElementById('species').value;
    const numTrees = parseInt(document.getElementById('numTrees').value);
    const years = parseInt(document.getElementById('years').value);

    // Validate inputs
    if (!species || !numTrees || !years) {
        showError('Please fill in all fields');
        return;
    }

    if (numTrees < 1 || numTrees > 100000) {
        showError('Number of trees must be between 1 and 100,000');
        return;
    }

    if (years < 1 || years > 50) {
        showError('Project duration must be between 1 and 50 years');
        return;
    }

    // Show loading, hide previous results/errors
    showLoading();
    hideResults();
    hideError();

    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
        try {
            const results = calculateCarbonSequestration(species, numTrees, years);
            displayResults(results);
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to calculate impact. Please try again.');
        } finally {
            hideLoading();
        }
    }, 100);
}

function calculateCarbonSequestration(species, numTrees, years) {
    const speciesData = treeSpecies[species];
    const results = [];
    let totalCO2 = 0;

    for (let year = 1; year <= years; year++) {
        // Calculate biomass using logistic growth model
        const biomass = calculateBiomass(year, speciesData);
        
        // Calculate carbon content
        const carbonContent = biomass * speciesData.carbonFraction; // kg carbon per tree
        
        // Convert carbon to CO2 equivalent
        const co2PerTree = carbonContent * CO2_TO_CARBON_RATIO; // kg CO2 per tree
        
        // Calculate total CO2 for all trees (convert to metric tons)
        const totalCo2ForYear = (co2PerTree * numTrees) / 1000; // metric tons
        
        totalCO2 += totalCo2ForYear;

        results.push({
            year: year,
            biomass_per_tree: Math.round(biomass * 10) / 10, // 1 decimal place
            co2_per_tree: Math.round(co2PerTree * 10) / 10, // 1 decimal place
            total_co2: Math.round(totalCO2 * 10) / 10 // cumulative total
        });
    }

    return {
        success: true,
        species: speciesData.name,
        num_trees: numTrees,
        years: years,
        final_co2: Math.round(totalCO2),
        results: results
    };
}

function calculateBiomass(age, speciesData) {
    // Logistic growth model for biomass accumulation
    // B(t) = K / (1 + A * e^(-r*t))
    // Where:
    // K = maximum biomass (carrying capacity)
    // r = growth rate
    // A = (K - B0)/B0, where B0 is initial biomass
    // t = age in years
    
    const K = speciesData.maxBiomass;
    const r = speciesData.growthRate;
    const B0 = 0.1; // Initial biomass (kg) - small sapling
    
    const A = (K - B0) / B0;
    
    // Calculate biomass using logistic growth equation
    let biomass = K / (1 + A * Math.exp(-r * age));
    
    // Ensure biomass doesn't exceed maximum and is realistic
    biomass = Math.min(biomass, K);
    
    // Apply wood density factor
    biomass *= speciesData.woodDensity;
    
    return Math.max(biomass, 0);
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Year ${context.label}: ${context.parsed.y.toLocaleString()} tons CO₂`;
                        }
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
                <td>${result.biomass_per_tree.toFixed(1)}</td>
                <td>${result.co2_per_tree.toFixed(1)}</td>
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

// Add some sample data visualization on load
document.addEventListener('DOMContentLoaded', function() {
    // You can add initialization code here if needed
    console.log('Afforestation Impact Calculator Loaded');
    
    // Optional: Add event listeners for real-time updates
    document.getElementById('species').addEventListener('change', function() {
        hideResults();
    });
    
    document.getElementById('numTrees').addEventListener('input', function() {
        hideResults();
    });
    
    document.getElementById('years').addEventListener('input', function() {
        hideResults();
    });
});