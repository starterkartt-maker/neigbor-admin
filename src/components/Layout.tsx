import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from '@/src/components/Sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block h-full flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header for mobile */}
        <header className="flex h-16 items-center px-4 md:hidden border-b bg-card">
          <MobileSidebar />
          <h1 className="ml-4 font-bold text-lg text-primary">NeighborCart</h1>
        </header>

        <section className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </section>
      </main>
      <Toaster />
    </div>
  );
}
