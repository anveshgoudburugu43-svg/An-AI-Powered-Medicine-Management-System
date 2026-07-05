'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Package, AlertTriangle, TrendingUp, Filter, Eye, Edit, Trash2, Calendar, Clock, Brain, RefreshCw, ArrowLeft, X, Save } from 'lucide-react';
import Link from 'next/link';
import AnimatedList from '../components/AnimatedList';
import LottieAnimation from '@/components/LottieAnimation';
import ecommerceAnimation from '@/lotties/ecommerce order fulfillment automation.json';

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

interface RestockRecommendation {
  medicine_name: string;
  ndc_code: string;
  current_stock: number;
  suggested_reorder: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  confidence: number;
  created_at?: string;
}

export default function TrackingPage() {
  const { data: session } = useSession();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Medicine>>({});
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'restock'>('inventory');
  const [restockRecommendations, setRestockRecommendations] = useState<RestockRecommendation[]>([]);
  const [loadingRestock, setLoadingRestock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchMedicines();
    fetchStoredRecommendations();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicine');
      if (response.ok) {
        const data = await response.json();
        const medicinesWithStatus = data.map((med: Medicine) => ({
          ...med,
          status: med.status || 'active'
        }));
        setMedicines(medicinesWithStatus);
        setFilteredMedicines(medicinesWithStatus);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoredRecommendations = async () => {
    try {
      const response = await fetch('/api/restock-suggestions');
      if (response.ok) {
        const data = await response.json();
        setRestockRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching stored recommendations:', error);
    }
  };

  const generateRestockRecommendations = async () => {
    setLoadingRestock(true);
    try {
      const response = await fetch('/api/restock-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRestockRecommendations(data.recommendations || []);
      } else {
        console.error('Failed to generate restock recommendations');
      }
    } catch (error) {
      console.error('Error generating restock recommendations:', error);
    } finally {
      setLoadingRestock(false);
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
      return { status: 'expired', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-soon', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    } else {
      return { status: 'good', color: 'text-green-400', bgColor: 'bg-green-500/20' };
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
        return 'text-green-400 bg-green-500/20';
      case 'sold_out':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'expired':
        return 'text-red-400 bg-red-500/20';
      case 'removed':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const startEditing = (medicine: Medicine) => {
    setEditingId(medicine.id);
    setEditForm({
      name: medicine.name,
      description: medicine.description,
      dosage: medicine.dosage,
      manufacturer: medicine.manufacturer,
      expiry_date: medicine.expiry_date,
      quantity: medicine.quantity,
      status: medicine.status
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/medicine/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setMedicines(prev => prev.map(med =>
          med.id === editingId ? { ...med, ...editForm } : med
        ));
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
    }
  };

  const deleteMedicine = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const response = await fetch(`/api/medicine/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMedicines(prev => prev.filter(med => med.id !== id));
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
    }
  };

  const handleViewMedicine = (medicine: Medicine) => {
    setViewingId(viewingId === medicine.id ? null : medicine.id);
  };

  // Filter medicines based on search and status
  useEffect(() => {
    let filtered = medicines;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.dosage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(medicine => medicine.status === filterStatus);
    }

    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, filterStatus]);

  // Calculate stats
  const stats = {
    total: medicines.length,
    active: medicines.filter(m => m.status === 'active').length,
    lowStock: medicines.filter(m => m.quantity <= 10).length,
    expired: medicines.filter(m => getDaysUntilExpiry(m.expiry_date) < 0).length,
    expiringSoon: medicines.filter(m => {
      const days = getDaysUntilExpiry(m.expiry_date);
      return days >= 0 && days <= 30;
    }).length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0d12]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a5568]"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="bg-[rgba(12,16,21,0.8)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-white">Medicine Tracking</h1>
                  <p className="mt-2 text-gray-400">Monitor stock levels and manage inventory</p>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lottie Animation Section */}
        <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-center">
            <LottieAnimation
              animationData={ecommerceAnimation}
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-[rgba(255,255,255,0.6)]">Total Items</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-300 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[rgba(255,255,255,0.6)]">Active</p>
                <p className="text-2xl font-bold text-green-300">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-[rgba(255,255,255,0.6)]">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-300">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-300" />
              <div className="ml-4">
                <p className="text-sm font-medium text-[rgba(255,255,255,0.6)]">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-300">{stats.expiringSoon}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-400 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl mb-8 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-colors duration-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg text-white focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-colors duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="sold_out">Sold Out</option>
                  <option value="expired">Expired</option>
                  <option value="removed">Removed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${activeTab === 'inventory'
              ? 'bg-[#141a20] border border-[#1f252b] text-white'
              : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
          >
            <Package size={16} />
            <span>Medicine Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('restock')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${activeTab === 'restock'
              ? 'bg-[#141a20] border border-[#1f252b] text-white'
              : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.02)]'
              }`}
          >
            <Brain size={16} />
            <span>AI Restock Predictions</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'inventory' ? (
              <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.04)]">
                  <h2 className="text-lg font-semibold text-white">Medicine Inventory</h2>
                </div>
                <div className="p-6">
                  {filteredMedicines.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto text-gray-500 mb-4" size={48} />
                      <p className="text-gray-400 text-lg">
                        {medicines.length === 0 ? 'No medicines added yet' : 'No medicines match your filters'}
                      </p>
                    </div>
                  ) : (
                    <AnimatedList
                      items={filteredMedicines
                        .sort((a, b) => {
                          const dateA = new Date(a.expiry_date);
                          const dateB = new Date(b.expiry_date);
                          return dateA.getTime() - dateB.getTime();
                        })
                        .map(medicine => {
                          const expiryStatus = getExpiryStatus(medicine.expiry_date);
                          const daysUntilExpiry = getDaysUntilExpiry(medicine.expiry_date);

                          return `${medicine.name} (${medicine.dosage}) - ${formatDate(medicine.expiry_date)} - ${daysUntilExpiry < 0
                            ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                            : daysUntilExpiry === 0
                              ? 'Expires today'
                              : daysUntilExpiry === 1
                                ? 'Expires tomorrow'
                                : `Expires in ${daysUntilExpiry} days`
                            } - Stock: ${medicine.quantity}`;
                        })}
                      onItemSelect={(item, index) => {
                        const medicine = filteredMedicines
                          .sort((a, b) => {
                            const dateA = new Date(a.expiry_date);
                            const dateB = new Date(b.expiry_date);
                            return dateA.getTime() - dateB.getTime();
                          })[index];
                        if (medicine) {
                          handleViewMedicine(medicine);
                        }
                      }}
                      showGradients={true}
                      enableArrowNavigation={true}
                      displayScrollbar={true}
                      className="w-full"
                      itemClassName="hover:bg-[#333] transition-colors"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Restock Predictions
                  </h2>
                  <button
                    onClick={generateRestockRecommendations}
                    disabled={loadingRestock}
                    className="px-3 py-2 rounded transition-colors flex items-center space-x-2 bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white disabled:opacity-50"
                  >
                    {loadingRestock ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Brain size={16} />
                    )}
                    <span>{loadingRestock ? 'Generating...' : 'Generate'}</span>
                  </button>
                </div>
                <div className="p-6">
                  {loadingRestock ? (
                    <div className="text-center py-12">
                      <RefreshCw className="mx-auto text-blue-300 mb-4 animate-spin" size={48} />
                      <p className="text-gray-400 text-lg">Generating AI-powered restock recommendations...</p>
                    </div>
                  ) : restockRecommendations.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="mx-auto text-gray-500 mb-4" size={48} />
                      <p className="text-gray-400 text-lg">No restock recommendations available</p>
                      <p className="text-gray-500 text-sm mt-2">Click "Generate" to create AI predictions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {restockRecommendations.slice(0, 5).map((rec, index) => (
                        <div key={index} className="border border-[rgba(255,255,255,0.2)] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-white">{rec.medicine_name}</h3>
                            <span className="text-sm text-blue-300 font-medium">
                              {Math.round(rec.confidence * 100)}% confidence
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(rec.urgency)}`}>
                              {rec.urgency.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mb-2">
                            Current: {rec.current_stock} units
                          </div>
                          <div className="text-sm text-gray-400 mb-2">
                            Suggested reorder: <span className="text-blue-300 font-bold">{rec.suggested_reorder} units</span>
                          </div>
                          <div className="text-xs text-gray-300 bg-[rgba(255,255,255,0.02)] p-2 rounded">
                            {rec.reasoning}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Medicine Details */}
          <div>
            {viewingId ? (
              <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Medicine Details</h2>
                    <button
                      onClick={() => setViewingId(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {(() => {
                    const medicine = medicines.find(m => m.id === viewingId);
                    if (!medicine) return null;

                    const expiryStatus = getExpiryStatus(medicine.expiry_date);
                    const daysUntilExpiry = getDaysUntilExpiry(medicine.expiry_date);
                    const isEditing = editingId === medicine.id;

                    return (
                      <div>
                        {isEditing ? (
                          // Edit Form
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-white font-semibold">Edit Medicine</h3>
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveEdit}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditForm({});
                                  }}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                              placeholder="Medicine name"
                            />

                            <input
                              type="text"
                              value={editForm.dosage || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, dosage: e.target.value }))}
                              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                              placeholder="Dosage"
                            />

                            <input
                              type="text"
                              value={editForm.manufacturer || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                              placeholder="Manufacturer"
                            />

                            <input
                              type="date"
                              value={editForm.expiry_date || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                            />

                            <input
                              type="number"
                              value={editForm.quantity || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                              placeholder="Quantity"
                            />

                            <select
                              value={editForm.status || 'active'}
                              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Medicine['status'] }))}
                              className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                            >
                              <option value="active">Active</option>
                              <option value="sold_out">Sold Out</option>
                              <option value="expired">Expired</option>
                              <option value="removed">Removed</option>
                            </select>
                          </div>
                        ) : (
                          // View Mode
                          <div>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-white font-semibold text-lg mb-2">{medicine.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(medicine.status)}`}>
                                  {medicine.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
                                </span>
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startEditing(medicine)}
                                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                  title="Edit medicine"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => deleteMedicine(medicine.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Delete medicine"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-gray-400">Dosage:</span>
                                <span className="text-white ml-2">{medicine.dosage}</span>
                              </div>

                              <div>
                                <span className="text-gray-400">Manufacturer:</span>
                                <span className="text-white ml-2">{medicine.manufacturer}</span>
                              </div>

                              <div className="flex items-center space-x-1">
                                <Calendar size={14} className={expiryStatus.color} />
                                <span className="text-gray-400">Expires:</span>
                                <span className={expiryStatus.color}>
                                  {formatDate(medicine.expiry_date)}
                                </span>
                              </div>

                              <div>
                                <span className="text-gray-400">Quantity:</span>
                                <span className="text-white ml-2">{medicine.quantity}</span>
                              </div>

                              <div className={`text-sm ${expiryStatus.color}`}>
                                {daysUntilExpiry < 0
                                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                                  : daysUntilExpiry === 0
                                    ? 'Expires today'
                                    : daysUntilExpiry === 1
                                      ? 'Expires tomorrow'
                                      : `Expires in ${daysUntilExpiry} days`
                                }
                              </div>

                              <div>
                                <span className="text-gray-400">Added:</span>
                                <span className="text-white ml-2">{formatDate(medicine.created_at)}</span>
                              </div>

                              {medicine.description && (
                                <div>
                                  <span className="text-gray-400">Description:</span>
                                  <p className="text-white mt-1">{medicine.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-[#171f34] border border-[rgba(255,255,255,0.2)] rounded-lg">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.2)]">
                  <h2 className="text-lg font-semibold text-white">Quick Stats</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Medicines:</span>
                      <span className="text-white font-bold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active:</span>
                      <span className="text-green-400 font-bold">{stats.active}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Low Stock:</span>
                      <span className="text-yellow-400 font-bold">{stats.lowStock}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expiring Soon:</span>
                      <span className="text-orange-400 font-bold">{stats.expiringSoon}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expired:</span>
                      <span className="text-red-400 font-bold">{stats.expired}</span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">Select a medicine from the list to view details</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}