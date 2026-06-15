import { ShoppingCart, Package, Users, LayoutDashboard, Menu, Layers, LogOut } from 'lucide-react';
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
  { path: '/users', label: 'Users', icon: Users },
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed out successfully');
      navigate('/login');
    }
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
