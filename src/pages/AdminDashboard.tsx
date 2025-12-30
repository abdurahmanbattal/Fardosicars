import { useEffect, useState } from 'react';
import {
  Car,
  Plus,
  LogOut,
  BarChart,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Star,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Car as CarType } from '../lib/database.types';
import { navigate } from '../components/Router';
import { CarForm } from '../components/CarForm';
import logoImage from '../assets/fardosi_logo.png';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [cars, setCars] = useState<CarType[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [view, setView] = useState<'dashboard' | 'cars'>('dashboard');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/admin');
      return;
    }
    loadCars();
  }, [user]);

  const loadCars = async () => {
    const { data } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setCars(data);
      setStats({
        total: data.length,
        available: data.filter(c => c.status === 'متوفرة').length,
        sold: data.filter(c => c.status === 'مباعة').length
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه السيارة؟')) return;
    await supabase.from('cars').delete().eq('id', id);
    loadCars();
  };

  const toggleVisibility = async (car: CarType) => {
    await supabase
      .from('cars')
      .update({ is_visible: !car.is_visible })
      .eq('id', car.id);
    loadCars();
  };

  const toggleFeatured = async (car: CarType) => {
    await supabase
      .from('cars')
      .update({ is_featured: !car.is_featured })
      .eq('id', car.id);
    loadCars();
  };

  const handleEdit = (car: CarType) => {
    setEditingCar(car);
    setShowForm(true);
    setView('cars');
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCar(null);
    loadCars();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* ===== HEADER ===== */}
      <header className="bg-gradient-to-b from-gray-900 to-black px-4 py-4 border-b border-red-900/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} className="h-10" />
            <div>
              <h1 className="font-bold text-lg">لوحة التحكم</h1>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm"
            >
              عرض الموقع
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600 rounded-lg flex items-center gap-2 text-sm"
            >
              <LogOut size={16} />
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg ${
              view === 'dashboard' ? 'bg-red-600' : 'bg-gray-800'
            }`}
          >
            <BarChart size={18} />
          </button>
          <button
            onClick={() => setView('cars')}
            className={`px-4 py-2 rounded-lg ${
              view === 'cars' ? 'bg-red-600' : 'bg-gray-800'
            }`}
          >
            <Car size={18} />
          </button>
        </div>

        {view === 'cars' && (
          <>
            {showForm ? (
              <CarForm car={editingCar} onClose={handleFormClose} />
            ) : (
              <div className="space-y-4">
                {cars.map(car => (
                  <div
                    key={car.id}
                    className="bg-gray-900 p-4 rounded-xl border border-gray-700"
                  >
                    <div className="flex gap-4">
                      <img
                        src={car.images[0]}
                        className="w-24 h-24 rounded-lg object-cover"
                      />

                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          ${car.price.toLocaleString()}
                        </p>

                        {/* ===== DESKTOP BUTTONS ===== */}
                        <div className="hidden sm:flex gap-2 mt-3">
                          <button onClick={() => handleEdit(car)} className="btn-blue">
                            <Edit size={16} /> تعديل
                          </button>
                          <button onClick={() => toggleVisibility(car)} className="btn-gray">
                            {car.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button onClick={() => toggleFeatured(car)} className="btn-yellow">
                            <Star size={16} />
                          </button>
                          <button onClick={() => handleDelete(car.id)} className="btn-red">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* ===== MOBILE MENU ===== */}
                      <div className="sm:hidden relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === car.id ? null : car.id)
                          }
                          className="p-2 bg-gray-800 rounded-lg"
                        >
                          <M
