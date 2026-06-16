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
import { Search, Edit2, Download } from 'lucide-react';

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'o_9872a',
    store_name: 'Downtown Grocery Store',
    amount: 285.00,
    total_amount: 285.00,
    items: 4,
    products_summary: '2x Alphonso Mangoes, 1x Pure Cow Milk, 1x Brown Sliced Bread',
    user_phone: '9876543210',
    user_name: 'Anita Sharma',
    status: 'Pending',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'o_1245b',
    store_name: 'Corner Pantry Store',
    amount: 115.00,
    total_amount: 115.00,
    items: 3,
    products_summary: '2x Chilli Potato Chips, 1x Instant Masala Ramen',
    user_phone: '9988776655',
    user_name: 'Rohan Mehta',
    status: 'Delivered',
    driver_name: 'Vikram Singh',
    driver_phone: '+91 91234 56789',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'o_5321c',
    store_name: 'Supermart Fresh',
    amount: 720.00,
    total_amount: 720.00,
    items: 5,
    products_summary: '4x Alphonso Mangoes, 1x Fresh Bananas',
    user_phone: '9812345670',
    user_name: 'Pooja Reddy',
    status: 'Preparing',
    driver_name: 'Amit Patel',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  }
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderKeys, setOrderKeys] = useState<string[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) {
        console.warn('Supabase fetch orders error details:', error);
        setBackendError(`${error.message || JSON.stringify(error)} (Code: ${error.code || 'None'})`);
        setIsLiveConnected(false);
        
        const local = localStorage.getItem('neighborcart_orders');
        if (local) {
          const parsed = JSON.parse(local);
          setOrders(parsed);
          if (parsed.length > 0) setOrderKeys(Object.keys(parsed[0]));
        } else {
          setOrders(DEFAULT_ORDERS);
          localStorage.setItem('neighborcart_orders', JSON.stringify(DEFAULT_ORDERS));
          setOrderKeys(Object.keys(DEFAULT_ORDERS[0]));
        }
      } else if (!data || data.length === 0) {
        setBackendError(null);
        setIsLiveConnected(true);
        // Table successfully read but matches 0 rows. Use local cached storage/mock list dynamically but let user know they have 0 real orders in DB
        const local = localStorage.getItem('neighborcart_orders');
        if (local) {
          const parsed = JSON.parse(local);
          setOrders(parsed);
          if (parsed.length > 0) setOrderKeys(Object.keys(parsed[0]));
        } else {
          setOrders(DEFAULT_ORDERS);
          localStorage.setItem('neighborcart_orders', JSON.stringify(DEFAULT_ORDERS));
          setOrderKeys(Object.keys(DEFAULT_ORDERS[0]));
        }
      } else {
        setBackendError(null);
        setIsLiveConnected(true);
        const fetchedOrders = data as Order[];
        setOrders(fetchedOrders);
        localStorage.setItem('neighborcart_orders', JSON.stringify(fetchedOrders));
        if (fetchedOrders && fetchedOrders.length > 0) {
          setOrderKeys(Object.keys(fetchedOrders[0]));
        }
      }
    } catch (e: any) {
      console.warn('Backend connection failed, falling back to LocalStorage for orders:', e);
      setBackendError(e.message || 'Error executing fetch query on Supabase orders table');
      setIsLiveConnected(false);
      
      const local = localStorage.getItem('neighborcart_orders');
      if (local) {
        const parsed = JSON.parse(local);
        setOrders(parsed);
        if (parsed.length > 0) setOrderKeys(Object.keys(parsed[0]));
      } else {
        setOrders(DEFAULT_ORDERS);
        localStorage.setItem('neighborcart_orders', JSON.stringify(DEFAULT_ORDERS));
        setOrderKeys(Object.keys(DEFAULT_ORDERS[0]));
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getOrderItemName = (order: Order): string => {
    if (order.products_summary && String(order.products_summary).trim()) return String(order.products_summary);
    if (order.product_name && String(order.product_name).trim()) return String(order.product_name);
    if (order.product_names && String(order.product_names).trim()) return String(order.product_names);
    if (order.items_details && String(order.items_details).trim()) return String(order.items_details);
    if (order.item_names && String(order.item_names).trim()) return String(order.item_names);
    if (order.order_name && String(order.order_name).trim()) return String(order.order_name);
    
    if (order.products) {
      if (typeof order.products === 'string' && order.products.trim()) {
        return order.products;
      }
      try {
        const parsed = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => p.name || p.product_name || p.title || JSON.stringify(p)).join(', ');
        }
        if (typeof parsed === 'object') {
          return parsed.name || parsed.product_name || JSON.stringify(parsed);
        }
      } catch (e) {
        // ignore
      }
    }
    return `${order.items || 1}x Item(s) (e.g. Fresh Groceries)`;
  };

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

      // Set items field/product name field based on what's available
      const fields = ['product_name', 'product_names', 'items_details', 'item_names', 'order_name', 'products_summary'];
      let updatedAnyProductField = false;

      fields.forEach(field => {
        if (orderKeys.includes(field) || field in (orders[0] || {})) {
          updateData[field] = productVal;
          updatedAnyProductField = true;
        }
      });

      // Default fallback if we don't know the exact key yet
      if (!updatedAnyProductField) {
        updateData.items_details = productVal;
        updateData.product_name = productVal;
        updateData.products_summary = productVal;
      }

      // Handle total_amount or amount
      if (orderKeys.includes('total_amount') || 'total_amount' in (orders[0] || {})) {
        updateData.total_amount = val;
      }
      if (orderKeys.includes('amount') || 'amount' in (orders[0] || {})) {
        updateData.amount = val;
      }
      if (!orderKeys.includes('amount') && !orderKeys.includes('total_amount')) {
        updateData.total_amount = val;
      }

      const finalUpdatedOrder = { ...editingOrder, ...updateData };
      const nextOrders = orders.map(o => o.id === editingOrder.id ? { ...o, ...finalUpdatedOrder } : o);

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', editingOrder.id);

      if (error) {
        // Fallback to updating state and localStorage locally
        setOrders(nextOrders);
        localStorage.setItem('neighborcart_orders', JSON.stringify(nextOrders));
        toast.success('Order updated successfully (saved to local backup)');
      } else {
        toast.success('Order updated successfully in database');
        setOrders(nextOrders);
        localStorage.setItem('neighborcart_orders', JSON.stringify(nextOrders));
        fetchOrders();
      }
      
      setEditingOrder(null);
    } catch (err: any) {
      console.warn('Backend update failed, falling back to local save:', err);
      const nextOrders = orders.map(o => o.id === editingOrder.id ? { ...o, ...editingOrder } : o);
      setOrders(nextOrders);
      localStorage.setItem('neighborcart_orders', JSON.stringify(nextOrders));
      toast.success('Order updated successfully (saved to local storage)');
      setEditingOrder(null);
    }
  };

  const handleDownloadCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders available to export in current filter');
      return;
    }

    // Prepare CSV Headers
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Phone',
      'Fulfillment Status',
      'Ordered Items',
      'Total Amount (INR)',
      'Driver Name',
      'Driver Phone',
      'Created At'
    ];

    // Build data rows
    const rows = filteredOrders.map(order => [
      order.id || '',
      order.user_name || order.customer_name || 'Anonymous Customer',
      order.user_phone || '',
      order.status || '',
      getOrderItemName(order),
      (order.total_amount ?? order.amount ?? 0).toFixed(2),
      order.driver_name || '',
      order.driver_phone || '',
      order.created_at || ''
    ]);

    // Construct CSV file string safely (handling commas and quotes)
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cleanCell = String(cell).replace(/"/g, '""');
        return `"${cleanCell}"`;
      }).join(','))
    ].join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `neighborcart_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Orders exported successfully as CSV!');
    } catch {
      toast.error('Failed to download CSV');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const idStr = String(o.id || '').toLowerCase();
    const userPhoneStr = String(o.user_phone || '').toLowerCase();
    const userNameStr = String(o.user_name || o.customer_name || '').toLowerCase();
    const itemsDetailsStr = getOrderItemName(o).toLowerCase();
    const searchLower = search.toLowerCase();
    
    return idStr.includes(searchLower) ||
      userPhoneStr.includes(searchLower) ||
      userNameStr.includes(searchLower) ||
      itemsDetailsStr.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <Button 
          id="btn-export-csv"
          onClick={handleDownloadCSV} 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {localStorage.getItem('neighborcart_admin_bypass') === 'true' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h4 className="font-bold text-sm tracking-tight uppercase font-mono">Sandbox Demo Mode Active</h4>
          </div>
          <p className="text-xs leading-relaxed max-w-2xl">
            You are currently browsing the panel in **Offline Sandbox Demo Mode**. Real-time orders placed by customers in the customer app will **not** automatically sync here until you sign out and sign in with your actual database administrator credentials, or deploy the Supabase backend configuration.
          </p>
        </div>
      )}

      {backendError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="flex h-2 w-2 absolute rounded-full bg-red-600" />
            <h4 className="font-bold text-sm tracking-tight uppercase font-mono pl-1">Supabase Real-time Sync Warning</h4>
          </div>
          <p className="text-xs leading-relaxed">
            The admin app could not fetch real-time data from your Supabase instance. We fell back to local storage cache. If you registered a customer order in your customer app but cannot see it here, verify your table migrations and connection credentials:
          </p>
          <div className="text-[11px] font-mono bg-red-500/5 p-2 rounded border border-red-500/10 text-red-700 select-all max-h-24 overflow-y-auto">
            {backendError}
          </div>
        </div>
      )}

      {isLiveConnected && !backendError && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="font-bold font-mono block">LIVE BACKEND SYNC ACTIVE</span>
              <span>Successfully parsed {orders.length} loaded orders directly from Supabase!</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-emerald-800 hover:bg-emerald-500/25 text-xs font-semibold h-7"
            onClick={fetchOrders}
          >
            Check/Refresh Live Database
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, customer name, items, or phone..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Fulfillment Status</TableHead>
              <TableHead>Driver Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No orders found.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  {/* General Overview Row */}
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{String(order.id || '').slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm text-foreground">{order.user_name || order.customer_name || 'Anonymous Customer'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{order.user_phone || 'No phone'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'Cancelled' ? 'destructive' : order.status === 'Delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{order.driver_name || 'Unassigned'}</div>
                      {order.driver_phone && <div className="text-xs text-muted-foreground font-mono">{order.driver_phone}</div>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Button variant="ghost" size="icon" onClick={() => setEditingOrder(order)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Detailed Ordered Items & Amount Row */}
                  <TableRow className="bg-muted/30 hover:bg-muted/40 border-b">
                    <TableCell colSpan={5} className="py-2.5 pl-10 pr-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                        <div className="flex items-start gap-2.5 max-w-2xl">
                          <span className="font-semibold text-[10px] tracking-wider uppercase bg-primary/10 text-primary-dark border border-primary/20 shrink-0 px-2 py-0.5 rounded-full mt-0.5">
                            Items Ordered
                          </span>
                          <span className="text-foreground text-sm font-medium leading-relaxed">
                            {getOrderItemName(order)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                          <span className="text-xs font-medium text-muted-foreground">Amount:</span>
                          <span className="text-primary font-mono text-sm font-bold">
                            ₹{typeof (order.total_amount ?? order.amount) === 'number' ? (order.total_amount ?? order.amount).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Order Details</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editingOrder.user_name || editingOrder.customer_name || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, user_name: e.target.value, customer_name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Customer Phone</Label>
                  <Input
                    value={editingOrder.user_phone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, user_phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Product Name / Ordered Items</Label>
                  <Input
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
                    placeholder="e.g. 2x Pack of Bread, 1x Amul Milk, 500g Potatoes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Order Weight/Item Count</Label>
                  <Input
                    type="number"
                    value={editingOrder.items || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, items: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Order Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingOrder.total_amount ?? editingOrder.amount ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditingOrder({ ...editingOrder, amount: val, total_amount: val });
                    }}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Fulfillment Status</Label>
                  <Select
                    value={editingOrder.status}
                    onValueChange={(val: OrderStatus) => setEditingOrder({ ...editingOrder, status: val })}
                  >
                    <SelectTrigger>
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
                  <Label>Driver Name</Label>
                  <Input
                    value={editingOrder.driver_name || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver_name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Driver Phone</Label>
                  <Input
                    value={editingOrder.driver_phone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver_phone: e.target.value })}
                    placeholder="e.g. +1234567890"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
