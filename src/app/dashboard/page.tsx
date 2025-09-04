'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardChart from '../../components/DashboardChart';
import DatasetManager from '../../components/DatasetManager';
import ProductSelector from '../../components/ProductSelector';
import DaySelector from '../../components/DaySelector';
import AIInsightBox from '../../components/AIInsightBox';

interface DataSet {
  id: number;
  name: string;
  createdAt: string;
  productCount: number;
}

interface ChartData {
  day: string;
  [key: string]: string | number; // Dynamic keys for product data
}

interface Product {
  id: string;
  name: string;
  recordCount: number;
}

interface RawProduct {
  id: string;
  name: string;
  dailyRecords: Array<{
    id: number;
    day: number;
    inventory: number;
    procurementQuantity: number;
    procurementPrice: number;
    procurementAmount: number;
    salesQuantity: number;
    salesPrice: number;
    salesAmount: number;
  }>;
}

interface DataResponse {
  dataSet: {
    id: number;
    name: string;
    createdAt: string;
  };
  products: Product[];
  rawProducts: RawProduct[];
  chartData: ChartData[];
  summary: {
    totalProducts: number;
    totalRecords: number;
    dayRange: {
      start: number;
      end: number;
    } | null;
  };
}

/**
 * Dashboard page - protected page
 * Shows file upload widget and data visualization chart with dataset switching and AI analysis
 */
export default function DashboardPage() {
  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataResponse, setDataResponse] = useState<DataResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [visibleLineTypes, setVisibleLineTypes] = useState({
    inventory: true,
    sales: true,
    procurement: true
  });
  const [rightPanelTab, setRightPanelTab] = useState<'products' | 'days'>('products');
  const [dayRange, setDayRange] = useState<{ start: number | null; end: number | null } | null>(null);

  // Track if products have been initialized to prevent auto-selection after manual deselection
  const hasInitialized = React.useRef(false);

  // Handle line type visibility toggle
  const handleLineTypeToggle = (lineType: keyof typeof visibleLineTypes) => {
    setVisibleLineTypes(prev => ({
      ...prev,
      [lineType]: !prev[lineType]
    }));
  };

  // Fetch datasets on component mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setIsLoadingDatasets(true);
        setError('');

        const response = await fetch('/api/datasets');
        const data = await response.json();

        if (response.ok) {
          setDataSets(data.datasets);
          // Auto-select first dataset if available
          if (data.datasets.length > 0 && !selectedSetId) {
            setSelectedSetId(data.datasets[0].id);
          }
        } else {
          setError(data.error || 'Failed to fetch datasets');
        }
      } catch (error) {
        console.error('Fetch datasets error:', error);
        setError('Network error while fetching datasets');
      } finally {
        setIsLoadingDatasets(false);
      }
    };

    loadDatasets();
  }, [selectedSetId]);

  // Keep products unselected by default when data is loaded
  useEffect(() => {
    if (dataResponse?.products && !hasInitialized.current) {
      hasInitialized.current = true;
      // Keep selectedProductIds empty (no auto-selection)
      setSelectedProductIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataResponse]);

  // Reset initialization flag when dataset changes
  useEffect(() => {
    if (selectedSetId !== null) {
      hasInitialized.current = false;
    }
  }, [selectedSetId]);

  // Transform raw product data into chart-ready format based on selected products and day range
  const transformedChartData = useMemo(() => {
    if (!dataResponse?.rawProducts || selectedProductIds.length === 0) {
      return [];
    }

    const selectedProducts = dataResponse.rawProducts.filter(product =>
      selectedProductIds.includes(product.id)
    );

    if (selectedProducts.length === 0) {
      return [];
    }

    // Collect all unique days, filtered by selected day range if present
    const allDays = new Set<number>();
    selectedProducts.forEach(product => {
      product.dailyRecords.forEach(record => {
        const withinStart = typeof dayRange?.start === 'number' ? record.day >= dayRange.start : true;
        const withinEnd = typeof dayRange?.end === 'number' ? record.day <= dayRange.end : true;
        if (withinStart && withinEnd) {
          allDays.add(record.day);
        }
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Initialize chart data structure with days as x-axis
    const chartDataMap = new Map<number, Record<string, string | number>>();
    sortedDays.forEach(day => {
      chartDataMap.set(day, { day: `Day ${day}` });
    });

    // Add data for each selected product, filtered by selected day range
    selectedProducts.forEach(product => {
      product.dailyRecords.forEach(record => {
        const withinStart = typeof dayRange?.start === 'number' ? record.day >= dayRange.start : true;
        const withinEnd = typeof dayRange?.end === 'number' ? record.day <= dayRange.end : true;
        if (!(withinStart && withinEnd)) return;
        const dayData = chartDataMap.get(record.day);
        if (dayData) {
          const productName = product.name;
          dayData[`${productName}_Inventory`] = record.inventory;
          dayData[`${productName}_Sales`] = record.salesAmount;
          dayData[`${productName}_Procurement`] = record.procurementAmount;
        }
      });
    });

    // Fill missing values with 0
    selectedProducts.forEach(product => {
      const productName = product.name;
      sortedDays.forEach(day => {
        const dayData = chartDataMap.get(day);
        if (dayData) {
          if (dayData[`${productName}_Inventory`] === undefined) {
            dayData[`${productName}_Inventory`] = 0;
          }
          if (dayData[`${productName}_Sales`] === undefined) {
            dayData[`${productName}_Sales`] = 0;
          }
          if (dayData[`${productName}_Procurement`] === undefined) {
            dayData[`${productName}_Procurement`] = 0;
          }
        }
      });
    });

    return Array.from(chartDataMap.values()) as ChartData[];
  }, [dataResponse?.rawProducts, selectedProductIds, dayRange?.start, dayRange?.end]);

  // Initialize dayRange when data loads
  useEffect(() => {
    if (dataResponse?.summary.dayRange) {
      setDayRange({
        start: dataResponse.summary.dayRange.start,
        end: dataResponse.summary.dayRange.end
      });
    }
  }, [dataResponse?.summary.dayRange]);

  // Fetch chart data when selected dataset changes
  useEffect(() => {
    const loadChartData = async () => {
      if (!selectedSetId) {
        setChartData([]);
        setDataResponse(null);
        return;
      }

      try {
        setIsLoadingData(true);
        setError('');

        const response = await fetch(`/api/data/${selectedSetId}`);
        const data = await response.json();

        if (response.ok) {
          setChartData(data.chartData);
          setDataResponse(data);
        } else {
          setError(data.error || 'Failed to fetch chart data');
          setChartData([]);
          setDataResponse(null);
        }
      } catch (error) {
        console.error('Fetch chart data error:', error);
        setError('Network error while fetching chart data');
        setChartData([]);
        setDataResponse(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadChartData();
  }, [selectedSetId]);





  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const daysInfo = data.daysProcessed ? ` (Days 1-${data.daysProcessed})` : '';
        alert(`File "${file.name}" uploaded successfully! Created ${data.productsCount} products with ${data.recordsCount} records${daysInfo}.`);
        // Refresh the page to show new dataset
        window.location.reload();
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed, please try again later');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Page header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Data Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Intelligent Data Visualization & Analysis Platform</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => {
                  // Open file upload modal or navigate to upload page
                  // For now, we'll reload to refresh datasets
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls,.csv';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      // Trigger file upload
                      handleFileUpload(file);
                    }
                  };
                  input.click();
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Data
              </button>

              <button
                onClick={async () => {
                  try {
                    // Call logout API
                    const response = await fetch('/api/auth/logout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });

                    if (response.ok) {
                      // Redirect to home page after successful logout
                      window.location.href = '/';
                    } else {
                      console.error('Logout failed');
                      // Fallback: clear cookie client-side and redirect
                      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                      window.location.href = '/';
                    }
                  } catch (error) {
                    console.error('Logout error:', error);
                    // Fallback: clear cookie client-side and redirect
                    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    window.location.href = '/';
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dataset Manager */}
        <DatasetManager
          datasets={dataSets}
          selectedId={selectedSetId}
          onDatasetSelect={setSelectedSetId}
          onDatasetUpdate={() => {
            // Refresh datasets list
            const loadDatasets = async () => {
              try {
                setIsLoadingDatasets(true);
                const response = await fetch('/api/datasets');
                const data = await response.json();
                if (response.ok) {
                  setDataSets(data.datasets);
                  // If no dataset is selected or selected dataset was deleted, select first available
                  if (!selectedSetId || !data.datasets.find((d: DataSet) => d.id === selectedSetId)) {
                    setSelectedSetId(data.datasets.length > 0 ? data.datasets[0].id : null);
                  }
                }
              } catch (error) {
                console.error('Refresh datasets error:', error);
              } finally {
                setIsLoadingDatasets(false);
              }
            };
            loadDatasets();
          }}
        />

        {/* Data Visualization Section */}
        <div className="space-y-4">
          {/* Visualization Box */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Data Visualization</h2>
                  <p className="text-blue-100 text-sm">Explore your data insights</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {(isLoadingDatasets || isLoadingData) && (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 mx-auto absolute top-0"></div>
                </div>
                <p className="mt-6 text-gray-600 font-medium">
                  {isLoadingDatasets ? 'Loading datasets...' : 'Loading chart data...'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Please wait, data is being processed
                </p>
              </div>
            )}

            {/* No datasets message */}
            {!isLoadingDatasets && dataSets.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mx-auto flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Your Data Analysis Journey</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  No datasets yet? Click the &quot;Upload Data&quot; button above to upload your Excel files and begin data visualization analysis.
                </p>
              </div>
            )}

          {/* Chart and Product Selector */}
          {!isLoadingData && !isLoadingDatasets && dataResponse && dataResponse.products.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Chart and Legend Container */}
              <div className="lg:w-3/4 flex flex-col">
                {/* Chart */}
                <div className="flex-1">
                  {transformedChartData.length > 0 ? (
                    <DashboardChart
                      data={transformedChartData}
                      selectedProducts={dataResponse.rawProducts.filter(p => selectedProductIds.includes(p.id))}
                      visibleLineTypes={visibleLineTypes}
                    />
                  ) : (
                    <div className="text-center py-16 mt-8">
                      <div className="text-4xl mb-4">📈</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No data available</h3>
                      <p className="text-gray-600">
                        {selectedProductIds.length === 0
                          ? 'Please select at least one product to view the chart.'
                          : 'The selected products don\'t contain any chart data.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Line Style Legend - Aligned with Product Selector bottom */}
                {transformedChartData.length > 0 && selectedProductIds.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex flex-wrap gap-6 justify-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleLineTypes.inventory}
                            onChange={() => handleLineTypeToggle('inventory')}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="w-8 h-0.5 border-t-2 border-gray-700"></div>
                          <span className="text-sm text-gray-700">Inventory</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleLineTypes.sales}
                            onChange={() => handleLineTypeToggle('sales')}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-700"></div>
                          <span className="text-sm text-gray-700">Sales Amount</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleLineTypes.procurement}
                            onChange={() => handleLineTypeToggle('procurement')}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="w-8 h-0.5 border-t-2 border-dotted border-gray-700"></div>
                          <span className="text-sm text-gray-700">Procurement Amount</span>
                        </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Right panel with tabs: Product Selection / Day Selection */}
              <div className="lg:w-1/4">
                {/* Tabs header only (no extra container) */}
                <div className="flex items-center justify-between bg-white px-0 py-3 border-b border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${rightPanelTab === 'products' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                      onClick={() => setRightPanelTab('products')}
                    >
                      Product Selection
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${rightPanelTab === 'days' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                      onClick={() => setRightPanelTab('days')}
                    >
                      Day Selection
                    </button>
                  </div>
                </div>

                {/* Tab content (components render their own containers) */}
                <div className="mt-2">
                  {rightPanelTab === 'products' ? (
                    <ProductSelector
                      products={dataResponse.products}
                      selectedProductIds={selectedProductIds}
                      onProductSelectionChange={setSelectedProductIds}
                    />
                  ) : (
                    dataResponse.summary.dayRange && (
                      <DaySelector
                        dayRange={dayRange ?? {
                          start: dataResponse.summary.dayRange.start,
                          end: dataResponse.summary.dayRange.end,
                        }}
                        onDayRangeChange={(range) => setDayRange(range)}
                        availableDays={dataResponse.summary.dayRange}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No data message */}
          {!isLoadingData && !isLoadingDatasets && selectedSetId && dataResponse && dataResponse.products.length === 0 && !error && (
            <div className="text-center py-16 mt-8">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                The selected dataset doesn&apos;t contain any products.
              </p>
            </div>
          )}
          </div>
        </div>

        {/* Enhanced Section Separator */}
        <div className="relative flex items-center justify-center py-8">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-purple-50 opacity-50"></div>

          {/* Main separator */}
          <div className="relative z-10 flex items-center space-x-6 w-full max-w-lg">
            {/* Left line with gradient */}
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 via-blue-300 to-transparent rounded-full"></div>

            {/* Central decorative element */}
            <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-gray-200/50">
              {/* Left sparkle */}
              <svg className="w-4 h-4 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>

              {/* AI Analysis label */}
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">AI Analysis</span>
              </div>

              {/* Right sparkle */}
              <svg className="w-4 h-4 text-purple-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>

            {/* Right line with gradient */}
            <div className="flex-1 h-0.5 bg-gradient-to-l from-purple-400 via-purple-300 to-transparent rounded-full"></div>
          </div>

          {/* Decorative circles */}
          <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-l from-purple-400 to-purple-300 rounded-full opacity-60 animate-pulse"></div>
        </div>

        {/* AI Analysis Section */}
        {!isLoadingDatasets && selectedSetId && (
          <AIInsightBox dataSetId={selectedSetId} />
        )}

        {/* Quick stats removed */}
      </div>
    </div>
    </main>
  );
}