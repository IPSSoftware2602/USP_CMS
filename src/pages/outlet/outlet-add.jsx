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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [selectedOptionGroups, setSelectedOptionGroups] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
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
    deliverySettings: [{
      days: {
        '1': true, '2': true, '3': true, '4': true, '5': false, '6': false, '0': false
      },
      startTime: "10:00 AM",
      endTime: "10:00 PM",
      interval: 15,
      maxOrders: 10,
      leadTime: { day: 0, hour: 0, minute: 45 }
    }],
    editingDeliveryIndex: null,
    showDeliveryModal: false,
    deliveryModalData: {
      days: { '1': true, '2': true, '3': true, '4': true, '5': false, '6': false, '0': false },
      startTime: "10:00 AM",
      endTime: "10:00 PM",
      interval: 15,
      maxOrders: 10,
      leadTime: { day: 0, hour: 0, minute: 45 }
    },
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

        const itemsResponse = await itemService.getMenuItemsFullList();
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

  const toggleCheckboxArray = (setter, keys, isChecked) => {
    setter(prev => {
      let next = [...prev];
      if (isChecked) {
        keys.forEach(k => { if (!next.includes(k)) next.push(k); });
      } else {
        next = next.filter(k => !keys.includes(k));
      }
      return next;
    });
  };

  const handleItemChange = (itemId, isChecked, item) => {
    const id = Number(itemId);

    setSelectedMenuItems((prev) =>
      isChecked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)
    );

    // If checking an item, auto-select all its variations and options
    if (item) {
      const varKeys = [];
      const ogKeys = [];
      const optKeys = [];

      if (item.variation_group) {
        item.variation_group.forEach(vg => {
          const v = vg.variation || vg;
          const varId = v.id;
          varKeys.push(`v-${id}-${varId}`);
          
          const optionGroups = vg.option_groups || v.option_groups || v.variation_options_groups || [];
          if (optionGroups) {
            optionGroups.forEach(og => {
              const ogId = og.id || og.option_group_id || og.option_group?.id;
              ogKeys.push(`vog-${id}-${varId}-${ogId}`);
              const optionsList = og.options || og.option_group?.options || [];
              if (optionsList) {
                optionsList.forEach(opt => optKeys.push(`vo-${id}-${varId}-${ogId}-${opt.id}`));
              }
            });
          }
        });
      }

      if (item.menu_option_group) {
        item.menu_option_group.forEach(mog => {
          const mogId = mog.option_group?.id || mog.id;
          ogKeys.push(`mog-${id}-${mogId}`);
          const optionsList = mog.options || mog.option_group?.options || [];
          if (optionsList) {
            optionsList.forEach(opt => optKeys.push(`mo-${id}-${mogId}-${opt.id}`));
          }
        });
      }
      toggleCheckboxArray(setSelectedVariations, varKeys, isChecked);
      toggleCheckboxArray(setSelectedOptionGroups, ogKeys, isChecked);
      toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
    }
  };

  const handleVariationToggle = (menuItemId, variationId, isChecked, variation) => {
    const varKey = `v-${menuItemId}-${variationId}`;
    setSelectedVariations(prev =>
      isChecked ? [...prev, varKey] : prev.filter(k => k !== varKey)
    );

    // If variation checked, auto-select all its option groups and options
    if (variation && isChecked) {
      const ogKeys = [];
      const optKeys = [];
      if (variation.option_groups) {
        variation.option_groups.forEach(og => {
          const ogId = og.id || og.option_group_id;
          ogKeys.push(`vog-${menuItemId}-${variationId}-${ogId}`);
          if (og.options) {
            og.options.forEach(opt => optKeys.push(`vo-${menuItemId}-${variationId}-${ogId}-${opt.id}`));
          }
        });
      }
      toggleCheckboxArray(setSelectedOptionGroups, ogKeys, true);
      toggleCheckboxArray(setSelectedOptions, optKeys, true);
    }
  };

  const handleVariationOptionGroupToggle = (menuItemId, variationId, ogId, isChecked, options) => {
    const ogKey = `vog-${menuItemId}-${variationId}-${ogId}`;
    setSelectedOptionGroups(prev =>
      isChecked ? [...prev, ogKey] : prev.filter(k => k !== ogKey)
    );

    const optKeys = (options || []).map(opt => `vo-${menuItemId}-${variationId}-${ogId}-${opt.id}`);
    toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
  };

  const handleVariationOptionToggle = (menuItemId, variationId, ogId, optionId, isChecked) => {
    const optKey = `vo-${menuItemId}-${variationId}-${ogId}-${optionId}`;
    setSelectedOptions(prev =>
      isChecked ? [...prev, optKey] : prev.filter(k => k !== optKey)
    );
  };

  const handleMenuOptionGroupToggle = (menuItemId, mogId, isChecked, options) => {
    const ogKey = `mog-${menuItemId}-${mogId}`;
    setSelectedOptionGroups(prev =>
      isChecked ? [...prev, ogKey] : prev.filter(k => k !== ogKey)
    );

    const optKeys = (options || []).map(opt => `mo-${menuItemId}-${mogId}-${opt.id}`);
    toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
  };

  const handleMenuOptionToggle = (menuItemId, mogId, optionId, isChecked) => {
    const optKey = `mo-${menuItemId}-${mogId}-${optionId}`;
    setSelectedOptions(prev =>
      isChecked ? [...prev, optKey] : prev.filter(k => k !== optKey)
    );
  };

  const handleCategoryItemsChange = (categoryId, checked) => {
    const categoryItems =
      categoryId === "uncategorized"
        ? getUncategorizedItems()
        : getItemsForCategory(categoryId);

    const categoryItemIds = categoryItems.map((item) => Number(item.id));

    setSelectedMenuItems((prev) => {
      let nextMenuItems = [...prev];
      if (checked) {
        categoryItemIds.forEach((itemId) => {
          if (!nextMenuItems.includes(itemId)) nextMenuItems.push(itemId);
        });
      } else {
        nextMenuItems = prev.filter((id) => !categoryItemIds.includes(id));
      }
      return nextMenuItems;
    });

    // Cascade to variations, groups, and options for each item in the category
    const allVarKeys = [];
    const allOgKeys = [];
    const allOptKeys = [];

    categoryItems.forEach(item => {
      const id = Number(item.id);
      if (item.variation_group) {
        item.variation_group.forEach(vg => {
          const v = vg.variation || vg;
          const varId = v.id;
          allVarKeys.push(`v-${id}-${varId}`);
          
          const optionGroups = vg.option_groups || v.option_groups || v.variation_options_groups || [];
          if (optionGroups) {
            optionGroups.forEach(og => {
              const ogId = og.id || og.option_group_id || og.option_group?.id;
              allOgKeys.push(`vog-${id}-${varId}-${ogId}`);
              const optionsList = og.options || og.option_group?.options || [];
              if (optionsList) {
                optionsList.forEach(opt => allOptKeys.push(`vo-${id}-${varId}-${ogId}-${opt.id}`));
              }
            });
          }
        });
      }

      if (item.menu_option_group) {
        item.menu_option_group.forEach(mog => {
          const mogId = mog.option_group?.id || mog.id;
          allOgKeys.push(`mog-${id}-${mogId}`);
          const optionsList = mog.options || mog.option_group?.options || [];
          if (optionsList) {
            optionsList.forEach(opt => allOptKeys.push(`mo-${id}-${mogId}-${opt.id}`));
          }
        });
      }
    });

    toggleCheckboxArray(setSelectedVariations, allVarKeys, checked);
    toggleCheckboxArray(setSelectedOptionGroups, allOgKeys, checked);
    toggleCheckboxArray(setSelectedOptions, allOptKeys, checked);
  };

  const isOptionGroupFullySelected = (og, menuItemId, type, variationId = null) => {
    if (!og || !og.options || og.options.length === 0) return false;

    return og.options.every(opt => {
      const key = type === 'variation'
        ? `vo-${menuItemId}-${variationId}-${og.id || og.option_group_id}-${opt.id}`
        : `mo-${menuItemId}-${og.id}-${opt.id}`;
      return selectedOptions.includes(key);
    });
  };

  const isVariationFullySelected = (v, menuItemId) => {
    if (!v) return false;
    const varId = v.variation.id;
    const varKey = `v-${menuItemId}-${varId}`;

    if (!selectedVariations.includes(varKey)) return false;

    if (v.option_groups && v.option_groups.length > 0) {
      return v.option_groups.every(og => isOptionGroupFullySelected(og, menuItemId, 'variation', varId));
    }

    return true;
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
                            {categoryItems.map((item) => {
                              const itemId = Number(item.id);
                              const isItemSelected = selectedMenuItems.includes(itemId);
                              const isItemExpanded = expandedItems[itemId] || false;
                              const hasVariations = item.variation_group && item.variation_group.length > 0;
                              const hasMenuOptionGroups = item.menu_option_group && item.menu_option_group.length > 0;
                              const hasExtras = hasVariations || hasMenuOptionGroups;

                              return (
                                <div key={item.id} className="border rounded-lg bg-white overflow-hidden">
                                  <div className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${isItemExpanded ? 'bg-gray-50 border-b' : ''}`}
                                    onClick={() => hasExtras && setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))}>
                                    <input
                                      type="checkbox"
                                      checked={isItemSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleItemChange(item.id, e.target.checked, item);
                                      }}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.name || item.title}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Price: RM{item.price || 'N/A'}
                                      </div>
                                    </div>
                                    {hasExtras && (
                                      <div className="text-gray-400">
                                        {isItemExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                      </div>
                                    )}
                                  </div>

                                  {/* Render Variations and Menu Options when expanded */}
                                  {isItemExpanded && hasExtras && (
                                    <div className="mt-3 pl-8 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">

                                      {/* Variations */}
                                      {hasVariations && (
                                        <div className="space-y-3">
                                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variations</div>
                                          {item.variation_group.map(vg => {
                                            const v = vg.variation || vg;
                                            const varKey = `v-${itemId}-${v.id}`;
                                            const isVarSelected = selectedVariations.includes(varKey);

                                            // Option groups might be under vg.option_groups or v.option_groups
                                            const optionGroups = vg.option_groups || v.option_groups || v.variation_options_groups || [];

                                            return (
                                              <div key={varKey} className="border rounded bg-white p-2">
                                                <label className="flex items-center cursor-pointer mb-2">
                                                  <input
                                                    type="checkbox"
                                                    checked={isVarSelected}
                                                    onChange={(e) => handleVariationToggle(itemId, v.id, e.target.checked, vg)}
                                                    className="h-3.5 w-3.5 text-indigo-600 rounded mr-2"
                                                  />
                                                  <span className="text-sm font-medium">{v.title || v.name}</span>
                                                </label>

                                                {/* Variation Option Groups */}
                                                {isVarSelected && optionGroups.length > 0 && (
                                                  <div className="pl-6 space-y-3 mt-2 border-t pt-2">
                                                    {optionGroups.map(og => {
                                                      const ogId = og.id || og.option_group_id || og.option_group?.id;
                                                      const ogTitle = og.title || og.name || og.option_group?.title || `Option Group ${ogId}`;
                                                      const ogKey = `vog-${itemId}-${v.id}-${ogId}`;
                                                      const isOgSelected = selectedOptionGroups.includes(ogKey);
                                                      const optionsList = og.options || og.option_group?.options || [];

                                                      return (
                                                        <div key={ogKey} className="space-y-1">
                                                          <label className="flex items-center cursor-pointer">
                                                            <input
                                                              type="checkbox"
                                                              checked={isOgSelected}
                                                              onChange={(e) => handleVariationOptionGroupToggle(itemId, v.id, ogId, e.target.checked, optionsList)}
                                                              className="h-3 w-3 text-indigo-600 rounded mr-2"
                                                            />
                                                            <span className="text-xs font-medium text-gray-700">{ogTitle}</span>
                                                          </label>

                                                          {/* Options directly under this Variation Option Group */}
                                                          {isOgSelected && optionsList.length > 0 && (
                                                            <div className="pl-5 grid grid-cols-2 gap-1 mt-1">
                                                              {optionsList.map(opt => {
                                                                const optKey = `vo-${itemId}-${v.id}-${ogId}-${opt.id}`;
                                                                return (
                                                                  <label key={optKey} className="flex items-center cursor-pointer text-xs">
                                                                    <input
                                                                      type="checkbox"
                                                                      checked={selectedOptions.includes(optKey)}
                                                                      onChange={(e) => handleVariationOptionToggle(itemId, v.id, ogId, opt.id, e.target.checked)}
                                                                      className="h-3 w-3 text-indigo-600 rounded mr-1.5"
                                                                    />
                                                                    <span className="text-gray-600 truncate">{opt.title || opt.name}</span>
                                                                  </label>
                                                                );
                                                              })}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Menu Option Groups */}
                                      {hasMenuOptionGroups && !hasVariations && (
                                        <div className="space-y-3 mt-4">
                                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Options</div>
                                          {item.menu_option_group.map(mog => {
                                            const actualMog = mog.option_group || mog;
                                            const mogId = actualMog.id;
                                            const mogTitle = actualMog.title || actualMog.name;
                                            const mogKey = `mog-${itemId}-${mogId}`;
                                            const isMogSelected = selectedOptionGroups.includes(mogKey);
                                            const optionsList = mog.options || actualMog.options || [];

                                            return (
                                              <div key={mogKey} className="border rounded bg-white p-2">
                                                <label className="flex items-center cursor-pointer mb-2">
                                                  <input
                                                    type="checkbox"
                                                    checked={isMogSelected}
                                                    onChange={(e) => handleMenuOptionGroupToggle(itemId, mogId, e.target.checked, optionsList)}
                                                    className="h-3.5 w-3.5 text-indigo-600 rounded mr-2"
                                                  />
                                                  <span className="text-sm font-medium">{mogTitle}</span>
                                                </label>

                                                {/* Menu Options */}
                                                {isMogSelected && optionsList.length > 0 && (
                                                  <div className="pl-6 grid grid-cols-2 gap-1 mt-1 border-t pt-2">
                                                    {optionsList.map(opt => {
                                                      const optKey = `mo-${itemId}-${mogId}-${opt.id}`;
                                                      return (
                                                        <label key={optKey} className="flex items-center cursor-pointer text-xs">
                                                          <input
                                                            type="checkbox"
                                                            checked={selectedOptions.includes(optKey)}
                                                            onChange={(e) => handleMenuOptionToggle(itemId, mogId, opt.id, e.target.checked)}
                                                            className="h-3 w-3 text-indigo-600 rounded mr-1.5"
                                                          />
                                                          <span className="text-gray-600 truncate">{opt.title || opt.name}</span>
                                                        </label>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                          {getUncategorizedItems().map((item) => {
                            const itemId = Number(item.id);
                            const isItemSelected = selectedMenuItems.includes(itemId);
                            const isItemExpanded = expandedItems[itemId] || false;
                            const hasVariations = item.variation_group && item.variation_group.length > 0;
                            const hasMenuOptionGroups = item.menu_option_group && item.menu_option_group.length > 0;
                            const hasExtras = hasVariations || hasMenuOptionGroups;

                            return (
                              <div key={item.id} className="border rounded-lg bg-white overflow-hidden">
                                <div className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${isItemExpanded ? 'bg-gray-50 border-b' : ''}`}
                                  onClick={() => hasExtras && setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))}>
                                  <input
                                    type="checkbox"
                                    checked={isItemSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleItemChange(item.id, e.target.checked, item);
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name || item.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Price: RM{item.price || 'N/A'}
                                    </div>
                                  </div>
                                  {hasExtras && (
                                    <div className="text-gray-400">
                                      {isItemExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                  )}
                                </div>

                                {/* Render Variations and Menu Options when expanded */}
                                {isItemExpanded && hasExtras && (
                                  <div className="mt-3 pl-8 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
                                    {hasVariations && (
                                      <div className="space-y-3">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variations</div>
                                        {item.variation_group.map(vg => {
                                          const v = vg.variation || vg;
                                          const varKey = `v-${itemId}-${v.id}`;
                                          const isVarSelected = selectedVariations.includes(varKey);

                                          // Option groups might be under vg.option_groups or v.option_groups
                                          const optionGroups = vg.option_groups || v.option_groups || v.variation_options_groups || [];

                                          return (
                                            <div key={varKey} className="border rounded bg-white p-2">
                                              <label className="flex items-center cursor-pointer mb-2">
                                                <input
                                                  type="checkbox"
                                                  checked={isVarSelected}
                                                  onChange={(e) => handleVariationToggle(itemId, v.id, e.target.checked, vg)}
                                                  className="h-3.5 w-3.5 text-indigo-600 rounded mr-2"
                                                />
                                                <span className="text-sm font-medium">{v.title || v.name}</span>
                                              </label>

                                              {/* Variation Option Groups */}
                                              {isVarSelected && optionGroups.length > 0 && (
                                                <div className="pl-6 space-y-3 mt-2 border-t pt-2">
                                                  {optionGroups.map(og => {
                                                    const ogId = og.id || og.option_group_id || og.option_group?.id;
                                                    const ogTitle = og.title || og.name || og.option_group?.title || `Option Group ${ogId}`;
                                                    const ogKey = `vog-${itemId}-${v.id}-${ogId}`;
                                                    const isOgSelected = selectedOptionGroups.includes(ogKey);
                                                    const optionsList = og.options || og.option_group?.options || [];

                                                    return (
                                                      <div key={ogKey} className="space-y-1">
                                                        <label className="flex items-center cursor-pointer">
                                                          <input
                                                            type="checkbox"
                                                            checked={isOgSelected}
                                                            onChange={(e) => handleVariationOptionGroupToggle(itemId, v.id, ogId, e.target.checked, optionsList)}
                                                            className="h-3 w-3 text-indigo-600 rounded mr-2"
                                                          />
                                                          <span className="text-xs font-medium text-gray-700">{ogTitle}</span>
                                                        </label>

                                                        {/* Options directly under this Variation Option Group */}
                                                        {isOgSelected && optionsList.length > 0 && (
                                                          <div className="pl-5 grid grid-cols-2 gap-1 mt-1">
                                                            {optionsList.map(opt => {
                                                              const optKey = `vo-${itemId}-${v.id}-${ogId}-${opt.id}`;
                                                              return (
                                                                <label key={optKey} className="flex items-center cursor-pointer text-xs">
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={selectedOptions.includes(optKey)}
                                                                    onChange={(e) => handleVariationOptionToggle(itemId, v.id, ogId, opt.id, e.target.checked)}
                                                                    className="h-3 w-3 text-indigo-600 rounded mr-1.5"
                                                                  />
                                                                  <span className="text-gray-600 truncate">{opt.title || opt.name}</span>
                                                                </label>
                                                              );
                                                            })}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Menu Option Groups */}
                                    {hasMenuOptionGroups && !hasVariations && (
                                      <div className="space-y-3 mt-4">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Options</div>
                                        {item.menu_option_group.map(mog => {
                                          const actualMog = mog.option_group || mog;
                                          const mogId = actualMog.id;
                                          const mogTitle = actualMog.title || actualMog.name;
                                          const mogKey = `mog-${itemId}-${mogId}`;
                                          const isMogSelected = selectedOptionGroups.includes(mogKey);
                                          const optionsList = mog.options || actualMog.options || [];

                                          return (
                                            <div key={mogKey} className="border rounded bg-white p-2">
                                              <label className="flex items-center cursor-pointer mb-2">
                                                <input
                                                  type="checkbox"
                                                  checked={isMogSelected}
                                                  onChange={(e) => handleMenuOptionGroupToggle(itemId, mogId, e.target.checked, optionsList)}
                                                  className="h-3.5 w-3.5 text-indigo-600 rounded mr-2"
                                                />
                                                <span className="text-sm font-medium">{mogTitle}</span>
                                              </label>

                                              {/* Menu Options */}
                                              {isMogSelected && optionsList.length > 0 && (
                                                <div className="pl-6 grid grid-cols-2 gap-1 mt-1 border-t pt-2">
                                                  {optionsList.map(opt => {
                                                    const optKey = `mo-${itemId}-${mogId}-${opt.id}`;
                                                    return (
                                                      <label key={optKey} className="flex items-center cursor-pointer text-xs">
                                                        <input
                                                          type="checkbox"
                                                          checked={selectedOptions.includes(optKey)}
                                                          onChange={(e) => handleMenuOptionToggle(itemId, mogId, opt.id, e.target.checked)}
                                                          className="h-3 w-3 text-indigo-600 rounded mr-1.5"
                                                        />
                                                        <span className="text-gray-600 truncate">{opt.title || opt.name}</span>
                                                      </label>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                  </div>
                                )}
                              </div>
                            );
                          })}
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

  const handleRegularDeliveryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deliveryModalData: {
        ...prev.deliveryModalData,
        [field]: value
      }
    }));
  };

  const handleRegularDeliveryDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      deliveryModalData: {
        ...prev.deliveryModalData,
        days: {
          ...prev.deliveryModalData.days,
          [day]: !prev.deliveryModalData.days[day]
        }
      }
    }));
  };

  const handleRegularDeliveryLeadTimeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deliveryModalData: {
        ...prev.deliveryModalData,
        leadTime: {
          ...prev.deliveryModalData.leadTime,
          [field]: parseInt(value) || 0
        }
      }
    }));
  };

  const openDeliveryModal = (index = null) => {
    const defaultData = {
      days: { '1': true, '2': true, '3': true, '4': true, '5': false, '6': false, '0': false },
      startTime: "10:00 AM",
      endTime: "10:00 PM",
      interval: 15,
      maxOrders: 10,
      leadTime: { day: 0, hour: 0, minute: 45 }
    };
    setFormData(prev => ({
      ...prev,
      editingDeliveryIndex: index,
      showDeliveryModal: true,
      deliveryModalData: index !== null ? { ...prev.deliverySettings[index] } : defaultData
    }));
  };

  const closeDeliveryModal = () => {
    setFormData(prev => ({ ...prev, showDeliveryModal: false, editingDeliveryIndex: null }));
  };

  const saveDeliverySetting = () => {
    setFormData(prev => {
      const updated = [...prev.deliverySettings];
      if (prev.editingDeliveryIndex !== null) {
        updated[prev.editingDeliveryIndex] = { ...prev.deliveryModalData };
      } else {
        updated.push({ ...prev.deliveryModalData });
      }
      return { ...prev, deliverySettings: updated, showDeliveryModal: false, editingDeliveryIndex: null };
    });
  };

  const deleteDeliverySetting = (index) => {
    if (!window.confirm('Are you sure you want to delete this delivery setting?')) return;
    setFormData(prev => {
      const updated = prev.deliverySettings.filter((_, i) => i !== index);
      return { ...prev, deliverySettings: updated };
    });
  };

  const dayLabels = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat' };
  const getActiveDaysLabel = (days) => {
    if (!days) return '-';
    return Object.entries(days).filter(([, v]) => v).map(([k]) => dayLabels[k] || k).join(', ') || 'None';
  };
  const getLeadTimeLabel = (lt) => {
    if (!lt) return '-';
    const parts = [];
    if (lt.day > 0) parts.push(`${lt.day}d`);
    if (lt.hour > 0) parts.push(`${lt.hour}h`);
    parts.push(`${lt.minute || 0}m`);
    return parts.join(' ');
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      const hour = i % 12 === 0 ? 12 : i % 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      times.push(`${hour}:00 ${ampm}`);
      times.push(`${hour}:15 ${ampm}`);
      times.push(`${hour}:30 ${ampm}`);
      times.push(`${hour}:45 ${ampm}`);
    }
    return times;
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

    if (formData.outletContact.trim() && !/^[0-9+\-\s()]{8,15}$/.test(formData.outletContact)) {
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
    if (isSubmitting) return;
    setIsSubmitting(true);

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

      // Build outlet_menu_detail payload
      const outletMenuDetail = selectedMenuItems.map(itemId => {
        const item = items.find(i => Number(i.id) === Number(itemId));
        if (!item) return null;

        const variations = (item.variation_group || [])
          .filter(vg => selectedVariations.includes(`v-${itemId}-${vg.variation.id}`))
          .map(vg => {
            const varId = vg.variation.id;
            const variationOptions = [];
            (vg.option_groups || [])
              .filter(og => selectedOptionGroups.includes(`vog-${itemId}-${varId}-${og.id || og.option_group_id}`))
              .forEach(og => {
                const ogId = og.id || og.option_group_id;
                (og.options || [])
                  .filter(opt => selectedOptions.includes(`vo-${itemId}-${varId}-${ogId}-${opt.id}`))
                  .forEach(opt => {
                    variationOptions.push({
                      option_group_id: String(ogId),
                      option_id: String(opt.id)
                    });
                  });
              });
            return {
              variation_id: String(varId),
              options: variationOptions
            };
          });

        const itemOptions = [];
        (item.menu_option_group || [])
          .filter(mog => selectedOptionGroups.includes(`mog-${itemId}-${mog.id}`))
          .forEach(mog => {
            (mog.options || [])
              .filter(opt => selectedOptions.includes(`mo-${itemId}-${mog.id}-${opt.id}`))
              .forEach(opt => {
                itemOptions.push({
                  option_group_id: String(mog.id),
                  option_id: String(opt.id)
                });
              });
          });

        return {
          menu_item_id: Number(itemId),
          variations,
          item_options: itemOptions
        };
      }).filter(Boolean);

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
        outlet_menu_detail: outletMenuDetail,
        outlet_tax: taxData,
        operating_days: operatingDays,
        operating_hours: operatingHours,
        operating_hours_exceptions: [],
        images: imageFiles,
        regular_delivery_settings: formData.deliverySettings
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
      toast.error(error.message || "Failed to create outlet.");
    } finally {
      setIsSubmitting(false);
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
              </label>
              <div className="flex gap-2">
                <textarea
                  placeholder="Enter address here... (e.g., 123 Jalan Bukit Bintang)"
                  rows="3"
                  className={`${getInputClasses("outletAddress")} resize-none flex-1`}
                  value={formData.outletAddress}
                  onChange={(e) =>
                    handleAddressChange("outletAddress", e.target.value)
                  }
                />
                <button
                  type="button"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex flex-col items-center justify-center transition-colors min-w-[120px]"
                  onClick={() => geocodeAddress(formData.outletAddress, formData.outletState, formData.outletPostcode)}
                  disabled={isGeocoding}
                >
                  <MapPin size={20} className="mb-1" />
                  <span className="text-xs font-medium">Get Coordinates</span>
                </button>
              </div>
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
                    className={`px-4 py-2 text-sm ${mapType === "roadmap"
                      ? "bg-white text-black"
                      : "text-gray-600"
                      }`}
                    onClick={() => handleMapTypeChange("roadmap")}
                  >
                    Map
                  </button>
                  <button
                    className={`px-4 py-2 text-sm ${mapType === "satellite"
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

                {/* Regular Delivery Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-6 bg-gray-800 text-white p-3 rounded-t-lg -mx-4 -mt-6">Regular Delivery</h4>

                  {/* Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full table-auto border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left">#</th>
                          <th className="border px-3 py-2 text-left">Days</th>
                          <th className="border px-3 py-2 text-left">Start</th>
                          <th className="border px-3 py-2 text-left">End</th>
                          <th className="border px-3 py-2 text-left">Interval</th>
                          <th className="border px-3 py-2 text-left">Max Orders</th>
                          <th className="border px-3 py-2 text-left">Lead Time</th>
                          <th className="border px-3 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.deliverySettings || []).length === 0 ? (
                          <tr><td colSpan="8" className="border px-3 py-4 text-center text-gray-400">No delivery settings configured</td></tr>
                        ) : formData.deliverySettings.map((ds, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-3 py-2">{idx + 1}</td>
                            <td className="border px-3 py-2">{getActiveDaysLabel(ds.days)}</td>
                            <td className="border px-3 py-2">{ds.startTime}</td>
                            <td className="border px-3 py-2">{ds.endTime}</td>
                            <td className="border px-3 py-2">{ds.interval} min</td>
                            <td className="border px-3 py-2">{ds.maxOrders}</td>
                            <td className="border px-3 py-2">{getLeadTimeLabel(ds.leadTime)}</td>
                            <td className="border px-3 py-2 text-center">
                              <button type="button" onClick={() => openDeliveryModal(idx)} className="text-indigo-600 hover:text-indigo-800 mr-2" title="Edit">✏️</button>
                              <button type="button" onClick={() => deleteDeliverySetting(idx)} className="text-red-600 hover:text-red-800" title="Delete">🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={() => openDeliveryModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2">
                    <Plus size={16} /> Add Delivery Setting
                  </button>

                  {/* Add/Edit Delivery Setting Modal */}
                  {formData.showDeliveryModal && (
                    <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                          <h3 className="text-lg font-medium">{formData.editingDeliveryIndex !== null ? 'Edit' : 'Add'} Delivery Setting</h3>
                          <button onClick={closeDeliveryModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-4 space-y-5">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Available Days</label>
                            <div className="flex flex-wrap gap-4">
                              {[{ key: '1', label: 'Mon' }, { key: '2', label: 'Tue' }, { key: '3', label: 'Wed' }, { key: '4', label: 'Thu' }, { key: '5', label: 'Fri' }, { key: '6', label: 'Sat' }, { key: '0', label: 'Sun' }].map(({ key, label }) => (
                                <label key={key} className="flex items-center space-x-1 cursor-pointer">
                                  <input type="checkbox" checked={formData.deliveryModalData.days[key]} onChange={() => handleRegularDeliveryDayChange(key)} className="rounded text-indigo-600 w-4 h-4" />
                                  <span className="text-sm">{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                              <select className="w-full px-3 py-2 border rounded-lg" value={formData.deliveryModalData.startTime} onChange={(e) => handleRegularDeliveryChange('startTime', e.target.value)}>
                                {generateTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                              <select className="w-full px-3 py-2 border rounded-lg" value={formData.deliveryModalData.endTime} onChange={(e) => handleRegularDeliveryChange('endTime', e.target.value)}>
                                {generateTimeOptions().map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Interval (minutes)</label>
                            <select className="w-full px-3 py-2 border rounded-lg" value={formData.deliveryModalData.interval} onChange={(e) => handleRegularDeliveryChange('interval', e.target.value)}>
                              {[15, 30, 45, 60].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Max Orders Per Slot</label>
                            <input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.deliveryModalData.maxOrders} onChange={(e) => handleRegularDeliveryChange('maxOrders', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Lead Time</label>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg text-center" value={formData.deliveryModalData.leadTime.day} onChange={(e) => handleRegularDeliveryLeadTimeChange('day', e.target.value)} />
                                <div className="text-xs text-center mt-1 text-gray-500">Days</div>
                              </div>
                              <div className="flex-1">
                                <input type="number" min="0" max="23" className="w-full px-3 py-2 border rounded-lg text-center" value={formData.deliveryModalData.leadTime.hour} onChange={(e) => handleRegularDeliveryLeadTimeChange('hour', e.target.value)} />
                                <div className="text-xs text-center mt-1 text-gray-500">Hours</div>
                              </div>
                              <div className="flex-1">
                                <input type="number" min="0" max="59" className="w-full px-3 py-2 border rounded-lg text-center" value={formData.deliveryModalData.leadTime.minute} onChange={(e) => handleRegularDeliveryLeadTimeChange('minute', e.target.value)} />
                                <div className="text-xs text-center mt-1 text-gray-500">Minutes</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3">
                          <button type="button" onClick={closeDeliveryModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                          <button type="button" onClick={saveDeliverySetting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                        </div>
                      </div>
                    </div>
                  )}
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
            disabled={isSubmitting}
            className={`px-8 py-3 bg-indigo-600 text-white rounded-lg transition-colors font-medium ${isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-indigo-700"
              }`}
          >
            {isSubmitting ? "Saving..." : "Create Outlet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOutletForm;
