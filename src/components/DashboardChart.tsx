'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { generateHslColorFromString, hslToHex } from '../utils/colorUtils';
import FloatingPanel from './FloatingPanel';

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

/**
 * Additional interface definitions for floating panel functionality
 */
interface ProductMetrics {
  inventory?: number;
  salesAmount?: number;
  procurementAmount?: number;
  salesPrice?: number;
  procurementPrice?: number;
}

interface PanelData {
  day: string;
  products: { [productName: string]: ProductMetrics };
}

interface PanelState {
  id: string; // The day will serve as a unique ID.
  data: PanelData;
  initialPosition: { x: number; y: number };
}

/**
 * Type definitions for Recharts chart interaction state
 */
interface ChartClickState {
  activeLabel?: string | number;
  activePayload?: Array<{
    dataKey: string;
    value: number;
    color?: string;
    name?: string;
  }>;
  activeCoordinate?: { x: number; y: number };
}

/**
 * Dashboard chart component with a custom click-triggered panel
 * - No Recharts <Tooltip>
 * - Click chart to open panel, click outside or press Esc to close
 * - Panel is scrollable and not clipped by chart container
 * - Floating panels display detailed data for clicked days
 */
export default function DashboardChart({
  data,
  selectedProducts = [],
  visibleLineTypes = { inventory: true, sales: true, procurement: true }
}: DashboardChartProps) {
  // State to manage all active floating panels.
  // The key is the day (string), which ensures no duplicates for the same day.
  const [floatingPanels, setFloatingPanels] = React.useState<Record<string, PanelState>>({});

  // Use provided data or empty array
  const chartData = data && data.length > 0 ? data : [];

  /**
   * Performance optimization: Create a lookup map from product data
   * This enables O(1) lookup for detailed data instead of O(n) search on every click
   * useMemo ensures this map is only recalculated when selectedProducts changes
   */
  const detailedDataMap = React.useMemo(() => {
    const map = new Map<string, { [productName: string]: Product['dailyRecords'][0] }>();
    selectedProducts.forEach(product => {
      product.dailyRecords.forEach(record => {
        // Format day key to match chart data format
        const dayKey = `Day ${record.day}`;
        if (!map.has(dayKey)) {
          map.set(dayKey, {});
        }
        const dayData = map.get(dayKey);
        if (dayData) {
            dayData[product.name] = record;
        }
      });
    });
    return map;
  }, [selectedProducts]);

  // Line styles for different metrics
  const lineStyles = {
    inventory: { strokeWidth: 3, strokeDasharray: '0' },      // Solid thick line
    sales: { strokeWidth: 2, strokeDasharray: '5,5' },        // Dashed line
    procurement: { strokeWidth: 2, strokeDasharray: '2,2' },  // Dotted line
  };

  // Generate deterministic color based on product name
  const getProductColor = (productName: string): string => {
    const hslColor = generateHslColorFromString(productName, 70, 55);
    return hslToHex(hslColor);
  };

  // Helper: build metric keys for a product (to avoid typos)
  const keysFor = (productName: string) => ({
    inv: `${productName}_Inventory`,
    sales: `${productName}_Sales`,
    proc: `${productName}_Procurement`,
  });


  // Build lines dynamically based on selected products and visible line types
  const generateLines = () => {
    const lines: React.JSX.Element[] = [];

    selectedProducts.forEach((product) => {
      const productColor = getProductColor(product.name);
      const productName = product.name;
      const k = keysFor(productName);

      if (visibleLineTypes.inventory) {
        lines.push(
          <Line
            key={`${productName}_inventory`}
            type="monotone"
            dataKey={k.inv}
            stroke={productColor}
            strokeWidth={lineStyles.inventory.strokeWidth}
            strokeDasharray={lineStyles.inventory.strokeDasharray}
            dot={{
              fill: productColor,
              strokeWidth: 2,
              r: 3
            }}
            activeDot={{ r: 6, stroke: productColor, strokeWidth: 2 }}
            name={`${productName} - Inventory`}
            yAxisId="inventory"
            connectNulls={false}
          />,
        );
      }

      if (visibleLineTypes.sales) {
        lines.push(
          <Line
            key={`${productName}_sales`}
            type="monotone"
            dataKey={k.sales}
            stroke={productColor}
            strokeWidth={lineStyles.sales.strokeWidth}
            strokeDasharray={lineStyles.sales.strokeDasharray}
            dot={{
              fill: productColor,
              strokeWidth: 2,
              r: 3
            }}
            activeDot={{ r: 6, stroke: productColor, strokeWidth: 2 }}
            name={`${productName} - Sales Amount`}
            yAxisId="currency"
            connectNulls={false}
          />,
        );
      }

      if (visibleLineTypes.procurement) {
        lines.push(
          <Line
            key={`${productName}_procurement`}
            type="monotone"
            dataKey={k.proc}
            stroke={productColor}
            strokeWidth={lineStyles.procurement.strokeWidth}
            strokeDasharray={lineStyles.procurement.strokeDasharray}
            dot={{
              fill: productColor,
              strokeWidth: 2,
              r: 3
            }}
            activeDot={{ r: 6, stroke: productColor, strokeWidth: 2 }}
            name={`${productName} - Procurement Amount`}
            yAxisId="currency"
            connectNulls={false}
          />,
        );
      }
    });

    return lines;
  };


  /**
   * Handles chart click events to open floating panels with detailed data
   */
  const handleChartClick = (chartState: ChartClickState | null) => {
    // Exit if the click was not on a valid data point.
    if (!chartState || !chartState.activeLabel) {
      return;
    }
    const day = String(chartState.activeLabel);

    // If a panel for this day already exists, do nothing.
    if (floatingPanels[day]) {
      return;
    }

    // Find the detailed data for the clicked day using our lookup map.
    const dailyProductDetails = detailedDataMap.get(day);
    if (!dailyProductDetails) return;

    // Format the found data into the structure required by FloatingPanel.
    const panelData: PanelData = {
      day,
      products: {},
    };
    Object.entries(dailyProductDetails).forEach(([productName, record]) => {
      panelData.products[productName] = {
        inventory: record.inventory,
        salesAmount: record.salesAmount,
        procurementAmount: record.procurementAmount,
        salesPrice: record.salesPrice, // Add sales price
        procurementPrice: record.procurementPrice, // Add procurement price
      };
    });

    // Calculate an initial position for the new panel to avoid perfect overlap.
    const initialPosition = {
        x: window.innerWidth / 2 - 200 + (Object.keys(floatingPanels).length * 25),
        y: window.innerHeight / 2 - 150 + (Object.keys(floatingPanels).length * 25),
    };

    // Create the new panel's state object.
    const newPanel: PanelState = {
      id: day,
      data: panelData,
      initialPosition,
    };

    // Add the new panel to our state, preserving existing panels.
    setFloatingPanels(prev => ({
      ...prev,
      [day]: newPanel,
    }));
  };

  /**
   * Closes a specific floating panel by its day identifier
   */
  const handleClosePanel = (day: string) => {
    setFloatingPanels(prev => {
      const newPanels = { ...prev };
      delete newPanels[day]; // Remove the panel from the state object.
      return newPanels;
    });
  };



  /** Close panels on ESC */
  React.useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setFloatingPanels({}); // Close all panels
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


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
            // ADD: Attach our new click handler to the chart.
            onClick={handleChartClick}
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

            {/* IMPORTANT: Recharts <Tooltip> is removed; we control panel ourselves */}

            {/* Dynamic lines based on selected products */}
            {generateLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>


      {/* RENDER PANELS: Map over the state and render each active FloatingPanel. */}
      {/* Since the panel uses a Portal, it can be placed anywhere in the JSX. */}
      {Object.values(floatingPanels).map((panel) => (
        <FloatingPanel
          key={panel.id}
          data={panel.data}
          initialPosition={panel.initialPosition}
          onClose={() => handleClosePanel(panel.id)}
        />
      ))}
    </div>
  );
}
