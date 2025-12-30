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

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return imageUrls;

    setUploading(true);
    const uploadedUrls = [...imageUrls];

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error, data } = await supabase.storage
        .from('cars')
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
      alert('خطأ في الحفظ: ' + error.message);
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Header - محسن للموبايل */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate pr-4">
              {car ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
            >
              <X size={32} />
            </button>
          </div>

          {/* Basic Info Grid - عمود واحد على الموبايل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Input label="الماركة *" value={formData.brand} onChange={(v) => setFormData({ ...formData, brand: v })} placeholder="مثل: Mercedes, Toyota, BMW" />
            <Input label="الموديل *" value={formData.model} onChange={(v) => setFormData({ ...formData, model: v })} placeholder="مثل: S-Class, Camry, X5" />
            <Input label="السنة *" value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} placeholder="مثل: ٢٠٢٤ أو 2024" isNumeric />
            <Input label="السعر (USD) *" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} placeholder="مثل: ٥٠٠٠٠ أو 50000" isNumeric />
            <Input label="المسافة المقطوعة (كم)" value={formData.mileage} onChange={(v) => setFormData({ ...formData, mileage: v })} placeholder="مثل: ٤٥٠٠٠ أو 45000" isNumeric />
            <Select label="الحالة" value={formData.condition} onChange={(v) => setFormData({ ...formData, condition: v })} options={['جديدة', 'مستعملة']} />
            <Input label="نوع المحرك" value={formData.engine_type} onChange={(v) => setFormData({ ...formData, engine_type: v })} placeholder="مثل: V6, V8, Turbo" />
            <Input label="سعة المحرك" value={formData.engine_size} onChange={(v) => setFormData({ ...formData, engine_size: v })} placeholder="مثل: 3.0L أو 2000cc" />
            <Select label="ناقل الحركة" value={formData.transmission} onChange={(v) => setFormData({ ...formData, transmission: v })} options={['أوتوماتيك', 'يدوي']} />
            <Select label="نوع الوقود" value={formData.fuel_type} onChange={(v) => setFormData({ ...formData, fuel_type: v })} options={['بنزين', 'ديزل', 'هايبرد', 'كهربائي']} />
            <Select label="نوع الدفع" value={formData.drive_type} onChange={(v) => setFormData({ ...formData, drive_type: v })} options={['دفع أمامي', 'دفع خلفي', 'دفع رباعي']} />
            <Input label="اللون الخارجي" value={formData.exterior_color} onChange={(v) => setFormData({ ...formData, exterior_color: v })} placeholder="مثل: أسود, أبيض, فضي" />
            <Input label="اللون الداخلي" value={formData.interior_color} onChange={(v) => setFormData({ ...formData, interior_color: v })} placeholder="مثل: جلد بيج, أسود" />
            <Select label="حالة البيع" value={formData.status} onChange={(v) => setFormData({ ...formData, status: v })} options={['متوفرة', 'محجوزة', 'مباعة']} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 mb-2 font-bold text-lg">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              placeholder="اكتب وصفًا مفصلًا عن السيارة، مميزاتها، حالتها، أي إضافات..."
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 resize-none focus:border-red-600 transition text-base"
            />
          </div>

          {/* Images - Drag & Drop */}
          <div>
            <label className="block text-gray-300 mb-4 font-bold text-lg">الصور</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-600 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-red-600 transition bg-gray-800/50"
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg sm:text-xl text-gray-300 mb-2">اسحب الصور هنا أو اضغط للاختيار</p>
              <p className="text-sm text-gray-500">يدعم عدة صور في وقت واحد</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="mt-6 inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg cursor-pointer transition font-bold text-base">
                اختيار من الجهاز
              </label>
            </div>

            {/* معاينة الصور المختارة */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <p className="text-yellow-400 mb-4 text-lg">الصور الجديدة المختارة ({selectedFiles.length}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`معاينة ${i + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-gray-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الصور الحالية */}
            {imageUrls.length > 0 && (
              <div className="mt-6">
                <p className="text-gray-400 mb-4 text-lg">الصور الحالية:</p>
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

            {uploading && <p className="text-yellow-400 text-center mt-6 text-lg">جاري رفع الصور...</p>}
          </div>

          {/* Flags - مرتبة على الموبايل */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <Checkbox label="سيارة مميزة" checked={formData.is_featured} onChange={(v) => setFormData({ ...formData, is_featured: v })} />
            <Checkbox label="إظهار للعملاء" checked={formData.is_visible} onChange={(v) => setFormData({ ...formData, is_visible: v })} />
          </div>

          {/* Actions - أزرار كبيرة ومريحة على الموبايل */}
          <div className="flex flex-col gap-4 pt-6 border-t border-gray-800">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 py-5 rounded-lg font-bold text-white text-xl transition"
            >
              {loading || uploading ? 'جاري الحفظ...' : car ? 'حفظ التعديلات' : 'إضافة السيارة'}
            </button>
            <button type="button" onClick={onClose} className="w-full bg-gray-800 hover:bg-gray-700 py-5 rounded-lg text-white font-bold text-xl transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* المكونات الصغيرة - محسنة للموبايل */
interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  isNumeric?: boolean;
}

function Input({ label, value, onChange, placeholder, isNumeric = false }: InputProps) {
  return (
    <div>
      <label className="block text-gray-300 mb-2 font-bold text-base sm:text-lg">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={label.includes('*')}
        placeholder={placeholder}
        inputMode={isNumeric ? 'numeric' : 'text'}
        pattern={isNumeric ? '[0-9٠١٢٣٤٥٦٧٨٩]*' : undefined}
        dir="rtl"
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-red-600 transition text-base"
      />
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="block text-gray-300 mb-2 font-bold text-base sm:text-lg">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:border-red-600 transition text-base"
      >
        <option value="">اختر...</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center gap-4 cursor-pointer select-none text-base sm:text-lg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-6 h-6 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-600"
      />
      <span className="text-gray-300 font-bold">{label}</span>
    </label>
  );
}
