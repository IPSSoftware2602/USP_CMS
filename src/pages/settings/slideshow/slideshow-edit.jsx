import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Select from "@/components/ui/Select";
import { VITE_API_BASE_URL } from "../../../constant/config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X } from "lucide-react";

export default function SlideshowEdit() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const authToken = sessionStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const slideshowData = location.state?.data;

  const [formData, setFormData] = useState({
    fileName: "",
    fileType: "",
    title: "",
    description: "",
    order: 1,
    status: "active",
  });

  // Fetch slideshow data by ID if missing (for refresh/direct link)
  useEffect(() => {
    if (!slideshowData && id) {
      setLoading(true);
      fetch(VITE_API_BASE_URL + `settings/slideshow/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const row = data.result || {};
          setFormData({
            fileName: row.fileName || "",
            fileType: row.fileType || "",
            title: row.title || "",
            description: row.description || "",
            order: row.order || 1,
            status: row.status || "active",
          });
          setImages(row.url ? [row.url] : []);
        })
        .catch(() => {
          toast.error("Failed to fetch slideshow data");
        })
        .finally(() => setLoading(false));
    }
  }, [slideshowData, id, authToken]);

  useEffect(() => {
    if (slideshowData) {
      setFormData({
        fileName: slideshowData.fileName || "",
        fileType: slideshowData.fileType || "",
        title: slideshowData.title || "",
        description: slideshowData.description || "",
        order: slideshowData.order || 1,
        status: slideshowData.status || "active",
      });
      setImages(slideshowData.url ? [slideshowData.url] : []);
    }
  }, [slideshowData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClear = () => {
    setFormData({
      fileName: "",
      fileType: "",
      title: "",
      description: "",
      order: 1,
      status: "active",
    });
    setImages([]);
  };

  const fileTypeOptions = [
    { label: "Images", value: "images" },
    { label: "Video", value: "video" },
  ];

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fileType || !formData.title) {
      toast.error("Please fill all required fields.");
      return;
    }

    const data = new FormData();
    data.append("type", formData.fileType);
    data.append("title", formData.title);
    data.append("description", formData.description);
    // data.append("order", Number(formData.order));
    data.append("status", formData.status);
    // console.log(data)

    if (images[0]) {
      if (typeof images[0] === "string") {
        // It's a URL string (user did NOT select new file), send as text, not file
        data.append("url", images[0]);
      } else {
        // It's a File object (user selected new image)
        data.append("url", images[0]);
      }
    }

    setLoading(true);
    try {
      const response = await fetch(
        VITE_API_BASE_URL + `settings/slideshow/update/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to update slideshow");
        setLoading(false);
        return;
      }

      toast.success(result.message || "Slideshow updated successfully!");
      navigate("/settings/slideshow_settings");
    } catch (err) {
      toast.error("Unexpected error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/settings/slideshow_settings");
  };

  return (
    <div className="bg-white rounded-lg w-full overflow-y-auto">
      <div className="flex-1 p-6">
        <div className="h-full flex flex-col">
          <div className="mb-6 mt-2">
            <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 pb-4">
                Edit Slideshow
              </h1>
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700"
                title="Back"
              >
                <X size={32} />
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">
                  Upload Images
                </h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                <div className="border border-dashed p-8 flex flex-col items-center justify-center">
                  <p className="text-gray-500 text-sm">
                    800×800, JPG, PNG, max 10MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setImages(files);
                      if (files[0]) {
                        handleInputChange("fileName", files[0].name);
                      }
                    }}
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 border rounded cursor-pointer hover:bg-gray-50"
                  >
                    + Add Image
                  </label>
                </div>

                {/* IMAGE PREVIEW: supports both string (existing) and File */}
                {images.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={
                              typeof image === "string"
                                ? image
                                : URL.createObjectURL(image)
                            }
                            alt={`Preview ${index + 1}`}
                            className="w-full h-72 rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slide Type
                  </label>
                  <Select
                    options={fileTypeOptions}
                    value={formData.fileType}
                    onChange={(e) =>
                      handleInputChange(
                        "fileType",
                        e.target ? e.target.value : e.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter slide title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Enter description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-80 bg-white">
        <div className="h-full flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto"></div>
          <div className="p-6 border-white">
            <div className="flex space-x-3">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                disabled={loading}
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                disabled={loading}
              >
                {loading ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
