import React, { useState, useEffect } from "react";
import { X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import promoService from "../../../store/api/promoService";
import categoryService from "../../../store/api/categoryService";
import itemService from "../../../store/api/itemService";
import promoConfig from "../../../constant/promoConfigForm.json";
import { toast } from "react-toastify";

function formatDate(dateString) {
  return new Date(dateString).toISOString().split("T")[0];
}

const AddPromoCode = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [popupState, setPopupState] = useState({
    isOpen: false,
    type: null,
    fieldId: null,
  });

  const [formData, setFormData] = useState({
    promotionName: "",
    promotionDescription: "",
    promotionCode: "",
    usageLimit: "multiple",
    totalRedemptionLimit: "",
    availableOn: "",
    voucherLimitPerCustomer: "",
    customDayTime: {
      mon: { enabled: false, startTime: "", endTime: "" },
      tue: { enabled: false, startTime: "", endTime: "" },
      wed: { enabled: false, startTime: "", endTime: "" },
      thurs: { enabled: false, startTime: "", endTime: "" },
      fri: { enabled: false, startTime: "", endTime: "" },
      sat: { enabled: false, startTime: "", endTime: "" },
      sun: { enabled: false, startTime: "", endTime: "" },
    },
    applyToDeliveryPickup: [],
    discountAmount: "",
    discountType: "fixed",
    getNumber: "",
    minimumSpend: "",
    itemCategory1: "total",
    itemCategory2: "total",
    itemCategoryID1: [],
    itemCategoryID2: [],
    minimumQuantity: "",
    everyQuantity: "",
    minimumAmount: "",
    storeStartDate: "",
    storeEndDate: "",
    promotionType: "",
    promoType: "",
    itemVariations1: [],
    itemVariations2: [],
  });
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  const { sectionOptions, commonFields, availabilityFields } = promoConfig;

  const handleItemCategoryChange = (fieldId, value) => {
    setFormData((prev) => {
      // Determine which field number we're working with (1 or 2)
      const fieldNumber = fieldId === "itemCategory1" ? "1" : "2";
      const itemCategoryIDKey = `itemCategoryID${fieldNumber}`;
      const variationsKey = `itemVariations${fieldNumber}`;

      console.log(`Changing ${fieldId} from "${prev[fieldId]}" to "${value}"`);
      console.log(`Clearing ${itemCategoryIDKey} and ${variationsKey}`);

      return {
        ...prev,
        [fieldId]: value,
        // Clear both the selected IDs and variations when switching between category/items
        [itemCategoryIDKey]: [],
        [variationsKey]: [], // This was missing - clear variations too
      };
    });
  };

  useEffect(() => {
    loadCategoriesAndItems();
  }, []);

  // Handle item selection with variations - now accepts fieldId
  const handleItemChangeWithVariations = (itemId, isChecked, fieldId) => {
    const currentIDs = formData[`${fieldId}ID`] || [];
    const idToCheck = Number(itemId);
    const item = items.find((item) => Number(item.id) === idToCheck);

    setFormData((prev) => {
      let newItemIDs = [...currentIDs];
      const variationsField = `itemVariations${fieldId.slice(-1)}`;

      const currentVariations = prev[variationsField];
      let newItemVariations;

      if (Array.isArray(currentVariations)) {
        newItemVariations = [...currentVariations];
      } else if (
        typeof currentVariations === "object" &&
        currentVariations !== null
      ) {
        newItemVariations = Object.entries(currentVariations).map(
          ([itemId, variationId]) => ({
            itemId: String(itemId),
            variationId: String(variationId),
          })
        );
      } else {
        newItemVariations = [];
      }

      if (isChecked) {
        if (!newItemIDs.some((id) => Number(id) === idToCheck)) {
          newItemIDs.push(idToCheck);

          // REMOVED: Auto-selecting first variation
          // Items can now be selected without variations
        }
      } else {
        newItemIDs = newItemIDs.filter((id) => Number(id) !== idToCheck);
        newItemVariations = newItemVariations.filter(
          (v) => v.itemId !== String(itemId)
        );
      }

      return {
        ...prev,
        [`${fieldId}ID`]: newItemIDs,
        [variationsField]: newItemVariations,
      };
    });
  };

  // Handle variation selection - now accepts fieldId
  const handleVariationChange = (itemId, variationId, fieldId) => {
    const variationsField = `itemVariations${fieldId.slice(-1)}`; // itemVariations1 or itemVariations2

    setFormData((prev) => {
      const currentVariations = prev[variationsField];
      let variationsArray;

      if (Array.isArray(currentVariations)) {
        variationsArray = [...currentVariations];
      } else if (
        typeof currentVariations === "object" &&
        currentVariations !== null
      ) {
        // Convert object to array format
        variationsArray = Object.entries(currentVariations).map(
          ([itemId, variationId]) => ({
            itemId: String(itemId),
            variationId: String(variationId),
          })
        );
      } else {
        variationsArray = [];
      }

      // Remove existing entry for this item if any
      const filteredVariations = variationsArray.filter(
        (v) => v.itemId !== String(itemId)
      );

      // Add new entry
      const newVariations = [
        ...filteredVariations,
        { itemId: String(itemId), variationId: String(variationId) },
      ];

      return {
        ...prev,
        [variationsField]: newVariations,
      };
    });
  };

  const itemHasVariations = (item) => {
    return item && item.variations && item.variations.length > 0;
  };

  // Get selected variation for an item - now accepts fieldId
  const getSelectedVariation = (itemId, fieldId) => {
    const variationsField = `itemVariations${fieldId.slice(-1)}`; // itemVariations1 or itemVariations2
    const variationsData = formData[variationsField];

    if (Array.isArray(variationsData)) {
      const variation = variationsData.find((v) => v.itemId === String(itemId));
      return variation ? variation.variationId : null;
    } else if (typeof variationsData === "object" && variationsData !== null) {
      // Handle object format for backward compatibility
      return variationsData[itemId] || null;
    }

    return null;
  };

  // Check if variation selection is valid for an item - now accepts fieldId
  const isVariationValid = (item, fieldId) => {
    // Variations are now optional, so always return true
    return true;
  };

  const loadCategoriesAndItems = async () => {
    setLoadingCategories(true);
    try {
      const categoriesResponse = await categoryService.getCategories();
      console.log("Full categories response:", categoriesResponse);

      let categoriesData = [];
      if (Array.isArray(categoriesResponse)) {
        categoriesData = categoriesResponse;
      } else if (
        categoriesResponse.data &&
        Array.isArray(categoriesResponse.data)
      ) {
        categoriesData = categoriesResponse.data;
      } else if (
        categoriesResponse.result &&
        Array.isArray(categoriesResponse.result)
      ) {
        categoriesData = categoriesResponse.result;
      } else if (
        categoriesResponse.categories &&
        Array.isArray(categoriesResponse.categories)
      ) {
        categoriesData = categoriesResponse.categories;
      }

      console.log("Processed categories data:", categoriesData);

      const itemsResponse = await itemService.getMenuItems();
      console.log("Items response:", itemsResponse);

      let itemsData = [];
      if (Array.isArray(itemsResponse)) {
        itemsData = itemsResponse;
      } else if (itemsResponse.data && Array.isArray(itemsResponse.data)) {
        itemsData = itemsResponse.data;
      } else if (itemsResponse.result && Array.isArray(itemsResponse.result)) {
        itemsData = itemsResponse.result;
      }

      const transformedItems = itemsData.map((item) =>
        itemService.transformApiItemToComponent(item)
      );

      setCategories(categoriesData);
      setItems(transformedItems);
    } catch (error) {
      console.error("Error loading categories and items:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(error.message || "Failed to loading categories and items", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCategoryItemsChange = (categoryId, checked) => {
    const categoryItems = getItemsForCategory(Number(categoryId));
    const categoryItemIds = categoryItems.map((item) => Number(item.id));

    setFormData((prev) => {
      const fieldId = popupState.fieldId;
      const key = `itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`;
      let newItemCategoryID = [...(prev[key] || [])].map((id) => Number(id));
      const variationsField = `itemVariations${
        fieldId === "itemCategory1" ? "1" : "2"
      }`;
      let newItemVariations = [...(prev[variationsField] || [])];

      if (checked) {
        categoryItemIds.forEach((itemId) => {
          if (!newItemCategoryID.includes(itemId)) {
            newItemCategoryID.push(itemId);

            // REMOVED: Auto-selecting first variation for items with variations
            // Items are now added without automatically selecting variations
          }
        });
      } else {
        newItemCategoryID = newItemCategoryID.filter(
          (id) => !categoryItemIds.includes(id)
        );
        // Remove variations for deselected items
        newItemVariations = newItemVariations.filter(
          (v) => !categoryItemIds.includes(Number(v.itemId))
        );
      }

      return {
        ...prev,
        [key]: newItemCategoryID,
        [variationsField]: newItemVariations,
      };
    });
  };

  const areAllCategoryItemsSelected = (categoryId) => {
    const fieldId = popupState.fieldId;
    const currentIDs = formData[`${fieldId}ID`] || [];
    const categoryItems = getItemsForCategory(categoryId);

    return (
      categoryItems.length > 0 &&
      categoryItems.every((item) =>
        currentIDs.some((id) => Number(id) === Number(item.id))
      )
    );
  };

  const selectPromotion = (sectionId, optionId) => {
    const section = sectionOptions[sectionId];
    const option = section.find((opt) => opt.id === optionId);
    setSelectedOption(option);

    setFormData((prev) => ({
      ...prev,
      promotionType: option.label,
    }));

    setCurrentStep(2);
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getItemsForCategory = (categoryId) => {
    return items.filter((item) => {
      return (
        item.categoryId === categoryId ||
        (item.category &&
          Array.isArray(item.category) &&
          item.category.some((cat) => cat.id === categoryId)) ||
        (item.categories &&
          Array.isArray(item.categories) &&
          item.categories.some((cat) => cat.id === categoryId))
      );
    });
  };

  const handleDayTimeChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      customDayTime: {
        ...prev.customDayTime,
        [day]: {
          ...prev.customDayTime[day],
          [field]: value,
        },
      },
    }));
  };

  const handleCategoryChange = (categoryId, isChecked) => {
    const { fieldId } = popupState;
    const currentIDs = formData[`${fieldId}ID`] || [];
    const idNum = Number(categoryId);

    if (isChecked) {
      setFormData((prev) => ({
        ...prev,
        [`${fieldId}ID`]: [...currentIDs, idNum],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [`${fieldId}ID`]: currentIDs.filter((id) => id !== idNum),
      }));
    }
  };

  const handleItemChange = (itemId, isChecked) => {
    const { fieldId } = popupState;
    const currentIDs = formData[`${fieldId}ID`] || [];
    const idToCheck = Number(itemId); // Ensure we compare numbers

    setFormData((prev) => {
      if (isChecked) {
        // Only add if not already present
        if (!currentIDs.some((id) => Number(id) === idToCheck)) {
          return {
            ...prev,
            [`${fieldId}ID`]: [...currentIDs, idToCheck],
          };
        }
      } else {
        // Remove if present
        return {
          ...prev,
          [`${fieldId}ID`]: currentIDs.filter((id) => Number(id) !== idToCheck),
        };
      }
      return prev; // Return unchanged if no modification needed
    });
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      type: null,
      fieldId: null,
    });
  };

  const getSelectedCategoriesNames = (fieldId) => {
    const currentIDs = formData[`${fieldId}ID`] || [];
    return categories
      .filter((cat) => currentIDs.some((id) => Number(id) === Number(cat.id)))
      .map((cat) => cat.name || cat.title)
      .join(", ");
  };

  const getItemCategoryFields = (selectedOption) => {
    if (!selectedOption || !selectedOption.formConfig) return [];

    return selectedOption.formConfig.specificFields.filter((field) =>
      field.id.startsWith("itemCategory")
    );
  };

  const getSelectedItemsNames = (fieldId) => {
    const currentIDs = formData[`${fieldId}ID`] || [];
    const selectedItems = items.filter((item) =>
      currentIDs.includes(Number(item.id))
    );

    const displayNames = selectedItems
      .slice(0, 3)
      .map((item) => {
        let name = item.name || item.title || item.label || `Item #${item.id}`;

        // Add variation info if available
        const variationId = getSelectedVariation(item.id, fieldId);
        if (variationId && item.variations) {
          const variationGroup = item.variations.find(
            (vg) => vg.variation.id === variationId
          );
          if (variationGroup) {
            name += ` (${variationGroup.variation.title})`;
          }
        }

        return name;
      })
      .join(", ");

    return selectedItems.length > 3
      ? `${displayNames} and ${selectedItems.length - 3} more...`
      : displayNames;
  };

  const renderItemCategoryField = (field) => {
    const currentSelection = formData[field.id];
    const currentIDs = formData[`${field.id}ID`] || [];
    const error = formErrors[field.id];

    return (
      <div className="mb-6 border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </label>

        <div className="mb-4 space-y-3">
          {field.options.map((option) => {
            if (option.value === "") return null;

            return (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.id}-${option.value}`}
                  name={field.id}
                  value={option.value}
                  checked={currentSelection === option.value}
                  onChange={(e) =>
                    handleItemCategoryChange(field.id, e.target.value)
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-3"
                />
                <label
                  htmlFor={`${field.id}-${option.value}`}
                  className="text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>

        {/* Selection Display */}
        {currentSelection === "category" && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                setPopupState({
                  isOpen: true,
                  type: "category",
                  fieldId: field.id,
                })
              }
            >
              <span className="text-sm font-medium">
                {currentIDs.length > 0
                  ? `${currentIDs.length} categories selected`
                  : "Click to select categories"}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>

            {currentIDs.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Selected categories: {getSelectedCategoriesNames(field.id)}
              </div>
            )}
          </div>
        )}

        {currentSelection === "item" && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                setPopupState({ isOpen: true, type: "item", fieldId: field.id })
              }
            >
              <span className="text-sm font-medium">
                {currentIDs.length > 0
                  ? `${currentIDs.length} items selected`
                  : "Click to select items"}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>

            {currentIDs.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Selected items: {getSelectedItemsNames(field.id)}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderItemCategorySelection = (fieldId, label) => {
    const currentSelection = formData[fieldId];
    const currentIDs = formData[`${fieldId}ID`] || [];
    const error = formErrors[fieldId];

    return (
      <div className="mb-6 border rounded-lg p-4" key={fieldId}>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
          <span className="text-red-500">*</span>
        </label>

        <div className="mb-4 space-y-3">
          <div className="flex items-center">
            <input
              type="radio"
              id={`${fieldId}-total`}
              name={fieldId}
              value="total"
              checked={currentSelection === "total"}
              onChange={(e) =>
                handleItemCategoryChange(fieldId, e.target.value)
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-3"
            />
            <label
              htmlFor={`${fieldId}-total`}
              className="text-sm text-gray-700"
            >
              Total
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id={`${fieldId}-category`}
              name={fieldId}
              value="category"
              checked={currentSelection === "category"}
              onChange={(e) =>
                handleItemCategoryChange(fieldId, e.target.value)
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-3"
            />
            <label
              htmlFor={`${fieldId}-category`}
              className="text-sm text-gray-700"
            >
              Category
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id={`${fieldId}-item`}
              name={fieldId}
              value="item"
              checked={currentSelection === "item"}
              onChange={(e) =>
                handleItemCategoryChange(fieldId, e.target.value)
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-3"
            />
            <label
              htmlFor={`${fieldId}-item`}
              className="text-sm text-gray-700"
            >
              Items
            </label>
          </div>
        </div>

        {/* Selection Display */}
        {currentSelection === "category" && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                setPopupState({
                  isOpen: true,
                  type: "category",
                  fieldId: fieldId,
                })
              }
            >
              <span className="text-sm font-medium">
                {currentIDs.length > 0
                  ? `${currentIDs.length} categories selected`
                  : "Click to select categories"}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>

            {currentIDs.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Selected categories: {getSelectedCategoriesNames(fieldId)}
              </div>
            )}
          </div>
        )}

        {currentSelection === "item" && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                setPopupState({ isOpen: true, type: "item", fieldId: fieldId })
              }
            >
              <span className="text-sm font-medium">
                {currentIDs.length > 0
                  ? `${currentIDs.length} items selected`
                  : "Click to select items"}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>

            {currentIDs.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                Selected items: {getSelectedItemsNames(fieldId)}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderPopup = () => {
    if (!popupState.isOpen) return null;

    const { type, fieldId } = popupState;
    const currentIDs = formData[`${fieldId}ID`] || [];
    const isCategoryPopup = type === "category";

    return (
      <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div
          className={`bg-white rounded-lg w-full ${
            isCategoryPopup ? "max-w-md" : "max-w-2xl"
          } max-h-96 overflow-hidden`}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {isCategoryPopup ? "Select Categories" : "Select Items"}
            </h3>
            <button
              onClick={closePopup}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto p-4">
            {loadingCategories ? (
              <div className="text-center py-4">
                <div className="text-gray-500">
                  Loading {isCategoryPopup ? "categories" : "items"}...
                </div>
              </div>
            ) : isCategoryPopup ? (
              categories.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-gray-500">No categories available</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={currentIDs.some(
                          (id) => Number(id) === Number(category.id)
                        )}
                        onChange={(e) =>
                          handleCategoryChange(category.id, e.target.checked)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                      />
                      <span className="text-gray-900 flex-1">
                        {category.name || category.title}
                      </span>
                    </label>
                  ))}
                </div>
              )
            ) : categories.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-gray-500">No items available</div>
              </div>
            ) : (
              categories.map((category) => {
                const categoryItems = getItemsForCategory(category.id);
                const isExpanded = expandedCategories[category.id];

                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id} className="border rounded-lg mb-3">
                    <div className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={areAllCategoryItemsSelected(category.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCategoryItemsChange(
                              category.id,
                              e.target.checked
                            );
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                        />
                        <span
                          className="font-medium text-gray-900 flex-1"
                          onClick={() => toggleCategoryExpansion(category.id)}
                        >
                          {category.name || category.title} (
                          {categoryItems.length} items)
                        </span>
                      </div>
                      <div onClick={() => toggleCategoryExpansion(category.id)}>
                        {isExpanded ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t">
                        <div className="p-3 space-y-2">
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className="border rounded-lg mb-3"
                            >
                              <div className="p-3 bg-gray-50">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={currentIDs.some(
                                      (id) => Number(id) === Number(item.id)
                                    )}
                                    onChange={(e) =>
                                      handleItemChangeWithVariations(
                                        item.id,
                                        e.target.checked,
                                        fieldId // Pass fieldId here
                                      )
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Price: RM {item.price}
                                    </div>
                                  </div>
                                </label>

                                {/* Variation Selection - Updated with optional variation */}
                                {currentIDs.some(
                                  (id) => Number(id) === Number(item.id)
                                ) &&
                                  itemHasVariations(item) && (
                                    <div className="mt-3 ml-7 p-3 bg-white border rounded-lg">
                                      <label className="block text-xs font-medium text-gray-700 mb-2">
                                        Select Variation (Optional)
                                      </label>
                                      <div className="grid grid-cols-1 gap-2">
                                        {/* Add "No Variation" option */}
                                        <label
                                          className={`flex items-center p-2 border rounded cursor-pointer ${
                                            !getSelectedVariation(
                                              item.id,
                                              fieldId
                                            )
                                              ? "bg-blue-50 border-blue-200"
                                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`variation_${fieldId}_${item.id}`}
                                            value=""
                                            checked={
                                              !getSelectedVariation(
                                                item.id,
                                                fieldId
                                              )
                                            }
                                            onChange={(e) => {
                                              console.log(
                                                `Clearing variation for item ${item.id}`
                                              );
                                              // Remove variation entry for this item
                                              setFormData((prev) => {
                                                const variationsField = `itemVariations${fieldId.slice(
                                                  -1
                                                )}`;
                                                const currentVariations =
                                                  prev[variationsField];
                                                let variationsArray;

                                                if (
                                                  Array.isArray(
                                                    currentVariations
                                                  )
                                                ) {
                                                  variationsArray = [
                                                    ...currentVariations,
                                                  ];
                                                } else if (
                                                  typeof currentVariations ===
                                                    "object" &&
                                                  currentVariations !== null
                                                ) {
                                                  variationsArray =
                                                    Object.entries(
                                                      currentVariations
                                                    ).map(
                                                      ([
                                                        itemId,
                                                        variationId,
                                                      ]) => ({
                                                        itemId: String(itemId),
                                                        variationId:
                                                          String(variationId),
                                                      })
                                                    );
                                                } else {
                                                  variationsArray = [];
                                                }

                                                // Remove this item from variations
                                                const newVariations =
                                                  variationsArray.filter(
                                                    (v) =>
                                                      String(v.itemId) !==
                                                      String(itemId)
                                                  );

                                                return {
                                                  ...prev,
                                                  [variationsField]:
                                                    newVariations,
                                                };
                                              });
                                            }}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                          />
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                              No specific variation (apply to
                                              all)
                                            </div>
                                          </div>
                                        </label>

                                        {/* Existing variation options */}
                                        {item.variations.map(
                                          (variationGroup) => {
                                            const variation =
                                              variationGroup.variation;
                                            return (
                                              <label
                                                key={variation.id}
                                                className={`flex items-center p-2 border rounded cursor-pointer ${
                                                  getSelectedVariation(
                                                    item.id,
                                                    fieldId // Pass fieldId here
                                                  ) === variation.id
                                                    ? "bg-blue-50 border-blue-200"
                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                }`}
                                              >
                                                <input
                                                  type="radio"
                                                  name={`variation_${fieldId}_${item.id}`}
                                                  value={variation.id}
                                                  checked={
                                                    getSelectedVariation(
                                                      item.id,
                                                      fieldId // Pass fieldId here
                                                    ) === variation.id
                                                  }
                                                  onChange={(e) =>
                                                    handleVariationChange(
                                                      item.id,
                                                      e.target.value,
                                                      fieldId // Pass fieldId here
                                                    )
                                                  }
                                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                                />
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium text-gray-900">
                                                    {variation.title}
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    Price: RM {variation.price}
                                                  </div>
                                                </div>
                                              </label>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t flex justify-end space-x-2">
            <button
              onClick={closePopup}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderField = (field) => {
    const value = formData[field.id] || "";
    const error = formErrors[field.id];

    switch (field.type) {
      case "text":
      case "number":
        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.helpText && (
              <p className="text-xs text-gray-500 mb-1">{field.helpText}</p>
            )}
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none ${
                error
                  ? "border-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
              required={field.required}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );

      case "select":
        if (field.id === "itemCategory1" || field.id === "itemCategory2") {
          return renderItemCategoryField(field);
        }

        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full p-2 border rounded focus:outline-none ${
                error
                  ? "border-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
              required={field.required}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );

      case "radio":
        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => handleInputChange(field.id, option.value)}
                    className="mr-2"
                    required={field.required}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );

      case "dayTime":
        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-4">
              {field.label}
            </label>
            <div className="space-y-4">
              {field.days.map((day) => {
                const dayData = formData.customDayTime[day.id] || {};
                return (
                  <div key={day.id} className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dayData.enabled || false}
                        onChange={(e) =>
                          handleDayTimeChange(
                            day.id,
                            "enabled",
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700 capitalize font-medium">
                        {day.label}
                      </label>
                    </div>
                    {dayData.enabled && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={dayData.startTime || ""}
                            onChange={(e) =>
                              handleDayTimeChange(
                                day.id,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={dayData.endTime || ""}
                            onChange={(e) =>
                              handleDayTimeChange(
                                day.id,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "discountAmount":
        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. 15"
                value={formData.discountAmount}
                onChange={(e) =>
                  handleInputChange("discountAmount", e.target.value)
                }
                className={`flex-1 p-2 border rounded focus:outline-none ${
                  formErrors.discountAmount
                    ? "border-red-500"
                    : "border-gray-300 focus:border-indigo-500"
                }`}
                required={field.required}
              />
              <select
                value={formData.discountType}
                onChange={(e) =>
                  handleInputChange("discountType", e.target.value)
                }
                className="p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
              >
                {field.currencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.discountAmount && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.discountAmount}
              </p>
            )}
          </div>
        );

      case "dateRange":
        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-4">
              {field.fields.map((subField) => (
                <div key={subField.id}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {subField.label}
                  </label>
                  <input
                    type="date"
                    value={formData[subField.id] || ""}
                    onChange={(e) =>
                      handleInputChange(subField.id, e.target.value)
                    }
                    className={`w-full p-2 border rounded focus:outline-none ${
                      formErrors[subField.id]
                        ? "border-red-500"
                        : "border-gray-300 focus:border-indigo-500"
                    }`}
                    required={subField.required}
                  />
                  {formErrors[subField.id] && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors[subField.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "checkbox-group":
        return (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((option) => {
                const isAllOption = option.value === "all";
                const isChecked = isAllOption
                  ? value.length ===
                    field.options.filter((opt) => opt.value !== "all").length
                  : Array.isArray(value)
                  ? value.includes(option.value)
                  : value === option.value;

                return (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={isChecked}
                      onChange={(e) => {
                        let newValue;

                        if (option.value === "all") {
                          // Select/deselect all options
                          newValue = e.target.checked
                            ? field.options
                                .filter((opt) => opt.value !== "all")
                                .map((opt) => opt.value)
                            : [];
                        } else {
                          newValue = Array.isArray(value) ? [...value] : [];

                          if (e.target.checked) {
                            newValue.push(option.value);
                          } else {
                            const index = newValue.indexOf(option.value);
                            if (index > -1) {
                              newValue.splice(index, 1);
                            }
                          }
                        }

                        handleInputChange(field.id, newValue);
                      }}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  const validateForm = () => {
    const errors = {};

    if (currentStep === 2) {
      commonFields.forEach((field) => {
        if (field.required && !formData[field.id]) {
          errors[field.id] = `${field.label} is required`;
        }
      });

      const needsDiscount = selectedOption?.formConfig?.specificFields?.some(
        (f) => f.type === "discountAmount"
      );

      if (needsDiscount && !formData.discountAmount) {
        errors.discountAmount = "Discount amount is required";
      }

      if (selectedOption?.formConfig?.specificFields) {
        selectedOption.formConfig.specificFields.forEach((field) => {
          if (field.id.startsWith("itemCategory")) {
            const categoryValue = formData[field.id];
            const categoryIDs = formData[`${field.id}ID`] || [];

            if (categoryValue === "category" || categoryValue === "item") {
              if (categoryIDs.length === 0) {
                errors[field.id] = `Please select ${
                  categoryValue === "category" ? "categories" : "items"
                } for ${field.label}`;
              }
            }
          }

          if (
            field.required &&
            !formData[field.id] &&
            !field.id.startsWith("itemCategory")
          ) {
            errors[field.id] = `${field.label} is required`;
          }
        });
      }

      // REMOVED: Variation validation since variations are now optional
      // No more validation errors for missing variations
    }

    if (currentStep === 3) {
      availabilityFields.forEach((field) => {
        if (field.type === "dateRange") {
          field.fields.forEach((subField) => {
            if (subField.required && !formData[subField.id]) {
              errors[subField.id] = `${subField.label} is required`;
            }
          });

          if (
            formData.storeStartDate &&
            formData.storeEndDate &&
            new Date(formData.storeEndDate) < new Date(formData.storeStartDate)
          ) {
            errors.storeEndDate = "End date cannot be earlier than start date";
          }
        } else if (field.required && !formData[field.id]) {
          errors[field.id] = `${field.label} is required`;
        }
      });

      if (!formData.applyToDeliveryPickup) {
        errors.applyToDeliveryPickup =
          "Apply to Delivery/Pickup field is required";
      }
    }

    return errors;
  };

  const goToNextStep = () => {
    const errors = validateForm();
    console.log("Validation Errors:", errors);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const prepareApiData = () => {
    console.log("=== DEBUG: Form Data Before API Preparation ===");
    console.log("Full formData:", formData);

    const apiData = {
      promotionType: formData.promotionType || "",
      promotionName: formData.promotionName || "",
      promotionDescription: formData.promotionDescription || "",
      promotionCode: formData.promotionCode || "",
      usageLimit: formData.usageLimit || "",
      totalRedemptionLimit: formData.totalRedemptionLimit
        ? String(formData.totalRedemptionLimit)
        : "",
      availableOn: formData.availableOn || "all-time",
      voucherLimitPerCustomer: formData.voucherLimitPerCustomer
        ? String(formData.voucherLimitPerCustomer)
        : "",
      storeStartDate: formData.storeStartDate || "",
      storeEndDate: formData.storeEndDate || "",
      customDayTime: formData.customDayTime || {
        mon: { enabled: false, startTime: "", endTime: "" },
        tue: { enabled: false, startTime: "", endTime: "" },
        wed: { enabled: false, startTime: "", endTime: "" },
        thurs: { enabled: false, startTime: "", endTime: "" },
        fri: { enabled: false, startTime: "", endTime: "" },
        sat: { enabled: false, startTime: "", endTime: "" },
        sun: { enabled: false, startTime: "", endTime: "" },
      },
      applyToDeliveryPickup: Array.isArray(formData.applyToDeliveryPickup)
        ? formData.applyToDeliveryPickup
        : typeof formData.applyToDeliveryPickup === "string" &&
          formData.applyToDeliveryPickup
        ? (() => {
            try {
              const parsed = JSON.parse(formData.applyToDeliveryPickup);
              return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            } catch {
              return [formData.applyToDeliveryPickup];
            }
          })()
        : [],
      promoType: formData.promoType || "discount",
      discountAmount: formData.discountAmount
        ? String(formData.discountAmount)
        : "",
      discountType:
        formData.discountType === "fixed" ? "amount" : formData.discountType,
      getNumber: formData.getNumber ? String(formData.getNumber) : "",
      minimumSpend: formData.minimumSpend ? String(formData.minimumSpend) : "",
      minimumQuantity: formData.minimumQuantity
        ? String(formData.minimumQuantity)
        : "",
      everyQuantity: formData.everyQuantity
        ? String(formData.everyQuantity)
        : "",
      minimumAmount: formData.minimumAmount
        ? String(formData.minimumAmount)
        : "",
      itemVariations1: formData.itemVariations1,
      itemVariations2: formData.itemVariations2,
    };

    console.log("itemVariations1:", apiData.itemVariations1);
    console.log("itemVariations2:", apiData.itemVariations2);

    Object.keys(formData).forEach((key) => {
      if (key.startsWith("itemCategory") && !key.endsWith("ID")) {
        apiData[key] = formData[key];
      }
      if (key.startsWith("itemCategory") && key.endsWith("ID")) {
        apiData[key] = Array.isArray(formData[key]) ? formData[key] : [];
      }
    });

    console.log("=== DEBUG: Final API Data ===");
    console.log("applyToDeliveryPickup:", apiData.applyToDeliveryPickup);
    console.log("Prepared API Data:", JSON.stringify(apiData, null, 2));

    return apiData;
  };

  const handleSave = async () => {
    console.log("=== DEBUG: Before Validation ===");
    console.log("Current formData:", formData);
    console.log("Selected option:", selectedOption);

    const errors = validateForm();
    console.log("=== DEBUG: Validation Results ===");
    console.log("Validation errors:", errors);

    if (Object.keys(errors).length > 0) {
      console.log("=== DEBUG: Validation Failed ===");
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const apiData = prepareApiData();

      const response = await promoService.create(apiData);

      toast.success(response.message || "Promo code created successfully!", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        onClose: () => {
          // Navigate after toast closes
          navigate("/promo/promo_lists"); // Update this path as needed
        },
      });
    } catch (error) {
      console.error("Error creating promo code:", error);
      toast.error(
        error.message || `Error creating promo code: ${error.message}`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 1) {
    return (
      <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Add New Promo Code</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => navigate("/promo/promo_lists")}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex mb-6">
              <div className="bg-indigo-900 text-white px-4 py-2 text-sm rounded-l-full flex-1 text-center">
                Apply promotion to the following
              </div>
              <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm flex-1 text-center">
                Fill in Criteria
              </div>
              <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm rounded-r-full flex-1 text-center">
                Availability
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(sectionOptions).map(([sectionId, options]) => (
                <div key={sectionId} className="border rounded">
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [sectionId]: !prev[sectionId],
                      }))
                    }
                    className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm capitalize">
                      {sectionId === "totalOrder" && "Total Order"}
                      {sectionId === "selectedItems" &&
                        "Apply to All Selected Items"}
                      {sectionId === "nextItem" && "Discount on Next Item"}
                      {sectionId == "freeItem" && "Free Item"}
                      {sectionId === "deliveryOverride" &&
                        "Delivery Charge Override"}
                      {sectionId === "minimumOrder" && "Minimum Order Override"}
                    </span>
                    <Plus size={16} className="text-gray-400" />
                  </button>

                  {expandedSections[sectionId] && (
                    <div className="border-t p-3 space-y-2">
                      {options.map((option) => (
                        <div
                          key={option.id}
                          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-700">
                            {option.label}
                          </span>
                          <button
                            onClick={() => {
                              selectPromotion(sectionId, option.id);
                              setFormData((prev) => ({
                                ...prev,
                                promoType: option.promoType,
                              }));
                            }}
                            className="bg-indigo-900 text-white px-3 py-1 rounded text-xs hover:bg-indigo-800"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <>
        {renderPopup()}
        <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Add New Promo Code</h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => navigate("/promo/promo_lists")}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex mb-6">
                <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm rounded-l-full flex-1 text-center">
                  Apply promotion to the following
                </div>
                <div className="bg-indigo-900 text-white px-4 py-2 text-sm flex-1 text-center">
                  Fill in Criteria
                </div>
                <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm rounded-r-full flex-1 text-center">
                  Availability
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">
                  Selected: {selectedOption?.label}
                </p>
              </div>

              <div className="space-y-4">
                {commonFields.map((field) => renderField(field))}

                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">
                    Promotion Description
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedOption?.label
                        ? `Describe your ${selectedOption.label.toLowerCase()} promotion...`
                        : "Enter promotion description..."
                    }
                    value={selectedOption?.label}
                    onChange={(e) =>
                      handleInputChange("promotionDescription", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {getItemCategoryFields(selectedOption).map((field) =>
                  renderItemCategoryField(field)
                )}
                {selectedOption?.formConfig?.specificFields
                  ?.filter((field) => !field.id.startsWith("itemCategory"))
                  ?.map((field) => renderField(field))}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={goToNextStep}
                  className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentStep === 3) {
    return (
      <>
        {renderPopup()}
        <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Add New Promo Code</h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => navigate("/promo/promo_lists")}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex mb-6">
                <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm rounded-l-full flex-1 text-center">
                  Apply promotion to the following
                </div>
                <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm flex-1 text-center">
                  Fill in Criteria
                </div>
                <div className="bg-indigo-900 text-white px-4 py-2 text-sm rounded-r-full flex-1 text-center">
                  Availability
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">
                  Selected: {selectedOption?.label}
                </p>
              </div>

              <div className="space-y-4">
                {availabilityFields.map((field) => {
                  // Conditionally hide voucherLimitPerCustomer if usageLimit is not 'multiple'
                  if (
                    field.id === "voucherLimitPerCustomer" &&
                    formData.usageLimit !== "multiple"
                  ) {
                    return null;
                  }
                  return renderField(field);
                })}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white rounded ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isLoading ? "Saving..." : "Save Promo Code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default AddPromoCode;
