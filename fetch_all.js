#!/usr/bin/env node
/**
 * Fetch CrUX data for all manufacturers
 * Run: node fetch_all.js
 * Or: CRUX_API_KEY=xxx node fetch_all.js
 */

const fs = require('fs');
const path = require('path');

const CRUX_HISTORY_API = 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord';

const THRESHOLDS = {
    largest_contentful_paint: { good: 2500, ni: 4000 },
    cumulative_layout_shift: { good: 0.10, ni: 0.25 },
    interaction_to_next_paint: { good: 200, ni: 500 }
};

const MANUFACTURERS = [
    { name: 'CANYON', origin: 'https://www.canyon.com', filePrefix: 'history' },
    { name: 'SPECIALIZED', origin: 'https://www.specialized.com', filePrefix: 'specialized' },
    { name: 'ROSE', origin: 'https://www.rosebikes.de', filePrefix: 'rose' }
];

const DEVICES = ['PHONE', 'DESKTOP'];

async function fetchAll() {
    const apiKey = process.env.CRUX_API_KEY;
    
    if (!apiKey) {
        console.error('❌ CRUX_API_KEY not set. Please export CRUX_API_KEY=your_key');
        process.exit(1);
    }

    console.log('🚀 Starting CrUX data fetch for all manufacturers...\n');
    
    const results = [];
    
    for (const mfg of MANUFACTURERS) {
        for (const device of DEVICES) {
            const outputFile = path.join(__dirname, 'data', `${mfg.filePrefix}-${device.toLowerCase()}.json`);
            
            try {
                console.log(`📊 Fetching ${mfg.name} (${device})...`);
                const data = await fetchCrUX(mfg.origin, device, apiKey);
                saveData(data, outputFile);
                console.log(`   ✅ Saved to ${outputFile}`);
                results.push({ mfg: mfg.name, device, status: 'success' });
            } catch (err) {
                console.error(`   ❌ Failed: ${err.message}`);
                results.push({ mfg: mfg.name, device, status: 'error', error: err.message });
            }
        }
    }
    
    console.log('\n--- Summary ---');
    const success = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    console.log(`Success: ${success}/${results.length}, Failed: ${failed}/${results.length}`);
    
    if (failed > 0) {
        process.exit(1);
    }
}

async function fetchCrUX(origin, formFactor, apiKey) {
    const body = {
        origin: origin,
        formFactor: formFactor,
        metrics: ['largest_contentful_paint', 'cumulative_layout_shift', 'interaction_to_next_paint']
    };
    
    const response = await fetch(`${CRUX_HISTORY_API}?key=${apiKey}`, {
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
        throw new Error('No record found in response');
    }
    
    return processHistory(json.record, origin, formFactor);
}

function processHistory(record, origin, formFactor) {
    const periods = record.collectionPeriods;
    const result = {
        origin: origin,
        formFactor: formFactor,
        generatedAt: new Date().toISOString(),
        periods: []
    };
    
    result.periods = periods.map(p => ({
        date: `${p.firstDate.year}-${String(p.firstDate.month).padStart(2, '0')}-${String(p.firstDate.day).padStart(2, '0')}`,
        label: `${p.firstDate.month}/${p.firstDate.year}`,
        metrics: {}
    }));
    
    for (const metricName of ['largest_contentful_paint', 'cumulative_layout_shift', 'interaction_to_next_paint']) {
        const metricData = record.metrics[metricName];
        if (!metricData || !metricData.histogramTimeseries) continue;
        
        const bins = metricData.histogramTimeseries;
        
        for (let i = 0; i < result.periods.length; i++) {
            let good = 0, ni = 0, poor = 0;
            
            for (const bin of bins) {
                const density = bin.densities[i];
                if (typeof density !== 'number') continue;
                
                const start = Number(bin.start);
                const t = THRESHOLDS[metricName];
                
                if (start < t.good) good += density;
                else if (start < t.ni) ni += density;
                else poor += density;
            }
            
            const total = good + ni + poor;
            if (total > 0) {
                good = (good / total) * 100;
                ni = (ni / total) * 100;
                poor = (poor / total) * 100;
            }
            
            const shortName = metricName === 'largest_contentful_paint' ? 'lcp' :
                              metricName === 'cumulative_layout_shift' ? 'cls' : 'inp';
            
            result.periods[i].metrics[shortName] = {
                good: parseFloat(good.toFixed(2)),
                ni: parseFloat(ni.toFixed(2)),
                poor: parseFloat(poor.toFixed(2))
            };
        }
    }
    
    return result;
}

function saveData(data, outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
}

fetchAll();
