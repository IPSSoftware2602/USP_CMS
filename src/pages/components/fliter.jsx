import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Search, RotateCcw, X, Filter } from 'lucide-react';

const ModalOverlay = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DateRangeInput = ({ value, onChange, placeholder = "Select date range" }) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">Date Range</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

const SelectDropdown = ({ label, value, onChange, options, placeholder = "Pick an option" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value ? options.find(opt => opt.value === value)?.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchInput = ({ value, onChange, placeholder = "Search (min 3 chars)", minLength = 3 }) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">Search (min {minLength} chars)</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};

const FilterModalContent = ({ 
  filters, 
  onFilterChange, 
  onApplyFilter, 
  onReset, 
  onClose,
  options = {}
}) => {
  const {
    dateTypeOptions = [],
    outletOptions = [],
    statusOptions = [],
    orderMethodOptions = [],
    menuOptions = [],
    comboOptions = []
  } = options;

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Filter Options</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DateRangeInput
            value={filters.dateRange || ''}
            onChange={(value) => onFilterChange('dateRange', value)}
          />
          
          <SelectDropdown
            label="Date Type"
            value={filters.dateType || ''}
            onChange={(value) => onFilterChange('dateType', value)}
            options={dateTypeOptions}
          />
          
          <SearchInput
            value={filters.search || ''}
            onChange={(value) => onFilterChange('search', value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <SelectDropdown
            label="Outlet"
            value={filters.outlet || ''}
            onChange={(value) => onFilterChange('outlet', value)}
            options={outletOptions}
          />
          
          <SelectDropdown
            label="Status"
            value={filters.status || ''}
            onChange={(value) => onFilterChange('status', value)}
            options={statusOptions}
          />
          
          <SelectDropdown
            label="Order Method"
            value={filters.orderMethod || ''}
            onChange={(value) => onFilterChange('orderMethod', value)}
            options={orderMethodOptions}
          />
          
          <SelectDropdown
            label="Menu"
            value={filters.menu || ''}
            onChange={(value) => onFilterChange('menu', value)}
            options={menuOptions}
          />
          
          <SelectDropdown
            label="Combo"
            value={filters.combo || ''}
            onChange={(value) => onFilterChange('combo', value)}
            options={comboOptions}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-8 pt-6 border-gray-200">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
        > 
          <span>Reset</span>
        </button>        
        <button
          onClick={onApplyFilter}
          className="px-6 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

const FilterComponent = ({ 
  onApplyFilters,
  filterOptions = {},
  buttonText = "Filter",
  initialFilters = {}
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: '',
    dateType: '',
    search: '',
    outlet: '',
    status: '',
    orderMethod: '',
    menu: '',
    combo: '',
    ...initialFilters
  });

  const defaultOptions = {
    dateTypeOptions: [
      { label: 'Created Date', value: 'created' },
      { label: 'Updated Date', value: 'updated' },
      { label: 'Order Date', value: 'order' }
    ],
    outletOptions: [
      { label: 'Outlet 1', value: 'outlet1' },
      { label: 'Outlet 2', value: 'outlet2' },
      { label: 'Outlet 3', value: 'outlet3' }
    ],
    statusOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' }
    ],
    orderMethodOptions: [
      { label: 'Delivery', value: 'delivery' },
      { label: 'Pickup', value: 'pickup' },
      { label: 'Reservation', value: 'reservation' }
    ],
    menuOptions: [
      { label: 'Breakfast', value: 'breakfast' },
      { label: 'Lunch', value: 'lunch' },
      { label: 'Dinner', value: 'dinner' }
    ],
    comboOptions: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' }
    ],
    ...filterOptions
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilter = () => {
    console.log('Applying filters:', filters);
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    setIsModalOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: '',
      dateType: '',
      search: '',
      outlet: '',
      status: '',
      orderMethod: '',
      menu: '',
      combo: ''
    };
    setFilters(resetFilters);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-indigo-900 text-white font-medium rounded-md hover:bg-indigo-800 focus:outline-none transition-colors space-x-2"
      >
        <Filter className="h-4 w-4" />
        <span>{buttonText}</span>
        {activeFiltersCount > 0 && (
          <span className="ml-2 px-2 py-1 bg-indigo-800 text-xs rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      <ModalOverlay isOpen={isModalOpen} onClose={handleCloseModal}>
        <FilterModalContent
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilter={handleApplyFilter}
          onReset={handleReset}
          onClose={handleCloseModal}
          options={defaultOptions}
        />
      </ModalOverlay>
    </>
  );
};

export default FilterComponent;