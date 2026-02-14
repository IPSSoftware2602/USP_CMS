import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X, Check, Download, MapPin } from "lucide-react";
import UniqueQrService from "../../store/api/uniqueQrService";
import { BASE_URL } from "../../constant/config";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

const UniqueQrEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userData = (() => {
        try {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr) : null;
        } catch { return null; }
    })();
    const user_id = userData?.user?.user_id || null;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [outlets, setOutlets] = useState([]);
    const [allMenuItems, setAllMenuItems] = useState([]);
    const [outletMenuItems, setOutletMenuItems] = useState([]);
    const [selectedMenuItems, setSelectedMenuItems] = useState([]);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [existingLogo, setExistingLogo] = useState(null);
    const [qrImage, setQrImage] = useState(null);
    const [uniqueCode, setUniqueCode] = useState("");
    const [showMenuPopup, setShowMenuPopup] = useState(false);
    const [menuSearch, setMenuSearch] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        outlet_id: "",
        status: "active",
        address: "",
        unit: "",
        address_note: "",
        latitude: "",
        longitude: "",
    });

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (formData.outlet_id && allMenuItems.length > 0) {
            loadOutletMenuItems(formData.outlet_id);
        }
    }, [formData.outlet_id, allMenuItems]);

    const loadData = async () => {
        try {
            setFetching(true);
            const [outletsRes, menuRes, qrRes] = await Promise.all([
                UniqueQrService.getOutlets(user_id),
                UniqueQrService.getMenuItems(),
                UniqueQrService.getOne(id),
            ]);

            const outletsList = Array.isArray(outletsRes.result) ? outletsRes.result : [];
            const menuRaw = Array.isArray(menuRes.data) ? menuRes.data : (Array.isArray(menuRes.result) ? menuRes.result : []);
            // Map 'title' to 'name' for consistency
            const menuList = menuRaw.map((m) => ({ ...m, name: m.title || m.name }));
            setOutlets(outletsList);
            setAllMenuItems(menuList);

            if (qrRes.status === 200 && qrRes.result) {
                const qr = qrRes.result;
                setFormData({
                    name: qr.name || "",
                    outlet_id: qr.outlet_id || "",
                    status: qr.status || "active",

                    address: qr.address || "",
                    unit: qr.unit || "",
                    address_note: qr.address_note || "",
                    latitude: qr.latitude || "",
                    longitude: qr.longitude || "",
                });
                setUniqueCode(qr.unique_code || "");

                if (qr.qr_image) {
                    setQrImage(qr.qr_image_url || `${BASE_URL}backend/uploads/unique_qr/${qr.qr_image}`);
                }

                // Restore selected menu items
                // Handle various possible API response structures
                let restoredIds = [];
                if (qr.menu_item_ids && Array.isArray(qr.menu_item_ids)) {
                    // If it's already a flat array of IDs
                    restoredIds = qr.menu_item_ids.map(id => Number(id));
                } else if (qr.menu_items && Array.isArray(qr.menu_items)) {
                    // Handle both array of objects and array of primitives (IDs)
                    restoredIds = qr.menu_items.map((m) => {
                        if (typeof m === 'object' && m !== null) {
                            return m.menu_item_id ? Number(m.menu_item_id) : (m.id ? Number(m.id) : null);
                        }
                        return Number(m);
                    }).filter(id => id !== null && !isNaN(id));
                } else if (typeof qr.menu_item_ids === 'string') {
                    // If it's a comma-separated string
                    restoredIds = qr.menu_item_ids.split(',').map(id => Number(id.trim())).filter(n => !isNaN(n));
                }

                if (restoredIds.length > 0) {
                    setSelectedMenuItems(restoredIds);
                }
            }
        } catch (err) {
            toast.error("Failed to load data.");
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const loadOutletMenuItems = async (outletId) => {
        try {
            const response = await UniqueQrService.getMenuItemsByOutlet(outletId);
            const menuItemIds = Array.isArray(response.result) ? response.result : [];
            if (menuItemIds.length > 0) {
                const filtered = allMenuItems.filter((m) => menuItemIds.includes(m.id));
                setOutletMenuItems(filtered);
            } else {
                setOutletMenuItems(allMenuItems);
            }
        } catch (err) {
            console.error("Error loading outlet menu items:", err);
            setOutletMenuItems(allMenuItems);
        }
    };

    const geocodeAddress = async () => {
        const address = formData.address?.trim();
        if (!address) {
            toast.error("Please enter an address first.");
            return;
        }
        try {
            setIsGeocoding(true);
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                toast.error("Google Maps API key not configured.");
                setIsGeocoding(false);
                return;
            }
            const fullAddress = `${address}, Malaysia`;
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
            );
            const data = await response.json();
            if (data.status === "OK" && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                setFormData((prev) => ({
                    ...prev,
                    latitude: location.lat.toFixed(4),
                    longitude: location.lng.toFixed(4),
                }));
                toast.success("Coordinates retrieved successfully!");
            } else {
                toast.error("Could not find coordinates for this address.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            toast.error("Failed to get coordinates.");
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            setExistingLogo(null);
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setExistingLogo(null);
    };

    const toggleMenuItem = (id) => {
        const numId = Number(id);
        setSelectedMenuItems((prev) =>
            prev.includes(numId) ? prev.filter((x) => x !== numId) : [...prev, numId]
        );
    };

    const selectAllMenu = () => {
        const filteredIds = filteredMenuItems.map((m) => Number(m.id));
        setSelectedMenuItems((prev) => {
            const newSet = new Set([...prev, ...filteredIds]);
            return Array.from(newSet);
        });
    };

    const deselectAllMenu = () => {
        const filteredIds = filteredMenuItems.map((m) => Number(m.id));
        setSelectedMenuItems((prev) => prev.filter((x) => !filteredIds.includes(x)));
    };

    const filteredMenuItems = outletMenuItems.filter((m) =>
        m.name.toLowerCase().includes(menuSearch.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.outlet_id) {
            toast.error("Please fill in the required fields (Name and Outlet).");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name);
            fd.append("outlet_id", formData.outlet_id);
            fd.append("status", formData.status);

            fd.append("address", formData.address);
            fd.append("unit", formData.unit);
            fd.append("address_note", formData.address_note);
            fd.append("latitude", formData.latitude);
            fd.append("longitude", formData.longitude);
            fd.append("menu_items", JSON.stringify(selectedMenuItems));

            if (logoFile) {
                fd.append("logo", logoFile);
            } else if (existingLogo) {
                fd.append("existing_logo", existingLogo);
            }

            const result = await UniqueQrService.update(id, fd);
            if (result.status === 200) {
                toast.success("Unique QR updated successfully!");
                setTimeout(() => navigate("/unique-qr"), 1500);
            } else {
                toast.error(result.message || "Failed to update.");
            }
        } catch (err) {
            toast.error("Failed to update Unique QR.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <ToastContainer />
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate("/unique-qr")}
                    className="p-2 hover:bg-gray-100 rounded-md"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-semibold text-gray-500">
                    Edit Unique QR
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                {/* QR Code Display */}
                {qrImage && (
                    <div className="bg-white rounded-lg shadow-sm mb-6">
                        <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
                            <h2 className="text-lg font-medium text-white">QR Code</h2>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <img
                                src={qrImage}
                                alt="QR Code"
                                className="w-48 h-48 object-contain border rounded-md"
                            />
                            <div className="text-sm text-gray-600">
                                Code: <span className="font-mono font-bold">{uniqueCode}</span>
                            </div>
                            <div className="flex gap-3">
                                <a
                                    href={qrImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                >
                                    <MapPin size={16} />
                                    Preview QR
                                </a>
                                <a
                                    href={qrImage}
                                    download={`qr-${uniqueCode}.png`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                >
                                    <Download size={16} />
                                    Download QR
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
                        <h2 className="text-lg font-medium text-white">Basic Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Outlet <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="outlet_id"
                                value={formData.outlet_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Select Outlet</option>
                                {outlets.map((outlet) => (
                                    <option key={outlet.id} value={outlet.id}>
                                        {outlet.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Logo Image
                            </label>
                            {logoPreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="w-24 h-24 object-cover rounded-md border"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 w-fit">
                                    <Upload size={16} />
                                    <span className="text-sm">Upload Logo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
                        <h2 className="text-lg font-medium text-white">Delivery Address</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                                {isGeocoding && (
                                    <span className="text-blue-500 text-xs ml-2">
                                        (Searching location...)
                                    </span>
                                )}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Full delivery address"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={geocodeAddress}
                                    disabled={isGeocoding}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap text-sm"
                                >
                                    {isGeocoding ? (
                                        <Loader2 className="animate-spin" size={14} />
                                    ) : (
                                        <MapPin size={14} />
                                    )}
                                    Get Coordinates
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit / Room
                            </label>
                            <input
                                type="text"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="e.g. Room 302"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Note
                            </label>
                            <input
                                type="text"
                                name="address_note"
                                value={formData.address_note}
                                onChange={handleChange}
                                placeholder="Additional notes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Latitude
                            </label>
                            <input
                                type="text"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="e.g. 3.1390"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Longitude
                            </label>
                            <input
                                type="text"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="e.g. 101.6869"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Menu Items Section */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg">
                        <h2 className="text-lg font-medium text-white">Menu Items</h2>
                    </div>
                    <div className="p-6">
                        {!formData.outlet_id ? (
                            <p className="text-gray-500">
                                Please select an outlet first to configure menu items.
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-gray-600">
                                        {selectedMenuItems.length} item(s) selected
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowMenuPopup(true)}
                                        className="px-4 py-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 text-sm"
                                    >
                                        Select Menu Items
                                    </button>
                                </div>
                                {selectedMenuItems.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMenuItems.map((menuItemId) => {
                                            const item = allMenuItems.find((m) => Number(m.id) === Number(menuItemId));
                                            return item ? (
                                                <span
                                                    key={menuItemId}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-sm"
                                                >
                                                    {item.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMenuItem(menuItemId)}
                                                        className="hover:text-red-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate("/unique-qr")}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Update Unique QR
                    </button>
                </div>
            </form>

            {/* Menu Selection Modal */}
            {showMenuPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                            <h3 className="text-lg font-medium">Select Menu Items</h3>
                            <button onClick={() => setShowMenuPopup(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 border-b">
                            <input
                                type="text"
                                value={menuSearch}
                                onChange={(e) => setMenuSearch(e.target.value)}
                                placeholder="Search menu items..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={selectAllMenu}
                                    className="text-sm text-indigo-600 hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={deselectAllMenu}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredMenuItems.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    No menu items found.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {filteredMenuItems.map((item) => (
                                        <label
                                            key={item.id}
                                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                            onClick={() => toggleMenuItem(item.id)}
                                        >
                                            <div
                                                className={`w-5 h-5 rounded border flex items-center justify-center ${selectedMenuItems.includes(Number(item.id))
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-gray-300"
                                                    }`}
                                            >
                                                {selectedMenuItems.includes(Number(item.id)) && (
                                                    <Check size={14} />
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-700">{item.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowMenuPopup(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMenuPopup(false)}
                                className="px-4 py-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800"
                            >
                                Confirm ({selectedMenuItems.length} selected)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniqueQrEdit;
