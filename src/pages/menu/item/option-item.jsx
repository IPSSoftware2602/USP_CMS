import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronUp, Upload, Trash2 } from 'lucide-react';
import optionGroupService from '../../../store/api/optionGroupService';
import EditOptionItemModal from './option-item-edit';

const AddOptionItemModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentOptionGroup, 
  setCurrentOptionGroup 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedOptionGroups, setSelectedOptionGroups] = useState([]); 
  const [createdItems, setCreatedItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [currentEditSource, setCurrentEditSource] = useState(null); 
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOptionItem, setNewOptionItem] = useState({
    title: '',
    price_adjustment: '',
    image: null,
    imagePreview: null
  });
  const [otherItems, setOtherItems] = useState([]);
  
  const [selectedCreateOptionGroups, setSelectedCreateOptionGroups] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [optionGroups, setOptionGroups] = useState([]);
  const [loadingOptionGroups, setLoadingOptionGroups] = useState(false);
  const [allOptionGroups, setAllOptionGroups] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedItems([...currentOptionGroup.options]);
      setSelectedOptionGroups([]);
      setShowCreateForm(false);
      setSelectedCreateOptionGroups([]);
      setShowCategoryDropdown(false);
      resetNewItemForm();
      
      const loadAndInitialize = async () => {
        try {
          setLoadingOptionGroups(true);
          setError(null);
          
          const response = await optionGroupService.getOptionGroupList();
          const optionGroupsData = response.data || [];
          
          const transformedGroups = optionGroupService.transformFromApiFormat(optionGroupsData);
          
          const allGroups = transformedGroups
            .filter(group => group.id !== currentOptionGroup?.id)
            .sort((a, b) => {
              const dateA = new Date(a.updated_at || a.updatedAt || 0);
              const dateB = new Date(b.updated_at || b.updatedAt || 0);
              return dateB - dateA;
            });
          
          setAllOptionGroups(allGroups);
          
          const filteredGroups = transformedGroups
            .filter(group => 
              group.id !== currentOptionGroup?.id && 
              group.options && 
              group.options.length > 0
            )
            .sort((a, b) => {
              const dateA = new Date(a.updated_at || a.updatedAt || 0);
              const dateB = new Date(b.updated_at || b.updatedAt || 0);
              return dateB - dateA;
            });
          
          setOptionGroups(filteredGroups);
          
          // Load created items from localStorage
          const savedItems = localStorage.getItem('createdOptionItems');
          if (savedItems) {
            setCreatedItems(JSON.parse(savedItems));
          }
          
          // setTimeout(() => {
          //   initializeSelectionsFromCurrentGroup(filteredGroups, savedItems ? JSON.parse(savedItems) : []);
          // }, 100);
          
        } catch (err) {
          setError('Failed to load option groups');
          console.error('Error loading option groups:', err);
        } finally {
          setLoadingOptionGroups(false);
        }
      };
      
      loadAndInitialize();
    }
  }, [isOpen, currentOptionGroup?.id]);

  const loadOptionGroups = async () => {
    try {
      setLoadingOptionGroups(true);
      setError(null);
      
      const response = await optionGroupService.getOptionGroupList();
      const optionGroupsData = response.data || [];

      const transformedGroups = optionGroupService.transformFromApiFormat(optionGroupsData);
      
      const allGroups = transformedGroups
        .filter(group => group.id !== currentOptionGroup?.id)
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || a.updatedAt || 0);
          const dateB = new Date(b.updated_at || b.updatedAt || 0);
          return dateB - dateA;
        });
      
      setAllOptionGroups(allGroups);
      
      const filteredGroups = transformedGroups
        .filter(group => 
          group.id !== currentOptionGroup?.id && 
          group.options && 
          group.options.length > 0
        )
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || a.updatedAt || 0);
          const dateB = new Date(b.updated_at || b.updatedAt || 0);
          return dateB - dateA;
        });
      
      setOptionGroups(filteredGroups);
      
      setTimeout(() => {
        initializeSelectionsFromCurrentGroup();
      }, 100);
      
    } catch (err) {
      setError('Failed to load option groups');
      console.error('Error loading option groups:', err);
    } finally {
      setLoadingOptionGroups(false);
    }
  };

  const resetNewItemForm = () => {
    if (newOptionItem.imagePreview) {
      URL.revokeObjectURL(newOptionItem.imagePreview);
    }
    setNewOptionItem({
      title: '',
      price_adjustment: '',
      image: null,
      imagePreview: null
    });
  };

  const handleDeleteItem = (itemId, index, source) => {
    if (source === 'created') {
      const updatedCreatedItems = createdItems.filter((_, i) => i !== index);
      setCreatedItems(updatedCreatedItems);
      localStorage.setItem('createdOptionItems', JSON.stringify(updatedCreatedItems));
      
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      
      setError(null);
    }
  };

  const handleItemSelection = (itemId, isSelected) => {
    console.log(itemId)
    console.log(selectedItems)
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleOptionGroupItemSelection = (optionGroupId, optionId, isSelected) => {
    const itemId = `${optionGroupId}_${optionId}`;
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleOptionGroupSelection = (optionGroupId, isSelected) => {
    if (isSelected) {
      setSelectedOptionGroups(prev => [...prev, optionGroupId]);
    } else {
      setSelectedOptionGroups(prev => prev.filter(id => id !== optionGroupId));
      const optionGroup = optionGroups.find(group => group.id === optionGroupId);
      if (optionGroup) {
        const itemIds = optionGroup.options.map(option => `${optionGroupId}_${option.id}`);
        setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
      }
    }
  };

  const handleSelectAllInOptionGroup = (optionGroupId, selectAll) => {
    const optionGroup = optionGroups.find(group => group.id === optionGroupId);
    if (!optionGroup) return;
    
    const itemIds = optionGroup.options.map(option => `${optionGroupId}_${option.id}`);
    
    if (selectAll) {
      setSelectedItems(prev => [...new Set([...prev, ...itemIds])]);
    } else {
      setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
    }
  };

  const toggleOptionGroup = (optionGroupId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [optionGroupId]: !prev[optionGroupId]
    }));
  };

  const handleOtherItemsToggle = () => {
    setExpandedCategories(prev => ({
      ...prev,
      'other': !prev['other']
    }));
  };

  const handleEditItem = (item, index, source) => {
  setCurrentEditItem(item);
  setCurrentEditIndex(index);
  setCurrentEditSource(source);
  setIsEditOpen(true);
};

  const handleSaveEditedItem = (updatedData) => {
    if (currentEditSource === 'created') {
      const updatedCreatedItems = [...createdItems];
      updatedCreatedItems[currentEditIndex] = {
        ...updatedCreatedItems[currentEditIndex],
        ...updatedData
      };

      setCreatedItems(updatedCreatedItems);
      localStorage.setItem('createdOptionItems', JSON.stringify(updatedCreatedItems));
    }
    
    setIsEditOpen(false);
    setCurrentEditItem(null);
    setCurrentEditIndex(null);
    setCurrentEditSource(null);
  };

  const handleSelectAllCreatedItems = (selectAll) => {
    const itemIds = createdItems.map(item => item.id);
    
    if (selectAll) {
      setSelectedItems(prev => [...new Set([...prev, ...itemIds])]);
    } else {
      setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setSelectedCreateOptionGroups([]);
    setShowCategoryDropdown(false);
    resetNewItemForm();
  };

  // const handleImageUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     if (!file.type.startsWith('image/')) {
  //       setError('Please select a valid image file');
  //       return;
  //     }
      
  //     if (file.size > 5 * 1024 * 1024) {
  //       setError('Image size should be less than 5MB');
  //       return;
  //     }

  //     setError(null);
  //     setNewOptionItem(prev => ({
  //       ...prev,
  //       image: file,
  //       imagePreview: URL.createObjectURL(file)
  //     }));
  //   }
  // };
  const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);
    
    // Convert image to base64 for storage
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewOptionItem(prev => ({
        ...prev,
        image: event.target.result, // Store as base64 string
        imagePreview: URL.createObjectURL(file)
      }));
    };
    reader.readAsDataURL(file);
  }
};

  const removeImage = () => {
    if (newOptionItem.imagePreview) {
      URL.revokeObjectURL(newOptionItem.imagePreview);
    }
    setNewOptionItem(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
  };

  const handleInputChange = (field, value) => {
    setNewOptionItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateOptionGroupToggle = (optionGroupId) => {
    setSelectedCreateOptionGroups(prev => {
      if (prev.includes(optionGroupId)) {
        return prev.filter(id => id !== optionGroupId);
      } else {
        return [...prev, optionGroupId];
      }
    });
  };

  const handleCreateSave = () => {
    if (!newOptionItem.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!newOptionItem.price_adjustment) {
      setError('Price adjustment is required');
      return;
    }

    const newItem = {
      id: `created_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newOptionItem.title.trim(),
      price_adjustment: newOptionItem.price_adjustment,
      image: newOptionItem.image,
      imagePreview: newOptionItem.imagePreview,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNewlyCreated: true,
      targetOptionGroups: selectedCreateOptionGroups
    };

    console.log('Creating new item:', newItem);

    const updatedCreatedItems = [...createdItems, newItem];
    setCreatedItems(updatedCreatedItems);
    console.log('Updated created items:', updatedCreatedItems);
    localStorage.setItem('createdOptionItems', JSON.stringify(updatedCreatedItems));
    
    setShowCreateForm(false);
    setSelectedCreateOptionGroups([]);
    setShowCategoryDropdown(false);
    resetNewItemForm();
    setError(null);
  };

  const handleSave = () => {
    const selectedItemObjects = [...selectedItems];
    const selectionIndexMap = new Map();

    selectedItems.forEach(itemId => {
      const createdItem = createdItems.find(item => item.id === itemId);
      console.log(createdItem)

      if (typeof itemId !== 'string') return; 

      if (createdItem) {
        const alreadyExists = currentOptionGroup?.options?.some(existing => 
          existing.id === createdItem.id
        );
        
        if (!alreadyExists) {
          selectedItemObjects.push({
            id: null,
            name: createdItem.title,
            title: createdItem.title,
            price: parseFloat(createdItem.price_adjustment),
            price_adjustment: parseFloat(createdItem.price_adjustment),
            image: createdItem.image,
            imagePreview: createdItem.imagePreview,
            isNewlyCreated: true,
            targetOptionGroups: createdItem.targetOptionGroups
          });
        }
        // console.log(9999)
        return;
      }

      // Check if it's from an option group
      if (itemId.includes('_')) {
        const [optionGroupId, optionId] = itemId.split('_');
        const optionGroup = optionGroups.find(group => group.id === optionGroupId);
        if (optionGroup) {
          const option = optionGroup.options.find(opt => opt.id === optionId);
          if (option) {
            // Check if this item is already cloned in the current option group
            const alreadyExists = currentOptionGroup?.options?.some(existing => 
              existing.sourceGroupId === optionGroupId && 
              existing.sourceOptionId === optionId
            );
            
            if (!alreadyExists) {
              // Create a key for tracking selection indices of duplicate names
              const optionName = option.name || option.title;
              const optionPrice = option.price || option.price_adjustment;
              // const selectionKey = `${optionGroupId}_${optionName}_${optionPrice}`;
              
              // Find all options with the same name and price in this group
              const sameNameOptions = optionGroup.options.filter(opt => {
                const nameMatch = (opt.name === optionName || opt.title === optionName);
                const priceMatch = (opt.price === optionPrice || opt.price_adjustment === optionPrice);
                return nameMatch && priceMatch;
              });
              
              // Find the index of this specific option among the same-name options
              const selectionIndex = sameNameOptions.findIndex(opt => opt.id === option.id);
              
              // Track how many of this name+price combination we've selected
              // const currentSelectionCount = selectionIndexMap.get(selectionKey) || 0;
              // selectionIndexMap.set(selectionKey, currentSelectionCount + 1);
              
              selectedItemObjects.push({
                id: optionId,
                name: optionName,
                title: optionName,
                price: optionPrice,
                price_adjustment: optionPrice,
                sourceOptionGroup: optionGroup.name,
                sourceGroupId: optionGroupId,
                sourceOptionId: optionId,
                originalSourceId: optionId,
                selectionIndex: selectionIndex,
                image: option.image,
                imagePreview: option.imagePreview
              });
            }
          }
        }
      }
    });

    // Handle selected entire option groups (similar updates)
    selectedOptionGroups.forEach(optionGroupId => {
      const optionGroup = optionGroups.find(group => group.id === optionGroupId);
      if (optionGroup && optionGroup.options) {
        optionGroup.options.forEach((option, index) => {
          const itemId = `${optionGroupId}_${option.id}`;
          if (!selectedItems.includes(itemId)) {
            const alreadyExists = currentOptionGroup?.options?.some(existing => 
              existing.sourceGroupId === optionGroupId && 
              existing.sourceOptionId === option.id
            );
            
            if (!alreadyExists) {
              const optionName = option.name || option.title;
              const optionPrice = option.price || option.price_adjustment;
              
              const sameNameOptions = optionGroup.options.filter(opt => {
                const nameMatch = (opt.name === optionName || opt.title === optionName);
                const priceMatch = (opt.price === optionPrice || opt.price_adjustment === optionPrice);
                return nameMatch && priceMatch;
              });
              
              const selectionIndex = sameNameOptions.findIndex(opt => opt.id === option.id);
              
              selectedItemObjects.push({
                id: option.id,
                name: optionName,
                title: optionName,
                price: optionPrice,
                price_adjustment: optionPrice,
                sourceOptionGroup: optionGroup.name,
                sourceGroupId: optionGroupId,
                sourceOptionId: option.id,
                originalSourceId: option.id,
                selectionIndex: selectionIndex,
                isCloned: true,
                fromGroupSelection: true,
                image: option.image,
                imagePreview: option.imagePreview
              });
            }
          }
        });
      }
    });

    onSave(selectedItemObjects);
  };

  const initializeSelectionsFromCurrentGroup = (loadedOptionGroups = optionGroups, loadedCreatedItems = createdItems) => {
    console.log('Initializing selections from current group:', currentOptionGroup);
    
    if (!currentOptionGroup?.options || !Array.isArray(currentOptionGroup.options)) {
      console.log('No options in current group');
      setSelectedItems([]);
      return;
    }
    
    const newSelectedItems = [];
    
    // Create a map to track how many times we've matched each name+price combination
    const matchCountMap = new Map();
    
    currentOptionGroup.options.forEach((option, index) => {
      console.log(`Processing option ${index}:`, option);
      
      if (option.isNewlyCreated) {
        // For newly created items, add their ID to selected items
        console.log('Found newly created item:', option.id);
        newSelectedItems.push(option.id);
      } else if (option.isCloned && option.sourceGroupId && option.sourceOptionId) {
        // For cloned items, find the original item using stored source information
        console.log('Found cloned item from group:', option.sourceGroupId);
        const sourceGroup = loadedOptionGroups.find(group => group.id === option.sourceGroupId);
        if (sourceGroup && sourceGroup.options) {
          const originalOption = sourceGroup.options.find(opt => opt.id === option.sourceOptionId);
          if (originalOption) {
            const itemId = `${sourceGroup.id}_${originalOption.id}`;
            console.log('Selecting cloned item:', itemId);
            newSelectedItems.push(itemId);
          }
        }
      } else {
        // For regular database items, try multiple matching strategies
        let found = false;
        
        // Check in created items by exact ID
        const createdItem = loadedCreatedItems.find(item => item.id === option.id);
        if (createdItem) {
          console.log('Found in created items:', createdItem.id);
          newSelectedItems.push(createdItem.id);
          found = true;
        }
        
        // Check in option groups by exact ID
        if (!found) {
          loadedOptionGroups.forEach(group => {
            if (!found && group.options) {
              const matchingOption = group.options.find(opt => opt.id === option.id);
              if (matchingOption) {
                const itemId = `${group.id}_${matchingOption.id}`;
                console.log('Found matching option by ID in group:', itemId);
                newSelectedItems.push(itemId);
                found = true;
              }
            }
          });
        }
        
        // If stored source information exists, use it
        if (!found && option.sourceGroupId && option.sourceOptionId) {
          const sourceGroup = loadedOptionGroups.find(group => group.id === option.sourceGroupId);
          if (sourceGroup) {
            const sourceOption = sourceGroup.options.find(opt => opt.id === option.sourceOptionId);
            if (sourceOption) {
              const itemId = `${sourceGroup.id}_${sourceOption.id}`;
              console.log('Found option by stored source info:', itemId);
              newSelectedItems.push(itemId);
              found = true;
            }
          }
        }
        
        // Match by name and price with proper handling of duplicates
        if (!found) {
          const optionName = option.name || option.title;
          const optionPrice = option.price || option.price_adjustment;
          const matchKey = `${optionName}_${optionPrice}`;
          
          // Get current count for this name+price combination
          const currentCount = matchCountMap.get(matchKey) || 0;
          
          loadedOptionGroups.forEach(group => {
            if (!found && group.options) {
              const matchingOptions = group.options.filter(opt => {
                const nameMatch = (opt.name === optionName || opt.title === optionName);
                const priceMatch = (opt.price === optionPrice || opt.price_adjustment === optionPrice);
                return nameMatch && priceMatch;
              });
              
              if (matchingOptions.length > 0) {
                let selectedOptionIndex = currentCount;
                
                if (option.selectionIndex !== undefined && matchingOptions[option.selectionIndex]) {
                  selectedOptionIndex = option.selectionIndex;
                }
                
                if (selectedOptionIndex >= matchingOptions.length) {
                  selectedOptionIndex = matchingOptions.length - 1;
                }
                
                const selectedOption = matchingOptions[selectedOptionIndex];
                const itemId = `${group.id}_${selectedOption.id}`;
                console.log(`Found option by name/price match (index ${selectedOptionIndex}) in group:`, itemId);
                newSelectedItems.push(itemId);
                found = true;
                
                matchCountMap.set(matchKey, currentCount + 1);
              }
            }
          });
        }
        
        if (!found) {
          console.log('Item not found in any group:', option);
        }
      }
    });
    
    // Remove duplicates
    const uniqueSelectedItems = [...new Set(newSelectedItems)];
    console.log('Final selected items:', uniqueSelectedItems);
    
    setSelectedItems(uniqueSelectedItems);
  };

  const filteredCreatedItems = createdItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOptionGroups = optionGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSelectedCountInCreatedItems = () => {
    return createdItems.filter(item => selectedItems.includes(item.id)).length;
  };

  const getSelectedCountInOptionGroup = (optionGroupId) => {
    const optionGroup = optionGroups.find(group => group.id === optionGroupId);
    if (!optionGroup) return 0;
    
    return optionGroup.options.filter(option => 
      selectedItems.includes(`${optionGroupId}_${option.id}`)
    ).length;
  };

  const getTotalSelectedCount = () => {
    let count = selectedItems.length;
    // console.log(selectedItems)
    selectedOptionGroups.forEach(optionGroupId => {
      const optionGroup = optionGroups.find(group => group.id === optionGroupId);
      if (optionGroup) {
        const groupItemCount = optionGroup.options.filter(option => {
          const itemId = `${optionGroupId}_${option.id}`;
          return !selectedItems.includes(itemId);
        }).length;
        count += groupItemCount;
      }
    });
    
    return count;
  };

  const getSelectedOptionGroupNames = () => {
    return selectedCreateOptionGroups
      .map(id => allOptionGroups.find(group => group.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Add Option Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
        <div className='flex justify-between items-end mb-6'>
          <div className='relative w-full mr-4'>
            <label className="block text-gray-600 mb-2">Search by item or variation</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <Search size={20} />
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={handleShowCreateForm}
              className="px-10 py-3 bg-indigo-900 text-white rounded-lg items-center text-[14px] whitespace-nowrap"
            >
              + Add new
            </button>
          </div>
        </div>

          {showCreateForm && (
            <div className="mb-6 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-indigo-800">Create New Option Item</h3>
                <button
                  onClick={handleCancelCreate}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newOptionItem.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter option item title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Price Adjustment (RM) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newOptionItem.price_adjustment}
                    onChange={(e) => handleInputChange('price_adjustment', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* <div> */}
                  {/* <label className="block text-gray-700 font-medium mb-2">
                    Category (Optional)
                  </label>
                  <div className="relative">
                    <div
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      <div className="flex justify-between items-center">
                        <span className={selectedCreateOptionGroups.length === 0 ? "text-gray-500" : "text-gray-900"}>
                          {selectedCreateOptionGroups.length === 0 
                            ? "Select categories" 
                            : getSelectedOptionGroupNames()
                          }
                        </span>
                        <ChevronDown size={20} className="text-gray-400" />
                      </div>
                    </div>
                    
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {allOptionGroups.map(group => (
                          <div
                            key={group.id}
                            className="flex items-center px-4 py-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCreateOptionGroups.includes(group.id)}
                              onChange={() => handleCreateOptionGroupToggle(group.id)}
                              className="mr-3 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-gray-900">{group.name}</span>
                          </div>
                        ))}
                        {allOptionGroups.length === 0 && (
                          <div className="px-4 py-2 text-gray-500 text-center">
                            No categories available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div> */}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Image (Optional)
                  </label>
                  {!newOptionItem.imagePreview ? (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-600 text-sm mb-1">Click to upload image</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={newOptionItem.imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelCreate}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Created Items Section */}
          {createdItems.length > 0 && (
            <div className="mb-6">
              <div className="bg-indigo-900 text-white py-3 px-4 mb-2 flex items-center justify-between">
                <span>CREATED ITEMS</span>
              </div>
              
              <div className="space-y-2">
                {filteredCreatedItems.map((item, index) => (
                  // console.log(item),
                  <div key={index} className="flex items-center p-3 bg-white rounded border hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                      className="mr-3 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    
                    {/* Image - Left side */}
                    <div className="w-8 h-8 mr-4 flex-shrink-0">
                      {(item.imagePreview || item.image) ? (
                        <img
                          src={item.image || item.imagePreview}
                          alt={item.title}
                          className="w-8 h-8 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <span className="font-medium">{item.title}</span>
                      <span className="ml-4 text-gray-600">+RM {item.price_adjustment}</span>
                    </div>

                    <button
                      onClick={() => handleEditItem(item, index, 'created')}
                      className="ml-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, index, 'created')}
                      className=" ml-3 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                  </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option Groups Section */}
          <div className="bg-indigo-900 text-white py-3 px-4 mb-2">
            <span>SELECT FROM USER-CREATED CATEGORIES</span>
          </div>

          {loadingOptionGroups ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredOptionGroups.length > 0 ? (
            <div className="space-y-4">
              {filteredOptionGroups.map(optionGroup => {
                const hasOptions = optionGroup.options && optionGroup.options.length > 0;
                const isOptionGroupSelected = selectedOptionGroups.includes(optionGroup.id);
                
                return (
                  <div key={optionGroup.id} className="border rounded-lg">
                    <div className="flex items-center justify-between p-3 bg-gray-50">
                      {/* Option Group Checkbox */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isOptionGroupSelected}
                          onChange={(e) => handleOptionGroupSelection(optionGroup.id, e.target.checked)}
                          className="mr-3 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span 
                          className="font-medium cursor-pointer hover:text-indigo-600"
                          onClick={() => hasOptions && toggleOptionGroup(optionGroup.id)}
                        >
                          {optionGroup.name} ({optionGroup.options?.length || 0} items)
                        </span>
                        {(getSelectedCountInOptionGroup(optionGroup.id) > 0 || isOptionGroupSelected) && (
                          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                            {isOptionGroupSelected ? 'All selected' : `${getSelectedCountInOptionGroup(optionGroup.id)} selected`}
                          </span>
                        )}
                      </div>
                      {hasOptions && (
                        <div className="flex items-center">
                          {expandedCategories[optionGroup.id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const allSelected = optionGroup.options.every(option => 
                                  selectedItems.includes(`${optionGroup.id}_${option.id}`)
                                );
                                handleSelectAllInOptionGroup(optionGroup.id, !allSelected);
                              }}
                              className="mr-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              {optionGroup.options.every(option => 
                                selectedItems.includes(`${optionGroup.id}_${option.id}`)
                              ) ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                          <button
                            onClick={() => hasOptions && toggleOptionGroup(optionGroup.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedCategories[optionGroup.id] ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {expandedCategories[optionGroup.id] && hasOptions && (
                      <div className="border-t max-h-60 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {optionGroup.options.map(option => (
                            <div key={option.id} className="flex items-center p-2 bg-white rounded border">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(`${optionGroup.id}_${option.id}`) || isOptionGroupSelected}
                                onChange={(e) => handleOptionGroupItemSelection(optionGroup.id, option.id, e.target.checked)}
                                disabled={isOptionGroupSelected}
                                className="mr-3 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
                              />
                              <div className="flex-1">
                                <span className="font-medium">{option.name || option.title}</span>
                                <span className="ml-4 text-gray-600">+RM {option.price || option.price_adjustment}</span>
                              </div>

                              {/* <button
                              onClick={() => handleEditItem(option, optionGroup.options.indexOf(option), 'optionGroup')}
                              className="ml-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              Edit
                            </button> */}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No option groups available.</p>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t rounded-b-lg bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Save ({getTotalSelectedCount()} items)
          </button>
        </div>
      </div>

      <EditOptionItemModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveEditedItem}
        itemData={currentEditItem}
        optionGroupData={currentOptionGroup} 
      />
    </div>
  );
};

export default AddOptionItemModal;