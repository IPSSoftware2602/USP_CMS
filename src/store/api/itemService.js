import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

class ItemService {
  getToken() {
    return sessionStorage.getItem("token");
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }

  async makeFormDataRequest(url, method, formData) {
    try {
      const token = this.getToken();
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async makeJsonRequest(url, method, data = null) {
    try {
      const token = this.getToken();
      const config = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);
      return this.handleResponse(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Get all menu items
  async getMenuItems() {
    const url = `${BASE_URL}menu-item/list`;
    return this.makeJsonRequest(url, "GET");
  }

  // Get single menu item by ID
  async getMenuItem(id) {
    const url = `${BASE_URL}menu-item/${id}`;
    return this.makeJsonRequest(url, "GET");
  }

  // Create quick menu item
  async createQuickMenuItem(itemData) {
    const url = `${BASE_URL}menu-item/createQuick`;
    return this.makeJsonRequest(url, "POST", itemData);
  }

  // Create full menu item with all details
  async createMenuItem(itemData) {
    const url = `${BASE_URL}menu-item/create`;
    const formData = this.buildFormData(itemData);
    return this.makeFormDataRequest(url, "POST", formData);
  }

  // Update menu item
  async updateMenuItem(id, itemData) {
    const url = `${BASE_URL}menu-item/update/${id}`;
    const formData = this.buildFormData(itemData);
    return this.makeFormDataRequest(url, "POST", formData);
  }

  // Update menu item order index
  async updateMenuItemsOrder(orderData) {
    const url = `${BASE_URL}menu-item/index`;
    return this.makeJsonRequest(url, "POST", { menu_order: orderData });
  }
  // Delete menu item
  async deleteMenuItem(id) {
    const url = `${BASE_URL}menu-item/delete/${id}`;
    return this.makeJsonRequest(url, "POST");
  }
  // Sync menu
  async syncMenu() {
    const url = `${BASE_URL}menu-item/sync-menu`;
    return this.makeJsonRequest(url, "POST");
  }

  //pwp create
  async createPwp(itemData) {
    const url = `${BASE_URL}pwp/create`;
    return this.makeJsonRequest(url, "POST", itemData);
  }
  //pwp edit
  async updatePwp(id, itemData) {
    const url = `${BASE_URL}pwp/update/${id}`;
    return this.makeJsonRequest(url, "POST", itemData);
  }
  //pwp show
  async getPwp(id) {
    const url = `${BASE_URL}pwp/show/${id}`;
    return this.makeJsonRequest(url, "GET");
  }
  //pwp show list
  async getPwpList() {
    const url = `${BASE_URL}pwp/list`;
    return this.makeJsonRequest(url, "GET");
  }
  //pwp delete
  async deletePwp(id, itemData) {
    const url = `${BASE_URL}pwp/delete/${id}`;
    return this.makeJsonRequest(url, "POST", itemData);
  }

  buildFormData(itemData) {
    const formData = new FormData();

    // console.log("Building FormData from:", JSON.stringify(itemData, null, 2));
    // console.log("Deleted images:", deletedImages); // Debug log

    if (itemData.title) formData.append("title", itemData.title);
    if (itemData.short_description)
      formData.append("short_description", itemData.short_description);
    if (itemData.long_description)
      formData.append("long_description", itemData.long_description);
    if (itemData.price) formData.append("price", itemData.price.toString());
    if (itemData.discount_price)
      formData.append("discount_price", itemData.discount_price.toString());
    if (itemData.packaging_price)
      formData.append("packaging_price", itemData.packaging_price.toString());
    if (itemData.pwp_price !== undefined && itemData.pwp_price !== null) {
      formData.append("pwp_price", itemData.pwp_price.toString());
    }
    if (itemData.status) formData.append("status", itemData.status);
    if (itemData.order_index !== undefined)
      formData.append("order_index", itemData.order_index.toString());

    // Categories
    if (itemData.categories && Array.isArray(itemData.categories)) {
      if (itemData.categories.length > 0) {
        itemData.categories.forEach((category, index) => {
          const categoryId =
            typeof category === "object" ? category.id : category;
          formData.append(`category[${index}]`, categoryId.toString());
        });
      } else {
        formData.append("category[]", "");
      }

      // Menu tags
      if (itemData.menu_tag && Array.isArray(itemData.menu_tag)) {
        itemData.menu_tag.forEach((tagId, index) => {
          formData.append(`menu_tag[${index}]`, tagId.toString());
        });
      } else if (itemData.menu_tags && Array.isArray(itemData.menu_tags)) {
        itemData.menu_tags.forEach((tagId, index) => {
          formData.append(`menu_tag[${index}]`, tagId.toString());
        });
      }

      // Menu option groups
      if (
        itemData.menu_option_groups &&
        Array.isArray(itemData.menu_option_groups)
      ) {
        itemData.menu_option_groups.forEach((groupId, index) => {
          formData.append(`menu_option_group[${index}]`, groupId.toString());
        });
      }

      // Availability
      if (itemData.availability_type) {
        formData.append("availability[type]", itemData.availability_type);

        if (
          itemData.availability_type === "seasonal" &&
          itemData.availability &&
          Array.isArray(itemData.availability)
        ) {
          const seasonalData = itemData.availability[0];
          if (seasonalData) {
            if (seasonalData.start_date)
              formData.append(
                "availability[seasonal][start_date]",
                seasonalData.start_date
              );
            if (seasonalData.end_date)
              formData.append(
                "availability[seasonal][end_date]",
                seasonalData.end_date
              );
            if (seasonalData.start_time)
              formData.append(
                "availability[seasonal][start_time]",
                seasonalData.start_time
              );
            if (seasonalData.end_time)
              formData.append(
                "availability[seasonal][end_time]",
                seasonalData.end_time
              );
          }
        }

        if (
          itemData.availability_type === "regular" &&
          itemData.availability &&
          Array.isArray(itemData.availability)
        ) {
          const regularData = itemData.availability[0];
          if (regularData && Array.isArray(regularData)) {
            regularData.forEach((schedule, index) => {
              formData.append(
                `availability[regular][${index}][day_of_week]`,
                schedule.day_of_week.toString()
              );
              formData.append(
                `availability[regular][${index}][is_enabled]`,
                schedule.is_enabled ? "1" : "0"
              );
              formData.append(
                `availability[regular][${index}][start_time]`,
                schedule.start_time
              );
              formData.append(
                `availability[regular][${index}][end_time]`,
                schedule.end_time
              );
            });
          }
        }
      }

      // Variation
      if (itemData.variations && Array.isArray(itemData.variations)) {
        itemData.variations.forEach((variation, index) => {
          if (variation.title)
            formData.append(`variation[${index}][title]`, variation.title);
          if (variation.price)
            formData.append(
              `variation[${index}][price]`,
              variation.price.toString()
            );
          if (variation.order_index !== undefined)
            formData.append(
              `variation[${index}][order_index]`,
              variation.order_index.toString()
            );

          formData.append(
            `variation[${index}][id]`,
            variation.id ? variation.id.toString() : ""
          );

          // Variation option groups
          if (
            variation.option_groups &&
            Array.isArray(variation.option_groups)
          ) {
            variation.option_groups.forEach((group, groupIndex) => {
              const groupId = typeof group === "object" ? group.id : group;
              formData.append(
                `variation[${index}][option_group][${groupIndex}]`,
                groupId !== undefined && groupId !== null
                  ? groupId.toString()
                  : ""
              );
            });
          }

          // Variation tags
          if (variation.tags && Array.isArray(variation.tags)) {
            variation.tags.forEach((tag, tagIndex) => {
              const tagId = typeof tag === "object" ? tag.id : tag;
              formData.append(
                `variation[${index}][tag][${tagIndex}]`,
                tagId.toString()
              );
            });
          }

          if (
            variation.images ||
            (Array.isArray(variation.images) && variation.images.length > 0)
          ) {
            // console.log(`Adding ${variation.images.length} images for variation ${index}`);
            if (Array.isArray(variation.images)) {
              variation.images.forEach((image, imageIndex) => {
                if (image instanceof File) {
                  // console.log(`Adding new variation image for variation ${index}:`, image);
                  formData.append(`variation_image${index}`, image);
                } else {
                  // Handle string URLs if any
                  // console.log(`Adding new variation image for variation ${index}:`, image);
                  formData.append(`variation[${index}][images]`, image);
                }
              });
            } else {
              const image = variation.images;
              if (image instanceof File) {
                // console.log(`Adding new variation image for variation ${index}:`, image);
                formData.append(`variation_image${index}`, image);
              } else {
                // Handle string URLs if any
                // console.log(`Adding new variation image for variation ${index}:`, image);
                formData.append(`variation[${index}][images]`, image);
              }
            }
          } else if (
            variation.existingImages ||
            (Array.isArray(variation.existingImages) &&
              variation.existingImages.length > 0)
          ) {
            // If no new images, but we have existing ones
            // console.log(`Adding ${variation.existingImages.length} existing images for variation ${index}`);
            if (Array.isArray(variation.existingImages)) {
              variation.existingImages.forEach((image, imageIndex) => {
                if (image instanceof File) {
                  // console.log(`Adding new variation image for variation ${index}:`, image);
                  formData.append(`variation_image${index}`, image);
                } else {
                  // Handle string URLs if any
                  // console.log(`Adding new variation image for variation ${index}:`, image);
                  formData.append(`variation[${index}][images]`, image);
                }
              });
            } else {
              const image = variation.existingImages;
              if (image instanceof File) {
                // console.log(`Adding new variation image for variation ${index}:`, image);
                formData.append(`variation_image${index}`, image);
              } else {
                // Handle string URLs if any
                // console.log(`Adding new variation image for variation ${index}:`, image);
                formData.append(`variation[${index}][images]`, image);
              }
            }
          } else {
            // Explicitly indicate this variation has no image
            console.log(`No image for variation ${index}`);
            formData.append(`variation_image${index}`, "");
          }

          // if (variation.images && Array.isArray(variation.images) && variation.images.length > 0) {
          //   console.log(`Adding ${variation.images.length} images for variation ${index}`);
          //   variation.images.forEach((image, imageIndex) => {
          //     if (image instanceof File) {
          //       console.log(`Adding variation image for variation ${index}:`, image.name);
          //       formData.append(`variation_image${index}`, image);
          //     }
          //   });
          // }

          // if (variation.existing_images && Array.isArray(variation.existing_images)) {
          //   variation.existing_images.forEach((image, imageIndex) => {
          //     const imageId = typeof image === 'object' ? image.id : image;
          //     formData.append(`variation_image${index}`, imageId.toString());
          //   });
          // }
        });
      }

      // Images
      if (itemData.images && Array.isArray(itemData.images)) {
        itemData.images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append(`image[${index}]`, image);
          }
        });
      }

      // Existing images
      if (itemData.existing_images && Array.isArray(itemData.existing_images)) {
        itemData.existing_images.forEach((image, index) => {
          formData.append(`existing_image[${index}]`, image.id);
        });
      }

      return formData;
    }
  }

  transformApiItemToComponent(apiItem) {
    return {
      id: apiItem.id,
      name: apiItem.title,
      optionGroups: apiItem.menu_option_group || [],
      price: parseFloat(apiItem.price) || 0,
      image: apiItem.images?.[0]?.url || apiItem.image,
      selected: false,
      categoryId: Array.isArray(apiItem.categories)
        ? apiItem.categories[0]?.id
        : apiItem.category_id || apiItem.categoryId || null,

      category: apiItem.category || [],
      status: apiItem.status,
      short_description: apiItem.short_description,
      long_description: apiItem.long_description,
      variations: apiItem.variation_group || [], // Use variation_group instead of variations
      availability: apiItem.availability || null,
      menuOptionGroups: apiItem.menu_option_group || [],
      order_index: parseInt(apiItem.order_index || 0),
      hasVariations:
        (apiItem.variation_group && apiItem.variation_group.length > 0) ||
        false,
    };
  }

  transformComponentItemToApi(componentItem) {
    return {
      title: componentItem.name,
      price: componentItem.price,
      status: componentItem.status || "active",
      menu_tag: componentItem.menu_tag || [],
      short_description: componentItem.short_description || "",
      long_description: componentItem.long_description || "",
      categories: componentItem.categoryId ? [componentItem.categoryId] : [],
      // order_index: componentItem.order_index || 0
    };
  }
}

const itemService = new ItemService();
export default itemService;
