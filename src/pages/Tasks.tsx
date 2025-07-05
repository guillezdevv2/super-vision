import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, CheckSquare, Clock, User, Calendar, FileText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../config/supabase';
import { Task } from '../types';
import Modal from '../components/UI/Modal';
import Table from '../components/UI/Table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      alert('Error al guardar tarea.');
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

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'client',
      header: 'Cliente',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.contracts?.clients?.first_name} {row.original.contracts?.clients?.last_name}
          </div>
          <div className="text-sm text-gray-500">CI: {row.original.contracts?.clients?.ci}</div>
        </div>
      ),
    },
    {
      accessorKey: 'contract_details',
      header: 'Contrato',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Armadura:</span> {row.original.contracts?.frame || 'No especificado'}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Estado:</span> {row.original.contracts?.status}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total:</span> ${row.original.contracts?.total?.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'assigned_date',
      header: 'Fecha Asignada',
      cell: ({ row }) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={14} className="mr-2" />
          <span>{format(new Date(row.original.assigned_date), 'dd MMM yyyy', { locale: es })}</span>
        </div>
      ),
    },
    {
      accessorKey: 'progress',
      header: 'Progreso',
      cell: ({ row }) => {
        const progress = getTaskProgress(row.original);
        const progressColor = getProgressColor(progress.percentage);
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {progress.completed}/{progress.total}
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
        );
      },
    },
    {
      accessorKey: 'steps',
      header: 'Pasos',
      cell: ({ row }) => (
        <div className="grid grid-cols-3 gap-1">
          {[
            { key: 'measure', label: 'Med', icon: '📏' },
            { key: 'mark', label: 'Mar', icon: '✏️' },
            { key: 'cut', label: 'Cor', icon: '✂️' },
            { key: 'bevel', label: 'Bis', icon: '🔧' },
            { key: 'mount', label: 'Mon', icon: '🔨' },
            { key: 'quality_check', label: 'Cal', icon: '✅' },
          ].map((step) => (
            <button
              key={step.key}
              onClick={() => updateTaskStep(row.original.id, step.key, !row.original[step.key])}
              className={`p-1 rounded text-xs transition-colors ${
                row.original[step.key]
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
              title={step.label}
            >
              <div className="text-xs">{step.icon}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  const filteredData = useMemo(() => {
    return tasks.filter(task => {
      const clientName = `${task.contracts?.clients?.first_name || ''} ${task.contracts?.clients?.last_name || ''}`;
      return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.contracts?.clients?.ci?.includes(searchTerm) ||
             task.contracts?.frame?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [tasks, searchTerm]);

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

      <Table
        data={filteredData}
        columns={columns}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por cliente, CI o armadura..."
        loading={loading}
        emptyMessage="No se encontraron tareas"
      />

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