import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShoppingCart, LogIn, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const navigate = useNavigate();

  const ADMIN_ID = 'f8674836-fb2b-4dc4-88f5-c3792538d9c4';

  useEffect(() => {
    // Check if user is already logged in as authorized admin
    async function checkCurrentSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          if (data.session.user.id === ADMIN_ID) {
            navigate('/');
          }
        }
      } catch (err) {
        // ignore
      }
    }
    checkCurrentSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter details');

    setLoading(true);
    setUnauthorized(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data?.user;
      if (user) {
        if (user.id === ADMIN_ID) {
          toast.success('Admin authorized successfully!');
          navigate('/');
        } else {
          // Check if user is in 'admins' table
          const { data: adminRecord, error: adminErr } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (adminRecord && !adminErr) {
            toast.success('Admin authorized successfully from Database!');
            navigate('/');
          } else {
            setUnauthorized(true);
            await supabase.auth.signOut();
            toast.error('Access Denied: Your User ID is not matching the master ID or registered in the public.admins database table.');
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-content shadow-md">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">NeighborCart</h1>
          <p className="text-sm text-muted-foreground">Hyperlocal Grocery Admin Portal</p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to manage products, categories & orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@neighborcart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {unauthorized && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg flex items-start gap-2 border border-destructive/25">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Unauthorized UUID</span>
                    Only owner with UUID <code className="bg-destructive/10 px-1 rounded font-mono text-xs">{ADMIN_ID}</code> is permitted to enter.
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In as Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
