import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Edit2,
  Copy,
  Trash2,
  ChevronDown,
  Info,
  GripVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useNavigate } from 'react-router-dom';
import optionGroupService from "../../../store/api/optionGroupService";
import AddOptionItemModal from "./option-item";
import useSidebar from "../../../hooks/useSidebar";
import EditOptionItemModal from "./option-item-edit";
import useScrollLock from "../../../hooks/useScrollLock";
import CloseConfirmationModal from "../../../components/ui/CloseConfirmationModal";
// import { data } from 'autoprefixer';

// keyName = session storage key name to store the respective option group (item option group/ variation option group)
// previouslySelectedGroup = an array of previously selected option groups

const OptionGroupManager = ({
  onClose,
  onSave,
  initialGroup,
  isEdit = false,
  currentOption = null,
  keyName,
  selectedGroups = [],
  previouslySelectedGroup,
  reopen,
}) => {
  const [optionGroups, setOptionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(isEdit ? true : false);
  const [showOptionItemModal, setShowOptionItemModal] = useState(false);
  const [currentOptionGroup, setCurrentOptionGroup] = useState(
    currentOption ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  // const optionGroupsStatus = JSON.parse(sessionStorage.getItem(keyName)) || [];
  const optionGroupsStatus =
    selectedGroups.length > 0
      ? selectedGroups.map((g) => ({ ...g, isSelected: true }))
      : JSON.parse(sessionStorage.getItem(keyName)) || [];
  // const navigate = useNavigate();
  const [collapsed, isHamburger] = useSidebar();
  const [filteredOptionGroups, setFilteredOptionGroups] = useState([]);

  const [isEditOptionItemOpen, setIsEditOptionItemOpen] = useState(false);
  const [editOptionItemData, setEditOptionItemData] = useState(null);
  const [localSelectedGroups, setLocalSelectedGroups] = useState(previouslySelectedGroup);

  useEffect(() => {
    setLocalSelectedGroups(previouslySelectedGroup);
  }, [previouslySelectedGroup]);

  const isAnyModalOpen =
    showAddModal ||
    showOptionItemModal ||
    isEditOptionItemOpen ||
    showCloseConfirmation;

  useEffect(() => {
    if (selectedGroups && selectedGroups.length > 0) {
      const updated = optionGroups.map((group) => ({
        ...group,
        isSelected: selectedGroups.some((sg) => sg.id === group.id),
      }));
      setOptionGroups(updated);
    }
  }, [selectedGroups]);

  useScrollLock(isAnyModalOpen);

  const handleEditOptionItem = (option, index) => {
    setEditOptionItemData({
      ...option,
      index,
    });
    setIsEditOptionItemOpen(true);
  };

  useEffect(() => {
    // console.log('Initial group prop:', initialGroup);
    if (initialGroup) {
      handleEditInitialOptionGroup(initialGroup);
    } else {
      loadOptionGroups();
    }
  }, [initialGroup]);

  useEffect(() => {
    if (isEdit && currentOption) {
      setCurrentOptionGroup(currentOption);
      // console.log(showAddModal);
      console.log("Current Option:", currentOption);
      setShowAddModal(true);
    }
  }, [isEdit, currentOption]);

  const setIsSelectForPreviouslySelectedOptionGroup = (
    currentOptionGroupsStatus
  ) => {
    if (!Array.isArray(currentOptionGroupsStatus)) {
      console.error("Expected array, got:", currentOptionGroupsStatus);
      currentOptionGroupsStatus = [];
    }

    const previouslySelectedIds = (previouslySelectedGroup || []).map((g) =>
      parseInt(g.id, 10)
    );

    const updatedOptionGroups = currentOptionGroupsStatus.map((group) => {
      const normalizedId = parseInt(group.id, 10);
      return {
        ...group,
        // ✅ preserve existing state OR mark as selected if it was previously saved
        isSelected:
          group.isSelected || previouslySelectedIds.includes(normalizedId),
      };
    });

    setOptionGroups(updatedOptionGroups);
    sessionStorage.setItem(keyName, JSON.stringify(updatedOptionGroups));
  };

  const loadOptionGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log('=== loadOptionGroups Debug ===');
      const response = await optionGroupService.getOptionGroupList();
      // console.log('Raw API response:', response);

      const transformedData = optionGroupService.transformFromApiFormat(
        response.data || response
      );
      // console.log('Transformed data:', transformedData);

      transformedData.forEach((group, index) => {
        if (group.options && group.options.length > 0) {
          const optionIds = group.options
            .map((opt) => opt.id)
            .filter((id) => id);
          const uniqueIds = [...new Set(optionIds)];
          if (optionIds.length !== uniqueIds.length) {
            console.warn(
              `Group ${index} (${group.name}) has duplicate options:`,
              group.options
            );
          }
        }
      });

      let optionGroupsStorageList =
        JSON.parse(sessionStorage.getItem("optionGroupsStorageList")) || [];

      if (optionGroupsStatus.length <= 0) {
        optionGroupsStorageList.push(keyName);
        sessionStorage.setItem(
          "optionGroupsStorageList",
          JSON.stringify(optionGroupsStorageList)
        );
        sessionStorage.setItem(keyName, JSON.stringify(transformedData));
        setIsSelectForPreviouslySelectedOptionGroup(transformedData);
        // setOptionGroups(transformedData);
      } else {
        setIsSelectForPreviouslySelectedOptionGroup(optionGroupsStatus);
        // setOptionGroups(optionGroupsStatus);
      }
    } catch (err) {
      setError("Failed to load option groups. Please try again.");
      console.error("Error loading option groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // console.log('Option groups or search query changed:', optionGroups, searchQuery);
    const filtered = optionGroupService.filterOptionGroups(
      optionGroups,
      searchQuery
    );
    setFilteredOptionGroups(filtered);
  }, [optionGroups, searchQuery]);

  const checkForUnsavedItems = () => {
    try {
      const createdItems = localStorage.getItem("createdOptionItems");
      return createdItems && JSON.parse(createdItems).length > 0;
    } catch (error) {
      console.error("Error checking localStorage:", error);
      return false;
    }
  };

  const clearCreatedOptionItems = () => {
    try {
      localStorage.removeItem("createdOptionItems");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };

  function base64ToFile(base64String, filename = 'image.jpg') {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  const handleAddOptionGroup = () => {
    setShowAddModal(true);
    setCurrentOptionGroup({
      id: null,
      name: "",
      optionCount: 0,
      minSelection: 0,
      maxSelection: 1,
      associatedItems: 0,
      isOptional: true,
      options: [],
    });
  };

  const handleEditInitialOptionGroup = (group) => {
    setCurrentOptionGroup(group);
    setShowAddModal(true);
  };

  const handleEditOptionGroup = async (group) => {
  try {
    setError(null);
    console.log("=== handleEditOptionGroup Debug ===", group);

    if (group.id) {
      const fullGroup = await optionGroupService.getOptionGroup(group.id);
      const transformedGroup = optionGroupService.transformFromApiFormat(
        fullGroup.data || fullGroup
      );

      if (Array.isArray(transformedGroup.options)) {
        transformedGroup.optionCount = transformedGroup.options.length;

        // 🔥 Normalize images for preview
        transformedGroup.options = transformedGroup.options.map((opt) => {
          const displayImage =
            opt.displayImage ||
            opt.image ||
            opt.images ||
            opt.images_compressed ||
            opt.imagePreview ||
            null;

          return {
            ...opt,
            displayImage,
          };
        });
        transformedGroup.options.sort((a, b) => a.order_index - b.order_index);

      }
      setCurrentOptionGroup(transformedGroup);
    } else {
      setCurrentOptionGroup({ ...group });
    }

    setShowAddModal(true);
  } catch (err) {
    setError("Failed to load option group details.");
    console.error("Error loading option group:", err);
  }
};

  const handleSaveOptionGroup = async (group) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!group.name || !group.name.trim()) {
        setError("Option group name is required.");
        return;
      }

      // Dedupe & prepare options
      let processedOptions = (group.options || []).filter(
        (opt, idx, self) => idx === self.findIndex((o) => o.id === opt.id)
      );

       processedOptions = processedOptions.map(opt => {
      if (
        opt.image &&
        typeof opt.image === 'string' &&
        opt.image.startsWith('data:image/')
      ) {
        return {
          ...opt,
          images: base64ToFile(opt.image, `${opt.title || opt.name || 'image'}.jpg`)
        };
      }
      return opt;
    });

    const dataToSend = { ...group, options: processedOptions };


      // Create / update
      let response;
      if (group.id) {
        response = await optionGroupService.updateOptionGroupNew(
          group.id,
          dataToSend
        );
      } else {
        response = await optionGroupService.createOptionGroup(dataToSend);
      }
      console.log("API response after create/update:", response);

      // 👇 force sync count with the actual options array length
      const optionCount = processedOptions.length;

      // ✅ Build a SINGLE updated group to send to parent
      const updatedGroupForParent = {
        ...group,
        id:
          response?.data?.data?.group_id ??
          response?.data?.group_id ??
          response?.data?.id ??
          response?.id ??
          group.id,
        options: processedOptions.map((opt) => ({
          ...opt,
          price: opt.price ?? opt.price_adjustment ?? 0,
          price_adjustment: opt.price_adjustment ?? opt.price ?? 0,
          // Always persist both image and displayImage
          image: opt.image || opt.displayImage || opt.imagePreview || null,
          displayImage:
            opt.displayImage ||
            opt.imagePreview ||
            opt.image ||
            opt.images ||
            opt.images_compressed ||
            null,
            images:
            opt.images ||
            opt.image ||
            opt.imagePreview ||
            opt.displayImage ||
            null,
        })),
        optionCount,
        // normalize title/name so parent can display either
        title: group.title || group.name || "",
        name: group.name || group.title || "",
      };

      console.log("✅ Updated group count before passing:", optionCount);

      // (Optional) refresh the modal's own list so it stays in sync
      try {
        const updatedResponse = await optionGroupService.getOptionGroupList();
        const transformedData = optionGroupService.transformFromApiFormat(
          updatedResponse.data || updatedResponse
        );

        if (Array.isArray(transformedData)) {
          // PRESERVE THE isSelected STATE WHEN REFRESHING
          const updatedWithSelection = transformedData.map((newGroup) => {
            // Find if this group was previously selected
            const wasSelected =
              optionGroups.find((g) => g.id === newGroup.id)?.isSelected ||
              false;
            return {
              ...newGroup,
              isSelected: wasSelected,
            };
          });

          setOptionGroups(updatedWithSelection);
          setFilteredOptionGroups(
            optionGroupService.filterOptionGroups(
              updatedWithSelection,
              searchQuery
            )
          );
          sessionStorage.setItem(keyName, JSON.stringify(updatedWithSelection));
        }
      } catch (_) {}

      setShowAddModal(false);
      setCurrentOptionGroup(null);

    if (typeof onSave === "function") {

  // merge the freshly saved group back into optionGroups
  const mergedGroups = optionGroups.map(g =>
    g.id === updatedGroupForParent.id
      ? { ...updatedGroupForParent, isSelected: true }
      : g
  );

  // if this was a brand new group, add it
  const exists = mergedGroups.some(g => g.id === updatedGroupForParent.id);
  const finalGroups = exists
    ? mergedGroups
    : [...mergedGroups, { ...updatedGroupForParent, isSelected: true }];

  const allSelected = finalGroups.filter(g => g.isSelected);

  console.log("🔥 Modal returning to parent:", allSelected);

  console.log("Passing to parent:", allSelected.map(g => ({
    id: g.id,
    name: g.name,
    optionCount: g.optionCount
  })));

  onSave(allSelected);
}

onClose(true);

    } catch (err) {
      setError("Failed to save option group. Please try again.");
      console.error("Error saving option group:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteOptionGroup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this option group?")) {
      return;
    }

    try {
      setError(null);
      await optionGroupService.deleteOptionGroup(id);
      const updatedGroups = optionGroups.filter((group) => group.id !== id);
      // Update state
      setOptionGroups(updatedGroups);
      sessionStorage.setItem(keyName, JSON.stringify(updatedGroups));
      // Also update filtered groups immediately
      setFilteredOptionGroups(
        optionGroupService.filterOptionGroups(updatedGroups, searchQuery)
      );
    } catch (err) {
      setError("Failed to delete option group. Please try again.");
      console.error("Error deleting option group:", err);
    }
  };

  const handleDuplicateOptionGroup = async (group) => {
    try {
      setError(null);

      let fullGroup = group;
      if (group.id) {
        const fullGroupResponse = await optionGroupService.getOptionGroup(
          group.id
        );
        fullGroup = optionGroupService.transformFromApiFormat(
          fullGroupResponse.data || fullGroupResponse
        );
      }

      const duplicatedGroup = {
        ...fullGroup,
        id: null,
        name: `${fullGroup.name} (Copy)`,
        options: fullGroup.options
          ? fullGroup.options.map((option) => ({
              ...option,
              id: null,
              optionGroupItemId: null,
            }))
          : [],
      };

      const response = await optionGroupService.createOptionGroup(
        duplicatedGroup
      );

      console.log("API response after duplication:", response);

      // Get fresh data with the new group included
      const updatedResponse = await optionGroupService.getOptionGroupList();
      // console.log(updatedResponse.data);
      const transformedData = optionGroupService.transformFromApiFormat(
        updatedResponse.data || updatedResponse
      );

      // Preserve isSelected property from current state
      const mergedData = transformedData.map((newGroup) => {
        // Find this group in the current state (if it exists)
        const existingGroup = optionGroups.find((g) => g.id === newGroup.id);
        // If found, preserve its isSelected status, otherwise default to false
        return {
          ...newGroup,
          isSelected: existingGroup ? existingGroup.isSelected : false,
        };
      });

      // Update both states with the merged data
      setOptionGroups(mergedData);
      setFilteredOptionGroups(
        optionGroupService.filterOptionGroups(mergedData, searchQuery)
      );
      sessionStorage.setItem(keyName, JSON.stringify(mergedData));

      // await loadOptionGroups();
      // reopen(true);
    } catch (err) {
      setError("Failed to duplicate option group. Please try again.");
      console.error("Error duplicating option group:", err);
    }
  };

  const handleSelectOptionGroup = (id) => {
    if (!id) return;

    const newOptionGroupStatus = optionGroups.map((group) => ({
      ...group,
      isSelected: group.id === id ? !group.isSelected : group.isSelected,
    }));

    setOptionGroups(newOptionGroupStatus);

    sessionStorage.setItem(keyName, JSON.stringify(newOptionGroupStatus));
  };

  const handleOpenOptionItemModal = () => {
    setShowOptionItemModal(true);
  };
  

  const handleOptionItemSave = (selectedItemsData) => {
    // console.log('=== handleOptionItemSave Debug ===');
    console.log("selectedItemsData received:", selectedItemsData);
    // console.log('currentOptionGroup before update:', currentOptionGroup);

    if (currentOptionGroup) {
      const existingOptions = currentOptionGroup.options || [];

      // Filter out invalid items and ensure selectedItemsData is an array of proper objects
      const validSelectedItems = selectedItemsData.filter((item) => {
        // Check if item is a proper object with required properties
        return (
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          (item.id || item.name || item.title)
        );
      });

      console.log("Valid selected items after filtering:", validSelectedItems);

     const processedOptions = validSelectedItems.map((selectedItem, index) => {
      const itemId =
        selectedItem.id || `temp_${Date.now()}_${index}_${Math.random()}`;

      const existingItem = existingOptions.find(
        (existing) =>
          existing.id === selectedItem.id && selectedItem.id !== undefined
      );

      // Normalize image for preview
      const displayImage =
        selectedItem.displayImage ||
        selectedItem.image ||                  // base64 string or server URL
        selectedItem.images ||
        selectedItem.images_compressed ||
        selectedItem.imagePreview ||           // blob as last fallback
        null;

      if (existingItem && selectedItem.id) {
        console.log("Preserving existing item:", existingItem);
        return {
        ...existingItem,
        price: selectedItem.price || existingItem.price,
        price_adjustment:
          selectedItem.price_adjustment ||
          selectedItem.price ||
          existingItem.price_adjustment,
        optionGroupItemId: existingItem.optionGroupItemId,
        isExisting: true,
        displayImage,
        image: selectedItem.image || displayImage || null, 
      };
      } else {
        console.log("New item detected:", selectedItem);
        return {
          id: itemId,
          name: selectedItem.name || "Unnamed Item",
          title: selectedItem.title || selectedItem.name || "Unnamed Item",
          price: selectedItem.price || 0,
          price_adjustment:
            selectedItem.price_adjustment || selectedItem.price || 0,
          isExisting: false,
          displayImage,
          images:
            selectedItem.images ||
              selectedItem.image ||         // base64 or file
              selectedItem.imagePreview ||  // blob url
              displayImage ||                // fallback from earlier
              '',
        };
      }
    });

      console.log("Processed options:", processedOptions);

      setOptionGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === currentOptionGroup.id
            ? {
                ...g,
                options: processedOptions,
                optionCount: processedOptions.length,
              }
            : g
        )
      );

      setCurrentOptionGroup((prev) => ({
        ...prev,
        options: processedOptions,
        optionCount: processedOptions.length,
      }));

      // const updatedGroup = {
      //   ...currentOptionGroup,
      //   options: processedOptions,
      //   optionCount: processedOptions.length,
      // };

      // setCurrentOptionGroup(updatedGroup);
    }
    setShowOptionItemModal(false);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(optionGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOptionGroups(items);

    try {
      await optionGroupService.reorderOptionGroups(items);
    } catch (err) {
      console.error("Error updating order:", err);
      loadOptionGroups();
    }
  };

  const handleOptionItemDragEnd = async (result) => {
    if (!result.destination || !currentOptionGroup) return;

    const reordered = Array.from(currentOptionGroup.options);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const reorderedWithIndex = reordered.map((opt, idx) => ({
      ...opt,
      order_index: idx + 1,
    }));

    setCurrentOptionGroup({
      ...currentOptionGroup,
      options: reorderedWithIndex,
    });

    const orderMap = {};
    reorderedWithIndex.forEach((opt) => {
      if (opt.id) orderMap[opt.id] = opt.order_index;
    });

    try {
      await optionGroupService.updateOptionOrderIndex(orderMap);
      console.log("Option order index updated successfully!");
    } catch (err) {
      console.error("Failed to update option order index:", err);
    }
  };



const handleRemoveOptionItem = (index) => {
  if (!currentOptionGroup) return;

  // remove the option at this index
  const updatedOptions = currentOptionGroup.options.filter((_, i) => i !== index);

  const updatedGroup = {
    ...currentOptionGroup,
    options: updatedOptions,
    optionCount: updatedOptions.length, // 🔥 force sync here
  };

  console.log("Removed item, new count:", updatedOptions.length);

  // update the modal's current group
  setCurrentOptionGroup(updatedGroup);

  // also update main optionGroups list so it stays in sync
  setOptionGroups((prev) =>
    prev.map((g) =>
      g.id === updatedGroup.id
        ? { ...g, ...updatedGroup, isSelected: g.isSelected } // preserve isSelected
        : g
    )
  );
};



  const handleOptionItemPriceChange = (index, price) => {
    if (!currentOptionGroup) return;

    const updatedOptions = [...currentOptionGroup.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      price: parseFloat(price) || 0,
      price_adjustment: parseFloat(price) || 0,
    };

    setCurrentOptionGroup({
      ...currentOptionGroup,
      options: updatedOptions,
    });
  };

  const handleCloseAttempt = () => {
    const hasUnsavedItems = checkForUnsavedItems();
    if (hasUnsavedItems) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    clearCreatedOptionItems();
    setShowCloseConfirmation(false);
    onClose(true);
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleAddModalCloseAttempt = () => {
    const hasUnsavedItems = checkForUnsavedItems();
    if (hasUnsavedItems) {
      setShowCloseConfirmation(true);
    } else {
      setShowAddModal(false);
      setCurrentOptionGroup(null);
      // Only call onClose if we're in edit mode to close the entire modal
      if (isEdit) {
        onClose(true);
      }
    }
  };

  const handleConfirmAddModalClose = () => {
    clearCreatedOptionItems();
    setShowCloseConfirmation(false);
    setShowAddModal(false);
    setCurrentOptionGroup(null);
    // Always close the entire modal when confirming close
    onClose(true);
  };

  useEffect(() => {
    if (!Array.isArray(previouslySelectedGroup)) return;

    const previouslySelectedIds = previouslySelectedGroup.map((g) =>
      parseInt(g.id, 10)
    );

    setOptionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        isSelected: previouslySelectedIds.includes(parseInt(group.id, 10)),
      }))
    );
  }, [previouslySelectedGroup]);

  if (loading) {
    return (
      <div className="inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading option groups...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center
        z-[9999] transition-all duration-150
        ${
          !isHamburger
            ? collapsed
              ? "ltr:ml-[72px] rtl:mr-[72px]"
              : "ltr:ml-[248px] rtl:mr-[248px]"
            : ""
        }
      `}
    >
      <div className="bg-white rounded-lg w-full max-w-5xl p-6 relative overflow-y-auto max-h-[90vh] mx-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {!showAddModal && !showOptionItemModal && !isEdit && (
          <>
            <div className="flex justify-between items-center mb-6 mt-4">
              <h2 className="text-2xl font-bold">Option Group Manager</h2>
              <button
                onClick={handleCloseAttempt}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-between mb-4">
              <div className="relative w-full mr-4">
                <input
                  type="text"
                  placeholder="Search ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <Search size={20} />
                </div>
              </div>
              <button
                onClick={handleAddOptionGroup}
                className="px-10 bg-indigo-900 text-white rounded-lg flex items-center"
              >
                <span className="mr-1">+</span>
                <span className="text-[14px] whitespace-nowrap">
                  Add Option Group
                </span>
              </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="optionGroups">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                    style={{
                      height: "400px",
                      // minWidth: '420px',
                      overflowY: "auto",
                    }}
                  >
                    {filteredOptionGroups.map((group, index) => (
                      <Draggable
                        key={group.id || `temp-${index}`}
                        draggableId={
                          group.id ? group.id.toString() : `temp-${index}`
                        }
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center border border-gray-200 rounded-lg p-2"
                          >
                            {/* <input
                              type="checkbox"
                              checked={group.isSelected}
                              onChange={() => handleSelectOptionGroup(group.id)}
                              className="h-5 w-5 mr-6 ml-3 text-red-600"
                            /> */}
                            <input
                              type="checkbox"
                              checked={localSelectedGroups.some((g) => g.id === group.id)}
                              onChange={() => {
                                setLocalSelectedGroups((prev) =>
                                  prev.some((g) => g.id === group.id)
                                    ? prev.filter((g) => g.id !== group.id)
                                    : [...prev, group]
                                );
                              }}
                              className="h-5 w-5 mr-6 ml-3 text-red-600"
                            />

                            <div className="flex-grow">
                              <div className="font-medium">{group.name}</div>
                              <div className="text-sm text-gray-500">
                                {group.optionCount} Option |{" "}
                                {group.minSelection} Min, {group.maxSelection}{" "}
                                Max | {group.associatedItems} Associated Items
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditOptionGroup(group)}
                                className="p-2 text-gray-500 hover:text-gray-700"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDuplicateOptionGroup(group)
                                }
                                className="p-2 text-gray-500 hover:text-gray-700"
                              >
                                <Copy size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteOptionGroup(group.id)
                                }
                                className="p-2 text-gray-500 hover:text-gray-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex justify-end gap-x-4 mt-6">
              <button
                onClick={handleCloseAttempt}
                className="px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
              >
                Cancel
              </button>
              <button
                // onClick={() => onSave(optionGroups.filter((g) => g.isSelected))}
                onClick={() => onSave(localSelectedGroups)}
                className="px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800"
              >
                Select Option Groups
              </button>
            </div>
          </>
        )}

        {/* Add/Edit Option Group Modal */}
        {showAddModal && currentOptionGroup && (
          <div className="bg-white rounded-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {currentOptionGroup.id
                  ? "Edit Option Group Settings"
                  : "Add New Option Group"}
              </h2>
              <button
                onClick={handleAddModalCloseAttempt}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-gray-600 mb-2">
                Option Group Name (Required)
              </label>
              <input
                type="text"
                value={currentOptionGroup.name}
                onChange={(e) =>
                  setCurrentOptionGroup({
                    ...currentOptionGroup,
                    name: e.target.value,
                  })
                }
                placeholder="Choose Pizza Combination"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={currentOptionGroup.isOptional}
                  onChange={(e) =>
                    setCurrentOptionGroup({
                      ...currentOptionGroup,
                      isOptional: e.target.checked,
                    })
                  }
                  className="h-5 w-5 mr-3 text-red-600"
                />
                <span>This option group is optional</span>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Min and Max selection for this option group
                </p>
                <div className="flex space-x-4 items-center">
                  <div className="flex-1">
                    <label className="block text-gray-500 text-sm mb-1">
                      Min
                    </label>
                    <input
                      type="number"
                      value={currentOptionGroup.minSelection}
                      onChange={(e) =>
                        setCurrentOptionGroup({
                          ...currentOptionGroup,
                          minSelection: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                  </div>
                  <div className="self-end pb-2 text-gray-500">to</div>
                  <div className="flex-1">
                    <label className="block text-gray-500 text-sm mb-1">
                      Max
                    </label>
                    <input
                      type="number"
                      value={currentOptionGroup.maxSelection}
                      onChange={(e) =>
                        setCurrentOptionGroup({
                          ...currentOptionGroup,
                          maxSelection: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-600">
                  Option Items
                </h3>
                <button
                  onClick={handleOpenOptionItemModal}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 text-sm"
                >
                  + Add Option Item
                </button>
              </div>

              {currentOptionGroup.options &&
              currentOptionGroup.options.length > 0 ? (
                <DragDropContext
                  key={currentOptionGroup?.id || "option-group-context"}
                  onDragEnd={handleOptionItemDragEnd}
                >
                  <Droppable droppableId="optionItems">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                        style={{
                          maxHeight: "300px",
                          overflowY: "auto",  //scroll only here
                        }}
                      >
                        {currentOptionGroup.options.map((option, index) => (
                          <Draggable
                            key={`option-${option.id || index}`} 
                            draggableId={`option-${option.id || index}`} //string id
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center p-4 border border-gray-200 rounded-lg bg-white ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="mr-3 text-gray-400 hover:text-gray-600 cursor-grab"
                                >
                                  <GripVertical size={20} />
                                </div>

                                {/* Image Preview Section */}
                                <div className="w-12 h-12 mr-4 flex items-center justify-center bg-gray-100 rounded border">
                                  {option.displayImage ||
                                  option.imagePreview ||
                                  option.image ||
                                  option.images ||
                                  option.images_compressed ? (
                                    <img
                                      src={
                                        option.displayImage ||
                                        option.imagePreview ||
                                        option.image ||
                                        option.images ||
                                        option.images_compressed
                                      }
                                      alt={option.name || option.title}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  ) : (
                                    <div className="text-xs text-gray-400 text-center">
                                      No Image
                                    </div>
                                  )}
                                </div>

                                <div className="flex-grow">
                                  <div className="font-medium text-gray-900">
                                    {option.name || option.title || "Unnamed Item"}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center">
                                    <span className="mr-2 text-sm text-gray-500">Price</span>
                                    <input
                                      type="text"
                                      placeholder="Amount"
                                      value={option.price || option.price_adjustment || ""}
                                      onChange={(e) =>
                                        handleOptionItemPriceChange(index, e.target.value)
                                      }
                                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleEditOptionItem(option, index)}
                                    className="p-2 text-indigo-500 hover:text-indigo-700"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveOptionItem(index)}
                                    className="p-2 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center p-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  No option items added yet. Click "Add Option Item" to get
                  started.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-x-4">
              <button
                onClick={handleAddModalCloseAttempt}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveOptionGroup(currentOptionGroup)}
                disabled={
                  isSubmitting || !(currentOptionGroup.name || "").trim()
                }
                className="px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Saving..."
                  : currentOptionGroup.id
                  ? "Update Option Group"
                  : "Add Option Group"}
              </button>
            </div>
          </div>
        )}

        {showOptionItemModal && (
          <AddOptionItemModal
            isOpen={showOptionItemModal}
            onClose={() => setShowOptionItemModal(false)}
            onSave={handleOptionItemSave}
            currentOptionGroup={currentOptionGroup}
            setCurrentOptionGroup={setCurrentOptionGroup}
          />
        )}

        {isEditOptionItemOpen && (
  <EditOptionItemModal
    isOpen={isEditOptionItemOpen}
    onClose={() => setIsEditOptionItemOpen(false)}
    onSave={(updatedItem) => {
  const updatedOptions = [...currentOptionGroup.options];

  // 🔥 Always generate a fresh blob URL if File
  const imageToDisplay =
    (updatedItem.image instanceof File
      ? URL.createObjectURL(updatedItem.image)
      : null) ||
    (updatedItem.displayImage instanceof File
      ? URL.createObjectURL(updatedItem.displayImage)
      : updatedItem.displayImage) ||
    updatedItem.imagePreview ||
    (updatedItem.images instanceof File
      ? URL.createObjectURL(updatedItem.images)
      : updatedItem.images) ||
    updatedItem.images_compressed ||
    null;

  // ✅ Replace the item immutably
  updatedOptions[editOptionItemData.index] = {
    ...updatedOptions[editOptionItemData.index],
    ...updatedItem,
    name: updatedItem.title || updatedItem.name,
    title: updatedItem.title || updatedItem.name,
    displayImage: imageToDisplay,   // ✅ always a string
    imagePreview: imageToDisplay,   // ✅ for consistency
  };

  const updatedGroup = {
    ...currentOptionGroup,
    options: [...updatedOptions], // ✅ clone to trigger re-render
    optionCount: updatedOptions.length,
  };

  // Update local state
  setCurrentOptionGroup(updatedGroup);

  // Also update the main optionGroups state
  setOptionGroups((prevGroups) =>
    prevGroups.map((g) =>
      g.id === currentOptionGroup.id
        ? { ...updatedGroup, isSelected: g.isSelected }
        : g
    )
  );

  setIsEditOptionItemOpen(false);
}}

    itemData={editOptionItemData}
    optionGroupData={currentOptionGroup}
  />
)}

        <CloseConfirmationModal
          isOpen={showCloseConfirmation}
          onClose={handleCancelClose}
          onConfirm={
            showAddModal ? handleConfirmAddModalClose : handleConfirmClose
          }
          hasUnsavedItems={checkForUnsavedItems()}
        />
      </div>
    </div>
  );
};

export default OptionGroupManager;
