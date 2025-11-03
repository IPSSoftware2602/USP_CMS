import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, ChevronDown, ChevronRight } from "lucide-react";
import promoService from "../../../store/api/promoService";
import categoryService from "../../../store/api/categoryService";
import itemService from "../../../store/api/itemService";
import promoConfigData from "../../../constant/promoConfigForm.json";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const EditPromoForm = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const promoId = id;
  const [currentStep, setCurrentStep] = useState(2);
  const [selectedPromoType, setSelectedPromoType] = useState("");
  const [popupState, setPopupState] = useState({
    isOpen: false,
    type: "",
    fieldId: "",
  });
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    promotionType: "",
    promotionName: "",
    promotionCode: "",
    usageLimit: "multiple",
    totalRedemptionLimit: "",
    discountAmount: "",
    discountType: "fixed",
    minimumSpend: "",
    minimumQuantity: "",
    everyQuantity: "",
    getNumber: "",
    itemCategory1: "total",
    itemCategory2: "total",
    itemCategoryID1: [],
    itemCategoryID2: [],
    voucherLimitPerCustomer: "",
    storeStartDate: "",
    storeEndDate: "",
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
    itemVariations1: [],
    itemVariations2: [],
  });

  // Item variations helper functions
  const itemHasVariations = (item) => {
    return item && item.variation_group && item.variation_group.length > 0;
  };

  const getSelectedVariation = (itemId, fieldId) => {
    const variationsField = `itemVariations${fieldId.slice(-1)}`;
    const variationsData = formData[variationsField];
    console.log(variationsData);
    console.log(
      `Getting variation for item ${itemId} in ${variationsField}:`,
      variationsData
    );

    if (Array.isArray(variationsData)) {
      const variation = variationsData.find(
        (v) => String(v.itemId) === String(itemId)
      );
      const result = variation ? String(variation.variationId) : null;
      console.log(`Found in array:`, result);
      return result;
    } else if (typeof variationsData === "object" && variationsData !== null) {
      const result = variationsData[String(itemId)]
        ? String(variationsData[String(itemId)])
        : null;
      console.log(`Found in object:`, result);
      return result;
    }

    console.log(`No variation found`);
    return null;
  };

  const isVariationValid = (item, fieldId) => {
    // Variations are now optional, so always return true
    return true;
  };

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

  const handleVariationChange = (itemId, variationId, fieldId) => {
    const variationsField = `itemVariations${fieldId.slice(-1)}`;

    setFormData((prev) => {
      const currentVariations = prev[variationsField];
      let variationsArray;

      if (Array.isArray(currentVariations)) {
        variationsArray = [...currentVariations];
      } else if (
        typeof currentVariations === "object" &&
        currentVariations !== null
      ) {
        variationsArray = Object.entries(currentVariations).map(
          ([itemId, variationId]) => ({
            itemId: String(itemId),
            variationId: String(variationId),
          })
        );
      } else {
        variationsArray = [];
      }

      const filteredVariations = variationsArray.filter(
        (v) => v.itemId !== String(itemId)
      );

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

  useEffect(() => {
    console.log(formData);
    if (promoId) {
      loadPromoData();
    }
  }, [promoId]);

  useEffect(() => {
    const loadCategoriesAndItems = async () => {
      try {
        setLoadingCategories(true);
        const [categoriesResponse, itemsResponse] = await Promise.all([
          categoryService.getCategories(),
          itemService.getMenuItems(),
        ]);

        const categoriesData = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : categoriesResponse?.data || categoriesResponse?.categories || [];

        const itemsData = Array.isArray(itemsResponse)
          ? itemsResponse
          : itemsResponse?.data || itemsResponse?.items || [];

        setCategories(categoriesData);
        setItems(itemsData);
      } catch (error) {
        console.error("Error loading categories and items:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoriesAndItems();
  }, []);

  useEffect(() => {
    console.log(formData);
    console.log(popupState);
  }, [formData]);

  const loadPromoData = async () => {
    console.log("Loading promo data for ID:");
    if (!promoId) {
      console.error("No promo ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await promoService.getById(promoId);
      console.log("Full API response:", response);
      const promoData = response.result || response;

      console.log("Promo data itemVariations1:", promoData.itemVariations1);
      console.log("Promo data itemVariations2:", promoData.itemVariations2);

      const processItemVariations = (variationsData) => {
        if (!variationsData) return [];
        if (Array.isArray(variationsData)) return variationsData;
        if (typeof variationsData === "object") {
          // Handle both formats: {itemId: variationId} and proper array format
          if (variationsData.itemId && variationsData.variationId) {
            // Single variation object
            return [
              {
                itemId: String(variationsData.itemId),
                variationId: String(variationsData.variationId),
              },
            ];
          } else {
            // Object with itemId as keys
            return Object.entries(variationsData).map(
              ([itemId, variationId]) => ({
                itemId: String(itemId),
                variationId: String(variationId),
              })
            );
          }
        }
        return [];
      };

      const itemVariations1 = processItemVariations(promoData.itemVariations1);
      const itemVariations2 = processItemVariations(promoData.itemVariations2);

      console.log("Processed itemVariations1:", itemVariations1);
      console.log("Processed itemVariations2:", itemVariations2);

      const detectedType = detectPromotionType(promoData);
      setSelectedPromoType(detectedType);

      setFormData({
        promotionType: promoData.promotionType || "",
        promotionName: promoData.promotionName || "",
        promotionCode: promoData.promotionCode || "",
        usageLimit: promoData.usageLimit || "multiple",
        totalRedemptionLimit: promoData.totalRedemptionLimit || "",
        discountAmount: promoData.discountAmount || "",
        discountType:
          promoData.discountType === "amount"
            ? "fixed"
            : promoData.discountType || "fixed",
        minimumSpend: promoData.minimumSpend || "",
        minimumQuantity: promoData.minimumQuantity || "",
        everyQuantity: promoData.everyQuantity || "",
        getNumber: promoData.getNumber || "",
        itemCategory1: promoData.itemCategory1 || "total",
        itemCategory2: promoData.itemCategory2 || "total",
        itemCategoryID1: Array.isArray(promoData.itemCategoryID1)
          ? promoData.itemCategoryID1.map((id) =>
              typeof id === "string" ? parseInt(id, 10) : Number(id)
            )
          : promoData.itemCategoryID1
          ? [Number(promoData.itemCategoryID1)]
          : [],
        itemCategoryID2: Array.isArray(promoData.itemCategoryID2)
          ? promoData.itemCategoryID2.map((id) =>
              typeof id === "string" ? parseInt(id, 10) : Number(id)
            )
          : promoData.itemCategoryID2
          ? [Number(promoData.itemCategoryID2)]
          : [],
        voucherLimitPerCustomer: promoData.voucherLimitPerCustomer || "",
        storeStartDate: promoData.storeStartDate || "",
        storeEndDate: promoData.storeEndDate || "",
        customDayTime: promoData.customDayTime || {
          mon: { enabled: false, startTime: "", endTime: "" },
          tue: { enabled: false, startTime: "", endTime: "" },
          wed: { enabled: false, startTime: "", endTime: "" },
          thurs: { enabled: false, startTime: "", endTime: "" },
          fri: { enabled: false, startTime: "", endTime: "" },
          sat: { enabled: false, startTime: "", endTime: "" },
          sun: { enabled: false, startTime: "", endTime: "" },
        },
        applyToDeliveryPickup: (() => {
          if (Array.isArray(promoData.applyToDeliveryPickup)) {
            if (
              promoData.applyToDeliveryPickup.every(
                (item) => typeof item === "string" && !item.includes(",")
              )
            ) {
              return promoData.applyToDeliveryPickup;
            }
            return promoData.applyToDeliveryPickup.flatMap((item) =>
              typeof item === "string" ? item.split(",") : item
            );
          }
          if (typeof promoData.applyToDeliveryPickup === "string") {
            return promoData.applyToDeliveryPickup.split(",");
          }
          return [];
        })(),
        promoType: promoData.promoType,
        itemVariations1: itemVariations1,
        itemVariations2: itemVariations2,
      });
    } catch (error) {
      console.error("Error loading promo data:", error);
      toast.error(error.message || "Failed to load promotion data", {
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
      setLoading(false);
    }
  };

  const detectPromotionType = (promoData) => {
    for (const section in promoConfigData.sectionOptions) {
      const byId = promoConfigData.sectionOptions[section].find(
        (opt) => opt.id === promoData.promotionType
      );
      if (byId) return byId.id;
    }
    for (const section in promoConfigData.sectionOptions) {
      const byLabel = promoConfigData.sectionOptions[section].find(
        (opt) => opt.label === promoData.promotionType
      );
      if (byLabel) return byLabel.id;
    }
    if (promoData.getNumber) return "freeItem1";
    if (promoData.itemCategory1 && promoData.itemCategory1 !== "total") {
      if (promoData.minimumSpend) return "selectedItems2";
      return "selectedItems1";
    }
    if (promoData.minimumSpend) return "totalOrder2";
    return "totalOrder1";
  };

  const getCurrentPromoConfig = () => {
    for (const section in promoConfigData.sectionOptions) {
      const option = promoConfigData.sectionOptions[section].find(
        (opt) => opt.id === selectedPromoType
      );
      if (option) return option;
    }
    return null;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyToDeliveryPickupChange = (optionValue, checked) => {
    setFormData((prev) => {
      let next = Array.isArray(prev.applyToDeliveryPickup)
        ? [...prev.applyToDeliveryPickup]
        : [];

      const allOptions = ["delivery", "pickup", "dinein"];

      if (optionValue === "all") {
        next = checked ? [...allOptions] : [];
      } else {
        if (checked) {
          if (!next.includes(optionValue)) next.push(optionValue);
        } else {
          next = next.filter((v) => v !== optionValue);
        }
        // maintain 'all' equivalence
        if (allOptions.every((v) => next.includes(v))) {
          next = [...allOptions];
        }
      }

      return { ...prev, applyToDeliveryPickup: next };
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

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        applyToDeliveryPickup: Array.isArray(formData.applyToDeliveryPickup)
          ? formData.applyToDeliveryPickup
          : [],
        itemVariations1: formData.itemVariations1,
        itemVariations2: formData.itemVariations2,
      };
      const result = await promoService.update(promoId, payload);
      //after toast navigate
      toast.success(result.message || "Promotion updated successfully!", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      navigate("/promo/promo_lists/");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error updating promotion:", error);
      toast.error(error.message || "Failed to update promotion", {
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
      setSubmitting(false);
    }
  };

  const getSelectedCategoriesNames = (fieldId) => {
    const currentIDs =
      formData[`itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`] ||
      [];
    if (currentIDs.length === 0) return "";
    const selectedCategories = categories.filter((category) =>
      currentIDs.includes(Number(category.id))
    );
    if (selectedCategories.length === 0)
      return `${currentIDs.length} categories selected`;
    const displayNames = selectedCategories
      .slice(0, 3)
      .map((category) => category.name || category.title)
      .join(", ");
    return selectedCategories.length > 3
      ? `${displayNames} and ${selectedCategories.length - 3} more...`
      : displayNames;
  };

  const getSelectedItemsNames = (fieldId) => {
    const currentIDs =
      formData[`itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`] ||
      [];
    if (currentIDs.length === 0) return "";
    const selectedItems = items.filter((item) =>
      currentIDs.includes(Number(item.id))
    );
    if (selectedItems.length === 0)
      return `${currentIDs.length} items selected`;

    const displayNames = selectedItems
      .slice(0, 3)
      .map((item) => {
        let name = item.name || item.title || item.label || `Item #${item.id}`;

        // Add variation info if available
        const variationId = getSelectedVariation(item.id, fieldId);
        if (variationId && item.variation_group) {
          const variationGroup = item.variation_group.find(
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

  const handleItemCategoryChange = (fieldId, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
      [`${fieldId}ID`]: [],
    }));
  };

  const closePopup = () => {
    setPopupState({ isOpen: false, type: "", fieldId: "" });
  };

  const handleCategoryChange = (categoryId, isChecked) => {
    const { fieldId } = popupState;
    const key = `itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`;
    const currentIDs = formData[key] || [];
    const numericCategoryId = Number(categoryId);

    if (isChecked) {
      setFormData((prev) => ({
        ...prev,
        [key]: [...currentIDs, numericCategoryId],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [key]: currentIDs.filter((id) => Number(id) !== numericCategoryId),
      }));
    }
  };

  const handleItemChange = (itemId, isChecked) => {
    const { fieldId } = popupState;
    const key = `itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`;
    const currentIDs = formData[key] || [];
    const idToCheck = Number(itemId);

    // Find the item to check if it has variations
    const item = items.find((item) => Number(item.id) === idToCheck);

    setFormData((prev) => {
      let newItemIDs = [...currentIDs];
      const variationsField = `itemVariations${fieldId.slice(-1)}`;

      // Get current variations (handle both array and object formats)
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
        // Add item if not already selected
        if (!newItemIDs.some((id) => Number(id) === idToCheck)) {
          newItemIDs.push(idToCheck);

          // REMOVED: Auto-selecting first variation
          // Items with variations can now be selected without variations
        }
      } else {
        // Remove item
        newItemIDs = newItemIDs.filter((id) => Number(id) !== idToCheck);
        // Remove associated variations
        newItemVariations = newItemVariations.filter(
          (v) => String(v.itemId) !== String(itemId)
        );
      }

      return {
        ...prev,
        [key]: newItemIDs,
        [variationsField]: newItemVariations,
      };
    });
  };

  const getSelectedItemsCountForCategory = (categoryId, fieldId) => {
    const currentIDs =
      formData[`itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`] ||
      [];
    const categoryItems = getItemsForCategory(Number(categoryId));

    const selectedCount = categoryItems.filter((item) =>
      currentIDs.includes(Number(item.id))
    ).length;

    return selectedCount;
  };

  const renderPopup = () => {
    if (!popupState.isOpen) return null;

    const { type, fieldId } = popupState;
    const currentIDs =
      formData[`itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`] ||
      [];
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
                const selectedCount = getSelectedItemsCountForCategory(
                  category.id,
                  fieldId
                );
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
                          <span className="text-sm text-blue-700">
                            {selectedCount != 0
                              ? `(${selectedCount} selected)`
                              : ""}
                          </span>
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
                                    onChange={(e) => {
                                      console.log(
                                        `Item ${item.id} checkbox changed to:`,
                                        e.target.checked
                                      );
                                      handleItemChange(
                                        item.id,
                                        e.target.checked
                                      );
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.title ||
                                        item.name ||
                                        `Item #${item.id}`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Price: RM {item.price}
                                    </div>
                                  </div>
                                </label>

                                {/* Variation Selection */}
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
                                            !getSelectedVariation(item.id, fieldId)
                                              ? "bg-blue-50 border-blue-200"
                                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`variation_${fieldId}_${item.id}`}
                                            value=""
                                            checked={!getSelectedVariation(item.id, fieldId)}
                                            onChange={(e) => {
                                              console.log(`Clearing variation for item ${item.id}`);
                                              // Remove variation entry for this item
                                              setFormData((prev) => {
                                                const variationsField = `itemVariations${fieldId.slice(-1)}`;
                                                const currentVariations = prev[variationsField];
                                                let variationsArray;

                                                if (Array.isArray(currentVariations)) {
                                                  variationsArray = [...currentVariations];
                                                } else if (
                                                  typeof currentVariations === "object" &&
                                                  currentVariations !== null
                                                ) {
                                                  variationsArray = Object.entries(currentVariations).map(
                                                    ([itemId, variationId]) => ({
                                                      itemId: String(itemId),
                                                      variationId: String(variationId),
                                                    })
                                                  );
                                                } else {
                                                  variationsArray = [];
                                                }

                                                // Remove this item from variations
                                                const newVariations = variationsArray.filter(
                                                  (v) => String(v.itemId) !== String(itemId)
                                                );

                                                return {
                                                  ...prev,
                                                  [variationsField]: newVariations,
                                                };
                                              });
                                            }}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                          />
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                              No specific variation (apply to all)
                                            </div>
                                          </div>
                                        </label>

                                        {/* Existing variation options */}
                                        {(
                                          item.variation_group ||
                                          item.variations ||
                                          []
                                        ).map((variationItem) => {
                                          // Handle different data structures
                                          const variation =
                                            variationItem.variation || variationItem;
                                          const selectedVariationId =
                                            getSelectedVariation(
                                              item.id,
                                              fieldId
                                            );

                                          return (
                                            <label
                                              key={variation.id}
                                              className={`flex items-center p-2 border rounded cursor-pointer ${
                                                selectedVariationId ===
                                                String(variation.id)
                                                  ? "bg-blue-50 border-blue-200"
                                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={`variation_${fieldId}_${item.id}`}
                                                value={variation.id}
                                                checked={
                                                  selectedVariationId ===
                                                  String(variation.id)
                                                }
                                                onChange={(e) => {
                                                  console.log(
                                                    `Variation changed for item ${item.id} to:`,
                                                    e.target.value
                                                  );
                                                  handleVariationChange(
                                                    item.id,
                                                    e.target.value,
                                                    fieldId
                                                  );
                                                }}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                              />
                                              <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {variation.title ||
                                                    variation.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  Price: RM {variation.price}
                                                </div>
                                              </div>
                                            </label>
                                          );
                                        })}
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

  const getItemsForCategory = (categoryId) => {
    const numericCategoryId = Number(categoryId);
    return items.filter((item) => {
      return (
        Number(item.categoryId) === numericCategoryId ||
        (item.category &&
          Array.isArray(item.category) &&
          item.category.some((cat) => Number(cat.id) === numericCategoryId)) ||
        (item.categories &&
          Array.isArray(item.categories) &&
          item.categories.some((cat) => Number(cat.id) === numericCategoryId))
      );
    });
  };

  const areAllCategoryItemsSelected = (categoryId) => {
    const fieldId = popupState.fieldId;
    const currentIDs =
      formData[`itemCategoryID${fieldId === "itemCategory1" ? "1" : "2"}`] ||
      [];
    const categoryItems = getItemsForCategory(Number(categoryId));
    const categoryItemIds = categoryItems.map((item) => Number(item.id));
    return (
      categoryItemIds.length > 0 &&
      categoryItemIds.every((itemId) =>
        currentIDs.map((id) => Number(id)).includes(itemId)
      )
    );
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

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const renderDiscountAmountField = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Get $5 or 10% off <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="e.g. 15"
          value={formData.discountAmount}
          onChange={(e) => handleInputChange("discountAmount", e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
        />
        <select
          value={formData.discountType}
          onChange={(e) => handleInputChange("discountType", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
        >
          <option value="fixed">MYR</option>
          <option value="percentage">%</option>
        </select>
      </div>
    </div>
  );

  const renderSpecificFields = () => {
    const config = getCurrentPromoConfig();
    if (!config) return null;

    return config.formConfig.specificFields.map((field) => {
      if (field.type === "discountAmount") {
        return <div key={field.id}>{renderDiscountAmountField()}</div>;
      }

      if (field.id === "minimumSpend") {
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder={field.placeholder}
              value={formData.minimumSpend}
              onChange={(e) =>
                handleInputChange("minimumSpend", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
            />
          </div>
        );
      }

      if (field.id === "minimumQuantity") {
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder={field.placeholder}
              value={formData.minimumQuantity}
              onChange={(e) =>
                handleInputChange("minimumQuantity", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
            />
          </div>
        );
      }

      if (field.id === "everyQuantity") {
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder={field.placeholder}
              value={formData.everyQuantity}
              onChange={(e) =>
                handleInputChange("everyQuantity", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
            />
          </div>
        );
      }

      if (field.id === "getNumber") {
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder={field.placeholder}
              value={formData.getNumber}
              onChange={(e) => handleInputChange("getNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
            />
          </div>
        );
      }

      if (field.id === "itemCategory1" || field.id === "itemCategory2") {
        const currentSelection = formData[field.id];
        const currentIDs =
          formData[
            `itemCategoryID${field.id === "itemCategory1" ? "1" : "2"}`
          ] || [];

        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.label} <span className="text-red-500">*</span>
            </label>

            <div className="space-y-3">
              {field.options.slice(1).map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={currentSelection === option.value}
                    onChange={(e) =>
                      handleItemCategoryChange(field.id, e.target.value)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 "
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>

            {currentSelection && currentSelection !== "total" && (
              <div className="mt-4">
                <div
                  className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() =>
                    setPopupState({
                      isOpen: true,
                      type: currentSelection,
                      fieldId: field.id,
                    })
                  }
                >
                  <span className="text-sm text-gray-700">
                    {true
                      ? currentSelection === "category"
                        ? getSelectedCategoriesNames(field.id)
                        : getSelectedItemsNames(field.id)
                      : `Click to select ${
                          currentSelection === "category"
                            ? "categories"
                            : "items"
                        }`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {currentIDs.length > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-700">
                      Selected{" "}
                      {currentSelection === "category" ? "categories" : "items"}
                      :{" "}
                      {currentSelection === "category"
                        ? getSelectedCategoriesNames(field.id)
                        : getSelectedItemsNames(field.id)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      return null;
    });
  };

  const getDayDisplayName = (day) => {
    const dayNames = {
      mon: "Mon",
      tue: "Tuesday",
      wed: "Wednesday",
      thurs: "Thursday",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
    };
    return dayNames[day] || day;
  };

  const handleClose = () => {
    navigate("/promo/promo_lists/");
  };

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Promo Code
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-4">
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-center">
                  <div className="bg-indigo-900 text-white px-4 py-2 text-sm rounded-l-full flex-1 text-center">
                    Fill in Criteria
                  </div>
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm rounded-r-full flex-1 text-center">
                    Availability
                  </div>
                </div>
              </div>

              {/* Selected Promotion Type */}
              <div className="px-6 py-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Selected:</span>{" "}
                    {getCurrentPromoConfig()?.label ||
                      formData.promotionType ||
                      "Unknown promotion type"}
                  </p>
                </div>
              </div>

              {/* Promotion Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Promotion Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={formData.promotionName}
                  onChange={(e) =>
                    handleInputChange("promotionName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Promotion Description
                </label>
                <input
                  type="text"
                  placeholder={
                    getCurrentPromoConfig()?.label
                      ? `Describe your ${getCurrentPromoConfig().label.toLowerCase()} promotion...`
                      : "Enter promotion description..."
                  }
                  value={
                    getCurrentPromoConfig()?.label ||
                    formData.promotionType ||
                    "Unknown promotion type"
                  }
                  onChange={(e) =>
                    handleInputChange("promotionDescription", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Apply Promo Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Apply Promo Code
                </label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={formData.promotionCode}
                  onChange={(e) =>
                    handleInputChange("promotionCode", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Promotion Code (use comma to separate codes, for example
                  10OFF, WELCOME10)
                </p>
              </div>

              {/* Usage Limit Per Customer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Usage Limit Per Customer{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="usageLimit"
                      value="multiple"
                      checked={formData.usageLimit === "multiple"}
                      onChange={(e) =>
                        handleInputChange("usageLimit", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 "
                    />
                    <span className="text-sm text-gray-700">
                      Multiple Times
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="usageLimit"
                      value="one"
                      checked={formData.usageLimit === "one"}
                      onChange={(e) =>
                        handleInputChange("usageLimit", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 "
                    />
                    <span className="text-sm text-gray-700">One Time</span>
                  </label>
                </div>
              </div>

              {/* Total Redemption Limit */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Total Redemption Limit
                </label>
                <input
                  type="number"
                  placeholder="Enter here"
                  value={formData.totalRedemptionLimit}
                  onChange={(e) =>
                    handleInputChange("totalRedemptionLimit", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Enter the total number of times the promotion code(s) can be
                  redeemed; enter 0 for unlimited usage
                </p>
              </div>

              {/* Specific Fields based on promotion type */}
              {renderSpecificFields()}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-center">
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 text-sm rounded-l-full flex-1 text-center">
                    Fill in Criteria
                  </div>
                  <div className="bg-indigo-900 text-white px-4 py-2 text-sm rounded-r-full flex-1 text-center">
                    Availability
                  </div>
                </div>
              </div>

              {/* Selected Promotion Type */}
              <div className="px-6 py-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Selected:</span>{" "}
                    {getCurrentPromoConfig()?.label ||
                      formData.promotionType ||
                      "Unknown promotion type"}
                  </p>
                </div>
              </div>

              {/* Voucher Limit per Customer */}
              {formData.usageLimit === "multiple" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Voucher Limit per Customer
                  </label>
                  <input
                    type="number"
                    placeholder="Enter here"
                    value={formData.voucherLimitPerCustomer}
                    onChange={(e) =>
                      handleInputChange(
                        "voucherLimitPerCustomer",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                  />
                </div>
              )}

              {/* Store Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Store Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Start Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.storeStartDate}
                        onChange={(e) =>
                          handleInputChange("storeStartDate", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.storeEndDate}
                        onChange={(e) =>
                          handleInputChange("storeEndDate", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customise Day & Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Customise Day & Time
                </label>
                <div className="space-y-3">
                  {Object.entries(formData.customDayTime).map(
                    ([day, settings]) => (
                      <div key={day} className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) =>
                              handleDayTimeChange(
                                day,
                                "enabled",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded "
                          />
                          <span className="text-sm text-gray-700">
                            {getDayDisplayName(day)}
                          </span>
                        </label>

                        {settings.enabled && (
                          <div className="ml-6 grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500">
                                Start Time
                              </label>
                              <div className="relative">
                                <input
                                  type="time"
                                  value={settings.startTime}
                                  onChange={(e) =>
                                    handleDayTimeChange(
                                      day,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">
                                End Time
                              </label>
                              <div className="relative">
                                <input
                                  type="time"
                                  value={settings.endTime}
                                  onChange={(e) =>
                                    handleDayTimeChange(
                                      day,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2  focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Apply To Delivery or Pickup */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Apply To Delivery or Pickup?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {(() => {
                    const selected = Array.isArray(
                      formData.applyToDeliveryPickup
                    )
                      ? formData.applyToDeliveryPickup
                      : [];
                    const allOptions = ["delivery", "pickup", "dinein"];
                    const isAllChecked = allOptions.every((v) =>
                      selected.includes(v)
                    );
                    return (
                      <>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={isAllChecked}
                            onChange={(e) =>
                              handleApplyToDeliveryPickupChange(
                                "all",
                                e.target.checked
                              )
                            }
                          />
                          <span>All</span>
                        </label>
                        {[
                          { value: "delivery", label: "Delivery" },
                          { value: "pickup", label: "Pickup" },
                          { value: "dinein", label: "Dine In" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selected.includes(opt.value)}
                              onChange={(e) =>
                                handleApplyToDeliveryPickupChange(
                                  opt.value,
                                  e.target.checked
                                )
                              }
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => setCurrentStep(2)}
            disabled={currentStep === 2}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2  disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {currentStep === 2 ? (
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 "
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating..." : "Update Promo Code"}
            </button>
          )}
        </div>
      </div>

      {renderPopup()}
    </div>
  );
};

export default EditPromoForm;