import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, DollarSign, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../config/supabase';
import { Frame } from '../types';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const Frames = () => {
  const { user } = useAuth();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    color: '',
    material: '',
    size: '',
    stock: 0,
    price: '',
    is_active: true,
  });

  const canManage = user?.role === 'admin' || user?.role === 'warehouse';

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    try {
      const { data, error } = await supabase
        .from('frames')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFrames(data || []);
    } catch (error) {
      console.error('Error fetching frames:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      const frameData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingFrame) {
        const { error } = await supabase
          .from('frames')
          .update(frameData)
          .eq('id', editingFrame.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('frames')
          .insert([frameData]);
        if (error) throw error;
      }
      
      fetchFrames();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving frame:', error);
    }
  };

  const handleEdit = (frame: Frame) => {
    if (!canManage) return;
    
    setEditingFrame(frame);
    setFormData({
      name: frame.name,
      brand: frame.brand,
      model: frame.model,
      color: frame.color,
      material: frame.material,
      size: frame.size,
      stock: frame.stock,
      price: frame.price.toString(),
      is_active: frame.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canManage) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar esta armadura?')) {
      try {
        const { error } = await supabase
          .from('frames')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchFrames();
      } catch (error) {
        console.error('Error deleting frame:', error);
      }
    }
  };

  const updateStock = async (id: number, newStock: number) => {
    if (!canManage) return;
    
    try {
      const { error } = await supabase
        .from('frames')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
      fetchFrames();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      model: '',
      color: '',
      material: '',
      size: '',
      stock: 0,
      price: '',
      is_active: true,
    });
    setEditingFrame(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-800', label: 'Sin Stock' };
    if (stock <= 5) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock Bajo' };
    return { color: 'bg-green-100 text-green-800', label: 'En Stock' };
  };

  const filteredFrames = frames.filter(frame => {
    const matchesSearch = frame.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         frame.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         frame.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && frame.stock <= 5) ||
                        (stockFilter === 'out' && frame.stock === 0) ||
                        (stockFilter === 'available' && frame.stock > 5);
    
    return matchesSearch && matchesStock;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Armaduras</h1>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Armadura</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los stocks</option>
            <option value="available">Stock disponible</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>
        </div>
      </div>

      {/* Frames Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFrames.map((frame) => {
          const stockStatus = getStockStatus(frame.stock);
          return (
            <div key={frame.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{frame.name}</h3>
                {canManage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(frame)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(frame.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Marca:</span>
                    <p className="font-medium">{frame.brand}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Modelo:</span>
                    <p className="font-medium">{frame.model}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <p className="font-medium">{frame.color}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Material:</span>
                    <p className="font-medium">{frame.material}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Talla:</span>
                    <p className="font-medium">{frame.size}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio:</span>
                    <p className="font-medium text-green-600">${frame.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                  <div className="flex items-center space-x-2">
                    {canManage && (
                      <>
                        <button
                          onClick={() => updateStock(frame.id, Math.max(0, frame.stock - 1))}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          disabled={frame.stock === 0}
                        >
                          -
                        </button>
                        <span className="font-bold text-lg">{frame.stock}</span>
                        <button
                          onClick={() => updateStock(frame.id, frame.stock + 1)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          +
                        </button>
                      </>
                    )}
                    {!canManage && (
                      <span className="font-bold text-lg">{frame.stock}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingFrame ? 'Editar Armadura' : 'Nueva Armadura'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Talla *
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Armadura activa
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingFrame ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Frames;