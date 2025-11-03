import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import membershipSettingService from "@/store/api/membershipSettingService";

const BirthdayBonus = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bonusPoint, setBonusPoint] = useState("");
  const [status, setStatus] = useState("Active");
  const [bonusTimes, setBonusTimes] = useState("");

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        type: "birthday_bonus",
        active_date_from: dateFrom,
        active_date_to: dateTo,
        bonus: bonusPoint,
        bonus_times: bonusTimes,
        status: status,
      };

      const response = await membershipSettingService.update(payload);
      console.log("213", response);

      toast.success("Form submitted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg shadow-lg bg-white max-w-3xl mx-auto mt-10">
      <div className="mx-auto py-3 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="p-3 pb-2 pt-5 flex justify-end">
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={handleBack}
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between bg-indigo-900 text-white px-4 py-2 text-sm font-medium">
            <span>Birthday Bonus</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm pt-8">
            <div className="mt-4">
              <label className="text-xs text-gray-500">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs text-gray-500">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-500"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
              Bonus <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={bonusPoint}
              onChange={(e) => setBonusPoint(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Bonus"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
              Bonus Point <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={bonusTimes}
              onChange={(e) => setBonusTimes(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Bonus Point"
              required
            />
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm pt-8">
            <div className="bg-indigo-900 text-white text-center py-2 text-sm font-medium mb-4">
              Status
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex bg-white p-6 justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X size={20} className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Save size={20} className="mr-2" />
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BirthdayBonus;
