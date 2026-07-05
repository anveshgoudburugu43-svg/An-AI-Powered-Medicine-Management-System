'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowLeft, Brain, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/restock-suggestions');
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/restock-suggestions', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e13]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b7280]"></div>
      </div>
    );
  }

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
              <Brain size={24} />
              <span>AI Predictions</span>
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateNewPredictions}
            disabled={loading}
            className="bg-[#1a2332] border border-[#2a3441] hover:bg-[#243040] text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 w-full md:w-auto"
          >
            <Zap size={16} />
            <span>Generate New Predictions</span>
          </motion.button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Total Predictions</p>
                <p className="text-white text-2xl font-bold">{predictions.length}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">High Priority</p>
                <p className="text-white text-2xl font-bold">
                  {predictions.filter(p => p.urgency === 'high').length}
                </p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-full">
                <Target className="text-red-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">Avg Confidence</p>
                <p className="text-white text-2xl font-bold">
                  {predictions.length > 0 
                    ? Math.round((predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <Brain className="text-green-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-lg shadow-black/20">
          <h2 className="text-white text-lg font-semibold mb-4">Restock Predictions</h2>

          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="border border-[rgba(255,255,255,0.05)] bg-gradient-to-r from-[rgba(15,20,25,0.5)] to-[rgba(26,31,46,0.5)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-medium">{prediction.medicine_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.urgency === 'high' 
                          ? 'bg-red-500/20 text-red-400' 
                          : prediction.urgency === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {prediction.urgency} priority
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{prediction.reasoning}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-300">
                        Current: <span className="text-white">{prediction.current_stock}</span>
                      </span>
                      <span className="text-gray-300">
                        Suggested: <span className="text-white">{prediction.suggested_reorder}</span>
                      </span>
                      <span className="text-gray-300">
                        Confidence: <span className="text-white">{Math.round((prediction.confidence || 0) * 100)}%</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {predictions.length === 0 && (
            <div className="text-center py-8">
              <Brain className="mx-auto text-gray-500 mb-2" size={32} />
              <p className="text-gray-400">No predictions available</p>
              <p className="text-gray-500 text-sm">Click "Generate New Predictions" to create AI-powered recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}