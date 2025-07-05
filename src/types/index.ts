export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'reception' | 'warehouse';
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  ci: string;
  address?: string;
  email?: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface Contract {
  id: number;
  client: number;
  frame?: string;
  sphere_od?: number;
  sphere_oi?: number;
  cylinder_od?: number;
  cylinder_oi?: number;
  axis_od?: number;
  axis_oi?: number;
  prysm_od?: number;
  prysm_oi?: number;
  base_od?: number;
  base_oi?: number;
  add?: number;
  dp?: string;
  shape: 'redondo' | 'cuadrado' | 'aviador' | 'cat-eye' | 'deportivo';
  mode: 'bifocal' | 'progresivo' | 'monofocal';
  crystal: 'organico' | 'mineral' | 'policarbonato' | 'trivex';
  color: 'transparente' | 'fotocromático' | 'polarizado' | 'espejo' | 'degradado';
  total: number;
  paid_cash?: number;
  paid_transfer?: number;
  paid_type?: 'efectivo' | 'transferencia' | 'mixto';
  status: ContractStatus;
  confirmed: boolean;
  supervised: boolean;
  beneficiary_name?: string;
  beneficiary_phone?: string;
  beneficiary_ci?: string;
  presented?: 'si' | 'no';
  warranty_end_date?: string;
  end_payment_cup?: number;
  end_payment_transfer?: number;
  end_payment_method?: 'efectivo' | 'transferencia' | 'mixto';
  created_at: string;
}

export type ContractStatus = 
  | 'Encargado'
  | 'Recepcionado como encargo'
  | 'Entregado a Producción'
  | 'Revisión por Calidad'
  | 'Entregado a Producción Retrabajo'
  | 'Recepcionado como Producto'
  | 'Recepcionado Punto de Entrega'
  | 'Entregado al Cliente'
  | 'En Garantía'
  | 'Finalizado';

export interface Frame {
  id: number;
  name: string;
  brand: string;
  model: string;
  color: string;
  material: string;
  size: string;
  stock: number;
  price: number;
  is_active: boolean;
}

export interface Crystal {
  id: number;
  type: string;
  material: string;
  index: number;
  coating: string;
  diameter: number;
  stock: number;
  price: number;
  is_active: boolean;
}

export interface Task {
  id: number;
  contract_id: number;
  assigned_date: string;
  measure: boolean;
  mark: boolean;
  cut: boolean;
  bevel: boolean;
  mount: boolean;
  quality_check: boolean; // Updated from 'check' to 'quality_check'
  notes?: string;
  created_at: string;
}