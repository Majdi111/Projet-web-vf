"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hoverCard, hoverTransition } from "@/lib/motion";
import {
  BadgeCheck,
  Ban,
  Plus,
  Phone,
  MapPin,
  Mail,
  Edit,
  Eye,
  Filter,
  Search,
  ShoppingCart,
  FileText,
  Loader2,
  CircleAlert,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddClientDialog from '@/app/clients/add-client-form/AddClientDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { deleteClient } from '@/services/firebaseService';
import { generateInvoicePDF } from "@/app/utils/generateInvoice";

// ========== TYPE DEFINITIONS ==========

// Client data structure with status and order count
interface Client {
  id: string;
  cin: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
  pendingOrdersCount?: number;
}

// Individual item in an order with pricing details
interface OrderItem {
  id: string;
  productId ?:string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Order data structure with status tracking and invoice reference
interface Order {
  id: string;
  clientId: string;
  clientCIN: string;
  clientName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
  invoiceId?: string;
}

// Invoice data structure with complete client and order details
interface Invoice {
  id?: string;
  invoiceNumber: string;
  orderId: string;
  clientId: string;
  clientCIN: string;
  client: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: Date;
  dueDate: Date;
  status: "Paid" | "Pending" | "Overdue";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========== UTILITY FUNCTIONS ==========

// Calculate invoice totals with tax from line items
const calculateInvoiceTotals = (
  items: OrderItem[],
  taxRate: number = 0.2
): { subtotal: number; taxAmount: number; totalAmount: number } => {
  const subtotal = items.reduce((sum, item) => {
    return sum + ((item.quantity || 0) * (item.unitPrice || 0));
  }, 0);

  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

// Generate unique invoice number with timestamp and random suffix
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
};

export default function ClientsPage() {
  // ========== STATE MANAGEMENT ==========
  
  // All clients with pending order counts
  const [clients, setClients] = useState<Client[]>([]);
  
  // Loading state while fetching data
  const [loading, setLoading] = useState(false);
  
  // Display mode: grid or table view
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  // Current filter selection for client status
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive" | "PendingOrders">("All");
  
  // Search query for filtering clients by name/CIN/email/phone/location
  const [searchQuery, setSearchQuery] = useState("");

  // Currently selected client for viewing orders
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Orders belonging to selected client
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  
  // Currently selected order for detail view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Track which order is being processed (converted to invoice)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  
  // Add client dialog visibility
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  
  // Notification toast for success/error messages
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; clientId: string; clientName: string }>({
    isOpen: false,
    clientId: "",
    clientName: "",
  });
  
  // Track which client is being deleted (shows loading spinner)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null); 
  
  // ========== EVENT HANDLERS ==========
  
  // Open add client dialog
  const handleOpenAddClient = () => setShowAddClientDialog(true);
  
  // Close add client dialog
  const handleCloseAddClient = () => setShowAddClientDialog(false);
  
  // Reload clients list after adding new client
  const handleClientAdded = async () => {
    await loadClients();
  };

  // Open delete confirmation dialog
  const handleDeleteClient = (clientId: string, clientName: string) => {
    setDeleteDialogState({
      isOpen: true,
      clientId,
      clientName,
    });
  };

  // Execute client deletion after confirmation
  const confirmDeleteClient = async () => {
    try {
      setDeletingClientId(deleteDialogState.clientId);
      await deleteClient(deleteDialogState.clientId);
      setClients(clients.filter(c => c.id !== deleteDialogState.clientId));
      setDeleteDialogState({ isOpen: false, clientId: "", clientName: "" });
      setNotification({
        type: "success",
        message: `Client "${deleteDialogState.clientName}" deleted successfully.`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Error deleting client:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete client";
      setNotification({
        type: "error",
        message: String(errorMessage)
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeletingClientId(null);
    }
  };

  // Fetch all clients with their pending order counts
  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const clientsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const clientData = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Client;

        const ordersRef = collection(db, 'orders');
        const pendingOrdersQuery = query(
          ordersRef, 
          where('clientId', '==', doc.id),
          where('status', '==', 'Pending')
        );
        const pendingSnapshot = await getDocs(pendingOrdersQuery);
        const pendingCount = pendingSnapshot.size;

        return {
          ...clientData,
          pendingOrdersCount: pendingCount
        } as Client;
      }));
      
      setClients(clientsData);
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Load orders for selected client
  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);
    setClientOrders([]);
    setLoading(true);

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('clientId', '==', client.id));
      const snapshot = await getDocs(q);
      
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          clientId: data.clientId || '',
          clientCIN: data.clientCIN || '',
          clientName: data.clientName || '',
          orderNumber: data.orderNumber || '',
          items: data.items ?? [],
          subtotal: data.subtotal ?? 0,
          taxRate: data.taxRate ?? 0.2,
          taxAmount: data.taxAmount ?? 0,
          totalAmount: data.totalAmount ?? 0,
          status: (data.status as string) ?? "Pending",
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          invoiceId: data.invoiceId || ''
        } as Order;
      });
      
      setClientOrders(ordersData);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Process pending order: create invoice, update stock, generate PDF
  const handleTraiterOrder = async (order: Order) => {
    if (!selectedClient) return;

    try {
      setProcessingOrderId(order.id);

      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      
      const taxRate = order.taxRate ?? 0;
      const taxAmount = order.taxAmount ?? 0;
      const subtotal = order.subtotal ?? 0;
      const totalAmount = order.totalAmount ?? 0;

      const invoiceData: Invoice = {
        invoiceNumber: generateInvoiceNumber(),
        orderId: order.id,
        clientId: selectedClient.id,
        clientCIN: selectedClient.cin,
        client: {
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          location: selectedClient.location,
        },
        items: order.items.map(item => ({
          ...item,
          totalPrice: (item.quantity || 0) * (item.unitPrice || 0)
        })),
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        issueDate,
        dueDate,
        status: "Pending",
        notes: `Generated from Order #${order.orderNumber}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invoicesRef = collection(db, 'invoices');
      const invoiceDoc = await addDoc(invoicesRef, {
        ...invoiceData,
        issueDate: Timestamp.fromDate(issueDate),
        dueDate: Timestamp.fromDate(dueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: "Completed",
        invoiceId: invoiceDoc.id,
        updatedAt: serverTimestamp(),
      });

      // Decrease stock and increment sales for each product
      const productUpdatePromises = order.items.map(async (item) => {
        if (item.productId) {
          try {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await getDoc(productRef);
            
            if (productSnap.exists()) {
              const currentStock = productSnap.data().stock || 0;
              const newStock = currentStock - item.quantity;
              const currentSales = productSnap.data().sales || 0;
              const newSales = currentSales + item.quantity;
              
              // Auto-update product status based on new stock level
              let newStatus = productSnap.data().status;
              if (newStock <= 0) {
                newStatus = "Out of Stock";
              } else if (newStock <= 10 && newStatus !== "Arriving Soon") {
                newStatus = "Low Stock";
              }
              
              await updateDoc(productRef, {
                stock: newStock,
                sales: newSales,
                status: newStatus,
                updatedAt: serverTimestamp()
              });
            }
          } catch (error) {
            console.warn(`Failed to update product ${item.productId}:`, error);
          }
        }
      });
      await Promise.all(productUpdatePromises);

      // Generate and download PDF invoice
      await generateInvoicePDF({ ...invoiceData, id: invoiceDoc.id });
      await handleClientClick(selectedClient);
      await loadClients();

      setNotification({
        type: "success",
        message: ` Invoice ${invoiceData.invoiceNumber} created & PDF downloaded!`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process order";
      setNotification({
        type: "error",
        message: ` ${errorMessage}`
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingOrderId(null);
    }
  };

  //   PendingOrders filter logic with sorting - pending clients at bottom
  const filteredClients = (() => {
    let result = statusFilter === "All" 
      ? clients 
      : statusFilter === "PendingOrders"
        ? clients.filter(c => (c.pendingOrdersCount || 0) > 0)
        : clients.filter(c => c.status === statusFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((c) => {
        const haystack = `${c.name} ${c.cin} ${c.email} ${c.phone} ${c.location}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    
    // Sort so clients with pending orders appear at the top
    return result.sort((a, b) => {
      const aPending = (a.pendingOrdersCount || 0) > 0 ? 1 : 0;
      const bPending = (b.pendingOrdersCount || 0) > 0 ? 1 : 0;
      return bPending - aPending;
    });
  })();

  // ========== CLIENT ORDERS VIEW ==========
  if (selectedClient) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <Button
          variant="outline"
          onClick={() => setSelectedClient(null)}
          className="mb-6 flex items-center gap-2"
        >
          ← Back to Clients
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                  {selectedClient.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-3xl font-bold">{selectedClient.name}</h2>
                <p className="text-muted-foreground text-lg">CIN: {selectedClient.cin}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
            <div className="space-y-1">
              <p className="font-semibold">📧 Email:</p>
              <p>{selectedClient.email}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">📞 Phone:</p>
              <p>{selectedClient.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">📍 Location:</p>
              <p>{selectedClient.location}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Status:</p>
              <Badge
                variant={selectedClient.status === "Active" ? "default" : "secondary"}
                className="inline-flex items-center gap-1"
              >
                {selectedClient.status === "Active" ? (
                  <BadgeCheck className="h-3 w-3" />
                ) : (
                  <Ban className="h-3 w-3" />
                )}
                {selectedClient.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Loading orders...</p>
          </div>
        ) : clientOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No orders</h3>
            <p className="text-muted-foreground">No orders for this client.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clientOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ ...hoverCard, transition: hoverTransition }}
              >
                <Card className="p-6 shadow-md transition-shadow duration-300 ease-out hover:shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <ShoppingCart size={20} className="text-primary" />
                      Order #{order.orderNumber}
                    </h3>
                    <Badge variant={
                      order.status === "Pending" ? "secondary" :
                      order.status === "Completed" ? "default" :
                      order.status === "Processing" ? "outline" : "destructive"
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{order.subtotal.toFixed(2)} Dt</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax {order.taxRate.toFixed(1)}%:</span>
                      <span className="font-medium">{order.taxAmount.toFixed(2)} Dt</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary">{order.totalAmount.toFixed(2)} Dt</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={16} className="mr-2" /> Details
                    </Button>
                    {order.status === "Pending" && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        onClick={() => handleTraiterOrder(order)}
                        disabled={processingOrderId === order.id}
                      >
                        {processingOrderId === order.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText size={16} className="mr-2" />
                            Process
                          </>
                        )}
                      </Button>
                    )}
                    {order.status === "Completed" && order.invoiceId && (
                      <Badge variant="default" className="px-3 py-2 h-fit">
                        <FileText size={14} className="mr-1" />
                        Invoiced
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant={selectedOrder.status === "Completed" ? "default" : "secondary"}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p>{selectedOrder.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Items ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">{item.description}</p>
                          <p className="font-bold text-primary">{item.totalPrice.toFixed(2)} Dt</p>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span>Unit: {item.unitPrice.toFixed(2)} Dt</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} Dt</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({selectedOrder.taxRate.toFixed(1)}%):</span>
                    <span>{selectedOrder.taxAmount.toFixed(2)} Dt</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">{selectedOrder.totalAmount.toFixed(2)} Dt</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ========== CLIENTS LIST VIEW ==========
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Notification Toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 max-w-md z-50 w-[calc(100vw-2rem)] sm:w-auto"
        >
          <Alert
            variant={notification.type === "error" ? "destructive" : "default"}
            className="shadow-xl"
          >
            {notification.type === "success" ? (
              <BadgeCheck className="text-primary" />
            ) : (
              <CircleAlert className="text-destructive" />
            )}
            <AlertTitle>{notification.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              <p className="font-medium text-foreground">{notification.message}</p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Clients
          </h1>
          <p className="text-muted-foreground">Manage clients & generate invoices</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="hover:scale-[1.02] transition-transform duration-300 ease-out"
          >
            {viewMode === "grid" ? "Table view" : "Grid"}
          </Button>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={hoverTransition}
          >
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform duration-300 ease-out shadow-lg flex items-center gap-2" onClick={handleOpenAddClient}>
              <Plus size={16} /> Add Client
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter Section */}
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
                  placeholder="Search by client name"
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
                {(["All", "Active", "Inactive", "PendingOrders"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="transition-all duration-300"
                  >
                    {status === "PendingOrders" ? "Pending Orders" : status}
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                      {status === "All"
                        ? clients.length
                        : status === "PendingOrders"
                          ? clients.filter((c) => (c.pendingOrdersCount || 0) > 0).length
                          : clients.filter((c) => c.status === status).length}
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
                  Showing <span className="font-semibold text-foreground">{filteredClients.length}</span> of <span className="font-semibold text-foreground">{clients.length}</span> clients
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

      {loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center py-32"
        >
          <Card className="p-8 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-lg font-semibold">Loading clients...</p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <>
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ ...hoverCard, transition: hoverTransition }}
                  className="cursor-pointer"
                  onClick={() => handleClientClick(client)}
                >
                  <Card className={`h-full p-6 hover:shadow-2xl transition-all ${
                    (client.pendingOrdersCount || 0) > 0 
                      ? "ring-2 ring-yellow-500/30 border-yellow-500/50 bg-gradient-to-br from-yellow-50/50" 
                      : ""
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={`text-primary font-bold text-lg ${
                            (client.pendingOrdersCount || 0) > 0 
                              ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600" 
                              : "bg-gradient-to-br from-primary/20 to-primary/40"
                          }`}>
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">CIN: {client.cin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={client.status === "Active" ? "default" : "secondary"}
                          className="inline-flex items-center gap-1"
                        >
                          {client.status === "Active" ? (
                            <BadgeCheck className="h-3 w-3" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}
                          {client.status}
                        </Badge>
                        {(client.pendingOrdersCount || 0) > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                            <CircleAlert size={12} />
                            {client.pendingOrdersCount}
                          </Badge>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id, client.name);
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                            title="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-primary" /> {client.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-primary" /> {client.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" /> {client.location}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === "table" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-12 px-4 text-left font-semibold">Client</th>
                      <th className="h-12 px-4 text-left font-semibold">Email</th>
                      <th className="h-12 px-4 text-left font-semibold">Phone</th>
                      <th className="h-12 px-4 text-left font-semibold">Location</th>
                      <th className="h-12 px-4 text-center font-semibold">Status</th>
                      <th className="h-12 px-4 text-center font-semibold">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b hover:bg-muted/20 cursor-pointer transition-colors ${
                          (client.pendingOrdersCount || 0) > 0 
                            ? "bg-yellow-50/50 hover:bg-yellow-100/50 border-yellow-200" 
                            : ""
                        }`}
                        onClick={() => handleClientClick(client)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={`text-primary font-bold ${
                                (client.pendingOrdersCount || 0) > 0 
                                  ? "bg-yellow-500/20 text-yellow-600" 
                                  : "bg-primary/20"
                              }`}>
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">CIN: {client.cin}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-[200px] truncate">{client.email}</td>
                        <td className="px-4 py-4">{client.phone}</td>
                        <td className="px-4 py-4">{client.location}</td>
                        <td className="px-4 py-4 text-center">
                          <Badge
                            variant={client.status === "Active" ? "default" : "secondary"}
                            className="inline-flex items-center gap-1"
                          >
                            {client.status === "Active" ? (
                              <BadgeCheck className="h-3 w-3" />
                            ) : (
                              <Ban className="h-3 w-3" />
                            )}
                            {client.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(client.pendingOrdersCount || 0) > 0 ? (
                            <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                              <CircleAlert size={12} />
                              {client.pendingOrdersCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
      
      <AddClientDialog 
        isOpen={showAddClientDialog}
        onClose={handleCloseAddClient}
        onSuccess={handleClientAdded}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogState.isOpen}
        itemName={deleteDialogState.clientName}
        itemType="Client"
        onConfirm={confirmDeleteClient}
        onCancel={() => setDeleteDialogState({ isOpen: false, clientId: "", clientName: "" })}
      />
    </div>
  );
}
