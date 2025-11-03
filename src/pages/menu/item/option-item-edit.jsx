import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import optionGroupService from '../../../store/api/optionGroupService';

const EditOptionItemModal = ({
  isOpen,
  onClose,
  onSave,
  itemData = null,
  optionGroupData = null,
}) => {
  const [title, setTitle] = useState('');
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("itemData", itemData);
    if (isOpen && itemData) {
      setTitle(itemData.title || '');
      setPriceAdjustment(itemData.price_adjustment?.toString() || itemData.price?.toString() || '0.00');
      if (itemData.image && typeof itemData.image === 'string' && itemData.image.trim()) {
        // Base64 or server-stored string
        setImage(itemData.image);
        setImagePreview(null);
      } else if (itemData.imagePreview) {
        // Blob or preview URL
        setImage(itemData.image);
        setImagePreview(itemData.imagePreview);
      } else {

        // No image
        // setImage(null);
        // setImagePreview(null);
      }
      setError(null);
    }
  }, [isOpen, itemData]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
        setError('Only PNG and JPG files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setImage(file);
        setImagePreview(imageData);
        setError(null);
      };
      //   console.log(888888)
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImage(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!priceAdjustment || isNaN(parseFloat(priceAdjustment))) {
      setError('Valid price adjustment is required');
      return;
    }

    if (!optionGroupData || !optionGroupData.options) {
      setError('Option group data is missing.');
      return;
    }

    if (itemData?.sourceGroupId && itemData.sourceGroupId !== itemData.optionGroupId) {
      setError('Cannot edit items from other categories.');
      return;
    }
    // console.log(image)
    const updatedItem = {
      ...itemData,
      title: title.trim(),
      name: title.trim(),
      price_adjustment: parseFloat(priceAdjustment),
      price: parseFloat(priceAdjustment),
      images: image || null,
      imagePreview: null,
    };

    // if (!image && !imagePreview) {
    //     updatedItem.images = null;
    //     updatedItem.imagePreview = null;
    //     updatedItem.image = null;
    // }

    if (itemData?.isNewlyCreated) {
      const createdItems = JSON.parse(localStorage.getItem('createdOptionItems') || '[]');
      const updatedCreatedItems = createdItems.map(item =>
        item.id === itemData.id ? updatedItem : item
      );
      localStorage.setItem('createdOptionItems', JSON.stringify(updatedCreatedItems));
    }
    // console.log(88888)
    console.log(updatedItem)
    onSave(updatedItem);
    handleClose();
  };

  const handleClose = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setTitle('');
    setPriceAdjustment('0.00');
    setImage(null);
    setImagePreview(null);
    setError(null);
    onClose();
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPriceAdjustment(value);
    }
  };

  if (!isOpen) return null;

  const displayImage = imagePreview || image;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Edit Option Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter option item title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          {/* Price Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Price Adjustment (RM) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={priceAdjustment}
              onChange={handlePriceChange}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>

          {/* Image Upload Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Image (Optional)
            </label>

            {displayImage ? (
              <div className="relative inline-block">
                <img
                  src={displayImage}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer bg-white text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-50 transition-colors mr-1">
                    Replace
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={removeImage}
                    className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium text-sm">Click to upload image</span>
                <span className="text-gray-400 text-xs mt-1">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOptionItemModal;