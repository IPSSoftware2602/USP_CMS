import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, ChevronDown, ChevronRight, Loader2, Layers, List, Zap } from 'lucide-react';
import OutletApiService from '../../store/api/outletService';
import ItemService from '../../store/api/itemService';
import CategoryService from '../../store/api/categoryService';
import { toast } from 'react-toastify';

const OutletMenuControlPage = () => {
  const [action, setAction] = useState('activate'); // 'activate' or 'deactivate'

  // Outlets
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);

  // Categories and Menu Items
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Selection state
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [selectedOptionGroups, setSelectedOptionGroups] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Expanded states
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const userData = localStorage.getItem('user');
  const user_id = JSON.parse(userData).user.user_id;

  const getUncategorizedItems = () => {
    return menuItems.filter(item => {
      return !item.categoryId &&
        (!item.category || item.category.length === 0) &&
        (!item.categories || item.categories.length === 0);
    });
  };

  const handleBulkSubmit = async () => {
    if (selectedOutlets.length === 0 || (selectedVariations.length === 0 && selectedOptionGroups.length === 0 && selectedOptions.length === 0)) {
      toast.error('Please select at least one outlet and one item (variation/option group/option)');
      return;
    }

    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to deactivate these mappings from ${selectedOutlets.length} outlet(s)?`
      );
      if (!confirmDelete) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Map selected properties to the backend payload structure
      const menu_item_variations = [];
      const menu_item_options_groups = [];
      const variation_options_groups = [];
      const menu_item_options = [];
      const variation_options = [];

      selectedVariations.forEach(vKey => {
        const parts = vKey.split('-');
        menu_item_variations.push({ menu_item_id: Number(parts[1]), variation_id: Number(parts[2]) });
      });

      selectedOptionGroups.forEach(ogKey => {
        const parts = ogKey.split('-');
        if (parts[0] === 'mog') {
          menu_item_options_groups.push({
            menu_item_id: Number(parts[1]),
            option_group_id: Number(parts[2])
          });
        } else if (parts[0] === 'vog') {
          variation_options_groups.push({
            variation_id: Number(parts[2]),
            option_group_id: Number(parts[3])
          });
        }
      });

      selectedOptions.forEach(optKey => {
        const parts = optKey.split('-');
        if (parts[0] === 'mo') {
          menu_item_options.push({
            menu_item_id: Number(parts[1]),
            option_group_id: Number(parts[2]),
            option_id: Number(parts[3])
          });
        } else if (parts[0] === 'vo') {
          variation_options.push({
            variation_id: Number(parts[2]),
            option_group_id: Number(parts[3]),
            option_id: Number(parts[4])
          });
        }
      });

      const payload = {
        outlet_ids: selectedOutlets,
        action: action,
        menu_item_variations,
        menu_item_options_groups,
        menu_item_options,
        variation_options_groups,
        variation_options
      };

      let response;
      if (action === 'delete') {
        response = await OutletApiService.bulkDeleteVariationsAndOptions(payload);
      } else {
        response = await OutletApiService.bulkUpdateVariationsAndOptions(payload);
      }

      toast.success(response.message || 'Successfully updated variations and options!');
      setSelectedOutlets([]);
      setSelectedVariations([]);
      setSelectedOptionGroups([]);
      setSelectedOptions([]);

    } catch (err) {
      const errorMsg = err.message || 'Failed to update. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const outletsResponse = await OutletApiService.getOutlets(user_id);
        setOutlets(Array.isArray(outletsResponse.result) ? outletsResponse.result : []);
        setLoadingOutlets(false);

        const categoriesResponse = await CategoryService.getCategories();
        let categoriesData = [];
        if (Array.isArray(categoriesResponse)) categoriesData = categoriesResponse;
        else if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) categoriesData = categoriesResponse.data;
        else if (categoriesResponse.result && Array.isArray(categoriesResponse.result)) categoriesData = categoriesResponse.result;
        setCategories(categoriesData);

        const itemsResponse = await ItemService.getMenuItemsFullList();
        let itemsData = [];
        if (Array.isArray(itemsResponse)) itemsData = itemsResponse;
        else if (itemsResponse.data && Array.isArray(itemsResponse.data)) itemsData = itemsResponse.data;
        else if (itemsResponse.result && Array.isArray(itemsResponse.result)) itemsData = itemsResponse.result;

        const transformedItems = itemsData.map(item => {
          if (ItemService.transformApiItemToComponent) {
            return ItemService.transformApiItemToComponent(item);
          }

          return {
            ...item,
            id: item.id || item.itemId,
            name: item.name || item.title || `Item ${item.id}`,
            categoryId: item.categoryId || item.category_id ||
              (Array.isArray(item.categories) ? item.categories[0]?.id : item.categories?.id) ||
              (Array.isArray(item.category) ? item.category[0]?.id : item.category?.id) || null
          };
        });

        // Filter out items that have no variations and no option groups in the new structure
        const itemsWithDetails = transformedItems.filter(item =>
          (item.variation_group && item.variation_group.length > 0) ||
          (item.menu_option_group && item.menu_option_group.length > 0)
        );

        setMenuItems(itemsWithDetails);
        setLoadingCategories(false);

      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        setLoadingOutlets(false);
        setLoadingCategories(false);
      }
    };
    fetchData();
  }, [user_id]);

  const toggleOutletSelection = (outletId) => {
    setSelectedOutlets(prev => prev.includes(outletId) ? prev.filter(id => id !== outletId) : [...prev, outletId]);
  };

  const toggleAllOutlets = () => {
    setSelectedOutlets(selectedOutlets.length === outlets.length ? [] : outlets.map(o => o.id));
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getItemsForCategory = (categoryId) => {
    if (categoryId === 'uncategorized') return getUncategorizedItems();
    return menuItems.filter(item => {
      const itemCategoryId = item.categoryId || item.category_id;
      const itemCategories = item.categories || item.category || [];
      if (itemCategoryId == categoryId) return true;
      if (Array.isArray(itemCategories)) return itemCategories.some(cat => (cat?.id || cat) == categoryId);
      if (itemCategories?.id == categoryId) return true;
      return false;
    });
  };

  // Multiple toggle helper
  const toggleCheckboxArray = (setFunc, keys, isAdd) => {
    setFunc(prev => {
      const next = new Set(prev);
      if (isAdd) keys.forEach(k => next.add(k));
      else keys.forEach(k => next.delete(k));
      return Array.from(next);
    });
  };

  // Checkbox handlers
  const handleVariationToggle = (menuItemId, vg, isChecked) => {
    const vKey = `v-${menuItemId}-${vg.variation.id}`;
    setSelectedVariations(prev => isChecked ? [...prev, vKey] : prev.filter(k => k !== vKey));

    // Cascading selection
    const ogKeys = [];
    const optKeys = [];
    if (vg.option_groups) {
      vg.option_groups.forEach(og => {
        ogKeys.push(`vog-${menuItemId}-${vg.variation.id}-${og.id}`);
        if (og.options) {
          og.options.forEach(opt => optKeys.push(`vo-${menuItemId}-${vg.variation.id}-${og.id}-${opt.id}`));
        }
      });
    }
    toggleCheckboxArray(setSelectedOptionGroups, ogKeys, isChecked);
    toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
  };

  const handleVariationOptionGroupToggle = (menuItemId, variationId, og, isChecked) => {
    const ogId = typeof og === 'object' ? (og.id || og.option_group_id) : og;
    const ogKey = `vog-${menuItemId}-${variationId}-${ogId}`;

    setSelectedOptionGroups(prev => isChecked ? [...prev, ogKey] : prev.filter(k => k !== ogKey));

    const optKeys = [];
    if (og.options) {
      og.options.forEach(opt => optKeys.push(`vo-${menuItemId}-${variationId}-${ogId}-${opt.id}`));
    }
    toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
  };

  const handleVariationOptionToggle = (menuItemId, variationId, optionGroupId, optionId, isChecked) => {
    const optKey = `vo-${menuItemId}-${variationId}-${optionGroupId}-${optionId}`;

    setSelectedOptions(prev => isChecked ? [...prev, optKey] : prev.filter(k => k !== optKey));
  };

  const handleMenuOptionGroupToggle = (menuItemId, mog, isChecked) => {
    const mogKey = `mog-${menuItemId}-${mog.id}`;
    setSelectedOptionGroups(prev => isChecked ? [...prev, mogKey] : prev.filter(k => k !== mogKey));

    const optKeys = [];
    if (mog.options) {
      mog.options.forEach(opt => optKeys.push(`mo-${menuItemId}-${mog.id}-${opt.id}`));
    }
    toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
  };

  const handleMenuOptionToggle = (item_id, optionGroupId, optionId, isChecked) => {
    const optKey = `mo-${item_id}-${optionGroupId}-${optionId}`;

    setSelectedOptions(prev => isChecked ? [...prev, optKey] : prev.filter(k => k !== optKey));
  };

  const handleItemToggle = (item, isChecked) => {
    const vKeys = [];
    const ogKeys = [];
    const optKeys = [];

    // Variation Groups
    if (item.variation_group) {
      item.variation_group.forEach(vg => {
        vKeys.push(`v-${item.id}-${vg.variation.id}`);
        if (vg.option_groups) {
          vg.option_groups.forEach(og => {
            const ogId = typeof og === 'object' ? (og.id || og.option_group_id) : og;
            ogKeys.push(`vog-${item.id}-${vg.variation.id}-${ogId}`);
            if (og.options) {
              og.options.forEach(opt => optKeys.push(`vo-${item.id}-${vg.variation.id}-${ogId}-${opt.id}`));
            }
          });
        }
      });
    }

    // Menu Item Option Groups
    if (item.menu_option_group) {
      item.menu_option_group.forEach(mog => {
        ogKeys.push(`mog-${item.id}-${mog.id}`);
        if (mog.options) {
          mog.options.forEach(opt => optKeys.push(`mo-${item.id}-${mog.id}-${opt.id}`));
        }
      });
    }

    toggleCheckboxArray(setSelectedVariations, vKeys, isChecked);
    toggleCheckboxArray(setSelectedOptionGroups, ogKeys, isChecked);
    toggleCheckboxArray(setSelectedOptions, optKeys, isChecked);
  };

  // ──────────────── Cross-item bulk select ────────────────
  // Extracts all unique option groups and variations across ALL loaded items,
  // and provides one-click handlers to select/deselect an entire option group
  // or variation across every item that uses it.

  const uniqueOptionGroups = useMemo(() => {
    const map = new Map();
    menuItems.forEach(item => {
      // Item-level option groups
      (item.menu_option_group || []).forEach(mog => {
        const id = mog.id;
        if (!map.has(id)) {
          map.set(id, { id, title: mog.title || mog.name || `Option Group #${id}`, items: [] });
        }
        map.get(id).items.push({ type: 'mog', item });
      });
      // Variation-level option groups
      (item.variation_group || []).forEach(vg => {
        (vg.option_groups || []).forEach(vog => {
          const id = vog.id || vog.option_group_id;
          if (!map.has(id)) {
            map.set(id, { id, title: vog.title || vog.name || `Option Group #${id}`, items: [] });
          }
          map.get(id).items.push({ type: 'vog', item, variation: vg.variation });
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [menuItems]);

  const uniqueVariations = useMemo(() => {
    const map = new Map();
    menuItems.forEach(item => {
      (item.variation_group || []).forEach(vg => {
        const v = vg.variation;
        const key = `${item.id}-${v.id}`;
        if (!map.has(v.title)) {
          map.set(v.title, { title: v.title, entries: [] });
        }
        map.get(v.title).entries.push({ item, vg });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [menuItems]);

  const handleBulkOptionGroupSelect = (og, isChecked) => {
    og.items.forEach(({ type, item, variation }) => {
      if (type === 'mog') {
        const mogObj = (item.menu_option_group || []).find(m => m.id === og.id);
        if (mogObj) handleMenuOptionGroupToggle(item.id, mogObj, isChecked);
      } else if (type === 'vog') {
        const vg = (item.variation_group || []).find(vgItem => vgItem.variation.id === variation.id);
        const vogObj = vg?.option_groups?.find(v => (v.id || v.option_group_id) === og.id);
        if (vogObj) handleVariationOptionGroupToggle(item.id, variation.id, vogObj, isChecked);
      }
    });
  };

  const isBulkOptionGroupFullySelected = (og) => {
    return og.items.every(({ type, item, variation }) => {
      if (type === 'mog') return selectedOptionGroups.includes(`mog-${item.id}-${og.id}`);
      if (type === 'vog') return selectedOptionGroups.includes(`vog-${item.id}-${variation.id}-${og.id}`);
      return false;
    });
  };

  const handleBulkVariationSelect = (v, isChecked) => {
    v.entries.forEach(({ item, vg }) => {
      handleVariationToggle(item.id, vg, isChecked);
    });
  };

  const isBulkVariationFullySelected = (v) => {
    return v.entries.every(({ item, vg }) =>
      selectedVariations.includes(`v-${item.id}-${vg.variation.id}`)
    );
  };

  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [ogSearchQuery, setOgSearchQuery] = useState('');
  const [varSearchQuery, setVarSearchQuery] = useState('');

  const filteredOptionGroups = useMemo(() => {
    if (!ogSearchQuery.trim()) return uniqueOptionGroups;
    const q = ogSearchQuery.toLowerCase().trim();
    return uniqueOptionGroups.filter(og => og.title.toLowerCase().includes(q));
  }, [uniqueOptionGroups, ogSearchQuery]);

  const filteredVariations = useMemo(() => {
    if (!varSearchQuery.trim()) return uniqueVariations;
    const q = varSearchQuery.toLowerCase().trim();
    return uniqueVariations.filter(v => v.title.toLowerCase().includes(q));
  }, [uniqueVariations, varSearchQuery]);

  const handleSelectAllFilteredOptionGroups = (isChecked) => {
    filteredOptionGroups.forEach(og => handleBulkOptionGroupSelect(og, isChecked));
  };

  const handleSelectAllFilteredVariations = (isChecked) => {
    filteredVariations.forEach(v => handleBulkVariationSelect(v, isChecked));
  };

  const renderItemContents = (item) => (
    <div className="pl-12 pb-4 pr-4 space-y-4 bg-gray-50 pt-3 border-t border-b border-gray-100">

      {/* Menu Level Option Groups */}
      {item.menu_option_group && item.menu_option_group.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Item Option Groups</div>
          <div className="space-y-3">
            {item.menu_option_group.map(mog => {
              const mogKey = `mog-${item.id}-${mog.id}`;
              return (
                <div key={mogKey} className="bg-white border rounded p-3">
                  <label className="flex items-center cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={isOptionGroupFullySelected(mog, item.id, 'mog')}
                      onChange={(e) => handleMenuOptionGroupToggle(item.id, mog, e.target.checked)}
                      className="h-4 w-4 mr-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-bold text-gray-800">{mog.title || mog.name || `Option Group #${mog.id}`}</span>
                  </label>

                  {mog.options && mog.options.length > 0 && (
                    <div className="pl-7 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {mog.options.map(opt => {
                          const optKey = `mo-${item.id}-${mog.id}-${opt.id}`;
                          return (
                            <label key={optKey} className="flex items-center p-2 bg-gray-50 border rounded hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedOptions.includes(optKey)}
                                onChange={(e) => handleMenuOptionToggle(item.id, mog.id, opt.id, e.target.checked)}
                                className="h-3.5 w-3.5 mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="text-xs font-medium text-gray-600 truncate">{opt.title || opt.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Variations */}
      {item.variation_group && item.variation_group.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Variations</div>
          <div className="space-y-4">
            {item.variation_group.map(vg => {
              const vKey = `v-${item.id}-${vg.variation.id}`;
              const hasVarOg = vg.option_groups && vg.option_groups.length > 0;

              return (
                <div key={vKey} className="bg-white border rounded p-4 shadow-sm">
                  <label className="flex items-center cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={isVariationFullySelected(item.id, vg)}
                      onChange={(e) => handleVariationToggle(item.id, vg, e.target.checked)}
                      className="h-4 w-4 mr-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-bold text-gray-900">{vg.variation.title}</span>
                  </label>

                  {/* Variation Option Groups */}
                  {hasVarOg && (
                    <div className="pl-7 mt-2 border-t pt-3">
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        <List className="h-3 w-3 mr-1" /> Variation Option Groups
                      </div>
                      <div className="space-y-3">
                        {vg.option_groups.map(vog => {
                          const vogId = typeof vog === 'object' ? (vog.id || vog.option_group_id) : vog;
                          const vogTitle = typeof vog === 'object' ? (vog.title || vog.name || `Option Group #${vogId}`) : `Option Group #${vogId}`;
                          const vogKey = `vog-${item.id}-${vg.variation.id}-${vogId}`;

                          return (
                            <div key={vogKey} className="bg-gray-50 border border-gray-200 rounded p-3">
                              <label className="flex items-center hover:text-indigo-600 cursor-pointer transition-colors mb-2">
                                <input
                                  type="checkbox"
                                  checked={isOptionGroupFullySelected(vog, item.id, 'vog', vg.variation.id)}
                                  onChange={(e) => handleVariationOptionGroupToggle(item.id, vg.variation.id, vog, e.target.checked)}
                                  className="h-3.5 w-3.5 mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-xs font-bold text-gray-700">{vogTitle}</span>
                              </label>

                              {vog.options && vog.options.length > 0 && (
                                <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                  {vog.options.map(opt => {
                                    const optKey = `vo-${item.id}-${vg.variation.id}-${vogId}-${opt.id}`;
                                    return (
                                      <label key={optKey} className="flex items-center p-2 bg-white border border-gray-200 rounded hover:border-indigo-300 cursor-pointer transition-colors">
                                        <input
                                          type="checkbox"
                                          checked={selectedOptions.includes(optKey)}
                                          onChange={(e) => handleVariationOptionToggle(item.id, vg.variation.id, vogId, opt.id, e.target.checked)}
                                          className="h-3 w-3 mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs font-medium text-gray-600 truncate">{opt.title || opt.name}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const isOptionGroupFullySelected = (og, item_id, type = 'mog', variation_id = null) => {
    return selectedOptionGroups.includes(type === 'mog' ? `mog-${item_id}-${og.id}` : `vog-${item_id}-${variation_id}-${og.id || og.option_group_id}`);
  };

  const isVariationFullySelected = (item_id, vg) => {
    return selectedVariations.includes(`v-${item_id}-${vg.variation.id}`);
  };

  const isItemFullySelected = (item) => {
    let hasSomething = false;
    let allSelected = true;

    // Check item option groups
    if (item.menu_option_group && item.menu_option_group.length > 0) {
      hasSomething = true;
      if (!item.menu_option_group.every(mog => selectedOptionGroups.includes(`mog-${item.id}-${mog.id}`))) {
        allSelected = false;
      }
    }

    // Check variations
    if (item.variation_group && item.variation_group.length > 0) {
      hasSomething = true;
      if (!item.variation_group.every(vg => selectedVariations.includes(`v-${item.id}-${vg.variation.id}`))) {
        allSelected = false;
      }
    }

    return hasSomething && allSelected;
  };

  const getSelectedOutletsNames = () => {
    if (selectedOutlets.length === 0) return "No outlets selected";
    const selectedNames = outlets.filter(o => selectedOutlets.includes(o.id)).slice(0, 3).map(o => o.title || o.name);
    return selectedOutlets.length > 3 ? `${selectedNames.join(', ')} and ${selectedOutlets.length - 3} more...` : selectedNames.join(', ');
  };

  return (
    <div className="max-w-6xl mx-auto bg-white shadow">
      {/* Header */}
      <div className="p-6" style={{ backgroundColor: '#312e81' }}>
        <p className="text-white text-lg font-semibold">Update Outlet Variation & Option Group Status</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Action Selection */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Select Action</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setAction('activate')}
              className={`p-4 border flex items-center justify-center space-x-2 ${action === 'activate' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <Check className="h-5 w-5" />
              <span className="font-medium">Activate</span>
            </button>
            <button
              onClick={() => setAction('delete')}
              className={`p-4 border flex items-center justify-center space-x-2 ${action === 'delete' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <X className="h-5 w-5" />
              <span className="font-medium">Deactivate</span>
            </button>
          </div>
        </div>

        {/* Outlet Selection */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Select Outlets</h2>
          {loadingOutlets ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#312e81' }} /></div>
          ) : outlets.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No outlets available</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">{selectedOutlets.length > 0 ? `${selectedOutlets.length} outlet(s) selected` : 'No outlets selected'}</div>
                <button onClick={toggleAllOutlets} className="text-sm font-medium" style={{ color: '#312e81' }}>
                  {selectedOutlets.length === outlets.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
                {outlets.map(outlet => (
                  <div key={outlet.id} onClick={() => toggleOutletSelection(outlet.id)} className={`p-2 border cursor-pointer transition-colors ${selectedOutlets.includes(outlet.id) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center">
                      <input type="checkbox" checked={selectedOutlets.includes(outlet.id)} onChange={() => toggleOutletSelection(outlet.id)} className="h-3 w-3" style={{ color: '#312e81' }} onClick={(e) => e.stopPropagation()} />
                      <div className="truncate ml-2">
                        <p className="text-xs font-medium text-gray-900 truncate">{(outlet.title || outlet.name || '').replace(/uspizza|US Pizza|US PIZZA/gi, '').replace(/-/g, '').trim()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Variations Selection */}
        <div className="bg-white border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">3. Select Variations, Option Groups & Options</h2>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#312e81' }} /></div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No menu items with variations or option groups found.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-600">
                  {selectedVariations.length} Variation(s), {selectedOptionGroups.length} Option Group(s), {selectedOptions.length} Option(s) selected
                </div>
                <button
                  onClick={() => setShowQuickSelect(!showQuickSelect)}
                  className="flex items-center text-sm font-medium px-3 py-1.5 rounded border transition-colors"
                  style={{
                    color: showQuickSelect ? '#fff' : '#312e81',
                    backgroundColor: showQuickSelect ? '#312e81' : '#fff',
                    borderColor: '#312e81'
                  }}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Quick Select
                </button>
              </div>

              {/* Quick Select Panel — cross-item bulk selection by option group or variation */}
              {showQuickSelect && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-4">
                  <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                    Quick Select — pick an option group or variation to select it across ALL items
                  </div>

                  {/* Option Groups bulk with search */}
                  {uniqueOptionGroups.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-gray-600">Option Groups</div>
                        {filteredOptionGroups.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              {filteredOptionGroups.length}{ogSearchQuery ? ` of ${uniqueOptionGroups.length}` : ''} group{filteredOptionGroups.length !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={() => handleSelectAllFilteredOptionGroups(true)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-0.5 border border-indigo-300 rounded hover:bg-indigo-50 transition-colors"
                            >
                              Select All{ogSearchQuery ? ' Filtered' : ''}
                            </button>
                            <button
                              onClick={() => handleSelectAllFilteredOptionGroups(false)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              Deselect All{ogSearchQuery ? ' Filtered' : ''}
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Search option groups..."
                        value={ogSearchQuery}
                        onChange={(e) => setOgSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {filteredOptionGroups.length === 0 ? (
                        <div className="text-xs text-gray-400 py-2 text-center">No option groups match "{ogSearchQuery}"</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {filteredOptionGroups.map(og => {
                            const isFullySelected = isBulkOptionGroupFullySelected(og);
                            return (
                              <label
                                key={`bulk-og-${og.id}`}
                                className={`flex items-center p-2.5 border rounded cursor-pointer transition-colors ${
                                  isFullySelected
                                    ? 'bg-indigo-100 border-indigo-400'
                                    : 'bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  onChange={(e) => handleBulkOptionGroupSelect(og, e.target.checked)}
                                  className="h-3.5 w-3.5 mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <div>
                                  <span className="text-xs font-medium text-gray-800">{og.title}</span>
                                  <span className="text-xs text-gray-400 ml-1">({og.items.length} item{og.items.length !== 1 ? 's' : ''})</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variations bulk with search */}
                  {uniqueVariations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-gray-600">Variations</div>
                        {filteredVariations.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              {filteredVariations.length}{varSearchQuery ? ` of ${uniqueVariations.length}` : ''} variation{filteredVariations.length !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={() => handleSelectAllFilteredVariations(true)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-0.5 border border-indigo-300 rounded hover:bg-indigo-50 transition-colors"
                            >
                              Select All{varSearchQuery ? ' Filtered' : ''}
                            </button>
                            <button
                              onClick={() => handleSelectAllFilteredVariations(false)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              Deselect All{varSearchQuery ? ' Filtered' : ''}
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Search variations..."
                        value={varSearchQuery}
                        onChange={(e) => setVarSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {filteredVariations.length === 0 ? (
                        <div className="text-xs text-gray-400 py-2 text-center">No variations match "{varSearchQuery}"</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {uniqueVariations.filter(v => {
                            if (!varSearchQuery.trim()) return true;
                            return v.title.toLowerCase().includes(varSearchQuery.toLowerCase().trim());
                          }).map(v => {
                            const isFullySelected = isBulkVariationFullySelected(v);
                            return (
                              <label
                                key={`bulk-v-${v.title}`}
                                className={`flex items-center p-2.5 border rounded cursor-pointer transition-colors ${
                                  isFullySelected
                                    ? 'bg-indigo-100 border-indigo-400'
                                    : 'bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  onChange={(e) => handleBulkVariationSelect(v, e.target.checked)}
                                  className="h-3.5 w-3.5 mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <div>
                                  <span className="text-xs font-medium text-gray-800">{v.title}</span>
                                  <span className="text-xs text-gray-400 ml-1">({v.entries.length} item{v.entries.length !== 1 ? 's' : ''})</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-[500px] overflow-y-auto border p-0">
                {categories.map(category => {
                  const categoryItems = getItemsForCategory(category.id);
                  if (categoryItems.length === 0) return null;
                  const isExpanded = expandedCategories[category.id] || false;

                  return (
                    <div key={category.id} className="border-b last:border-b-0">
                      <div
                        className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleCategoryExpansion(category.id)}
                      >
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={categoryItems.length > 0 && categoryItems.every(item => isItemFullySelected(item))}
                            onChange={(e) => {
                              e.stopPropagation();
                              categoryItems.forEach(item => handleItemToggle(item, e.target.checked));
                            }}
                            className="h-4 w-4 mr-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium text-gray-900">{category.title} ({categoryItems.length} items)</span>
                        </div>
                        <div>{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                      </div>

                      {isExpanded && (
                        <div className="border-t divide-y">
                          {categoryItems.map(item => {
                            const isItemExpanded = expandedItems[item.id] || false;
                            const varsCount = item.variation_group?.length || 0;
                            const ogCount = item.menu_option_group?.length || 0;

                            return (
                              <div key={item.id}>
                                <div
                                  className="p-3 pl-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleItemExpansion(item.id)}
                                >
                                  <div className="flex items-center text-sm font-medium text-gray-800">
                                    <input
                                      type="checkbox"
                                      checked={isItemFullySelected(item)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleItemToggle(item, e.target.checked);
                                      }}
                                      className="h-4 w-4 mr-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <Layers className="h-4 w-4 mr-2 text-indigo-500" />
                                    {item.name}
                                    <span className="ml-2 text-xs text-gray-500 font-normal">({varsCount} Variations, {ogCount} Option Groups)</span>
                                  </div>
                                  <div>{isItemExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                                </div>

                                {isItemExpanded && renderItemContents(item)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Uncategorized Items */}
                {getUncategorizedItems().length > 0 && (
                  <div className="border-t">
                    <div
                      className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleCategoryExpansion('uncategorized')}
                    >
                      <span className="font-medium text-gray-900 flex-1">Other Items ({getUncategorizedItems().length} items)</span>
                      <div>{expandedCategories['uncategorized'] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                    </div>

                    {expandedCategories['uncategorized'] && (
                      <div className="border-t divide-y">
                        {getUncategorizedItems().map(item => (
                          <div key={item.id} className="bg-gray-50">
                            <div
                              className="p-3 pl-6 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleItemExpansion(item.id)}
                            >
                              <div className="flex items-center text-sm font-medium text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={isItemFullySelected(item)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleItemToggle(item, e.target.checked);
                                  }}
                                  className="h-4 w-4 mr-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <Layers className="h-4 w-4 mr-2 text-indigo-500" />
                                {item.name}
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                  ({item.variation_group?.length || 0} Variations, {item.menu_option_group?.length || 0} Option Groups)
                                </span>
                              </div>
                              <div>{expandedItems[item.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                            </div>

                            {expandedItems[item.id] && renderItemContents(item)}
                          </div>
                        ))}
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
            <div>
              <h3 className="text-sm font-medium text-gray-700">Action:</h3>
              <p className="mt-1 text-sm text-gray-900 font-bold">
                {action === 'activate' ? 'ACTIVATE' : 'DEACTIVATE'} mapped variations & options
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Selected Outlets:</h3>
              <p className="mt-1 text-sm text-gray-900">{getSelectedOutletsNames()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Selected Payload Items:</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedVariations.length} Variation(s)<br />
                {selectedOptionGroups.length} Option Group(s)<br />
                {selectedOptions.length} Option(s)
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedOutlets([]);
                setSelectedVariations([]);
                setSelectedOptionGroups([]);
                setSelectedOptions([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={handleBulkSubmit}
              disabled={submitting || selectedOutlets.length === 0 || (selectedVariations.length === 0 && selectedOptionGroups.length === 0 && selectedOptions.length === 0)}
              className={`px-4 py-2 rounded-md text-white ${submitting || selectedOutlets.length === 0 || (selectedVariations.length === 0 && selectedOptionGroups.length === 0 && selectedOptions.length === 0)
                ? 'bg-indigo-300 cursor-not-allowed'
                : action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
            >
              {submitting ? (
                <div className="flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" />Processing...</div>
              ) : (
                action === 'delete' ? 'Deactivate Mappings' : 'Activate Mappings'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OutletMenuControlPage;
