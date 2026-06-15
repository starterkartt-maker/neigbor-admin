import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Category } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Edit2, Plus, Trash2, Layers, Image as ImageIcon } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) {
        // Fallback to local storage if table doesn't exist
        const local = localStorage.getItem('neighborcart_categories');
        if (local) {
          setCategories(JSON.parse(local));
        } else {
          const defaultCategories: Category[] = [
            { id: '1', name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh farm produce', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=200' },
            { id: '2', name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs', description: 'Milk, butter, cheese, bread', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200' },
            { id: '3', name: 'Munchies & Chips', slug: 'snacks-munchies', description: 'Crisps, popcorn, nuts', image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527ec087?auto=format&fit=crop&q=80&w=200' },
            { id: '4', name: 'Instant Food', slug: 'instant-food', description: 'Noodles, soup, ready meals', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=200' },
          ];
          setCategories(defaultCategories);
          localStorage.setItem('neighborcart_categories', JSON.stringify(defaultCategories));
        }
      } else if (data) {
        setCategories(data as Category[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return toast.error('Name is required');

    const slug = editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCategory = {
      ...editingCategory,
      slug,
    };

    try {
      const { error } = await supabase.from('categories').upsert(newCategory as any);
      
      if (error) {
        // Fallback local storage update
        let updated: Category[] = [];
        if (editingCategory.id) {
          updated = categories.map(c => c.id === editingCategory.id ? { ...c, ...newCategory } as Category : c);
        } else {
          const generatedId = Math.random().toString(36).substr(2, 9);
          updated = [...categories, { ...newCategory, id: generatedId } as Category];
        }
        setCategories(updated);
        localStorage.setItem('neighborcart_categories', JSON.stringify(updated));
        toast.success('Category saved successfully (to local storage fallback)');
      } else {
        toast.success('Category saved successfully to Supabase');
        fetchCategories();
      }
      setEditingCategory(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        // Local storage update
        const updated = categories.filter(c => c.id !== id);
        setCategories(updated);
        localStorage.setItem('neighborcart_categories', JSON.stringify(updated));
        toast.success('Category deleted successfully (from local storage fallback)');
      } else {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(c =>
    String(c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        <Button onClick={() => setEditingCategory({})}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
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
              <TableHead>Image</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center border text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                <TableCell className="max-w-xs truncate">{cat.description || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No categories found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input required value={editingCategory?.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="e.g. Fresh Fruits" />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={editingCategory?.image_url || ''} onChange={e => setEditingCategory({...editingCategory, image_url: e.target.value})} placeholder="https://example.com/image.jpg" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingCategory?.description || ''} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} placeholder="Describe items in this category..." />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
