import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Product, Category } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Edit2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

const GALLERY_IMAGES = [
  { name: 'Red Apples', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80', emoji: '🍎' },
  { name: 'Fresh Bananas', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80', emoji: '🍌' },
  { name: 'Pure Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80', emoji: '🥛' },
  { name: 'Sliced Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', emoji: '🍞' },
  { name: 'Green Grapes', url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&auto=format&fit=crop&q=80', emoji: '🍇' },
  { name: 'Fresh Eggs', url: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&auto=format&fit=crop&q=80', emoji: '🥚' },
  { name: 'Organic Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80', emoji: '🥔' },
  { name: 'Red Tomatoes', url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&auto=format&fit=crop&q=80', emoji: '🍅' },
  { name: 'Broccoli Heads', url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80', emoji: '🥦' },
  { name: 'Crisp Potato Chips', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80', emoji: '🍟' },
  { name: 'Soda Can', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80', emoji: '🥤' },
  { name: 'Orange Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80', emoji: '🧃' },
  { name: 'Chocolate Bar', url: 'https://images.unsplash.com/photo-1511381939415-e44ab21d5e43?w=400&auto=format&fit=crop&q=80', emoji: '🍫' },
  { name: 'Instant Ramen Noodles', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80', emoji: '🍜' },
  { name: 'Butter Block', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80', emoji: '🧈' },
  { name: 'Basmati Rice Bag', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80', emoji: '🌾' },
  { name: 'Strawberries', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&auto=format&fit=crop&q=80', emoji: '🍓' },
  { name: 'Water Bottle', url: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=400&auto=format&fit=crop&q=80', emoji: '💧' },
  { name: 'Fresh Cucumbers', url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&auto=format&fit=crop&q=80', emoji: '🥒' },
  { name: 'Yellow Lemons', url: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&auto=format&fit=crop&q=80', emoji: '🍋' }
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
        // Compress to high-quality tiny JPG format (~10-15KB) to fit standard database limits
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      } else {
        callback(event.target?.result as string);
      }
    };
    img.onerror = () => {
      // Direct fallback
      callback(event.target?.result as string);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Alphonso Mangoes', category: 'Fruits & Vegetables', price: 150, original_price: 180, stock: 45, emoji: '🥭', image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop&q=80', unit: '1 kg', description: 'Sweet, juicy and hand-picked organic Alphonso mangoes.', barcode: '' },
  { id: 'p2', name: 'Fresh Bananas', category: 'Fruits & Vegetables', price: 50, original_price: 60, stock: 120, emoji: '🍌', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80', unit: '1 dozen', description: 'Naturally ripened, premium local bananas.', barcode: '' },
  { id: 'p3', name: 'Pure Cow Milk', category: 'Dairy, Bread & Eggs', price: 65, original_price: 70, stock: 30, emoji: '🥛', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80', unit: '1 L', description: 'Freshly sourced pasteurized whole milk.', barcode: '' },
  { id: 'p4', name: 'Brown Sliced Bread', category: 'Dairy, Bread & Eggs', price: 40, original_price: 45, stock: 15, emoji: '🍞', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', unit: '400 g', description: 'Whole wheat freshly baked sandwich bread.', barcode: '' },
  { id: 'p5', name: 'Chilli Potato Chips', category: 'Munchies & Chips', price: 20, original_price: 20, stock: 80, emoji: '🍟', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80', unit: '50 g', description: 'Spicy and crunchy kettle potato chips.', barcode: '' },
  { id: 'p6', name: 'Instant Masala Ramen', category: 'Instant Food', price: 15, original_price: 18, stock: 150, emoji: '🍜', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80', unit: '70 g', description: 'Quick and tasty masala instant noodles.', barcode: '' }
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  // Stock quick edit
  const [stockEdits, setStockEdits] = useState<{ [key: string]: number }>({});

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (productsRes.data && productsRes.data.length > 0) {
        setProducts(productsRes.data as Product[]);
        localStorage.setItem('neighborcart_products', JSON.stringify(productsRes.data));
      } else {
        const localProds = localStorage.getItem('neighborcart_products');
        if (localProds) {
          setProducts(JSON.parse(localProds));
        } else {
          setProducts(DEFAULT_PRODUCTS);
          localStorage.setItem('neighborcart_products', JSON.stringify(DEFAULT_PRODUCTS));
        }
      }

      // Populate categories
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        setCategories(categoriesRes.data as Category[]);
        localStorage.setItem('neighborcart_categories', JSON.stringify(categoriesRes.data));
      } else {
        // Localstorage fallback check
        const local = localStorage.getItem('neighborcart_categories');
        if (local) {
          setCategories(JSON.parse(local));
        } else {
          const defaultCats = [
            { id: '1', name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
            { id: '2', name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs' },
            { id: '3', name: 'Munchies & Chips', slug: 'snacks-munchies' },
            { id: '4', name: 'Instant Food', slug: 'instant-food' },
          ];
          setCategories(defaultCats);
          localStorage.setItem('neighborcart_categories', JSON.stringify(defaultCats));
        }
      }
    } catch (e) {
      console.warn('Backend connection failed, falling back to LocalStorage:', e);
      const localProds = localStorage.getItem('neighborcart_products');
      if (localProds) {
        setProducts(JSON.parse(localProds));
      } else {
        setProducts(DEFAULT_PRODUCTS);
        localStorage.setItem('neighborcart_products', JSON.stringify(DEFAULT_PRODUCTS));
      }

      const localCats = localStorage.getItem('neighborcart_categories');
      if (localCats) {
        setCategories(JSON.parse(localCats));
      } else {
        const defaultCats = [
          { id: '1', name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
          { id: '2', name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs' },
          { id: '3', name: 'Munchies & Chips', slug: 'snacks-munchies' },
          { id: '4', name: 'Instant Food', slug: 'instant-food' },
        ];
        setCategories(defaultCats);
        localStorage.setItem('neighborcart_categories', JSON.stringify(defaultCats));
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStockChange = (id: string, newStock: number) => {
    setStockEdits(prev => ({ ...prev, [id]: newStock }));
  };

  const handleStockSave = async (id: string) => {
    const newStock = stockEdits[id];
    if (newStock === undefined) return;
    
    const updatedProducts = products.map(p => p.id === id ? { ...p, stock: newStock } : p);
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
      if (error) {
        setProducts(updatedProducts);
        localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));
        toast.success('Stock updated (saved locally as backend fallback)');
      } else {
        toast.success('Stock updated in database successfully');
        setProducts(updatedProducts);
        localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));
      }
    } catch {
      setProducts(updatedProducts);
      localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));
      toast.success('Stock updated (saved locally as offline fallback)');
    }

    setStockEdits(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return toast.error('Product Name is required');

    try {
      if (editingProduct.id) {
        const updatedProducts = products.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct } as Product : p);
        const { error } = await supabase.from('products').update(editingProduct).eq('id', editingProduct.id);
        
        setProducts(updatedProducts);
        localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));

        if (error) {
          toast.success('Product updated locally (offline fallback mode)');
        } else {
          toast.success('Product updated successfully in backend');
        }
      } else {
        const generatedId = Math.random().toString(36).substr(2, 9);
        const newProd = {
          ...editingProduct,
          id: generatedId,
        } as Product;
        const updatedProducts = [newProd, ...products];
        const { error } = await supabase.from('products').insert([newProd]);
        
        setProducts(updatedProducts);
        localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));

        if (error) {
          toast.success('Product added locally (offline fallback mode)');
        } else {
          toast.success('Product added successfully to backend');
        }
      }
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const updatedProducts = products.filter(p => p.id !== id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      setProducts(updatedProducts);
      localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));
      if (error) {
        toast.success('Product deleted locally (offline fallback mode)');
      } else {
        toast.success('Product deleted successfully');
        fetchData();
      }
    } catch {
      setProducts(updatedProducts);
      localStorage.setItem('neighborcart_products', JSON.stringify(updatedProducts));
      toast.success('Product deleted locally (offline fallback mode)');
    }
  };

  const filteredProducts = products.filter(p => {
    const productName = String(p.name || '').toLowerCase();
    const productBarcode = String(p.barcode || '').toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch = productName.includes(searchLower) || productBarcode.includes(searchLower);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Button onClick={() => setEditingProduct({ price: 0, original_price: 0, stock: 0, category: categories[0]?.name || 'Fresh Produce' })}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or barcode..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-32">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map(product => {
              const currentStockEdit = stockEdits[product.id];
              const isEditingStock = currentStockEdit !== undefined;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-md object-cover border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center border text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.emoji && <span className="text-xl">{product.emoji}</span>}
                      <div>
                        <span className="font-medium block">{product.name}</span>
                        {product.unit && <span className="text-xs text-muted-foreground">{product.unit}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={isEditingStock ? currentStockEdit : product.stock}
                        onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                      />
                      {isEditingStock && currentStockEdit !== product.stock && (
                        <Button size="sm" className="h-8 px-2 text-xs" onClick={() => handleStockSave(product.id)}>Save</Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct.id ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Product Name</Label>
                  <Input required value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="e.g. Alphonso Mangoes" />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  {categories.length > 0 ? (
                    <Select 
                      value={editingProduct.category || ''} 
                      onValueChange={(val) => setEditingProduct({ ...editingProduct, category: val })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} placeholder="Category Name" />
                  )}
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label>Image URL / Media</Label>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="h-auto p-0 text-xs text-primary font-semibold flex items-center gap-1 hover:no-underline"
                      onClick={() => setShowGallery(!showGallery)}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      {showGallery ? 'Hide Gallery' : 'Gallery Pics'}
                    </Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={editingProduct.image_url || ''} 
                      onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} 
                      placeholder="https://example.com/mango.jpg" 
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
                              setEditingProduct({
                                ...editingProduct,
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
                </div>

                <div className="space-y-2">
                  <Label>Emoji Emblem (optional)</Label>
                  <Input value={editingProduct.emoji || ''} onChange={e => setEditingProduct({...editingProduct, emoji: e.target.value})} placeholder="🥭" />
                </div>

                {editingProduct.image_url && (
                  <div className="col-span-2 flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                    <img 
                      src={editingProduct.image_url} 
                      alt="Product preview" 
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 object-cover rounded border bg-white shadow-sm" 
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold">Image Loaded Successfully</div>
                      <button 
                        type="button" 
                        onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })}
                        className="text-[11px] text-destructive hover:underline font-medium"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}

                {showGallery && (
                  <div className="col-span-2 border border-dashed rounded-lg p-3 bg-muted/40 max-h-[220px] overflow-y-auto space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">Select standard high-res image & emoji:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {GALLERY_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditingProduct({
                              ...editingProduct,
                              image_url: img.url,
                              emoji: img.emoji
                            });
                            setShowGallery(false);
                            toast.success(`Selected high-resolution image for ${img.name}!`);
                          }}
                          className="group relative flex flex-col items-center justify-center p-2 border rounded-md bg-card hover:border-primary hover:ring-1 hover:ring-primary transition-all text-left"
                        >
                          <img src={img.url} alt={img.name} referrerPolicy="no-referrer" className="h-10 w-10 object-cover rounded" />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-1 font-medium">{img.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Unit (e.g. 1 kg, 500 g, pc)</Label>
                  <Input value={editingProduct.unit || ''} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} placeholder="1 kg" />
                </div>

                <div className="space-y-2">
                  <Label>Selling Price (₹)</Label>
                  <Input type="number" step="0.01" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                </div>

                <div className="space-y-2">
                  <Label>M.R.P. / Original Price (₹)</Label>
                  <Input type="number" step="0.01" value={editingProduct.original_price || 0} onChange={e => setEditingProduct({...editingProduct, original_price: parseFloat(e.target.value) || 0})} />
                </div>

                <div className="space-y-2">
                  <Label>In-Stock Quantity</Label>
                  <Input type="number" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} />
                </div>

                <div className="space-y-2">
                  <Label>Barcode (optional)</Label>
                  <Input value={editingProduct.barcode || ''} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} placeholder="890123456789" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} placeholder="Product specific information, storage details..." />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                <Button type="submit">Save Product</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
