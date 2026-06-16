import React, { useEffect, useState, useRef } from 'react';
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

const CATEGORY_GALLERY = [
  { name: 'Fruits & Veggies', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=300' },
  { name: 'Dairy & Eggs', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300' },
  { name: 'Snacks & Munchies', url: 'https://images.unsplash.com/photo-1599490659213-e2b9527ec087?auto=format&fit=crop&q=80&w=300' },
  { name: 'Instant Food', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=300' },
  { name: 'Bakery & Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300' },
  { name: 'Beverages & Soda', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300' },
  { name: 'Sweets & Chocolate', url: 'https://images.unsplash.com/photo-1511381939415-e44ab21d5e43?auto=format&fit=crop&q=80&w=300' },
  { name: 'Meats & Seafood', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=300' },
  { name: 'Household Supplies', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=300' },
  { name: 'Personal Care', url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=300' }
];

const compressImage = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 250;
      const MAX_HEIGHT = 250;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to high-quality tiny JPG format (~10-15KB) to fit database size limits
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.73);
        callback(compressedBase64);
      } else {
        callback(event.target?.result as string);
      }
    };
    img.onerror = () => {
      callback(event.target?.result as string);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.warn('Backend categories connection failed, falling back to LocalStorage:', e);
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

      <Dialog open={!!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setEditingCategory(null);
          setShowGallery(false);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input required value={editingCategory?.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="e.g. Fresh Fruits" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Image URL / Media</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  className="h-auto p-0 text-xs text-primary font-semibold flex items-center gap-1 hover:no-underline"
                  onClick={() => setShowGallery(!showGallery)}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {showGallery ? 'Hide Preset Gallery' : 'Choose Preset Gallery'}
                </Button>
              </div>

              <div className="flex gap-2 items-center">
                <Input 
                  value={editingCategory?.image_url || ''} 
                  onChange={e => setEditingCategory({...editingCategory, image_url: e.target.value})} 
                  placeholder="https://example.com/image.jpg" 
                  className="flex-1"
                />
                <div className="shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        compressImage(file, (compressedBase64) => {
                          setEditingCategory({
                            ...editingCategory,
                            image_url: compressedBase64
                          });
                          toast.success('Image uploaded & compressed successfully');
                        });
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-10 text-xs font-semibold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload
                  </Button>
                </div>
              </div>

              {/* Dynamic Preset Gallery Selector Grid */}
              {showGallery && (
                <div className="p-3 bg-secondary/30 rounded-lg border border-dashed space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground block font-mono">Select Preset Banner:</span>
                  <div className="grid grid-cols-5 gap-2">
                    {CATEGORY_GALLERY.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="group relative h-12 rounded-md overflow-hidden border bg-background hover:scale-105 transition-all text-left"
                        onClick={() => {
                          setEditingCategory({ ...editingCategory, image_url: item.url });
                          toast.success(`Selected Category Image: ${item.name}`);
                        }}
                        title={item.name}
                      >
                        <img 
                          src={item.url} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-opacity group-hover:opacity-80" 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Image Preview Badge */}
              {editingCategory?.image_url && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="h-16 w-16 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                    <img 
                      src={editingCategory.image_url} 
                      alt="Category Visual" 
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    <span className="font-semibold block text-slate-700">Live Preview</span>
                    <span>Image loaded successfully</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingCategory?.description || ''} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} placeholder="Describe items in this category..." />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setEditingCategory(null);
                setShowGallery(false);
              }}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
