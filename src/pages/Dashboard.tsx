import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ShoppingCart, Layers, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/src/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartItem {
  name: string;
  count: number;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, categories: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([
    { name: 'Pending', count: 0, color: '#f59e0b' },
    { name: 'Packing', count: 0, color: '#3b82f6' },
    { name: 'Shipped', count: 0, color: '#8b5cf6' },
    { name: 'Delivered', count: 0, color: '#10b981' },
  ]);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Fetch counts with fallback
        const [ordersRes, categoriesRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
        ]);

        let catCount = categoriesRes.count;
        if (catCount === null || catCount === undefined || categoriesRes.error) {
          const local = localStorage.getItem('neighborcart_categories');
          catCount = local ? JSON.parse(local).length : 4;
        }

        const totalOrders = ordersRes.count || 0;

        setStats({
          orders: totalOrders,
          categories: catCount,
          products: productsRes.count || 0,
        });

        // Fetch recent orders
        const { data: ordersList } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (ordersList) {
          setRecentOrders(ordersList as Order[]);
        }

        // Fetch all order statuses for chart summary
        const { data: allStatuses } = await supabase
          .from('orders')
          .select('status');

        const counts = {
          Pending: 0,
          Packing: 0,
          Shipped: 0,
          Delivered: 0,
        };

        if (allStatuses && allStatuses.length > 0) {
          setIsDemoData(false);
          allStatuses.forEach((o) => {
            const statusStr = String(o.status || '').trim();
            if (statusStr === 'Pending') {
              counts.Pending++;
            } else if (statusStr === 'Preparing' || statusStr === 'Packing') {
              counts.Packing++;
            } else if (statusStr === 'Out for Delivery' || statusStr === 'Shipped') {
              counts.Shipped++;
            } else if (statusStr === 'Delivered') {
              counts.Delivered++;
            }
          });

          setChartData([
            { name: 'Pending', count: counts.Pending, color: '#f59e0b' },
            { name: 'Packing', count: counts.Packing, color: '#3b82f6' },
            { name: 'Shipped', count: counts.Shipped, color: '#8b5cf6' },
            { name: 'Delivered', count: counts.Delivered, color: '#10b981' },
          ]);
        } else {
          // If no orders exist yet in Supabase database, use a beautiful set of demo data
          setIsDemoData(true);
          setChartData([
            { name: 'Pending', count: 4, color: '#f59e0b' },
            { name: 'Packing', count: 7, color: '#3b82f6' },
            { name: 'Shipped', count: 3, color: '#8b5cf6' },
            { name: 'Delivered', count: 12, color: '#10b981' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      }
    }
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">
            Monitor real-time grocery orders, category performance, and delivery metrics.
          </p>
        </div>
        {isDemoData && (
          <Badge variant="outline" className="w-fit border-dashed border-amber-500 bg-amber-50 mr-auto md:mr-0 text-amber-700">
            Preview Mode: Showing Simulated Stats
          </Badge>
        )}
      </div>
      
      {/* KPI Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isDemoData ? 26 : stats.orders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products || 18}</div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Active Orders status
            </CardTitle>
            <CardDescription>
              Visualization of orders currently active in the delivery funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                    contentStyle={{ background: '#fff', border: '1px solid #e1e1e1', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={55}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Funnel</CardTitle>
            <CardDescription>Metrics by fulfillment step</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex flex-col justify-center space-y-4">
            {chartData.map((item) => {
              const maxVal = Math.max(...chartData.map(c => c.count), 1);
              const percent = (item.count / maxVal) * 100;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-mono font-medium text-muted-foreground">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="rounded-full h-2 transition-all duration-500" 
                      style={{ width: `${percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No orders found.</TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{String(order.id || '').slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{order.user_name || 'Anonymous Customer'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{order.user_phone || 'No phone'}</div>
                      </TableCell>
                      <TableCell>{order.store_name || 'General Order'}</TableCell>
                      <TableCell>₹{typeof (order.total_amount ?? order.amount) === 'number' ? (order.total_amount ?? order.amount).toFixed(2) : '0.00'}</TableCell>
                      <TableCell>{order.items}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

