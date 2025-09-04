/**
 * @fileoverview Product selection component
 * @description Allows users to select/deselect products for chart visualization
 * Provides visual product list with color indicators and selection controls
 */

'use client';

import { generateHslColorFromString, hslToHex } from '../utils/colorUtils';

interface Product {
  id: string;
  name: string;
  recordCount: number;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProductIds: string[];
  onProductSelectionChange: (selectedIds: string[]) => void;
}

export default function ProductSelector({
  products,
  selectedProductIds,
  onProductSelectionChange
}: ProductSelectorProps) {
  // Generate color for product based on product name (same as DashboardChart)
  const getProductColor = (productName: string): string => {
    const hslColor = generateHslColorFromString(productName, 70, 55);
    return hslToHex(hslColor);
  };

  const handleProductToggle = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      // Remove from selection
      onProductSelectionChange(selectedProductIds.filter(id => id !== productId));
    } else {
      // Add to selection
      onProductSelectionChange([...selectedProductIds, productId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      // Deselect all
      onProductSelectionChange([]);
    } else {
      // Select all
      onProductSelectionChange(products.map(p => p.id));
    }
  };

  const isAllSelected = selectedProductIds.length === products.length;
  const isNoneSelected = selectedProductIds.length === 0;

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">No products available</div>
          <div className="text-sm text-gray-500">0 of 0 selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 min-h-[24rem]">
      {/* Top controls row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleSelectAll}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isAllSelected
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-sm text-gray-500">
          {selectedProductIds.length} of {products.length} selected
        </span>
      </div>

      {/* Product List */}
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {products.map((product) => {
          const isSelected = selectedProductIds.includes(product.id);
          return (
            <div
              key={product.id}
              className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <input
                type="checkbox"
                id={`product-${product.id}`}
                checked={isSelected}
                onChange={() => handleProductToggle(product.id)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor={`product-${product.id}`}
                className="ml-3 flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {product.name}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300 ml-2 flex-shrink-0"
                    style={{ backgroundColor: getProductColor(product.name) }}
                    title={`Color for ${product.name}`}
                  />
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {/* Removed the no products selected message */}
    </div>
  );
}
