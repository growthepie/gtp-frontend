import { useEffect, useCallback } from 'react';

// Separate the chart update logic into reusable functions
const updatePieChart = (chart, matchedName) => {
    if (!chart) return;
    
    const series = chart.series[0];
    if (!series) return;

    // Reset previous states
    series.points.forEach(point => point.setState(''));
    
    if (matchedName) {
        const matchedPoint = series.points.find(point => point.name === matchedName);
        if (matchedPoint) {
            matchedPoint.setState('hover');
            chart.tooltip.refresh(matchedPoint);
        }
    } else {
        chart.tooltip.hide();
    }
};

const updateAreaChart = (chart, matchedName) => {
    if (!chart) return;
    
    const series = chart.series;
    if (!series?.length) return;

    series.forEach(s => {
        console.log(s.name, matchedName);
        const opacity = !matchedName || s.name === matchedName ? 1.0 : 0.5;
        s.update({ type: s.type, opacity }, false); // Batch updates
        

    });
    
    // Single redraw after all updates
    chart.redraw();
};

// Custom hook for chart synchronization
const useChartSync = (pieChartRef, chartRef, hoverChain, getNameFromKey) => {
    const updateCharts = useCallback(() => {
        const matchedName = hoverChain ? getNameFromKey[hoverChain] : null;
        
        updatePieChart(pieChartRef.current, matchedName);
        updateAreaChart(chartRef.current, matchedName);
    }, [hoverChain, getNameFromKey]);

    useEffect(() => {
        updateCharts();
        
        // Optional: Add cleanup function
        return () => {
            if (pieChartRef.current) {
                pieChartRef.current.tooltip.hide();
            }
            if (chartRef.current) {
                chartRef.current.tooltip.hide();
            }
        };
    }, [updateCharts]);
};

export default useChartSync;