import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  PieChart,
  Pie as RechartsPie,
  Cell,
  LineChart,
  Line as RechartsLine,
} from 'recharts';
import { DiagramData } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartRendererProps {
  diagram: DiagramData;
  onUpdate?: (diagram: DiagramData) => void;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ diagram, onUpdate }) => {
  const chartRef = useRef<any>(null);
  const [showCode, setShowCode] = useState(false);
  const [dynamicData, setDynamicData] = useState<any>(null);

  // No fallback data - charts must be generated from LLM with actual data

  // Initialize dynamic data from diagram metadata
  useEffect(() => {
    console.log('ChartRenderer - diagram:', diagram);
    console.log('ChartRenderer - diagram.metadata:', diagram.metadata);
    
    if (diagram.metadata?.dynamicData) {
      console.log('Setting dynamic data from metadata:', diagram.metadata.dynamicData);
      setDynamicData(diagram.metadata.dynamicData);
    } else if (diagram.metadata?.chartData) {
      console.log('Setting dynamic data from chartData:', diagram.metadata.chartData);
      setDynamicData(diagram.metadata.chartData);
    } else {
      console.log('No dynamic data found, using fallback');
      setDynamicData(null);
    }
  }, [diagram]);

  // Use dynamic data only - no fallbacks
  const chartDataWithSummary = dynamicData;
  console.log('Final chartData:', chartDataWithSummary);

  const generateReactCode = () => {
    if (!dynamicData || !dataPointsForChart?.length) return '';

    const firstPoint = dataPointsForChart[0] || {};
    const xAxisKey = Object.keys(firstPoint).find(key => typeof firstPoint[key] === 'string') || 'category';
    const numericKeys = Object.keys(firstPoint).filter(key => typeof firstPoint[key] === 'number');
    const barColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (diagram.type === 'bar') {
      const dataStr = JSON.stringify(dataPointsForChart, null, 2);
      const barsCode = numericKeys.map((key, idx) =>
        `          <Bar dataKey="${key}" fill="${barColors[idx % barColors.length]}" name="${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}" />`
      ).join('\n');

      return `import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DynamicBarChart = () => {
  const data = ${dataStr};

  return (
    <div className="w-full h-96 p-4">
      <h2 className="text-2xl font-bold mb-4">${dynamicData.title || 'Data Visualization'}</h2>
      <p className="text-gray-600 mb-6">${dynamicData.description || 'Data comparison'}</p>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="${xAxisKey}" />
          <YAxis />
          <Tooltip formatter={(value) => [value.toLocaleString(), '']} />
          <Legend />
${barsCode}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DynamicBarChart;`;
    }

    if (diagram.type === 'pie') {
      const dataStr = JSON.stringify(dataPointsForChart, null, 2);
      return `import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DynamicPieChart = () => {
  const data = ${dataStr};
  const colors = ${JSON.stringify(barColors)};

  return (
    <div className="w-full h-96 p-4">
      <h2 className="text-2xl font-bold mb-4">${dynamicData.title || 'Data Distribution'}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({name, percent}) => \`\${name} \${(percent * 100).toFixed(0)}%\`}
          >
            {data.map((entry, index) => (
              <Cell key={\`cell-\${index}\`} fill={entry.color || colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DynamicPieChart;`;
    }

    return '';
  };

  const generateDynamicReactCode = () => {
    if (!dynamicData?.codeExample) return '';
    return dynamicData.codeExample;
  };

  const renderDynamicResponse = () => {
    if (!dynamicData) return null;
    
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <ReactMarkdown className="prose prose-sm max-w-none">
          {dynamicData.responseText || ''}
        </ReactMarkdown>
      </div>
    );
  };

  const dataPointsForChart = chartDataWithSummary?.data || chartDataWithSummary || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportChart = (format: 'png' | 'jpeg' = 'png') => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL(`image/${format}`, 0.95);
      const link = document.createElement('a');
      link.download = `${diagram.title.replace(/\s+/g, '-').toLowerCase()}.${format}`;
      link.href = url;
      link.click();
    }
  };

  if (!chartDataWithSummary || !dataPointsForChart?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500 text-lg font-medium">No chart data available</p>
        <p className="text-gray-400 text-sm mt-2">Chart data is generated from document analysis</p>
      </div>
    );
  }

  // Ensure we have data to render
  const dataToRender = chartDataWithSummary?.data || chartDataWithSummary;
  
  console.log('Data to render:', dataPointsForChart);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              {(diagram.type === 'bar' || dynamicData?.chartType === 'bar') && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {(diagram.type === 'pie' || dynamicData?.chartType === 'pie') && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              )}
              {(diagram.type === 'line' || dynamicData?.chartType === 'line') && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                </svg>
              )}
            </div>
            {dynamicData?.title || diagram.title || 'Data Visualization'}
          </h3>
          <p className="text-gray-600">
            {dynamicData?.description || 'Data extracted from document analysis'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="text-sm font-medium">View Code</span>
          </button>
          
          <div className="relative group">
            <button className="px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              <button
                onClick={() => exportChart('png')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                Export as PNG
              </button>
              <button
                onClick={() => exportChart('jpeg')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                Export as JPEG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Display */}
      {showCode && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                React Component Code
              </h4>
              <button
                onClick={() => copyToClipboard(dynamicData?.codeExample || generateReactCode())}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Copy Code
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{dynamicData?.codeExample || generateReactCode()}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Dynamic Response */}
      {renderDynamicResponse()}

      {/* Chart Container */}
      <div className="p-6">
        <div className="h-96 w-full">
          {(diagram.type === 'bar' || dynamicData?.chartType === 'bar') && (() => {
            // Extract all numeric keys from the first data point
            const firstPoint = dataPointsForChart[0] || {};
            const xAxisKey = dynamicData?.xAxisKey || Object.keys(firstPoint).find(key => typeof firstPoint[key] === 'string') || 'month';
            const numericKeys = Object.keys(firstPoint).filter(key =>
              typeof firstPoint[key] === 'number' && key !== 'percentage'
            );

            // Define colors for bars
            const barColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPointsForChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey={xAxisKey}
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [`${value.toLocaleString()}`, '']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <RechartsLegend />
                  {numericKeys.map((key, index) => (
                    <RechartsBar
                      key={key}
                      dataKey={key}
                      fill={barColors[index % barColors.length]}
                      name={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
          
          {(diagram.type === 'pie' || dynamicData?.chartType === 'pie') && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsPie
                  data={dataPointsForChart}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(dataPointsForChart || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPie>
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, 'Share']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          
          {(diagram.type === 'line' || dynamicData?.chartType === 'line') && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPointsForChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-4">
          {(diagram.type === 'bar' || dynamicData?.chartType === 'bar') &&
           dynamicData?.summary && (
            <>
              {Object.entries(dynamicData.summary).map(([key, value], index) => {
                const colors = [
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', value: 'text-blue-900' },
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', value: 'text-green-900' },
                  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', value: 'text-purple-900' },
                ];
                const colorScheme = colors[index % colors.length];
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();

                return (
                  <div key={key} className={`${colorScheme.bg} p-4 rounded-lg border ${colorScheme.border}`}>
                    <h4 className={`${colorScheme.text} font-semibold text-sm`}>{label}</h4>
                    <p className={`text-2xl font-bold ${colorScheme.value}`}>
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                  </div>
                );
              })}
            </>
          )}
          
          {(diagram.type === 'pie' || dynamicData?.chartType === 'pie') && 
           (dynamicData?.summary || chartDataWithSummary?.summary) && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-blue-800 font-semibold text-sm">Total Products</h4>
                <p className="text-2xl font-bold text-blue-900">{dynamicData?.summary?.totalProducts || chartDataWithSummary?.summary?.totalProducts || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-green-800 font-semibold text-sm">Top Product</h4>
                <p className="text-2xl font-bold text-green-900">{dynamicData?.summary?.topProduct || chartDataWithSummary?.summary?.topProduct || 'N/A'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-purple-800 font-semibold text-sm">Market Share</h4>
                <p className="text-2xl font-bold text-purple-900">{dynamicData?.summary?.marketShare || chartDataWithSummary?.summary?.marketShare || '0%'}</p>
              </div>
            </>
          )}
          
          {(diagram.type === 'line' || dynamicData?.chartType === 'line') && 
           (dynamicData?.summary || chartDataWithSummary?.summary) && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-blue-800 font-semibold text-sm">Total Revenue</h4>
                <p className="text-2xl font-bold text-blue-900">${(dynamicData?.summary?.totalRevenue || chartDataWithSummary?.summary?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-green-800 font-semibold text-sm">Avg Growth</h4>
                <p className="text-2xl font-bold text-green-900">{dynamicData?.summary?.avgGrowth || chartDataWithSummary?.summary?.avgGrowth || 0}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-purple-800 font-semibold text-sm">Best Month</h4>
                <p className="text-2xl font-bold text-purple-900">{dynamicData?.summary?.bestMonth || chartDataWithSummary?.summary?.bestMonth || 'N/A'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Features Info */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Professional Chart Features:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Interactive tooltips & hover effects
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Responsive design for all devices
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Copy-ready React component code
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Export functionality (PNG, JPEG)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};