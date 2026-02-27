const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    origin: 'https://www.canyon.com',
    formFactor: 'PHONE', // PHONE, DESKTOP, TABLET
    metrics: ['largest_contentful_paint', 'cumulative_layout_shift', 'interaction_to_next_paint'],
    apiKey: process.env.CRUX_API_KEY // Ensure this is set in your environment
};

const CRUX_HISTORY_API = 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord';

// Metric Thresholds (Good, Needs Improvement)
// Anything above 'ni' upper bound is Poor.
const THRESHOLDS = {
    largest_contentful_paint: { good: 2500, ni: 4000 },
    cumulative_layout_shift: { good: 0.10, ni: 0.25 },
    interaction_to_next_paint: { good: 200, ni: 500 }
};

async function fetchCrUXHistory() {
    if (!CONFIG.apiKey) {
        console.error("❌ Error: CRUX_API_KEY environment variable is missing.");
        console.log("   Please run: export CRUX_API_KEY='YOUR_KEY'");
        // Generate mock data for demonstration if key is missing
        generateMockData();
        return;
    }

    console.log(`🚀 Fetching CrUX History for ${CONFIG.origin} (${CONFIG.formFactor})...`);

    const body = {
        origin: CONFIG.origin,
        formFactor: CONFIG.formFactor,
        metrics: CONFIG.metrics
    };

    try {
        const response = await fetch(`${CRUX_HISTORY_API}?key=${CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const json = await response.json();
        
        if (!json.record) {
            throw new Error("No record found in response.");
        }

        const processedData = processHistory(json.record);
        saveData(processedData);

    } catch (error) {
        console.error("❌ Failed:", error.message);
        process.exit(1);
    }
}

function processHistory(record) {
    const periods = record.collectionPeriods;
    const result = {
        origin: CONFIG.origin,
        formFactor: CONFIG.formFactor,
        generatedAt: new Date().toISOString(),
        periods: []
    };

    // Initialize periods with dates
    result.periods = periods.map(p => ({
        date: `${p.firstDate.year}-${String(p.firstDate.month).padStart(2, '0')}-${String(p.firstDate.day).padStart(2, '0')}`,
        label: `${p.firstDate.month}/${p.firstDate.year}`, // For charts
        metrics: {}
    }));

    // Process each metric
    for (const metricName of CONFIG.metrics) {
        const metricData = record.metrics[metricName];
        if (!metricData || !metricData.histogramTimeseries) continue;

        const bins = metricData.histogramTimeseries;
        
        // Iterate over time periods (columns)
        for (let i = 0; i < result.periods.length; i++) {
            let good = 0;
            let ni = 0;
            let poor = 0;

            // Iterate over bins (rows) to sum up densities for this period
            for (const bin of bins) {
                const density = bin.densities[i];
                if (typeof density !== 'number') continue;

                // Determine category based on bin start
                // Note: CrUX bins usually align exactly with thresholds, but we use start value to classify
                const start = Number(bin.start);
                const t = THRESHOLDS[metricName];

                if (start < t.good) {
                    good += density;
                } else if (start < t.ni) {
                    ni += density;
                } else {
                    poor += density;
                }
            }

            // Normalize to 100% (sometimes sums differ slightly due to rounding)
            const total = good + ni + poor;
            if (total > 0) {
                good = (good / total) * 100;
                ni = (ni / total) * 100;
                poor = (poor / total) * 100;
            }

            // Store in period
            // Use short names for output: lcp, cls, inp
            const shortName = getShortName(metricName);
            result.periods[i].metrics[shortName] = {
                good: parseFloat(good.toFixed(2)),
                ni: parseFloat(ni.toFixed(2)),
                poor: parseFloat(poor.toFixed(2))
            };
        }
    }

    return result;
}

function getShortName(metric) {
    if (metric === 'largest_contentful_paint') return 'lcp';
    if (metric === 'cumulative_layout_shift') return 'cls';
    if (metric === 'interaction_to_next_paint') return 'inp';
    return metric;
}

function saveData(data) {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    
    const file = path.join(dir, 'history.json');
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`✅ Data saved to ${file}`);
}

function generateMockData() {
    console.log("⚠️ Generating MOCK data for demonstration...");
    const periods = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periods.push({
            date: d.toISOString().split('T')[0],
            label: `${d.getMonth()+1}/${d.getFullYear()}`,
            metrics: {
                lcp: randomDistribution(70, 20, 10),
                cls: randomDistribution(85, 10, 5),
                inp: randomDistribution(60, 30, 10)
            }
        });
    }
    
    saveData({
        origin: CONFIG.origin,
        formFactor: CONFIG.formFactor,
        generatedAt: new Date().toISOString(),
        isMock: true,
        periods: periods
    });
}

function randomDistribution(gBase, nBase, pBase) {
    const variance = () => (Math.random() * 10) - 5;
    let g = Math.max(0, gBase + variance());
    let n = Math.max(0, nBase + variance());
    let p = Math.max(0, pBase + variance());
    const total = g + n + p;
    return {
        good: parseFloat((g / total * 100).toFixed(2)),
        ni: parseFloat((n / total * 100).toFixed(2)),
        poor: parseFloat((p / total * 100).toFixed(2))
    };
}

fetchCrUXHistory();
