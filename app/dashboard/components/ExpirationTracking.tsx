'use client';

import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Clock, Package, Edit, Eye, Filter, X, Check, Trash2 } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  description: string;
  dosage: string;
  manufacturer: string;
  expiry_date: string;
  quantity: number;
  image_url: string;
  created_at: string;
  status?: 'active' | 'sold_out' | 'expired' | 'removed';
}

export default function ExpirationTracking() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    manufacturer: '',
    status: '',
    expiryRange: '',
    search: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [medicines, filters]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicine');
      if (response.ok) {
        const data = await response.json();
        // Add default status if not present
        const medicinesWithStatus = data.map((med: Medicine) => ({
          ...med,
          status: med.status || 'active'
        }));
        setMedicines(medicinesWithStatus);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = medicines;

    if (filters.search) {
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.manufacturer) {
      filtered = filtered.filter(med => 
        med.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(med => med.status === filters.status);
    }

    if (filters.expiryRange) {
      const today = new Date();
      filtered = filtered.filter(med => {
        const expiryDate = new Date(med.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.expiryRange) {
          case 'expired':
            return daysUntilExpiry < 0;
          case 'week':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
          case 'month':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          case 'future':
            return daysUntilExpiry > 30;
          default:
            return true;
        }
      });
    }

    setFilteredMedicines(filtered);
  };

  const updateMedicineStatus = async (id: string, status: Medicine['status']) => {
    try {
      const response = await fetch(`/api/medicine/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setMedicines(prev => prev.map(med => 
          med.id === id ? { ...med, status } : med
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating medicine status:', error);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-soon', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
    } else {
      return { status: 'good', color: 'text-green-500', bgColor: 'bg-green-500/20' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Medicine['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'sold_out':
        return 'text-yellow-500';
      case 'expired':
        return 'text-red-500';
      case 'removed':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: Medicine['status']) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      sold_out: 'bg-yellow-500/20 text-yellow-400',
      expired: 'bg-red-500/20 text-red-400',
      removed: 'bg-gray-500/20 text-gray-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[status || 'active']}`}>
        {status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#171f34] border border-[rgba(255,255,255,0.5)] rounded-[5px] p-6 h-full">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#41cbe2]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#171f34] border border-[rgba(255,255,255,0.5)] rounded-[5px] p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-[14.106px] flex items-center space-x-2">
          <Clock size={16} />
          <span>Expiration Tracking</span>
        </h3>
        <div className="flex items-center space-x-2">
          <a 
            href="/dashboard/tracking"
            className="text-[#41cbe2] hover:text-white transition-colors text-[12px] underline"
          >
            View All
          </a>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-[rgba(255,255,255,0.75)] hover:text-white transition-colors"
          >
            <Filter size={14} />
          </button>
          <div className="text-[rgba(255,255,255,0.75)] text-[12px]">
            {filteredMedicines.length} of {medicines.length} medicines
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-3 bg-[rgba(255,255,255,0.05)] rounded border border-[rgba(255,255,255,0.1)]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Search medicines..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-2 py-1 text-white text-xs placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Filter by manufacturer..."
              value={filters.manufacturer}
              onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
              className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-2 py-1 text-white text-xs placeholder-gray-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-2 py-1 text-white text-xs"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="sold_out">Sold Out</option>
              <option value="expired">Expired</option>
              <option value="removed">Removed</option>
            </select>
            <select
              value={filters.expiryRange}
              onChange={(e) => setFilters(prev => ({ ...prev, expiryRange: e.target.value }))}
              className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-2 py-1 text-white text-xs"
            >
              <option value="">All Expiry Dates</option>
              <option value="expired">Already Expired</option>
              <option value="week">Expires This Week</option>
              <option value="month">Expires This Month</option>
              <option value="future">Future Expiry</option>
            </select>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-[#41cbe2] scrollbar-track-[rgba(255,255,255,0.1)]">
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto text-gray-500 mb-2" size={32} />
            <p className="text-gray-400 text-sm">
              {medicines.length === 0 ? 'No medicines added yet' : 'No medicines match your filters'}
            </p>
          </div>
        ) : (
          filteredMedicines.map((medicine) => {
            const expiryStatus = getExpiryStatus(medicine.expiry_date);
            const daysUntilExpiry = getDaysUntilExpiry(medicine.expiry_date);
            const isEditing = editingId === medicine.id;
            const isViewing = viewingId === medicine.id;

            return (
              <div
                key={medicine.id}
                className={`border border-[rgba(255,255,255,0.2)] rounded p-3 ${expiryStatus.bgColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-white font-medium text-sm">{medicine.name}</h4>
                      {daysUntilExpiry < 0 && (
                        <AlertTriangle className="text-red-500" size={14} />
                      )}
                      {daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && (
                        <AlertTriangle className="text-yellow-500" size={14} />
                      )}
                      {getStatusBadge(medicine.status)}
                    </div>
                    
                    {medicine.dosage && (
                      <p className="text-gray-300 text-xs mb-1">{medicine.dosage}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} className={expiryStatus.color} />
                        <span className={expiryStatus.color}>
                          {formatDate(medicine.expiry_date)}
                        </span>
                      </div>
                      
                      <div className="text-gray-400">
                        Qty: {medicine.quantity}
                      </div>
                    </div>
                    
                    <div className={`text-xs mt-1 ${expiryStatus.color}`}>
                      {daysUntilExpiry < 0 
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                        : daysUntilExpiry === 0
                        ? 'Expires today'
                        : daysUntilExpiry === 1
                        ? 'Expires tomorrow'
                        : `Expires in ${daysUntilExpiry} days`
                      }
                    </div>

                    {/* Status editing */}
                    {isEditing && (
                      <div className="mt-2 flex items-center space-x-2">
                        <select
                          value={medicine.status || 'active'}
                          onChange={(e) => updateMedicineStatus(medicine.id, e.target.value as Medicine['status'])}
                          className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="active">Active</option>
                          <option value="sold_out">Sold Out</option>
                          <option value="expired">Expired</option>
                          <option value="removed">Removed</option>
                        </select>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {/* Detailed view */}
                    {isViewing && (
                      <div className="mt-2 p-2 bg-[rgba(255,255,255,0.05)] rounded text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-400">Manufacturer:</span>
                            <div className="text-white">{medicine.manufacturer || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Added:</span>
                            <div className="text-white">{formatDate(medicine.created_at)}</div>
                          </div>
                        </div>
                        {medicine.description && (
                          <div className="mt-2">
                            <span className="text-gray-400">Description:</span>
                            <div className="text-white">{medicine.description}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-3">
                    {medicine.image_url && (
                      <img
                        src={medicine.image_url}
                        alt={medicine.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => setViewingId(isViewing ? null : medicine.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="View details"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => setEditingId(isEditing ? null : medicine.id)}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="Edit status"
                      >
                        <Edit size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}