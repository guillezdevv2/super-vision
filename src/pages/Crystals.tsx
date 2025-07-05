import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../config/supabase';
import { Crystal } from '../types';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const Crystals = () => {
  const { user } = useAuth();
  const [crystals, setCrystals] = useState<Crystal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrystal, setEditingCrystal] = useState<Crystal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: '',
    material: 'organico',
    index: '',
    coating: '',
    diameter: '',
    stock: 0,
    price: '',
    is_active: true,
  });

  const canManage = user?.role === 'admin' || user?.role === 'warehouse';

  const materials = ['organico', 'mineral', 'policarbonato', 'trivex'];
  const coatings = ['sin_tratamiento', 'antireflejo', 'endurecido', 'hidrofobico', 'oleofobico', 'blue_light'];

  useEffect(() => {
    fetchCrystals();
  }, []);

  const fetchCrystals = async () => {
    try {
      const { data, error } = await supabase
        .from('crystals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrystals(data || []);
    } catch (error) {
      console.error('Error fetching crystals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      const crystalData = {
        ...formData,
        index: parseFloat(formData.index),
        diameter: parseFloat(formData.diameter),
        price: parseFloat(formData.price),
      };

      if (editingCrystal) {
        const { error } = await supabase
          .from('crystals')
          .update(crystalData)
          .eq('id', editingCrystal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crystals')
          .insert([crystalData]);
        if (error) throw error;
      }
      
      fetchCrystals();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving crystal:', error);
    }
  };

  const handleEdit = (crystal: Crystal) => {
    if (!canManage) return;
    
    setEditingCrystal(crystal);
    setFormData({
      type: crystal.type,
      material: crystal.material,
      index: crystal.index.toString(),
      coating: crystal.coating,
      diameter: crystal.diameter.toString(),
      stock: crystal.stock,
      price: crystal.price.toString(),
      is_active: crystal.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canManage) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este cristal?')) {
      try {
        const { error } = await supabase
          .from('crystals')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchCrystals();
      } catch (error) {
        console.error('Error deleting crystal:', error);
      }
    }
  };

  const updateStock = async (id: number, newStock: number) => {
    if (!canManage) return;
    
    try {
      const { error } = await supabase
        .from('crystals')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
      fetchCrystals();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      material: 'organico',
      index: '',
      coating: '',
      diameter: '',
      stock: 0,
      price: '',
      is_active: true,
    });
    setEditingCrystal(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-800', label: 'Sin Stock' };
    if (stock <= 10) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock Bajo' };
    return { color: 'bg-green-100 text-green-800', label: 'En Stock' };
  };

  const formatCoating = (coating: string) => {
    const coatingNames = {
      sin_tratamiento: 'Sin Tratamiento',
      antireflejo: 'Antireflejo',
      endurecido: 'Endurecido',
      hidrofobico: 'Hidrofóbico',
      oleofobico: 'Oleofóbico',
      blue_light: 'Filtro Luz Azul',
    };
    return coatingNames[coating as keyof typeof coatingNames] || coating;
  };

  const filteredCrystals = crystals.filter(crystal => {
    const matchesSearch = crystal.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crystal.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crystal.coating.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMaterial = materialFilter === 'all' || crystal.material === materialFilter;
    
    return matchesSearch && matchesMaterial;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cristales</h1>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Cristal</span>
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
              placeholder="Buscar por tipo, material o tratamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los materiales</option>
            {materials.map(material => (
              <option key={material} value={material} className="capitalize">
                {material}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Crystals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrystals.map((crystal) => {
          const stockStatus = getStockStatus(crystal.stock);
          return (
            <div key={crystal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{crystal.type}</h3>
                {canManage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(crystal)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(crystal.id)}
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
                    <span className="text-gray-600">Material:</span>
                    <p className="font-medium capitalize">{crystal.material}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Índice:</span>
                    <p className="font-medium">{crystal.index}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tratamiento:</span>
                    <p className="font-medium">{formatCoating(crystal.coating)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Diámetro:</span>
                    <p className="font-medium">{crystal.diameter}mm</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Precio:</span>
                    <p className="font-medium text-green-600">${crystal.price.toLocaleString()}</p>
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
                          onClick={() => updateStock(crystal.id, Math.max(0, crystal.stock - 1))}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          disabled={crystal.stock === 0}
                        >
                          -
                        </button>
                        <span className="font-bold text-lg">{crystal.stock}</span>
                        <button
                          onClick={() => updateStock(crystal.id, crystal.stock + 1)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          +
                        </button>
                      </>
                    )}
                    {!canManage && (
                      <span className="font-bold text-lg">{crystal.stock}</span>
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
        title={editingCrystal ? 'Editar Cristal' : 'Nuevo Cristal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Monofocal, Bifocal, Progresivo"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <select
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {materials.map(material => (
                  <option key={material} value={material} className="capitalize">
                    {material}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Índice de Refracción *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.index}
                onChange={(e) => setFormData({ ...formData, index: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1.50, 1.56, 1.67"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tratamiento *
              </label>
              <select
                value={formData.coating}
                onChange={(e) => setFormData({ ...formData, coating: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar tratamiento...</option>
                {coatings.map(coating => (
                  <option key={coating} value={coating}>
                    {formatCoating(coating)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diámetro (mm) *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.diameter}
                onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 65, 70, 75"
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

            <div className="md:col-span-2">
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
              Cristal activo
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
              {editingCrystal ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Crystals;