import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, ChevronRight, User, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';
import { Contract, Client, ContractStatus } from '../types';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Contracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const contractStatuses: ContractStatus[] = [
    'Encargado',
    'Recepcionado como encargo',
    'Entregado a Producción',
    'Revisión por Calidad',
    'Entregado a Producción Retrabajo',
    'Recepcionado como Producto',
    'Recepcionado Punto de Entrega',
    'Entregado al Cliente',
    'En Garantía',
    'Finalizado',
  ];

  const [formData, setFormData] = useState({
    client: '',
    frame: '',
    sphere_od: '',
    sphere_oi: '',
    cylinder_od: '',
    cylinder_oi: '',
    axis_od: '',
    axis_oi: '',
    prysm_od: '',
    prysm_oi: '',
    base_od: '',
    base_oi: '',
    add: '',
    dp: '',
    shape: 'redondo',
    mode: 'monofocal',
    crystal: 'organico',
    color: 'transparente',
    total: '',
    paid_cash: '',
    paid_transfer: '',
    paid_type: 'efectivo',
    status: 'Encargado',
    confirmed: false,
    supervised: false,
    beneficiary_name: '',
    beneficiary_phone: '',
    beneficiary_ci: '',
    presented: 'no',
  });

  useEffect(() => {
    fetchContracts();
    fetchClients();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (first_name, last_name, ci, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contractData = {
        ...formData,
        client: parseInt(formData.client),
        sphere_od: formData.sphere_od ? parseFloat(formData.sphere_od) : null,
        sphere_oi: formData.sphere_oi ? parseFloat(formData.sphere_oi) : null,
        cylinder_od: formData.cylinder_od ? parseFloat(formData.cylinder_od) : null,
        cylinder_oi: formData.cylinder_oi ? parseFloat(formData.cylinder_oi) : null,
        axis_od: formData.axis_od ? parseFloat(formData.axis_od) : null,
        axis_oi: formData.axis_oi ? parseFloat(formData.axis_oi) : null,
        prysm_od: formData.prysm_od ? parseFloat(formData.prysm_od) : null,
        prysm_oi: formData.prysm_oi ? parseFloat(formData.prysm_oi) : null,
        base_od: formData.base_od ? parseFloat(formData.base_od) : null,
        base_oi: formData.base_oi ? parseFloat(formData.base_oi) : null,
        add: formData.add ? parseFloat(formData.add) : null,
        total: parseFloat(formData.total),
        paid_cash: formData.paid_cash ? parseFloat(formData.paid_cash) : null,
        paid_transfer: formData.paid_transfer ? parseFloat(formData.paid_transfer) : null,
      };

      if (editingContract) {
        const { error } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', editingContract.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert([contractData]);
        if (error) throw error;
      }
      
      fetchContracts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const updateContractStatus = async (contractId: number, newStatus: ContractStatus) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contractId);
      
      if (error) throw error;
      fetchContracts();
    } catch (error) {
      console.error('Error updating contract status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client: '',
      frame: '',
      sphere_od: '',
      sphere_oi: '',
      cylinder_od: '',
      cylinder_oi: '',
      axis_od: '',
      axis_oi: '',
      prysm_od: '',
      prysm_oi: '',
      base_od: '',
      base_oi: '',
      add: '',
      dp: '',
      shape: 'redondo',
      mode: 'monofocal',
      crystal: 'organico',
      color: 'transparente',
      total: '',
      paid_cash: '',
      paid_transfer: '',
      paid_type: 'efectivo',
      status: 'Encargado',
      confirmed: false,
      supervised: false,
      beneficiary_name: '',
      beneficiary_phone: '',
      beneficiary_ci: '',
      presented: 'no',
    });
    setEditingContract(null);
  };

  const getStatusColor = (status: ContractStatus) => {
    const colors = {
      'Encargado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Recepcionado como encargo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Entregado a Producción': 'bg-purple-100 text-purple-800 border-purple-200',
      'Revisión por Calidad': 'bg-orange-100 text-orange-800 border-orange-200',
      'Entregado a Producción Retrabajo': 'bg-red-100 text-red-800 border-red-200',
      'Recepcionado como Producto': 'bg-teal-100 text-teal-800 border-teal-200',
      'Recepcionado Punto de Entrega': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Entregado al Cliente': 'bg-green-100 text-green-800 border-green-200',
      'En Garantía': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Finalizado': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getNextStatus = (currentStatus: ContractStatus): ContractStatus | null => {
    const currentIndex = contractStatuses.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === contractStatuses.length - 1) return null;
    return contractStatuses[currentIndex + 1];
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.clients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.clients?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.clients?.ci?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nuevo Contrato</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            {contractStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User size={20} className="text-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.clients?.first_name} {contract.clients?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">CI: {contract.clients?.ci}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-gray-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    ${contract.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {new Date(contract.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(contract.status)}`}>
                  {contract.status}
                </span>
                {getNextStatus(contract.status) && (
                  <button
                    onClick={() => updateContractStatus(contract.id, getNextStatus(contract.status)!)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title={`Avanzar a: ${getNextStatus(contract.status)}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Armadura</p>
                <p className="font-medium">{contract.frame || 'No especificado'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Forma</p>
                <p className="font-medium capitalize">{contract.shape}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Tipo</p>
                <p className="font-medium capitalize">{contract.mode}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Cristal</p>
                <p className="font-medium capitalize">{contract.crystal}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {contract.confirmed && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmado
                  </span>
                )}
                {contract.supervised && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Supervisado
                  </span>
                )}
                {contract.status === 'En Garantía' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertCircle size={12} className="mr-1" />
                    Garantía
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver Detalles
                </button>
                <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for New/Edit Contract */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingContract ? 'Editar Contrato' : 'Nuevo Contrato'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} - {client.ci}
                </option>
              ))}
            </select>
          </div>

          {/* Frame */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Armadura
            </label>
            <input
              type="text"
              value={formData.frame}
              onChange={(e) => setFormData({ ...formData, frame: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Especificar armadura..."
            />
          </div>

          {/* Prescription Data */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Prescripción</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Esfera OD
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.sphere_od}
                  onChange={(e) => setFormData({ ...formData, sphere_od: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Esfera OI
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.sphere_oi}
                  onChange={(e) => setFormData({ ...formData, sphere_oi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cilindro OD
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.cylinder_od}
                  onChange={(e) => setFormData({ ...formData, cylinder_od: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cilindro OI
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.cylinder_oi}
                  onChange={(e) => setFormData({ ...formData, cylinder_oi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Lens Specifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Especificaciones</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma *
                </label>
                <select
                  value={formData.shape}
                  onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="redondo">Redondo</option>
                  <option value="cuadrado">Cuadrado</option>
                  <option value="aviador">Aviador</option>
                  <option value="cat-eye">Cat Eye</option>
                  <option value="deportivo">Deportivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="monofocal">Monofocal</option>
                  <option value="bifocal">Bifocal</option>
                  <option value="progresivo">Progresivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cristal *
                </label>
                <select
                  value={formData.crystal}
                  onChange={(e) => setFormData({ ...formData, crystal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="organico">Orgánico</option>
                  <option value="mineral">Mineral</option>
                  <option value="policarbonato">Policarbonato</option>
                  <option value="trivex">Trivex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="transparente">Transparente</option>
                  <option value="fotocromático">Fotocromático</option>
                  <option value="polarizado">Polarizado</option>
                  <option value="espejo">Espejo</option>
                  <option value="degradado">Degradado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pago</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pago
                </label>
                <select
                  value={formData.paid_type}
                  onChange={(e) => setFormData({ ...formData, paid_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingContract ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Contracts;