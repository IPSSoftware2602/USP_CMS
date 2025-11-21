import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  ImageUp,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import OutletService from "../../store/api/outletService";
import CustomMap from "../components/customMap";
import OperationHoursComponents from "../components/operationHours";
import { OperationHours } from "../components/operationHours";
import categoryService from "../../store/api/categoryService";
import itemService from "../../store/api/itemService";
import { toast } from "react-toastify";

const EditOutletForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  // Menu item selection states
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [popupState, setPopupState] = useState({
    isOpen: false,
    type: null,
    fieldId: null,
  });

  const [formData, setFormData] = useState({
    outletName: "",
    outletEmail: "",
    outletContact: "",
    outletPassword: "",
    outletPasswordConfirmation: "",
    outletAddress: "",
    outletState: "",
    outletPostcode: "",
    outletLatitude: "3.1390",
    outletLongitude: "101.6869",
    outletZeoniqCode: "",
    outletImage: "",
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
    status: "active",
  });

  const [mapType, setMapType] = useState("roadmap");
  const [mapKey, setMapKey] = useState(0);
  const [markerLocation, setMarkerLocation] = useState({
    lat: parseFloat(formData.outletLatitude),
    lng: parseFloat(formData.outletLongitude),
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeTimeout, setGeocodeTimeout] = useState(null);
  const [hasDineIn, setHasDineIn] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOutletData();
    }
    loadCategoriesAndItems();
  }, [id]);

  const loadCategoriesAndItems = async () => {
    setLoadingCategories(true);
    try {
      const categoriesResponse = await categoryService.getCategories();
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

      const itemsResponse = await itemService.getMenuItems();
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
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    // Check if Dine-In is selected (case-insensitive)
    const dineInSelected = formData.serveMethods.some(
      (method) =>
        method.toLowerCase().includes("dine") ||
        method.toLowerCase().includes("dinein")
    );
    setHasDineIn(dineInSelected);
  }, [formData.serveMethods]);

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <p className="text-red-500 text-sm mt-1">{error}</p>;
  };

  const getInputClasses = (fieldName) => {
    const baseClasses =
      "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2";
    const errorClasses = "border-red-500 focus:ring-red-500";
    const normalClasses = "border-gray-300 focus:ring-indigo-500";

    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  const fetchOutletData = async () => {
    try {
      setFetchingData(true);
      const response = await OutletService.getOutlet(id);

      // Based on your API response, the outlet data is directly in response.result
      const outlet = response.result;

      if (outlet) {
        const convertedOperationHours = {
          Monday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
          Tuesday: {
            is_operated: false,
            slots: [{ opening: "", closing: "" }],
          },
          Wednesday: {
            is_operated: false,
            slots: [{ opening: "", closing: "" }],
          },
          Thursday: {
            is_operated: false,
            slots: [{ opening: "", closing: "" }],
          },
          Friday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
          Saturday: {
            is_operated: false,
            slots: [{ opening: "", closing: "" }],
          },
          Sunday: { is_operated: false, slots: [{ opening: "", closing: "" }] },
        };

        // Map API day names to your component's day names
        const dayNameMapping = {
          Monday: "Monday",
          Tuesday: "Tuesday",
          Wednesday: "Wednesday",
          Thursday: "Thursday",
          Friday: "Friday",
          Saturday: "Saturday",
          Sunday: "Sunday",
        };

        if (outlet.operating_schedule) {
          // The API uses day names as keys, not numbers
          Object.entries(outlet.operating_schedule).forEach(
            ([dayName, dayData]) => {
              const mappedDayName = dayNameMapping[dayName];
              if (mappedDayName && convertedOperationHours[mappedDayName]) {
                convertedOperationHours[mappedDayName].is_operated =
                  dayData.is_operated;

                if (
                  dayData.is_operated &&
                  dayData.operating_hours &&
                  dayData.operating_hours.length > 0
                ) {
                  const slots = [];

                  dayData.operating_hours.forEach((hourData) => {
                    // Skip default closed hours (00:00:00 to 00:00:00)
                    if (
                      !(
                        hourData.start_time === "00:00:00" &&
                        hourData.end_time === "00:00:00"
                      )
                    ) {
                      const startTime = hourData.start_time.substring(0, 5);
                      const endTime =
                        hourData.end_time === "00:00:00"
                          ? "23:59"
                          : hourData.end_time.substring(0, 5);

                      slots.push({
                        opening: startTime,
                        closing: endTime,
                      });
                    }
                  });

                  if (slots.length > 0) {
                    convertedOperationHours[mappedDayName].slots = slots;
                  } else if (dayData.is_operated) {
                    // If operated but no valid hours, provide empty slot for user to fill
                    convertedOperationHours[mappedDayName].slots = [
                      { opening: "", closing: "" },
                    ];
                  }
                } else if (dayData.is_operated) {
                  // If operated but no operating_hours array, provide empty slot
                  convertedOperationHours[mappedDayName].slots = [
                    { opening: "", closing: "" },
                  ];
                }
              }
            }
          );
          // console.log(outlet);
          // console.log(outlet.outlet_menu);
          // Initialize selected menu items from outlet data
          const initialSelectedItems = outlet.outlet_menu || [];
          setSelectedMenuItems(
            initialSelectedItems.map((item) => Number(item.menu_item_id))
          );

          // console.log(outlet);
          setFormData({
            outletName: outlet.title || "",
            outletEmail: outlet.email || "",
            outletContact: outlet.phone || "",
            outletPassword: "",
            outletPasswordConfirmation: "",
            outletAddress: outlet.address || "",
            outletState: outlet.state || "",
            outletPostcode: outlet.postal_code || "",
            outletLatitude: outlet.latitude || "3.1390",
            outletLongitude: outlet.longitude || "101.6869",
            outletZeoniqCode: outlet.zeoniq_loc_code || "",
            operationHours: convertedOperationHours,
            outletImage: outlet.outlet_image || "",
            serveMethods: outlet.serve_method
              ? outlet.serve_method.split(",").map((s) => s.trim())
              : [],
            deliveryOptions: outlet.delivery_options
              ? outlet.delivery_options.split(",").map((s) => s.trim())
              : [],
            deliveryRange: outlet.outlet_delivery_coverage || "",
            reservationSlots: "",
            orderSlots: outlet.order_max_per_hour || "",
            pizzaSlots: outlet.item_max_per_hour || "",
            eventSlots: "",
            applySst: outlet.outlet_tax?.sst ? "Yes" : "No",
            applyServiceTax: outlet.outlet_tax?.service_tax ? "Yes" : "No",
            status: outlet.status || "active",
          });

          setMarkerLocation({
            lat: parseFloat(outlet.latitude || "3.1390"),
            lng: parseFloat(outlet.longitude || "101.6869"),
          });

          if (outlet.address && outlet.state && outlet.postal_code) {
            geocodeAddress(outlet.address, outlet.state, outlet.postal_code);
          }
        }

        setFormData({
          outletName: outlet.title || "",
          outletEmail: outlet.email || "",
          outletContact: outlet.phone || "",
          outletPassword: "",
          outletPasswordConfirmation: "",
          outletAddress: outlet.address || "",
          outletState: outlet.state || "",
          outletPostcode: outlet.postal_code || "",
          outletLatitude: outlet.latitude || "3.1390",
          outletLongitude: outlet.longitude || "101.6869",
          outletZeoniqCode: outlet.zeoniq_loc_code || "",
          operationHours: convertedOperationHours,
          outletImage: outlet.outlet_image || "",
          serveMethods: outlet.serve_method
            ? outlet.serve_method.split(",").map((s) => s.trim())
            : [],
          deliveryOptions: outlet.delivery_options
            ? outlet.delivery_options.split(",").map((s) => s.trim())
            : [],
          deliveryRange: outlet.outlet_delivery_coverage || "",
          reservationSlots: "",
          orderSlots: outlet.order_max_per_hour || "",
          pizzaSlots: outlet.item_max_per_hour || "",
          eventSlots: "",
          images: outlet.outlet_images || "",
          outletTax: outlet.outlet_tax || "",
          applySst: outlet.outlet_tax?.some((t) => Number(t.tax_id) === 1)
            ? "Yes"
            : "No",
          applyServiceTax: outlet.outlet_tax?.some(
            (t) => Number(t.tax_id) === 2
          )
            ? "Yes"
            : "No",
          status: outlet.status || "active",
        });

        setImages(
          (outlet.outlet_images || []).map((img) => ({
            name: img.image_url
              ? `existing-image-${img.id}`
              : `image-${img.id}`,
            preview: img.image_url,
            existing: true,
            id: img.id,
          }))
        );

        setMarkerLocation({
          lat: parseFloat(outlet.latitude || "3.1390"),
          lng: parseFloat(outlet.longitude || "101.6869"),
        });

        if (
          (!outlet.latitude || !outlet.longitude) &&
          outlet.address &&
          outlet.state &&
          outlet.postal_code
        ) {
          geocodeAddress(outlet.address, outlet.state, outlet.postal_code);
        }
      }
    } catch (err) {
      setError(
        "Failed to fetch outlet data: " + (err.message || "Unknown error")
      );
      console.error("Error fetching outlet:", err);
    } finally {
      setFetchingData(false);
    }
  };

  const getUncategorizedItems = () => {
    return items.filter((item) => {
      // Check all possible category fields to determine if item is uncategorized
      return (
        !item.categoryId &&
        (!item.category || item.category.length === 0) &&
        (!item.categories || item.categories.length === 0)
      );
    });
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

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleItemChange = (itemId, isChecked) => {
    const id = Number(itemId);
    setSelectedMenuItems((prev) => {
      // console.log("Item change - itemId:", id, "isChecked:", isChecked);
      // console.log("Previous selected items:", prev);

      const result = isChecked
        ? [...prev, id]
        : prev.filter((selectedId) => selectedId !== id);

      // console.log("New selected items:", result);
      return result;
    });
  };

  const handleCategoryItemsChange = (categoryId, checked) => {
    const categoryItems =
      categoryId === "uncategorized"
        ? getUncategorizedItems()
        : getItemsForCategory(categoryId);

    const categoryItemIds = categoryItems.map((item) => Number(item.id));

    setSelectedMenuItems((prev) => {
      if (checked) {
        // Add all category items that aren't already selected
        const newItems = [...prev];
        categoryItemIds.forEach((itemId) => {
          if (!newItems.includes(itemId)) {
            newItems.push(itemId);
          }
        });
        return newItems;
      } else {
        // Remove all category items
        return prev.filter((id) => !categoryItemIds.includes(id));
      }
    });
  };

  const areAllCategoryItemsSelected = (categoryId) => {
    const categoryItems =
      categoryId === "uncategorized"
        ? getUncategorizedItems()
        : getItemsForCategory(categoryId);

    if (categoryItems.length === 0) return false;

    const categoryItemIds = categoryItems.map((item) => Number(item.id));
    return categoryItemIds.every((itemId) =>
      selectedMenuItems.includes(itemId)
    );
  };

  const getSelectedItemsNames = () => {
    const selectedItems = items.filter((item) =>
      selectedMenuItems.includes(Number(item.id))
    );

    if (selectedItems.length === 0) return "No items selected";

    const displayNames = selectedItems
      .slice(0, 3)
      .map(
        (item) => item.name || item.title || item.label || `Item #${item.id}`
      )
      .join(", ");

    return selectedItems.length > 3
      ? `${displayNames} and ${selectedItems.length - 3} more...`
      : displayNames;
  };

  const openMenuPopup = () => {
    setPopupState({
      isOpen: true,
      type: "item",
      fieldId: "menuItems",
    });
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      type: null,
      fieldId: null,
    });
  };

  const renderPopup = () => {
    if (!popupState.isOpen) return null;

    const handleRemoveImage = (idx, img) => {
      setImages((prev) => prev.filter((_, i) => i !== idx));
      if (img.existing && img.id) {
        setRemovedImages((prev) => [...prev, img.id]);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Select Menu Items</h3>
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
                <div className="text-gray-500">Loading items...</div>
              </div>
            ) : categories.length === 0 &&
              getUncategorizedItems().length === 0 ? (
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
                              handleCategoryItemsChange(
                                category.id,
                                e.target.checked
                              );
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                          />
                          <span className="font-medium text-gray-900 flex-1">
                            {category.name || category.title} (
                            {categoryItems.length} items)
                          </span>
                        </div>
                        <div>
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
                              <label
                                key={item.id}
                                className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMenuItems.includes(
                                    Number(item.id)
                                  )}
                                  onChange={(e) =>
                                    handleItemChange(item.id, e.target.checked)
                                  }
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name || item.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Price: RM{item.price || "N/A"} |{" "}
                                    {item.optionGroups?.length || 0} Option
                                    Group
                                    {(item.optionGroups?.length || 0) !== 1
                                      ? "s"
                                      : ""}
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
                      onClick={() => toggleCategoryExpansion("uncategorized")}
                    >
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={areAllCategoryItemsSelected("uncategorized")}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCategoryItemsChange(
                              "uncategorized",
                              e.target.checked
                            );
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                        />
                        <span className="font-medium text-gray-900 flex-1">
                          Other Items ({getUncategorizedItems().length})
                        </span>
                      </div>
                      <div>
                        {expandedCategories["uncategorized"] ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </div>
                    </div>

                    {expandedCategories["uncategorized"] && (
                      <div className="border-t">
                        <div className="p-3 space-y-2">
                          {getUncategorizedItems().map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMenuItems.includes(
                                  Number(item.id)
                                )}
                                onChange={(e) =>
                                  handleItemChange(item.id, e.target.checked)
                                }
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name || item.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Price: RM{item.price || "N/A"} |{" "}
                                  {item.optionGroups?.length || 0} Option Group
                                  {(item.optionGroups?.length || 0) !== 1
                                    ? "s"
                                    : ""}
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

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!formData.outletName?.trim()) return setError("Outlet name is required");
  if (!formData.outletEmail?.trim()) return setError("Outlet email is required");
  if (!formData.outletContact?.trim()) return setError("Outlet contact is required");
  if (formData.outletPassword && formData.outletPassword !== formData.outletPasswordConfirmation) {
    return setError("Passwords do not match");
  }

  try {
    setLoading(true);

    // Build operatingDays & operatingHours
    const operatingDays = {};
    const operatingHours = {};
    Object.entries(formData.operationHours).forEach(([dayName, dayData]) => {
      operatingDays[dayName] = { is_operated: !!dayData.is_operated };
      operatingHours[dayName] = (dayData.slots || []).map((slot) => ({
        start_time: slot.opening ? `${slot.opening}:00` : "",
        end_time: slot.closing ? `${slot.closing}:00` : "",
      }));
    });

    // Taxes
    const outletTax = [];
    if (formData.applySst === "Yes") outletTax.push({ tax_id: 1 });
    if (formData.applyServiceTax === "Yes") outletTax.push({ tax_id: 2 });

    // Split images into existing vs new
    const existingImages = (images || []).filter((img) => img.existing && img.id);
    const newImages = (images || []).filter((img) => !img.existing && img.file instanceof File);

    // Build FormData
    const fd = new FormData();

    // Basic fields (strings/numbers)
    // fd.append("status", formData.status || "active");
    fd.append("title", formData.outletName || "");
    fd.append("email", formData.outletEmail || "");
    fd.append("phone", formData.outletContact || "");
    fd.append("address", formData.outletAddress || "");
    fd.append("state", formData.outletState || "");
    fd.append("postal_code", formData.outletPostcode || "");
    fd.append("country", "Malaysia");
    // numeric-ish: fallback to "0" (CI4 validation requires numeric)
    fd.append("latitude", formData.outletLatitude?.toString() || "0");
    fd.append("longitude", formData.outletLongitude?.toString() || "0");
    fd.append("serve_method", (formData.serveMethods || []).join(","));
    fd.append("delivery_options", (formData.deliveryOptions || []).join(","));
    fd.append("outlet_delivery_coverage", (formData.deliveryRange ?? 0).toString());
    fd.append("order_max_per_hour", (formData.orderSlots ?? 0).toString());
    fd.append("item_max_per_hour", (formData.pizzaSlots ?? 0).toString());
    fd.append("status", formData.status || "active");
    fd.append("zeoniq_loc_code", formData.outletZeoniqCode || "");

    // Optional password
    if (formData.outletPassword?.trim()) {
      fd.append("password", formData.outletPassword.trim());
    }

    // ===== CHANGES START HERE =====

    // Complex objects — backend expects [0], so wrap in single-element array
    fd.append("outlet_tax", JSON.stringify(outletTax));
    fd.append("outlet_operating_days", JSON.stringify([operatingDays]));   // <—
    fd.append("outlet_operating_hours", JSON.stringify([operatingHours])); // <—

    // Menu items — backend expects array, not JSON
    // selectedMenuItems can be ids or objects; normalize to ids:
    const menuIds = (selectedMenuItems || []).map((m) => (typeof m === "object" ? (m.id ?? m) : m)).filter(Boolean);
    if (menuIds.length) {
      menuIds.forEach((id) => fd.append("outlet_menu[]", String(id)));     // <—
    } else {
      // optional: if you want "delete all" behavior even when empty
      // fd.append("outlet_menu[]", "");
    }

    // Existing image ids (array)
    existingImages.forEach((img) => {
      fd.append("existing_image[]", String(img.id));
    });

    // New images (files) — IMPORTANT: use [] name for multiple
    newImages.forEach((img, idx) => {
      fd.append("outlet_images[]", img.file, img.file.name || `outlet_${idx}.jpg`);
    });

    removedImages.forEach((id) => {
      fd.append("delete_image[]", String(id));
    });

    // Send (service will pass-through FormData unchanged)
    console.log("Submitting updated outlet data...", fd);
    const res = await OutletService.updateOutlet(id, fd);

    setSuccess("Outlet updated successfully!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Error updating outlet:", err);
    setError("Failed to update outlet: " + (err?.message || "Unknown error"));
  } finally {
    setLoading(false);
  }
};


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

  const geocodeAddress = async (address, state, postcode) => {
    if (!address.trim() && !state.trim() && !postcode.trim()) {
      return;
    }

    const addressParts = [address, state, postcode, "Malaysia"].filter((part) =>
      part.trim()
    );
    const fullAddress = addressParts.join(", ");

    // console.log("Geocoding address:", fullAddress);

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

        // console.log("Geocoded location:", location);

        setFormData((prev) => ({
          ...prev,
          outletLatitude: location.lat.toFixed(4),
          outletLongitude: location.lng.toFixed(4),
        }));

        setMapKey((prev) => prev + 1);
      } else {
        console.error("Geocoding failed:", data.status);
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
    setFormData((prev) => {
      let processedValue = value;

      if (field === "serveMethods") {
        processedValue = value.toLowerCase().replace("-", "");
      }

      return {
        ...prev,
        [field]: prev[field].includes(processedValue)
          ? prev[field].filter((item) => item !== processedValue)
          : [...prev[field], processedValue],
      };
    });
  };

  // const handleMultiSelect2 = (field, value) => {
  //   setFormData((prev) => {
  //     let processedValue = value;

  //     if (field === "serveMethods") {
  //       processedValue = value.toLowerCase().replace("-", "");
  //     }

  //     return {
  //       ...prev,
  //       [field]: prev[field].includes(processedValue)
  //         ? prev[field].filter((item) => item !== processedValue)
  //         : [...prev[field], processedValue],
  //     };
  //   });
  // };

  const handleOperationHoursChange = (day, field, value, slotIndex = 0) => {
    // console.log("Operation hours changed:", value);
    setFormData((prev) => {
      const prevDay = prev.operationHours[day] || {
        is_operated: false,
        slots: [],
      };
      let newDay;
      if (field === "is_operated") {
        newDay = {
          ...prevDay,
          is_operated: value,
          slots: value
            ? prevDay.slots && prevDay.slots.length > 0
              ? prevDay.slots
              : [{ opening: "", closing: "" }]
            : [{ opening: "", closing: "" }],
        };
      } else {
        newDay = {
          ...prevDay,
          slots: prevDay.slots.map((slot, idx) =>
            idx === slotIndex ? { ...slot, [field]: value } : slot
          ),
        };
      }
      return {
        ...prev,
        operationHours: {
          ...prev.operationHours,
          [day]: newDay,
        },
      };
    });
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

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const handleBack = () => {
    navigate(-1);
  };

  const serveMethods = ["Dine-In", "Delivery", "Pick-Up"];
  const deliveryOptions = ["Lalamove", "Grab Express", "3rd Party Delivery"];
  const activeMethods = ["Active", "Inactive"];

  if (fetchingData) {
    return (
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
        <div className="flex justify-center items-center p-20">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600">Loading outlet data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center p-6">
        <h2 className="text-2xl font-semibold text-gray-800">Edit Outlet</h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={handleBack}
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletName}
                onChange={(e) =>
                  setFormData({ ...formData, outletName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Email
              </label>
              <input
                type="email"
                placeholder="Enter here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletEmail}
                onChange={(e) =>
                  handleInputChange("outletEmail", e.target.value)
                }
                required
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletContact}
                onChange={(e) =>
                  handleInputChange("outletContact", e.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Password
                <span className="text-gray-500 text-xs">
                  {" "}
                  (Leave blank to keep current)
                </span>
              </label>
              <input
                type="password"
                placeholder="Enter new password..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletPassword}
                onChange={(e) =>
                  handleInputChange("outletPassword", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Password Confirmation
              </label>
              <input
                type="password"
                placeholder="Confirm new password..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.outletPasswordConfirmation}
                onChange={(e) =>
                  handleInputChange(
                    "outletPasswordConfirmation",
                    e.target.value
                  )
                }
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={formData.outletAddress}
                onChange={(e) =>
                  handleAddressChange("outletAddress", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet State
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.outletState}
                  onChange={(e) =>
                    handleAddressChange("outletState", e.target.value)
                  }
                >
                  <option value="">Select State</option>
                  <option value="Johor">Johor</option>
                  <option value="Kedah">Kedah</option>
                  <option value="Kelantan">Kelantan</option>
                  <option value="Malacca">Malacca</option>
                  <option value="Negeri Sembilan">Negeri Sembilan</option>
                  <option value="Pahang">Pahang</option>
                  <option value="Penang">Penang</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.outletPostcode}
                  onChange={(e) =>
                    handleAddressChange("outletPostcode", e.target.value)
                  }
                />
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
                    type="button"
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
                    type="button"
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
              <p className="text-gray-500 text-sm">
                800×800, JPG, PNG, max 10MB
              </p>
              <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <ImageUp className="text-gray-400" size={24} />
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("image-upload").click()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upload Images
              </button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newImages = files.map((file) => ({
                    file,
                    name: file.name,
                    preview: URL.createObjectURL(file),
                  }));
                  setImages((prev) => [...prev, ...newImages]);
                }}
              />
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImages((prev) => {
                            const updatedImages = prev.filter((_, i) => i !== idx);
                            console.log("Updated Images:", updatedImages);
                            return updatedImages;
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                      : "Select menu items"}
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
                  <label
                    key={method}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serveMethods.includes(
                        method.toLowerCase().replace("-", "")
                      )}
                      onChange={() => handleMultiSelect("serveMethods", method)}
                      className="rounded"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
              <ErrorMessage error={errors.serveMethods} />
            </div>

            {formData.serveMethods.includes("delivery") && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Options
                    </label>
                    <div className="space-y-2">
                      {deliveryOptions.map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.deliveryOptions.includes(option)}
                            onChange={() =>
                              handleMultiSelect("deliveryOptions", option)
                            }
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
            <h3 className="text-lg text-white font-semibold">
              CAPACITY SETTINGS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                onChange={(e) =>
                  handleInputChange("orderSlots", e.target.value)
                }
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
                onChange={(e) =>
                  handleInputChange("pizzaSlots", e.target.value)
                }
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
                onChange={(e) => handleInputChange("applySst", e.target.value)}
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
                  onChange={(e) =>
                    handleInputChange("applyServiceTax", e.target.value)
                  }
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Outlet Settings Section */}
        <div>
          <div className="bg-indigo-900 text-center py-2 mb-6">
            <h3 className="text-lg text-white font-semibold">OUTLET SETTINGS</h3>
          </div>

          <div className="space-y-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outlet Status
              </label>
              <div className="flex items-center space-x-6">
                {/* Active Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === "active"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: prev.status === "active" ? "inactive" : "active",
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-md">Active</span>
                </label>
                {/* Inactive Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === "inactive"}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: prev.status === "inactive" ? "active" : "inactive",
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-md">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="px-8 py-3 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditOutletForm;
