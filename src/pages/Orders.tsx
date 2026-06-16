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
import { Search, Edit2 } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderKeys, setOrderKeys] = useState<string[]>([]);

  const fetchOrders = async () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load orders');
    } else {
      const fetchedOrders = data as Order[];
      setOrders(fetchedOrders);
      if (fetchedOrders && fetchedOrders.length > 0) {
        setOrderKeys(Object.keys(fetchedOrders[0]));
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

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', editingOrder.id);

      if (error) {
        // Fallback to updating state locally
        setOrders(orders.map(o => o.id === editingOrder.id ? { ...o, ...editingOrder } : o));
        toast.error(`Database error: ${error.message}. Saved locally only.`);
      } else {
        toast.success('Order updated successfully');
      }
      
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
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
      </div>

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
