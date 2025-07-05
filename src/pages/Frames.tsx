import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../config/supabase';
import { Frame } from '../types';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import { useAuth } from '../contexts/AuthContext';

const Frames = () => {
  const { user } = useAuth();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      alert('Error al guardar armadura. Verifica los permisos.');
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
          .update({ is_active: false })
          .eq('id', id);
        if (error) throw error;
        fetchFrames();
      } catch (error) {
        console.error('Error deactivating frame:', error);
        alert('Error al desactivar armadura.');
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

  const toggleFrameStatus = async (id: number, currentStatus: boolean) => {
    if (!canManage) return;
    
    try {
      const { error } = await supabase
        .from('frames')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchFrames();
    } catch (error) {
      console.error('Error updating frame status:', error);
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
    if (stock === 0) return { color: 'bg-red-100 text-red-800', label: 'Sin Stock', icon: <AlertTriangle size={14} /> };
    if (stock <= 5) return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock Bajo', icon: <AlertTriangle size={14} /> };
    return { color: 'bg-green-100 text-green-800', label: 'En Stock', icon: <Package size={14} /> };
  };

  const columns = useMemo<ColumnDef<Frame>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.name}</div>
          <div className="text-sm text-gray-500">{row.original.brand} - {row.original.model}</div>
        </div>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Detalles',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Color:</span> {row.original.color}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Material:</span> {row.original.material}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Talla:</span> {row.original.size}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }) => (
        <div className="flex items-center text-green-600 font-semibold">
          <DollarSign size={16} className="mr-1" />
          {row.original.price.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row.original.stock);
        return (
          <div className="space-y-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
              {stockStatus.icon}
              <span className="ml-1">{stockStatus.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              {canManage && (
                <>
                  <button
                    onClick={() => updateStock(row.original.id, Math.max(0, row.original.stock - 1))}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded"
                    disabled={row.original.stock === 0}
                  >
                    -
                  </button>
                </>
              )}
              <span className="font-bold text-lg min-w-[2rem] text-center">{row.original.stock}</span>
              {canManage && (
                <button
                  onClick={() => updateStock(row.original.id, row.original.stock + 1)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium px-2 py-1 rounded"
                >
                  +
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <button
          onClick={() => toggleFrameStatus(row.original.id, row.original.is_active)}
          disabled={!canManage}
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            row.original.is_active 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          } ${!canManage ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {row.original.is_active ? 'Activo' : 'Inactivo'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {canManage && (
            <>
              <button
                onClick={() => handleEdit(row.original)}
                className="text-blue-600 hover:text-blue-800"
                title="Editar"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(row.original.id)}
                className="text-red-600 hover:text-red-800"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ], [canManage]);

  const filteredData = useMemo(() => {
    return frames.filter(frame =>
      frame.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frame.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frame.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frame.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frame.material.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [frames, searchTerm]);

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

      <Table
        data={filteredData}
        columns={columns}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, marca, modelo, color o material..."
        loading={loading}
        emptyMessage="No se encontraron armaduras"
      />

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