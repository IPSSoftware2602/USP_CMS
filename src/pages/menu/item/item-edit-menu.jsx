import { useState, useEffect } from "react";
import {
  X,
  AlignJustify,
  Edit,
  Edit2,
  Clock,
  Info,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import categoryService from "../../../store/api/categoryService";
import itemService from "../../../store/api/itemService";
import optionGroupService from "../../../store/api/optionGroupService";
import AddOptionItemModal from "./option-item";
import EditOptionItemModal from "./option-item-edit";
import CloseConfirmationModal from "../../../components/ui/CloseConfirmationModal";
import OptionGroupManager from "./option-group";
import tagService from "../../../store/api/tagService";
import useSidebar from "../../../hooks/useSidebar";
import membershipTierService from "@/store/api/membershipService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { VITE_API_BASE_URL } from "../../../constant/config";
import axios from "axios";
import { set } from "react-hook-form";

const BASE_URL = VITE_API_BASE_URL;

export default function ItemEditMenu() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = sessionStorage.getItem("token");
  const [deletedImages, setDeletedImages] = useState([]);
  const [showItemOptionGroupManager, setShowItemOptionGroupManager] =
    useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    short_description: "",
    long_description: "",
    price: "",
    discount_price: "",
    pwp_price: "",
    packaging_price: "",
    status: "",
    categories: [],
    variations: [],
    availability: {
      type: "regular",
      regular: [
        {
          day_of_week: 0,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
        {
          day_of_week: 1,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
        {
          day_of_week: 2,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
        {
          day_of_week: 3,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
        {
          day_of_week: 4,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
        {
          day_of_week: 5,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
        {
          day_of_week: 6,
          is_enabled: false,
          start_time: "00:00",
          end_time: "23:59",
        },
      ],
      seasonal: {
        start_date: "",
        end_date: "",
        start_time: "00:00",
        end_time: "23:59",
      },
    },
    images: [],
    existing_images: [],
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [optionGroups, setOptionGroups] = useState([]);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showCollectionTime, setShowCollectionTime] = useState([]);
  const [availableOptionGroups, setAvailableOptionGroups] = useState([]);
  const [showOptionGroupSelect, setShowOptionGroupSelect] = useState(false);
  const [showEditOptionGroup, setShowEditOptionGroup] = useState(false);
  const [editingOptionGroup, setEditingOptionGroup] = useState(null);

  const [showAddOptionItemModal, setShowAddOptionItemModal] = useState(false);

  const [currentOptionGroup, setCurrentOptionGroup] = useState(null);

  const [OptionGroupsTotalCount, setOptionGroupsTotalCount] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const [variationsList, setVariationsList] = useState([]);
  const [showOptionPanel, setShowOptionPanel] = useState(null);
  const [variationTags, setVariationTags] = useState({});
  const [currentVariationIndex, setCurrentVariationIndex] = useState(null);
  const [showVariationOptionManager, setShowVariationOptionManager] =
    useState(false);
  const [itemTags, setItemTags] = useState([]);
  const [originalItemTags, setOriginalItemTags] = useState([]);

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [newTagIcon, setNewTagIcon] = useState(null);
  const [showCreateTag, setShowCreateTag] = useState(false);

  const [isEditOptionItemOpen, setIsEditOptionItemOpen] = useState(false);
  const [editOptionItemData, setEditOptionItemData] = useState(null);

  const [collapsed, isHamburger] = useSidebar();

  // const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMapping = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionGroupSelect && !event.target.closest(".relative")) {
        setShowOptionGroupSelect(false);
      }
      if (showCategorySelect && !event.target.closest(".relative")) {
        setShowCategorySelect(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionGroupSelect, showCategorySelect]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        setTagLoading(true);
        const response = await tagService.getTagList();
        setAvailableTags(response.data || []);
      } catch (error) {
        console.error("Error loading tags:", error);
        setErrors((prev) => ({
          ...prev,
          tags: "Failed to load tags. Please try again.",
        }));
      } finally {
        setTagLoading(false);
      }
    };

    loadTags();
  }, []);

  const renderCategoryWarning = () => {
    if (formData.categories.length === 0) {
      return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded mt-2 text-sm">
          <div className="flex items-center">
            <Info size={16} className="mr-2" />
            <span>
              Items without categories will appear in "Other's Items" section
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const loadOptionGroups = async () => {
    try {
      const optionGroupsResponse =
        await optionGroupService.getOptionGroupList();
      const allOptionGroups = (optionGroupsResponse.data || []).map((g) => ({
        ...g,
        optionCount: g.optionCount ?? (g.options ? g.options.length : 0),
      }));

      setAvailableOptionGroups(allOptionGroups);
    } catch (error) {
      console.error("Error loading data:", error);
      setErrors({ general: "Failed to load data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const categoriesResponse = await categoryService.getCategories();
      setCategories(categoriesResponse.data || []);
      const validCategoryIds = (categoriesResponse.data || []).map(
        (cat) => cat.id
      );

      setFormData((prev) => ({
        ...prev,
        categories: (prev.categories || []).filter((id) =>
          validCategoryIds.includes(id)
        ),
      }));

      const optionGroupsResponse =
        await optionGroupService.getOptionGroupList();
      const allOptionGroups = (optionGroupsResponse.data || []).map((g) => ({
        ...g,
        optionCount: g.optionCount ?? (g.options ? g.options.length : 0),
      }));

      const totalCount = allOptionGroups.reduce(
        (count, group) => count + (group.optionCount || 0),
        0
      );

      if (id) {
        const itemResponse = await itemService.getMenuItem(id);

        console.log("Item response:", itemResponse.data);

        const itemData = Array.isArray(itemResponse.data)
          ? itemResponse.data[0]
          : itemResponse.data || itemResponse;

        const mergedOptionGroups = (itemData.menu_option_group || []).map(
          (g) => {
            const match = allOptionGroups.find((ag) => ag.id == g.id);
            return {
              ...g,
              optionCount:
                match?.optionCount ?? (g.options ? g.options.length : 0),
            };
          }
        );

        // console.log("All Option group", allOptionGroups);
        // console.log("Merged Option Groups:", mergedOptionGroups);

        let availability = {
          type: itemData.availability_type || "regular",
          regular: [
            {
              day_of_week: 0,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
            {
              day_of_week: 1,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
            {
              day_of_week: 2,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
            {
              day_of_week: 3,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
            {
              day_of_week: 4,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
            {
              day_of_week: 5,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
            {
              day_of_week: 6,
              is_enabled: false,
              start_time: "00:00",
              end_time: "23:59",
            },
          ],
          seasonal: {
            start_time: "00:00",
            end_time: "23:59",
          },
        };

        if (
          itemData.availability &&
          Array.isArray(itemData.availability) &&
          itemData.availability.length > 0
        ) {
          if (itemData.availability_type === "seasonal") {
            let seasonalData;

            if (
              Array.isArray(itemData.availability[0]) &&
              itemData.availability[0].length > 0
            ) {
              seasonalData = itemData.availability[0][0];
            } else if (typeof itemData.availability[0] === "object") {
              seasonalData = itemData.availability[0];
            } else {
              seasonalData = {};
            }

            availability.type = "seasonal";
            availability.seasonal = {
              start_date: seasonalData.start_date
                ? seasonalData.start_date.substring(0, 10)
                : "",
              end_date: seasonalData.end_date
                ? seasonalData.end_date.substring(0, 10)
                : "",
              start_time: seasonalData.start_time
                ? seasonalData.start_time.substring(0, 5)
                : "00:00",
              end_time: seasonalData.end_time
                ? seasonalData.end_time.substring(0, 5)
                : "23:59",
            };
            setShowCollectionTime(false);
            setShowCollectionTime(false);
          } else {
            let apiRegular = [];
            if (Array.isArray(itemData.availability[0])) {
              apiRegular = itemData.availability[0];
            } else if (Array.isArray(itemData.availability[0]?.regular)) {
              apiRegular = itemData.availability[0].regular;
            }
            if (Array.isArray(itemData.availability[0])) {
              apiRegular = itemData.availability[0];
            } else if (Array.isArray(itemData.availability[0]?.regular)) {
              apiRegular = itemData.availability[0].regular;
            }

            availability.type = "regular";
            availability.regular = availability.regular.map((defaultDay) => {
              const apiDay = apiRegular.find(
                (day) => parseInt(day.day_of_week) === defaultDay.day_of_week
              );
              if (apiDay) {
                return {
                  day_of_week: defaultDay.day_of_week,
                  is_enabled:
                    apiDay.is_enabled === "1" || apiDay.is_enabled === 1,
                  start_time: apiDay.start_time
                    ? apiDay.start_time.substring(0, 5)
                    : defaultDay.start_time,
                  end_time: apiDay.end_time
                    ? apiDay.end_time.substring(0, 5)
                    : defaultDay.end_time,
                };
              }
              return defaultDay;
            });

            const hasEnabledDay = availability.regular.some(
              (day) => day.is_enabled
            );
            setShowCollectionTime(hasEnabledDay);
          }
        }

        const transformedVariations = itemData.variation
          ? itemData.variation.map((v) => ({
              id: v.variation?.id,
              title: v.variation?.title || "",
              name: v.variation?.title || "",
              price: v.variation?.price || "",
              order_index: v.variation?.order_index || 0,
              tags: v.tags || [],
              optionGroups:
                v.option_groups?.map((og, idx) => {
                  const match = allOptionGroups.find((aog) => aog.id == og.id);
                  return {
                    ...og,
                    optionCount:
                      match?.optionCount ??
                      (og.options ? og.options.length : 0),
                    order_index: og.order_index !== 0 ? og.order_index : idx, // fallback to idx if missing
                  };
                }) || [],
              images: v.variation?.images || [],
              existingImages: v.variation?.images || [],
            }))
          : [];
        // console.log("Transform Variation", transformedVariations);
        setVariationsList(transformedVariations);

        const initialVariationTags = {};
        transformedVariations.forEach((variation, index) => {
          if (variation.tags && variation.tags.length > 0) {
            initialVariationTags[index] = variation.tags.map((tag) => tag.id);
          }
        });
        setVariationTags(initialVariationTags);

        setFormData({
          id: itemData.id,
          title: itemData.title || "",
          short_description: itemData.short_description || "",
          long_description: itemData.long_description || "",
          pwp_price: itemData.pwp_price ? parseFloat(itemData.pwp_price) : null,
          packaging_price: itemData.packaging_price?.toString() || "",
          price: itemData.price?.toString() || "",
          discount_price: itemData.discount_price?.toString() || "",
          status: itemData.status || "",
          categories: itemData.category?.map((cat) => cat.id) || [],
          variations: transformedVariations,
          menu_option_group: mergedOptionGroups,
          availability: availability,
          images: [],
          existing_images: itemData.image || [],
        });
        setItemTags(itemData.menu_tag?.map((tag) => tag.id) || []);
        setOriginalItemTags(itemData.menu_tag?.map((tag) => tag.id) || []);
        // setOptionGroups(itemData.menu_option_group || []);
        setOptionGroups(mergedOptionGroups);
      }

      setAvailableOptionGroups(allOptionGroups);
      // setOptionGroupsTotalCount(totalCount);
    } catch (error) {
      console.error("Error loading data:", error);
      setErrors({ general: "Failed to load data. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   console.log("Form Data:", formData);
  // }, [formData]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title || (formData.title && !formData.title.trim())) {
      newErrors.title = "Item name is required";
    }

    if (
      !formData.price ||
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = "Valid price is required";
    }

    console.log("Validation errors:", newErrors); // Debugging

    if (
      formData.pwp_price !== null &&
      formData.pwp_price !== "" &&
      !isNaN(parseFloat(formData.pwp_price))
    ) {
      if (parseFloat(formData.pwp_price) >= parseFloat(formData.price)) {
        newErrors.pwp_price = "PWP price must be lower than the base price";
      }
    }

    formData.variations.forEach((variation, index) => {
      if (!variation.title || !variation.title.trim()) {
        newErrors[`variation_${index}_title`] = "Variation name is required";
      }
      if (
        !variation.price ||
        isNaN(parseFloat(variation.price)) ||
        parseFloat(variation.price) <= 0
      ) {
        newErrors[`variation_${index}_price`] =
          "Valid variation price is required";
      }
    });

    if (formData.availability.type === "seasonal") {
      if (!formData.availability.seasonal.start_date) {
        newErrors.seasonal_start_date =
          "Start date is required for seasonal items";
      }
      if (!formData.availability.seasonal.end_date) {
        newErrors.seasonal_end_date = "End date is required for seasonal items";
      }
      if (
        formData.availability.seasonal.start_date &&
        formData.availability.seasonal.end_date
      ) {
        if (
          new Date(formData.availability.seasonal.start_date) >=
          new Date(formData.availability.seasonal.end_date)
        ) {
          newErrors.seasonal_date_range = "End date must be after start date";
        }
      }
    }

    if (formData.availability.type === "seasonal") {
      if (!formData.availability.seasonal.start_date) {
        newErrors.seasonal_start_date =
          "Start date is required for seasonal items";
      }
      if (!formData.availability.seasonal.end_date) {
        newErrors.seasonal_end_date = "End date is required for seasonal items";
      }
      if (
        formData.availability.seasonal.start_date &&
        formData.availability.seasonal.end_date
      ) {
        if (
          new Date(formData.availability.seasonal.start_date) >=
          new Date(formData.availability.seasonal.end_date)
        ) {
          newErrors.seasonal_date_range = "End date must be after start date";
        }
      }
    }

    // Validate variations and their required images
    variationsList.forEach((variation, index) => {
      if (!variation.title) {
        newErrors[`variation_${index}_name`] = `Variation ${
          index + 1
        } name is required`;
      }

      if (
        !variation.price ||
        isNaN(parseFloat(variation.price)) ||
        parseFloat(variation.price) <= 0
      ) {
        newErrors[`variation_${index}_price`] = `Variation ${
          index + 1
        } must have a valid price`;
      }

      // Check if variation has at least one image (new or existing)
      const hasNewImages = variation.images && variation.images.length > 0;
      const hasExistingImages =
        variation.existingImages &&
        (Array.isArray(variation.existingImages)
          ? variation.existingImages.length > 0
          : variation.existingImages);

      if (!hasNewImages && !hasExistingImages) {
        newErrors[
          `variation_${index}_images`
        ] = `Please upload an image for the variation.`;
        toast.error(
          `Please upload an image for "${
            variation.name || variation.title || `Variation ${index + 1}`
          }".`
        );
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => {
      const currentCategories = prev.categories || [];
      const updatedCategories = currentCategories.includes(categoryId)
        ? currentCategories.filter((id) => id !== categoryId)
        : [...currentCategories, categoryId];

      return {
        ...prev,
        categories: updatedCategories,
      };
    });
  };

  const handleAvailabilityChange = (dayOfWeek, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        regular: prev.availability.regular.map((day) =>
          day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
        ),
      },
    }));

    if (field === "is_enabled") {
      const updatedRegular = formData.availability.regular.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
      );
      const hasEnabledDay = updatedRegular.some((day) => day.is_enabled);
      setShowCollectionTime(hasEnabledDay);
    }
  };

  const handleVariationOptionGroupSelect = (selectedGroups) => {
    if (currentVariationIndex !== null) {
      const updatedGroups = Array.isArray(selectedGroups)
        ? selectedGroups.map((group, idx) => ({
            ...group,
            optionCount: group.optionCount || group.options?.length || 0,
            order_index: idx,
          }))
        : [];

      // Update both variationsList and formData.variations
      setVariationsList((prev) =>
        prev.map((variation, i) =>
          i === currentVariationIndex
            ? {
                ...variation,
                optionGroups: updatedGroups,
              }
            : variation
        )
      );

      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((variation, i) =>
          i === currentVariationIndex
            ? {
                ...variation,
                optionGroups: updatedGroups,
              }
            : variation
        ),
      }));
    }
    setShowVariationOptionManager(false);
    setCurrentVariationIndex(null);
  };
  const handleCollectionTimeToggle = (enabled) => {
    setShowCollectionTime(enabled);

    if (!enabled) {
      setFormData((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          regular: prev.availability.regular.map((day) => ({
            ...day,
            is_enabled: false,
          })),
        },
      }));
    }
  };

  const handleVariationChange = (index, field, value) => {
    setVariationsList((prev) =>
      prev.map((variation, i) =>
        i === index ? { ...variation, [field]: value } : variation
      )
    );

    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation, i) =>
        i === index ? { ...variation, [field]: value } : variation
      ),
    }));
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const addTags = () => {
    if(currentVariationIndex !== null) {
      if(variationTags[currentVariationIndex] != undefined) {
        if(itemTags.length != variationTags[currentVariationIndex].length) {
          variationTags[currentVariationIndex] = itemTags;
          setVariationTags(variationTags);
        }
      }
    }
    // console.log(selectedTags);
    if (selectedTags.length > 0) {
      if (currentVariationIndex !== null) {
        setVariationTags((prev) => {
          const currentTags = prev[currentVariationIndex] || [];
          const newTags = selectedTags.filter(
            (tagId) => !currentTags.includes(tagId)
          );
          return {
            ...prev,
            [currentVariationIndex]: [...currentTags, ...newTags],
          };
        });
        setItemTags(originalItemTags);
      } else {
        setItemTags((prev) => {
          const newTags = selectedTags.filter((tagId) => !prev.includes(tagId));
          return [...prev, ...newTags];
        });
      }
      setSelectedTags([]);
    }
    setShowTagsModal(false);
    setCurrentVariationIndex(null);
  };

  const clearError = (field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleTagsModel = () => {
    setCurrentVariationIndex(null);
    setShowTagsModal(true);
  };

  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) {
      setErrors((prev) => ({
        ...prev,
        newTag: "Tag title is required",
      }));
      return;
    }

    try {
      setTagLoading(true);

      const tagData = {
        title: newTagTitle.trim(),
        icon: newTagIcon,
      };

      const validation = tagService.validateTagData(tagData);
      if (!validation.isValid) {
        setErrors((prev) => ({
          ...prev,
          newTag: Object.values(validation.errors).join(", "),
        }));
        return;
      }

      const response = await tagService.createTag(tagData);
      // Refetch the tag list to get the latest tags (including the new one)
      const fetchResponse = await tagService.getTagList();
      const tags = fetchResponse.data || [];
      setAvailableTags(tags);

      // Find the newly created tag by title (or other unique property)
      const newTag = tags.find((tag) => tag.title === tagData.title);
      if (newTag) {
        setSelectedTags((prev) => [...prev, newTag.id]);
      }

      setNewTagTitle("");
      setNewTagIcon(null);
      setShowCreateTag(false);

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.newTag;
        return newErrors;
      });
    } catch (error) {
      console.error("Error creating tag:", error);
      setErrors((prev) => ({
        ...prev,
        newTag: error.message || "Failed to create tag. Please try again.",
      }));
    } finally {
      setTagLoading(false);
    }
  };

  const removeItemTag = (tagId) => {
    setItemTags((prev) => prev.filter((id) => id !== tagId));
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm("Are you sure you want to delete this tag?")) {
      return;
    }

    try {
      setTagLoading(true);
      await tagService.deleteTag(tagId);

      setAvailableTags((prev) => prev.filter((tag) => tag.id !== tagId));

      setSelectedTags((prev) => prev.filter((id) => id !== tagId));
    } catch (error) {
      console.error("Error deleting tag:", error);
      setErrors((prev) => ({
        ...prev,
        tags: error.message || "Failed to delete tag. Please try again.",
      }));
    } finally {
      setTagLoading(false);
    }
  };

  const handleTagIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          newTag: "Icon must be a valid image file (JPEG, PNG)",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          newTag: "Icon file size must be less than 5MB",
        }));
        return;
      }

      setNewTagIcon(file);

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.newTag;
        return newErrors;
      });
    }
  };

  const addNewVariation = () => {
    const newVariation = {
      title: "",
      price: "",
      tags: [],
      optionGroups: [],
      images: [],
    };

    setVariationsList((prev) => [...prev, newVariation]);

    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, newVariation],
    }));
  };

  const removeVariation = (index) => {
    setVariationsList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      console.log("🔹 Updated variationsList:", updated);
      return updated;
    });

    setFormData((prev) => {
      const updated = prev.variations.filter((_, i) => i !== index);
      console.log("🔹 Updated formData.variations:", updated);
      return {
        ...prev,
        variations: updated,
      };
    });

    setVariationTags((prev) => {
      const newTags = { ...prev };
      delete newTags[index];
      const reindexedTags = {};
      Object.keys(newTags).forEach((key) => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexedTags[numKey - 1] = newTags[key];
        } else {
          reindexedTags[key] = newTags[key];
        }
      });
      console.log("🔹 Updated variationTags:", reindexedTags);
      return reindexedTags;
    });
  };

  const updateVariation = (index, field, value) => {
    setVariationsList((prev) =>
      prev.map((variation, i) =>
        i === index ? { ...variation, [field]: value } : variation
      )
    );

    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation, i) =>
        i === index ? { ...variation, [field]: value } : variation
      ),
    }));
  };

  const toggleOptionsPanel = (index) => {
    setShowOptionPanel(showOptionPanel === index ? null : index);
  };

  const removeVariationOptionGroup = (variationIndex, groupId) => {
    setVariationsList((prev) => {
      const updated = prev.map((variation, i) =>
        i === variationIndex
          ? {
              ...variation,
              optionGroups:
                variation.optionGroups?.filter((g) => g.id !== groupId) || [],
            }
          : variation
      );
      console.log("Updated variationsList:", updated);
      return updated;
    });

    setFormData((prev) => {
      const updated = prev.variations.map((variation, i) =>
        i === variationIndex
          ? {
              ...variation,
              optionGroups:
                variation.optionGroups?.filter((g) => g.id !== groupId) || [],
            }
          : variation
      );
      console.log("Updated formData.variations:", updated);
      return {
        ...prev,
        variations: updated,
      };
    });
  };

  const handleVariationImageUpload = (variationIndex, event) => {
    const files = Array.from(event.target.files);
    console.log(files);

    if (files.length > 0) {
      setVariationsList((prev) =>
        prev.map((variation, i) => {
          if (i === variationIndex) {
            const updatedImages = [
              // ...(Array.isArray(variation.images) ? variation.images : []),
              ...files,
            ];
            console.log(updatedImages);

            return {
              ...variation,
              variation: {
                ...variation.variation,
                images: updatedImages[updatedImages.length - 1],
              },
              images: updatedImages,
            };
          }
          return variation;
        })
      );

      setFormData((prev) => ({
        ...prev,
        variations: prev.variations.map((variation, i) => {
          if (i === variationIndex) {
            const updatedImages = [
              // ...(Array.isArray(variation.images) ? variation.images : []),
              ...files,
            ];

            return {
              ...variation,
              variation: {
                ...variation.variation,
                images: updatedImages[updatedImages.length - 1],
              },
              images: updatedImages,
            };
          }
          return variation;
        }),
      }));
    }

    event.target.value = "";
  };

  const removeVariationImage = (variationIndex, imageIndex) => {
    setVariationsList((prev) =>
      prev.map((variation, i) => {
        if (i === variationIndex) {
          const imagesArray = Array.isArray(variation.images)
            ? variation.images
            : [];
          const existingImagesArray = Array.isArray(variation.existingImages)
            ? variation.existingImages
            : [];

          const removedImage =
            imagesArray[imageIndex] || existingImagesArray[imageIndex];

          if (
            typeof removedImage === "string" &&
            removedImage.startsWith("http")
          ) {
            setDeletedImages((prevDeleted) => [...prevDeleted, removedImage]);
          }

          return {
            ...variation,
            images: imagesArray.filter((_, ii) => ii !== imageIndex),
            existingImages: existingImagesArray.filter(
              (_, ii) => ii !== imageIndex
            ),
          };
        }
        return variation;
      })
    );

    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((variation, i) => {
        if (i === variationIndex) {
          const imagesArray = Array.isArray(variation.images)
            ? variation.images
            : [];
          const existingImagesArray = Array.isArray(variation.existingImages)
            ? variation.existingImages
            : [];
          return {
            ...variation,
            images: imagesArray.filter((_, ii) => ii !== imageIndex),
            existingImages: existingImagesArray.filter(
              (_, ii) => ii !== imageIndex
            ),
          };
        }
        return variation;
      }),
    }));
  };

  const handleVariationTagsModal = async (variationIndex) => {
    setCurrentVariationIndex(variationIndex);

    try {
      setTagLoading(true);
      const response = await tagService.getTagList();
      setAvailableTags(response.data || []);
      setItemTags(variationTags[variationIndex] || []);
    } catch (error) {
      console.error("Error loading tags:", error);
      setErrors((prev) => ({
        ...prev,
        tags: "Failed to load tags. Please try again.",
      }));
    } finally {
      setTagLoading(false);
    }

    setShowTagsModal(true);
  };

  const removeVariationTag = (variationIndex, tagId) => {
    setVariationTags((prev) => ({
      ...prev,
      [variationIndex]: (prev[variationIndex] || []).filter(
        (id) => id !== tagId
      ),
    }));
  };

  const getSelectedTagDetails = (tagId) => {
    if (!tagId) return null;

    const tag = availableTags.find((tag) => tag.id === tagId);
    if (tag) {
      return {
        id: tag.id,
        title: tag.title,
        label: tag.title,
        iconUrl: tag.icon || tag.iconUrl,
      };
    }

    return {
      id: tagId,
      title: `Tag ${tagId}`,
      label: `Tag ${tagId}`,
      iconUrl: null,
    };
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxImages = 5;
    const currentImageCount =
      formData.images.length + formData.existing_images.length;

    if (currentImageCount + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));

    event.target.value = "";
  };

  const mapOptionGroupData = (data = {}) => ({
    id: data.id || null,
    name: data.name ?? (data.title || ""),
    minSelection: data.minSelection ?? (parseInt(data.min_quantity, 10) || 0),
    maxSelection: data.maxSelection ?? (parseInt(data.max_quantity, 10) || 1),
    isOptional: data.isOptional ?? data.is_required === "0",
    options: data.options || [],
  });

  const handleEditOptionGroup = async (group) => {
    try {
      const response = await optionGroupService.getOptionGroup(group.id);
      const data = response.data || response;

      setEditingOptionGroup(mapOptionGroupData(data));
      setShowEditOptionGroup(true);
    } catch (error) {
      console.error("Error fetching option group details:", error);
    }
  };

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setFormData((prev) => {
        const imageId = prev.existing_images[index].id;
        console.log("Removing existing image ID:", imageId); // Debug log

        setDeletedImages((prevDeleted) => {
          const newDeleted = [...prevDeleted, imageId];
          console.log("Updated deleted images:", newDeleted); // Debug log
          return newDeleted;
        });

        return {
          ...prev,
          existing_images: prev.existing_images.filter((_, i) => i !== index),
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSeasonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        seasonal: {
          ...prev.availability.seasonal,
          [field]: value,
        },
      },
    }));
  };

  const handleAvailabilityTypeChange = (type) => {
    setFormData((prev) => {
      if (type === "seasonal") {
        return {
          ...prev,
          availability: {
            ...prev.availability,
            type: "seasonal",
          },
        };
      } else {
        return {
          ...prev,
          availability: {
            ...prev.availability,
            type: "regular",
          },
        };
      }
    });

    if (type === "seasonal") {
      setShowCollectionTime(false);
    } else {
      const hasEnabledDay = formData.availability.regular.some(
        (day) => day.is_enabled
      );
      setShowCollectionTime(hasEnabledDay);
    }
  };

  const handleSave = async () => {
    // console.log("triggered");
    if (!validateForm()) {
      // console.log("Form validation failed");
      return;
    }
    // console.log("validation passed");

    try {
      setSaving(true);

      setFormData((prev) => ({
        ...prev,
        variations: variationsList,
      }));
      console.log("Syncvariations:", formData.variations);

      let availabilityData;
      if (formData.availability.type === "seasonal") {
        availabilityData = [
          {
            start_date: formData.availability.seasonal.start_date,
            end_date: formData.availability.seasonal.end_date,
            start_time: formData.availability.seasonal.start_time,
            end_time: formData.availability.seasonal.end_time,
          },
        ];
      } else {
        availabilityData = [formData.availability.regular];
      }

      const processedVariations = variationsList.map((v, index) => {
        const normalizedOptionGroups = (v.optionGroups || []).map(
          (og, idx) => ({
            ...og,
            order_index: idx,
          })
        );

        console.log("Sync option_groups:", normalizedOptionGroups);

        const variation = {
          // title: v.name || v.title,
          title: v.title,
          price: parseFloat(v.price || 0),
          order_index: v.order_index || index,
          option_groups: normalizedOptionGroups.map((og) => og.id),
          tags: variationTags[index] || [],
          images: v.images || [],
        };

        if (v.id) {
          variation.id = v.id;
        }

        return variation;
      });

      processedVariations.forEach((variation, index) => {
        if (variation.images && variation.images.length > 0) {
          // console.log(`variation_image${index}:`, variation.images);
        } else {
          // console.log(`variation_image${index}: (empty)`);
        }

        if (
          variation.images_compressed &&
          variation.images_compressed.length > 0
        ) {
          console.log(
            `variation_image_compressed${index}:`,
            variation.images_compressed
          );
        } else {
          console.log(`variation_image_compressed${index}: (empty)`);
        }
      });

      console.log("Final submitData:", processedVariations);
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        packaging_price: parseFloat(formData.packaging_price),
        pwp_price: formData.pwp_price ? parseFloat(formData.pwp_price) : null,
        variations: processedVariations,
        status: formData.status,
        menu_option_groups: optionGroups.map((group) => group.id),
        categories: Array.isArray(formData.categories)
          ? formData.categories
          : [],
        availability: availabilityData,
        availability_type: formData.availability.type,
        existing_images: formData.existing_images,
        menu_tag: itemTags.length > 0 ? itemTags : [],
      };
      saveVariationOptionGroupOrderIndex();
      saveItemOptionGroupOrderIndex();

      if (id) {
        await itemService.updateMenuItem(id, submitData);
      } else {
        await itemService.createMenuItem(submitData);
      }

      setDeletedImages([]);
      clearOptionGroupStorage();
      toast.success("Edit Successfully");
      navigate("/menu/item");
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error(error.messages);
      setErrors({ general: "Failed to save item. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    clearOptionGroupStorage();
    navigate(-1);
  };

  const clearOptionGroupStorage = () => {
    const optionGroupsStorageList =
      JSON.parse(sessionStorage.getItem("optionGroupsStorageList")) || [];
    optionGroupsStorageList.forEach((key) => {
      sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem("optionGroupsStorageList");
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(optionGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    console.log("Option Group:", updatedItems);

    setOptionGroups(updatedItems);

    const payload = updatedItems.map((item, index) => ({
      option_group_id: item.id,
      order_index: index,
    }));
    updateItemOptionGroup(payload);
  };

  const updateItemOptionGroup = async (payload) => {
    try {
      await axios.post(
        `${BASE_URL}/menu-item/option-group/order-index/${formData.id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating option group:", error);
    }
  };

  const saveItemOptionGroupOrderIndex = async () => {
    const items = Array.from(optionGroups);
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    const payload = updatedItems.map((item, index) => ({
      option_group_id: item.id,
      order_index: index,
    }));

    console.log("Save Option Group:", payload);
    updateItemOptionGroup(payload);
  };

  const handleAddOptionGroup = (group) => {
    setOptionGroups((prev) => [
      ...prev,
      {
        ...group,
        options: group.options || [],
        optionCount:
          group.optionCount ?? (group.options ? group.options.length : 0),
        order_index: prev.length, // <-- set order_index to the next index
      },
    ]);
    setShowOptionGroupSelect(false);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const handleVariationOptionGroupDragEnd = async (variationIndex, result) => {
    if (!result.destination) return;

    const updatedVariationList = variationsList.map((variation, i) => {
      if (i !== variationIndex) return variation;
      const groups = Array.from(variation.optionGroups || []);
      const [removed] = groups.splice(result.source.index, 1);
      groups.splice(result.destination.index, 0, removed);
      // Update order_index for each group after reordering
      const groupsWithOrder = groups.map((group, idx) => ({
        ...group,
        order_index: idx,
      }));

      return { ...variation, optionGroups: groupsWithOrder };
    });

    console.log("Updated Variation List:", updatedVariationList);

    updateVariationOptionGroup(updatedVariationList);

    console.log(
      "Update Variation Option Groups:",
      updatedVariationList.map((variation) => variation.optionGroups)
    );

    setVariationsList(updatedVariationList);
  };

  const updateVariationOptionGroup = async (variationList) => {
    variationList.map(async (variation) => {
      const payload = variation.optionGroups.map((group) => ({
        option_group_id: group.id,
        order_index: group.order_index,
      }));
      if (variation.id) {
        try {
          await axios.post(
            `${BASE_URL}/menu-item/variation/option-group/order-index/${variation.id}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          console.error("Error updating option groups:", error);
        }
      }
    });
  };

  const saveVariationOptionGroupOrderIndex = async () => {
    const normalizeVariationOptionGroupsOrderIndex = variationsList.map(
      (variation) => ({
        ...variation,
        optionGroups: (variation.optionGroups || []).map((group, idx) => ({
          ...group,
          order_index: idx,
        })),
      })
    );

    updateVariationOptionGroup(normalizeVariationOptionGroupsOrderIndex);
  };

  return (
    <>
      <ToastContainer />
      <div className="bg-white p-6 rounded-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold"> Edit Menu Item</h1>
          <button className="p-1" onClick={handleBack}>
            <X size={24} />
          </button>
        </div>

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        {/* ITEM INFORMATION */}
        <div className="mb-8">
          <div className="bg-indigo-900 text-white py-2 px-4 mb-4">
            <h2 className="text-center text-white text-[18px]">
              ITEM INFORMATION
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-500 mb-1">Name *</label>
              <input
                type="text"
                placeholder="Enter item name"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full border rounded-lg p-3 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 mb-1">
                Short Description
              </label>
              <input
                type="text"
                placeholder="Brief description"
                value={formData.short_description}
                onChange={(e) =>
                  handleInputChange("short_description", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg p-3"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">
                Long Description
              </label>
              <textarea
                placeholder="Detailed description"
                value={formData.long_description}
                onChange={(e) =>
                  handleInputChange("long_description", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg p-3 h-28 resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">Status</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 mb-1">
                Category
                <span className="text-xs text-gray-400 ml-1"></span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategorySelect(!showCategorySelect)}
                  className={`w-full border rounded-lg p-3 text-left flex justify-between items-center ${
                    errors.categories
                      ? "border-red-500"
                      : formData.categories.length === 0
                      ? "border-gray-300"
                      : "border-gray-300"
                  }`}
                >
                  <span
                    className={
                      formData.categories.filter((id) =>
                        categories.some((cat) => cat.id === id)
                      ).length === 0
                        ? "text-gray-400"
                        : "text-gray-900"
                    }
                  >
                    {formData.categories.filter((id) =>
                      categories.some((cat) => cat.id === id)
                    ).length === 0
                      ? "Select categories"
                      : `${
                          formData.categories.filter((id) =>
                            categories.some((cat) => cat.id === id)
                          ).length
                        } category selected`}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {showCategorySelect && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="mr-3"
                        />
                        <span>{category.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.categories && (
                <p className="text-red-500 text-sm mt-1">{errors.categories}</p>
              )}
              {renderCategoryWarning()}
            </div>

            <div>
              <label className="block text-gray-500 mb-1">Base Price *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className={`w-full border rounded-lg p-3 pl-12 ${
                    errors.price ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  RM
                </div>
              </div>
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Discount Price *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.discount_price}
                  onChange={(e) => handleInputChange("discount_price", e.target.value)}
                  className={`w-full border rounded-lg p-3 pl-12 ${
                    errors.discount_price ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  RM
                </div>
              </div>
              {errors.discount_price && (
                <p className="text-red-500 text-sm mt-1">{errors.discount_price}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-2">
                PWP Price (RM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pwp_price}
                  onChange={(e) =>
                    handleInputChange("pwp_price", e.target.value)
                  }
                  className={`w-full border rounded-lg p-3 pl-12 ${
                    errors.pwp_price ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  RM
                </div>
              </div>
              {errors.pwp_price && (
                <p className="text-red-500 text-sm mt-1">{errors.pwp_price}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-500 mb-1">
                Packaging Charges
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.00"
                  value={formData.packaging_price}
                  onChange={(e) =>
                    handleInputChange("packaging_price", e.target.value)
                  }
                  className={`w-full border rounded-lg p-3 pl-12 ${
                    errors.packaging_price
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  RM
                </div>
              </div>
              {errors.packaging_price && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.packaging_price}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-indigo-900 p-1">
            <h3 className="font-medium text-[16px] pl-4 text-white">
              Variations
            </h3>
          </div>
          <div className="border p-4 bg-white rounded-b-lg">
            {/* Display existing variations */}
            {variationsList.length > 0 && (
              <div className="space-y-4 mb-4">
                {variationsList.map((variation, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-lg">
                        {variation.title || `Variation ${index + 1}`}
                      </h4>
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
                        value={variation.title || ""}
                        onChange={(e) =>
                          updateVariation(index, "title", e.target.value)
                        }
                        placeholder="Variations"
                        className="flex-grow p-2 border rounded"
                      />
                      <div className="w-64">
                        <input
                          type="text"
                          value={variation.price || ""}
                          onChange={(e) =>
                            updateVariation(index, "price", e.target.value)
                          }
                          placeholder="Price"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div className="w-40 relative">
                        <div
                          className="w-full p-2 border rounded flex justify-between items-center cursor-pointer"
                          onClick={() => toggleOptionsPanel(index)}
                        >
                          <span>
                            {variation.optionGroups?.length || 0} Option
                            {(variation.optionGroups?.length || 0) !== 1
                              ? "s"
                              : ""}
                          </span>
                          {showOptionPanel === index ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </div>
                      </div>
                    </div>

                    {showOptionPanel === index && (
                      <div className="mt-6 mb-6 bg-gray-200 p-6 rounded-lg">
                        {/* Option Groups Section */}
                        <div className="mb-8">
                          <h4 className="font-semibold text-lg mb-2">
                            Option Groups
                          </h4>
                          {variation.optionGroups?.length > 0 ? (
                            <DragDropContext
                              onDragEnd={(result) =>
                                handleVariationOptionGroupDragEnd(index, result)
                              }
                            >
                              <Droppable
                                droppableId={`variation-optionGroups-${index}`}
                              >
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2 max-h-64 mb-4 overflow-y-auto"
                                  >
                                    {variation.optionGroups.map(
                                      (group, groupIndex) => (
                                        <Draggable
                                          key={group.id || `temp-${groupIndex}`}
                                          draggableId={
                                            group.id
                                              ? group.id.toString()
                                              : `temp-${groupIndex}`
                                          }
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
                                                <div className="font-medium">
                                                  {group.title || group.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                  {group.optionCount || 0}{" "}
                                                  Option |{" "}
                                                  {group.minSelection || 0} Min,{" "}
                                                  {group.maxSelection || 1} Max
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeVariationOptionGroup(
                                                    index,
                                                    group.id
                                                  )
                                                }
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <X size={16} />
                                              </button>
                                            </div>
                                          )}
                                        </Draggable>
                                      )
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          ) : null}

                          <div className="flex justify-center mb-2">
                            <button
                              type="button"
                              className="bg-indigo-900 text-white px-6 py-2 rounded-md flex items-center"
                              onClick={() => {
                                setVariationsList((prev) => [...prev]);
                                console.log("Current variation option groups:", variationsList[index]?.optionGroups);
                                setCurrentVariationIndex(index);
                                setShowVariationOptionManager(true);
                              }}
                            >
                              <span className="mr-1">+</span> Add Option Group
                            </button>
                          </div>
                          <p className="text-center text-gray-600 text-sm">
                            Offer options for your customers to customise their
                            item.
                          </p>
                        </div>

                        <hr className="my-6 border-gray-300" />

                        {/* Tags Section */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-lg mb-2">Tags</h4>

                          {variationTags[index]?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {variationTags[index]?.map((tagId) => {
                                const tagDetails = getSelectedTagDetails(tagId);
                                return (
                                  <div
                                    key={tagId}
                                    className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                  >
                                    {tagDetails?.iconUrl && (
                                      <img
                                        src={tagDetails.iconUrl}
                                        alt={
                                          tagDetails.title || tagDetails.label
                                        }
                                        className="w-3 h-3 object-cover rounded mr-1"
                                      />
                                    )}
                                    <span>
                                      {tagDetails?.title || tagDetails?.label}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariationTag(index, tagId)
                                      }
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
                          <p className="text-center text-gray-600 text-sm">
                            Add tags to the variant to provide more information
                            to your customers
                          </p>
                        </div>

                        <hr className="my-6 border-gray-300" />

                        <div className="mb-4">
                          <h4 className="font-semibold text-lg mb-4">Images</h4>
                          <div className="border p-4 bg-gray-100 rounded-b-lg">
                            <div className="border border-dashed p-8 flex flex-col items-center justify-center">
                              <p className="text-gray-500 text-sm">
                                JPG, PNG, max 10MB
                              </p>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) =>
                                  handleVariationImageUpload(index, e)
                                }
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
                                    src={
                                      variation.variation?.images instanceof
                                      File
                                        ? URL.createObjectURL(
                                            variation.variation.images
                                          )
                                        : variation.variation?.images ||
                                          variation.images ||
                                          variation.images[0]
                                    }
                                    alt={`Variation ${index + 1} Preview`}
                                    className="w-32 h-24 object-cover rounded border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeVariationImage(index, 0)
                                    }
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}
                            {errors[`variation_${index}_images`] && (
                              <p className="text-red-500 text-sm mt-2">
                                {errors[`variation_${index}_images`]}
                              </p>
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
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border rounded"
                onClick={addNewVariation}
              >
                + Add Variation
              </button>
              <p className="text-gray-500 text-sm mt-2">
                Create different variations (such as size, preparation style,
                flavor) of this item. Item variation listed under other items
                category will display as an individual item in option group
                manager.
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMISATION OPTIONS */}
        <div className="mb-8">
          <div className="bg-indigo-900 py-2 px-4 mb-4">
            <h2 className="text-center text-white text-[18px]">
              CUSTOMISATION OPTIONS
            </h2>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="optionGroups">
              {(provided) => (
                <div
                  className="space-y-2"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {optionGroups.map((group, index) => {
                    return (
                      <Draggable
                        key={group.id}
                        draggableId={group.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center bg-gray-200 p-2 rounded"
                          >
                            <span
                              {...provided.dragHandleProps}
                              className="mr-3 cursor-grab text-gray-400 hover:text-gray-600"
                              title="Drag to reorder"
                            >
                              <GripVertical size={18} />
                            </span>
                            <span className="flex-grow">{group.title || group.name}</span>

                            <span className="text-gray-500 text-sm">
                              {typeof group.optionCount === "number"
                                ? group.optionCount
                                : group.options?.length || 0}{" "}
                              Options
                            </span>

                            <button
                              className="p-1 ml-2 text-gray-600"
                              onClick={() => handleEditOptionGroup(group)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-1 text-red-500"
                              onClick={() =>
                                setOptionGroups(
                                  optionGroups.filter((_, i) => i !== index)
                                )
                              }
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="mt-4 flex justify-center">
            {/* <div className="relative">
              <button
                type="button"
                onClick={() => { loadOptionGroups(); setShowOptionGroupSelect(!showOptionGroupSelect); }}
                className="bg-indigo-900 text-white py-2 px-4 rounded flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Option Group
              </button>

              {showOptionGroupSelect && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto w-64">
                  {availableOptionGroups
                    .filter(group => !optionGroups.some(existing => existing.id === group.id))
                    .map(group => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleAddOptionGroup(group)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium">{group.title}</div>
                          <div className="text-sm text-gray-500">
                            {group.optionCount || group.options?.length || 0} options
                          </div>
                        </div>
                      </button>
                    ))}
                  {availableOptionGroups.filter(group => !optionGroups.some(existing => existing.id === group.id)).length === 0 && (
                    <div className="p-3 text-gray-500 text-center">
                      No more option groups available
                    </div>
                  )}
                </div>
              )}
            </div> */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => setShowItemOptionGroupManager(true)}
                className="bg-indigo-900 text-white py-2 px-4 rounded flex items-center"
              >
                <Plus size={16} className="mr-1" /> Add Option Group
              </button>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="py-4">
          <div className="bg-indigo-900">
            <h3 className="font-medium text-[16px] pl-4 text-center text-white">
              TAGS
            </h3>
          </div>
          <div className="p-5 mb-6 space-y-4 bg-white rounded-b-lg">
            {/* Display selected main item tags */}
            {itemTags.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Tags:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {itemTags.map((tagId) => {
                    const tagDetails = getSelectedTagDetails(tagId);
                    return (
                      <div
                        key={tagId}
                        className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tagDetails?.iconUrl && (
                          <img
                            src={tagDetails.iconUrl}
                            alt={tagDetails.title || tagDetails.label}
                            className="w-4 h-4 object-cover rounded mr-2"
                          />
                        )}
                        <span>{tagDetails?.title || tagDetails?.label}</span>
                        <button
                          type="button"
                          onClick={() => removeItemTag(tagId)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border rounded"
              onClick={handleTagsModel}
            >
              + Add Tags
            </button>
            <p className="text-gray-500 text-sm mt-2">
              Add tags to the item to provide more information to your
              customers.
            </p>
          </div>
        </div>

        {/* AVAILABILITY */}
        <div className="mb-8">
          <div className="bg-indigo-900 py-2 px-4 mb-4">
            <h2 className="text-center text-white text-[18px]">AVAILABILITY</h2>
          </div>

          <div className="border p-4 bg-white rounded-lg">
            <div className="flex space-x-8 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="itemType"
                  value="regular"
                  checked={formData.availability.type === "regular"}
                  onChange={() => handleAvailabilityTypeChange("regular")}
                  className="mr-2"
                />
                Regular Item
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="itemType"
                  value="seasonal"
                  checked={formData.availability.type === "seasonal"}
                  onChange={() => handleAvailabilityTypeChange("seasonal")}
                  className="mr-2"
                />
                Seasonal Item
              </label>
            </div>

            {formData.availability.type === "regular" && (
              <div className="bg-gray-100 p-4 rounded-md">
                <h4 className="block text-gray-700 mb-3 text-[16px]">
                  Available Days
                </h4>
                <div className="grid grid-cols-7 gap-4 mb-8">
                  {formData.availability.regular.map((day) => (
                    <div
                      key={day.day_of_week}
                      className="flex flex-col items-center"
                    >
                      <span>{dayMapping[day.day_of_week]}</span>
                      <input
                        type="checkbox"
                        checked={day.is_enabled}
                        onChange={(e) =>
                          handleAvailabilityChange(
                            day.day_of_week,
                            "is_enabled",
                            e.target.checked
                          )
                        }
                        className="mt-1 h-5 w-5"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock size={18} className="mr-2" />
                    <span>Indicate specific collection time</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showCollectionTime}
                      onChange={(e) =>
                        handleCollectionTimeToggle(e.target.checked)
                      }
                      className="sr-only"
                      id="collection-time"
                    />
                    <label
                      htmlFor="collection-time"
                      className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors duration-200 ease-in-out ${
                        showCollectionTime ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                          showCollectionTime ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </label>
                  </div>
                </div>

                {showCollectionTime && (
                  <div className="mt-4 space-y-4">
                    {formData.availability.regular
                      .filter((day) => day.is_enabled)
                      .map((day) => (
                        <div key={day.day_of_week}>
                          <p className="mb-2">{dayMapping[day.day_of_week]}</p>
                          <div className="flex space-x-4">
                            <div className="flex-1">
                              <p className="text-sm text-gray-500 mb-1">From</p>
                              <input
                                type="time"
                                value={day.start_time}
                                onChange={(e) =>
                                  handleAvailabilityChange(
                                    day.day_of_week,
                                    "start_time",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500 mb-1">To</p>
                              <input
                                type="time"
                                value={day.end_time}
                                onChange={(e) =>
                                  handleAvailabilityChange(
                                    day.day_of_week,
                                    "end_time",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {formData.availability.type === "seasonal" && (
              <div className="bg-gray-100 p-4 rounded-md">
                <h4 className="block text-gray-700 mb-3 text-[16px]">
                  Seasonal Availability
                </h4>

                {errors.seasonal_date_range && (
                  <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {errors.seasonal_date_range}
                  </div>
                )}

                {errors.seasonal_date_range && (
                  <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {errors.seasonal_date_range}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.availability.seasonal.start_date}
                      onChange={(e) =>
                        handleSeasonalChange("start_date", e.target.value)
                      }
                      className={`w-full p-2 border rounded ${
                        errors.seasonal_start_date
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.seasonal_start_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.seasonal_start_date}
                      </p>
                    )}
                    {errors.seasonal_start_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.seasonal_start_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.availability.seasonal.end_date}
                      onChange={(e) =>
                        handleSeasonalChange("end_date", e.target.value)
                      }
                      className={`w-full p-2 border rounded ${
                        errors.seasonal_end_date
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.seasonal_end_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.seasonal_end_date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-500 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.availability.seasonal.start_time}
                      onChange={(e) =>
                        handleSeasonalChange("start_time", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.availability.seasonal.end_time}
                      onChange={(e) =>
                        handleSeasonalChange("end_time", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ITEM IMAGES */}
        <div className="mb-8">
          <div className="bg-indigo-900 py-2 px-4 mb-4">
            <h2 className="text-center text-white text-[18px]">ITEM IMAGES</h2>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <span className="mr-2">Images</span>
            </div>
            <div className="text-gray-500 text-sm mb-4">
              Minimum 1 image, you may add up to 5 images
            </div>

            <div className="grid grid-cols-5 gap-4 mb-6">
              {/* Existing images */}
              {formData.existing_images.map((image, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative border border-gray-300 rounded-lg"
                >
                  <img
                    src={`${image.image_url}`}
                    alt={`Item ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                    // onError={(e) => {
                    //   e.target.src = '/placeholder-image.png';
                    // }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index, true)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* New images */}
              {formData.images.map((image, index) => (
                <div
                  key={`new-${index}`}
                  className="relative border border-gray-300 rounded-lg"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index, false)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Single add image button */}
              {formData.images.length + formData.existing_images.length < 5 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-gray-50 hover:border-gray-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    multiple
                  />
                  <Plus size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Add Image</span>
                </label>
              )}
            </div>

            <div className="flex justify-end">
              <button
                className="border border-blue-500 text-blue-500 py-2 px-8 rounded-lg"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        {showEditOptionGroup && editingOptionGroup && (
          <OptionGroupManager
            onClose={() => setShowEditOptionGroup(false)}
            onSave={(updatedGroup) => {
              const updateGroupItem = updatedGroup[0];
              const updatedOptionGroups = optionGroups.map((g) => {
                if (String(g.id) === String(updateGroupItem.id)) {
                  const updated = {
                    ...g,
                    ...updateGroupItem,
                    optionCount: updateGroupItem.optionCount,
                    options: updateGroupItem.options || [],
                  };
                  console.log('🔍 Updated group:', updated);
                  return updated;
                }
                return g;
              });
              setOptionGroups(updatedOptionGroups);

              // Also update any variations that use this option group
              const updatedVariations = variationsList.map((variation) => ({
                ...variation,
                optionGroups:
                  variation.optionGroups?.map((group) =>
                    String(group.id) === String(updatedGroup.id)
                      ? { ...group, ...updatedGroup }
                      : group
                  ) || [],
              }));

              setVariationsList(updatedVariations);
              setFormData((prev) => ({
                ...prev,
                variations: updatedVariations,
              }));

              setShowEditOptionGroup(false);
            }}
            currentOption={editingOptionGroup}
            isEdit={true}
            reopen={setShowEditOptionGroup}
          />
        )}
        {showVariationOptionManager && formData?.id !== "" && (
          <div
            className={`
          fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center
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
           <OptionGroupManager
            key={`variationOptionGroups_${currentVariationIndex}_${variationsList[currentVariationIndex]?.optionGroups?.length}`}
            onClose={() => setShowVariationOptionManager(false)}
            onSave={(selectedGroups) => {
              handleVariationOptionGroupSelect(selectedGroups);
            }}
            title="Select Option Groups for Variation"
            keyName={`variationOptionGroups_${currentVariationIndex}`}
            previouslySelectedGroup={
              variationsList[currentVariationIndex]?.optionGroups || []
            }
            reopen={setShowVariationOptionManager}
          />
          </div>
        )}

        {showTagsModal && (
          <div
            className={`
          fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center
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
            <div className="bg-white border rounded-lg w-full max-w-4xl mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {currentVariationIndex !== null
                    ? "Select Tags for Variation"
                    : "Select Tags for Item"}
                </h2>
                <button
                  onClick={() => {setShowTagsModal(false); setItemTags(originalItemTags);}}
                  className="text-gray-500 hover:text-gray-700"
                >
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
                    <div className="flex flex-wrap gap-2 mb-2">
                      {/* Previously added tags */}
                      {itemTags.map((tagId) => {
                        const tagDetails = getSelectedTagDetails(tagId);
                        return (
                          <div
                            key={tagId}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tagDetails?.iconUrl && (
                              <img
                                src={tagDetails.iconUrl}
                                alt={tagDetails.title || tagDetails.label}
                                className="w-4 h-4 object-cover rounded mr-2"
                              />
                            )}
                            <span>
                              {tagDetails?.title || tagDetails?.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItemTag(tagId)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      {/* Currently selected tags (for adding new) */}
                      {selectedTags.map((tagId) => {
                        // Don't show if already in itemTags
                        if (itemTags.includes(tagId)) return null;
                        const tagDetails = getSelectedTagDetails(tagId);
                        return (
                          <div
                            key={tagId}
                            className="flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                          >
                            {tagDetails?.iconUrl && (
                              <img
                                src={tagDetails.iconUrl}
                                alt={tagDetails.title || tagDetails.label}
                                className="w-4 h-4 object-cover rounded mr-2"
                              />
                            )}
                            <span>
                              {tagDetails?.title || tagDetails?.label}
                            </span>
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
                      {/* If no tags at all */}
                      {itemTags.length === 0 && selectedTags.length === 0 && (
                        <p className="text-gray-400 text-sm">No tag selected</p>
                      )}
                    </div>
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
                      {showCreateTag ? "Cancel" : "+ Create New"}
                    </button>
                  </div>

                  {showCreateTag && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Tag Title *
                          </label>
                          <input
                            type="text"
                            value={newTagTitle}
                            onChange={(e) => {
                              setNewTagTitle(e.target.value);
                              if (errors.newTag) clearError("newTag");
                            }}
                            placeholder="Enter tag title"
                            className="w-full p-2 border rounded-lg"
                            maxLength="100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Tag Icon (Optional)
                          </label>
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
                            Max 5MB, JPEG/PNG formats
                          </p>
                        </div>

                        {errors.newTag && (
                          <p className="text-red-500 text-sm">
                            {errors.newTag}
                          </p>
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
                      <p className="text-gray-400 text-sm col-span-3">
                        No tags available.
                      </p>
                    )}
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      const isPreviouslySelected = itemTags.includes(tag.id);

                      return (
                        <div
                          key={tag.id}
                          className={`border rounded-lg p-3 transition-all relative group hover:shadow-sm
                        ${
                          isSelected
                            ? "ring-2 ring-indigo-700 bg-indigo-50 shadow-md"
                            : ""
                        }
                        ${
                          isPreviouslySelected && !isSelected
                            ? "ring-2 ring-indigo-700 bg-indigo-50 pointer-events-none opacity-60"
                            : ""
                        }
                        ${
                          isPreviouslySelected && isSelected
                            ? "ring-2 ring-indigo-700 bg-indigo-50 shadow-md pointer-events-none opacity-60"
                            : ""
                        }
                        `}
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
                            onClick={() => {
                              if (!isPreviouslySelected) toggleTag(tag.id);
                            }}
                            className={`cursor-pointer flex items-center ${
                              isPreviouslySelected ? "pointer-events-none" : ""
                            }`}
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
                                    {tag?.title?.charAt(0)?.toUpperCase() || ""}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm truncate">
                                {tag.title}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  onClick={() => {setShowTagsModal(false); setItemTags(originalItemTags);}}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTags}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg transition-colors hover:bg-indigo-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {showItemOptionGroupManager && (
          <OptionGroupManager
            keyName="item_option_group"
            previouslySelectedGroup={optionGroups}
            onClose={() => setShowItemOptionGroupManager(false)}
            onSave={(selectedGroups) => {
              setOptionGroups((prev) => {
                const updated = prev.map((g) => {
                  const match = selectedGroups.find(
                    (sg) => String(sg.id) === String(g.id)
                  );
                  if (match) {
                    return {
                      ...g,
                      ...match,
                      optionCount: match.optionCount, // ✅ always trust modal
                      options: match.options || g.options || [], // keep old options if modal didn’t send them
                    };
                  }
                  return g;
                });

                // Add any brand new groups that weren’t in prev
                selectedGroups.forEach((sg, idx) => {
                  if (!updated.find((g) => String(g.id) === String(sg.id))) {
                    updated.push({
                      ...sg,
                      optionCount: sg.optionCount, // ✅ trust modal
                      options: sg.options || [],
                      order_index: idx,
                    });
                  }
                });

                console.log("✅ Synced optionGroups after modal:", updated);
                return updated;
              });

              setShowItemOptionGroupManager(false);
            }}
            reopen={() => setShowItemOptionGroupManager(true)}
          />
        )}

        {isEditOptionItemOpen && (
          <EditOptionItemModal
            isOpen={isEditOptionItemOpen}
            onClose={() => setIsEditOptionItemOpen(false)}
            onSave={(updatedItem) => {
              console.log("onSave triggered with:", updatedItem); // Add this to debug

              const updatedOptions = [...currentOptionGroup.options];

              updatedOptions[editOptionItemData.index] = {
                ...updatedOptions[editOptionItemData.index],
                ...updatedItem,
                name: updatedItem.title || updatedItem.name,
                title: updatedItem.title || updatedItem.name,
                displayImage:
                  updatedItem.imagePreview ||
                  updatedItem.images ||
                  updatedItem.images_compressed,
              };

              setOptionGroups((prevGroups) => {
                const newGroups = prevGroups.map((group) =>
                  group.id === currentOptionGroup.id
                    ? {
                        ...group,
                        options: updatedOptions,
                        optionCount: updatedOptions.length,
                      } // update count here
                    : group
                );

                return [...newGroups]; // Create a new array reference to force re-render
              });

              setCurrentOptionGroup((prev) => ({
                ...prev,
                options: updatedOptions,
                optionCount: updatedOptions.length,
              }));

              setIsEditOptionItemOpen(false);
            }}
            itemData={editOptionItemData}
            optionGroupData={currentOptionGroup}
          />
        )}
      </div>
    </>
  );
}
