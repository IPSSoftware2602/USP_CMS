import { VITE_API_BASE_URL } from "../../constant/config";

const BASE_URL = VITE_API_BASE_URL;

class OutletService {
  getToken() {
    return sessionStorage.getItem('token');
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    return await response.json();
  }

  async createOutlet(outletData) {
    const token = this.getToken();
    const formData = new FormData();
    // Basic fields
    formData.append('title', outletData.title);
    formData.append('email', outletData.email);
    formData.append('phone', outletData.phone);
    formData.append('password', outletData.password ?? '');
    formData.append('address', outletData.address);
    formData.append('state', outletData.state);
    formData.append('postal_code', outletData.postalCode || outletData.postal_code || '');
    formData.append('country', outletData.country || 'Malaysia');
    formData.append('status', outletData.status || 'active');
    formData.append('latitude', outletData.latitude || '');
    formData.append('longitude', outletData.longitude || '');
    formData.append(
      'zeoniq_loc_code',
      outletData.zeoniqLocCode || outletData.outletZeoniqCode || outletData.zeoniq_loc_code || ''
    );


    // Serve method and delivery options
    formData.append('serve_method', outletData.serveMethod || outletData.serve_method || '');

    formData.append(
      'delivery_options',
      Array.isArray(outletData.deliveryOptions)
        ? outletData.deliveryOptions.join(', ')
        : (outletData.deliveryOptions || outletData.delivery_options || '')
    );

    // Delivery coverage with numeric validation
    const deliveryCoverage = outletData.deliveryCoverage || outletData.delivery_coverage || outletData.outlet_delivery_coverage;
    const numericCoverage = deliveryCoverage !== undefined && deliveryCoverage !== null
      ? deliveryCoverage.toString().replace(/[^0-9.]/g, '')
      : '0';
    formData.append('outlet_delivery_coverage', numericCoverage);

    // Capacity limits
    formData.append('order_max_per_hour', outletData.orderMaxPerHour || outletData.order_max_per_hour || '');
    formData.append('item_max_per_hour', outletData.itemMaxPerHour || outletData.item_max_per_hour || '');

    // Operating schedule
    let operatingDays = outletData.operating_days || [{}];
    let operatingHours = outletData.operating_hours || [{}];

    if (outletData.operatingSchedule) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      operatingDays = {};
      operatingHours = {};

      Object.entries(outletData.operatingSchedule).forEach(([dayNumber, dayData]) => {
        const dayName = dayNames[parseInt(dayNumber)];
        if (dayName) {
          operatingDays[dayName] = { is_operated: dayData.is_operated };
          operatingHours[dayName] = dayData.operating_hours || [];
        }
      });
    }

    const array_operatingday = [];
    array_operatingday.push(operatingDays);
    const array_operatinghour = [];
    array_operatinghour.push(operatingHours);
    const transformedDays = array_operatingday || {};
    const transformedHours = array_operatinghour || {};

    formData.append('outlet_operating_days', JSON.stringify(transformedDays));

    formData.append('outlet_operating_hours', JSON.stringify(transformedHours));

    if (outletData.regular_delivery_settings) {
      formData.append(
        'regular_delivery_settings',
        typeof outletData.regular_delivery_settings === 'string'
          ? outletData.regular_delivery_settings
          : JSON.stringify(outletData.regular_delivery_settings)
      );
    }

    // Tax handling
    const taxMap = {
      sst: 1,
      service_tax: 2
    };
    console.log(outletData.outlet_tax);
    // Append each ID as outlet_tax[]
    outletData.outlet_tax.forEach(id => {
      formData.append("outlet_tax[]", id);
    });


    // Menu items
    let menuItems = outletData.menuItems || outletData.outlet_menu || [];
    let menuItemIds = [];

    // Normalize to array of IDs
    if (Array.isArray(menuItems)) {
      menuItemIds = menuItems.map(item => (item && typeof item === "object" ? item.id : item)).filter(Boolean);
    } else if (menuItems && typeof menuItems === "object") {
      menuItemIds = Object.keys(menuItems)
        .filter(key => menuItems[key])
        .map(key => parseInt(key, 10))
        .filter(Boolean);
    }

    // Append each ID as outlet_menu[]
    menuItemIds.forEach(id => {
      formData.append('outlet_menu[]', id);
    });


    // Image handling
    if (outletData.images && Array.isArray(outletData.images)) {
      outletData.images.forEach((image, index) => {
        if (image instanceof File || image instanceof Blob) {
          formData.append('outlet_images[]', image);
        }
      });
    }

    // Debug logging
    console.log('FormData entries for create:');
    for (let [key, value] of formData.entries()) {
      console.log(key, ':', value);
    }

    try {
      const response = await fetch(`${BASE_URL}outlets/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating outlet:', error);
      throw error;
    }
  }
  async getOutlets(user_id) {
    const token = await this.getToken();

    try {
      const response = await fetch(`${BASE_URL}outlets/list?user_id=${user_id}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`,
        }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching outlets:', error);
      throw error;
    }
  }

  async getOutlet(id) {
    const token = this.getToken();

    try {
      const response = await fetch(`${BASE_URL}outlets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching outlet:', error);
      throw error;
    }
  }

  async updateOutlet(id, outletData) {
    const token = this.getToken?.() || sessionStorage.getItem('token');

    // If caller already built FormData, just send it
    if (outletData instanceof FormData) {
      if (process.env.NODE_ENV !== 'production') {
        // console.log('FormData (passed-through) preview:');
        for (const [k, v] of outletData.entries()) {
          // console.log(k, v instanceof File ? `[File:${v.name}]` : v);
        }
      }
      const res = await fetch(`${BASE_URL}outlets/update/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: outletData,
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.message || JSON.stringify(j?.messages || j); } catch { }
        throw new Error(msg);
      }
      return res.json();
    }

    // Otherwise, build FormData here
    const fd = new FormData();

    // Basic fields
    fd.append('title', outletData.title ?? '');
    fd.append('email', outletData.email ?? '');
    fd.append('phone', outletData.phone ?? '');
    fd.append('address', outletData.address ?? '');
    fd.append('state', outletData.state ?? '');
    fd.append('postal_code', outletData.postal_code ?? outletData.postalCode ?? '');
    fd.append('country', outletData.country ?? 'Malaysia');
    fd.append('status', outletData.status ?? 'active');
    fd.append('latitude', String(outletData.latitude ?? '0'));
    fd.append('longitude', String(outletData.longitude ?? '0'));

    if (outletData.password?.trim()) {
      fd.append('password', outletData.password.trim());
    }

    // Serve / delivery
    const serveMethod = Array.isArray(outletData.serveMethods)
      ? outletData.serveMethods.join(',')
      : (outletData.serve_method ?? outletData.serveMethod ?? '');
    fd.append('serve_method', serveMethod);

    const deliveryOptions = Array.isArray(outletData.deliveryOptions)
      ? outletData.deliveryOptions.join(',')
      : (outletData.delivery_options ?? outletData.deliveryOptions ?? '');
    fd.append('delivery_options', deliveryOptions);

    // Numbers
    fd.append('outlet_delivery_coverage', String(outletData.outlet_delivery_coverage ?? outletData.deliveryCoverage ?? '0'));
    fd.append('order_max_per_hour', String(outletData.order_max_per_hour ?? outletData.orderMaxPerHour ?? '0'));
    fd.append('item_max_per_hour', String(outletData.item_max_per_hour ?? outletData.itemMaxPerHour ?? '0'));

    // Complex objects — backend expects [0], so wrap in single-element array
    const opDays = outletData.outlet_operating_days ?? {};
    const opHours = outletData.outlet_operating_hours ?? {};
    const taxes = outletData.outlet_tax ?? [];

    fd.append('outlet_operating_days', JSON.stringify([opDays]));
    fd.append('outlet_operating_hours', JSON.stringify([opHours]));
    fd.append('outlet_tax', JSON.stringify(taxes));

    if (outletData.operating_hours_exceptions) {
      fd.append(
        'outlet_operating_hours_exceptions',
        JSON.stringify(outletData.operating_hours_exceptions)
      );

    }

    if (outletData.regular_delivery_settings) {
      fd.append(
        'regular_delivery_settings',
        typeof outletData.regular_delivery_settings === 'string'
          ? outletData.regular_delivery_settings
          : JSON.stringify(outletData.regular_delivery_settings)
      );
    }

    // Menu items — backend expects array, not JSON
    const menuRaw = outletData.outlet_menu ?? outletData.menuItems ?? [];
    const menuIds = Array.isArray(menuRaw)
      ? menuRaw.map(m => (typeof m === 'object' ? (m.id ?? m) : m)).filter(Boolean)
      : [];

    if (menuIds.length) {
      menuIds.forEach(id => fd.append('outlet_menu[]', String(id)));
    } else {
      // optional: send empty to delete all
      // fd.append('outlet_menu[]', '');
    }

    // Images
    const files =
      outletData.outlet_images
      ?? (Array.isArray(outletData.images) ? outletData.images.filter(x => x?.file instanceof File).map(x => x.file) : []);
    files.forEach((file, idx) => fd.append('outlet_images[]', file, file.name || `outlet_${idx}`));

    // Existing image IDs
    const existingIds =
      outletData.existing_image
      ?? (Array.isArray(outletData.images) ? outletData.images.filter(x => x?.id).map(x => x.id) : []);
    existingIds.forEach(id => fd.append('existing_image[]', String(id)));

    // if (process.env.NODE_ENV !== 'production') {
    //   console.log('FormData (rebuilt) preview:');
    //   for (const [k, v] of fd.entries()) {
    //     console.log(k, v instanceof File ? `[File:${v.name}]` : v);
    //   }
    // }

    const res = await fetch(`${BASE_URL}outlets/update/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j?.message || JSON.stringify(j?.messages || j); } catch { }
      throw new Error(msg);
    }
    return res.json();
  }


  async deleteOutlet(id) {
    const token = this.getToken();

    try {
      const response = await fetch(`${BASE_URL}outlets/delete/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting outlet:', error);
      throw error;
    }
  }

  async updateOutletPassword(id, password) {
    const token = this.getToken();

    try {
      const response = await fetch(`${BASE_URL}outlets/update-password/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating outlet password:', error);
      throw error;
    }
  }


  async addBulk(outletIds, menuItemIds, action = 'activate') {
    const token = this.getToken();
    try {
      const response = await fetch(`${BASE_URL}outlets/update_oulet_menuitem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          outlet_ids: Array.isArray(outletIds) ? outletIds : [outletIds],
          menu_item_ids: Array.isArray(menuItemIds) ? menuItemIds : [menuItemIds],
          action: action // Add this parameter
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in bulk adding menu items to outlets:', error);
      throw error;
    }
  }

  async deleteBulk(outletIds, menuItemIds) {
    const token = this.getToken();
    try {
      const response = await fetch(`${BASE_URL}outlets/delete_outlet_menuitem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          outlet_ids: Array.isArray(outletIds) ? outletIds : [outletIds],
          menu_item_ids: Array.isArray(menuItemIds) ? menuItemIds : [menuItemIds]
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in bulk deleting menu items from outlets:', error);
      throw error;
    }
  }
}



export default new OutletService();