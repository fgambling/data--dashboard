'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardChart from '../../components/DashboardChart';
import DatasetManager from '../../components/DatasetManager';
import ProductSelector from '../../components/ProductSelector';

interface DataSet {
  id: number;
  name: string;
  createdAt: string;
  productCount: number;
}

interface ChartData {
  day: number;
  inventory: number;
  salesAmount: number;
  procurementAmount: number;
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
 * Shows file upload widget and data visualization chart with dataset switching
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

  // Transform raw product data into chart-ready format based on selected products
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

    // Collect all unique days
    const allDays = new Set<number>();
    selectedProducts.forEach(product => {
      product.dailyRecords.forEach(record => {
        allDays.add(record.day);
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Initialize chart data structure with days as x-axis
    const chartDataMap = new Map<number, Record<string, string | number>>();
    sortedDays.forEach(day => {
      chartDataMap.set(day, { day: `Day ${day}` });
    });

    // Add data for each selected product
    selectedProducts.forEach(product => {
      product.dailyRecords.forEach(record => {
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

    return Array.from(chartDataMap.values());
  }, [dataResponse?.rawProducts, selectedProductIds]);

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
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to your data visualization workspace</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
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
                className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-600 transition-colors"
              >
                Upload New File
              </button>

              <button
                onClick={() => {
                  // Clear cookie and redirect to home
                  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-600 transition-colors"
              >
                Logout
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Data Visualization</h2>

            {selectedSetId && (
              <div className="text-sm text-gray-600">
                Viewing: {dataSets.find(d => d.id === selectedSetId)?.name || 'Unknown'}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading state */}
          {(isLoadingDatasets || isLoadingData) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {isLoadingDatasets ? 'Loading datasets...' : 'Loading chart data...'}
              </p>
            </div>
          )}

          {/* No datasets message */}
          {!isLoadingDatasets && dataSets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No datasets found</h3>
              <p className="text-gray-600">
                Upload your first Excel file to get started with data visualization.
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

              {/* Product Selector - Right side */}
              <div className="lg:w-1/4">
                <ProductSelector
                  products={dataResponse.products}
                  selectedProductIds={selectedProductIds}
                  onProductSelectionChange={setSelectedProductIds}
                />
              </div>
            </div>
          )}

          {/* No data message */}
          {!isLoadingData && !isLoadingDatasets && selectedSetId && dataResponse && dataResponse.products.length === 0 && !error && (
            <div className="text-center py-16 mt-8">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-600">
                The selected dataset doesn&apos;t contain any products.
              </p>
            </div>
          )}
        </div>

        {/* Quick stats removed */}
      </div>
    </main>
  );
}