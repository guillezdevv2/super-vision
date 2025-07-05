import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../config/supabase';
import { Client } from '../types';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import { useAuth } from '../contexts/AuthContext';

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    ci: '',
    address: '',
    email: '',
    phone: '',
    is_active: true,
  });

  const canManage = user?.role === 'admin' || user?.role === 'reception';

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData]);
        if (error) throw error;
      }
      
      fetchClients();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar cliente. Verifica los permisos.');
    }
  };

  const handleEdit = (client: Client) => {
    if (!canManage) return;
    
    setEditingClient(client);
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      ci: client.ci,
      address: client.address || '',
      email: client.email || '',
      phone: client.phone,
      is_active: client.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canManage) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ is_active: false })
          .eq('id', id);
        if (error) throw error;
        fetchClients();
      } catch (error) {
        console.error('Error deactivating client:', error);
        alert('Error al desactivar cliente.');
      }
    }
  };

  const toggleClientStatus = async (id: number, currentStatus: boolean) => {
    if (!canManage) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchClients();
    } catch (error) {
      console.error('Error updating client status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      ci: '',
      address: '',
      email: '',
      phone: '',
      is_active: true,
    });
    setEditingClient(null);
  };

  const columns = useMemo<ColumnDef<Client>[]>(() => [
    {
      accessorKey: 'first_name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-sm text-gray-500">CI: {row.original.ci}</div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contacto',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone size={14} className="mr-2" />
              <span>{row.original.phone}</span>
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail size={14} className="mr-2" />
              <span>{row.original.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ row }) => (
        <div className="max-w-xs">
          {row.original.address ? (
            <div className="flex items-start text-sm text-gray-600">
              <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="truncate">{row.original.address}</span>
            </div>
          ) : (
            <span className="text-gray-400">No especificada</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <button
          onClick={() => toggleClientStatus(row.original.id, row.original.is_active)}
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
      accessorKey: 'created_at',
      header: 'Fecha de Registro',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.original.created_at).toLocaleDateString('es-ES')}
        </span>
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
    return clients.filter(client =>
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.ci.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Cliente</span>
          </button>
        )}
      </div>

      <Table
        data={filteredData}
        columns={columns}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, CI o email..."
        loading={loading}
        emptyMessage="No se encontraron clientes"
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CI *
              </label>
              <input
                type="text"
                value={formData.ci}
                onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
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
              Cliente activo
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
              {editingClient ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;