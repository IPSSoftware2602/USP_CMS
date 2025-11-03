import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import itemService from "../../../store/api/itemService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PWPEdit = () => {
  const [formData, setFormData] = useState({
    pwpOption: "",
    quantityOrAmount: "",
    requiredValue: "",
  });

  const [menuItems, setMenuItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItemOptions, setSelectedItemOptions] = useState([]);
  const [withPurchaseOptions, setWithPurchaseOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Store previously selected items when switching to all_item mode
  const [previousSelectedItems, setPreviousSelectedItems] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  // input handler
  const handleInputChange = (field, value) => {
    if (field === "pwpOption") {
      // When switching from selected_item to all_item
      if (formData.pwpOption === "selected_item" && value === "all_item") {
        // Save current selection before clearing
        setPreviousSelectedItems([...selectedItemOptions]);
        setSelectedItemOptions([]);
      }
      // When switching from all_item to selected_item
      else if (formData.pwpOption === "all_item" && value === "selected_item") {
        // Restore previous selection if available
        if (previousSelectedItems.length > 0) {
          setSelectedItemOptions([...previousSelectedItems]);
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await itemService.getMenuItems();
        setMenuItems(response.data || []);
      } catch (error) {
        toast.error("Failed to fetch menu items");
      }
    };

    fetchMenuItems();
  }, []);

  // fetch data
  useEffect(() => {
    if (!id || menuItems.length === 0) return;

    const fetchPwpData = async () => {
      try {
        const response = await itemService.getPwp(id);
        console.log("PWP Data:", response);

        if (response) {
          const pwpData = response;
          setFormData({
            pwpOption: pwpData.mode || "all_item",
            quantityOrAmount: pwpData.amount_type || "",
            requiredValue: pwpData.amount || "",
          });

          console.log(pwpData.pwp_item_id);

          if (pwpData.pwp_item_id) {
            const ids = pwpData.pwp_item_id.split(",").map((i) => i.trim());
            const selected = menuItems.filter((item) =>
              ids.includes(item.id.toString())
            );
            console.log("Selected items:", selected);
            setSelectedItemOptions(selected);
            // Store initially loaded items as previous selection
            setPreviousSelectedItems(selected);
          }

          if (Array.isArray(pwpData.selected_item_details)) {
            setWithPurchaseOptions(pwpData.selected_item_details);
          }
        }
      } catch (error) {
        console.error("Error fetching PWP data:", error);
        toast.error("Failed to load PWP data");
      } finally {
        setLoading(false);
      }
    };
    fetchPwpData();
  }, [id, menuItems]);

  const handleSave = async () => {
    try {
      const selectedItemIds = selectedItemOptions.map((item) => item.id);
      const withPurchaseItemIds = withPurchaseOptions.map((item) => item.id);

      const payload = {
        mode: formData.pwpOption,
        order_index: 1,
        pwp_item_id:
          formData.pwpOption === "selected_item" ? selectedItemIds : [],
        amount: formData.requiredValue,
        amount_type: formData.quantityOrAmount,
        selected_item: withPurchaseItemIds,
      };

      console.log("Payload:", payload);

      if (id) {
        const response = await itemService.updatePwp(id, payload);
        console.log("Update Response:", response);

        if (response?.status === 200 || response?.data?.status === 200) {
          toast.success(
            response?.data?.message || "PWP promo updated successfully!"
          );
          navigate("/promo/pwp");
        } else {
          toast.error(response?.data?.message || "Failed to update PWP");
        }
      } else {
        toast.error("Missing ID, cannot update PWP");
      }
    } catch (error) {
      console.error("Error saving PWP:", error);
      toast.error(`Failed to ${id ? "update" : "save"} PWP`);
    }
  };

  const handleBack = () => {
    navigate("/promo/pwp");
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleAddItem = (item) => {
    if (modalType === "pwp") {
      if (!selectedItemOptions.some((i) => i.id === item.id)) {
        setSelectedItemOptions((prev) => [...prev, item]);
        // Also update previous selection when adding new items
        setPreviousSelectedItems((prev) => [...prev, item]);
        toast.success(`${item.title} added to PWP items`);
      }
    } else {
      if (!withPurchaseOptions.some((i) => i.id === item.id)) {
        setWithPurchaseOptions((prev) => [...prev, item]);
        toast.success(`${item.title} added to With Purchase Of`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading PWP data...</p>
      </div>
    );
  }

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full p-4">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl -ml-3 font-semibold text-gray-900">
            {id ? "Edit PWP" : "Add New PWP"}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={handleBack}
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-indigo-900 text-white text-center py-3 font-medium">
          PWP SETTINGS
        </div>

        <div className="p-6 space-y-6">
          {/* PWP Option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PWP Option
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pwpOption"
                  value="all_item"
                  checked={formData.pwpOption === "all_item"}
                  onChange={(e) =>
                    handleInputChange("pwpOption", e.target.value)
                  }
                  className="mr-3 h-4 w-4 text-indigo-600"
                />
                <span className="text-gray-700">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pwpOption"
                  value="selected_item"
                  checked={formData.pwpOption === "selected_item"}
                  onChange={(e) =>
                    handleInputChange("pwpOption", e.target.value)
                  }
                  className="mr-3 h-4 w-4 text-indigo-600"
                />
                <span className="text-gray-700">Selected Item</span>
              </label>
            </div>
          </div>

          {/* Selected Items - Only show when selected_item mode is active */}
          {formData.pwpOption === "selected_item" && (
            <div>
              <button
                type="button"
                className="bg-indigo-900 text-white px-6 py-2 rounded-md"
                onClick={() => handleOpenModal("pwp")}
              >
                + Add PWP Items
              </button>

              {selectedItemOptions.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm text-gray-600 font-medium">
                      Selected PWP Items:
                    </span>
                    {selectedItemOptions.map((item, index) => (
                      <div
                        key={item.id || `selected-item-${index}`}
                        className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <span>{item.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemOptions((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                            // Also update previous selection when removing items
                            setPreviousSelectedItems((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* With Purchase Of */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              With Purchase Of
            </label>
            <button
              type="button"
              className="bg-indigo-900 text-white px-6 py-2 rounded-md"
              onClick={() => handleOpenModal("withPurchase")}
            >
              + Add With Purchase Of Items
            </button>

            {withPurchaseOptions.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    With Purchase Of:
                  </span>
                  {withPurchaseOptions.map((item, index) => (
                    <div
                      key={item.id || `with-purchase-item-${index}`}
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{item.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setWithPurchaseOptions((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Required Quantity or Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Specific Quantity Or Amount To Get PWP
            </label>
            <div className="space-y-3 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="quantityOrAmount"
                  value="quantity"
                  checked={formData.quantityOrAmount === "quantity"}
                  onChange={(e) =>
                    handleInputChange("quantityOrAmount", e.target.value)
                  }
                  className="mr-3 h-4 w-4 text-indigo-600"
                />
                <span className="text-gray-700">Quantity</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="quantityOrAmount"
                  value="amount"
                  checked={formData.quantityOrAmount === "amount"}
                  onChange={(e) =>
                    handleInputChange("quantityOrAmount", e.target.value)
                  }
                  className="mr-3 h-4 w-4 text-indigo-600"
                />
                <span className="text-gray-700">Amount</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="Enter here"
              value={formData.requiredValue}
              onChange={(e) =>
                handleInputChange("requiredValue", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {modalType === "pwp"
                  ? "Select PWP Items"
                  : "Select With Purchase Of Items"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">
                        {item.short_description || "No description available"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="bg-indigo-900 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  No menu items available
                </p>
              )}
            </div>

            <div className="flex justify-center mt-4">
              <button
                type="button"
                className="bg-indigo-900 text-white px-6 py-2 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWPEdit;
