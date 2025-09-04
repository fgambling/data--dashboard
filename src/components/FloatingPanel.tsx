/**
 * @fileoverview Floating panel component with drag functionality
 * @description A draggable, closable floating panel for displaying detailed data
 * Compatible with React 19 (no external drag libraries)
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Data structure for product metrics displayed in the floating panel
 */
interface ProductMetrics {
  inventory?: number;
  salesAmount?: number;
  procurementAmount?: number;
  salesPrice?: number;
  procurementPrice?: number;
}

/**
 * Complete data structure for the floating panel content
 */
interface PanelData {
  day: string;
  products: {
    [productName: string]: ProductMetrics;
  };
}

/**
 * Props interface for the FloatingPanel component
 */
interface FloatingPanelProps {
  data: PanelData;
  onClose: () => void; // A callback function to close the panel.
  initialPosition?: { x: number; y: number }; // Where the panel first appears.
}

/**
 * A draggable and closable floating panel component
 * that displays detailed daily data.
 * Simplified version without react-draggable/react-resizable to avoid React 19 compatibility issues.
 */
const FloatingPanel: React.FC<FloatingPanelProps> = ({ data, onClose, initialPosition }) => {
  const [position, setPosition] = React.useState(initialPosition || { x: 100, y: 100 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  /**
   * Handle mouse down event for initiating drag operation
   * Only allow dragging if not clicking on close button
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.close-button')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  /**
   * Handle mouse move event during drag operation
   * Updates panel position based on mouse movement
   */
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  /**
   * Handle mouse up event to end drag operation
   */
  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Set up and clean up global event listeners for drag functionality
   * Only attach listeners when dragging to avoid performance issues
   */
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Prevent SSR issues by checking for window object
  if (typeof window === 'undefined') return null;

  // Use createPortal to render the panel directly into the document body.
  // This prevents it from being clipped by parent containers (like the chart).
  return createPortal(
    <div
      className="bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        width: 380,
        height: 400,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header: Contains the title and close button, and serves as the drag handle. */}
      <div
        className="bg-gray-100 p-2 flex justify-between items-center cursor-grab border-b border-gray-200"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-bold text-gray-800">{data.day} - Details</h3>
        <button
          onClick={onClose}
          className="close-button text-gray-500 hover:text-red-600 font-bold text-lg leading-none p-1"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      {/* Content: Displays the product data. It's scrollable if content overflows. */}
      <div className="p-4 overflow-y-auto flex-grow">
        {Object.entries(data.products).map(([productName, metrics]) => (
          <div key={productName} className="mb-4 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
            <p className="font-semibold text-gray-800 mb-2">{productName}</p>
            <div className="space-y-1.5 text-sm">
              {metrics.inventory !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">📦 Inventory:</span>
                  <span className="font-medium">{metrics.inventory.toLocaleString()}</span>
                </div>
              )}
              {metrics.salesAmount !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">💰 Sales Amount:</span>
                  <span className="font-medium text-green-600">${metrics.salesAmount.toLocaleString()}</span>
                </div>
              )}
              {metrics.salesPrice !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🏷️ Sales Price:</span>
                  <span className="font-medium text-green-600">${metrics.salesPrice.toLocaleString()}</span>
                </div>
              )}
              {metrics.procurementAmount !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🛒 Procurement Amount:</span>
                  <span className="font-medium text-orange-600">${metrics.procurementAmount.toLocaleString()}</span>
                </div>
              )}
               {metrics.procurementPrice !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🏷️ Procurement Price:</span>
                  <span className="font-medium text-orange-600">${metrics.procurementPrice.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default FloatingPanel;
