import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import OutletApiService from '../../../store/api/outletService';
import ItemService from '../../../store/api/itemService';
import CategoryService from '../../../store/api/categoryService';
import { toast } from 'react-toastify';
import { VITE_API_BASE_URL } from '../../../constant/config';

const UpdateDiscount = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get discount ID from URL params
  
  // Form data state
  const [formData, setFormData] = useState({
    discount_name: '',
    discount_type: 'percentage',
    discount_value: '',
    outlet_list: [],
    menu_item_list: [],
    status: 'active',
    tier_id_list: '0'
  });

  // State for outlets
  const [outlets, setOutlets] = useState([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  
  // State for categories and menu items
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // UI and loading states
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(true);
  const userData = localStorage.getItem('user');
  const user_id = JSON.parse(userData).user.user_id;
  const [tierData, setTierData] = useState([]);
  const authToken = sessionStorage.getItem("token");

  // Get auth token helper
  const getAuthToken = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      const userObj = JSON.parse(userData);
      return userObj.token || userObj.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const getUncategorizedItems = () => {
    return menuItems.filter(item => {
      return !item.categoryId && 
            (!item.category || item.category.length === 0) &&
            (!item.categories || item.categories.length === 0);
    });
  };

  // Fetch discount data function
  const fetchDiscount = async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${VITE_API_BASE_URL}store-discount/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch discount data');
      }

      if (data.status === 'success' && data.data) {
        const discountData = data.data;
        
        // Parse outlet_list from comma-separated string to array of numbers
        let outletList = [];
        if (discountData.outlet_list) {
          outletList = discountData.outlet_list
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id));
        }
        console.log('Parsed outletList:', outletList);
        // Parse menu_item_list from comma-separated string to array of numbers
        let menuItemList = [];
        if (discountData.menu_item_list) {
          menuItemList = discountData.menu_item_list
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id));
          
          // Remove duplicates using Set
          menuItemList = [...new Set(menuItemList)];
        }

        setFormData({
          discount_name: discountData.discount_name || '',
          discount_type: discountData.discount_type || 'percentage',
          discount_value: discountData.discount_value || '',
          outlet_list: outletList,
          menu_item_list: menuItemList,
          status: discountData.status || 'active',
          tier_id_list: discountData.tier_id_list?.toString() || '0'
        });
        
        console.log('Loaded discount data:', {
          name: discountData.discount_name,
          type: discountData.discount_type,
          value: discountData.discount_value,
          outlets: outletList.length,
          menuItems: menuItemList.length,
          status: discountData.status
        });
        
        console.log('FormData outlet_list after setting:', outletList);
        console.log('FormData outlet_list types:', outletList.map(id => ({ id, type: typeof id })));
      } else {
        throw new Error('Invalid discount data received');
      }
      
      setLoadingDiscount(false);
    } catch (err) {
      console.error('Error fetching discount:', err);
      setError('Failed to fetch discount data. Please try again.');
      setLoadingDiscount(false);
    }
  };

  const fetchTierData = async () => {
    try {
      const response = await fetch(
        VITE_API_BASE_URL + "settings/membership-tiers",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const tierData = await response.json();
      setTierData(tierData.data);
    } catch (error) {
      console.error("Error fetching tier data:", error);
    }
  };

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch outlets first
        const outletsResponse = await OutletApiService.getOutlets(user_id);
        const outletsData = Array.isArray(outletsResponse.result) 
          ? outletsResponse.result 
          : [];
        console.log('Fetched outlets:', outletsData);
        console.log('Outlet IDs from API:', outletsData.map(outlet => ({ id: outlet.id, type: typeof outlet.id, name: outlet.title || outlet.name })));
        setOutlets(outletsData);
        setLoadingOutlets(false);

        // Fetch categories
        const categoriesResponse = await CategoryService.getCategories();
        let categoriesData = [];
        
        if (Array.isArray(categoriesResponse)) {
          categoriesData = categoriesResponse;
        } else if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        } else if (categoriesResponse.result && Array.isArray(categoriesResponse.result)) {
          categoriesData = categoriesResponse.result;
        }
        setCategories(categoriesData);

        // Fetch menu items
        const itemsResponse = await ItemService.getMenuItems();
        let itemsData = [];
        
        if (Array.isArray(itemsResponse)) {
          itemsData = itemsResponse;
        } else if (itemsResponse.data && Array.isArray(itemsResponse.data)) {
          itemsData = itemsResponse.data;
        } else if (itemsResponse.result && Array.isArray(itemsResponse.result)) {
          itemsData = itemsResponse.result;
        }
        
        const transformedItems = itemsData.map(item => {
          if (ItemService.transformApiItemToComponent) {
            return ItemService.transformApiItemToComponent(item);
          }
          
          return {
            ...item,
            id: item.id || item.itemId,
            name: item.name || item.title || `Item ${item.id}`,
            price: item.price || item.basePrice || 0,
            status: item.status || 'active',
            categoryId: item.categoryId || item.category_id || 
                       item.category?.id || (item.categories?.[0]?.id) || null
          };
        });
        
        setMenuItems(transformedItems);
        setLoadingCategories(false);

        // Fetch discount data last, after all other data is loaded
        await fetchDiscount();

      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error('Error fetching data:', err);
        setLoadingOutlets(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
    fetchTierData();
  }, [id]);

  // Helper functions for outlet selection
  const toggleOutletSelection = (outletId) => {
    // Ensure consistent type comparison (convert to number)
    const numericOutletId = parseInt(outletId);
    setFormData(prev => ({
      ...prev,
      outlet_list: prev.outlet_list.includes(numericOutletId)
        ? prev.outlet_list.filter(id => id !== numericOutletId)
        : [...prev.outlet_list, numericOutletId]
    }));
  };

  const toggleAllOutlets = () => {
    if (formData.outlet_list.length === outlets.length) {
      setFormData(prev => ({ ...prev, outlet_list: [] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        outlet_list: outlets.map(outlet => parseInt(outlet.id)) 
      }));
    }
  };

  // Helper functions for menu item selection
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getItemsForCategory = (categoryId) => {
    if (categoryId === 'uncategorized') {
      return getUncategorizedItems();
    }
    
    return menuItems.filter(item => {
      const itemCategoryId = item.categoryId || item.category_id;
      const itemCategories = item.categories || item.category || [];
      
      if (itemCategoryId == categoryId) return true;
      
      if (Array.isArray(itemCategories)) {
        return itemCategories.some(cat => {
          const catId = cat?.id || cat;
          return catId == categoryId;
        });
      }
      
      if (itemCategories?.id == categoryId) return true;
      
      return false;
    });
  };

  const handleItemChange = (itemId, isChecked) => {
    const id = Number(itemId);
    setFormData(prev => ({
      ...prev,
      menu_item_list: isChecked 
        ? [...prev.menu_item_list, id] 
        : prev.menu_item_list.filter(selectedId => selectedId !== id)
    }));
  };

  const handleCategoryItemsChange = (categoryId, checked) => {
    const categoryItems = getItemsForCategory(categoryId);
    const categoryItemIds = categoryItems.map(item => Number(item.id));
    
    setFormData(prev => {
      const newMenuItems = checked
        ? [...new Set([...prev.menu_item_list, ...categoryItemIds])]
        : prev.menu_item_list.filter(id => !categoryItemIds.includes(id));
      
      return { ...prev, menu_item_list: newMenuItems };
    });
  };

  const areAllCategoryItemsSelected = (categoryId) => {
    const categoryItems = getItemsForCategory(categoryId);
    if (categoryItems.length === 0) return false;
    
    return categoryItems.every(item => 
      formData.menu_item_list.includes(Number(item.id))
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.discount_name.trim()) {
      newErrors.discount_name = 'Discount name is required';
    }

    if (!formData.discount_value) {
      newErrors.discount_value = 'Discount value is required';
    } else if (formData.discount_type === 'percentage' && 
               (formData.discount_value < 0 || formData.discount_value > 100)) {
      newErrors.discount_value = 'Percentage must be between 0 and 100';
    }

    if (formData.outlet_list.length === 0) {
      newErrors.outlet_list = 'At least one outlet is required';
    }

    if (formData.menu_item_list.length === 0) {
      newErrors.menu_item_list = 'At least one menu item is required';
    }

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${VITE_API_BASE_URL}store-discount/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update discount');
      }

      if (data.status === 'success') {
        toast.success('Discount updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        
        navigate('/promo/discount');
      } else {
        throw new Error(data.message || 'Failed to update discount');
      }
    } catch (err) {
      console.error('Error updating discount:', err);
      toast.error(err.message || 'Failed to update discount', {
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

  // Display helpers
  const getSelectedOutletsNames = () => {
    if (formData.outlet_list.length === 0) return "No outlets selected";
    
    const selectedOutletNames = outlets
      .filter(outlet => formData.outlet_list.includes(parseInt(outlet.id)))
      .slice(0, 3)
      .map(outlet => outlet.title || outlet.name || `Outlet #${outlet.id}`);
    
    return formData.outlet_list.length > 3
      ? `${selectedOutletNames.join(', ')} and ${formData.outlet_list.length - 3} more...`
      : selectedOutletNames.join(', ');
  };

  const getSelectedItemsNames = () => {
    if (formData.menu_item_list.length === 0) return "No items selected";
    
    const selectedItemNames = menuItems
      .filter(item => formData.menu_item_list.includes(Number(item.id)))
      .slice(0, 3)
      .map(item => item.name || item.title || `Item #${item.id}`);
    
    return formData.menu_item_list.length > 3
      ? `${selectedItemNames.join(', ')} and ${formData.menu_item_list.length - 3} more...`
      : selectedItemNames.join(', ');
  };

  // Loading state while fetching discount data
  if (loadingDiscount) {
    return (
      <div className="max-w-6xl mx-auto bg-white shadow">
        <div className="p-6" style={{ backgroundColor: '#312e81' }}>
          <div className="flex justify-between items-center">
            <p className="text-white text-xl font-semibold">Update Discount</p>
            <button
              onClick={() => navigate('/promo/discount')}
              className="text-white hover:text-gray-200 flex items-center"
            >
              <X size={20} className="mr-1" />
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#312e81' }} />
          <span className="ml-2 text-gray-600">Loading discount data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white shadow">
      {/* Header Section - Using indigo color scheme */}
      <div className="p-6" style={{ backgroundColor: '#312e81' }}>
        <div className="flex justify-between items-center">
          <p className="text-white text-xl font-semibold">Update Discount</p>
          <button
            onClick={() => navigate('/promo/discount')}
            className="text-white hover:text-gray-200 flex items-center"
          >
            <X size={20} className="mr-1" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Discount Details Section */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Discount Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Name *
              </label>
              <input
                type="text"
                name="discount_name"
                value={formData.discount_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter discount name"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type *
              </label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value * {formData.discount_type === 'percentage' && '(0-100%)'}
              </label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={formData.discount_type === 'percentage' ? '0-100' : 'Enter amount'}
                min={formData.discount_type === 'percentage' ? 0 : undefined}
                max={formData.discount_type === 'percentage' ? 100 : undefined}
                step="0.01"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Outlet Selection Section */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Select Outlets *</h2>
          
          {loadingOutlets ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#312e81' }} />
            </div>
          ) : outlets.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No outlets available</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                  {formData.outlet_list.length > 0 
                    ? `${formData.outlet_list.length} outlet(s) selected`
                    : 'No outlets selected'}
                </div>
                <button
                  onClick={toggleAllOutlets}
                  className="text-sm font-medium" 
                  style={{ color: '#312e81' }}
                >
                  {formData.outlet_list.length === outlets.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
                {outlets.map(outlet => {
                  const outletId = parseInt(outlet.id);
                  const isSelected = formData.outlet_list.includes(outletId);
                  
                  return (
                    <div 
                      key={outlet.id}
                      onClick={() => toggleOutletSelection(outlet.id)}
                      className={`p-2 border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOutletSelection(outlet.id)}
                          className="h-3 w-3" 
                          style={{ color: '#312e81' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="truncate ml-2">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {outlet.title || outlet.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Menu Item Selection Section */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Select Menu Items *</h2>
          
          {loadingCategories ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#312e81' }} />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No categories available</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {formData.menu_item_list.length > 0 
                  ? `${formData.menu_item_list.length} item(s) selected`
                  : 'No items selected'}
              </div>
              
              <div className="max-h-96 overflow-y-auto border p-2">
                {categories.map((category) => {
                  const categoryItems = getItemsForCategory(category.id);
                  const isExpanded = expandedCategories[category.id] || false;

                  return (
                    <div key={category.id} className="border mb-3">
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
                            className="h-4 w-4 mr-3" 
                            style={{ color: '#312e81' }}
                            disabled={categoryItems.length === 0}
                          />
                          <span className="font-medium text-gray-900 flex-1">
                            {category.title} ({categoryItems.length} items)
                            {categoryItems.length === 0 && (
                              <span className="text-xs text-gray-500 ml-2">(No items in this category)</span>
                            )}
                          </span>
                        </div>
                        {categoryItems.length > 0 && (
                          <div>{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                        )}
                      </div>

                      {isExpanded && categoryItems.length > 0 && (
                        <div className="border-t">
                          <div className="p-3 space-y-2">
                            {categoryItems.map((item) => (
                              <label 
                                key={item.id} 
                                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.menu_item_list.includes(Number(item.id))}
                                  onChange={(e) => handleItemChange(item.id, e.target.checked)}
                                  className="h-4 w-4 mr-3" 
                                  style={{ color: '#312e81' }}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name || item.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Price: RM{item.price || 'N/A'}
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

                {/* Uncategorized Items */}
                {getUncategorizedItems().length > 0 && (
                  <div className="border mb-3">
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
                          className="h-4 w-4 mr-3" 
                          style={{ color: '#312e81' }}
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
                          {getUncategorizedItems().map((item) => (
                            <label 
                              key={item.id} 
                              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.menu_item_list.includes(Number(item.id))}
                                onChange={(e) => handleItemChange(item.id, e.target.checked)}
                                className="h-4 w-4 mr-3" 
                                style={{ color: '#312e81' }}
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name || item.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Price: RM{item.price || 'N/A'}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tier Selection Section */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">4. Select Tier</h2>
          
          {tierData.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Loading tiers...</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                {formData.tier_id_list == '0' 
                  ? 'All tiers selected'
                  : `${tierData.find(tier => tier.id == parseInt(formData.tier_id_list))?.name || 'Selected tier'}`
                }
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* "All" option */}
                <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tier"
                    value="0"
                    checked={formData.tier_id_list == '0'}
                    onChange={(e) => setFormData(prev => ({ ...prev, tier_id_list: e.target.value }))}
                    className="h-4 w-4 mr-3"
                    style={{ color: '#312e81' }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">All Tiers</div>
                    <div className="text-xs text-gray-500">Apply to all membership tiers</div>
                  </div>
                </label>

                {/* Tier options */}
                {tierData.map((tier) => (
                  <label key={tier.id} className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tier"
                      value={tier.id}
                      checked={formData.tier_id_list == tier.id.toString()}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier_id_list: e.target.value }))}
                      className="h-4 w-4 mr-3"
                      style={{ color: '#312e81' }}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tier.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary and Submit Section */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Discount Name:</h3>
              <p className="mt-1 text-sm text-gray-900">
                {formData.discount_name || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Discount Value:</h3>
              <p className="mt-1 text-sm text-gray-900">
                {formData.discount_value} {formData.discount_type === 'percentage' ? '%' : ''}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Status:</h3>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {formData.status}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Selected Outlets:</h3>
              <p className="mt-1 text-sm text-gray-900">
                {getSelectedOutletsNames()}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Selected Menu Items:</h3>
              <p className="mt-1 text-sm text-gray-900">
                {getSelectedItemsNames()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Selected Tier:</h3>
              <p className="mt-1 text-sm text-gray-900">
                {formData.tier_id_list == '0' 
                  ? 'All Tiers' 
                  : tierData.find(tier => tier.id == parseInt(formData.tier_id_list))?.name || 'Not specified'
                }
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => navigate('/promo/discount')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Updating...
                </div>
              ) : (
                <>
                  <Save size={18} className="inline mr-2" />
                  Update Discount
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateDiscount;