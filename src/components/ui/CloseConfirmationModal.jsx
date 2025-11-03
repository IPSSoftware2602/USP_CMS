import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const CloseConfirmationModal = ({ isOpen, onClose, onConfirm, hasUnsavedItems }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg border shadow-lg w-full max-w-md p-6 mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Close
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {hasUnsavedItems 
              ? "You have created new option items that will be lost. This action cannot be reverted. Are you sure you want to close?"
              : "Are you sure you want to close? Any unsaved changes will be lost."
            }
          </p>
        </div>
        
        <div className="flex justify-center gap-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {hasUnsavedItems ? "Close & Clear Items" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseConfirmationModal;