import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Profile, Address } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Search, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('joined_date', { ascending: false });
    if (!error && data) setUsers(data as Profile[]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = async (user: Profile) => {
    setSelectedUser(user);
    const { data, error } = await supabase.from('addresses').select('*').eq('phone', user.phone);
    if (!error && data) {
      setAddresses(data as Address[]);
    } else {
      setAddresses([]);
      if (error) toast.error('Failed to load addresses');
    }
  };

  const filteredUsers = users.filter(u => {
    const userName = String(u.name || '').toLowerCase();
    const userPhone = String(u.phone || '').toLowerCase();
    const userEmail = String(u.email || '').toLowerCase();
    const searchLower = search.toLowerCase();
    return userName.includes(searchLower) || userPhone.includes(searchLower) || userEmail.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Users</h2>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
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
              <TableHead>Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Addresses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No users found.</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.phone}</TableCell>
                  <TableCell>{user.name || 'Anonymous'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.joined_date ? format(new Date(user.joined_date), 'PP') : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleUserClick(user)}>
                      <MapPin className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Addresses for {selectedUser?.name || selectedUser?.phone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No addresses saved.</p>
            ) : (
              addresses.map(address => (
                <Card key={address.id}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      {address.label && <div className="font-medium">{address.label}</div>}
                      <div className="text-sm text-muted-foreground">{address.details}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
