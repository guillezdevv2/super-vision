import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, CheckSquare, Clock, User, Calendar, FileText } from 'lucide-react';
import { supabase } from '../config/supabase';
import { Task } from '../types';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    contract_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    measure: false,
    mark: false,
    cut: false,
    bevel: false,
    mount: false,
    quality_check: false,
    notes: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchContracts();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          contracts (
            id,
            clients (first_name, last_name, ci),
            status,
            frame,
            total
          )
        `)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          clients (first_name, last_name, ci),
          status,
          frame
        `)
        .in('status', [
          'Entregado a Producción',
          'Revisión por Calidad',
          'Entregado a Producción Retrabajo'
        ])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        contract_id: parseInt(formData.contract_id),
      };

      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);
        if (error) throw error;
      }
      
      fetchTasks();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      contract_id: task.contract_id.toString(),
      assigned_date: task.assigned_date,
      measure: task.measure,
      mark: task.mark,
      cut: task.cut,
      bevel: task.bevel,
      mount: task.mount,
      quality_check: task.quality_check,
      notes: task.notes || '',
    });
    setIsModalOpen(true);
  };

  const updateTaskStep = async (taskId: number, step: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ [step]: value })
        .eq('id', taskId);
      
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task step:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      contract_id: '',
      assigned_date: new Date().toISOString().split('T')[0],
      measure: false,
      mark: false,
      cut: false,
      bevel: false,
      mount: false,
      quality_check: false,
      notes: '',
    });
    setEditingTask(null);
  };

  const getTaskProgress = (task: any) => {
    const steps = ['measure', 'mark', 'cut', 'bevel', 'mount', 'quality_check'];
    const completed = steps.filter(step => task[step]).length;
    return { completed, total: steps.length, percentage: (completed / steps.length) * 100 };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredTasks = tasks.filter(task => {
    const clientName = `${task.contracts?.clients?.first_name || ''} ${task.contracts?.clients?.last_name || ''}`;
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.contracts?.clients?.ci?.includes(searchTerm) ||
                         task.contracts?.frame?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const progress = getTaskProgress(task);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && progress.percentage < 100) ||
                         (statusFilter === 'completed' && progress.percentage === 100) ||
                         (statusFilter === 'in_progress' && progress.percentage > 0 && progress.percentage < 100);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tareas de Producción</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente, CI o armadura..."
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
            <option value="all">Todas las tareas</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const progress = getTaskProgress(task);
          const progressColor = getProgressColor(progress.percentage);
          
          return (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User size={20} className="text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {task.contracts?.clients?.first_name} {task.contracts?.clients?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">CI: {task.contracts?.clients?.ci}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {format(new Date(task.assigned_date), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Progreso</p>
                    <p className="font-semibold">{progress.completed}/{progress.total}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={20} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progreso de Producción
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(progress.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Task Steps */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                {[
                  { key: 'measure', label: 'Medición', icon: '📏' },
                  { key: 'mark', label: 'Marcado', icon: '✏️' },
                  { key: 'cut', label: 'Corte', icon: '✂️' },
                  { key: 'bevel', label: 'Biselado', icon: '🔧' },
                  { key: 'mount', label: 'Montaje', icon: '🔨' },
                  { key: 'quality_check', label: 'Control', icon: '✅' },
                ].map((step) => (
                  <div key={step.key} className="text-center">
                    <button
                      onClick={() => updateTaskStep(task.id, step.key, !task[step.key])}
                      className={`w-full p-3 rounded-lg border-2 transition-colors ${
                        task[step.key]
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{step.icon}</div>
                      <div className="text-xs font-medium">{step.label}</div>
                      {task[step.key] && (
                        <CheckSquare size={16} className="mx-auto mt-1 text-green-600" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Contract Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Armadura:</span>
                    <p className="font-medium">{task.contracts?.frame || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado del Contrato:</span>
                    <p className="font-medium">{task.contracts?.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <p className="font-medium text-green-600">${task.contracts?.total?.toLocaleString()}</p>
                  </div>
                </div>
                {task.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Notas:</span>
                    <p className="text-sm mt-1">{task.notes}</p>
                  </div>
                )}
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
        title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contrato *
            </label>
            <select
              value={formData.contract_id}
              onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar contrato...</option>
              {contracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.clients?.first_name} {contract.clients?.last_name} - {contract.clients?.ci} ({contract.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Asignación *
            </label>
            <input
              type="date"
              value={formData.assigned_date}
              onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pasos de Producción
            </label>
            <div className="space-y-3">
              {[
                { key: 'measure', label: 'Medición' },
                { key: 'mark', label: 'Marcado' },
                { key: 'cut', label: 'Corte' },
                { key: 'bevel', label: 'Biselado' },
                { key: 'mount', label: 'Montaje' },
                { key: 'quality_check', label: 'Control de Calidad' },
              ].map((step) => (
                <div key={step.key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={step.key}
                    checked={formData[step.key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [step.key]: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={step.key} className="ml-2 block text-sm text-gray-700">
                    {step.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Notas adicionales sobre la tarea..."
            />
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
              {editingTask ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;