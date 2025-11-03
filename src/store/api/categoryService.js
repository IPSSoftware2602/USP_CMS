import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

class CategoryService {
  setToken(token) {
    sessionStorage.setItem('token', token);
  }

  getHeaders(isFormData = false) {
    const headers = {};
    
    const token = sessionStorage.getItem('token');
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  }

  // Get all categories
  async getCategories() {
    try {
      const response = await fetch(`${BASE_URL}menu-category/list`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await this.handleResponse(response);
      
      let categoriesArray;
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (data.result && Array.isArray(data.result)) {
        categoriesArray = data.result;
      } else {
        categoriesArray = [];
      }
      
      return {
        data: categoriesArray.map(category => this.transformApiCategoryToComponent(category))
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get single category by 
  async getCategory(id) {
    try {
      const response = await fetch(`${BASE_URL}menu-category/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await this.handleResponse(response);
      
      let categoryData;
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        categoryData = data.data[0];
      } else if (data.data && !Array.isArray(data.data)) {
        categoryData = data.data;
      } else if (!data.data) {
        categoryData = data;
      } else {
        throw new Error('Category not found or invalid response structure');
      }

      return this.transformApiCategoryToComponent(categoryData);
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  async getCategoryById(categoryId) {
    return this.getCategory(categoryId);
  }

  async createCategory(categoryData, imageFile = null) {
    try {
      const validation = this.validateCategoryData(categoryData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }

      const formData = new FormData();
      
      const title = categoryData.title || categoryData.name;
      formData.append('title', title);
      formData.append('description', categoryData.description || '');
      formData.append('status', categoryData.status || 'active');
      
      if (categoryData.orderIndex !== undefined) {
        formData.append('order_index', categoryData.orderIndex);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${BASE_URL}menu-category/create`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData
      });
      const data = await this.handleResponse(response);
      return this.transformApiCategoryToComponent(data.data || data);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Create quick category (text only)
  async createQuickCategory(title) {
    try {
      if (!title || !title.trim()) {
        throw new Error('Category title is required');
      }

      const response = await fetch(`${BASE_URL}menu-category/createQuick`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ title: title.trim() })
      });

      const data = await this.handleResponse(response);
      return this.transformApiCategoryToComponent(data);
    } catch (error) {
      console.error('Error creating quick category:', error);
      throw error;
    }
  }

  // Update category
  async updateCategory(id, categoryData, imageFile = null) {
    try {
      const validation = this.validateCategoryData(categoryData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }

      const formData = new FormData();
      
      const title = categoryData.title || categoryData.name;
      formData.append('title', title);
      formData.append('description', categoryData.description || '');
      formData.append('status', categoryData.status || 'active');
      
      if (categoryData.orderIndex !== undefined) {
        formData.append('order_index', categoryData.orderIndex);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${BASE_URL}menu-category/update/${id}`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData
      });

      const data = await this.handleResponse(response);
      return this.transformApiCategoryToComponent(data);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async updateCategoriesOrder(orderData) {
    try {
      const response = await fetch(`${BASE_URL}menu-category/index`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ category_order: orderData })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating categories order:', error);
      throw error;
    }
  }

  // Delete category
  async deleteCategory(id) {
    try {
      const response = await fetch(`${BASE_URL}menu-category/delete/${id}`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  transformApiCategoryToComponent(apiCategory) {
    console.log('Transforming API Category:', apiCategory);
    if (!apiCategory) return null;
    
    return {
      id: apiCategory.id,
      name: apiCategory.name || apiCategory.title,
      title: apiCategory.title || apiCategory.name,
      description: apiCategory.description,
      status: apiCategory.status || 'active',
      image: apiCategory.image || apiCategory.image_url || null,
      orderIndex: parseInt(apiCategory.order_index || apiCategory.orderIndex || 0, 10),
      createdAt: apiCategory.created_at || apiCategory.createdAt,
      updatedAt: apiCategory.updated_at || apiCategory.updatedAt,
      viewMode: apiCategory.view_mode || apiCategory.viewMode || '',
      backgroundColor: apiCategory.background_color || apiCategory.backgroundColor || ''
    };
  }

  transformComponentCategoryToApi(componentCategory) {
    if (!componentCategory) return null;
    
    return {
      title: componentCategory.title || componentCategory.name,
      name: componentCategory.name || componentCategory.title,
      description: componentCategory.description || '',
      status: componentCategory.status || 'active',
      order_index: componentCategory.orderIndex || 0
    };
  }

  validateCategoryData(categoryData) {
    const errors = {};
    
    const nameField = categoryData.name || categoryData.title;
    if (!nameField || !nameField.trim()) {
      errors.name = 'Category name/title is required';
    }
    
    if (nameField && nameField.length > 100) {
      errors.name = 'Category name/title must be less than 100 characters';
    }
    
    if (categoryData.status && !['active', 'inactive'].includes(categoryData.status)) {
      errors.status = 'Status must be either "active" or "inactive"';
    }
    
    if (categoryData.orderIndex !== undefined && 
        (isNaN(categoryData.orderIndex) || categoryData.orderIndex < 0)) {
      errors.orderIndex = 'Order index must be a non-negative number';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  async createMultipleCategories(categoriesData) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < categoriesData.length; i++) {
      try {
        const result = await this.createCategory(categoriesData[i]);
        results.push(result);
      } catch (error) {
        errors.push({
          index: i,
          data: categoriesData[i],
          error: error.message
        });
      }
    }
    
    return { results, errors };
  }

  async updateMultipleCategories(updates) {
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateCategory(update.id, update.data, update.imageFile);
        results.push(result);
      } catch (error) {
        errors.push({
          id: update.id,
          error: error.message
        });
      }
    }
    
    return { results, errors };
  }

  async searchCategories(searchTerm) {
    try {
      const categories = await this.getCategories();
      
      if (!searchTerm || !searchTerm.trim()) {
        return categories;
      }
      
      const term = searchTerm.toLowerCase().trim();
      return categories.filter(category => 
        (category.name && category.name.toLowerCase().includes(term)) ||
        (category.title && category.title.toLowerCase().includes(term)) ||
        (category.description && category.description.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  }

  filterCategoriesByStatus(categories, status) {
    return categories.filter(category => category.status === status);
  }

  sortCategoriesByOrder(categories) {
    return [...categories].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }
}

const categoryService = new CategoryService();

export default categoryService;