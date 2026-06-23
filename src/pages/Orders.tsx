import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Order, OrderStatus } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, Edit2, Download, Bell, Clock, CheckCircle2, 
  XCircle, Truck, ShoppingBag, ShoppingCart, Phone, 
  MessageSquare, MapPin, MoreHorizontal, UserPlus, 
  ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, 
  Check, RefreshCw, AlertCircle, Calendar, Plus, X, Info
} from 'lucide-react';

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'o_9872a',
    store_name: 'Downtown Grocery Store',
    amount: 54.00,
    total_amount: 54.00,
    items: 1,
    products_summary: '1x Fresh Whole Milk Premium (1 Litre)',
    user_phone: '+91 6005358955',
    user_name: 'Dawar',
    status: 'Delivered',
    driver_name: 'Unassigned',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'o_1245b',
    store_name: 'Corner Pantry Store',
    amount: 139.00,
    total_amount: 139.00,
    items: 2,
    products_summary: '1x Fresh Whole Milk Premium (1 Litre), 1x Brown Farm Eggs (Large)',
    user_phone: '+91 9818082449',
    user_name: 'dawar',
    status: 'Delivered',
    driver_name: 'azhar',
    driver_phone: '9818082449',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'o_5321c',
    store_name: 'Supermart Fresh',
    amount: 52.00,
    total_amount: 52.00,
    items: 1,
    products_summary: '1x Fresh Whole Milk Premium (1 Litre)',
    user_phone: '+91 6005358955',
    user_name: 'dawar',
    status: 'Delivered',
    driver_name: 'dawar',
    driver_phone: '6005358955',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  }
];

const PRESET_DRIVERS = [
  { name: 'azhar', phone: '9818082449', rating: '4.8', active: true },
  { name: 'dawar', phone: '6005358955', rating: '4.9', active: true },
  { name: 'Vikram Singh', phone: '+91 91234 56789', rating: '4.7', active: true },
  { name: 'Amit Patel', phone: '+91 98123 45670', rating: '4.9', active: false }
];

interface ParsedItem {
  id: string;
  name: string;
  qty: number;
  variant: string;
  price: number;
  total: number;
  image: string;
}

// Custom Date Helpers
const formatFullDate = (isoStr?: string) => {
  if (!isoStr) return '17 May 2025 at 10:30 AM';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '17 May 2025 at 10:30 AM';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} at ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  } catch {
    return '17 May 2025 at 10:30 AM';
  }
};

const formatShortDate = (isoStr?: string) => {
  if (!isoStr) return { date: '17 May', time: '10:30 AM' };
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return { date: '17 May', time: '10:30 AM' };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      date: `${d.getDate()} ${months[d.getMonth()]}`,
      time: `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`
    };
  } catch {
    return { date: '17 May', time: '10:30 AM' };
  }
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [driverFilter, setDriverFilter] = useState('All Drivers');
  const [dateFilter, setDateFilter] = useState('Today');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);

  const [orderKeys, setOrderKeys] = useState<string[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Statistics Calculation
  const totalOrdersCount = orders.length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const transitCount = orders.filter(o => o.status === 'Out for Delivery' || o.status === 'Preparing').length;
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const totalRevenueSum = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + (o.total_amount ?? o.amount ?? 0), 0);

  const getOrderItemName = (order: Order): string => {
    if (order.products_summary && String(order.products_summary).trim()) return String(order.products_summary);
    if (order.product_name && String(order.product_name).trim()) return String(order.product_name);
    if (order.product_names && String(order.product_names).trim()) return String(order.product_names);
    if (order.items_details && String(order.items_details).trim()) return String(order.items_details);
    if (order.item_names && String(order.item_names).trim()) return String(order.item_names);
    if (order.order_name && String(order.order_name).trim()) return String(order.order_name);
    
    if (order.products) {
      if (typeof order.products === 'string' && order.products.trim()) return order.products;
      try {
        const parsed = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => p.name || p.product_name || p.title || JSON.stringify(p)).join(', ');
        }
        if (typeof parsed === 'object') return parsed.name || parsed.product_name || JSON.stringify(parsed);
      } catch {}
    }
    return `${order.items || 1}x Item(s) (e.g. Fresh Groceries)`;
  };

  // Helper to parse order summary text into structured list of products
  const parseOrderItemsDetails = (order: Order): ParsedItem[] => {
    const text = getOrderItemName(order);
    const itemsList: ParsedItem[] = [];
    
    if (!text) {
      const price = order.total_amount ?? order.amount ?? 54.00;
      return [{
        id: '1',
        name: 'Fresh Whole Milk Premium',
        qty: order.items || 1,
        variant: '1 Litre',
        price: price / (order.items || 1),
        total: price,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=150'
      }];
    }

    const parts = text.split(/,\s*/);
    let accumulated = 0;
    const finalAmount = order.total_amount ?? order.amount ?? 54.00;

    parts.forEach((part, index) => {
      const qtyMatch = part.match(/^(\d+)\s*[xX]\s*(.+)$/);
      let qty = 1;
      let nameVariantStr = part;
      if (qtyMatch) {
        qty = parseInt(qtyMatch[1]) || 1;
        nameVariantStr = qtyMatch[2];
      }

      const variantMatch = nameVariantStr.match(/(.+?)\s*\((.+?)\)/);
      let name = nameVariantStr;
      let variant = 'Standard Packaging';
      if (variantMatch) {
        name = variantMatch[1];
        variant = variantMatch[2];
      } else {
        const volumeMatch = nameVariantStr.match(/(.+?)\s*(\d+\s*(?:Litre|litre|L|g|kg|Kg|Pack|pack|Pound|lbs))\s*$/i);
        if (volumeMatch) {
          name = volumeMatch[1];
          variant = volumeMatch[2];
        }
      }

      name = name.trim();
      variant = variant.trim();

      // Determine images based on ingredients
      let image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150';
      const lowercase = name.toLowerCase();
      if (lowercase.includes('milk') || lowercase.includes('dairy') || lowercase.includes('cheese') || lowercase.includes('curd')) {
        image = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=150';
      } else if (lowercase.includes('bread') || lowercase.includes('sliced') || lowercase.includes('bun') || lowercase.includes('bakery')) {
        image = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=150';
      } else if (lowercase.includes('egg')) {
        image = 'https://images.unsplash.com/photo-1582722411495-20723ec45b9a?auto=format&fit=crop&q=80&w=150';
      } else if (lowercase.includes('mango') || lowercase.includes('alphonso')) {
        image = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=150';
      } else if (lowercase.includes('banana') || lowercase.includes('apple') || lowercase.includes('fruit')) {
        image = 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=150';
      } else if (lowercase.includes('chips') || lowercase.includes('snack') || lowercase.includes('instant') || lowercase.includes('ramen')) {
        image = 'https://images.unsplash.com/photo-1599490659213-e2b9527ec087?auto=format&fit=crop&q=80&w=150';
      }

      const rawPrice = 52.00;
      accumulated += rawPrice * qty;

      itemsList.push({
        id: String(index + 1),
        name,
        qty,
        variant,
        price: rawPrice,
        total: rawPrice * qty,
        image,
      });
    });

    // Uniformly scale prices to sum up exactly to the total order price minus standard delivery
    const deliveryFee = 2.00;
    const subtotalTarget = Math.max(0, finalAmount - deliveryFee);
    if (itemsList.length > 0 && accumulated > 0) {
      const scale = subtotalTarget / accumulated;
      itemsList.forEach((item) => {
        item.price = Math.round((item.price * scale) * 100) / 100;
        item.total = Math.round((item.price * item.qty) * 100) / 100;
      });
    }

    return itemsList;
  };

  const fetchOrders = async () => {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data, error } = await query;
      
      if (error) {
        console.warn('Supabase fetch orders warning:', error);
        setBackendError(`${error.message || JSON.stringify(error)} (Code: ${error.code || 'None'})`);
        setIsLiveConnected(false);
        loadLocalBackup();
      } else if (!data || data.length === 0) {
        setBackendError(null);
        setIsLiveConnected(true);
        loadLocalBackup();
      } else {
        setBackendError(null);
        setIsLiveConnected(true);
        const fetched = data as Order[];
        setOrders(fetched);
        localStorage.setItem('neighborcart_orders', JSON.stringify(fetched));
        if (fetched.length > 0) setOrderKeys(Object.keys(fetched[0]));
      }
    } catch (e: any) {
      console.warn('Database offline fallback:', e);
      setBackendError(e.message || 'Failed connecting to database server.');
      setIsLiveConnected(false);
      loadLocalBackup();
    }
  };

  const loadLocalBackup = () => {
    const local = localStorage.getItem('neighborcart_orders');
    if (local) {
      const parsed = JSON.parse(local);
      setOrders(parsed);
      if (parsed.length > 0) setOrderKeys(Object.keys(parsed[0]));
    } else {
      setOrders(DEFAULT_ORDERS);
      localStorage.setItem('neighborcart_orders', JSON.stringify(DEFAULT_ORDERS));
      if (DEFAULT_ORDERS.length > 0) setOrderKeys(Object.keys(DEFAULT_ORDERS[0]));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const val = Number(editingOrder.total_amount ?? editingOrder.amount ?? 0);
      const updateData: any = {
        status: editingOrder.status,
        driver_name: editingOrder.driver_name,
        driver_phone: editingOrder.driver_phone,
        user_name: editingOrder.user_name || editingOrder.customer_name || null,
        user_phone: editingOrder.user_phone,
      };

      if (orderKeys.includes('customer_name') || 'customer_name' in (orders[0] || {})) {
        updateData.customer_name = editingOrder.user_name || editingOrder.customer_name || null;
      }

      const productVal = editingOrder.products_summary || editingOrder.items_details || editingOrder.product_name || '';
      const fields = ['product_name', 'product_names', 'items_details', 'item_names', 'order_name', 'products_summary'];
      let updatedField = false;

      fields.forEach(f => {
        if (orderKeys.includes(f) || f in (orders[0] || {})) {
          updateData[f] = productVal;
          updatedField = true;
        }
      });

      if (!updatedField) {
        updateData.products_summary = productVal;
      }

      if (orderKeys.includes('total_amount') || 'total_amount' in (orders[0] || {})) {
        updateData.total_amount = val;
      }
      if (orderKeys.includes('amount') || 'amount' in (orders[0] || {})) {
        updateData.amount = val;
      }

      const nextOrders = orders.map(o => o.id === editingOrder.id ? { ...o, ...editingOrder, ...updateData } : o);

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', editingOrder.id);

      if (error) {
        setOrders(nextOrders);
        localStorage.setItem('neighborcart_orders', JSON.stringify(nextOrders));
        toast.info('Local backup updated successfully');
      } else {
        toast.success('Database updated successfully');
        fetchOrders();
      }
      
      // Update selected order view
      if (selectedOrder && selectedOrder.id === editingOrder.id) {
        setSelectedOrder({ ...selectedOrder, ...editingOrder, ...updateData });
      }

      setEditingOrder(null);
    } catch {
      const nextOrders = orders.map(o => o.id === editingOrder.id ? { ...o, ...editingOrder } : o);
      setOrders(nextOrders);
      localStorage.setItem('neighborcart_orders', JSON.stringify(nextOrders));
      toast.info('Order details saved in local offline state');
      setEditingOrder(null);
    }
  };

  const handleUpdateStatusQuick = async (orderId: string, nextStatus: OrderStatus) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    const modified = { ...target, status: nextStatus };
    const list = orders.map(o => o.id === orderId ? modified : o);
    setOrders(list);
    localStorage.setItem('neighborcart_orders', JSON.stringify(list));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(modified);
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) {
        toast.info(`Status set to ${nextStatus} (Stored in local sandbox backup)`);
      } else {
        toast.success(`Fulfillment updated to ${nextStatus}`);
        fetchOrders();
      }
    } catch {
      toast.info(`Fulfillment altered to ${nextStatus} locally`);
    }
  };

  const handleAssignDriverQuick = async (orderId: string, driverName: string, driverPhone: string) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    const modified = { ...target, driver_name: driverName, driver_phone: driverPhone };
    const list = orders.map(o => o.id === orderId ? modified : o);
    setOrders(list);
    localStorage.setItem('neighborcart_orders', JSON.stringify(list));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(modified);
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ driver_name: driverName, driver_phone: driverPhone })
        .eq('id', orderId);

      if (error) {
        toast.info(`Assigned driver ${driverName} successfully (Sandbox Mode)`);
      } else {
        toast.success(`Driver ${driverName} assigned to deliver this order!`);
        fetchOrders();
      }
    } catch {
      toast.info(`Assigned driver ${driverName} locally`);
    }
    setAssigningOrder(null);
  };

  const handleDownloadCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders available in current selection to export');
      return;
    }

    const headers = ['Order ID', 'Store Name', 'Customer Name', 'Phone', 'Status', 'Driver', 'Amount (INR)', 'Created At'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.store_name || 'NeighborCart Grocery',
      o.user_name || o.customer_name || 'Customer',
      o.user_phone,
      o.status,
      o.driver_name || 'Unassigned',
      (o.total_amount ?? o.amount ?? 0).toFixed(2),
      o.created_at || ''
    ]);

    const csvStr = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    try {
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `neighborcart_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Fulfillment CSV file exported successfully!');
    } catch {
      toast.error('Could not initiate CSV save process.');
    }
  };

  // Bulk operations
  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(item => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Filters logic
  const filteredOrders = orders.filter((o) => {
    // Search
    const idStr = String(o.id || '').toLowerCase();
    const phoneStr = String(o.user_phone || '').toLowerCase();
    const nameStr = String(o.user_name || o.customer_name || '').toLowerCase();
    const itemsStr = getOrderItemName(o).toLowerCase();
    const matchesSearch = idStr.includes(search.toLowerCase()) || 
                          phoneStr.includes(search.toLowerCase()) || 
                          nameStr.includes(search.toLowerCase()) || 
                          itemsStr.includes(search.toLowerCase());

    // Status
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;

    // Driver
    let matchesDriver = true;
    if (driverFilter !== 'All Drivers') {
      if (driverFilter === 'Unassigned') {
        matchesDriver = !o.driver_name || o.driver_name === 'Unassigned';
      } else {
        matchesDriver = o.driver_name === driverFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesDriver;
  });

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">Orders</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Sync Status Pill */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2 hover:bg-emerald-100/50 transition-colors cursor-pointer" onClick={fetchOrders}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-left leading-none">
              <span className="text-[11px] font-bold text-emerald-700 block uppercase font-mono tracking-wider">Live Sync Active</span>
              <span className="text-[9px] text-emerald-500 font-mono tracking-tight font-medium">Connected to Supabase</span>
            </div>
          </div>

          <Button 
            id="btn-export-csv"
            onClick={handleDownloadCSV} 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm font-semibold py-2 px-3.5 rounded-xl text-xs h-10 transition-all active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </Button>

          <Button
            onClick={fetchOrders}
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 active:rotate-18deg transition-all"
            title="Refresh database records"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </Button>

          <div className="relative p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer">
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 text-[9px] font-black text-white rounded-full flex items-center justify-center">3</span>
            <Bell className="h-4.5 w-4.5 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Backend Status Errors Banner */}
      {backendError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 space-y-1 my-2 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
            <h4 className="font-bold text-xs tracking-tight uppercase font-mono">Live Database Interrupted</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-600 font-medium">
            System is securely operating in Local Cache Sandbox. Real-time orders loaded here are preserved locally but will not stream to public DB.
          </p>
        </div>
      )}

      {/* Five-Card Premium Analytics Metrics Grid Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Orders */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 flex items-center gap-0.5">
              ↑ 12%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase font-mono text-[10px]">Total Orders</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-0.5">{totalOrdersCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">from yesterday</span>
          </div>
        </div>

        {/* Card 2: Delivered */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
              {totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase font-mono text-[10px]">Delivered</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-0.5">{deliveredCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">of total orders</span>
          </div>
        </div>

        {/* Card 3: In Transit */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
              {totalOrdersCount > 0 ? Math.round((transitCount / totalOrdersCount) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase font-mono text-[10px]">In Transit</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-0.5">{transitCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">active delivery</span>
          </div>
        </div>

        {/* Card 4: Pending */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
              {totalOrdersCount > 0 ? Math.round((pendingCount / totalOrdersCount) * 100) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase font-mono text-[10px]">Pending</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-0.5">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">awaiting actions</span>
          </div>
        </div>

        {/* Card 5: Total Revenue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 group col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="p-2.2 rounded-xl bg-sky-50 text-sky-600 font-bold font-mono text-sm leading-none h-10 w-10 flex items-center justify-center border border-sky-100 group-hover:scale-110 transition-transform">
              ₹
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 flex items-center gap-0.5">
              ↑ 18%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 block tracking-wider uppercase font-mono text-[10px]">Total Revenue</span>
            <span className="text-2xl font-bold text-slate-800 tracking-tight block mt-0.5 font-mono">₹{totalRevenueSum.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">from yesterday</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white border border-slate-150 p-3.5 rounded-2xl gap-3.5 shadow-xs">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by Order ID, customer name, items or phone..."
            className="pl-10 h-11 border-slate-200 text-sm focus-visible:ring-indigo-600 rounded-xl w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* dropdowns select */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:flex lg:items-center lg:gap-2">
          {/* Status Select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 border-slate-200 text-xs font-semibold bg-white rounded-xl min-w-[125px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Preparing">Preparing</SelectItem>
              <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Driver Select */}
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="h-11 border-slate-200 text-xs font-semibold bg-white rounded-xl min-w-[130px]">
              <SelectValue placeholder="All Drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Drivers">All Drivers</SelectItem>
              <SelectItem value="Unassigned">Unassigned</SelectItem>
              <SelectItem value="azhar">azhar</SelectItem>
              <SelectItem value="dawar">dawar</SelectItem>
              {Array.from(new Set(orders.map(o => o.driver_name).filter(Boolean))).map((driver) => (
                driver !== 'azhar' && driver !== 'dawar' && driver !== 'Unassigned' && (
                  <SelectItem key={driver} value={driver!}>{driver}</SelectItem>
                )
              ))}
            </SelectContent>
          </Select>

          {/* Date Selector */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-11 border-slate-200 text-xs font-semibold bg-white rounded-xl min-w-[110px] flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="Today" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Yesterday">Yesterday</SelectItem>
              <SelectItem value="All Time">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter button */}
          <Button 
            variant="outline" 
            className="h-11 border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-600 active:scale-95 transition-all"
            onClick={() => {
              setSearch('');
              setStatusFilter('All Status');
              setDriverFilter('All Drivers');
              setDateFilter('All Time');
              toast.success('Filters cleared & reset successfully');
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>
      </div>

      {/* Bulk action buttons indicator */}
      {selectedOrderIds.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-600 text-white rounded-2xl px-5 py-3.5 shadow-md flex-row gap-3.5 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold leading-none">{selectedOrderIds.length}</span>
            <span className="text-xs font-semibold tracking-wide">order(s) selected for bulk action</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Select onValueChange={(val: OrderStatus) => {
              selectedOrderIds.forEach(id => {
                handleUpdateStatusQuick(id, val);
              });
              toast.success(`Updated status for ${selectedOrderIds.length} orders`);
              setSelectedOrderIds([]);
            }}>
              <SelectTrigger className="h-8 border-white/20 bg-white/10 text-white hover:bg-white/20 text-[11px] font-bold rounded-lg px-2 text-left min-w-[130px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Preparing">Preparing</SelectItem>
                <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] font-bold text-white hover:bg-white/10 h-8 rounded-lg px-2.5"
              onClick={() => setSelectedOrderIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Structured Modern Orders List Cards */}
      <div className="space-y-4">
        {/* Grid Header Row for Large Screens */}
        <div className="hidden lg:grid grid-cols-[40px_1fr_1fr_1.3fr_0.9fr_1fr_0.8fr_50px] gap-4 px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
          <div className="flex items-center justify-center">
            <input 
              type="checkbox" 
              checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          <div>Order</div>
          <div>Customer</div>
          <div>Items</div>
          <div>Status</div>
          <div>Driver</div>
          <div>Amount</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Empty State visual */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto">
            <div className="h-14 w-14 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No customer orders found</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
              We couldn't find any orders matching your search or filters. Try adjusting your parameters or checking backup data.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const shortDt = formatShortDate(order.created_at);
            const isFresh = order.status === 'Pending' || (order.created_at && (Date.now() - new Date(order.created_at).getTime()) < 1000 * 60 * 30);
            const parsedItemsList = parseOrderItemsDetails(order);
            const isRowHighlighted = selectedOrder?.id === order.id;

            return (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer p-4 lg:p-5 flex flex-col select-none relative group ${
                  isRowHighlighted 
                    ? 'border-indigo-400 border-[1.5px] shadow-sm bg-indigo-50/5' 
                    : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="lg:grid lg:grid-cols-[40px_1fr_1fr_1.3fr_0.9fr_1fr_0.8fr_50px] gap-4 items-center">
                  
                  {/* Column 1: Checkbox */}
                  <div className="hidden lg:flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => toggleSelectOne(order.id)}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Column 2: Order ID, Date */}
                  <div className="flex items-center justify-between lg:block">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">#{String(order.id).slice(0, 7)}</span>
                      {isFresh && (
                        <span className="text-[9px] font-black tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-2 py-0.5 uppercase">New</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium font-sans">
                      {shortDt.date}, {shortDt.time}
                    </div>
                  </div>

                  {/* Mobile Divider & Layout */}
                  <div className="lg:hidden border-t my-3 border-dashed border-slate-100" />

                  {/* Column 3: Customer Information */}
                  <div className="flex items-center justify-between lg:block mt-2 lg:mt-0">
                    <span className="text-xs text-slate-400 lg:hidden font-semibold uppercase tracking-wider">Customer</span>
                    <div className="flex items-center gap-2">
                      <div className="text-right lg:text-left">
                        <div className="text-sm font-semibold text-slate-800 leading-none">{order.user_name || order.customer_name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">{order.user_phone || 'No Phone provided'}</div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-50 border flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer bg-indigo-50/20 text-indigo-600 hover:bg-indigo-50 shrink-0" onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`Opening communications dialer for ${order.user_name || 'Customer'} (+91 ${order.user_phone})`);
                      }}>
                        <Phone className="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Items summary */}
                  <div className="flex items-center justify-between lg:block mt-2 lg:mt-0">
                    <span className="text-xs text-slate-400 lg:hidden font-semibold uppercase tracking-wider">Item Details</span>
                    <div>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-2 py-0.5 leading-none mb-1 inline-block">
                        {parsedItemsList.length} {parsedItemsList.length === 1 ? 'Item' : 'Items'}
                      </span>
                      <div className="text-xs font-semibold text-slate-700 truncate max-w-[200px] leading-tight">
                        {parsedItemsList[0]?.name || getOrderItemName(order)}
                      </div>
                      {parsedItemsList.length > 1 && (
                        <div className="text-[10px] text-slate-400 mt-0.5 italic text-slate-400 font-medium">
                          +{parsedItemsList.length - 1} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 5: Fulfillment Status Pill */}
                  <div className="flex items-center justify-between lg:block mt-2 lg:mt-0">
                    <span className="text-xs text-slate-400 lg:hidden font-semibold uppercase tracking-wider">Status</span>
                    <div>
                      {order.status === 'Delivered' && (
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 w-fit group-hover:scale-105 transition-transform">
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Delivered</span>
                        </div>
                      )}
                      {order.status === 'Pending' && (
                        <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 w-fit group-hover:scale-105 transition-transform animate-pulse">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span>Pending</span>
                        </div>
                      )}
                      {order.status === 'Preparing' && (
                        <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 w-fit group-hover:scale-105 transition-transform">
                          <Clock className="h-3 w-3 text-blue-500 animate-spin" />
                          <span>Preparing</span>
                        </div>
                      )}
                      {order.status === 'Out for Delivery' && (
                        <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 w-fit group-hover:scale-105 transition-transform">
                          <Truck className="h-3 w-3 text-indigo-500 animate-bounce" />
                          <span>In Transit</span>
                        </div>
                      )}
                      {order.status === 'Cancelled' && (
                        <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 w-fit group-hover:scale-105 transition-transform">
                          <XCircle className="h-3 w-3 text-rose-500" />
                          <span>Cancelled</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1 font-mono font-medium pl-1">{shortDt.time}</div>
                    </div>
                  </div>

                  {/* Column 6: Driver Details / Quick Assignment */}
                  <div className="flex items-center justify-between lg:block mt-3 lg:mt-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-400 lg:hidden font-semibold uppercase tracking-wider">Driver Assignment</span>
                    <div>
                      {!order.driver_name || order.driver_name === 'Unassigned' ? (
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => setAssigningOrder(order)}
                          className="h-8 border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black text-[10px] rounded-lg tracking-wider uppercase flex items-center gap-1 shadow-xs font-mono"
                        >
                          <UserPlus className="h-3 w-3 text-indigo-500" />
                          Assign Driver
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end lg:justify-start">
                          <div className="text-right lg:text-left">
                            <span className="text-xs font-bold text-slate-700 block font-mono">{order.driver_name}</span>
                            {order.driver_phone && <span className="text-[10px] text-slate-400 block font-mono">{order.driver_phone}</span>}
                          </div>
                          {order.driver_phone && (
                            <div className="h-7 w-7 rounded-md bg-slate-50 border flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer text-slate-500 hover:bg-slate-100" onClick={() => {
                              toast.info(`Calling assigned driver ${order.driver_name} at (+91 ${order.driver_phone})`);
                            }}>
                              <Phone className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 7: Amount & Payment Badge */}
                  <div className="flex items-center justify-between lg:block mt-2 lg:mt-0">
                    <span className="text-xs text-slate-400 lg:hidden font-semibold uppercase tracking-wider">Payment</span>
                    <div className="text-right lg:text-left">
                      <span className="text-sm font-black text-slate-800 font-mono">₹{(order.total_amount ?? order.amount ?? 0).toFixed(2)}</span>
                      <div className="mt-1">
                        {order.status !== 'Cancelled' ? (
                          <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md px-1.5 py-0.5">Paid</span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-100 border text-slate-500 rounded-md px-1.5 py-0.5">Void</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 8: Actions Icon Options */}
                  <div className="flex justify-end p-2 border-t lg:border-none border-slate-50 mt-3 lg:mt-0" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setEditingOrder(order)} 
                      className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500"
                    >
                      <MoreHorizontal className="h-4.5 w-4.5" />
                    </Button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Styled Pagination Controls Block */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-3.5 py-4 border-t border-slate-100 gap-4 mt-6">
        <span className="text-xs font-semibold text-slate-500 font-sans leading-none">
          Showing 1 to {filteredOrders.length} of {filteredOrders.length} orders
        </span>
        
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-slate-400 border-slate-200" disabled>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-indigo-600">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-slate-400 border-slate-200" disabled>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Select defaultValue="10">
            <SelectTrigger className="h-8 border-slate-200 text-xs font-semibold rounded-lg bg-white min-w-[105px]">
              <SelectValue placeholder="10 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Details slide-over right structural panel (Drawer) */}
      {selectedOrder && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity" 
            onClick={() => setSelectedOrder(null)} 
          />
          {/* Drawer container body */}
          <div className="fixed top-0 right-0 h-screen w-full sm:max-w-[480px] xl:max-w-[530px] bg-white border-l border-slate-100 shadow-2xl z-50 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200 select-none">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">Order #{String(selectedOrder.id).slice(0, 7)}</h3>
                  {selectedOrder.status === 'Delivered' && <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-black px-2 rounded-lg">Delivered</Badge>}
                  {selectedOrder.status === 'Pending' && <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[10px] font-black px-2 rounded-lg animate-pulse">Pending</Badge>}
                  {selectedOrder.status === 'Preparing' && <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-black px-2 rounded-lg">Preparing</Badge>}
                  {selectedOrder.status === 'Out for Delivery' && <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-[10px] font-black px-2 rounded-lg">In Transit</Badge>}
                  {selectedOrder.status === 'Cancelled' && <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-black px-2 rounded-lg">Cancelled</Badge>}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">Placed on {formatFullDate(selectedOrder.created_at)}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500"
                onClick={() => setSelectedOrder(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content mid-sections */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6 bg-slate-50/30">
              {/* Section 1: Order Summary */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3.5 shadow-xs relative">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-black tracking-wide uppercase text-slate-800">Order Summary</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Order ID</span>
                    <span className="text-slate-800 font-mono font-bold">#{selectedOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Order Date</span>
                    <span className="text-slate-800 font-semibold">{formatFullDate(selectedOrder.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Payment Status</span>
                    {selectedOrder.status !== 'Cancelled' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2 py-0.5 font-bold mt-0.5 inline-block text-[10px]">Paid</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-2 py-0.5 font-bold mt-0.5 inline-block text-[10px]">Void</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Payment Method</span>
                    <span className="text-slate-800 font-bold">{selectedOrder.status !== 'Cancelled' ? 'Cash on Delivery' : '—'}</span>
                  </div>
                </div>

                {/* total amount block panel decoration */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Price</span>
                    <span className="text-xl font-mono font-black text-slate-800 leading-none mt-1 inline-block">₹{(selectedOrder.total_amount ?? selectedOrder.amount ?? 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.status !== 'Cancelled' && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 text-[10px] font-black h-fit">PAID</span>
                  )}
                </div>
              </div>

              {/* Section 2: Customer Details */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-black tracking-wide uppercase text-slate-800">Customer Details</h4>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-slate-50 hover:bg-slate-100 border flex items-center justify-center cursor-pointer text-slate-500 active:scale-95" onClick={() => {
                    toast.success(`Opening conversation window to chat with ${selectedOrder.user_name || 'Customer'}`);
                  }}>
                    <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-medium">Name</span>
                    <span className="text-slate-800 font-bold">{selectedOrder.user_name || selectedOrder.customer_name || 'Resident Customer'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-50">
                    <span className="text-slate-400 font-medium">Phone</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 font-mono font-bold">{selectedOrder.user_phone}</span>
                      <Phone className="h-3.5 w-3.5 text-indigo-500 hover:scale-127 cursor-pointer" onClick={() => toast.success(`Simulating call action: Dialer opened`)} />
                    </div>
                  </div>
                  <div className="py-2.5 border-t border-slate-50 space-y-1">
                    <span className="text-slate-400 font-medium block">Address</span>
                    <div className="flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600 leading-relaxed font-sans text-xs">
                        123, Green Street, Wakad, Pune, Maharashtra - 411057
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Delivery Details */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                      <Truck className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-black tracking-wide uppercase text-slate-800">Delivery Details</h4>
                  </div>
                  {(!selectedOrder.driver_name || selectedOrder.driver_name === 'Unassigned') && (
                    <Button 
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setAssigningOrder(selectedOrder)}
                      className="h-7 border-indigo-150 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black text-[9px] tracking-wider uppercase flex items-center gap-1 font-mono rounded"
                    >
                      <UserPlus className="h-2.5 w-2.5" />
                      Assign
                    </Button>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Driver Assigned</span>
                    <span className="text-slate-800 font-black font-mono">
                      {(!selectedOrder.driver_name || selectedOrder.driver_name === 'Unassigned') ? 'Unassigned' : selectedOrder.driver_name}
                    </span>
                  </div>
                  {selectedOrder.driver_phone && (
                    <div className="flex justify-between items-center border-t border-slate-50 py-1">
                      <span className="text-slate-400 font-medium">Driver Contacts</span>
                      <span className="text-slate-800 font-mono font-bold">
                        +91 {selectedOrder.driver_phone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-slate-50 py-1">
                    <span className="text-slate-400 font-medium">Fulfillment Status</span>
                    <span className="text-slate-800 font-bold">{selectedOrder.status}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 py-1">
                    <span className="text-slate-400 font-medium">Delivered Time</span>
                    <span className="text-slate-700 font-bold font-mono">
                      {selectedOrder.status === 'Delivered' ? '17 May 2025 at 10:45 AM' : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Items Ordered List */}
              <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold tracking-tight text-slate-900 font-sans">Items Ordered</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg font-mono">
                    {parseOrderItemsDetails(selectedOrder).length} Item(s)
                  </span>
                </div>

                {/* Compact Table Headers */}
                <div className="grid grid-cols-[30px_1fr_80px] text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100 font-sans">
                  <span>#</span>
                  <span>Item</span>
                  <span className="text-right">Price</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {parseOrderItemsDetails(selectedOrder).map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[30px_1fr_80px] items-start py-3 first:pt-0 last:pb-0">
                      {/* Serial Number */}
                      <span className="text-xs font-bold text-slate-400 font-mono pt-1">
                        {index + 1}.
                      </span>

                      {/* Thumbnail & Item name details */}
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="h-8 w-8 rounded-lg border border-slate-100 object-cover shrink-0 bg-slate-50" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 leading-snug break-words" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {item.variant} {item.qty > 1 ? `× ${item.qty}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Right-aligned Price */}
                      <span className="text-xs font-bold text-slate-800 font-mono text-right pt-1">
                        ₹{item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cost Calculations */}
                <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-700 font-mono">₹{Math.max(0, (selectedOrder.total_amount ?? selectedOrder.amount ?? 0) - 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>Delivery Fee</span>
                    <span className="text-emerald-600 font-bold font-mono">₹2.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>Discount</span>
                    <span className="text-slate-700 font-mono">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>Tax</span>
                    <span className="text-slate-700 font-mono">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-900 border-t border-slate-100 pt-2.5 items-center">
                    <span className="text-xs font-bold text-slate-800">Total Amount</span>
                    <span className="text-sm font-black text-indigo-600 font-mono">₹{(selectedOrder.total_amount ?? selectedOrder.amount ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Additional Info */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2.5 shadow-xs text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="p-1 bg-amber-50 text-amber-600 rounded">
                    <Info className="h-3 w-3" />
                  </span>
                  <span className="font-bold text-[11px] uppercase text-slate-400 tracking-wider font-mono">Additional Information</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Order Notes</span>
                  <span className="text-slate-500 mt-1 block italic font-medium">No special customer instructions attached. Doorstep drop preferred.</span>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer Buttons */}
            <div className="p-4 border-t border-slate-150 bg-white grid grid-cols-2 gap-2 shadow-inner">
              <Button 
                variant="outline"
                className="col-span-2 md:col-span-1 border-slate-200 text-purple-600 hover:bg-purple-50 hover:border-purple-200 font-bold text-xs h-10 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                onClick={() => setEditingOrder(selectedOrder)}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Order
              </Button>
              <Button 
                className="col-span-2 md:col-span-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                onClick={() => setAssigningOrder(selectedOrder)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign Driver
              </Button>

              <Button
                variant="outline"
                className="border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 font-bold text-xs h-10 px-2 rounded-xl flex items-center justify-center gap-1 transition-all"
                disabled={selectedOrder.status === 'Pending'}
                onClick={() => handleUpdateStatusQuick(selectedOrder.id, 'Pending')}
              >
                <Clock className="h-3.5 w-3.5" />
                Mark Pending
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 font-bold text-xs h-10 px-2 rounded-xl flex items-center justify-center gap-1 transition-all animate-pulse"
                disabled={selectedOrder.status === 'Delivered'}
                onClick={() => handleUpdateStatusQuick(selectedOrder.id, 'Delivered')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Mark Delivered
              </Button>
              <Button
                variant="destructive"
                className="col-span-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-150 font-bold text-xs h-10 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                disabled={selectedOrder.status === 'Cancelled'}
                onClick={() => handleUpdateStatusQuick(selectedOrder.id, 'Cancelled')}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Order
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Driver Assignment Chooser Modal Popup Dialog */}
      <Dialog open={!!assigningOrder} onOpenChange={(open) => !open && setAssigningOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-md p-5 rounded-2xl select-none">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">Select Available Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 pt-3">
            <span className="text-xs text-slate-400 block font-medium">Choose an online delivery personnel to hand over this order:</span>
            <div className="space-y-2.5">
              {PRESET_DRIVERS.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => assigningOrder && handleAssignDriverQuick(assigningOrder.id, item.name, item.phone)}
                  className="flex items-center justify-between p-3 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-xl cursor-pointer transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-50 border flex items-center justify-center font-bold text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                      {item.name[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Contacts: +91 {item.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-amber-500 font-bold block">★ {item.rating}</span>
                    <span className={`text-[9px] font-bold block ${item.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {item.active ? '● Active Now' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-3">
              <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setAssigningOrder(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Editor Dialog modal overlay */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg p-6 rounded-2xl select-none">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">Edit Order Details</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</Label>
                  <Input
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold focus-visible:ring-indigo-600"
                    value={editingOrder.user_name || editingOrder.customer_name || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, user_name: e.target.value, customer_name: e.target.value })}
                    placeholder="e.g. Dawar"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Phone</Label>
                  <Input
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold focus-visible:ring-indigo-600 font-mono"
                    value={editingOrder.user_phone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, user_phone: e.target.value })}
                    placeholder="e.g. +91 6005358955"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name / Ordered Items</Label>
                  <Input
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold focus-visible:ring-indigo-600"
                    value={
                      editingOrder.products_summary ||
                      editingOrder.product_name || 
                      editingOrder.product_names || 
                      editingOrder.items_details || 
                      editingOrder.item_names || 
                      editingOrder.order_name || 
                      ''
                    }
                    onChange={(e) => setEditingOrder({ 
                      ...editingOrder, 
                      products_summary: e.target.value,
                      product_name: e.target.value,
                      product_names: e.target.value,
                      items_details: e.target.value,
                      item_names: e.target.value,
                      order_name: e.target.value
                    })}
                    placeholder="e.g. 1x Fresh Whole Milk Premium (1 Litre)"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Items Count</Label>
                  <Input
                    type="number"
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold focus-visible:ring-indigo-600"
                    value={editingOrder.items || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, items: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold font-mono focus-visible:ring-indigo-600"
                    value={editingOrder.total_amount ?? editingOrder.amount ?? 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setEditingOrder({ ...editingOrder, amount: value, total_amount: value });
                    }}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fulfillment Status</Label>
                  <Select
                    value={editingOrder.status}
                    onValueChange={(val: OrderStatus) => setEditingOrder({ ...editingOrder, status: val })}
                  >
                    <SelectTrigger className="border-slate-200 h-10 rounded-xl text-xs font-bold bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Preparing">Preparing</SelectItem>
                      <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Driver Name</Label>
                  <Input
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold focus-visible:ring-indigo-600"
                    value={editingOrder.driver_name || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver_name: e.target.value })}
                    placeholder="e.g. azhar"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Driver Phone</Label>
                  <Input
                    className="border-slate-200 h-10 rounded-xl text-xs font-semibold focus-visible:ring-indigo-600 font-mono"
                    value={editingOrder.driver_phone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver_phone: e.target.value })}
                    placeholder="e.g. 9818082449"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <Button type="button" variant="outline" className="h-10 rounded-xl text-xs font-bold px-4" onClick={() => setEditingOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="h-10 bg-indigo-600 hover:bg-indigo-700 font-bold px-4 rounded-xl text-xs text-white">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
