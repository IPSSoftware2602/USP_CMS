import React, { useState, useEffect } from "react";
import { Clock, Trash2, ChevronDown, ChevronUp, X, Copy, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import itemService from "../../../store/api/itemService";
import tagService from "../../../store/api/tagService"
import OptionGroupManager from './option-group';
import categoryService from "../../../store/api/categoryService";
import useSidebar from '../../../hooks/useSidebar';
import { ToastContainer, toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import 'react-toastify/dist/ReactToastify.css';

const ItemAdd = () => {
  const [itemName, setItemName] = useState("");

  const [variationsList, setVariationsList] = useState([]);
  const [variationTags, setVariationTags] = useState({});
  const [showVariationTags, setShowVariationTags] = useState(false);
  const [currentVariationIndex, setCurrentVariationIndex] = useState(null);

  const [showOptionPanel, setShowOptionPanel] = useState(false);
  const [itemOptionGroups, setItemOptionGroups] = useState([]);
  const [showVariationOptionManager, setShowVariationOptionManager] = useState(false);
  const [showItemOptionManager, setShowItemOptionManager] = useState(false);

  // Pricing
  const [originalPrice, setOriginalPrice] = useState("");
  const [pwpPrice, setPwpPrice] = useState("");
  const [packagingCharges, setPackagingCharges] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");

  // Category
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [sellIndividually, setSellIndividually] = useState(false);

  // Images
  const [images, setImages] = useState([]);

  const [collapsed, isHamburger] = useSidebar();

  const toggleOptionsPanel = (index) => {
    setShowOptionPanel(prev => (prev === index ? null : index));
  };

  // Tags
  const [showTags, setShowTagsModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  // const [customTags, setCustomTags] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [newTagIcon, setNewTagIcon] = useState(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [itemShortDescription, setItemShortDescription] = useState("");
  const [itemLongDescription, setItemLongDescription] = useState("");

  //pwp enable
  const [pwpEnabled, setPwpEnabled] = useState(0);

  const navigate = useNavigate();

  const handleTagsModel = () => {
    setShowTagsModal(true);
  };

  // const toggleTag = (tagId) => {
  //   if (selectedTag === tagId) {
  //     setSelectedTag(null);
  //   } else {
  //     setSelectedTag(tagId);
  //   }
  // };
  const toggleTag = (tagId) => {
    setSelectedTag(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const addTags = () => {
    if (selectedTag && selectedTag.length > 0) {
      console.log("Tags added:", selectedTag);
    }
    closeAllModals();
  };

  // const addTags = () => {
  //   if (selectedTag) {
  //     console.log("Tag added:", selectedTag);
  //   }
  //   closeAllModals();
  // };

  const nutriGradeTags = [
    { id: 'grade-a-0', label: 'A-0%', activeColor: 'bg-green-600', inactiveColor: 'bg-green-200', sugar: '0%' },
    { id: 'grade-b-4', label: 'B-4%', activeColor: 'bg-lime-500', inactiveColor: 'bg-lime-200', sugar: '4%' },
    { id: 'grade-c-8', label: 'C-8%', activeColor: 'bg-yellow-500', inactiveColor: 'bg-yellow-200', sugar: '8%' },
    { id: 'grade-d-12', label: 'D-12%', activeColor: 'bg-red-500', inactiveColor: 'bg-red-200', sugar: '12%' },
  ];

  // Availability
  const [itemType, setItemType] = useState('regular');
  const [availableDays, setAvailableDays] = useState({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false
  });

  const [seasonalDates, setSeasonalDates] = useState({
    start_date: '',
    end_date: '',
    start_time: '00:00',
    end_time: '23:59'
  });

  const [specificCollectionTime, setSpecificCollectionTime] = useState(false);
  const [collectionTimes, setCollectionTimes] = useState([]);

  const handleDayChange = (day) => {
    setAvailableDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const dayToNumber = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  };

  const generateAvailabilityData = () => {
    if (itemType === "seasonal") {
      return [
        {
          start_date: seasonalDates.start_date,
          end_date: seasonalDates.end_date,
          start_time: seasonalDates.start_time.substring(0, 5) + ":00",
          end_time: seasonalDates.end_time.substring(0, 5) + ":00"
        }
      ];
    } else {
      const regularArray = [];

      for (let dayNum = 0; dayNum <= 6; dayNum++) {
        const dayName = Object.keys(dayToNumber).find(name => dayToNumber[name] === dayNum);

        regularArray.push({
          day_of_week: dayNum,
          is_enabled: availableDays[dayName] ? 1 : 0,
          start_time: specificCollectionTime && collectionTimes[dayName]?.from
            ? collectionTimes[dayName].from.substring(0, 5) + ":00"
            : "09:00:00",
          end_time: specificCollectionTime && collectionTimes[dayName]?.to
            ? collectionTimes[dayName].to.substring(0, 5) + ":00"
            : "17:00:00"
        });
      }

      return [regularArray];
    }
  };


  const validateAvailabilityData = (availabilityData) => {
    if (!availabilityData || !availabilityData[0]) {
      return { isValid: false, error: "No availability data provided" };
    }

    const availability = availabilityData[0];

    if (Array.isArray(availability)) {
      const dayNumbers = availability.map(item => parseInt(item.day_of_week));
      const uniqueDays = [...new Set(dayNumbers)];

      if (uniqueDays.length !== dayNumbers.length) {
        return { isValid: false, error: "Duplicate day entries found" };
      }

      const invalidDays = dayNumbers.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        return { isValid: false, error: `Invalid day numbers: ${invalidDays.join(', ')}` };
      }

      if (uniqueDays.length !== 7) {
        const missingDays = [];
        for (let i = 0; i <= 6; i++) {
          if (!uniqueDays.includes(i)) {
            missingDays.push(i);
          }
        }
        return { isValid: false, error: `Missing days: ${missingDays.join(', ')}` };
      }
    } else {
      if (!availability.start_date || !availability.end_date) {
        return { isValid: false, error: "Seasonal items must have start_date and end_date" };
      }

      if (!availability.start_time || !availability.end_time) {
        return { isValid: false, error: "Seasonal items must have start_time and end_time" };
      }

      const startDate = new Date(availability.start_date);
      const endDate = new Date(availability.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { isValid: false, error: "Invalid date format" };
      }

      if (startDate >= endDate) {
        return { isValid: false, error: "End date must be after start date" };
      }
    }

    return { isValid: true };
  };


  const handleCollectionTimeChange = (day, field, value) => {
    setCollectionTimes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearError = (field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const loadCategories = async () => {
    try {
      setCategoryLoading(true);
      const response = await categoryService.getCategories();

      const categoryList = Array.isArray(response) ? response : response.data || [];
      const transformedCategories = categoryList.map(cat =>
        categoryService.transformApiCategoryToComponent(cat)
      );

      setCategories(transformedCategories);

      if (sellIndividually && !selectedCategoryId && transformedCategories.length > 0) {
        setSelectedCategoryId(transformedCategories[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setErrors(prev => ({
        ...prev,
        categories: 'Failed to load categories. Please try again.'
      }));
    } finally {
      setCategoryLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!itemName.trim()) {
      newErrors.itemName = "Item name is required";
    }

    if (!itemShortDescription.trim()) {
      newErrors.itemShortDescription = "Short description is required";
    }

    if (!itemLongDescription.trim()) {
      newErrors.itemLongDescription = "Long description is required";
    }

    if (!originalPrice || isNaN(parseFloat(originalPrice)) || parseFloat(originalPrice) <= 0) {
      newErrors.originalPrice = "Valid original price is required";
    }

    if (!discountedPrice || isNaN(parseFloat(discountedPrice)) || parseFloat(discountedPrice) <= 0) {
      newErrors.discountedPrice = "Valid discounted price is required";
    }

    // Price validation
    if (pwpPrice && (isNaN(parseFloat(pwpPrice)) || parseFloat(pwpPrice) >= parseFloat(originalPrice))) {
      newErrors.pwpPrice = "PWP price must be less than original price";
    }


    if (!packagingCharges || isNaN(parseFloat(packagingCharges)) || parseFloat(packagingCharges) < 0) {
      newErrors.packagingCharges = "Valid packaging charges are required";
    }

    // Category validation
    if (sellIndividually && (!selectedCategoryId || selectedCategoryId === '')) {
      newErrors.category = "Please select a category";
    }

    // Availability validation
    if (itemType === "seasonal") {
      if (!seasonalDates.start_date) {
        newErrors.seasonalStartDate = "Start date is required for seasonal items";
      }
      if (!seasonalDates.end_date) {
        newErrors.seasonalEndDate = "End date is required for seasonal items";
      }
      if (seasonalDates.start_date && seasonalDates.end_date) {
        if (new Date(seasonalDates.start_date) >= new Date(seasonalDates.end_date)) {
          newErrors.seasonalDates = "End date must be after start date";
        }
      }
    } else {
      const hasSelectedDay = Object.values(availableDays).some(day => day);
      if (!hasSelectedDay) {
        newErrors.availableDays = "Please select at least one available day";
      }

      if (specificCollectionTime) {
        const selectedDays = Object.keys(availableDays).filter(day => availableDays[day]);
        selectedDays.forEach(day => {
          if (!collectionTimes[day]?.from || !collectionTimes[day]?.to) {
            newErrors[`collectionTime_${day}`] = `Please set collection times for ${day}`;
          }
        });
      }
    }

    // Variations validation
    variationsList.forEach((variation, index) => {
      if (!variation.name?.trim()) {
        newErrors[`variation_${index}_name`] = `Variation ${index + 1} name is required`;
      }
      if (variation.price && (isNaN(parseFloat(variation.price)) || parseFloat(variation.price) < 0)) {
        newErrors[`variation_${index}_price`] = `Variation ${index + 1} must have a valid price`;
      }
      if (variation.images && variation.images.length > 0) {
        variation.images.forEach((image, imageIndex) => {
          if (!(image instanceof File)) {
            newErrors[`variation_${index}_image_${imageIndex}`] = `Variation ${index + 1} image ${imageIndex + 1} is not a valid file`;
          }
          if (image.size > 10 * 1024 * 1024) {
            newErrors[`variation_${index}_image_${imageIndex}`] = `Variation ${index + 1} image ${imageIndex + 1} is too large (max 10MB)`;
          }
        });
      }
    });

    if (images.length > 0) {
      images.forEach((image, index) => {
        if (!(image instanceof File)) {
          newErrors[`image_${index}`] = `Image ${index + 1} is not a valid file`;
        }
        if (image.size > 10 * 1024 * 1024) {
          newErrors[`image_${index}`] = `Image ${index + 1} is too large (max 10MB)`;
        }
      });
    }

    // Log validation results for debugging
    // if (Object.keys(newErrors).length > 0) {
    //   console.log("Validation errors:", newErrors);
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const validateAvailability = () => {
  //   const newErrors = {};

  //   if (itemType === "seasonal") {
  //     if (!seasonalDates.start_date) {
  //       newErrors.seasonalStartDate = "Please select start date";
  //     }
  //     if (!seasonalDates.end_date) {
  //       newErrors.seasonalEndDate = "Please select end date";
  //     }
  //     if (seasonalDates.start_date && seasonalDates.end_date) {
  //       if (new Date(seasonalDates.start_date) >= new Date(seasonalDates.end_date)) {
  //         newErrors.seasonalDates = "End date must be after start date";
  //       }
  //     }
  //   } else {
  //     // Regular item validation
  //     const hasSelectedDay = Object.values(availableDays).some(day => day);
  //     if (!hasSelectedDay) {
  //       newErrors.availableDays = "Please select at least one available day";
  //     }
  //   }

  //   return newErrors;
  // };

  const handleItemTypeChange = (type) => {
    setItemType(type);
    if (type === "seasonal") {
      setAvailableDays({
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
        sun: false
      });
    } else {
      setSeasonalDates({
        start_date: '',
        end_date: '',
        start_time: '00:00',
        end_time: '23:59'
      });
    }
  };

  const handleSeasonalDateChange = (field, value) => {
    setSeasonalDates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setErrors(prev => ({
        ...prev,
        images: "Some files were rejected. Please ensure all files are images under 10MB."
      }));
    }

    setImages(prev => [...prev, ...validFiles]);
  };

  const prepareItemData = () => {
    const availabilityData = generateAvailabilityData();

    const itemData = {
      title: itemName.trim(),
      short_description: itemShortDescription.trim(),
      long_description: itemLongDescription.trim(),
      price: parseFloat(originalPrice),
      discount_price: parseFloat(discountedPrice),
      packaging_price: parseFloat(packagingCharges),
      pwp_price: pwpPrice ? parseFloat(pwpPrice) : null,
      status: 'active',
      order_index: 0,
      pwp: Number(pwpEnabled),
      categories: (sellIndividually && selectedCategoryId) ? [selectedCategoryId] : [],
      menu_tags: selectedTag ? selectedTag : [],
      menu_option_groups: Array.isArray(itemOptionGroups)
        ? itemOptionGroups.map(group => typeof group === 'object' ? group.id : group)
        : [],
      images: images || [],
      availability: availabilityData,
      availability_type: itemType === 'seasonal' ? 'seasonal' : 'regular',
      variations: variationsList.map((variation, index) => {
        const variationData = {
          title: variation.name || `Variation ${index + 1}`,
          price: variation.price ? parseFloat(variation.price) : parseFloat(originalPrice),
          order_index: index,
          option_groups: Array.isArray(variation.optionGroups)
            ? variation.optionGroups.map(group => typeof group === 'object' ? group.id : group)
            : [],
          tags: Array.isArray(variationTags[index]) ? variationTags[index] : [],
          images: variation.images || [],
        };
        console.log(`Variation ${index} data:`, variationData);
        console.log(`variationTags[${index}]:`, variationTags[index]);
        return variationData;
      })
    };

    Object.keys(itemData).forEach(key => {
      if (itemData[key] === undefined || itemData[key] === null) {
        delete itemData[key];
      }
    });

    return itemData;
  };

  // const handleVariationOption = () => {
  //   setShowVariationOptionManager(true);
  // };

  const handleItemOption = () => {
    setShowItemOptionManager(true);
  };

  //   const handleVariationOptionGroupSelect = (variationIndex) => {
  //   setCurrentVariationIndex(variationIndex);
  //   setShowVariationOptionManager(true);
  // };

  const handleVariationOptionGroupSelect = (selectedGroups) => {
    if (currentVariationIndex !== null) {
      setVariationsList(prev => prev.map((variation, i) =>
        i === currentVariationIndex
          ? { ...variation, optionGroups: selectedGroups }
          : variation
      ));
    }
    setShowVariationOptionManager(false);
    setCurrentVariationIndex(null);
  };

  const handleItemOptionGroupSelect = (selectedGroups) => {
    setItemOptionGroups(selectedGroups);
    setShowItemOptionManager(false);
  };

  const clearOptionGroupStorage = () => {
    const optionGroupsStorageList = JSON.parse(sessionStorage.getItem("optionGroupsStorageList")) || [];
    optionGroupsStorageList.forEach(key => {
      sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem("optionGroupsStorageList");
  };


  const handleSubmit = async (e) => {
    // const optionGroupsStorageList = JSON.parse(sessionStorage.getItem("optionGroupsStorageList")) || [];
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      console.log("Validation failed", errors);
      return;
    }

    setIsLoading(true);

    try {
      const itemData = prepareItemData();
      console.log('itemdataaa:', itemData);
      // console.log("Prepared item data:", JSON.stringify(itemData, null, 2));
      const availabilityValidation = validateAvailabilityData(itemData.availability);
      if (!availabilityValidation.isValid) {
        setErrors({ submit: availabilityValidation.error });
        return;
      }

      let response;
      response = await itemService.createMenuItem(itemData);

      clearOptionGroupStorage();
      console.log('Item created successfully:', response);
      toast.success('Created Successfully');
      navigate('/menu/item');

    } catch (error) {
      console.log(error.response?.data);

      const variationImageError = error.response?.data?.messages?.variation_image;

      if (variationImageError) {
        toast.error(variationImageError);
      } else {
        toast.error("Please upload an image for the variation.");
      }

      setErrors({
        submit: variationImageError || error.message || 'Failed to create item. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    clearOptionGroupStorage();
    navigate(-1);
  };

  const closeAllModals = () => {
    setShowTagsModal(false);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTags();
    loadCategories();
  }, []);

  const loadTags = async () => {
    try {
      setTagLoading(true);
      const response = await tagService.getTagList();

      const tags = Array.isArray(response) ? response : response.data || [];
      const transformedTags = tags.map(tag => tagService.transformApiTagToComponent(tag));

      setAvailableTags(transformedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      setErrors(prev => ({
        ...prev,
        tags: 'Failed to load tags. Please try again.'
      }));
    } finally {
      setTagLoading(false);
    }
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) {
      setErrors(prev => ({
        ...prev,
        newTag: 'Tag title is required'
      }));
      return;
    }

    try {
      setTagLoading(true);

      const tagData = {
        title: newTagTitle.trim(),
        icon: newTagIcon
      };

      const validation = tagService.validateTagData(tagData);
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          newTag: Object.values(validation.errors).join(', ')
        }));
        return;
      }

      const response = await tagService.createTag(tagData);
      const newTag = tagService.transformApiTagToComponent(response);

      setAvailableTags(prev => [...prev, newTag]);

      setSelectedTag(newTag.id);

      setNewTagTitle("");
      setNewTagIcon(null);
      setShowCreateTag(false);

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.newTag;
        return newErrors;
      });

    } catch (error) {
      console.error('Error creating tag:', error);
      setErrors(prev => ({
        ...prev,
        newTag: error.message || 'Failed to create tag. Please try again.'
      }));
    } finally {
      setTagLoading(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      setTagLoading(true);
      await tagService.deleteTag(tagId);

      setAvailableTags(prev => prev.filter(tag => tag.id !== tagId));

      if (selectedTag === tagId) {
        setSelectedTag([]);
      }

    } catch (error) {
      console.error('Error deleting tag:', error);
      setErrors(prev => ({
        ...prev,
        tags: error.message || 'Failed to delete tag. Please try again.'
      }));
    } finally {
      setTagLoading(false);
    }
  };

  const handleTagIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          newTag: 'Icon must be a valid image file (JPEG, PNG)'
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          newTag: 'Icon file size must be less than 5MB'
        }));
        return;
      }

      setNewTagIcon(file);

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.newTag;
        return newErrors;
      });
    }
  };

  const getSelectedTagDetails = (tagId = selectedTag) => {
    if (!tagId) return null;

    const nutriTag = nutriGradeTags.find(tag => tag.id === tagId);
    if (nutriTag) return nutriTag;

    const apiTag = availableTags.find(tag => tag.id === tagId);
    if (apiTag) return apiTag;

    return null;
  };

  //Variation
  const addNewVariation = () => {
    const newVariation = {
      name: '',
      price: '',
      optionGroups: [],
      images: [],
      existing_images: []
    };
    setVariationsList(prev => [...prev, newVariation]);
  };

  const removeVariation = (index) => {
    setVariationsList(prev => prev.filter((_, i) => i !== index));
    setVariationTags(prev => {
      const newTags = { ...prev };
      delete newTags[index];
      const reindexedTags = {};
      Object.keys(newTags).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexedTags[numKey - 1] = newTags[key];
        } else {
          reindexedTags[key] = newTags[key];
        }
      });
      return reindexedTags;
    });
  };

  const updateVariation = (index, field, value) => {
    setVariationsList(prev => prev.map((variation, i) =>
      i === index ? { ...variation, [field]: value } : variation
    ));
  };

  const removeVariationOptionGroup = (variationIndex, groupIndex) => {
    setVariationsList(prev => prev.map((variation, i) =>
      i === variationIndex
        ? { ...variation, optionGroups: variation.optionGroups.filter((_, gi) => gi !== groupIndex) }
        : variation
    ));
  };

  const handleVariationTagsModal = (variationIndex) => {
    setCurrentVariationIndex(variationIndex);
    // Initialize selectedTag with existing variation tags if any
    setSelectedTag(variationTags[variationIndex] || []);
    setShowVariationTags(true);
  };

  const handleVariationImageUpload = (variationIndex, event) => {
    const files = Array.from(event.target.files);
    console.log(`Uploading images for variation ${variationIndex}:`, files);

    const file = files[0];

    if (!file) return;

    const isValidType = file.type.startsWith('image/');
    const isValidSize = file.size <= 10 * 1024 * 1024;

    if (!isValidType || !isValidSize) {
      setErrors(prev => ({
        ...prev,
        [`variation_${variationIndex}_images`]: "Please ensure the file is an image under 10MB."
      }));
      return;
    }

    console.log(`Valid image file selected for variation ${variationIndex}:`, file.name);

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`variation_${variationIndex}_images`];
      return newErrors;
    });

    setVariationsList(prev => {
      const updated = prev.map((variation, i) => {
        if (i === variationIndex) {
          console.log(`Setting image for variation ${i}:`, file);
          return { ...variation, images: [file] };
        }
        return variation;
      });
      console.log("Updated variations list:", updated);
      return updated;
    });
  };

  const removeVariationImage = (variationIndex, imageIndex) => {
    console.log(`Removing image ${imageIndex} from variation ${variationIndex}`);
    setVariationsList(prev => prev.map((variation, i) =>
      i === variationIndex
        ? { ...variation, images: [] }
        : variation
    ));
  };

  const addVariationTags = () => {
    console.log('addVariationTags called:', {
      currentVariationIndex,
      selectedTag,
      selectedTagLength: selectedTag?.length
    });
    
    if (currentVariationIndex !== null && selectedTag && selectedTag.length > 0) {
      console.log('Adding tags to variation:', currentVariationIndex, selectedTag);
      setVariationTags(prev => {
        const updated = {
          ...prev,
          [currentVariationIndex]: selectedTag
        };
        console.log('Updated variationTags:', updated);
        return updated;
      });
      setSelectedTag([]);
    }
    setShowVariationTags(false);
    setCurrentVariationIndex(null);
  };

  const removeVariationTag = (variationIndex, tagId) => {
    setVariationTags(prev => ({
      ...prev,
      [variationIndex]: prev[variationIndex]?.filter(id => id !== tagId) || []
    }));
  };

  const handleVariationOptionGroupDragEnd = (variationIndex, result) => {
    if (!result.destination) return;

    setVariationsList(prev => prev.map((variation, i) => {
      if (i !== variationIndex) return variation;
      const items = Array.from(variation.optionGroups);
      const [reordered] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reordered);
      return { ...variation, optionGroups: items };
    }));
  };

  const handleItemOptionGroupDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(itemOptionGroups);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setItemOptionGroups(items);
  };

  return (
    <>
      <ToastContainer />
      <div className="mx-auto bg-white shadow-md rounded-lg mt-8 mb-8 p-4">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold">Add New Item</h1>
          <button className="flex items-center px-4 py-2 border rounded-full hover:bg-gray-50 transition-all" onClick={handleBack}>
            <span className="mr-2">Go back</span>
            <span className="transform rotate-180">→</span>
          </button>
        </div>

        {/* Display global errors */}
        {errors.submit && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Product Information Section */}
          <div className="p-4">
            <h2 className="text-xl text-gray-500 mb-6">Product Information</h2>

            {/* Item Name & Description */}
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Item Name & Description</h3>
              </div>
              <div className="border p-4 space-y-4 bg-white rounded-b-lg">
                <div>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      if (errors.itemName) clearError('itemName');
                    }}
                    placeholder="Item Name"
                    className={`w-full p-2 border rounded-lg ${errors.itemName ? 'border-red-500' : ''}`}
                  />
                  {errors.itemName && (
                    <p className="text-red-500 text-sm mt-1">{errors.itemName}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={itemShortDescription}
                    onChange={e => {
                      setItemShortDescription(e.target.value);
                      if (errors.itemShortDescription) clearError('itemShortDescription');
                    }}
                    placeholder="Short Description"
                    className={`w-full p-2 border rounded-lg ${errors.itemShortDescription ? 'border-red-500' : ''}`}
                    maxLength={120}
                  />
                  {errors.itemShortDescription && (
                    <p className="text-red-500 text-sm mt-1">{errors.itemShortDescription}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Max 120 characters</p>
                </div>
                <div>
                  <textarea
                    value={itemLongDescription}
                    onChange={e => {
                      setItemLongDescription(e.target.value);
                      if (errors.itemLongDescription) clearError('itemLongDescription');
                    }}
                    placeholder="Long Description"
                    className={`w-full p-2 border h-32 rounded-lg resize-none ${errors.itemLongDescription ? 'border-red-500' : ''}`}
                  />
                  {errors.itemLongDescription && (
                    <p className="text-red-500 text-sm mt-1">{errors.itemLongDescription}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Variations */}
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Variations</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">

                {/* Display existing variations */}
                {variationsList.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {variationsList.map((variation, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-lg">{variation.name || `Variation ${index + 1}`}</h4>
                          <button
                            type="button"
                            onClick={() => removeVariation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex space-x-4 mb-4">
                          <input
                            type="text"
                            value={variation.name || ''}
                            onChange={(e) => updateVariation(index, 'name', e.target.value)}
                            placeholder="Variations"
                            className="flex-grow p-2 border rounded"
                          />
                          <div className="w-64">
                            <input
                              type="text"
                              value={variation.price || ''}
                              onChange={(e) => updateVariation(index, 'price', e.target.value)}
                              placeholder="Price"
                              className="w-full p-2 border rounded"
                            />
                          </div>
                          <div className="w-40 relative">
                            <div
                              className="w-full p-2 border rounded flex justify-between items-center cursor-pointer"
                              onClick={() => toggleOptionsPanel(index)}
                            >
                              <span>{(variation.optionGroups?.length || 0)} Option{(variation.optionGroups?.length || 0) !== 1 ? 's' : ''}</span>
                              {showOptionPanel === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {showOptionPanel === index && (
                          <div className="mt-6 mb-6 bg-gray-200 p-6 rounded-lg">
                            {/* Option Groups Section */}
                            <div className="mb-8">
                              <h4 className="font-semibold text-lg mb-2">Option Groups</h4>

                              {variation.optionGroups?.length > 0 ? (<DragDropContext onDragEnd={result => handleVariationOptionGroupDragEnd(index, result)}>
                                <Droppable droppableId={`variation-optionGroups-${index}`}>
                                  {(provided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="space-y-2 max-h-64 mb-4 overflow-y-auto"
                                    >
                                      {variation.optionGroups.map((group, groupIndex) => (
                                        <Draggable
                                          key={group.id || `temp-${groupIndex}`}
                                          draggableId={group.id ? group.id.toString() : `temp-${groupIndex}`}
                                          index={groupIndex}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              // {...provided.dragHandleProps}
                                              className="flex items-center justify-between p-3 bg-white rounded border"
                                            >
                                              {/* Drag handle icon */}
                                              <span
                                                {...provided.dragHandleProps}
                                                className="mr-3 cursor-grab text-gray-400 hover:text-gray-600"
                                                title="Drag to reorder"
                                              >
                                                <GripVertical size={18} />
                                              </span>
                                              <div className="flex-1">
                                                <div className="font-medium">{group.name}</div>
                                                <div className="text-sm text-gray-500">
                                                  {group.optionCount || 0} Option | {group.minSelection || 0} Min, {group.maxSelection || 1} Max
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => removeVariationOptionGroup(index, groupIndex)}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <X size={16} />
                                              </button>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>) : null}

                              <div className="flex justify-center mb-2">
                                <button
                                  type="button"
                                  className="bg-indigo-900 text-white px-6 py-2 rounded-md flex items-center"
                                  onClick={() => {
                                    setCurrentVariationIndex(index);
                                    setShowVariationOptionManager(true);
                                  }}
                                >
                                  <span className="mr-1">+</span> Add Option Group
                                </button>
                              </div>
                              <p className="text-center text-gray-600 text-sm">Offer options for your customers to customise their item.</p>
                            </div>

                            <hr className="my-6 border-gray-300" />

                            {/* Tags Section */}
                            <div className="mb-4">
                              <h4 className="font-semibold text-lg mb-2">Tags</h4>

                              {variationTags[index]?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {variationTags[index].map((tagId) => {
                                    const tagDetails = getSelectedTagDetails(tagId);
                                    return (
                                      <div key={tagId} className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        {tagDetails?.iconUrl && (
                                          <img
                                            src={tagDetails.iconUrl}
                                            alt={tagDetails.title || tagDetails.label}
                                            className="w-3 h-3 object-cover rounded mr-1"
                                          />
                                        )}
                                        <span>{tagDetails?.title || tagDetails?.label}</span>
                                        <button
                                          type="button"
                                          onClick={() => removeVariationTag(index, tagId)}
                                          className="ml-1 text-red-500 hover:text-red-700"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="flex justify-center mb-2">
                                <button
                                  type="button"
                                  className="bg-indigo-900 text-white px-6 py-2 rounded-md flex items-center"
                                  onClick={() => handleVariationTagsModal(index)}
                                >
                                  <span className="mr-1">+</span> Add Tag
                                </button>
                              </div>
                              <p className="text-center text-gray-600 text-sm">Add tags to the variant to provide more information to your customers</p>
                            </div>

                            <hr className="my-6 border-gray-300" />

                            <div className="mb-4">
                              <h4 className="font-semibold text-lg mb-4">Images</h4>
                              <div className="border p-4 bg-gray-100 rounded-b-lg">
                                <div className="border border-dashed p-8 flex flex-col items-center justify-center">
                                  <p className="text-gray-500 text-sm">JPG, PNG, max 10MB</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      handleVariationImageUpload(index, e);
                                      e.target.value = "";
                                    }}

                                    className="hidden"
                                    id={`variation-image-upload-${index}`}
                                  />
                                  <label
                                    htmlFor={`variation-image-upload-${index}`}
                                    className="mt-4 inline-flex items-center px-4 py-2 border rounded cursor-pointer hover:bg-gray-50"
                                  >
                                    + Add Image
                                  </label>
                                </div>

                                {variation.images?.length > 0 && (
                                  <div className="mt-4">
                                    <div className="relative inline-block">
                                      <img
                                        src={URL.createObjectURL(variation.images[0])}
                                        alt={`Variation ${index + 1} Preview`}
                                        className="w-32 h-24 object-cover rounded border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeVariationImage(index, 0)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {errors[`variation_${index}_images`] && (
                                  <p className="text-red-500 text-sm mt-2">{errors[`variation_${index}_images`]}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <button type="button" className="inline-flex items-center px-4 py-2 border rounded" onClick={addNewVariation}>
                    + Add Variation
                  </button>
                  <p className="text-gray-500 text-sm mt-2">
                    Create different variations (such as size, preparation style, flavor) of this item. Item variation listed under other items category will display as an individual item in option group manager.
                  </p>
                </div>
              </div>
            </div>

            {/* Option Groups */}
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Option Groups</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                <p className="text-sm text-gray-600 mb-4">These options apply to the entire item, regardless of variations.</p>
                {itemOptionGroups.length > 0 && (
                  <DragDropContext onDragEnd={handleItemOptionGroupDragEnd}>
                    <Droppable droppableId="item-optionGroups">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2 mb-4 max-h-64 overflow-y-auto"
                        >
                          {itemOptionGroups.map((group, index) => (
                            <Draggable
                              key={group.id}
                              draggableId={group.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  // {...provided.dragHandleProps}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                                >
                                  {/* Drag handle icon */}
                                  <span
                                    {...provided.dragHandleProps}
                                    className="mr-3 cursor-grab text-gray-400 hover:text-gray-600"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical size={18} />
                                  </span>
                                  <div className="flex-1">
                                    <div className="font-medium">{group.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {group.optionCount} Option | {group.minSelection} Min, {group.maxSelection} Max
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedGroups = itemOptionGroups.filter((_, i) => i !== index);
                                      setItemOptionGroups(updatedGroups);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}

                <button type="button" className="inline-flex items-center px-4 py-2 border rounded" onClick={handleItemOption}>
                  + Add Option Group
                </button>
                <p className="text-gray-500 text-sm mt-2">
                  Offer options for your customers to customise their item.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="p-4">
            <div className="bg-indigo-900 p-1">
              <h3 className="font-medium text-[16px] pl-4 text-white">Tags</h3>
            </div>
            <div className="border p-5 mb-6 space-y-4 bg-white rounded-b-lg">
              {selectedTag && selectedTag.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm text-gray-600 font-medium">Selected Tags:</span>
                    {selectedTag.map(tagId => {
                      const tag = getSelectedTagDetails(tagId);
                      return (
                        <div key={tagId} className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mr-2 mb-1">
                          {tag?.iconUrl && (
                            <img
                              src={tag.iconUrl}
                              alt={tag.title || tag.label}
                              className="w-4 h-4 object-cover rounded mr-2"
                            />
                          )}
                          <span>{tag?.title || tag?.label}</span>
                          <button
                            type="button"
                            onClick={() => toggleTag(tagId)}
                            className="ml-2 text-red-500 hover:text-red-700"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="button" className="inline-flex items-center px-4 py-2 border rounded" onClick={handleTagsModel}>
                + Add Tags
              </button>
              <p className="text-gray-500 text-sm mt-2">
                Add tags to the item to provide more information to your customers.
              </p>
            </div>

            {/* Add Tags Modal */}
            {showTags && (
              <div
                className={`
                fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center
                z-[9999] transition-all duration-150
                ${!isHamburger ? (
                    collapsed
                      ? "ltr:ml-[72px] rtl:mr-[72px]"
                      : "ltr:ml-[248px] rtl:mr-[248px]"
                  ) : ""}
              `}
              >
                <div className="bg-white border rounded-lg w-full max-w-4xl mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">Select Tags for your item</h2>
                    <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="p-4">
                    {/* Display loading or errors */}
                    {tagLoading && (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-600 mt-2">Loading tags...</p>
                      </div>
                    )}

                    {errors.tags && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{errors.tags}</p>
                      </div>
                    )}

                    {/* Selected Tag Display */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">Selected Tag</p>
                      <div className="border rounded-lg p-3 min-h-[50px] bg-gray-50">
                        {selectedTag && selectedTag.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedTag.map(tagId => {
                              const tag = getSelectedTagDetails(tagId);
                              return (
                                <div key={tagId} className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  {tag?.iconUrl && (
                                    <img
                                      src={tag.iconUrl}
                                      alt={tag.title || tag.label}
                                      className="w-4 h-4 object-cover rounded mr-2"
                                    />
                                  )}
                                  <span>{tag?.title || tag?.label}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleTag(tagId)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    title="Remove"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No tag selected</p>
                        )}
                      </div>
                    </div>

                    {/* Create New Tag Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Create New Tag</p>
                        <button
                          type="button"
                          onClick={() => setShowCreateTag(!showCreateTag)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          {showCreateTag ? 'Cancel' : '+ Create New'}
                        </button>
                      </div>

                      {showCreateTag && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Tag Title *</label>
                              <input
                                type="text"
                                value={newTagTitle}
                                onChange={(e) => {
                                  setNewTagTitle(e.target.value);
                                  if (errors.newTag) clearError('newTag');
                                }}
                                placeholder="Enter tag title"
                                className="w-full p-2 border rounded-lg"
                                maxLength="100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Tag Icon (Optional)</label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleTagIconUpload}
                                  className="hidden"
                                  id="tag-icon-upload"
                                />
                                <label
                                  htmlFor="tag-icon-upload"
                                  className="px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-100 text-sm"
                                >
                                  Choose File
                                </label>
                                {newTagIcon && (
                                  <span className="text-sm text-green-600">
                                    {newTagIcon.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Max 5MB, JPEG/PNG/GIF formats
                              </p>
                            </div>

                            {errors.newTag && (
                              <p className="text-red-500 text-sm">{errors.newTag}</p>
                            )}

                            <button
                              type="button"
                              onClick={handleCreateTag}
                              disabled={tagLoading || !newTagTitle.trim()}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {tagLoading ? "Creating..." : "Create Tag"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* List of available tags */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">Available Tags</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableTags.length === 0 && (
                          <p className="text-gray-400 text-sm col-span-3">No tags available.</p>
                        )}
                        {availableTags.map(tag => (
                          <div
                            key={tag.id}
                            className={`border rounded-lg p-3 transition-all relative group ${selectedTag && selectedTag.includes(tag.id) ? 'ring-2 ring-indigo-700 bg-indigo-50 shadow-md' : 'hover:shadow-sm'
                              }`}
                          >
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTag(tag.id);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              title="Delete tag"
                            >
                              ×
                            </button>

                            {/* Tag content */}
                            <div
                              onClick={() => toggleTag(tag.id)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center">
                                {tag.iconUrl ? (
                                  <img
                                    src={tag.iconUrl}
                                    alt={tag.title}
                                    className="w-8 h-8 object-cover rounded mr-3 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">
                                      {tag.title.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm truncate">{tag.title}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 p-4 border-t">
                    <button
                      onClick={closeAllModals}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addTags}
                      className="px-4 py-2 bg-indigo-900 text-white rounded-lg transition-colors hover:bg-indigo-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Images</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                <div className="border border-dashed p-8 flex flex-col items-center justify-center">
                  <p className="text-gray-500 text-sm">800×800, JPG, PNG, max 10MB</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 border rounded cursor-pointer hover:bg-gray-50"
                  >
                    + Add Image
                  </label>
                </div>

                {/* Display selected images */}
                {images.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
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
                {errors.images && (
                  <p className="text-red-500 text-sm mt-2">{errors.images}</p>
                )}
              </div>
            </div>

            {/* Pricing Setup */}
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Pricing Setup</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                <div className="flex space-x-8">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-2">Original Price (RM) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={originalPrice}
                      onChange={(e) => {
                        setOriginalPrice(e.target.value);
                        if (errors.originalPrice) clearError('originalPrice');
                      }}
                      placeholder="Enter here..."
                      className={`w-full p-2 border rounded ${errors.originalPrice ? 'border-red-500' : ''}`}
                    />
                    {errors.originalPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-2">Discounted Price (RM)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountedPrice}
                      onChange={(e) => {
                        setDiscountedPrice(e.target.value);
                        if (errors.discountedPrice) clearError('discountedPrice');
                      }}
                      placeholder="Enter here..."
                      className={`w-full p-2 border rounded ${errors.discountedPrice ? 'border-red-500' : ''}`}
                    />
                    {errors.discountedPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.discountedPrice}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-2">PWP Price (RM)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pwpPrice}
                      onChange={(e) => {
                        setPwpPrice(e.target.value);
                        if (errors.pwpPrice) clearError('pwpPrice');
                      }}
                      placeholder="Enter here..."
                      className={`w-full p-2 border rounded ${errors.pwpPrice ? 'border-red-500' : ''}`}
                    />
                    {errors.pwpPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.pwpPrice}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 mb-2">Packaging Charges (RM) (For pickup and delivery)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={packagingCharges}
                      onChange={(e) => {
                        setPackagingCharges(e.target.value);
                        if (errors.packagingCharges) clearError('packagingCharges');
                      }}
                      placeholder="Enter here..."
                      className={`w-full p-2 border rounded ${errors.packagingCharges ? 'border-red-500' : ''}`}
                    />
                    {errors.packagingCharges && (
                      <p className="text-red-500 text-sm mt-1">{errors.packagingCharges}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Settings */}
          <div className="p-4">
            <h2 className="text-xl text-gray-500 mb-4">Category Settings</h2>

            {/* Category Assignment */}
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Category Assignment</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                {categoryLoading && (
                  <div className="mb-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading categories...</span>
                  </div>
                )}

                {errors.categories && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.categories}</p>
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <p>Sell this item individually under the specified category</p>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sellIndividually}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSellIndividually(isChecked);
                        if (errors.category) {
                          clearError('category');
                        }
                        if (!isChecked) {
                          setSelectedCategoryId(null);
                        } else if (categories.length > 0 && !selectedCategoryId) {
                          setSelectedCategoryId(categories[0].id);
                        }
                      }}
                      className="sr-only"
                      id="sell-individually"
                    />
                    <label
                      htmlFor="sell-individually"
                      className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors duration-200 ease-in-out ${sellIndividually ? "bg-blue-500" : "bg-gray-200"
                        }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${sellIndividually ? "translate-x-7" : "translate-x-1"
                          }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  By switching this off, the item will be grouped/parked under 'Other items' as an uncategorized item.
                </p>

                {sellIndividually && (
                  <div>
                    <select
                      value={selectedCategoryId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedCategoryId(value ? parseInt(value) : null);
                        if (value && errors.category) {
                          clearError('category');
                        }
                      }}
                      className={`w-full p-2 border rounded ${errors.category ? 'border-red-300 bg-red-50' : ''
                        }`}
                      disabled={categoryLoading}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-xl text-gray-500 mb-4">PWP Settings</h2>
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">PWP Assignment</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                <div className="flex justify-between items-center mb-2">
                  <p>Allow this item to be eligible for PWP promo</p>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={pwpEnabled === 1}
                      onChange={(e) => setPwpEnabled(e.target.checked ? 1 : 0)}
                      className="sr-only"
                      id="pwp-enabled"
                    />
                    <label
                      htmlFor="pwp-enabled"
                      className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors duration-200 ease-in-out ${
                        pwpEnabled === 1 ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                          pwpEnabled === 1 ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  By switching this off, the item will be uneligible for PWP promo.
                </p>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="p-4">
            <h2 className="text-xl text-gray-500 mb-4">Availability</h2>

            {/* Type */}
            <div className="mb-6">
              <div className="bg-indigo-900 p-1">
                <h3 className="font-medium text-[16px] pl-4 text-white">Type</h3>
              </div>
              <div className="border p-4 bg-white rounded-b-lg">
                <div className="flex space-x-8 mb-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="regular"
                      checked={itemType === "regular"}
                      onChange={() => handleItemTypeChange("regular")}
                      className="mr-2"
                    />
                    Regular Item
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="seasonal"
                      checked={itemType === "seasonal"}
                      onChange={() => handleItemTypeChange("seasonal")}
                      className="mr-2"
                    />
                    Seasonal Item
                  </label>
                </div>

                {itemType === "seasonal" ? (
                  // Seasonal Item Form
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="block text-gray-700 mb-3 text-[16px]">Seasonal Availability</h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={seasonalDates.start_date}
                          onChange={(e) => handleSeasonalDateChange('start_date', e.target.value)}
                          className={`w-full p-2 border rounded ${errors.seasonalStartDate ? 'border-red-500' : ''}`}
                        />
                        {errors.seasonalStartDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.seasonalStartDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={seasonalDates.end_date}
                          onChange={(e) => handleSeasonalDateChange('end_date', e.target.value)}
                          className={`w-full p-2 border rounded ${errors.seasonalEndDate ? 'border-red-500' : ''}`}
                        />
                        {errors.seasonalEndDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.seasonalEndDate}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={seasonalDates.start_time}
                          onChange={(e) => handleSeasonalDateChange('start_time', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Time</label>
                        <input
                          type="time"
                          value={seasonalDates.end_time}
                          onChange={(e) => handleSeasonalDateChange('end_time', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>

                    {errors.seasonalDates && (
                      <p className="text-red-500 text-sm mt-2">{errors.seasonalDates}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="block text-gray-700 mb-3 text-[16px]">Available Days</h4>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-4 mb-8">
                      <div className="flex flex-col items-center">
                        <span>Sun</span>
                        <input
                          type="checkbox"
                          checked={availableDays.sun}
                          onChange={() => handleDayChange("sun")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Mon</span>
                        <input
                          type="checkbox"
                          checked={availableDays.mon}
                          onChange={() => handleDayChange("mon")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Tue</span>
                        <input
                          type="checkbox"
                          checked={availableDays.tue}
                          onChange={() => handleDayChange("tue")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Wed</span>
                        <input
                          type="checkbox"
                          checked={availableDays.wed}
                          onChange={() => handleDayChange("wed")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Thu</span>
                        <input
                          type="checkbox"
                          checked={availableDays.thu}
                          onChange={() => handleDayChange("thu")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Fri</span>
                        <input
                          type="checkbox"
                          checked={availableDays.fri}
                          onChange={() => handleDayChange("fri")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Sat</span>
                        <input
                          type="checkbox"
                          checked={availableDays.sat}
                          onChange={() => handleDayChange("sat")}
                          className="mt-1 h-5 w-5"
                        />
                      </div>
                    </div>

                    {/* Collection time toggle */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Clock size={18} className="mr-2" />
                        <span>Indicate specific collection time</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={specificCollectionTime}
                          onChange={() => setSpecificCollectionTime(!specificCollectionTime)}
                          className="sr-only"
                          id="collection-time"
                        />
                        <label
                          htmlFor="collection-time"
                          className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors duration-200 ease-in-out ${specificCollectionTime ? "bg-blue-500" : "bg-gray-200"
                            }`}
                        >
                          <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${specificCollectionTime ? "translate-x-7" : "translate-x-1"
                              }`}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Collection time inputs */}
                    {specificCollectionTime && (
                      <div className="mt-4 space-y-4">
                        {Object.keys(availableDays)
                          .filter(day => availableDays[day])
                          .map(day => (
                            <div key={day}>
                              <p className="mb-2 capitalize font-medium">{day}</p>
                              <div className="flex space-x-4">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-500 mb-1">From</p>
                                  <input
                                    type="time"
                                    value={collectionTimes[day]?.from || ""}
                                    onChange={(e) => {
                                      handleCollectionTimeChange(day, 'from', e.target.value)
                                      if (errors[`collectionTime_${day}`]) clearError(`collectionTime_${day}`);
                                    }}
                                    className={`w-full p-2 border rounded ${errors[`collectionTime_${day}`] ? 'border-red-500' : ''}`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-500 mb-1">To</p>
                                  <input
                                    type="time"
                                    value={collectionTimes[day]?.to || ""}
                                    onChange={(e) => {
                                      handleCollectionTimeChange(day, 'to', e.target.value);
                                      if (errors[`collectionTime_${day}`]) clearError(`collectionTime_${day}`);
                                    }}
                                    className={`w-full p-2 border rounded ${errors[`collectionTime_${day}`] ? 'border-red-500' : ''}`}
                                  />
                                </div>
                              </div>
                              {errors[`collectionTime_${day}`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`collectionTime_${day}`]}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Validation error for available days */}
                    {errors.availableDays && (
                      <p className="text-red-500 text-sm mt-2">{errors.availableDays}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form buttons */}
          <div className="p-4 flex justify-between border-t">
            <div className="space-x-4">
              <button
                type="button"
                className="px-6 py-2 border rounded disabled:opacity-50"
                onClick={handleBack}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-900 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "+ Add Item"}
              </button>
            </div>
          </div>
        </form>

        {showVariationOptionManager && (
          <div
            className={`
            fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center
            z-[9999] transition-all duration-150
            ${!isHamburger ? (
                collapsed
                  ? "ltr:ml-[72px] rtl:mr-[72px]"
                  : "ltr:ml-[248px] rtl:mr-[248px]"
              ) : ""}
          `}
          >
            <div className="w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
              <OptionGroupManager
                onClose={() => setShowVariationOptionManager(false)}
                onSave={handleVariationOptionGroupSelect}
                title="Select Option Groups for Variation"
                keyName={`variationOptionGroups_${currentVariationIndex}`}
                // previouslySelectedGroup={variationsList[currentVariationIndex]?.optionGroups || []}
                  previouslySelectedGroup={Array.isArray(variationsList[currentVariationIndex]?.optionGroups) ? variationsList[currentVariationIndex].optionGroups : []}

              />
            </div>
          </div>
        )}

        {showVariationTags && (
          <div
            className={`
            fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center
            z-[9999] transition-all duration-150
            ${!isHamburger ? (
                collapsed
                  ? "ltr:ml-[72px] rtl:mr-[72px]"
                  : "ltr:ml-[248px] rtl:mr-[248px]"
              ) : ""}
          `}
          >
            <div className="bg-white border rounded-lg w-full max-w-4xl mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Select Tags for Variation</h2>
                <button onClick={() => setShowVariationTags(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="p-4">
                {/* Display loading or errors */}
                {tagLoading && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="text-gray-600 mt-2">Loading tags...</p>
                  </div>
                )}

                {errors.tags && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.tags}</p>
                  </div>
                )}

                {/* Selected Tag Display */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Selected Tag</p>
                  <div className="border rounded-lg p-3 min-h-[50px] bg-gray-50">
                    {selectedTag && selectedTag.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTag.map(tagId => {
                          const tag = getSelectedTagDetails(tagId);
                          return (
                            <div key={tagId} className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {tag?.iconUrl && (
                                <img
                                  src={tag.iconUrl}
                                  alt={tag.title || tag.label}
                                  className="w-4 h-4 object-cover rounded mr-2"
                                />
                              )}
                              <span>{tag?.title || tag?.label}</span>
                              <button
                                type="button"
                                onClick={() => toggleTag(tagId)}
                                className="ml-2 text-red-500 hover:text-red-700"
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No tag selected</p>
                    )}
                  </div>
                </div>

                {/* Create New Tag Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Create New Tag</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateTag(!showCreateTag)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {showCreateTag ? 'Cancel' : '+ Create New'}
                    </button>
                  </div>

                  {showCreateTag && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Tag Title *</label>
                          <input
                            type="text"
                            value={newTagTitle}
                            onChange={(e) => {
                              setNewTagTitle(e.target.value);
                              if (errors.newTag) clearError('newTag');
                            }}
                            placeholder="Enter tag title"
                            className="w-full p-2 border rounded-lg"
                            maxLength="100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Tag Icon (Optional)</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleTagIconUpload}
                              className="hidden"
                              id="variation-tag-icon-upload"
                            />
                            <label
                              htmlFor="variation-tag-icon-upload"
                              className="px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-100 text-sm"
                            >
                              Choose File
                            </label>
                            {newTagIcon && (
                              <span className="text-sm text-green-600">
                                {newTagIcon.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Max 5MB, JPEG/PNG/GIF formats
                          </p>
                        </div>

                        {errors.newTag && (
                          <p className="text-red-500 text-sm">{errors.newTag}</p>
                        )}

                        <button
                          type="button"
                          onClick={handleCreateTag}
                          disabled={tagLoading || !newTagTitle.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {tagLoading ? "Creating..." : "Create Tag"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* List of available tags */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Available Tags</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTags.length === 0 && (
                      <p className="text-gray-400 text-sm col-span-3">No tags available.</p>
                    )}
                    {availableTags.map(tag => (
                      <div
                        key={tag.id}
                        className={`border rounded-lg p-3 transition-all relative group ${selectedTag && selectedTag.includes(tag.id) ? 'ring-2 ring-indigo-700 bg-indigo-50 shadow-md' : 'hover:shadow-sm'
                          }`}
                      >
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTag(tag.id);
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          title="Delete tag"
                        >
                          ×
                        </button>

                        {/* Tag content */}
                        <div
                          onClick={() => toggleTag(tag.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center">
                            {tag.iconUrl ? (
                              <img
                                src={tag.iconUrl}
                                alt={tag.title}
                                className="w-8 h-8 object-cover rounded mr-3 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">
                                  {tag.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm truncate">{tag.title}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  onClick={() => setShowVariationTags(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addVariationTags}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg transition-colors hover:bg-indigo-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {showItemOptionManager && (
          <div
            className={`
            fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center
            z-[9999] transition-all duration-150
            ${!isHamburger ? (
                collapsed
                  ? "ltr:ml-[72px] rtl:mr-[72px]"
                  : "ltr:ml-[248px] rtl:mr-[248px]"
              ) : ""}
          `}
          >
            <div className="w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
              <OptionGroupManager
                onClose={() => setShowItemOptionManager(false)}
                onSave={handleItemOptionGroupSelect}
                // title="Select Option Groups for Item"
                keyName={"itemOptionGroups"}
                // previouslySelectedGroup={itemOptionGroups} 
                  previouslySelectedGroup={Array.isArray(itemOptionGroups) ? itemOptionGroups : []}

              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ItemAdd;