// Quick script to check MetricActions table
// Run this in browser console at http://localhost:5173

async function checkMetricActions() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('SoccerStatsDB', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const metricActions = await db.transaction('metricActions', 'readonly').objectStore('metricActions').getAll();
  
  console.log('=== MetricActions Table ===');
  console.log(`Total records: ${metricActions.length}`);
  
  if (metricActions.length === 0) {
    console.log('⚠️ MetricActions table is EMPTY');
    console.log('\nThis is why action buttons might not be showing!');
    console.log('The table needs to be populated based on metric.requiredActions arrays.');
  } else {
    console.table(metricActions);
  }
  
  // Also check metrics to see their requiredActions
  const metrics = await db.transaction('metrics', 'readonly').objectStore('metrics').getAll();
  console.log('\n=== Metrics with requiredActions ===');
  metrics.forEach(m => {
    console.log(`Metric ID ${m.id} (${m.name}): requiredActions = [${m.requiredActions?.join(', ') || 'none'}]`);
  });
  
  db.close();
}

checkMetricActions();





