import React from 'react';
import { toast } from "react-toastify";

const 
DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success("Item deleted successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      onClose();
    } catch (error) {
      toast.error("Invalid credentials", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: "⚠️"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white shadow-xl rounded-md p-6 w-full max-w-md border border-gray-200">
        <h2 className="text-lg font-medium mb-4 text-center">Are you sure you want to delete?</h2>
        <p className="mb-6 text-center">
          Deleting this item is permanent and cannot be undone.
        </p>
        <div className="flex justify-center space-x-6 mt-2">
          <button 
            className="px-8 py-2 border border-gray-300 rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-8 py-2 bg-indigo-900 text-white rounded-md"
            onClick={handleConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;