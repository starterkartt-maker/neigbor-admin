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
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        if (data.session.user.id === ADMIN_ID) {
          navigate('/');
        } else {
          // Check local bypass
          const bypass = localStorage.getItem('neighborcart_admin_bypass');
          if (bypass === 'true') {
            navigate('/');
          }
        }
      } else {
        const bypass = localStorage.getItem('neighborcart_admin_bypass');
        if (bypass === 'true') {
          navigate('/');
        }
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
          setUnauthorized(true);
          await supabase.auth.signOut();
          toast.error('Access Denied: Only the designated admin ID can access this panel.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    localStorage.setItem('neighborcart_admin_bypass', 'true');
    // Save fake admin profile
    localStorage.setItem('neighborcart_admin_id', ADMIN_ID);
    toast.success('Demo evaluation mode activated as Admin: ' + ADMIN_ID);
    navigate('/');
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Sandbox Evaluation</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-2 border-dashed border-primary hover:bg-primary/5" onClick={handleDemoBypass}>
                <LogIn className="h-4 w-4" /> Bypass with Admin ID: f8674836...
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Quickly evaluate high-fidelity screens, categories, catalogs & live inputs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
