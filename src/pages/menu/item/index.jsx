import { useState, useEffect } from 'react';
import { Edit, Trash2, GripVertical, ChevronDown, RefreshCw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate, useLocation } from 'react-router-dom';
import DeleteConfirmationModal from '../../../components/ui/DeletePopUp';
import itemService from '../../../store/api/itemService';
import categoryService from '../../../store/api/categoryService';
import defaultPizza from '@/assets/images/icon/default_pizza.jpeg';
import UserService from '../../../store/api/userService';
import { use } from 'react';


export default function ItemManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [errors, setErrors] = useState({});
  const [quickItemData, setQuickItemData] = useState({
    name: '',
    price: '',
    category_id: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });

  const [categories, setCategories] = useState([]);

  const [allMenuItems, setAllMenuItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showAddQuickModal, setShowAddQuickModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [userPermissions, setUserPermissions] = useState({});
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserPermissions = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const userObj = JSON.parse(userStr);
      const userId = userObj?.user.user_id;
      if (!userId) return;

      const userDataRes = await UserService.getUser(userId);
      const userData = userDataRes?.data;
      if (!userData) return;

      // Check if user is admin
      if (userData.role && userData.role.toLowerCase() === 'admin') {
        setIsAdmin(true);
        setHasCreatePermission(true);
        setHasUpdatePermission(true);
        setHasDeletePermission(true);
        return;
      }

      // Parse and set permissions for non-admin users
      let permissions = {};
      if (userData.user_permissions) {
        try {
          permissions = JSON.parse(userData.user_permissions);
          setUserPermissions(permissions);

          // Corrected path for Menu Category permissions
          if (permissions.Menu &&
            permissions.Menu.subItems &&
            permissions.Menu.subItems.Item) {
            if (permissions.Menu.subItems.Item.create === true) {
              setHasCreatePermission(true);
            }
            if (permissions.Menu.subItems.Item.update === true) {
              setHasUpdatePermission(true);
            }
            if (permissions.Menu.subItems.Item.delete === true) {
              setHasDeletePermission(true);
            }
          }
        } catch (e) {
          console.error("Error parsing user permissions:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching user permissions:", err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadMenuItems();
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = allMenuItems
        .filter(item =>
          item.category && item.category.some(cat => cat.id === selectedCategoryId)
        )
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setMenuItems(filtered);
    } else {
      const uncategorizedItems = allMenuItems
        .filter(item => !item.category || item.category.length === 0)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setMenuItems(uncategorizedItems);
    }
  }, [selectedCategoryId, allMenuItems]);


  const DraggableCategory = ({
    category,
    index,
    handleEditCategory,
    handleDeleteCategory,
    isSelected,
    onSelectCategory
  }) => {
    return (
      <Draggable draggableId={`category-${category.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer mb-2 rounded-md bg-gray-50 ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
            onClick={() => onSelectCategory(category.id)}
            style={{
              ...provided.draggableProps.style,
              opacity: snapshot.isDragging ? 0.4 : 1
            }}
          >
            <div className="flex items-center">
              <div className="mr-5 cursor-move" {...provided.dragHandleProps}>
                <GripVertical className="text-gray-400" size={20} />
              </div>
              <div>
                <div className="font-medium">{category.name || category.title}</div>
                <div className="text-sm text-gray-500">{category.items} items</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {(isAdmin || hasUpdatePermission) && (
                <button
                  className="p-1 text-gray-500 hover:text-indigo-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(category.id);
                  }}
                >
                  <Edit size={18} />
                </button>
              )}
              {(isAdmin || hasDeletePermission) && (
                <button
                  className="p-1 text-gray-500 hover:text-red-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const DraggableMenuItem = ({
    item,
    index,
    handleEditItem,
    handleDeleteItem,
  }) => {
    return (
      <Draggable draggableId={`menu-item-${item.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="p-4 flex items-center justify-between hover:bg-gray-50 mb-2 rounded-md bg-gray-50"
            style={{
              ...provided.draggableProps.style,
              opacity: snapshot.isDragging ? 0.4 : 1
            }}
          >
            <div className="flex items-center">
              <div className="mr-2 cursor-move" {...provided.dragHandleProps}>
                <GripVertical className="text-gray-400" size={20} />
              </div>
              <img
                src={
                  item.image?.[0]?.image_url || defaultPizza
                }
                alt={item.name}
                className="w-16 h-16 object-cover mr-4 rounded-md"
              />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {(item.optionGroups?.length || 0)} Option Group{(item.optionGroups?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="font-medium">RM{item.price.toFixed(2)}</div>
              <div className="flex space-x-2">
                <button className="p-1 text-gray-500 hover:text-indigo-600 transition-all" onClick={() => handleEditItem(item.id)}>
                  <Edit size={18} />
                </button>
                <button className="p-1 text-gray-500 hover:text-red-600 transition-all" onClick={() => handleDeleteItem(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  // const filteredItems = useMemo(() => {
  //   if (selectedCategoryId === null) {
  //     return allMenuItems.filter(item => !item.category || item.category.length === 0);
  //   } else {
  //     return allMenuItems.filter(item => 
  //       item.category && item.category.some(cat => cat.id === selectedCategoryId)
  //     );
  //   }
  // }, [allMenuItems, selectedCategoryId]);

  const loadMenuItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itemService.getMenuItems();
      const transformedItems = response.data?.map(item => ({
        ...itemService.transformApiItemToComponent(item),
        order_index: item.order_index || 0
      })) || [];

      const sortedItems = transformedItems.sort((a, b) => {
        const aCategoryId = a.category?.[0]?.id || null;
        const bCategoryId = b.category?.[0]?.id || null;

        if (aCategoryId !== bCategoryId) {
          return (aCategoryId || 0) - (bCategoryId || 0);
        }

        return (a.order_index || 0) - (b.order_index || 0);
      });

      setAllMenuItems(sortedItems);
      updateCategoryItemCounts(sortedItems);
    } catch (err) {
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategories();
      const categoriesData = response.data || response.result || response || [];
      const normalizedCategories = categoriesData.map(category => ({
        ...category,
        name: category.name || category.title,
        title: category.title || category.name,
        items: 0,
        order_index: category.order_index ?? category.orderIndex ?? 0
      }));

      const sortedCategories = normalizedCategories.sort((a, b) =>
        (a.order_index || 0) - (b.order_index || 0)
      );

      setCategories(sortedCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryItemCounts = (items) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        items: items.filter(
          (item) =>
            item.category && item.category.some((cat) => cat.id === category.id)
        ).length,
      }))
    );
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategoryId) return null;
    const category = categories.find(c => c.id === selectedCategoryId);
    return category ? (category.name || category.title) : 'Unknown Category';
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (result.type === 'CATEGORIES') {
      const newCategories = Array.from(categories);
      const [removed] = newCategories.splice(source.index, 1);
      newCategories.splice(destination.index, 0, removed);

      const updatedCategories = newCategories.map((category, index) => ({
        ...category,
        order_index: index
      }));

      setCategories(updatedCategories);

      try {
        await saveCategoryOrder(updatedCategories);
      } catch (error) {
        console.error('Failed to save category order:', error);
        setError('Failed to save category order');
        loadCategories();
      }

    } else if (result.type === 'MENU_ITEMS') {
      const newMenuItems = Array.from(menuItems);
      const [removed] = newMenuItems.splice(source.index, 1);
      newMenuItems.splice(destination.index, 0, removed);

      const updatedMenuItems = newMenuItems.map((item, index) => ({
        ...item,
        order_index: index
      }));

      setMenuItems(updatedMenuItems);

      setAllMenuItems(prevItems =>
        prevItems.map(item => {
          const updatedItem = updatedMenuItems.find(updated => updated.id === item.id);
          return updatedItem || item;
        })
      );

      try {
        await saveMenuItemsOrder(updatedMenuItems);
      } catch (error) {
        console.error('Failed to save menu items order:', error);
        setError('Failed to save menu items order');
        loadMenuItems();
      }
    }
  };

  const saveCategoryOrder = async (categories) => {
    try {
      const orderData = {};
      categories.forEach((category, index) => {
        orderData[category.id] = index;
      });

      await categoryService.updateCategoriesOrder(orderData);
    } catch (error) {
      throw new Error(`Failed to update category order: ${error.message}`);
    }
  };

  const saveMenuItemsOrder = async (menuItems) => {
    try {
      const orderData = {};
      menuItems.forEach((item, index) => {
        orderData[item.id] = index;
      });

      await itemService.updateMenuItemsOrder(orderData);
    } catch (error) {
      throw new Error(`Failed to update menu items order: ${error.message}`);
    }
  };

  const handleAddCategory = () => {
    setCategoryForm({ name: '' });
    setCurrentCategory(null);
    setErrors({});
    setShowAddCategoryModal(true);
  };

  const handleAddQuickCategory = async () => {
    if (!quickCategoryName.trim()) {
      setQuickCategoryError('Category name is required');
      return;
    }
    setIsAddingQuickCategory(true);
    setQuickCategoryError('');
    try {
      const response = await categoryService.createQuickCategory(quickCategoryName.trim());
      const newCategory = {
        ...(response.data || response.result),
        name: quickCategoryName.trim(),
        title: quickCategoryName.trim()
      };

      setCategories(prev => [...prev, newCategory]);
      setQuickCategoryName('');
      setShowAddCategoryModal(false);
    } catch (err) {
      setQuickCategoryError(err.message || 'Failed to add category');
    } finally {
      setIsAddingQuickCategory(false);
    }
  };

  const handleAddQuickItem = () => {
    setQuickItemData({
      name: '',
      price: '',
      category_id: selectedCategoryId || null
    });
    setErrors({});
    setCurrentItem(null);
    setShowAddQuickModal(true);
  };

  useEffect(() => {
    if (location.state?.setShowAddQuickModal) {
      handleAddQuickItem();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  const handleAddItem = () => {
    navigate('/menu/item/add_item');
  };

  const handleSyncMenu = async () => {
    setIsSyncing(true);
    try {
      await itemService.syncMenu();
      alert('Menu synced successfully!');
      await loadMenuItems();
      await loadCategories();
    } catch (err) {
      console.error('Error syncing menu:', err);
      alert('Failed to sync menu: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    setCurrentCategory(category);
    setCategoryForm({ name: category.name || category.title });
    setShowAddCategoryModal(true);
  };

  const handleEditItem = (itemId) => {
    navigate(`/menu/item/edit_item/${itemId}`);
  };

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    setCurrentCategory(category);
    setDeleteType('category');
    setShowDeleteModal(true);
  };

  const handleDeleteItem = (itemId) => {
    const item = menuItems.find(item => item.id === itemId);
    setCurrentItem(item);
    setDeleteType('item');
    setShowDeleteModal(true);
  };

  const validateQuickItem = () => {
    const newErrors = {};

    if (!quickItemData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!quickItemData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(quickItemData.price)) || parseFloat(quickItemData.price) < 0) {
      newErrors.price = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuickItemChange = (field, value) => {
    setQuickItemData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleQuickItemSubmit = async () => {
    if (!validateQuickItem()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const apiData = {
        title: quickItemData.name.trim(),
        price: parseFloat(quickItemData.price),
        status: 'active',
        category_id: quickItemData.category_id || selectedCategoryId || null
      };

      const response = await itemService.createQuickMenuItem(apiData);

      setQuickItemData({ name: '', price: '' });
      setErrors({});

      closeAllModals();
      window.location.reload();

    } catch (error) {
      console.error('Error creating item:', error);

      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        setErrors({ name: 'An item with this name already exists' });
      } else {
        setErrors({ general: error.message || 'Failed to create item. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openQuickItemModal = () => {
    setQuickItemData({ name: '', price: '' });
    setErrors({});
    setShowAddQuickModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setErrors({ category: 'Please enter a category name' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (currentCategory) {
        const response = await categoryService.updateCategory(
          currentCategory.id,
          {
            title: categoryForm.name.trim(),
            description: currentCategory.description || '',
            status: currentCategory.status || 'active'
          }
        );

        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.id === currentCategory.id
              ? {
                ...cat,
                name: categoryForm.name.trim(),
                title: categoryForm.name.trim()
              }
              : cat
          )
        );
        setSelectedCategoryId(currentCategory.id);
      } else {
        const response = await categoryService.createCategory({
          title: categoryForm.name.trim(),
          description: '',
          status: 'active'
        });
        const newCategory = {
          id: response.id,
          name: categoryForm.name.trim(),
          title: categoryForm.name.trim(),
          items: 0
        };
        setCategories(prevCategories => [...prevCategories, newCategory]);
        setSelectedCategoryId(newCategory.id);
      }

      closeAllModals();
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ category: error.message || 'Failed to save category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAllModals = () => {
    setShowAddCategoryModal(false);
    setShowAddQuickModal(false);
    setShowDeleteModal(false);
    setCurrentItem(null);
    setCurrentCategory(null);
    setError(null);
    setErrors({});
    setQuickItemData({ name: '', price: '' });
    setCategoryForm({ name: '' });
  };

  const confirmDelete = async () => {
    if (deleteType === "category" && currentCategory) {
      setLoading(true);
      try {
        await categoryService.deleteCategory(currentCategory.id);

        setCategories((prevCategories) =>
          prevCategories.filter((cat) => cat.id !== currentCategory.id)
        );

        if (selectedCategoryId === currentCategory.id) {
          setSelectedCategoryId(null);
        }

        setAllMenuItems((prevItems) =>
          prevItems.filter((item) => item.categoryId !== currentCategory.id)
        );
      } catch (error) {
        console.error("Error deleting category:", error);
        setError(`Failed to delete category: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else if (deleteType === "item" && currentItem) {
      setLoading(true);
      try {
        await itemService.deleteMenuItem(currentItem.id);

        const updatedMenuItems = menuItems.filter(
          (item) => item.id !== currentItem.id
        );
        const updatedAllMenuItems = allMenuItems.filter(
          (item) => item.id !== currentItem.id
        );

        setMenuItems(updatedMenuItems);
        setAllMenuItems(updatedAllMenuItems);

        // Update the item counts for categories
        updateCategoryItemCounts(updatedAllMenuItems);
      } catch (err) {
        setError(`Failed to delete item: ${err.message}`);
        console.error("Error deleting item:", err);
      } finally {
        setLoading(false);
      }
    }
    closeAllModals();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-2">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {typeof error === 'string'
              ? error
              : Object.values(error).map((msg, idx) => (
                <div key={idx}>{msg}</div>
              ))
            }
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            Loading...
          </div>
        )}

        <div className="flex justify-end mb-6 gap-3">
          <button
            className="bg-emerald-700 text-white px-6 py-2.5 rounded-md flex items-center text-[14px] disabled:opacity-50 hover:bg-emerald-800 transition-colors"
            onClick={handleSyncMenu}
            disabled={loading || isSyncing}
          >
            <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Menu'}
          </button>
          {(isAdmin || hasCreatePermission) && (
            <button
              className="bg-indigo-900 text-white px-6 py-2.5 rounded-md flex items-center text-[14px] disabled:opacity-50"
              onClick={handleAddItem}
              disabled={loading}
            >
              <span className="mr-1">+</span> Add New Item
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/2 bg-white rounded-md border border-gray-200">
            <div className="bg-indigo-900 p-4 rounded-t-md">
              <h2 className="text-[16px] text-white text-center">Category</h2>
            </div>

            {/* Category List */}
            <Droppable droppableId="categories" type="CATEGORIES">
              {(provided) => (
                <div
                  className="p-4 max-h-80 overflow-y-scroll"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {categories.filter(Boolean).length === 0 ? (
                    <p className="text-center text-gray-500 mt-10 mb-10">No categories found</p>
                  ) : (
                    categories.filter(Boolean).map((category, index) => (
                      <DraggableCategory
                        key={category.id}
                        category={category}
                        index={index}
                        handleEditCategory={handleEditCategory}
                        handleDeleteCategory={handleDeleteCategory}
                        isSelected={selectedCategoryId === category.id}
                        onSelectCategory={handleSelectCategory}
                        sortIcon={<ChevronDown size={16} />}
                      />
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add Quick Category Button */}
            <div className="p-4 pt-2 mb-2 mt-3 flex justify-center">
              {(isAdmin || hasCreatePermission) && (
                <button
                  className="bg-indigo-900 text-white px-6 py-2 rounded-md flex items-center disabled:opacity-50"
                  onClick={() => setShowAddCategoryModal(true)}
                  disabled={loading}
                >
                  <span className="mr-1">+</span> Add Quick Category
                </button>
              )}
            </div>

            {/* Others Items Section */}
            <div className="p-4">
              <div
                className={`p-4 ml-2 mb-2 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 ${selectedCategoryId === null ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                  }`}
                onClick={() => setSelectedCategoryId(null)}
              >
                <div className="font-medium">Other's Items</div>
                <div className="text-sm text-gray-500">
                  {allMenuItems.filter(item => !item.category || item.category.length === 0).length} Items
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Items */}
          <div className="w-full lg:w-1/2 bg-white rounded-md border border-gray-200">
            <div className="bg-indigo-900 p-4 rounded-t-md">
              <h2 className="text-[16px] text-white text-center">
                {selectedCategoryId
                  ? `Items - ${getSelectedCategoryName()}`
                  : 'All Items'}
              </h2>
            </div>

            {/* Item List */}
            <Droppable droppableId="menu-items" type="MENU_ITEMS">
              {(provided) => (
                <div
                  className="p-4 max-h-[440px] overflow-y-scroll"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {menuItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      {loading ? 'Loading items...' : 'No items found. Add some items!'}
                    </div>
                  ) : (
                    menuItems.map((item, index) => (
                      <DraggableMenuItem
                        key={item.id}
                        item={item}
                        index={index}
                        handleEditItem={handleEditItem}
                        handleDeleteItem={handleDeleteItem}
                      />
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add Quick Item Button */}
            <div className="p-2 mt-3 flex justify-center">
              {(isAdmin || hasCreatePermission) && (
                <button
                  className="bg-indigo-900 text-white px-8 py-2 mb-5 rounded-md flex items-center disabled:opacity-50"
                  onClick={handleAddQuickItem}
                  disabled={loading}
                >
                  <span className="mr-1">+</span> Add Quick Item
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border shadow-xl rounded-md p-6 w-full max-w-md">
              <h2 className="text-lg font-medium text-center mb-4">
                {currentCategory ? 'Edit Category' : 'Add New Category'}
              </h2>

              {/* Add error display */}
              {errors.category && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  {errors.category}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ name: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="Enter category name"
                />
              </div>
              <div className="flex justify-center space-x-5">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={closeAllModals}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-indigo-900 text-white rounded-md transition-colors ${isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-indigo-800'
                    }`}
                  onClick={handleSaveCategory}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (currentCategory ? 'Update' : 'Add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Item Modal */}
        {showAddQuickModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border shadow-xl rounded-md p-6 w-full max-w-md">
              <h2 className="text-lg font-medium text-center mb-4">Add Quick Item</h2>

              {/* General error message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={quickItemData.name}
                  onChange={(e) => handleQuickItemChange('name', e.target.value)}
                  className={`w-full border rounded-md p-2 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  placeholder="Enter item name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}

                <label className="block text-sm font-medium mt-3 text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickItemData.price}
                  onChange={(e) => handleQuickItemChange('price', e.target.value)}
                  className={`w-full border rounded-md p-2 ${errors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div className="flex justify-center space-x-5">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={closeAllModals}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-indigo-900 text-white rounded-md transition-colors ${isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-indigo-800'
                    }`}
                  onClick={handleQuickItemSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeAllModals}
        onConfirm={confirmDelete}
      />
    </DragDropContext>
  );
}