'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Plus, ArrowLeft, AlertTriangle, TrendingDown, Search, Filter, DollarSign, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  medicine_id: string;
  batch_number?: string;
  purchase_price?: number;
  selling_price: number;
  quantity_in_stock: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  supplier_name?: string;
  purchase_date?: string;
  medicines: {
    id: string;
    name: string;
    dosage?: string;
    manufacturer?: string;
    expiry_date: string;
    status?: string;
    description?: string;
  };
}

interface RestockPrediction {
  medicine_name: string;
  ndc_code: string;
  current_stock: number;
  suggested_reorder: number;
  urgency: string;
  reasoning: string;
  confidence: number;
  created_at?: string;
}

interface NewMedicine {
  name: string;
  dosage: string;
  manufacturer: string;
  expiry_date: string;
  quantity: number;
  description: string;
  supplier: string;
  purchase_price: number;
  selling_price: number;
  batch_number: string;
  minimum_stock_level: number;
  maximum_stock_level: number;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [predictions, setPredictions] = useState<RestockPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({
    show: false,
    id: '',
    name: ''
  });
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);

  const [newStock, setNewStock] = useState({
    medicine_id: '',
    batch_number: '',
    purchase_price: 0,
    selling_price: 0,
    quantity_in_stock: 0,
    minimum_stock_level: 10,
    maximum_stock_level: 100,
    supplier_name: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });

  const [newMedicine, setNewMedicine] = useState<NewMedicine>({
    name: '',
    dosage: '',
    manufacturer: '',
    expiry_date: '',
    quantity: 1,
    description: '',
    supplier: '',
    purchase_price: 0,
    selling_price: 0,
    batch_number: '',
    minimum_stock_level: 10,
    maximum_stock_level: 100
  });

  useEffect(() => {
    fetchInventory();
    fetchMedicines();
    fetchPredictions();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/inventory${showLowStock ? '?lowStock=true' : ''}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicine');
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/restock-suggestions');
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const generatePredictions = async () => {
    try {
      const response = await fetch('/api/restock-suggestions', {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh predictions after generation
        fetchPredictions();
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
    }
  };

  const addMedicine = async () => {
    try {
      const response = await fetch('/api/medicine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMedicine.name,
          dosage: newMedicine.dosage,
          manufacturer: newMedicine.manufacturer,
          expiry_date: newMedicine.expiry_date,
          quantity: newMedicine.quantity,
          description: newMedicine.description
        }),
      });

      if (response.ok) {
        const medicine = await response.json();

        // Also add to inventory if we have stock details
        if (newMedicine.selling_price > 0 && newMedicine.quantity > 0) {
          await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              medicine_id: medicine.id,
              batch_number: newMedicine.batch_number,
              purchase_price: newMedicine.purchase_price,
              selling_price: newMedicine.selling_price,
              quantity_in_stock: newMedicine.quantity,
              minimum_stock_level: newMedicine.minimum_stock_level,
              maximum_stock_level: newMedicine.maximum_stock_level,
              supplier_name: newMedicine.supplier,
              purchase_date: new Date().toISOString().split('T')[0]
            }),
          });
        }

        fetchInventory();
        fetchMedicines();
        setShowAddMedicine(false);
        setNewMedicine({
          name: '',
          dosage: '',
          manufacturer: '',
          expiry_date: '',
          quantity: 1,
          description: '',
          supplier: '',
          purchase_price: 0,
          selling_price: 0,
          batch_number: '',
          minimum_stock_level: 10,
          maximum_stock_level: 100
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add medicine');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Failed to add medicine');
    }
  };

  const addStock = async () => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStock),
      });

      if (response.ok) {
        fetchInventory();
        setShowAddStock(false);
        setNewStock({
          medicine_id: '',
          batch_number: '',
          purchase_price: 0,
          selling_price: 0,
          quantity_in_stock: 0,
          minimum_stock_level: 10,
          maximum_stock_level: 100,
          supplier_name: '',
          purchase_date: new Date().toISOString().split('T')[0]
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    }
  };

  const handleDeleteInventory = (id: string, name: string) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/inventory/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh inventory list
        fetchInventory();
        setDeleteConfirm({ show: false, id: '', name: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete inventory');
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      alert('Failed to delete inventory');
    }
  };

  // Helper function to handle number input without leading zeros
  const handleNumberInput = (value: string): number => {
    // Remove leading zeros and parse
    const cleaned = value.replace(/^0+(?=\d)/, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleImportCSV = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || `Successfully imported ${result.imported} medicines`,
          errors: result.errors
        });
        // Refresh inventory and medicines
        fetchInventory();
        fetchMedicines();
        // Clear file after successful import
        setTimeout(() => {
          setImportFile(null);
          setShowImport(false);
          setImportResult(null);
        }, 3000);
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Failed to import CSV',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportResult({
        success: false,
        message: 'Failed to import CSV. Please try again.'
      });
    } finally {
      setImporting(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_in_stock <= 0) {
      return { status: 'out-of-stock', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    } else if (item.quantity_in_stock <= item.minimum_stock_level) {
      return { status: 'low-stock', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    } else if (item.quantity_in_stock >= item.maximum_stock_level) {
      return { status: 'overstock', color: 'text-blue-500', bgColor: 'bg-blue-500/20' };
    } else {
      return { status: 'normal', color: 'text-green-500', bgColor: 'bg-green-500/20' };
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.medicines.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.medicines.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const lowStockCount = inventory.filter(item => item.quantity_in_stock <= item.minimum_stock_level).length;
  const outOfStockCount = inventory.filter(item => item.quantity_in_stock <= 0).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity_in_stock * item.selling_price), 0);

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
      <div className="bg-[rgba(12,16,21,0.8)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.04)] px-4 py-4 md:px-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-white text-xl font-semibold flex items-center space-x-2">
              <Package size={24} />
              <span>Inventory Management</span>
            </h1>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generatePredictions}
              className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 text-center"
            >
              Generate Predictions
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowImport(true)}
              className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <Upload size={16} />
              <span>Import CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddMedicine(true)}
              className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <Plus size={16} />
              <span>Add Medicine</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddStock(true)}
              className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <Plus size={16} />
              <span>Add Stock</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.6)] text-sm">Total Items</p>
                <p className="text-white text-2xl font-bold">{inventory.length}</p>
                <p className="text-blue-300 text-xs mt-1">Active inventory</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Package className="text-blue-300" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.6)] text-sm">Low Stock</p>
                <p className="text-white text-2xl font-bold">{lowStockCount}</p>
                <p className="text-yellow-300 text-xs mt-1">Requires attention</p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-full">
                <AlertTriangle className="text-yellow-300" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.6)] text-sm">Out of Stock</p>
                <p className="text-white text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-red-300 text-xs mt-1">Critical items</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-full">
                <TrendingDown className="text-red-300" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Value</p>
                <p className="text-white text-2xl font-bold">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-green-400 text-xs mt-1">Inventory worth</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Restock Predictions */}
        {predictions.length > 0 && (
          <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center space-x-2">
              <TrendingDown className="text-purple-400" size={20} />
              <span>Restock Predictions</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.slice(0, 6).map((prediction, index) => (
                <div key={index} className="border border-[rgba(255,255,255,0.1)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">{prediction.medicine_name}</h3>
                    <span className="text-xs text-purple-400">
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs mb-2">
                    Current stock: {prediction.current_stock} units
                  </div>
                  <div className="text-yellow-400 text-sm mb-2">
                    Reorder: {prediction.suggested_reorder} units
                  </div>
                  <div className={`text-xs px-2 py-1 rounded inline-block ${prediction.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                    prediction.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      prediction.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                    }`}>
                    {prediction.urgency.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-10 py-2 text-white placeholder-gray-500 focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
              />
            </div>
            <button
              onClick={() => {
                setShowLowStock(!showLowStock);
                fetchInventory();
              }}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${showLowStock ? 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-yellow-300' : 'text-yellow-300 hover:bg-[rgba(255,255,255,0.02)] border border-transparent'
                }`}
            >
              <Filter size={16} />
              <span>Low Stock Only</span>
            </button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            const daysUntilExpiry = Math.ceil((new Date(item.medicines.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={item.id} className={`bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${stockStatus.bgColor}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{item.medicines.name}</h3>
                    {item.medicines.dosage && (
                      <p className="text-gray-400 text-sm mb-1">{item.medicines.dosage}</p>
                    )}
                    {item.medicines.manufacturer && (
                      <p className="text-gray-400 text-xs">{item.medicines.manufacturer}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs ${stockStatus.color} bg-opacity-20`}>
                      {stockStatus.status.replace('-', ' ').toUpperCase()}
                    </div>
                    <button
                      onClick={() => handleDeleteInventory(item.id, item.medicines.name)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition-colors"
                      title="Delete inventory item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Stock Level:</span>
                    <span className={`font-semibold ${stockStatus.color}`}>
                      {item.quantity_in_stock} / {item.maximum_stock_level}
                    </span>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.quantity_in_stock <= item.minimum_stock_level ? 'bg-red-500' :
                        item.quantity_in_stock >= item.maximum_stock_level ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                      style={{
                        width: `${Math.min((item.quantity_in_stock / item.maximum_stock_level) * 100, 100)}%`
                      }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Min Level:</span>
                      <div className="text-white">{item.minimum_stock_level}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Selling Price:</span>
                      <div className="text-white">₹{item.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  {item.batch_number && (
                    <div className="text-sm">
                      <span className="text-gray-400">Batch:</span>
                      <span className="text-white ml-2">{item.batch_number}</span>
                    </div>
                  )}

                  <div className="text-sm">
                    <span className="text-gray-400">Expires:</span>
                    <span className={`ml-2 ${daysUntilExpiry < 30 ? 'text-red-400' : daysUntilExpiry < 90 ? 'text-yellow-400' : 'text-white'}`}>
                      {new Date(item.medicines.expiry_date).toLocaleDateString()}
                      {daysUntilExpiry < 30 && (
                        <span className="ml-1">({daysUntilExpiry} days)</span>
                      )}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-400">Total Value:</span>
                    <span className="text-white ml-2 font-semibold">
                      ₹{(item.quantity_in_stock * item.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400 text-lg">No inventory items found</p>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {showAddMedicine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold flex items-center space-x-2">
                  <span>Add New Medicine</span>
                </h2>
                <button
                  onClick={() => {
                    setShowAddMedicine(false);
                  }}
                  className="text-gray-400 hover:text-red-400 transition-colors duration-200 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Medicine Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Medicine Name *</label>
                  <input
                    type="text"
                    value={newMedicine.name}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="e.g., Paracetamol"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Dosage *</label>
                  <input
                    type="text"
                    value={newMedicine.dosage}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="e.g., 500mg, 10ml"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Manufacturer</label>
                  <input
                    type="text"
                    value={newMedicine.manufacturer}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="e.g., ABC Pharma Ltd"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Expiry Date *</label>
                  <input
                    type="date"
                    value={newMedicine.expiry_date}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Supplier</label>
                  <input
                    type="text"
                    value={newMedicine.supplier}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="e.g., MediCorp Distributors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={newMedicine.batch_number}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, batch_number: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="e.g., PAR123456"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Purchase Price (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newMedicine.purchase_price || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setNewMedicine(prev => ({ ...prev, purchase_price: handleNumberInput(value) }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Selling Price (₹) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newMedicine.selling_price || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setNewMedicine(prev => ({ ...prev, selling_price: handleNumberInput(value) }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Initial Quantity *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newMedicine.quantity || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewMedicine(prev => ({ ...prev, quantity: parseInt(value) || 0 }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Min Stock Level</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newMedicine.minimum_stock_level || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewMedicine(prev => ({ ...prev, minimum_stock_level: parseInt(value) || 0 }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Stock Level</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newMedicine.maximum_stock_level || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewMedicine(prev => ({ ...prev, maximum_stock_level: parseInt(value) || 0 }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-400 text-sm mb-2">Additional Info</label>
                  <textarea
                    value={newMedicine.description}
                    onChange={(e) => setNewMedicine(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white h-20 resize-none focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="Additional information about the medicine..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowAddMedicine(false);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMedicine}
                  disabled={!newMedicine.name || !newMedicine.dosage || !newMedicine.expiry_date}
                  className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Medicine</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAddStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-[#0c1015] to-[#141a20] border border-[rgba(255,255,255,0.04)] rounded-xl p-6 max-w-2xl w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Add Stock</h2>
                <button
                  onClick={() => setShowAddStock(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-gray-400 text-sm mb-2">Medicine</label>
                  <select
                    value={newStock.medicine_id}
                    onChange={(e) => setNewStock(prev => ({ ...prev, medicine_id: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  >
                    <option value="" className="text-black">Select Medicine</option>
                    {medicines.map((medicine) => (
                      <option key={medicine.id} value={medicine.id} className="text-black">
                        {medicine.name} - {medicine.dosage}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={newStock.batch_number}
                    onChange={(e) => setNewStock(prev => ({ ...prev, batch_number: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Supplier</label>
                  <input
                    type="text"
                    value={newStock.supplier_name}
                    onChange={(e) => setNewStock(prev => ({ ...prev, supplier_name: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Purchase Price</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newStock.purchase_price || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setNewStock(prev => ({ ...prev, purchase_price: handleNumberInput(value) }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Selling Price</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newStock.selling_price || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setNewStock(prev => ({ ...prev, selling_price: handleNumberInput(value) }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Quantity</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newStock.quantity_in_stock || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewStock(prev => ({ ...prev, quantity_in_stock: parseInt(value) || 0 }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Min Stock Level</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newStock.minimum_stock_level || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewStock(prev => ({ ...prev, minimum_stock_level: parseInt(value) || 0 }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Max Stock Level</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newStock.maximum_stock_level || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewStock(prev => ({ ...prev, maximum_stock_level: parseInt(value) || 0 }));
                    }}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={newStock.purchase_date}
                    onChange={(e) => setNewStock(prev => ({ ...prev, purchase_date: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white focus:border-[#4a5568] focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowAddStock(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addStock}
                  disabled={!newStock.medicine_id || !newStock.selling_price || !newStock.quantity_in_stock}
                  className="bg-[#141a20] border border-[#1f252b] hover:bg-[#1a2028] text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add Stock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 max-w-2xl w-full shadow-2xl"
            >
              <h3 className="text-white text-xl font-semibold mb-4">Import Inventory from CSV</h3>
              
              <div className="mb-6">
                <p className="text-gray-400 mb-4">
                  Upload a CSV file with your inventory data. The file must include these columns:
                </p>
                <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-300 font-mono">
                    name, dosage, manufacturer, quantity, selling_price
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Optional: expiry_date, description, purchase_price, minimum_stock_level, maximum_stock_level
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-[#41cbe2] transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-white mb-1">
                      {importFile ? importFile.name : 'Click to upload CSV file'}
                    </p>
                    <p className="text-gray-500 text-sm">or drag and drop</p>
                  </label>
                </div>
              </div>

              {importResult && (
                <div className={`mb-4 p-4 rounded-lg ${
                  importResult.success 
                    ? 'bg-green-500/20 border border-green-500/50' 
                    : 'bg-red-500/20 border border-red-500/50'
                }`}>
                  <p className={importResult.success ? 'text-green-400' : 'text-red-400'}>
                    {importResult.message}
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-sm text-gray-400">
                      <p className="font-semibold mb-1">Errors:</p>
                      <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... and {importResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCSV}
                  disabled={!importFile || importing}
                  className="bg-[#41cbe2] hover:bg-[#2a9fb8] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Import</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-white text-xl font-semibold mb-4">Confirm Delete</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span> from inventory? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}