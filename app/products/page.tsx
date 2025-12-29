"use client"

import { useEffect, useState } from "react";
import type { ElementType } from "react";
import Image from "next/image";
import { motion, animate } from "framer-motion";
import { hoverCard, hoverTransition } from "@/lib/motion";
import { Plus, Edit, Trash2, Eye, Package, DollarSign, TrendingUp, TrendingDown, Filter, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { deleteProduct, getProducts } from '@/services/firebaseService';
import AddProductDialog from "./add-product-form/AddProductDialog";
import EditProductDialog from "./edit-product-form/EditProductDialog";
import DeleteProductDialog from "./delete-product-dialog/DeleteProductDialog";


function formatPriceDT(value: number) {
  return `${value}dt`;
}

interface Product {
  id: string;
  reference?: string;
  name: string;
  description: string;
  features?: string[];
  price: number | null;
  originalPrice?: number | null;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Arriving Soon";
  sales: number;
  image: string;
}

// Animated number counter with smooth transitions
function AnimatedCounter({
  value,
  duration = 2,
}: {
  value: string | number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const raw = String(value);
    const match = raw.match(/-?[0-9,.]+/);
    const numericValue = match
      ? Number(match[0].replace(/,/g, ""))
      : typeof value === "number"
        ? value
        : 0;

    const prefix = match ? raw.slice(0, match.index ?? 0) : "";
    const suffix = match
      ? raw.slice((match.index ?? 0) + match[0].length)
      : "";

    const controls = animate(0, numericValue, {
      duration,
      ease: "easeOut",
      onUpdate(latest) {
        const formatted = Math.floor(latest).toLocaleString();
        setDisplayValue(`${prefix}${formatted}${suffix}`);
      },
    });

    return controls.stop;
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

// Product image component with error handling
function ProductImage({
  product,
  size,
  className,
}: {
  product: Product;
  size: number;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const isLocalImage = product.image.startsWith("/");

  if (!isLocalImage || imageError) {
    return <span className={className}>No Image</span>;
  }

  return (
    <Image
      src={product.image}
      alt={product.name}
      width={size}
      height={size}
      className={className}
      priority={false}
      onError={() => setImageError(true)}
    />
  );
}

// Statistics card with animated counter and hover effects
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  index 
}: { 
  title: string
  value: string | number
  icon: ElementType<{ className?: string }>
  color: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        ...hoverCard,
        transition: hoverTransition,
      }}
    >
      <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <motion.div
            whileHover={{ 
              rotate: 360,
              transition: { duration: 0.4, ease: "easeInOut" }
            }}
          >
            <Icon className={`h-10 w-10 ${color}`} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <AnimatedCounter value={value} duration={2} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Individual product card with image, pricing, and action buttons
function ProductCard({ product, index, onEdit, onDelete }: { product: Product; index: number; onEdit?: (product: Product) => void; onDelete?: (id: string, name: string) => void }) {
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch(status) {
      case "In Stock": return "default";
      case "Low Stock": return "secondary";
      case "Out of Stock": return "destructive";
      case "Arriving Soon": return "secondary";
      default: return "secondary";
    }
  };

  const statusClassName =
    product.status === "Arriving Soon"
      ? "bg-blue-900 text-white hover:bg-blue-900/90"
      : product.status === "Low Stock"
        ? "border-destructive"
        : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.03, 
        y: -8,
        transition: { 
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1]
        }
      }}
      className="h-full"
    >
      <Card className="relative overflow-hidden transition-shadow duration-300 ease-out hover:shadow-2xl h-full flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Reference (Top Left) */}
          <div className="absolute left-3 top-3 z-10">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 text-muted-foreground bg-background/70 backdrop-blur"
              title="Reference"
            >
              {product.reference ?? product.id}
            </Badge>
          </div>

          {/* Status (Top Right) */}
          <div className="absolute right-3 top-3 z-10">
            <Badge
              variant={getStatusVariant(product.status)}
              className={`text-[11px] px-2 py-0.5 ${statusClassName}`}
            >
              {product.status}
            </Badge>
          </div>

          {/* Product Image/Icon */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative h-36 bg-transparent flex items-center justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="px-5 py-3"
            >
              <ProductImage
                product={product}
                size={190}
                className={
                  product.image.startsWith("/") || product.image.startsWith("http")
                    ? "object-contain max-h-28 w-auto drop-shadow-sm"
                    : "text-6xl"
                }
              />
            </motion.div>
          </motion.div>

          <div className="p-5 flex flex-col flex-grow">
            {/* Product Info */}
            <div className="mb-3">
              <h3 className="font-semibold text-[18px] leading-snug tracking-tight text-center">
                {product.name}
              </h3>
              {!!product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2 text-center">
                  {product.description}
                </p>
              )}

              {!!product.features?.length && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.02 }}
                  className="flex flex-wrap justify-center gap-1.5 mb-3"
                >
                  {product.features
                    .slice(0, 5)
                    .map((item) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                        {item}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}

            </div>

            <Separator className="my-2.5" />

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 + index * 0.02 }}
              className="mb-4"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="mx-auto w-full max-w-[280px] rounded-2xl border border-blue-900/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background/40 px-4 py-3 text-center shadow-md"
              >
                <div className="inline-flex items-end justify-center">
                  {product.price == null ? (
                    <span className="text-2xl leading-none font-bold text-muted-foreground">—</span>
                  ) : (
                    <>
                      <div className="flex items-end justify-center gap-3">
                        {product.originalPrice != null && product.originalPrice > product.price && (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-muted-foreground line-through tabular-nums whitespace-nowrap">
                              {product.originalPrice}dt
                            </span>
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive whitespace-nowrap">
                              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                            </span>
                          </div>
                        )}

                        <span className="inline-flex items-end justify-center whitespace-nowrap">
                          <span className="text-[28px] leading-none font-bold font-mono tracking-tight tabular-nums bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
                            {product.price}
                          </span>
                          <span className="pb-1 text-[10px] font-semibold text-muted-foreground">dt</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom Info Row */}
            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>{product.sales} sales</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span
                  className={
                    product.stock === 0
                      ? "text-destructive"
                      : product.status === "Low Stock"
                        ? "text-destructive/70"
                        : undefined
                  }
                >
                  {product.stock} in stock
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-1">
              <motion.div whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.96 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/0 shadow-sm transition-shadow hover:shadow-md"
                  title="Edit Product"
                  onClick={() => onEdit?.(product)}
                >
                  <motion.div whileHover={{ rotate: 12, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <Edit className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.96 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full border border-destructive/30 bg-destructive/5 text-destructive shadow-sm transition-shadow hover:shadow-md hover:bg-destructive/10"
                  title="Delete"
                  onClick={() => onDelete?.(product.id, product.name)}
                >
                  <motion.div whileHover={{ rotate: 10, scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <Trash2 className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main products page with grid/table views and filtering
export default function ProductsPage() {
  // ========== STATE MANAGEMENT ==========
  
  // All products loaded from Firestore
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<"All" | "In Stock" | "Low Stock" | "Out of Stock" | "Arriving Soon">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; productId: string; productName: string }>({
    isOpen: false,
    productId: "",
    productName: "",
  });
  
  // Load all products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const productsData = await getProducts();
      setProducts(productsData as Product[]);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open delete confirmation dialog
  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteDialogState({
      isOpen: true,
      productId,
      productName,
    });
  };

  // Open edit dialog with selected product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditProductDialogOpen(true);
  };

  // Execute product deletion after confirmation
  const confirmDeleteProduct = async () => {
    try {
      await deleteProduct(deleteDialogState.productId);
      setProducts(products.filter(p => p.id !== deleteDialogState.productId));
      setDeleteDialogState({ isOpen: false, productId: "", productName: "" });
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  // Display loading spinner while fetching
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">Loading products...</p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Display error message if loading fails
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <Package className="h-12 w-12 text-destructive" />
            <h3 className="text-xl font-semibold">Error Loading Products</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ========== STATISTICS CALCULATIONS ==========
  
  // Calculate total products and inventory values
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + ((p.price ?? 0) * p.stock), 0);
  const lowStock = products.filter(p => p.status === "Low Stock" || p.status === "Out of Stock").length;
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

  // Apply filters: status filter and search query
  const filteredProducts = products.filter(product => {
    const matchesStatus = statusFilter === "All" || product.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = q.length === 0 || product.name.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  // Statistics cards data for dashboard overview
  const statsData = [
    { title: "Total Products", value: totalProducts, icon: Package, color: "text-blue-600" },
    { title: "Total Value", value: `${totalValue.toFixed(2)}dt`, icon: DollarSign, color: "text-green-600" },
    { title: "Low Stock Alert", value: lowStock, icon: TrendingDown, color: "text-orange-600" },
    { title: "Total Sales", value: totalSales, icon: TrendingUp, color: "text-purple-600" },
  ];

  const statusOptions = ["All", "In Stock", "Low Stock", "Out of Stock", "Arriving Soon"] as const;

  // ========== MAIN UI ==========
  
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1]
        }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-muted-foreground">Manage your product catalog and pricing.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="hover:scale-[1.02] transition-transform duration-300 ease-out"
          >
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </Button>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={hoverTransition}
          >
            <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform duration-300 ease-out shadow-lg" onClick={() => setIsAddProductDialogOpen(true)}>
              <Plus size={16} /> Add Product
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <StatsCard 
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            index={index}
          />
        ))}
      </div>

      {/* Search and Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Card className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-muted-foreground" />
                <span className="font-semibold text-sm">Find :</span>
              </div>
              <div className="w-full sm:max-w-sm">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product name"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-muted-foreground" />
                <span className="font-semibold text-sm">Filter :</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {statusOptions.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="transition-all duration-300"
                  >
                    {status}
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                      {status === "All" ? products.length : products.filter((p) => p.status === status).length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            {(statusFilter !== "All" || searchQuery.trim().length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 pt-2"
              >
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of <span className="font-semibold text-foreground">{products.length}</span> products
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("All");
                    setSearchQuery("");
                  }}
                  className="h-7 text-xs"
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="h-14 px-6 text-left align-middle font-semibold text-sm whitespace-nowrap">Product</th>
                    <th className="h-14 px-6 text-center align-middle font-semibold text-sm whitespace-nowrap">Price</th>
                    <th className="h-14 px-6 text-center align-middle font-semibold text-sm whitespace-nowrap">Stock</th>
                    <th className="h-14 px-6 text-center align-middle font-semibold text-sm whitespace-nowrap">Sales</th>
                    <th className="h-14 px-6 text-center align-middle font-semibold text-sm whitespace-nowrap">Status</th>
                    <th className="h-14 px-6 text-center align-middle font-semibold text-sm whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-muted/30 transition-colors duration-300"
                    >
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-3 min-w-[250px]">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/25 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                            <ProductImage
                              product={product}
                              size={34}
                              className={product.image.startsWith("/") || product.image.startsWith("http") ? "object-contain w-auto max-h-8 drop-shadow-sm" : "text-xl"}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {`${(product.reference ?? product.id)}${product.features?.length ? ` • ${product.features.slice(0, 2).join(" • ")}` : ""}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        {product.price == null ? (
                          <span className="font-semibold text-muted-foreground">—</span>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-3 whitespace-nowrap">
                            {product.originalPrice != null && product.originalPrice > product.price && (
                              <>
                                <span className="text-xs font-semibold text-muted-foreground line-through tabular-nums">
                                  {product.originalPrice}dt
                                </span>
                                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                                </span>
                              </>
                            )}
                            <span className="inline-flex items-end justify-center">
                              <span className="font-bold font-mono tabular-nums text-primary text-base leading-none">
                                {product.price}
                              </span>
                              <span className="text-[11px] font-semibold text-muted-foreground">dt</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        <span
                          className={
                            product.stock === 0
                              ? "text-lg text-destructive"
                              : product.status === "Low Stock"
                                ? "text-lg text-destructive/70"
                                : "font-semibold text-lg"
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{product.sales}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex justify-center">
                          <Badge variant={
                            product.status === "In Stock" ? "default" :
                            product.status === "Low Stock" ? "secondary" :
                            product.status === "Arriving Soon" ? "secondary" :
                            "destructive"
                          }
                          className={product.status === "Arriving Soon" ? "bg-blue-900 text-white hover:bg-blue-900/90" : undefined}
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9"
                              title="Edit Product"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-16"
        >
          <Card className="max-w-md mx-auto p-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              No products match the selected filters. Try changing your filter settings.
            </p>
            <Button 
              onClick={() => {
                setStatusFilter("All");
                setSearchQuery("");
              }} 
              variant="outline"
            >
              Clear Filters
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Add Product Dialog */}
      <AddProductDialog 
        isOpen={isAddProductDialogOpen}
        onClose={() => setIsAddProductDialogOpen(false)}
        onSuccess={fetchProducts}
      />

      {/* Edit Product Dialog */}
      <EditProductDialog 
        isOpen={isEditProductDialogOpen}
        onClose={() => {
          setIsEditProductDialogOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchProducts}
        product={editingProduct}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        isOpen={deleteDialogState.isOpen}
        productName={deleteDialogState.productName}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteDialogState({ isOpen: false, productId: "", productName: "" })}
      />
    </div>
  );
}