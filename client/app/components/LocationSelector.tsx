// components/LocationSelector.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, X, Check, Globe } from 'lucide-react';

interface Address {
  street?: string;
  city: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

// Toast notification helper
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const toastDiv = document.createElement('div');
  toastDiv.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } animate-in slide-in-from-bottom-2`;
  toastDiv.textContent = message;
  document.body.appendChild(toastDiv);
  setTimeout(() => {
    toastDiv.remove();
  }, 3000);
};

export function LocationSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    zipCode: '',
    country: 'United States'
  });
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Italy', 'Spain', 'Japan', 'China', 'India',
    'Brazil', 'Mexico', 'South Africa', 'Kenya', 'Nigeria', 'Egypt',
    'Ethiopia', 'Morocco', 'Ghana', 'Tanzania', 'Uganda', 'Rwanda'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddressForm(false);
        setShowCountrySelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setSelectedAddress(location);
      } catch (e) {
        console.error('Error loading location:', e);
      }
    }
  }, []);

  const saveLocation = (address: Address) => {
    setSelectedAddress(address);
    localStorage.setItem('userLocation', JSON.stringify(address));
    showToast(`Delivery location updated to ${address.city}, ${address.country}`, 'success');
    setIsOpen(false);
    setShowAddressForm(false);
    setShowCountrySelector(false);
  };

  const handleZipCodeApply = () => {
    if (zipCode.match(/^\d{4,6}$/)) {
      const newAddr: Address = {
        city: zipCode,
        zipCode: zipCode,
        country: 'United States'
      };
      saveLocation(newAddr);
      setZipCode('');
    } else {
      showToast('Please enter a valid zip code (4-6 digits)', 'error');
    }
  };

  const handleCountrySelect = (country: string) => {
    setShowCountrySelector(false);
    // Instead of saving immediately, show city input for the selected country
    setNewAddress({ ...newAddress, country: country, city: '', zipCode: '' });
    setShowAddressForm(true);
  };

  const handleAddAddress = () => {
    if (!newAddress.city) {
      showToast('Please enter a city', 'error');
      return;
    }
    if (!newAddress.zipCode) {
      showToast('Please enter a zip code', 'error');
      return;
    }
    if (!newAddress.country) {
      showToast('Please select a country', 'error');
      return;
    }

    const address: Address = {
      street: newAddress.street,
      city: newAddress.city,
      zipCode: newAddress.zipCode,
      country: newAddress.country
    };
    setAddresses([...addresses, address]);
    saveLocation(address);
    setNewAddress({ street: '', city: '', zipCode: '', country: 'United States' });
  };

  const getDisplayLocation = () => {
    if (selectedAddress) {
      return selectedAddress.country === 'United States' ? selectedAddress.zipCode : selectedAddress.country;
    }
    return 'Select location';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-white hover:text-gray-200 transition-colors"
        aria-label="Select delivery location"
        title="Select delivery location"
      >
        <MapPin size={14} className="text-yellow-400" />
        <div className="text-xs">
          {/* ✅ DELETED: <div className="text-gray-300 text-[10px] hidden sm:block">Deliver to</div> */}
          <div className="font-bold text-sm">{getDisplayLocation()}</div>
        </div>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''} hidden sm:block`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-[450px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-900">Choose your location</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <p className="text-sm text-gray-600 mb-3">
              Select a delivery location to see product availability and delivery times.
            </p>

            {/* Address Book Section - Only show if there are saved addresses */}
            {addresses.length > 0 && !showAddressForm && !showCountrySelector && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Your saved addresses</h4>
                {addresses.map((addr, idx) => (
                  <button
                    key={idx}
                    onClick={() => saveLocation(addr)}
                    className={`w-full text-left p-3 rounded-lg border transition-all mb-2 ${selectedAddress?.city === addr.city && selectedAddress?.zipCode === addr.zipCode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{addr.city}</p>
                        <p className="text-xs text-gray-500">{addr.zipCode}, {addr.country}</p>
                        {addr.street && <p className="text-xs text-gray-500">{addr.street}</p>}
                      </div>
                      {selectedAddress?.city === addr.city && selectedAddress?.zipCode === addr.zipCode && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Zip Code Input - Only for US */}
            {!showAddressForm && !showCountrySelector && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter US zip code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Zip code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    maxLength={6}
                    onKeyPress={(e) => e.key === 'Enter' && handleZipCodeApply()}
                  />
                  <button
                    onClick={handleZipCodeApply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Ship Outside US Option */}
            {!showAddressForm && !showCountrySelector && (
              <div className="mb-4 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowCountrySelector(true)}
                  className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-2"
                >
                  <Globe size={14} />
                  Ship outside the US
                </button>
              </div>
            )}

            {/* Country Selector Grid */}
            {showCountrySelector && (
              <div className="mb-4">
                <button
                  onClick={() => setShowCountrySelector(false)}
                  className="text-blue-600 text-sm font-medium hover:underline mb-3 flex items-center gap-1"
                >
                  ← Back
                </button>

                <h4 className="text-sm font-semibold text-gray-900 mb-3">Select your country</h4>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                  {countries.map((country) => (
                    <button
                      key={country}
                      onClick={() => handleCountrySelect(country)}
                      className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 hover:border-blue-300"
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Address Form - For international addresses */}
            {showAddressForm && (
              <div>
                <button
                  onClick={() => {
                    setShowAddressForm(false);
                    setShowCountrySelector(true);
                  }}
                  className="text-blue-600 text-sm font-medium hover:underline mb-3 flex items-center gap-1"
                >
                  ← Select different country
                </button>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Country
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 border border-gray-200">
                      {newAddress.country}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City/Town *
                    </label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Enter city name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal/Zip Code *
                    </label>
                    <input
                      type="text"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      placeholder="Enter postal code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  <button
                    onClick={handleAddAddress}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Use this address
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}