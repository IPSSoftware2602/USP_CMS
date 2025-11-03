import React, { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import OutletApiService from '../../store/api/outletService';
import ItemService from '../../store/api/itemService';
import CategoryService from '../../store/api/categoryService';
import { toast } from 'react-toastify';

const OutletMenuPage = () => {
  // State for action selection
  const [action, setAction] = useState('activate'); // 'activate' or 'deactivate'
  
  // State for outlets
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  
  // State for categories and menu items
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // UI and loading states
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const userData = localStorage.getItem('user');
  const user_id = JSON.parse(userData).user.user_id

  const getUncategorizedItems = () => {
  return menuItems.filter(item => {
    // Check all possible category fields to determine if item is uncategorized
    return !item.categoryId && 
          (!item.category || item.category.length === 0) &&
          (!item.categories || item.categories.length === 0);
  });
};

  const handleBulkAdd = async () => {
    if (selectedOutlets.length === 0 || selectedMenuItems.length === 0) {
        setError('Please select at least one outlet and one menu item');
        toast.error('Please select at least one outlet and one menu item');
        return;
    }

    try {
        setSubmitting(true);
        setError(null);
        
        // Call the bulk add API with the current action
        const response = await OutletApiService.addBulk(
            selectedOutlets,
            selectedMenuItems,
            action // pass the current action (activate/deactivate)
        );
        
        if (action === 'activate') {
            toast.success(`Successfully Added Menu Items to outlets!`);
        } else {
            toast.success(`Successfully removed ${response.deleted} menu items from outlets!`);
        }
        setSelectedOutlets([]);
        setSelectedMenuItems([]);
        
    } catch (err) {
        const errorMsg = err.message || 'Failed to update outlet menus. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('Error updating outlet menus:', err);
    } finally {
        setSubmitting(false);
    }
};

const handleBulkDelete = async () => {
    if (selectedOutlets.length === 0 || selectedMenuItems.length === 0) {
        setError('Please select at least one outlet and one menu item');
        toast.error('Please select at least one outlet and one menu item');
        return;
    }

    // Confirmation dialog
    const confirmDelete = window.confirm(
        `Are you sure you want to deactivate ${selectedMenuItems.length} menu item(s) from ${selectedOutlets.length} outlet?`
    );
    
    if (!confirmDelete) return;

    try {
        setSubmitting(true);
        setError(null);
        
        const response = await OutletApiService.deleteBulk(
            selectedOutlets,
            selectedMenuItems
        );
        
        toast.success('Successfully Deactivated Menu Items!');
        setSelectedOutlets([]);
        setSelectedMenuItems([]);
    } catch (err) {
        const errorMsg = err.message || 'Failed to delete menu items. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('Error deleting menu items:', err);
    } finally {
        setSubmitting(false);
    }
};

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch outlets
        const outletsResponse = await OutletApiService.getOutlets(user_id);
        const outletsData = Array.isArray(outletsResponse.result) 
          ? outletsResponse.result 
          : [];
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
          // Use the service transform if available
          if (ItemService.transformApiItemToComponent) {
            return ItemService.transformApiItemToComponent(item);
          }
          
          // Fallback transformation
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

      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error('Error fetching data:', err);
        setLoadingOutlets(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, []);

  // Helper functions for outlet selection
  const toggleOutletSelection = (outletId) => {
    setSelectedOutlets(prev =>
      prev.includes(outletId)
        ? prev.filter(id => id !== outletId)
        : [...prev, outletId]
    );
  };

  const toggleAllOutlets = () => {
    if (selectedOutlets.length === outlets.length) {
      setSelectedOutlets([]);
    } else {
      setSelectedOutlets(outlets.map(outlet => outlet.id));
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
    // Handle all possible category reference formats
    const itemCategoryId = item.categoryId || item.category_id;
    const itemCategories = item.categories || item.category || [];
    
    // Check direct ID match
    if (itemCategoryId == categoryId) return true;
    
    // Check array of categories
    if (Array.isArray(itemCategories)) {
      return itemCategories.some(cat => {
        const catId = cat?.id || cat;
        return catId == categoryId;
      });
    }
    
    // Check object category
    if (itemCategories?.id == categoryId) return true;
    
    return false;
  });
};

  const handleItemChange = (itemId, isChecked) => {
    const id = Number(itemId);
    setSelectedMenuItems(prev => 
      isChecked 
        ? [...prev, id] 
        : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleCategoryItemsChange = (categoryId, checked) => {
    const categoryItems = getItemsForCategory(categoryId);
    const categoryItemIds = categoryItems.map(item => Number(item.id));
    
    setSelectedMenuItems(prev => {
      if (checked) {
        // Add all category items that aren't already selected
        const newItems = [...prev];
        categoryItemIds.forEach(itemId => {
          if (!newItems.includes(itemId)) {
            newItems.push(itemId);
          }
        });
        return newItems;
      } else {
        // Remove all category items
        return prev.filter(id => !categoryItemIds.includes(id));
      }
    });
  };

  const areAllCategoryItemsSelected = (categoryId) => {
  const categoryItems = getItemsForCategory(categoryId);
  if (categoryItems.length === 0) return false;
  
  return categoryItems.every(item => 
    selectedMenuItems.includes(Number(item.id))
  );
};

  // Display helpers
  const getSelectedOutletsNames = () => {
    if (selectedOutlets.length === 0) return "No outlets selected";
    
    const selectedOutletNames = outlets
      .filter(outlet => selectedOutlets.includes(outlet.id))
      .slice(0, 3)
      .map(outlet => outlet.title || outlet.name || `Outlet #${outlet.id}`);
    
    return selectedOutlets.length > 3
      ? `${selectedOutletNames.join(', ')} and ${selectedOutlets.length - 3} more...`
      : selectedOutletNames.join(', ');
  };

  const getSelectedItemsNames = () => {
    if (selectedMenuItems.length === 0) return "No items selected";
    
    const selectedItemNames = menuItems
      .filter(item => selectedMenuItems.includes(Number(item.id)))
      .slice(0, 3)
      .map(item => item.name || item.title || `Item #${item.id}`);
    
    return selectedMenuItems.length > 3
      ? `${selectedItemNames.join(', ')} and ${selectedMenuItems.length - 3} more...`
      : selectedItemNames.join(', ');
  };
  

  return (
  <div className="max-w-6xl mx-auto bg-white shadow">
    {/* Header Section - Using indigo color scheme */}
    <div className="p-6" style={{ backgroundColor: '#312e81' }}>
      <p className="text-white">Update Outlet Menu Items Status</p>
    </div>

    <div className="p-6 space-y-8">
            {/* Action Selection Section */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Select Action</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setAction('activate')}
            className={`p-4 border flex items-center justify-center space-x-2 ${
              action === 'activate'
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Check className="h-5 w-5" />
            <span className="font-medium">Activate</span>
          </button>
          <button
            onClick={() => setAction('delete')}
            className={`p-4 border flex items-center justify-center space-x-2 ${
              action === 'delete'
                ? 'bg-red-50 border-red-500 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <X className="h-5 w-5" />
            <span className="font-medium">Deactivate</span>
          </button>
        </div>
      </div>

      {/* Outlet Selection Section */}
      <div className="bg-white border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Select Outlets</h2>
        
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
                {selectedOutlets.length > 0 
                  ? `${selectedOutlets.length} outlet(s) selected`
                  : 'No outlets selected'}
              </div>
              <button
                onClick={toggleAllOutlets}
                className="text-sm font-medium" 
                style={{ color: '#312e81' }}
              >
                {selectedOutlets.length === outlets.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
              {outlets.map(outlet => (
                <div 
                  key={outlet.id}
                  onClick={() => toggleOutletSelection(outlet.id)}
                  className={`p-2 border cursor-pointer transition-colors ${
                    selectedOutlets.includes(outlet.id)
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedOutlets.includes(outlet.id)}
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
              ))}
            </div>
          </>
        )}
      </div>

      {/* Menu Item Selection Section */}
      <div className="bg-white border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Select Menu Items</h2>
        
        {loadingCategories ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#312e81' }} />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No categories available</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {selectedMenuItems.length > 0 
                ? `${selectedMenuItems.length} item(s) selected`
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
                                checked={selectedMenuItems.includes(Number(item.id))}
                                onChange={(e) => handleItemChange(item.id, e.target.checked)}
                                className="h-4 w-4 mr-3" 
                                style={{ color: '#312e81' }}
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name || item.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Price: RM{item.price || 'N/A'}  | {(item.optionGroups?.length || 0)} Option Group{(item.optionGroups?.length || 0) !== 1 ? 's' : ''}
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

              {/* Inside the menu item selection section, after the categories map */}
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
                              checked={selectedMenuItems.includes(Number(item.id))}
                              onChange={(e) => handleItemChange(item.id, e.target.checked)}
                              className="h-4 w-4 mr-3" 
                              style={{ color: '#312e81' }}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name || item.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                Price: RM{item.price || 'N/A'}  | {(item.optionGroups?.length || 0)} Option Group{(item.optionGroups?.length || 0) !== 1 ? 's' : ''}
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

                  {/* Summary and Submit Section */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
              
              <div className="space-y-4">
                {/* Add this Action Description section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Action:</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {action === 'activate' && 'Activate selected menu items in outlets'}
                    {action === 'delete' && 'Deactivate selected menu items from outlets'}
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
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedOutlets([]);
                    setSelectedMenuItems([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => {
                    if (action === 'delete') {
                      handleBulkDelete();
                    } else {
                      handleBulkAdd();
                    }
                  }}
                  disabled={submitting || selectedOutlets.length === 0 || selectedMenuItems.length === 0}
                  className={`px-4 py-2 rounded-md text-white ${
                    submitting || selectedOutlets.length === 0 || selectedMenuItems.length === 0
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : action === 'delete' 
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Processing...
                    </div>
                  ) : (
                    action === 'delete' ? 'Deactivate Menu Items' : 
                    action === 'activate' ? 'Activate Menu Items' :''
                  )}
                </button>
              </div>
            </div>
        </div>
      </div>
);
};

export default OutletMenuPage;