import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { TimePicker } from "antd";
import dayjs from 'dayjs';

const OperationHoursRow = ({ day, operationHours, handleOperationHoursChange, handleAddSlot, handleRemoveSlot }) => {
  const dayData = operationHours[day] || { is_operated: false, slots: [] };
  const slots = Array.isArray(dayData.slots) ? dayData.slots : [];

  return (
    <div>
      <div className="flex items-center mb-3">
        <span className="text-sm font-medium text-gray-700 w-20">{day}</span>
        <label className="flex items-center ml-4">
          <input
            type="checkbox"
            className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            checked={dayData.is_operated}
            onChange={(e) => handleOperationHoursChange(day, 'is_operated', e.target.checked)}
          />
          <span className="text-sm text-gray-600">Mark as open</span>
        </label>
      </div>

      {dayData.is_operated && slots.map((slot, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-24 mb-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Opening Hours</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={slot.opening}
              onChange={(e) => handleOperationHoursChange(day, 'opening', e.target.value, index)}
              disabled={!operationHours[day].is_operated}
            />
            {/* <TimePicker
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={slot.opening ? dayjs(slot.opening, 'HH:mm') : ""}
                onChange={(time) => handleOperationHoursChange(day, 'opening', time, index)}
                disabled={!operationHours[day].is_operated}
                format="HH:mm"
              /> */}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Closing Hours</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={slot.closing}
                onChange={(e) => handleOperationHoursChange(day, 'closing', e.target.value, index)}
                disabled={!operationHours[day].is_operated}
              />
              {/* <TimePicker
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={slot.closing ? dayjs(slot.closing, 'HH:mm') : ""}
                onChange={(time) => handleOperationHoursChange(day, 'closing', time, index)}
                disabled={!operationHours[day].is_operated}
                format="HH:mm"
              /> */}
            </div>

            <button
              type="button"
              className="mt-6 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={() => {
                console.log('Adding slot for', day);
                handleAddSlot(day);
              }}
              disabled={!operationHours[day].is_operated}
              title="Add time slot"
            >
              <Plus size={20} />
            </button>

            {slots.length > 1 && (
              <button
                type="button"
                className="mt-6 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-red-300"
                onClick={() => {
                  console.log('Removing slot', index, 'for', day);
                  handleRemoveSlot(day, index);
                }}
                disabled={!operationHours[day].is_operated}
                title="Remove time slot"
              >
                <X size={20} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const OperationHours = ({ days, operationHours, handleOperationHoursChange, handleAddSlot, handleRemoveSlot }) => (
  <div>
    <div className="bg-indigo-900 text-center py-2 mb-6">
      <h3 className="text-lg text-white font-semibold">OPERATION HOURS</h3>
    </div>
    <div className="space-y-2">
      {days.map((day) => (
        <OperationHoursRow
          key={day}
          day={day}
          operationHours={operationHours}
          handleOperationHoursChange={handleOperationHoursChange}
          handleAddSlot={handleAddSlot}
          handleRemoveSlot={handleRemoveSlot}
        />
      ))}
    </div>
  </div>
);

const OperationHoursComponents = () => {
  const [operationHours, setOperationHours] = useState({
    Monday: { is_operated: false, slots: [{ opening: '', closing: '' }] },
    Tuesday: { iis_operated: false, slots: [{ opening: '', closing: '' }] },
    Wednesday: { is_operated: false, slots: [{ opening: '', closing: '' }] },
    Thursday: { is_operated: false, slots: [{ opening: '', closing: '' }] },
    Friday: { is_operated: false, slots: [{ opening: '', closing: '' }] },
    Saturday: { is_operated: false, slots: [{ opening: '', closing: '' }] },
    Sunday: { is_operated: false, slots: [{ opening: '', closing: '' }] }
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <OperationHours
        days={days}
        operationHours={operationHours}
        handleOperationHoursChange={handleOperationHoursChange}
        handleAddSlot={handleAddSlot}
        handleRemoveSlot={handleRemoveSlot}
      />
    </div>
  );
};

export default OperationHoursComponents;
export { OperationHours };