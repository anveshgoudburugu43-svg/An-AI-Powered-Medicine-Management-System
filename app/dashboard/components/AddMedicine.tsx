'use client';

import { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2 } from 'lucide-react';

interface AddMedicineProps {
  isOpen: boolean;
  onClose: () => void;
  onMedicineAdded: () => void;
}

interface MedicineInfo {
  name: string;
  description: string;
  dosage: string;
  manufacturer: string;
  expiry_date: string;
  quantity: number;
}

export default function AddMedicine({ isOpen, onClose, onMedicineAdded }: AddMedicineProps) {
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo>({
    name: '',
    description: '',
    dosage: '',
    manufacturer: '',
    expiry_date: '',
    quantity: 1
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractMedicineInfo = async () => {
    if (!selectedImage) return;

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/medicine/extract', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const extractedInfo = await response.json();
        
        // Check if OCR failed and show guidance
        if (extractedInfo._ocrFailed && extractedInfo._guidance) {
          const guidance = extractedInfo._guidance;
          const tipsText = guidance.tips.join('\n• ');
          alert(`⚠️ ${guidance.message}\n\n${guidance.imageInfo}\n\nTips for manual entry:\n• ${tipsText}`);
          return;
        }
        
        // Check if OCR is temporarily disabled
        if (extractedInfo.message) {
          alert(extractedInfo.message);
          return;
        }
        
        // Count how many fields were successfully extracted
        const extractedFields = Object.keys(extractedInfo).filter(key => 
          !key.startsWith('_') && extractedInfo[key] !== null && extractedInfo[key] !== ''
        );
        
        // Only update fields that have actual values (not null or empty)
        const updatedInfo = {
          ...medicineInfo,
          name: extractedInfo.name || medicineInfo.name,
          description: extractedInfo.description || medicineInfo.description,
          dosage: extractedInfo.dosage || medicineInfo.dosage,
          manufacturer: extractedInfo.manufacturer || medicineInfo.manufacturer,
          expiry_date: extractedInfo.expiry_date || medicineInfo.expiry_date,
          // Keep the quantity as set by user
          quantity: medicineInfo.quantity
        };
        
        setMedicineInfo(updatedInfo);
        
        // Show helpful feedback to user
        if (extractedFields.length > 0) {
          alert(`✅ Successfully extracted ${extractedFields.length} field(s): ${extractedFields.join(', ')}. Please review and fill in any missing information.`);
        } else {
          alert(`⚠️ OCR completed but couldn't extract specific medicine information. Please fill in the form manually. 
          
Tip: Make sure the image is clear and contains medicine label text.`);
        }
        
        // Log debug info for development
        if (extractedInfo._debug) {
          console.log('OCR Debug Info:', extractedInfo._debug);
        }
        
      } else {
        const errorData = await response.json();
        console.error('Failed to extract medicine info:', errorData);
        
        // Show more helpful error messages
        let errorMessage = 'Failed to extract medicine information';
        if (errorData.error === 'No meaningful text found in image') {
          errorMessage = 'No text could be detected in the image. Please ensure the image is clear and contains readable text, then try again or fill the form manually.';
        } else if (errorData.error === 'OCR processing failed') {
          errorMessage = 'Text recognition failed. Please try with a clearer image or fill the form manually.';
        }
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error extracting medicine info:', error);
      alert('Error extracting medicine information');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineInfo.name || !medicineInfo.expiry_date) {
      alert('Please fill in at least the medicine name and expiry date');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/medicine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...medicineInfo,
          image_url: imagePreview
        }),
      });

      if (response.ok) {
        onMedicineAdded();
        onClose();
        // Reset form
        setMedicineInfo({
          name: '',
          description: '',
          dosage: '',
          manufacturer: '',
          expiry_date: '',
          quantity: 1
        });
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to add medicine:', errorData);
        alert(`Failed to add medicine: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      alert('Error adding medicine');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#171f34] border border-[rgba(255,255,255,0.5)] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-semibold">Add Medicine</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Medicine Image</label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Medicine preview"
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="text-red-400 text-sm hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="mx-auto text-gray-400" size={32} />
                  <p className="text-gray-400 text-sm">Upload medicine image</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#049eb8] text-white px-4 py-2 rounded text-sm hover:bg-[#41cbe2]"
                  >
                    Choose Image
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {selectedImage && !isExtracting && (
              <button
                type="button"
                onClick={extractMedicineInfo}
                className="w-full bg-[#41cbe2] text-white py-2 rounded text-sm hover:bg-[#049eb8] flex items-center justify-center space-x-2"
              >
                <Upload size={16} />
                <span>Extract Info from Image</span>
              </button>
            )}
            {isExtracting && (
              <div className="flex items-center justify-center space-x-2 text-[#41cbe2]">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Extracting information...</span>
              </div>
            )}
          </div>

          {/* Medicine Name */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Medicine Name *</label>
            <input
              type="text"
              value={medicineInfo.name}
              onChange={(e) => setMedicineInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-[#1f1b2c] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#41cbe2]"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Description</label>
            <textarea
              value={medicineInfo.description}
              onChange={(e) => setMedicineInfo(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-[#1f1b2c] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#41cbe2] h-20 resize-none"
            />
          </div>

          {/* Dosage */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Dosage</label>
            <input
              type="text"
              value={medicineInfo.dosage}
              onChange={(e) => setMedicineInfo(prev => ({ ...prev, dosage: e.target.value }))}
              className="w-full bg-[#1f1b2c] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#41cbe2]"
              placeholder="e.g., 500mg twice daily"
            />
          </div>

          {/* Manufacturer */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Manufacturer</label>
            <input
              type="text"
              value={medicineInfo.manufacturer}
              onChange={(e) => setMedicineInfo(prev => ({ ...prev, manufacturer: e.target.value }))}
              className="w-full bg-[#1f1b2c] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#41cbe2]"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Expiry Date *</label>
            <input
              type="date"
              value={medicineInfo.expiry_date}
              onChange={(e) => setMedicineInfo(prev => ({ ...prev, expiry_date: e.target.value }))}
              className="w-full bg-[#1f1b2c] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#41cbe2]"
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Quantity</label>
            <input
              type="number"
              min="1"
              value={medicineInfo.quantity}
              onChange={(e) => setMedicineInfo(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full bg-[#1f1b2c] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-[#41cbe2]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#049eb8] text-white py-2 rounded hover:bg-[#41cbe2] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Medicine</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}