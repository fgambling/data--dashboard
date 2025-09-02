'use client';

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
  const handleStartDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value);
    onDayRangeChange({
      ...dayRange,
      start: value
    });
  };

  const handleEndDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value);
    onDayRangeChange({
      ...dayRange,
      end: value
    });
  };

  const clearStartDay = () => {
    onDayRangeChange({
      ...dayRange,
      start: null
    });
  };

  const clearEndDay = () => {
    onDayRangeChange({
      ...dayRange,
      end: null
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Day Selection</h3>
        <span className="text-sm text-gray-500">
          {availableDays ? `Days ${availableDays.start} - ${availableDays.end}` : 'All days'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Start Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Day
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={dayRange.start || ''}
              onChange={handleStartDayChange}
              placeholder={availableDays ? availableDays.start.toString() : "1"}
              min={availableDays?.start || 1}
              max={availableDays?.end || 999}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={clearStartDay}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear start day"
            >
              ✕
            </button>
          </div>
        </div>

        {/* End Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Day
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={dayRange.end || ''}
              onChange={handleEndDayChange}
              placeholder={availableDays ? availableDays.end.toString() : "999"}
              min={availableDays?.start || 1}
              max={availableDays?.end || 999}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={clearEndDay}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear end day"
            >
              ✕
            </button>
          </div>
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
