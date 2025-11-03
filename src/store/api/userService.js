import {VITE_API_BASE_URL} from "../../constant/config";
import md5 from "blueimp-md5";

const BASE_URL = VITE_API_BASE_URL;

// Helper function to get fresh token
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

class UserService {
  static async createUser(userData) {
    try {
      // Prepare the base user data
      const requestData = {
        username: userData.username,
        name: userData.name,
        password_hash: md5(userData.password), 
        role: userData.userRoles.toLowerCase(), 
        status: userData.activeStatus.toLowerCase(),
        menuPermissions: userData.menuPermissions // Add permissions data
      };

      // Add outlet_id only if the role is 'outlet'
      if (userData.userRoles.toLowerCase() === 'outlet' && userData.outlet) {
        requestData.outlet_id = userData.outlet;
      }

      const response = await fetch(`${BASE_URL}users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestData)
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to create user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          // Handle specific validation errors if returned by the API
          if (errorData.errors) {
            errorMessage = Object.values(errorData.errors).join(', ');
          }
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      // Return the created user data with all relevant information
      return {
        ...responseData,
        userRoles: userData.userRoles,
        activeStatus: userData.activeStatus,
        menuPermissions: userData.menuPermissions, // Include permissions in response
        ...(userData.userRoles.toLowerCase() === 'outlet' && { outlet: userData.outlet })
      };
      
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
}

  // Get all users
  static async getAllUsers(user_id) {
    try {
      const response = await fetch(`${BASE_URL}users?user_id=${user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to fetch users';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("API /users response:", data);
      
      // Updated to handle the actual API response structure
      const users = Array.isArray(data) ? data
        : Array.isArray(data.data) ? data.data  // <-- Added this line to handle your API structure
        : Array.isArray(data.result) ? data.result
        : Array.isArray(data.users) ? data.users
        : [];
        
      if (!Array.isArray(users)) throw new Error("API did not return a user array");

      return users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        userRoles: this.capitalizeFirst(user.role),
        activeStatus: this.capitalizeFirst(user.status),
        createTime: user.created_at || user.createTime || new Date().toISOString().replace('T', ' ').substr(0, 19)
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get single user
  static async getUser(userId) {
    try {
      const response = await fetch(`${BASE_URL}users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to fetch user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Update user
static async updateUser(userId, userData) {
    try {
      // Prepare the update data in the format backend expects
      const requestData = {};

      // Map frontend field names to backend field names
      if (userData.username) requestData.username = userData.username;
      if (userData.name) requestData.name = userData.name;
      
      // Convert role format - FIXED: Only check userRoles once
      if (userData.userRoles) {
        requestData.role = userData.userRoles.toLowerCase();
        
        // Handle outlet assignment based on role
        if (userData.userRoles.toLowerCase() === 'outlet') {
          // If role is outlet, set outlet_id (even if it's empty/null to clear it)
          requestData.outlet_id = userData.outlet || null;
        } else {
          // If role is NOT outlet, explicitly set outlet_id to null
          requestData.outlet_id = null;
        }
      }
      
      // Convert status format  
      if (userData.activeStatus) requestData.status = userData.activeStatus.toLowerCase();
      
      // Add password if provided
      if (userData.password && userData.password.trim()) {
        requestData.password = userData.password;
      }

      // Add menu permissions if provided
      if (userData.menuPermissions !== undefined) {
        requestData.menuPermissions = userData.menuPermissions;
      }

      console.log('Sending update data:', requestData); // Debug log

      const response = await fetch(`${BASE_URL}users/update/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestData)
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to update user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          if (errorData.errors) {
            errorMessage = Object.values(errorData.errors).join(', ');
          }
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
}

  static async deleteUser(userId) {
    try {
      const response = await fetch(`${BASE_URL}users/delete/${userId}`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to delete user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      try {
        const responseData = await response.json();
        return responseData;
      } catch (e) {
        return { success: true, message: 'User deleted successfully' };
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default UserService;