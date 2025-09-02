'use client';

import { useState } from 'react';

interface DataSet {
  id: number;
  name: string;
  createdAt: string;
  productCount: number;
}

interface DatasetManagerProps {
  datasets: DataSet[];
  selectedId: number | null;
  onDatasetSelect: (id: number | null) => void;
  onDatasetUpdate: () => void;
}

export default function DatasetManager({
  datasets,
  selectedId,
  onDatasetSelect,
  onDatasetUpdate
}: DatasetManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleEditStart = (dataset: DataSet) => {
    setEditingId(dataset.id);
    setEditingName(dataset.name);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleEditSave = async () => {
    if (!editingName.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/datasets/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Dataset name updated successfully!');
        onDatasetUpdate(); // Refresh datasets
        setEditingId(null);
        setEditingName('');
      } else {
        alert(data.error || 'Failed to update dataset name');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update dataset name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (datasetId: number, datasetName: string) => {
    const confirmMessage = `Are you sure you want to delete "${datasetName}"?\n\nThis will permanently delete all associated data.\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(datasetId);
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Dataset "${datasetName}" deleted successfully!`);
        onDatasetUpdate(); // Refresh datasets

        // If deleted dataset was selected, clear selection
        if (selectedId === datasetId) {
          onDatasetSelect(null);
        }
      } else {
        alert(data.error || 'Failed to delete dataset');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete dataset');
    } finally {
      setIsDeleting(null);
    }
  };

  if (datasets.length === 0) {
    return null; // Don't show anything if no datasets
  }

  const selectedDataset = datasets.find(d => d.id === selectedId);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Select Dataset</h2>
        <span className="text-sm text-gray-500">{datasets.length} datasets available</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Dataset Selector */}
        <div className="flex-1">
          {editingId ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter dataset name"
                disabled={isUpdating}
              />
              <button
                onClick={handleEditSave}
                disabled={isUpdating || !editingName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleEditCancel}
                disabled={isUpdating}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              value={selectedId || ''}
              onChange={(e) => onDatasetSelect(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a dataset...</option>
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.productCount} products)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons - only show if a dataset is selected */}
        {selectedDataset && !editingId && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEditStart(selectedDataset)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-600 transition-colors"
              title="Edit dataset name"
            >
              Edit Name
            </button>
            <button
              onClick={() => handleDelete(selectedDataset.id, selectedDataset.name)}
              disabled={isDeleting === selectedDataset.id}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-600 transition-colors disabled:opacity-50"
              title="Delete dataset"
            >
              {isDeleting === selectedDataset.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>


    </div>
  );
}
