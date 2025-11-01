import React, { useState, useEffect } from 'react';
import type { Metric } from '../types';
import { useDB } from '../hooks/useDB';

interface MetricSelectorProps {
  selectedMetrics: number[];
  onMetricsChange: (metricIds: number[]) => void;
}

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  selectedMetrics,
  onMetricsChange
}) => {
  const { getMetrics, isReady } = useDB();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (isReady) {
      getMetrics().then(setMetrics);
    }
  }, [isReady, getMetrics]);

  const categories = ['All', ...Array.from(new Set(metrics.map(m => m.category)))];

  const filteredMetrics = selectedCategory === 'All' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  const handleMetricToggle = (metricId: number) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter(id => id !== metricId));
    } else {
      onMetricsChange([...selectedMetrics, metricId]);
    }
  };

  if (!isReady) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Select Metrics to Track
      </h2>
      
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredMetrics.map(metric => (
          <div
            key={metric.id}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all
              ${selectedMetrics.includes(metric.id!)
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleMetricToggle(metric.id!)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">
                  {metric.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {metric.description}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                    {metric.category}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  ${selectedMetrics.includes(metric.id!)
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                  }
                `}>
                  {selectedMetrics.includes(metric.id!) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMetrics.length > 0 && (
        <div className="mt-4 p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            <strong>{selectedMetrics.length}</strong> metric{selectedMetrics.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};