'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, ArrowLeft, DollarSign, Package, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import LottieAnimation from '@/components/LottieAnimation';
import salesAnimation from '@/lotties/Sales Presentation Showcasing Analytics Animation.json';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  manufacturer: string;
  selling_price: string | number; // Can be string from DB or number
}

interface SaleItem {
  medicine_id: string;
  medicine?: Medicine;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

interface Sale {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  final_amount: number | string;
  payment_method: string;
  status: string;
  created_at: string;
  sale_items: SaleItem[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSale, setShowNewSale] = useState(false);
  const [newSale, setNewSale] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    items: [] as SaleItem[],
    discount_amount: 0,
    tax_amount: 0,
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchSales();
    fetchMedicines();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      console.log('Fetching medicines...');
      const response = await fetch('/api/medicine');
      console.log('Medicine API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Medicines fetched:', data?.length || 0, data);
        setMedicines(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch medicines:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const addItemToSale = () => {
    setNewSale(prev => ({
      ...prev,
      items: [...prev.items, {
        medicine_id: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0
      }]
    }));
  };

  const updateSaleItem = (index: number, field: keyof SaleItem, value: any) => {
    setNewSale(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // Auto-calculate total price
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = typeof items[index].quantity === 'number' ? items[index].quantity : 0;
        const unitPrice = typeof items[index].unit_price === 'number' ? items[index].unit_price : 0;
        items[index].total_price = quantity * unitPrice;
      }

      // Auto-fill price when medicine is selected
      if (field === 'medicine_id') {
        const medicine = medicines.find(m => m.id === value);
        if (medicine) {
          const sellingPrice = typeof medicine.selling_price === 'number' ? medicine.selling_price : medicine.selling_price ? parseFloat(medicine.selling_price.toString()) : 0;
          items[index].unit_price = sellingPrice;
          const quantity = typeof items[index].quantity === 'number' ? items[index].quantity : 0;
          items[index].total_price = quantity * sellingPrice;
        }
      }

      return { ...prev, items };
    });
  };

  const removeSaleItem = (index: number) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = newSale.items.reduce((sum, item) => {
      const totalPrice = typeof item.total_price === 'number' ? item.total_price : item.total_price ? parseFloat(item.total_price.toString()) : 0;
      return sum + totalPrice;
    }, 0);
    const total = subtotal - newSale.discount_amount + newSale.tax_amount;
    return { subtotal, total };
  };

  const submitSale = async () => {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSale),
      });

      if (response.ok) {
        const sale = await response.json();
        setSales(prev => [sale, ...prev]);
        setNewSale({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          items: [],
          discount_amount: 0,
          tax_amount: 0,
          payment_method: 'cash',
          notes: ''
        });
        setShowNewSale(false);
        // No need to refetch since we now get complete data from POST
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create sale');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Failed to create sale');
    }
  };

  const { subtotal, total } = calculateTotals();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e13]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b7280]"></div>
      </div>
    );
  }

  // Ensure sales is always an array
  const safeSales = Array.isArray(sales) ? sales : [];

  return (
    <div className="">
      {/* Header */}
      <div className="bg-[rgba(15,20,25,0.6)] backdrop-blur-sm border-b border-[rgba(255,255,255,0.08)] px-4 py-4 md:px-6 shadow-lg shadow-black/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-[#41cbe2] hover:text-[#5dd5ee] transition-colors duration-200">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-white text-xl font-semibold flex items-center space-x-2">
              <ShoppingCart size={24} />
              <span>Sales Management</span>
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewSale(true)}
            className="bg-[#1a2332] border border-[#2a3441] hover:bg-[#243040] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 w-full md:w-auto"
          >
            <Plus size={16} />
            <span>New Sale</span>
          </motion.button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Lottie Animation Section */}
        <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 mb-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-center">
            <LottieAnimation
              animationData={salesAnimation}
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Sales Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Revenue</p>
                <p className="text-white text-2xl font-bold">
                  ₹{safeSales.reduce((sum, sale) => {
                    const finalAmount = typeof sale.final_amount === 'number' ? sale.final_amount : sale.final_amount ? parseFloat(sale.final_amount.toString()) : 0;
                    return sum + finalAmount;
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-green-400 text-xs mt-1">+15.3% from last month</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <DollarSign className="text-green-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Orders</p>
                <p className="text-white text-2xl font-bold">{safeSales.length}</p>
                <p className="text-blue-400 text-xs mt-1">+8.2% from last month</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <ShoppingCart className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Items Sold</p>
                <p className="text-white text-2xl font-bold">
                  {safeSales.reduce((sum, sale) => {
                    const items = sale.sale_items || [];
                    return sum + items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
                  }, 0)}
                </p>
                <p className="text-purple-400 text-xs mt-1">Total units</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-full">
                <Package className="text-purple-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Avg. Order Value</p>
                <p className="text-white text-2xl font-bold">
                  ₹{safeSales.length > 0 ? (safeSales.reduce((sum, sale) => {
                    const finalAmount = typeof sale.final_amount === 'number' ? sale.final_amount : parseFloat(sale.final_amount.toString()) || 0;
                    return sum + finalAmount;
                  }, 0) / safeSales.length).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </p>
                <p className="text-yellow-400 text-xs mt-1">Per transaction</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <User className="text-yellow-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
          <h2 className="text-white text-lg font-semibold mb-4">Recent Sales</h2>

          <div className="space-y-4">
            {safeSales.map((sale) => (
              <div key={sale.id} className="border border-[rgba(255,255,255,0.05)] bg-gradient-to-r from-[rgba(15,20,25,0.5)] to-[rgba(26,31,46,0.5)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-white font-medium">
                        {sale.customer_name || 'Walk-in Customer'}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-white font-semibold">₹{(() => {
                      const finalAmount = typeof sale.final_amount === 'number' ? sale.final_amount : parseFloat(sale.final_amount.toString()) || 0;
                      return finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}</div>
                    <div className="text-gray-400 text-sm">{sale.payment_method}</div>
                  </div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.05)] pt-3">
                  <div className="text-gray-400 text-sm mb-2">Items:</div>
                  <div className="space-y-1">
                    {(sale.sale_items || []).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          {item.medicine?.name || 'Unknown Medicine'} x {item.quantity || 0}
                        </span>
                        <span className="text-white">₹{(() => {
                          const totalPrice = typeof item.total_price === 'number' ? item.total_price : parseFloat(item.total_price.toString()) || 0;
                          return totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}</span>
                      </div>
                    ))}
                    {(!sale.sale_items || sale.sale_items.length === 0) && (
                      <div className="text-gray-500 text-sm">No items found</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {safeSales.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto text-gray-500 mb-2" size={32} />
              <p className="text-gray-400">No sales recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* New Sale Modal */}
      <AnimatePresence>
        {showNewSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">New Sale</h2>
                <button
                  onClick={() => setShowNewSale(false)}
                  className="text-gray-400 hover:text-red-400 transition-colors duration-200 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newSale.customer_name}
                  onChange={(e) => setNewSale(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white placeholder-gray-400"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newSale.customer_phone}
                  onChange={(e) => setNewSale(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white placeholder-gray-400"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newSale.customer_email}
                  onChange={(e) => setNewSale(prev => ({ ...prev, customer_email: e.target.value }))}
                  className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white placeholder-gray-400"
                />
              </div>

              {/* Debug info */}
              {medicines.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-200 text-sm">
                  ⚠️ No medicines loaded. Check console for errors.
                </div>
              )}

              {/* Sale Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Items</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400 text-sm">
                      {medicines.length} medicines available
                    </span>
                    <button
                      onClick={fetchMedicines}
                      className="bg-gray-600/50 hover:bg-gray-500/70 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={addItemToSale}
                      className="bg-[#1a2332] border border-[#2a3441] hover:bg-[#243040] text-white px-3 py-1 rounded text-sm transition-all duration-200"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {newSale.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center bg-[rgba(255,255,255,0.02)] p-3 rounded-lg md:bg-transparent md:p-0">
                      <div className="col-span-12 md:col-span-5">
                        <select
                          value={item.medicine_id}
                          onChange={(e) => updateSaleItem(index, 'medicine_id', e.target.value)}
                          className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                          style={{ color: 'white' }}
                        >
                          <option value="" className="text-black">Select Medicine</option>
                          {medicines.map((medicine) => (
                            <option
                              key={medicine.id}
                              value={medicine.id}
                              className="text-black"
                            >
                              {medicine.name} - {medicine.dosage} (₹{typeof medicine.selling_price === 'number' ? medicine.selling_price : medicine.selling_price ? parseFloat(medicine.selling_price.toString()) : 0})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <div className="text-white px-2 md:px-3 py-2 text-sm md:text-base overflow-hidden text-ellipsis">₹{(() => {
                          const totalPrice = typeof item.total_price === 'number' ? item.total_price : parseFloat(item.total_price.toString()) || 0;
                          return totalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 }); // Compact for mobile
                        })()}</div>
                      </div>
                      <div className="col-span-2 md:col-span-1 text-right md:text-left">
                        <button
                          onClick={() => removeSaleItem(index)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 text-xl px-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals and Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newSale.discount_amount}
                        onChange={(e) => setNewSale(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Tax</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newSale.tax_amount}
                        onChange={(e) => setNewSale(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <select
                    value={newSale.payment_method}
                    onChange={(e) => setNewSale(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-3 py-2 text-white"
                  >
                    <option value="cash" className="text-black">Cash</option>
                    <option value="card" className="text-black">Card</option>
                    <option value="upi" className="text-black">UPI</option>
                    <option value="bank_transfer" className="text-black">Bank Transfer</option>
                  </select>
                </div>

                <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal:</span>
                      <span>₹{(subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Discount:</span>
                      <span>-₹{(newSale.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tax:</span>
                      <span>+₹{(newSale.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-[rgba(255,255,255,0.08)] pt-2">
                      <div className="flex justify-between text-white font-semibold text-lg">
                        <span>Total:</span>
                        <span>₹{(total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowNewSale(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSale}
                  disabled={newSale.items.length === 0}
                  className="bg-[#1a2332] border border-[#2a3441] hover:bg-[#243040] text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Complete Sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}