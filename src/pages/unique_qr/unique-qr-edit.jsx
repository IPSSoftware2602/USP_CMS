import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X, Check, Download, MapPin, ChevronDown, ChevronRight } from "lucide-react";
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
    const [menuCategories, setMenuCategories] = useState([]);
    const [outletMenuItems, setOutletMenuItems] = useState([]);
    const [outletMenuDetail, setOutletMenuDetail] = useState([]);
    const [selectedMenuItems, setSelectedMenuItems] = useState([]);
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [existingLogo, setExistingLogo] = useState(null);
    const [qrImage, setQrImage] = useState(null);
    const [uniqueCode, setUniqueCode] = useState("");
    const [showMenuPopup, setShowMenuPopup] = useState(false);
    const [menuSearch, setMenuSearch] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [storeDiscounts, setStoreDiscounts] = useState([]);
    const [selectedStoreDiscountIds, setSelectedStoreDiscountIds] = useState([]);
    const [showDiscountPopup, setShowDiscountPopup] = useState(false);
    const [discountSearch, setDiscountSearch] = useState("");

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
            const [outletsRes, menuRes, categoriesRes, storeDiscountsRes, qrRes] = await Promise.all([
                UniqueQrService.getOutlets(user_id),
                UniqueQrService.getMenuItems(),
                UniqueQrService.getMenuCategories(),
                UniqueQrService.getStoreDiscounts(),
                UniqueQrService.getOne(id),
            ]);

            const outletsList = Array.isArray(outletsRes.result) ? outletsRes.result : [];
            const menuRaw = Array.isArray(menuRes.data) ? menuRes.data : (Array.isArray(menuRes.result) ? menuRes.result : []);
            const categoriesList = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
            const discountsList = Array.isArray(storeDiscountsRes.data) ? storeDiscountsRes.data : [];
            
            // Map 'title' to 'name' for consistency
            const menuList = menuRaw.map((m) => {
                const category = Array.isArray(m.category) ? m.category[0] : null;
                return { 
                    ...m, 
                    name: m.title || m.name,
                    category_id: category ? Number(category.id) : null
                };
            });
            setOutlets(outletsList);
            setAllMenuItems(menuList);
            setMenuCategories(categoriesList);
            setStoreDiscounts(discountsList);

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

                // Restore selected store discounts
                if (qr.store_discount_ids && Array.isArray(qr.store_discount_ids)) {
                    setSelectedStoreDiscountIds(qr.store_discount_ids.map(Number));
                }

                // Restore selected menu items
                let restoredItems = [];
                if (qr.menu_items && Array.isArray(qr.menu_items)) {
                    restoredItems = qr.menu_items.map((m) => ({
                        menu_item_id: Number(m.menu_item_id),
                        variation_id: m.variation_id ? Number(m.variation_id) : null
                    }));
                } else if (qr.menu_item_ids && Array.isArray(qr.menu_item_ids)) {
                    restoredItems = qr.menu_item_ids.map(id => ({
                        menu_item_id: Number(id),
                        variation_id: null
                    }));
                }

                setSelectedMenuItems(restoredItems);
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
            const detail = Array.isArray(response.outlet_menu_detail) ? response.outlet_menu_detail : [];
            
            setOutletMenuDetail(detail);

            if (detail.length > 0) {
                // Filter allMenuItems to only those present in detail
                const activeItemIds = detail.map(d => Number(d.menu_item_id));
                const filtered = allMenuItems
                    .filter((m) => m && activeItemIds.includes(Number(m.id)))
                    .map(m => {
                        // Also filter variations for this item
                        const itemDetail = detail.find(d => d && Number(d.menu_item_id) === Number(m.id));
                        if (itemDetail && Array.isArray(m.variation_group)) {
                            const activeVarIds = (itemDetail.variations || []).map(v => Number(v.variation_id));
                            return {
                                ...m,
                                variation_group: m.variation_group.filter(vg => vg && vg.variation && activeVarIds.includes(Number(vg.variation.id)))
                            };
                        }
                        return m;
                    });
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

    const toggleStoreDiscount = (id) => {
        const numId = Number(id);
        setSelectedStoreDiscountIds((prev) =>
            prev.map(Number).includes(numId) 
                ? prev.filter((x) => Number(x) !== numId) 
                : [...prev, numId]
        );
    };

    const toggleMenuItem = (menu_item_id, variation_id = null) => {
        const mId = Number(menu_item_id);
        const vId = variation_id ? Number(variation_id) : null;
        setSelectedMenuItems((prev) => {
            const exists = prev.find(
                (item) => Number(item.menu_item_id) === mId && 
                         (item.variation_id === null ? vId === null : Number(item.variation_id) === vId)
            );
            if (exists) {
                return prev.filter(
                    (item) => !(Number(item.menu_item_id) === mId && 
                               (item.variation_id === null ? vId === null : Number(item.variation_id) === vId))
                );
            } else {
                return [...prev, { menu_item_id: mId, variation_id: vId }];
            }
        });
    };

    const toggleItemWithVariations = (item) => {
        const itemId = Number(item.id);
        const hasVariations = item.variation_group && item.variation_group.length > 0;
        
        if (!hasVariations) {
            toggleMenuItem(itemId);
            return;
        }

        const variationIds = item.variation_group.map(vg => Number(vg.variation.id));
        const allVariationsSelected = variationIds.every(vId => 
            selectedMenuItems.some(sm => Number(sm.menu_item_id) === itemId && Number(sm.variation_id) === vId)
        );

        setSelectedMenuItems(prev => {
            if (allVariationsSelected) {
                // Deselect all variations for this item
                return prev.filter(sm => !(Number(sm.menu_item_id) === itemId && variationIds.includes(Number(sm.variation_id))));
            } else {
                // Select all variations for this item
                const otherItems = prev.filter(sm => !(Number(sm.menu_item_id) === itemId && variationIds.includes(Number(sm.variation_id))));
                const newItems = variationIds.map(vId => ({ menu_item_id: itemId, variation_id: vId }));
                return [...otherItems, ...newItems];
            }
        });
    };

    const toggleCategory = (catId) => {
        const itemsInCategory = filteredMenuItems.filter(m => Number(m.category_id) === Number(catId));
        if (itemsInCategory.length === 0) return;

        const allItemsInCatSelected = itemsInCategory.every(item => {
            const hasVariations = item.variation_group && item.variation_group.length > 0;
            if (hasVariations) {
                return item.variation_group.every(vg => 
                    selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && Number(sm.variation_id) === Number(vg.variation.id))
                );
            } else {
                return selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && sm.variation_id === null);
            }
        });

        setSelectedMenuItems(prev => {
            let newSelection = [...prev];
            if (allItemsInCatSelected) {
                // Deselect everything in this category
                itemsInCategory.forEach(item => {
                    newSelection = newSelection.filter(sm => Number(sm.menu_item_id) !== Number(item.id));
                });
            } else {
                // Select everything in this category
                itemsInCategory.forEach(item => {
                    const hasVariations = item.variation_group && item.variation_group.length > 0;
                    if (hasVariations) {
                        item.variation_group.forEach(vg => {
                            if (!newSelection.some(sm => Number(sm.menu_item_id) === Number(item.id) && Number(sm.variation_id) === Number(vg.variation.id))) {
                                newSelection.push({ menu_item_id: Number(item.id), variation_id: Number(vg.variation.id) });
                            }
                        });
                    } else {
                        if (!newSelection.some(sm => Number(sm.menu_item_id) === Number(item.id) && sm.variation_id === null)) {
                            newSelection.push({ menu_item_id: Number(item.id), variation_id: null });
                        }
                    }
                });
            }
            return newSelection;
        });
    };

    const toggleCategoryCollapse = (catId) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(catId)) {
                newSet.delete(catId);
            } else {
                newSet.add(catId);
            }
            return newSet;
        });
    };

    const selectAllMenu = () => {
        const itemsToSelect = [];
        filteredMenuItems.forEach((m) => {
            if (m.variation_group && m.variation_group.length > 0) {
                m.variation_group.forEach((v) => {
                    itemsToSelect.push({ menu_item_id: m.id, variation_id: v.variation.id });
                });
            } else {
                itemsToSelect.push({ menu_item_id: m.id, variation_id: null });
            }
        });

        setSelectedMenuItems((prev) => {
            const newSelection = [...prev];
            itemsToSelect.forEach((item) => {
                if (!newSelection.find(x => Number(x.menu_item_id) === Number(item.menu_item_id) && 
                                           (x.variation_id === null ? item.variation_id === null : Number(x.variation_id) === Number(item.variation_id)))) {
                    newSelection.push(item);
                }
            });
            return newSelection;
        });
    };

    const deselectAllMenu = () => {
        const filteredIds = filteredMenuItems.map((m) => Number(m.id));
        setSelectedMenuItems((prev) => prev.filter((x) => !filteredIds.includes(Number(x.menu_item_id))));
    };

    const filteredMenuItems = outletMenuItems.filter((m) =>
        m.name.toLowerCase().includes(menuSearch.toLowerCase())
    );

    const menuByCategory = menuCategories.map(cat => ({
        ...cat,
        items: filteredMenuItems.filter(m => Number(m.category_id) === Number(cat.id))
    })).filter(cat => cat.items.length > 0);

    // Also include items with no category or category not in menuCategories
    const orphanedItems = filteredMenuItems.filter(m => 
        !m.category_id || !menuCategories.some(cat => Number(cat.id) === Number(m.category_id))
    );

    if (orphanedItems.length > 0) {
        menuByCategory.push({
            id: 'others',
            title: 'Others',
            items: orphanedItems
        });
    }

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
            fd.append("store_discount_ids", JSON.stringify(selectedStoreDiscountIds));

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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Special Discounts (Auto-Applied)
                            </label>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-600">
                                        {selectedStoreDiscountIds.length} discount(s) selected
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowDiscountPopup(true)}
                                        className="px-4 py-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 text-sm"
                                    >
                                        Select Discounts
                                    </button>
                                </div>
                                {selectedStoreDiscountIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStoreDiscountIds.map(Number).map((id) => {
                                            const disc = storeDiscounts.find((d) => Number(d.id) === id);
                                            return disc ? (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm border border-green-200"
                                                >
                                                    {disc.discount_name} ({disc.discount_type === 'percentage' ? `${disc.discount_value}%` : `RM${disc.discount_value}`})
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStoreDiscount(id)}
                                                        className="hover:text-red-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
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
                                        {selectedMenuItems.map((selItem, index) => {
                                            const item = allMenuItems.find((m) => Number(m.id) === Number(selItem.menu_item_id));
                                            if (!item) return null;
                                            
                                            let displayName = item.name;
                                            if (selItem.variation_id) {
                                                const variation = item.variation_group?.find(vg => Number(vg.variation.id) === Number(selItem.variation_id));
                                                if (variation) {
                                                    displayName += ` (${variation.variation.title})`;
                                                }
                                            }

                                            return (
                                                <span
                                                    key={`${selItem.menu_item_id}-${selItem.variation_id}-${index}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-sm border border-indigo-100"
                                                >
                                                    {displayName}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMenuItem(selItem.menu_item_id, selItem.variation_id)}
                                                        className="hover:text-red-600 ml-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            );
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

            {/* Discount Selection Modal */}
            {showDiscountPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="bg-indigo-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white">Select Special Discounts</h3>
                            <button onClick={() => setShowDiscountPopup(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 border-b">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search discounts..."
                                    value={discountSearch}
                                    onChange={(e) => setDiscountSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                                <Loader2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 gap-2">
                                {storeDiscounts
                                    .filter(d => d.discount_name.toLowerCase().includes(discountSearch.toLowerCase()))
                                    .map((disc) => (
                                        <div
                                            key={disc.id}
                                            onClick={() => toggleStoreDiscount(disc.id)}
                                            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                                                selectedStoreDiscountIds.map(Number).includes(Number(disc.id))
                                                    ? "bg-indigo-50 border-indigo-200"
                                                    : "hover:bg-gray-50 border-gray-100"
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{disc.discount_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {disc.discount_type === 'percentage' ? `${disc.discount_value}% Discount` : `RM${disc.discount_value} Off`}
                                                </p>
                                            </div>
                                            {selectedStoreDiscountIds.map(Number).includes(Number(disc.id)) && (
                                                <Check className="text-indigo-600" size={20} />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowDiscountPopup(false)}
                                className="px-6 py-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            {menuByCategory.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    No menu items found.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {menuByCategory.map((category) => {
                                        const itemsInCategory = category.items;
                                        const isCategoryFullySelected = itemsInCategory.every(item => {
                                            const hasVariations = item.variation_group && item.variation_group.length > 0;
                                            if (hasVariations) {
                                                return item.variation_group.every(vg => 
                                                    selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && Number(sm.variation_id) === Number(vg.variation.id))
                                                );
                                            } else {
                                                return selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && sm.variation_id === null);
                                            }
                                        });

                                        const isCategoryPartiallySelected = !isCategoryFullySelected && itemsInCategory.some(item => {
                                            const hasVariations = item.variation_group && item.variation_group.length > 0;
                                            if (hasVariations) {
                                                return item.variation_group.some(vg => 
                                                    selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && Number(sm.variation_id) === Number(vg.variation.id))
                                                );
                                            } else {
                                                return selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && sm.variation_id === null);
                                            }
                                        });

                                        const isCollapsed = collapsedCategories.has(category.id);

                                        return (
                                            <div key={category.id} className="border rounded-lg overflow-hidden border-gray-200">
                                                <div 
                                                    className={`flex items-center gap-3 p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100`}
                                                    onClick={() => toggleCategoryCollapse(category.id)}
                                                >
                                                    <div 
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleCategory(category.id);
                                                        }}
                                                    >
                                                        <div
                                                            className={`w-5 h-5 rounded border flex items-center justify-center ${isCategoryFullySelected
                                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                                : isCategoryPartiallySelected ? "bg-indigo-400 border-indigo-400 text-white" : "border-gray-300"
                                                                }`}
                                                        >
                                                            {isCategoryFullySelected && <Check size={14} />}
                                                            {isCategoryPartiallySelected && <div className="w-2 h-0.5 bg-white"></div>}
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-indigo-900 flex-1">
                                                        {category.title}
                                                    </span>
                                                    {isCollapsed ? <ChevronRight size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                                </div>

                                                {!isCollapsed && (
                                                    <div className="p-2 space-y-1">
                                                        {category.items.map((item) => {
                                                        const hasVariations = item.variation_group && item.variation_group.length > 0;
                                                        
                                                        const isItemFullySelected = hasVariations 
                                                            ? item.variation_group.every(vg => selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && Number(sm.variation_id) === Number(vg.variation.id)))
                                                            : selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && sm.variation_id === null);

                                                        const isItemPartiallySelected = hasVariations && !isItemFullySelected && item.variation_group.some(vg => 
                                                            selectedMenuItems.some(sm => Number(sm.menu_item_id) === Number(item.id) && Number(sm.variation_id) === Number(vg.variation.id))
                                                        );

                                                        return (
                                                            <div key={item.id} className="border-b last:border-0 border-gray-100 py-1">
                                                                <div 
                                                                    className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer`}
                                                                    onClick={() => toggleItemWithVariations(item)}
                                                                >
                                                                    <div
                                                                        className={`w-5 h-5 rounded border flex items-center justify-center ${isItemFullySelected
                                                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                                                            : isItemPartiallySelected ? "bg-indigo-400 border-indigo-400 text-white" : "border-gray-300"
                                                                            }`}
                                                                    >
                                                                        {isItemFullySelected && <Check size={14} />}
                                                                        {isItemPartiallySelected && <div className="w-2 h-0.5 bg-white"></div>}
                                                                    </div>
                                                                    <span className={`text-sm ${hasVariations ? "font-semibold text-gray-800" : "text-gray-700"}`}>
                                                                        {item.name}
                                                                    </span>
                                                                </div>

                                                                {hasVariations && (
                                                                    <div className="ml-8 space-y-1 mt-1 pb-2">
                                                                        {item.variation_group.map((vg, vIndex) => {
                                                                            const isVarSelected = selectedMenuItems.some(
                                                                                x => Number(x.menu_item_id) === Number(item.id) && Number(x.variation_id) === Number(vg.variation.id)
                                                                            );
                                                                            return (
                                                                                <label
                                                                                    key={`${item.id}-var-${vg.variation.id}-${vIndex}`}
                                                                                    className="flex items-center gap-3 p-1 rounded hover:bg-indigo-50 cursor-pointer"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleMenuItem(item.id, vg.variation.id);
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        className={`w-4 h-4 rounded border flex items-center justify-center ${isVarSelected
                                                                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                                                                            : "border-gray-300"
                                                                                            }`}
                                                                                    >
                                                                                        {isVarSelected && <Check size={12} />}
                                                                                    </div>
                                                                                    <span className="text-xs text-gray-600">{vg.variation.title}</span>
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
