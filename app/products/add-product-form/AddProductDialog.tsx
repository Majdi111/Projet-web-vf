"use client";

import { useState } from "react";
import { Package, Loader2, DollarSign, Hash, BarChart3, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addProduct } from "@/services/firebaseService";
import { motion } from "framer-motion";
import { hoverTransition } from "@/lib/motion";

interface AddProductForm {
  reference: string;
  name: string;
  description: string;
  features: string[];
  featureInput: string;
  price: number | "";
  originalPrice: number | "";
  stock: number | "";
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Arriving Soon";
  sales: number | "";
  image: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function AddProductDialog({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AddProductDialogProps) {
  const [formData, setFormData] = useState<AddProductForm>({
    reference: '',
    name: '',
    description: '',
    features: [],
    featureInput: '',
    price: "",
    originalPrice: "",
    stock: "",
    status: 'In Stock',
    sales: "",
    image: ''
  });
  const [loading, setLoading] = useState(false);

  const contentVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.045 },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  } as const

  const sanitizeName = (value: string) =>
    value
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s'\-]/g, "")
      .trimStart()
      .slice(0, 100)

  const sanitizeReference = (value: string) => 
    value
      .replace(/\s+/g, "")
      .toUpperCase()
      .slice(0, 50)

  const sanitizeNumber = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "" : num;
  }

  const addFeature = () => {
    const trimmed = formData.featureInput.trim();
    if (trimmed && !formData.features.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, trimmed],
        featureInput: ''
      }));
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData((previous) => {
      if (name === "name") return { ...previous, name: sanitizeName(value) }
      if (name === "reference") return { ...previous, reference: sanitizeReference(value) }
      if (name === "price") return { ...previous, price: value === "" ? "" : sanitizeNumber(value) }
      if (name === "originalPrice") return { ...previous, originalPrice: value === "" ? "" : sanitizeNumber(value) }
      if (name === "stock") return { ...previous, stock: value === "" ? "" : sanitizeNumber(value) }
      if (name === "sales") return { ...previous, sales: value === "" ? "" : sanitizeNumber(value) }
      if (name === "description") return { ...previous, description: value.slice(0, 500) }
      if (name === "featureInput") return { ...previous, featureInput: value.slice(0, 50) }
      if (name === "image") return { ...previous, image: value }
      return { ...previous, [name]: value }
    })
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.reference) {
      alert('Please fill in required fields (Reference and Name)');
      return;
    }

    setLoading(true);
    try {
      await addProduct({
        reference: formData.reference,
        name: formData.name,
        description: formData.description,
        features: formData.features,
        price: formData.price === "" ? null : formData.price,
        originalPrice: formData.originalPrice === "" ? null : formData.originalPrice,
        stock: formData.stock === "" ? 0 : formData.stock,
        status: formData.status,
        sales: formData.sales === "" ? 0 : formData.sales,
        image: formData.image,
      });
      
      // Reset form
      setFormData({
        reference: '',
        name: '',
        description: '',
        features: [],
        featureInput: '',
        price: "",
        originalPrice: "",
        stock: "",
        status: 'In Stock',
        sales: "",
        image: ''
      });
      
      onClose();
      await onSuccess();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <motion.div variants={contentVariants} initial="hidden" animate="show" className="bg-background">
          <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm px-6 py-5 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Package className="h-5 w-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold tracking-tight">Add Product</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Add a new product to your catalog.
                  </span>
                </span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pb-2 pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="reference">
                  Reference <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Product reference"
                    autoComplete="off"
                    maxLength={50}
                    className="pl-10"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Product name"
                  maxLength={100}
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 sm:col-span-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product description (optional)"
                  maxLength={500}
                  className="resize-none h-20"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 sm:col-span-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="featureInput">Features</Label>
                <div className="flex gap-2">
                  <Input
                    id="featureInput"
                    name="featureInput"
                    value={formData.featureInput}
                    onChange={handleInputChange}
                    placeholder="Add a feature (e.g., Fast, Durable, Lightweight)"
                    maxLength={50}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFeature}
                    disabled={!formData.featureInput.trim()}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.features.map((feature) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-sm"
                      >
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-background/50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="price">
                  Price (DT)
                </Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="pl-10"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="originalPrice">Original Price (DT)</Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="originalPrice"
                    name="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="pl-10"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="sales">Sales Count</Label>
                <div className="relative">
                  <BarChart3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sales"
                    name="sales"
                    type="number"
                    value={formData.sales}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="pl-10"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as "In Stock" | "Low Stock" | "Out of Stock" | "Arriving Soon" })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    <SelectItem value="Arriving Soon">Arriving Soon</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2 sm:col-span-2 rounded-xl border border-border/50 bg-muted/10 p-4">
                <Label htmlFor="image">
                  Product Image Path
                </Label>
                <div className="relative">
                  <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="e.g., /products/image.jpg"
                    className="pl-10"
                  />
                </div>
              </motion.div>
            </div>
          </div>

          <DialogFooter className="mt-2 border-t border-border/40 bg-background/95 backdrop-blur-sm px-6 py-4 gap-2 sticky bottom-0">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={hoverTransition}
            >
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.reference}
                className="bg-gradient-to-r from-primary to-primary/80 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
