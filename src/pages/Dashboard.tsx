import React, { useState, useEffect } from 'react';
import { Users, FileText, Package, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalContracts: 0,
    pendingContracts: 0,
    inWarranty: 0,
  });

  const [recentContracts, setRecentContracts] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentContracts();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: clients } = await supabase.from('clients').select('id');
      const { data: contracts } = await supabase.from('contracts').select('id, status');
      
      const pendingContracts = contracts?.filter(c => 
        !['Entregado al Cliente', 'Finalizado'].includes(c.status)
      ).length || 0;

      const inWarranty = contracts?.filter(c => c.status === 'En Garantía').length || 0;

      setStats({
        totalClients: clients?.length || 0,
        totalContracts: contracts?.length || 0,
        pendingContracts,
        inWarranty,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentContracts = async () => {
    try {
      const { data } = await supabase
        .from('contracts')
        .select(`
          *,
          clients (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentContracts(data || []);
    } catch (error) {
      console.error('Error fetching recent contracts:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Contratos',
      value: stats.totalContracts,
      icon: FileText,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Contratos Pendientes',
      value: stats.pendingContracts,
      icon: Package,
      color: 'bg-yellow-500',
      change: '+3%',
    },
    {
      title: 'En Garantía',
      value: stats.inWarranty,
      icon: AlertCircle,
      color: 'bg-red-500',
      change: '-2%',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      'Encargado': 'bg-blue-100 text-blue-800',
      'Recepcionado como encargo': 'bg-indigo-100 text-indigo-800',
      'Entregado a Producción': 'bg-purple-100 text-purple-800',
      'Revisión por Calidad': 'bg-orange-100 text-orange-800',
      'Entregado a Producción Retrabajo': 'bg-red-100 text-red-800',
      'Recepcionado como Producto': 'bg-teal-100 text-teal-800',
      'Recepcionado Punto de Entrega': 'bg-cyan-100 text-cyan-800',
      'Entregado al Cliente': 'bg-green-100 text-green-800',
      'En Garantía': 'bg-yellow-100 text-yellow-800',
      'Finalizado': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                <span className="text-sm text-gray-600 ml-2">vs mes anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Contracts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Contratos Recientes</h2>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentContracts.map((contract: any) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contract.clients?.first_name} {contract.clients?.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${contract.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contract.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;