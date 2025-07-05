import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  Package, 
  Glasses, 
  CheckSquare,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: FileText, label: 'Contratos', path: '/contracts' },
    { icon: Package, label: 'Armaduras', path: '/frames' },
    { icon: Glasses, label: 'Cristales', path: '/crystals' },
    { icon: CheckSquare, label: 'Tareas', path: '/tasks' },
    { icon: Settings, label: 'Usuarios', path: '/users', adminOnly: true },
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-10">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Super Vision</h1>
        <p className="text-sm text-gray-600">Sistema de Administración</p>
      </div>
      
      <nav className="mt-6">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-800 border-r-4 border-blue-800' : ''
              }`}
            >
              <Icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-full p-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-800 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;