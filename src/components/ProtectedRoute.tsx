import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const ADMIN_ID = 'f8674836-fb2b-4dc4-88f5-c3792538d9c4';

  useEffect(() => {
    async function evaluateAuth() {
      // Evaluate real Supabase session
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;
        if (userId) {
          if (userId === ADMIN_ID) {
            setIsAuthenticated(true);
          } else {
            const { data: adminRecord } = await supabase
              .from('admins')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            
            setIsAuthenticated(!!adminRecord);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    evaluateAuth();

    // Setup listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.id) {
        if (session.user.id === ADMIN_ID) {
          setIsAuthenticated(true);
        } else {
          try {
            const { data: adminRecord } = await supabase
              .from('admins')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            setIsAuthenticated(!!adminRecord);
          } catch {
            setIsAuthenticated(false);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-mono">Authenticating admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
