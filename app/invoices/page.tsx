"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hoverCard, hoverTransition } from "@/lib/motion";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Filter, 
  Loader2, 
  AlertCircle,
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { generateInvoicePDF } from "@/app/utils/generateInvoice";

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
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

export default function InvoicesPage() {
  // ========== STATE MANAGEMENT ==========
  
  // All invoices loaded from Firestore
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Loading state while fetching invoices
  const [loading, setLoading] = useState(true);
  
  // Error message from failed operations
  const [error, setError] = useState<string | null>(null);
  
  // Track which invoice is being downloaded (shows loading spinner)
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Track which invoice status is being updated
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; invoiceId: string; invoiceNumber: string }>({
    isOpen: false,
    invoiceId: "",
    invoiceNumber: "",
  });
  
  // Display mode: grid or table view
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  // Current filter selection for invoice status
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending" | "Overdue">("All");
  
  // Search query for filtering invoices by client CIN
  const [cinSearch, setCinSearch] = useState("");

  // ========== DATA FETCHING ==========
  
  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Fetch all invoices from Firestore
  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const invoicesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          issueDate: data.issueDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Invoice;
      });
      
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Please check your Firebase configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Update invoice status in Firestore
  const handleUpdateStatus = async (invoiceId: string, newStatus: Invoice["status"]) => {
    setUpdatingStatusId(invoiceId);
    
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: newStatus, updatedAt: new Date() }
            : inv
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filter invoices by status and CIN search
  const filteredInvoices = invoices
    .filter(inv => statusFilter === "All" || inv.status === statusFilter)
    .filter(inv => 
      inv.clientCIN.toLowerCase().includes(cinSearch.toLowerCase()) || 
      cinSearch === ""
    );

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "Paid").length;
  const totalRevenue = invoices
    .filter(i => i.status === "Paid")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  // Generate and download PDF for invoice
  const handleDownloadPDF = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteInvoice = (invoiceId: string, invoiceNumber: string) => {
    setDeleteDialogState({
      isOpen: true,
      invoiceId,
      invoiceNumber,
    });
  };

  // Execute invoice deletion after confirmation
  const confirmDeleteInvoice = async () => {
    try {
      await deleteDoc(doc(db, 'invoices', deleteDialogState.invoiceId));
      setInvoices(invoices.filter(inv => inv.id !== deleteDialogState.invoiceId));
      setDeleteDialogState({ isOpen: false, invoiceId: "", invoiceNumber: "" });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

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
              <p className="text-lg font-semibold">Loading invoices...</p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-4">
              <Button onClick={loadInvoices} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Invoices
          </h1>
          <p className="text-muted-foreground">Manage billing and payment records.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="hover:scale-[1.02] transition-transform duration-300 ease-out"
          >
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </Button>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: "Total Invoices",
            value: totalInvoices,
            description: "Invoices generated",
            icon: FileText,
            color: "text-blue-600",
          },
          {
            title: "Paid Invoices",
            value: paidInvoices,
            description: "Fully settled",
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            title: "Total Revenue",
            value: `${totalRevenue.toFixed(2)} Dt`,
            description: "Total payments received",
            icon: DollarSign,
            color: "text-purple-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
  whileHover={{ ...hoverCard, transition: hoverTransition }}
          >
            <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-10 w-10 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
                  value={cinSearch}
                  onChange={(e) => setCinSearch(e.target.value)}
                  placeholder="Search by CIN"
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
                {(["All", "Paid", "Pending", "Overdue"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="transition-all duration-300"
                  >
                    {status}
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                      {status === "All" ? invoices.length : invoices.filter((i) => i.status === status).length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            {(statusFilter !== "All" || cinSearch.trim().length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 pt-2"
              >
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredInvoices.length}</span> of <span className="font-semibold text-foreground">{invoices.length}</span> invoices
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("All");
                    setCinSearch("");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((inv, index) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
  whileHover={{ scale: 1.03, y: -8 }}
            >
              <Card className="overflow-hidden transition-shadow duration-300 ease-out hover:shadow-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> {inv.invoiceNumber}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          inv.status === "Paid"
                            ? "default"
                            : inv.status === "Pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {inv.status}
                      </Badge>

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInvoice(inv.id, inv.invoiceNumber);
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                          title="Delete invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User size={16} className="text-primary" />
                    <span className="font-medium">{inv.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} className="text-primary" />
                    <span>Due: {inv.dueDate.toLocaleDateString()}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dt
                    </p>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => handleDownloadPDF(inv)}
                      disabled={downloadingId === inv.id}
                      className="flex-1"
                      variant="outline"
                    >
                      {downloadingId === inv.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download Invoice
                        </>
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="default" 
                          size="default"
                          disabled={updatingStatusId === inv.id}
                          className="flex-1 justify-center gap-2"
                        >
                          {updatingStatusId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                          Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(inv.id, "Pending")}
                          disabled={inv.status === "Pending"}
                        >
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(inv.id, "Paid")}
                          disabled={inv.status === "Paid"}
                        >
                          Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(inv.id, "Overdue")}
                          disabled={inv.status === "Overdue"}
                        >
                          Overdue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="h-14 px-6 text-left font-semibold text-sm">Invoice #</th>
                    <th className="h-14 px-6 text-left font-semibold text-sm">Client</th>
                    <th className="h-14 px-6 text-left font-semibold text-sm">CIN</th>
                    <th className="h-14 px-6 text-left font-semibold text-sm">Due Date</th>
                    <th className="h-14 px-6 text-center font-semibold text-sm">Status</th>
                    <th className="h-14 px-6 text-right font-semibold text-sm">Amount</th>
                    <th className="h-14 px-6 text-center font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          <span className="font-semibold">{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">{inv.client.name}</td>
                      <td className="px-6 py-5 font-mono text-xs bg-muted/20 px-2 py-1 rounded">{inv.clientCIN}</td>
                      <td className="px-6 py-5">{inv.dueDate.toLocaleDateString()}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <Badge
                            variant={
                              inv.status === "Paid" ? "default" :
                              inv.status === "Pending" ? "secondary" : "destructive"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-primary">
                        {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Dt
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(inv)}
                            disabled={downloadingId === inv.id}
                            title="Download PDF"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={updatingStatusId === inv.id}
                                title="Change Status"
                              >
                                {updatingStatusId === inv.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(inv.id, "Pending")}
                                disabled={inv.status === "Pending"}
                              >
                                Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(inv.id, "Paid")}
                                disabled={inv.status === "Paid"}
                              >
                                Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(inv.id, "Overdue")}
                                disabled={inv.status === "Overdue"}
                              >
                                Overdue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:text-destructive" 
                            title="Delete"
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredInvoices.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Card className="max-w-md mx-auto p-8">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">
              {cinSearch || statusFilter !== "All" ? "No matching invoices" : "No invoices yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {cinSearch 
                ? `No invoices found for CIN: "${cinSearch}"`
                : statusFilter !== "All"
                ? "No invoices match the selected filter."
                : "Create your first invoice to get started."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {statusFilter !== "All" && (
                <Button onClick={() => setStatusFilter("All")} variant="outline">
                  Clear Filters
                </Button>
              )}
              {cinSearch && (
                <Button onClick={() => setCinSearch("")} variant="outline">
                  Clear Search
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Delete Invoice Dialog */}
      <Dialog open={deleteDialogState.isOpen} onOpenChange={(open) => !open && setDeleteDialogState({ isOpen: false, invoiceId: "", invoiceNumber: "" })}>
        <DialogContent className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Delete Invoice
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete invoice <span className="font-semibold text-foreground">{deleteDialogState.invoiceNumber}</span>?
              </p>
              <p className="text-xs text-destructive/70">
                 This action cannot be undone.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogState({ isOpen: false, invoiceId: "", invoiceNumber: "" })}
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="destructive"
                  onClick={confirmDeleteInvoice}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete Invoice
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
