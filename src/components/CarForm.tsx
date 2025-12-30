import { useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Car } from '../lib/database.types';

interface CarFormProps {
  car: Car | null;
  onClose: () => void;
}

export function CarForm({ car, onClose }: CarFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(car?.images || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    brand: car?.brand || '',
    model: car?.model || '',
    year: car?.year || new Date().getFullYear(),
    price: car?.price || 0,
    mileage: car?.mileage || 0,
    condition: car?.condition || 'مستعملة',
    engine_type: car?.engine_type || '',
    engine_size: car?.engine_size || '',
    transmission: car?.transmission || '',
    fuel_type: car?.fuel_type || '',
    drive_type: car?.drive_type || '',
    exterior_color: car?.exterior_color || '',
    interior_color: car?.interior_color || '',
    description: car?.description || '',
    status: car?.status || 'متوفرة',
    is_featured: car?.is_featured || false,
    is_visible: car?.is_visible || true,
  });

  const toLatinNumber = (value: string | number): number => {
    const str = String(value);
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    const latin = '0123456789';
    const converted = str.replace(/[٠-٩]/g, (match) => latin[arabic.indexOf(match)]);
    return Number(converted) || 0;
  };

  // رفع الصور من الملفات المختارة
  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return imageUrls;

    setUploading(true);
    const uploadedUrls = [...imageUrls];

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error, data } = await supabase.storage
        .from('cars') // اسم البوكيت في Supabase Storage
        .upload(fileName, file);

      if (error) {
        alert(`خطأ في رفع ${file.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('cars').getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
    }

    setSelectedFiles([]);
    setUploading(false);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalImageUrls = await uploadImages();

    const processedData = {
      ...formData,
      year: toLatinNumber(formData.year),
      price: toLatinNumber(formData.price),
      mileage: toLatinNumber(formData.mileage),
      images: finalImageUrls,
    };

    let error;
    if (car) {
      ({ error } = await supabase.from('cars').update(processedData).eq('id', car.id));
    } else {
      ({ error } = await supabase.from('cars').insert([processedData]));
    }

    setLoading(false);

    if (!error) {
      onClose();
    } else {
      alert('حدث خطأ: ' + error.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-red-900/30 rounded-xl w-full max-w-4xl my-8 max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {car ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
              <X size={28} />
            </button>
          </div>

          {/* الحقول نفسها (الماركة، الموديل، إلخ) - نفس الكود اللي عندك */}

          {/* قسم الصور - Drag & Drop */}
          <div>
            <label className="block text-gray-300 mb-2 font-bold text-lg">الصور</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-red-600 transition bg-gray-800/50"
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-xl text-gray-300 mb-2">اسحب الصور هنا أو اضغط للاختيار</p>
              <p className="text-sm text-gray-500">يدعم عدة صور في وقت واحد</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg cursor-pointer transition">
                اختيار من الجهاز
              </label>
            </div>

            {/* عرض الصور المختارة (قبل الرفع) */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <p className="text-yellow-400 mb-3">الصور المختارة ({selectedFiles.length}) - جاهزة للرفع:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`معاينة ${i + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* عرض الصور الموجودة مسبقًا (من السيارة القديمة) */}
            {imageUrls.length > 0 && (
              <div className="mt-6">
                <p className="text-gray-400 mb-3">الصور الحالية:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`صورة ${i + 1}`} className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 left-2 bg-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploading && <p className="text-yellow-400 text-center mt-4">جاري رفع الصور...</p>}
          </div>

          {/* باقي الأقسام (Flags, Actions) نفس اللي عندك */}
          {/* ... */}
        </form>
      </div>
    </div>
  );
}

/* المكونات الصغيرة (Input, Select, Checkbox) نفس اللي عندك */
