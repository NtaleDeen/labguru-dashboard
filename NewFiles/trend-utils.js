// trend-utils.js - Updated to match revenue.js arrow style exactly

export function getTrendDirection(metricType, currentValue, previousValue) {
    // For debugging
    console.log(`Trend direction - Type: ${metricType}, Current: ${currentValue}, Previous: ${previousValue}`);
    
    // Handle cases where we can't determine trend
    if (previousValue === 0 || currentValue === null || previousValue === null) {
        return 'neutral';
    }
    
    const isImprovement = currentValue > previousValue;
    
    switch (metricType) {
        case 'revenue':
        case 'onTime':
        case 'tests':
            // Higher values are better - green up arrow
            return isImprovement ? 'positive' : 'negative';
            
        case 'delays':
        case 'notUploaded':
        case 'errors':
            // Lower values are better - green down arrow  
            return isImprovement ? 'negative' : 'positive';
            
        default:
            // Default: higher is better
            return isImprovement ? 'positive' : 'negative';
    }
}

export function calculateTrendPercentage(currentValue, previousValue) {
    if (previousValue === 0 || currentValue === null || previousValue === null) {
        return 0;
    }
    
    const change = currentValue - previousValue;
    const percentage = (change / Math.abs(previousValue)) * 100;
    
    // Handle very small numbers and rounding
    return Math.abs(percentage) < 0.01 ? 0 : Number(percentage.toFixed(1));
}

export function updateTrend(elementId, percentage, direction) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Trend element not found: ${elementId}`);
        return;
    }

    // Clear loading state
    element.classList.remove('loading');
    
    if (percentage === 0 || isNaN(percentage)) {
        element.textContent = "→ 0%";
        element.className = "kpi-trend trend-neutral";
        return;
    }

    // MATCH REVENUE.JS STYLE EXACTLY
    const arrow = direction === 'positive' ? '↑' : '↓';
    const absPercentage = Math.abs(percentage);
    
    element.textContent = `${arrow} ${absPercentage.toFixed(1)}%`;
    element.className = `kpi-trend trend-${direction}`;
}

export function setTrendLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = "Loading...";
        element.className = "kpi-trend loading";
    }
}