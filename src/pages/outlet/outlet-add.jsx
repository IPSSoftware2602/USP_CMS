import React, { useState, useEffect } from "react";
import { X, Plus, ImageUp, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomMap from "../components/customMap";
import OperationHoursComponents from "../components/operationHours";
import { OperationHours } from "../components/operationHours";
import OutletService from "../../store/api/outletService";
import categoryService from "../../store/api/categoryService";
import itemService from "../../store/api/itemService";
import { toast } from 'react-toastify';

const AddOutletForm = () => {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  const [popupState, setPopupState] = useState({
    isOpen: false,
    type: null,
    fieldId: null
  });

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  function buildOperatingDays(operationHours) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.reduce((acc, day) => {
    acc[day] = { is_operated: operationHours[day]?.is_operated || false };
    return acc;
  }, {});
}


  useEffect(() => {
    return () => {
      // Clean up object URLs to avoid memory leaks
      images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  function buildOperatingHours(operationHours) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.reduce((acc, day) => {
    acc[day] = (operationHours[day]?.slots || []).map(slot => ({
      start_time: slot.opening,
      end_time: slot.closing
    }));
    return acc;
  }, {});
}

  const [formData, setFormData] = useState({
    outletName: "",
    outletEmail: "",
    outletContact: "",
    outletPassword: "",
    outletPasswordConfirmation: "",
    outletAddress: "",
    outletState: "",
    outletPostcode: "",
    outletLatitude: "",
    outletLongitude: "",
    outletZeoniqCode: "",
    operationHours: {
      Monday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
      Tuesday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
      Wednesday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
      Thursday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
      Friday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
      Saturday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
      Sunday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
    },
    serveMethods: [],
    deliveryOptions: [],
    deliveryRange: "",
    reservationSlots: "",
    orderSlots: "",
    pizzaSlots: "",
    eventSlots: "",
    applySst: "No",
    applyServiceTax: "No",
  });

  const [mapType, setMapType] = useState("roadmap");
  const [mapKey, setMapKey] = useState(0);
  const [markerLocation, setMarkerLocation] = useState({
    lat: parseFloat(formData.outletLatitude),
    lng: parseFloat(formData.outletLongitude),
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeTimeout, setGeocodeTimeout] = useState(null);
  const [errors, setErrors] = useState({});
  const [hasDineIn, setHasDineIn] = useState(false);

  useEffect(() => {
    const loadCategoriesAndItems = async () => {
      setLoadingCategories(true);
      try {
        const categoriesResponse = await categoryService.getCategories();
        let categoriesData = [];
        
        if (Array.isArray(categoriesResponse)) {
          categoriesData = categoriesResponse;
        } else if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        } else if (categoriesResponse.result && Array.isArray(categoriesResponse.result)) {
          categoriesData = categoriesResponse.result;
        } else if (categoriesResponse.categories && Array.isArray(categoriesResponse.categories)) {
          categoriesData = categoriesResponse.categories;
        }
        
        const itemsResponse = await itemService.getMenuItems();
        let itemsData = [];
        
        if (Array.isArray(itemsResponse)) {
          itemsData = itemsResponse;
        } else if (itemsResponse.data && Array.isArray(itemsResponse.data)) {
          itemsData = itemsResponse.data;
        } else if (itemsResponse.result && Array.isArray(itemsResponse.result)) {
          itemsData = itemsResponse.result;
        }
        
        const transformedItems = itemsData.map(item => itemService.transformApiItemToComponent(item));
        
        setCategories(categoriesData);
        setItems(transformedItems);
      } catch (error) {
        console.error('Error loading categories and items:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoriesAndItems();
  }, []);

  useEffect(() => {
  // Check if Dine-In is selected (case-insensitive)
  const dineInSelected = formData.serveMethods.some(method => 
    method.toLowerCase().includes('dine') || method.toLowerCase().includes('dinein')
  );
  setHasDineIn(dineInSelected);
}, [formData.serveMethods]);

  useEffect(() => {
    const lat = parseFloat(formData.outletLatitude);
    const lng = parseFloat(formData.outletLongitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      setMarkerLocation({
        lat: lat,
        lng: lng,
      });
    }
  }, [formData.outletLatitude, formData.outletLongitude]);

  const getUncategorizedItems = () => {
  return items.filter(item => {
    // Check all possible category fields to determine if item is uncategorized
    return !item.categoryId && 
          (!item.category || item.category.length === 0) &&
          (!item.categories || item.categories.length === 0);
  });
};

  const getItemsForCategory = (categoryId) => {
  return items.filter(item => {
    return item.categoryId === categoryId || 
          (item.category && Array.isArray(item.category) && item.category.some(cat => cat.id === categoryId)) ||
          (item.categories && Array.isArray(item.categories) && item.categories.some(cat => cat.id === categoryId));
  });
};


  const toggleCategoryExpansion = (categoryId) => {
  setExpandedCategories(prev => ({
    ...prev,
    [categoryId]: !prev[categoryId]
  }));
};

// Replace the handleItemChange function with this:
const handleItemChange = (itemId, isChecked) => {
  // Ensure we're working with numbers for IDs
  const id = Number(itemId);
  
  setSelectedMenuItems(prev => 
    isChecked 
      ? [...prev, id] 
      : prev.filter(selectedId => selectedId !== id)
  );
};

  const handleCategoryItemsChange = (categoryId, checked) => {
  const categoryItems = categoryId === 'uncategorized'
    ? getUncategorizedItems()
    : getItemsForCategory(categoryId);
    
  const categoryItemIds = categoryItems.map(item => Number(item.id));
  
  setSelectedMenuItems(prev => {
    if (checked) {
      // Add all category items that aren't already selected
      const newItems = [...prev];
      categoryItemIds.forEach(itemId => {
        if (!newItems.includes(itemId)) {
          newItems.push(itemId);
        }
      });
      return newItems;
    } else {
      // Remove all category items
      return prev.filter(id => !categoryItemIds.includes(id));
    }
  });
};

const areAllCategoryItemsSelected = (categoryId) => {
  const categoryItems = categoryId === 'uncategorized' 
    ? getUncategorizedItems()
    : getItemsForCategory(categoryId);
    
  if (categoryItems.length === 0) return false;
  
  const categoryItemIds = categoryItems.map(item => Number(item.id));
  return categoryItemIds.every(itemId => 
    selectedMenuItems.includes(itemId)
  );
};


  const getSelectedItemsNames = () => {
  if (selectedMenuItems.length === 0) return "No items selected";
  
  const allItemIds = items.map(item => Number(item.id));
  const allSelected = allItemIds.length > 0 && allItemIds.every(id => selectedMenuItems.includes(id));
  
  if (allSelected) return "All items selected";
  
  const selectedItems = items.filter(item => 
    selectedMenuItems.includes(Number(item.id))
  );
  
  const displayNames = selectedItems
    .slice(0, 3)
    .map(item => item.name || item.title || item.label || `Item #${item.id}`)
    .join(', ');
    
  return selectedItems.length > 3 
    ? `${displayNames} and ${selectedItems.length - 3} more...`
    : displayNames;
};

  const openMenuPopup = () => {
    setPopupState({
      isOpen: true,
      type: 'item',
      fieldId: 'menuItems'
    });
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      type: null,
      fieldId: null
    });
  };

  const renderPopup = () => {
  if (!popupState.isOpen) return null;

  const allItemIds = items.map(item => Number(item.id));
  const allSelected = allItemIds.length > 0 && allItemIds.every(id => selectedMenuItems.includes(id));
  
return (
  <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">Select Menu Items</h3>
        <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (allSelected) {
                  setSelectedMenuItems([]);
                } else {
                  setSelectedMenuItems(allItemIds);
                }
              }}
              className={`text-sm ${allSelected ? 'text-indigo-600' : 'text-indigo-500'} underline hover:text-indigo-700`}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={closePopup}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      
      <div className="max-h-64 overflow-y-auto p-4">
        {loadingCategories ? (
          <div className="text-center py-4">
            <div className="text-gray-500">Loading items...</div>
          </div>
        ) : categories.length === 0 && getUncategorizedItems().length === 0 ? (
          <div className="text-center py-4">
            <div className="text-gray-500">No items available</div>
          </div>
        ) : (
          <>
            {/* Existing categories rendering */}
            {categories.map((category) => {
              const categoryItems = getItemsForCategory(category.id);
              const isExpanded = expandedCategories[category.id] || false;

              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id} className="border rounded-lg mb-3">
                  <div 
                    className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleCategoryExpansion(category.id)}
                  >
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={areAllCategoryItemsSelected(category.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCategoryItemsChange(category.id, e.target.checked);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                      />
                      <span className="font-medium text-gray-900 flex-1">
                        {category.name || category.title} ({categoryItems.length} items)
                      </span>
                    </div>
                    <div>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t">
                      <div className="p-3 space-y-2">
                        {categoryItems.map((item) => (
                          <label 
                            key={item.id} 
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMenuItems.includes(Number(item.id))}
                              onChange={(e) => handleItemChange(item.id, e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name || item.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                Price: RM{item.price || 'N/A'}  | {(item.optionGroups?.length || 0)} Option Group{(item.optionGroups?.length || 0) !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* New "Other Items" section */}
            {getUncategorizedItems().length > 0 && (
              <div className="border rounded-lg mb-3">
                <div 
                  className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleCategoryExpansion('uncategorized')}
                >
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={areAllCategoryItemsSelected('uncategorized')}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCategoryItemsChange('uncategorized', e.target.checked);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                    />
                    <span className="font-medium text-gray-900 flex-1">
                      Other Items ({getUncategorizedItems().length})
                    </span>
                  </div>
                  <div>
                    {expandedCategories['uncategorized'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>

                {expandedCategories['uncategorized'] && (
                  <div className="border-t">
                    <div className="p-3 space-y-2">
                      {getUncategorizedItems().map((item) => (
                        <label 
                          key={item.id} 
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMenuItems.includes(Number(item.id))}
                            onChange={(e) => handleItemChange(item.id, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name || item.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Price: RM{item.price || 'N/A'}  | {(item.optionGroups?.length || 0)} Option Group{(item.optionGroups?.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="p-4 border-t flex justify-end space-x-2">
        <button
          onClick={closePopup}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Done
        </button>
      </div>
    </div>
  </div>
);
};

  const geocodeAddress = async (address, state, postcode) => {
    if (!address.trim() && !state.trim() && !postcode.trim()) {
      return;
    }

    const addressParts = [address, state, postcode, "Malaysia"].filter((part) =>
      part.trim()
    );
    const fullAddress = addressParts.join(", ");

    console.log('Geocoding address:', fullAddress);

    try {
      setIsGeocoding(true);

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error("Google Maps API key not found");
        setIsGeocoding(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;

        console.log("Geocoded location:", location);

        setFormData((prev) => ({
          ...prev,
          outletLatitude: location.lat.toFixed(4),
          outletLongitude: location.lng.toFixed(4),
        }));

        setMapKey((prev) => prev + 1);
      } else {
        console.error("Geocoding failed:", data.status);
        const fallbackLocations = {
          "petaling jaya": { lat: 3.1073, lng: 101.6067 },
          "kuala lumpur": { lat: 3.139, lng: 101.6869 },
          "shah alam": { lat: 3.0733, lng: 101.5185 },
          "subang jaya": { lat: 3.1478, lng: 101.582 },
          cyberjaya: { lat: 2.9213, lng: 101.6559 },
          putrajaya: { lat: 2.9264, lng: 101.6964 },
        };

        const searchKey = fullAddress.toLowerCase();
        let foundLocation = null;

        for (const [key, location] of Object.entries(fallbackLocations)) {
          if (searchKey.includes(key)) {
            foundLocation = location;
            break;
          }
        }

        if (foundLocation) {
          setFormData((prev) => ({
            ...prev,
            outletLatitude: foundLocation.lat.toFixed(4),
            outletLongitude: foundLocation.lng.toFixed(4),
          }));

          setMapKey((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (geocodeTimeout) {
      clearTimeout(geocodeTimeout);
    }

    const newTimeout = setTimeout(() => {
      const updatedFormData = { ...formData, [field]: value };
      geocodeAddress(
        updatedFormData.outletAddress,
        updatedFormData.outletState,
        updatedFormData.outletPostcode
      );
    }, 1500);

    setGeocodeTimeout(newTimeout);
  };

  const handleMapTypeChange = (type) => {
    setMapType(type);
    setMapKey((prev) => prev + 1);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      outletLatitude: location.lat.toFixed(4),
      outletLongitude: location.lng.toFixed(4),
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      let processedValue = value;
      
      if (field === 'serveMethods') {
        processedValue = value.toLowerCase().replace('-', '');
      }
      
      return {
        ...prev,
        [field]: prev[field].includes(processedValue) 
          ? prev[field].filter(item => item !== processedValue)
          : [...prev[field], processedValue]
      };
    });
  };

  const handleOperationHoursChange = (day, field, value, slotIndex = 0) => {
    setFormData((prev) => ({
      ...prev,
      operationHours: {
        ...prev.operationHours,
        [day]: {
          ...prev.operationHours[day],
          ...(field === "is_operated" ? { is_operated: value } : {}),
          ...(field !== "is_operated"
            ? {
                slots: prev.operationHours[day].slots.map((slot, idx) =>
                  idx === slotIndex ? { ...slot, [field]: value } : slot
                ),
              }
            : {}),
        },
      },
    }));
  };

  const handleAddSlot = (day) => {
    setFormData((prev) => ({
      ...prev,
      operationHours: {
        ...prev.operationHours,
        [day]: {
          ...prev.operationHours[day],
          slots: [
            ...prev.operationHours[day].slots,
            { opening: "", closing: "" },
          ],
        },
      },
    }));
  };

  const handleRemoveSlot = (day, slotIndex) => {
    setFormData((prev) => ({
      ...prev,
      operationHours: {
        ...prev.operationHours,
        [day]: {
          ...prev.operationHours[day],
          slots: prev.operationHours[day].slots.filter(
            (_, idx) => idx !== slotIndex
          ),
        },
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.outletName.trim()) {
      newErrors.outletName = "Outlet name is required";
    }

    if (!formData.outletEmail.trim()) {
      newErrors.outletEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.outletEmail)) {
      newErrors.outletEmail = "Please enter a valid email address";
    }

    if (!formData.outletContact.trim()) {
      newErrors.outletContact = "Contact number is required";
    } else if (!/^[0-9+\-\s()]{8,15}$/.test(formData.outletContact)) {
      newErrors.outletContact = "Please enter a valid contact number";
    }

    if (!formData.outletPassword) {
      newErrors.outletPassword = "Password is required";
    } else if (formData.outletPassword.length < 8) {
      newErrors.outletPassword = "Password must be at least 8 characters";
    }

    if (!formData.outletPasswordConfirmation) {
      newErrors.outletPasswordConfirmation =
        "Password confirmation is required";
    } else if (
      formData.outletPassword !== formData.outletPasswordConfirmation
    ) {
      newErrors.outletPasswordConfirmation = "Passwords do not match";
    }

    if (!formData.outletAddress.trim()) {
      newErrors.outletAddress = "Address is required";
    }

    if (!formData.outletState.trim()) {
      newErrors.outletState = "State is required";
    }

    if (!formData.outletPostcode.trim()) {
      newErrors.outletPostcode = "Postcode is required";
    } else if (!/^\d{5}$/.test(formData.outletPostcode)) {
      newErrors.outletPostcode = "Please enter a valid 5-digit postcode";
    }

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const hasOpenDay = days.some(
      (day) => formData.operationHours[day].is_operated
    );
    if (!hasOpenDay) {
      newErrors.operationHours = "At least one day must be open";
    }

    days.forEach((day) => {
      if (formData.operationHours[day].is_operated) {
        const hasValidSlot = formData.operationHours[day].slots.some(
          (slot) => slot.opening && slot.closing
        );
        if (!hasValidSlot) {
          newErrors[
            `${day}_slots`
          ] = `${day} must have at least one complete time slot`;
        }
      }
    });

    if (formData.serveMethods.length === 0) {
      newErrors.serveMethods = "At least one serve method must be selected";
    }

    if (formData.serveMethods.includes("Delivery")) {
      if (formData.deliveryOptions.length === 0) {
        newErrors.deliveryOptions =
          "At least one delivery option must be selected when delivery is enabled";
      }
      if (!formData.deliveryRange || formData.deliveryRange <= 0) {
        newErrors.deliveryRange =
          "Delivery range must be greater than 0 when delivery is enabled";
      }
    }

    if (
      formData.serveMethods.includes("Reservation") &&
      (!formData.reservationSlots || formData.reservationSlots <= 0)
    ) {
      newErrors.reservationSlots =
        "Reservation slots must be greater than 0 when reservation is enabled";
    }

    if (!formData.orderSlots || formData.orderSlots <= 0) {
      newErrors.orderSlots =
        "Order slots per hour is required and must be greater than 0";
    }

    if (!formData.pizzaSlots || formData.pizzaSlots <= 0) {
      newErrors.pizzaSlots =
        "Pizza made per hour is required and must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    // Prepare tax data (already correct)
    const taxData = [];
    if (formData.applySst === "Yes") taxData.push(1);
    if (formData.applyServiceTax === "Yes") taxData.push(2);
    // Prepare operating schedule (already correct)
    const operatingDays = buildOperatingDays(formData.operationHours);
    const operatingHours = buildOperatingHours(formData.operationHours);

    // Prepare images (already correct)
    const imageFiles = images.map(img => img.file || img);

    // Construct outlet data (adjusted to match service expectations)
    const outletData = {
      title: formData.outletName,
      email: formData.outletEmail,
      phone: formData.outletContact,
      address: formData.outletAddress,
      state: formData.outletState,
      postal_code: formData.outletPostcode,
      country: "Malaysia",
      status: "active",
      zeoniq_loc_code: formData.outletZeoniqCode,
      latitude: formData.outletLatitude,
      longitude: formData.outletLongitude,
      password: formData.outletPassword,
      serve_method: formData.serveMethods.join(", "),
      delivery_options: formData.deliveryOptions.join(", "),
      outlet_delivery_coverage: formData.deliveryRange || "0",
      order_max_per_hour: formData.orderSlots || "0",
      item_max_per_hour: formData.pizzaSlots || "0",
      outlet_menu: selectedMenuItems.map(Number),
      outlet_tax: taxData,
      operating_days: operatingDays,
      operating_hours: operatingHours,
      operating_hours_exceptions: [],
      images: imageFiles
    };

    console.log("Submitting outlet data:", outletData);
    const response = await OutletService.createOutlet(outletData);
    
    if (response && response.status === 200) {
      toast.success("Outlet created successfully!", {
        onClose: () => {
          navigate('/outlets');
        }
      });
    } else {
      throw new Error(response?.message || "Failed to create outlet");
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error(err.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
  }
};

  const getInputClasses = (fieldName) => {
    const baseClasses =
      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2";
    const errorClasses = "border-red-500 focus:ring-red-500";
    const normalClasses = "border-gray-300 focus:ring-indigo-500";

    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <p className="text-red-500 text-sm mt-1">{error}</p>;
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  const serveMethods = ["Dine-In", "Delivery", "Pick-Up"];
  const deliveryOptions = ["Lalamove", "Grab Express", "3rd Party Delivery"];

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Add New Outlet</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={handleBack}
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Account Details Section */}
        <div>
          <div className="bg-indigo-900 text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">
              ACCOUNT DETAILS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Name
              </label>
              <input
                type="text"
                placeholder="Enter here..."
                className={getInputClasses("outletName")}
                value={formData.outletName}
                onChange={(e) =>
                  handleInputChange("outletName", e.target.value)
                }
              />
              <ErrorMessage error={errors.outletName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Email
              </label>
              <input
                type="email"
                placeholder="Enter here..."
                className={getInputClasses("outletEmail")}
                value={formData.outletEmail}
                onChange={(e) =>
                  handleInputChange("outletEmail", e.target.value)
                }
              />
              <ErrorMessage error={errors.outletEmail} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Contact No.
              </label>
              <input
                type="text"
                placeholder="Enter here..."
                className={getInputClasses("outletContact")}
                value={formData.outletContact}
                onChange={(e) =>
                  handleInputChange("outletContact", e.target.value)
                }
              />
              <ErrorMessage error={errors.outletContact} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Password
              </label>
              <input
                type="password"
                placeholder="Enter here..."
                className={getInputClasses("outletPassword")}
                value={formData.outletPassword}
                onChange={(e) =>
                  handleInputChange("outletPassword", e.target.value)
                }
              />
              <ErrorMessage error={errors.outletPassword} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Password Confirmation
              </label>
              <input
                type="password"
                placeholder="Enter here..."
                className={getInputClasses("outletPasswordConfirmation")}
                value={formData.outletPasswordConfirmation}
                onChange={(e) =>
                  handleInputChange(
                    "outletPasswordConfirmation",
                    e.target.value
                  )
                }
              />
              <ErrorMessage error={errors.outletPasswordConfirmation} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Zeoniq Code
              </label>
              <input
                type="text"
                placeholder="Enter Zeoniq code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletZeoniqCode}
                onChange={(e) =>
                  handleInputChange(
                    "outletZeoniqCode",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Address & Location Section */}
        <div>
          <div className="bg-indigo-900 text-white text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">
              ADDRESS & LOCATION
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Address
                {isGeocoding && (
                  <span className="text-blue-500 text-xs ml-2">
                    (Searching location...)
                  </span>
                )}
              </label>
              <textarea
                placeholder="Enter address here... (e.g., 123 Jalan Bukit Bintang)"
                rows="3"
                className={`${getInputClasses("outletAddress")} resize-none`}
                value={formData.outletAddress}
                onChange={(e) =>
                  handleAddressChange("outletAddress", e.target.value)
                }
              />
              <ErrorMessage error={errors.outletAddress} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outlet State</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletState}
                onChange={(e) => handleAddressChange('outletState', e.target.value)}
              >
                <option value="">Select State</option>
                <option value="Johor">Johor</option>
                <option value="Kedah">Kedah</option>
                <option value="Kelantan">Kelantan</option>
                <option value="Malacca">Melaka</option>
                <option value="Negeri Sembilan">Negeri Sembilan</option>
                <option value="Pahang">Pahang</option>
                <option value="Penang">Pulau Pinang</option>
                <option value="Perak">Perak</option>
                <option value="Perlis">Perlis</option>
                <option value="Sabah">Sabah</option>
                <option value="Sarawak">Sarawak</option>
                <option value="Selangor">Selangor</option>
                <option value="Terengganu">Terengganu</option>
                <option value="Kuala Lumpur">Kuala Lumpur</option>
                <option value="Labuan">Labuan</option>
                <option value="Putrajaya">Putrajaya</option>
              </select>
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Postcode
                </label>
                <input
                  type="text"
                  placeholder="Enter postcode here... (e.g., 50200)"
                  className={getInputClasses("outletPostcode")}
                  value={formData.outletPostcode}
                  onChange={(e) =>
                    handleAddressChange("outletPostcode", e.target.value)
                  }
                />
                <ErrorMessage error={errors.outletPostcode} />
              </div>
            </div>

            {/* Map Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="flex bg-gray-100 border-b">
                  <button
                    className={`px-4 py-2 text-sm ${
                      mapType === "roadmap"
                        ? "bg-white text-black"
                        : "text-gray-600"
                    }`}
                    onClick={() => handleMapTypeChange("roadmap")}
                  >
                    Map
                  </button>
                  <button
                    className={`px-4 py-2 text-sm ${
                      mapType === "satellite"
                        ? "bg-white text-black"
                        : "text-gray-600"
                    }`}
                    onClick={() => handleMapTypeChange("satellite")}
                  >
                    Satellite
                  </button>
                </div>
                <div className="h-64 bg-gray-200 relative">
                  <CustomMap
                    key={mapKey}
                    mapType={mapType}
                    onLocationSelect={handleLocationSelect}
                    initialLocation={markerLocation}
                  />
                  {isGeocoding && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                        <span className="text-sm text-gray-600">
                          Updating location...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Latitude
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Auto-filled from address"
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.outletLatitude}
                    onChange={(e) =>
                      handleInputChange("outletLatitude", e.target.value)
                    }
                  />
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Longitude
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Auto-filled from address"
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.outletLongitude}
                    onChange={(e) =>
                      handleInputChange("outletLongitude", e.target.value)
                    }
                  />
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operation Hours Section */}
        <OperationHours
          days={days}
          operationHours={formData.operationHours}
          handleOperationHoursChange={handleOperationHoursChange}
          handleAddSlot={handleAddSlot}
          handleRemoveSlot={handleRemoveSlot}
        />

        {/* Outlet Image and Menu Setup Section */}
        <div>
          <div className="bg-indigo-900 text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">
              OUTLET IMAGE AND MENU SETUP
            </h3>
          </div>

          <div className="space-y-6">
            <div className="border border-dashed p-8 flex flex-col items-center justify-center">
              {images.length === 0 ? (
                <>
                  <p className="text-gray-500 text-sm">
                    800×800, JPG, PNG, max 10MB
                  </p>
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <ImageUp className="text-gray-400" size={24} />
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('image-upload').click()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload Images
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload').click()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add More Images
                </button>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newImages = files.map(file => ({
                    file,
                    name: file.name,
                    preview: URL.createObjectURL(file)
                  }));
                  setImages(prev => [...prev, ...newImages]);
                }}
              />
            </div>

            {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  {image.preview ? (
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Preview not available</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

            {/* Menu Items Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Items
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={openMenuPopup}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left flex justify-between items-center"
                >
                  <span>
                    {selectedMenuItems.length > 0
                      ? `${selectedMenuItems.length} items selected`
                      : 'Select menu items'}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
              </div>
              
              {selectedMenuItems.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  Selected items: {getSelectedItemsNames()}
                </div>
              )}
              
              {renderPopup()}
            </div>
          </div>
        </div>

        {/* Serve Method Section */}
        <div>
          <div className="bg-indigo-900 text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">SERVE METHOD</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serve Methods
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {serveMethods.map((method) => (
                  <label key={method} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.serveMethods.includes(method.toLowerCase().replace('-', ''))}
                      onChange={() => handleMultiSelect('serveMethods', method)}
                      className="rounded"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
              <ErrorMessage error={errors.serveMethods} />
            </div>

            {formData.serveMethods.includes('delivery') && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Options
                    </label>
                    <div className="space-y-2">
                      {deliveryOptions.map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.deliveryOptions.includes(option)}
                            onChange={() => handleMultiSelect('deliveryOptions', option)}
                            className="rounded"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    <ErrorMessage error={errors.deliveryOptions} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Capacity Settings Section */}
        <div>
          <div className="bg-indigo-900 text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">CAPACITY SETTINGS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formData.serveMethods.includes('Reservation') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reservation Slots
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter slots"
                  className={getInputClasses("reservationSlots")}
                  value={formData.reservationSlots}
                  onChange={(e) => handleInputChange('reservationSlots', e.target.value)}
                />
                <ErrorMessage error={errors.reservationSlots} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Slots per Hour
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter slots"
                className={getInputClasses("orderSlots")}
                value={formData.orderSlots}
                onChange={(e) => handleInputChange('orderSlots', e.target.value)}
              />
              <ErrorMessage error={errors.orderSlots} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pizza Made per Hour
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter amount"
                className={getInputClasses("pizzaSlots")}
                value={formData.pizzaSlots}
                onChange={(e) => handleInputChange('pizzaSlots', e.target.value)}
              />
              <ErrorMessage error={errors.pizzaSlots} />
            </div>
          </div>
        </div>

        {/* Tax Settings Section */}
        <div>
          <div className="bg-indigo-900 text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">TAX SETTINGS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply SST
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.applySst}
                onChange={(e) => handleInputChange('applySst', e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {hasDineIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Service Charge
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.applyServiceTax}
                onChange={(e) => handleInputChange('applyServiceTax', e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Create Outlet
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOutletForm;