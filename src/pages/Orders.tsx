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

  const fetchOrders = async () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    // Quick client-side filtering below for simplicity, or we could do it server-side.
    // For now we'll fetch all and filter in memory since it's a simple admin dashboard without pagination spec.
    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load orders');
    } else {
      setOrders(data as Order[]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: editingOrder.status,
          driver_name: editingOrder.driver_name,
          driver_phone: editingOrder.driver_phone,
        })
        .eq('id', editingOrder.id);

      if (error) throw error;
      
      toast.success('Order updated successfully');
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const idStr = String(o.id || '').toLowerCase();
    const storeNameStr = String(o.store_name || '').toLowerCase();
    const userPhoneStr = String(o.user_phone || '').toLowerCase();
    const searchLower = search.toLowerCase();
    
    return idStr.includes(searchLower) ||
      storeNameStr.includes(searchLower) ||
      userPhoneStr.includes(searchLower);
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
            placeholder="Search by ID, store, or phone..."
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
              <TableHead>Store</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>User Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">No orders found.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{String(order.id || '').slice(0, 8)}</TableCell>
                  <TableCell>{order.store_name}</TableCell>
                  <TableCell>₹{typeof order.amount === 'number' ? order.amount.toFixed(2) : '0.00'}</TableCell>
                  <TableCell>{order.user_phone}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'Cancelled' ? 'destructive' : 'default'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{order.driver_name || 'Unassigned'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingOrder(order)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Status</Label>
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
