import {VITE_API_BASE_URL} from "../../constant/config";

const BASE_URL =  VITE_API_BASE_URL;

class TagService {
  constructor() {
    this.baseURL = `${BASE_URL}tag`;
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }

  // Get all tags
  async getTagList() {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.baseURL}/list`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching tag list:', error);
      throw error;
    }
  }

  // Get single tag by ID
  async getTag(tagId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.baseURL}/${tagId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching tag ${tagId}:`, error);
      throw error;
    }
  }

  // Create new tag
  async createTag(tagData) {
    try {
      const formData = new FormData();
      const token = this.getToken();
      
      if (tagData.title) {
        formData.append('title', tagData.title);
      }
      
      if (tagData.icon) {
        formData.append('icon', tagData.icon);
      }

      const response = await fetch(`${this.baseURL}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Update existing tag
  async updateTag(tagId, tagData) {
    try {
      const formData = new FormData();
      const token = this.getToken();
      
      if (tagData.title) {
        formData.append('title', tagData.title);
      }
      
      if (tagData.icon) {
        formData.append('icon', tagData.icon);
      }

      const response = await fetch(`${this.baseURL}/update/${tagId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating tag ${tagId}:`, error);
      throw error;
    }
  }

  // Delete tag
  async deleteTag(tagId) {
    try {
      const formData = new FormData();
      const token = this.getToken();
      
      const response = await fetch(`${this.baseURL}/delete/${tagId}`, {
        method: 'POST',
        headers : {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  }

  validateTagData(tagData) {
    const errors = {};
    
    if (!tagData.title || tagData.title.trim().length === 0) {
      errors.title = 'Tag title is required';
    }
    
    if (tagData.title && tagData.title.trim().length > 100) {
      errors.title = 'Tag title must be less than 100 characters';
    }
    
    if (tagData.icon) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!validTypes.includes(tagData.icon.type)) {
        errors.icon = 'Icon must be a valid image file (JPEG, PNG, GIF)';
      }
      
      if (tagData.icon.size > maxSize) {
        errors.icon = 'Icon file size must be less than 5MB';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  transformApiTagToComponent(apiTag) {
    return {
      id: apiTag.id,
      title: apiTag.title,
      name: apiTag.title,
      icon: apiTag.icon,
      iconUrl: apiTag.icon_url || apiTag.iconUrl,
      createdAt: apiTag.created_at || apiTag.createdAt,
      updatedAt: apiTag.updated_at || apiTag.updatedAt,
    };
  }

  transformComponentTagToApi(componentTag) {
    return {
      title: componentTag.title || componentTag.name,
      icon: componentTag.icon,
    };
  }
}

const tagService = new TagService();
export default tagService;