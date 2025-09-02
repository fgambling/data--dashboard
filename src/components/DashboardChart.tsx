'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateHslColorFromString, hslToHex } from '../utils/colorUtils';

interface ChartData {
  day: string;
  [key: string]: string | number; // Dynamic keys for product data
}

interface Product {
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

interface DashboardChartProps {
  data?: ChartData[];
  selectedProducts?: Product[];
  visibleLineTypes?: {
    inventory: boolean;
    sales: boolean;
    procurement: boolean;
  };
}

interface LegendItem {
  dataKey: string;
  name: string;
  color: string;
  strokeDasharray?: string;
  productName: string;
  metricType: 'inventory' | 'sales' | 'procurement';
}

/**
 * Dashboard chart component with advanced visualization features
 */
export default function DashboardChart({
  data,
  selectedProducts = [],
  visibleLineTypes = { inventory: true, sales: true, procurement: true }
}: DashboardChartProps) {
  const [hiddenLines, setHiddenLines] = React.useState<Set<string>>(new Set());

  // Use provided data or empty array
  const chartData = data && data.length > 0 ? data : [];

  // Line styles for different metrics
  const lineStyles = {
    inventory: { strokeWidth: 3, strokeDasharray: '0' },      // Solid thick line
    sales: { strokeWidth: 2, strokeDasharray: '5,5' },        // Dashed line
    procurement: { strokeWidth: 2, strokeDasharray: '2,2' },  // Dotted line
  };

  // Generate deterministic color based on product name
  const getProductColor = (productName: string): string => {
    // Use HSL color generation for better color distribution
    const hslColor = generateHslColorFromString(productName, 70, 55);
    // Convert to hex for Recharts compatibility
    return hslToHex(hslColor);
  };

  // Generate legend items for interactive legend
  const generateLegendItems = (): LegendItem[] => {
    const items: LegendItem[] = [];

    selectedProducts.forEach((product) => {
      const productColor = getProductColor(product.name);
      const productName = product.name;

      // Inventory
      items.push({
        dataKey: `${productName}_Inventory`,
        name: `${productName} - Inventory`,
        color: productColor,
        strokeDasharray: lineStyles.inventory.strokeDasharray,
        productName,
        metricType: 'inventory'
      });

      // Sales
      items.push({
        dataKey: `${productName}_Sales`,
        name: `${productName} - Sales`,
        color: productColor,
        strokeDasharray: lineStyles.sales.strokeDasharray,
        productName,
        metricType: 'sales'
      });

      // Procurement
      items.push({
        dataKey: `${productName}_Procurement`,
        name: `${productName} - Procurement`,
        color: productColor,
        strokeDasharray: lineStyles.procurement.strokeDasharray,
        productName,
        metricType: 'procurement'
      });
    });

    return items;
  };

  // Toggle line visibility
  const toggleLineVisibility = (dataKey: string) => {
    const newHiddenLines = new Set(hiddenLines);
    if (newHiddenLines.has(dataKey)) {
      newHiddenLines.delete(dataKey);
    } else {
      newHiddenLines.add(dataKey);
    }
    setHiddenLines(newHiddenLines);
  };

  // Generate dynamic lines based on selected products and visible line types
  const generateLines = () => {
    const lines: React.JSX.Element[] = [];

    selectedProducts.forEach((product) => {
      const productColor = getProductColor(product.name);
      const productName = product.name;

      // Only add lines that are visible based on line type settings
      if (visibleLineTypes.inventory) {
        lines.push(
          <Line
            key={`${productName}_inventory`}
            type="monotone"
            dataKey={`${productName}_Inventory`}
            stroke={productColor}
            strokeWidth={lineStyles.inventory.strokeWidth}
            strokeDasharray={lineStyles.inventory.strokeDasharray}
            dot={{ fill: productColor, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 6, stroke: productColor, strokeWidth: 2 }}
            name={`${productName} - Inventory`}
            yAxisId="inventory"
            connectNulls={false}
          />
        );
      }

      if (visibleLineTypes.sales) {
        lines.push(
          <Line
            key={`${productName}_sales`}
            type="monotone"
            dataKey={`${productName}_Sales`}
            stroke={productColor}
            strokeWidth={lineStyles.sales.strokeWidth}
            strokeDasharray={lineStyles.sales.strokeDasharray}
            dot={{ fill: productColor, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 6, stroke: productColor, strokeWidth: 2 }}
            name={`${productName} - Sales Amount`}
            yAxisId="currency"
            connectNulls={false}
          />
        );
      }

      if (visibleLineTypes.procurement) {
        lines.push(
          <Line
            key={`${productName}_procurement`}
            type="monotone"
            dataKey={`${productName}_Procurement`}
            stroke={productColor}
            strokeWidth={lineStyles.procurement.strokeWidth}
            strokeDasharray={lineStyles.procurement.strokeDasharray}
            dot={{ fill: productColor, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 6, stroke: productColor, strokeWidth: 2 }}
            name={`${productName} - Procurement Amount`}
            yAxisId="currency"
            connectNulls={false}
          />
        );
      }
    });

    return lines;
  };

  // Rich tooltip with grouped and formatted data
  const RichTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (!active || !payload || !payload.length) return null;

    // Group data by product
    const productGroups: { [key: string]: { inventory?: number; sales?: number; procurement?: number } } = {};

    payload.forEach((entry) => {
      const typedEntry = entry as { name: string; value: number; color: string; dataKey: string };

      // Extract product name and metric type from dataKey
      const parts = typedEntry.dataKey.split('_');
      if (parts.length >= 2) {
        const productName = parts.slice(0, -1).join('_');
        const metricType = parts[parts.length - 1];

        if (!productGroups[productName]) {
          productGroups[productName] = {};
        }

        if (metricType === 'Inventory') {
          productGroups[productName].inventory = typedEntry.value;
        } else if (metricType === 'Sales') {
          productGroups[productName].sales = typedEntry.value;
        } else if (metricType === 'Procurement') {
          productGroups[productName].procurement = typedEntry.value;
        }
      }
    });

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-sm">
        <p className="font-bold text-gray-900 mb-3 text-center">{label}</p>

        {Object.entries(productGroups).map(([productName, metrics]) => (
          <div key={productName} className="mb-3 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
            <p className="font-semibold text-gray-800 mb-2">{productName}</p>
            <div className="space-y-1">
              {metrics.inventory !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📦 Inventory:</span>
                  <span className="font-medium">{metrics.inventory.toLocaleString()}</span>
                </div>
              )}
              {metrics.sales !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">💰 Sales:</span>
                  <span className="font-medium text-green-600">${metrics.sales.toLocaleString()}</span>
                </div>
              )}
              {metrics.procurement !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🛒 Procurement:</span>
                  <span className="font-medium text-orange-600">${metrics.procurement.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Interactive legend component
  const InteractiveLegend = () => {
    const legendItems = generateLegendItems();

    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {legendItems.map((item) => {
          const isHidden = hiddenLines.has(item.dataKey);
          return (
            <button
              key={item.dataKey}
              onClick={() => toggleLineVisibility(item.dataKey)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                isHidden ? 'opacity-50 bg-gray-100' : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-1">
                <div
                  className="w-4 h-0.5"
                  style={{
                    backgroundColor: isHidden ? '#9ca3af' : item.color,
                    strokeDasharray: item.strokeDasharray,
                    border: item.strokeDasharray ? 'none' : `2px solid ${isHidden ? '#9ca3af' : item.color}`
                  }}
                />
                <span className="text-xs text-gray-600">{item.metricType}</span>
              </div>
              <span className="text-sm font-medium">{item.productName}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Chart container */}
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 80,
              left: 60,
              bottom: 20,
            }}
          >
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            {/* X axis */}
            <XAxis
              dataKey="day"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            {/* Left Y-axis (Inventory - counts) */}
            <YAxis
              yAxisId="inventory"
              orientation="left"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
              label={{
                value: 'Inventory (Units)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
              }}
              width={60}
            />

            {/* Right Y-axis (Currency amounts) */}
            <YAxis
              yAxisId="currency"
              orientation="right"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              label={{
                value: 'Currency ($)',
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold' }
              }}
              width={70}
            />

            {/* Rich Tooltip */}
            <Tooltip content={<RichTooltip />} />

            {/* Disable default legend since we have interactive legend */}
            <Legend content={() => null} />

            {/* Dynamic lines based on selected products */}
            {generateLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
}
