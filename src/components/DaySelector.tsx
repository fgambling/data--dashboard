/**
 * @fileoverview Day range selection component
 * @description Allows users to filter chart data by selecting specific day ranges
 * Provides intuitive controls for setting start and end dates
 */

'use client';
import React from 'react';
interface DayRange {
  start: number | null;
  end: number | null;
}

interface DaySelectorProps {
  dayRange: DayRange;
  onDayRangeChange: (range: DayRange) => void;
  availableDays?: { start: number; end: number };
}

export default function DaySelector({
  dayRange,
  onDayRangeChange,
  availableDays
}: DaySelectorProps) {
  const [error, setError] = React.useState<string>('');
  const rangeStart = availableDays?.start ?? 1;
  const rangeEnd = availableDays?.end ?? 999;
  const MAX_OPTIONS = 500;
  const options: number[] = [];
  const total = Math.min(MAX_OPTIONS, Math.max(0, rangeEnd - rangeStart + 1));
  for (let i = 0; i < total; i++) {
    options.push(rangeStart + i);
  }

  const handleStartDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStart = parseInt(e.target.value);
    const currentEnd = dayRange.end ?? rangeEnd;
    if (newStart >= currentEnd) {
      setError('Start day must be earlier than end day');
      // revert visual selection by not updating parent; controlled value will snap back
      // also reset select element to current value
      e.currentTarget.value = String(dayRange.start ?? rangeStart);
      return;
    }
    setError('');
    onDayRangeChange({ ...dayRange, start: newStart });
  };

  const handleEndDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnd = parseInt(e.target.value);
    const currentStart = dayRange.start ?? rangeStart;
    if (newEnd <= currentStart) {
      setError('End day must be later than start day');
      e.currentTarget.value = String(dayRange.end ?? Math.min(rangeStart + 1, rangeEnd));
      return;
    }
    setError('');
    onDayRangeChange({ ...dayRange, end: newEnd });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 min-h-[24rem]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Day Selection</h3>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-4">
        {/* Start Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Day
          </label>
          <select
            value={dayRange.start ?? (availableDays ? Math.min(availableDays.start, rangeEnd - 1) : '')}
            onChange={handleStartDayChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {options.map((d) => (
              <option key={`start-${d}`} value={d}>{`Day ${d}`}</option>
            ))}
          </select>
        </div>

        {/* End Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Day
          </label>
          <select
            value={dayRange.end ?? (availableDays ? Math.max(availableDays.start + 1, availableDays.end) : '')}
            onChange={handleEndDayChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {options.map((d) => (
              <option key={`end-${d}`} value={d}>{`Day ${d}`}</option>
            ))}
          </select>
        </div>

        {/* Clear All Button */}
        <div className="pt-2">
          <button
            onClick={() => onDayRangeChange({ start: null, end: null })}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear All (Show All Days)
          </button>
        </div>

        {/* Current Selection Info */}
        {(dayRange.start || dayRange.end) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> Days {dayRange.start || availableDays?.start || 1} - {dayRange.end || availableDays?.end || 999}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
