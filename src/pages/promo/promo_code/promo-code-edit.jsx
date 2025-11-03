import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Upload,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  AlignLeft,
  Info,
  Trash2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import promoCodeService from "../../../store/api/promoCodeService";
import promoSettingsService from "../../../store/api/promoSettingsService";
import "../../../assets/scss/style.css";

export default function EditPromoCode() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    promo_code: "",
    promo_setting_id: "",
    usage_limit_type: "multiple",
    total_redemption_limit: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    customize_validity: {
      mon: { enabled: false, startTime: "", endTime: "" },
      tue: { enabled: false, startTime: "", endTime: "" },
      wed: { enabled: false, startTime: "", endTime: "" },
      thurs: { enabled: false, startTime: "", endTime: "" },
      fri: { enabled: false, startTime: "", endTime: "" },
      sat: { enabled: false, startTime: "", endTime: "" },
      sun: { enabled: false, startTime: "", endTime: "" },
    },
    promo_order_type: ["delivery", "pickup", "dinein"],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingPromoCode, setLoadingPromoCode] = useState(true);
  const [promoSettings, setPromoSettings] = useState([]);
  const [loadingPromoSettings, setLoadingPromoSettings] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromoCode = async () => {
      setLoadingPromoCode(true);
      try {
        const response = await promoCodeService.getById(id);
        console.log("Promo code response:", response);

        if (response.status == 200) {
          const promoData = response.result;

          if (promoData) {
            setFormData({
              promo_code: promoData.code || "",
              promo_setting_id: promoData.promo_setting_id || "",
              usage_limit_type: promoData.usage_limit_type || "multiple",
              total_redemption_limit: promoData.total_redemption_limit || "",
              usage_limit: promoData.usage_limit || "",
              start_date: promoData.start_date
                ? promoData.start_date.split("T")[0]
                : "",
              end_date: promoData.end_date
                ? promoData.end_date.split("T")[0]
                : "",
              customize_validity: promoData.customize_validity || {
                mon: { enabled: false, startTime: "", endTime: "" },
                tue: { enabled: false, startTime: "", endTime: "" },
                wed: { enabled: false, startTime: "", endTime: "" },
                thurs: { enabled: false, startTime: "", endTime: "" },
                fri: { enabled: false, startTime: "", endTime: "" },
                sat: { enabled: false, startTime: "", endTime: "" },
                sun: { enabled: false, startTime: "", endTime: "" },
              },
              promo_order_type: Array.isArray(promoData.promo_order_type)
                ? promoData.promo_order_type
                : ["delivery", "pickup", "dinein"],
            });
          }
        } else {
          toast.error("Failed to load promo code data");
        }
      } catch (error) {
        console.error("Error fetching promo code:", error);
        toast.error("Failed to load promo code data");
      } finally {
        setLoadingPromoCode(false);
      }
    };

    const fetchPromoSettings = async () => {
      setLoadingPromoSettings(true);
      try {
        const response = await promoSettingsService.getAll();
        console.log("Promo settings response:", response);

        const settings =
          response.data || response.promoSettings || response || [];
        setPromoSettings(Array.isArray(settings) ? settings : []);
      } catch (error) {
        console.error("Error fetching promo settings:", error);
        toast.error("Failed to load promo settings");
        setPromoSettings([]);
      } finally {
        setLoadingPromoSettings(false);
      }
    };

    fetchPromoCode();
    fetchPromoSettings();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayTimeChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      customize_validity: {
        ...prev.customize_validity,
        [day]: {
          ...prev.customize_validity[day],
          [field]: value,
        },
      },
    }));
  };

  const handleApplyToDeliveryPickupChange = (optionValue, checked) => {
    setFormData((prev) => {
      let next = Array.isArray(prev.promo_order_type)
        ? [...prev.promo_order_type]
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

      return { ...prev, promo_order_type: next };
    });
  };

  const validateForm = () => {
    const requiredFields = [
      "promo_code",
      "promo_setting_id",
      "start_date",
      "end_date",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in the ${field.replace(/_/g, " ")}`);
        return false;
      }
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        toast.error("End date must be after start date");
        return false;
      }
    }

    if (
      formData.total_redemption_limit &&
      parseInt(formData.total_redemption_limit) < 0
    ) {
      toast.error("Total redemption limit cannot be negative");
      return false;
    }

    if (
      formData.usage_limit_type == "multiple" &&
      parseInt(formData.usage_limit) <= 0
    ) {
      toast.error("Voucher limit per customer must be greater than 0");
      return false;
    }

    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiData = {
        ...formData,
        total_redemption_limit: formData.total_redemption_limit
          ? parseInt(formData.total_redemption_limit)
          : 0,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
      };

      console.log("Updating promo code with data:", apiData);

      const response = await promoCodeService.update(id, apiData);

      if (response.status == 200) {
        navigate("/promo/promo_code");

        toast.success(response.message || "Promo code updated successfully!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        toast.error(response.message || "Failed to update Promo Code", {
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
    } catch (error) {
      console.error("Error updating promo code:", error);
      toast.error(
        error.message || "Failed to update promo code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Reset to original data by re-fetching
    const fetchOriginalData = async () => {
      try {
        const response = await promoCodeService.getById(id);
        const promoData = response.data || response.promoCode || response;

        if (promoData) {
          setFormData({
            promo_code: promoData.promo_code || "",
            promo_setting_id: promoData.promo_setting_id || "",
            usage_limit_type: promoData.usage_limit_type || "multiple",
            total_redemption_limit: promoData.total_redemption_limit || "",
            usage_limit: promoData.usage_limit || "",
            start_date: promoData.start_date
              ? promoData.start_date.split("T")[0]
              : "",
            end_date: promoData.end_date
              ? promoData.end_date.split("T")[0]
              : "",
            customize_validity: promoData.customize_validity || {
              mon: { enabled: false, startTime: "", endTime: "" },
              tue: { enabled: false, startTime: "", endTime: "" },
              wed: { enabled: false, startTime: "", endTime: "" },
              thurs: { enabled: false, startTime: "", endTime: "" },
              fri: { enabled: false, startTime: "", endTime: "" },
              sat: { enabled: false, startTime: "", endTime: "" },
              sun: { enabled: false, startTime: "", endTime: "" },
            },
            promo_order_type: Array.isArray(promoData.promo_order_type)
              ? promoData.promo_order_type
              : ["delivery", "pickup", "dinein"],
          });
        }
      } catch (error) {
        console.error("Error resetting promo code:", error);
        toast.error("Failed to reset form data");
      }
    };

    fetchOriginalData();
  };

  const getDayDisplayName = (day) => {
    const dayNames = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thurs: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };
    return dayNames[day] || day;
  };

  const navigateToPromoSettings = (id) => {
    navigate(`/promo/promo_lists/edit_promo/${id}`);
  };

  if (loadingPromoCode) {
    return (
      <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading promo code data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Promo Code
          </h2>
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              PROMO CODE INFORMATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={formData.promo_code}
                  onChange={(e) =>
                    handleInputChange("promo_code", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Promo Setting <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={formData.promo_setting_id}
                      onChange={(e) =>
                        handleInputChange("promo_setting_id", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white pr-10"
                      required
                      disabled={loadingPromoSettings}
                    >
                      <option value="">
                        {loadingPromoSettings
                          ? "Loading..."
                          : "Choose promo setting"}
                      </option>
                      {promoSettings.map((setting) => (
                        <option key={setting.id} value={setting.id}>
                          {setting.promo_name ||
                            setting.name ||
                            setting.title ||
                            `Setting ${setting.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigateToPromoSettings(formData.promo_setting_id)
                    }
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Link
                  </button>
                </div>
                {loadingPromoSettings && (
                  <p className="text-sm text-gray-500 mt-1">
                    Loading promo settings...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Usage Limit Per Customer{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="usageLimit"
                      value="multiple"
                      checked={formData.usage_limit_type == "multiple"}
                      onChange={() =>
                        handleInputChange("usage_limit_type", "multiple")
                      }
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">Multiple Times</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="usageLimit"
                      value="one"
                      checked={formData.usage_limit_type == "one"}
                      onChange={() =>
                        handleInputChange("usage_limit_type", "one")
                      }
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">One Time</span>
                  </label>
                </div>
              </div>

              {formData.usage_limit_type === "multiple" && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Voucher Limit Per Customer
                  </label>
                  <input
                    type="number"
                    placeholder="Enter limit"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      handleInputChange("usage_limit", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Total Redemption Limit
                </label>
                <input
                  type="number"
                  placeholder="Enter total redemption limit (0 for unlimited)"
                  value={formData.total_redemption_limit}
                  onChange={(e) =>
                    handleInputChange("total_redemption_limit", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 0 for unlimited redemptions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    handleInputChange("start_date", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    handleInputChange("end_date", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              CUSTOMIZE DAY & TIME
            </div>

            <div className="space-y-4">
              {Object.entries(formData.customize_validity).map(
                ([day, settings]) => (
                  <div key={day} className="border rounded-lg p-4">
                    <label className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) =>
                          handleDayTimeChange(day, "enabled", e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {getDayDisplayName(day)}
                      </span>
                    </label>

                    {settings.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Start Time
                          </label>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            End Time
                          </label>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <div className="bg-indigo-900 text-white px-4 py-3 text-center font-medium mb-6">
              DELIVERY OPTIONS
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Apply To Delivery or Pickup?{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {(() => {
                  const selected = Array.isArray(formData.promo_order_type)
                    ? formData.promo_order_type
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

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Promo Code"}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
}
