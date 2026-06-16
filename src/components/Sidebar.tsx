import { ShoppingCart, Package, LayoutDashboard, Menu, Layers, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

const routes = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/categories', label: 'Categories', icon: Layers },
  { path: '/products', label: 'Products', icon: Package },
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    localStorage.removeItem('neighborcart_admin_bypass');
    localStorage.removeItem('neighborcart_admin_id');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out operation handled gracefully:', e);
    }
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r shadow-sm">
      <div className="flex items-center justify-center h-16 border-b px-4">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" /> NeighborCart
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {route.label}
            </NavLink>
          );
        })}
      </nav>
      {localStorage.getItem('neighborcart_admin_bypass') === 'true' && (
        <div className="mx-4 my-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-none">Sandbox Active</p>
          <span className="text-[10px] font-medium text-amber-500/90 block mt-1 leading-normal">Offline Backup Storage</span>
        </div>
      )}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
