# MMKR Solutions - Business Management Platform

A modern, full-stack web application for managing clients, products, invoices, and orders. Built with Next.js, TypeScript, Firebase, and Tailwind CSS.

## 🎯 Overview

MMKR Solutions is a comprehensive business management platform designed to streamline operations for small to medium-sized enterprises. It provides an intuitive interface for managing customers, inventory, orders, and billing with real-time synchronization and beautiful data visualizations.

## ✨ Key Features

### 📊 Dashboard
- **Real-time Analytics**: Revenue, client count, invoice count, and product statistics
- **Interactive Charts**: 
  - Revenue trends (line chart)
  - Invoice status distribution (pie chart)
  - Sales vs. purchases comparison (bar chart)
- **Animated Counters**: Smooth number animations for statistics
- **Quick Overview**: Key metrics at a glance

### 👥 Client Management
- **Add/Edit/Delete Clients**: Full CRUD operations
- **Client Profiles**: Store CIN, contact details, and location
- **Status Tracking**: Active/Inactive client status
- **View Details**: Comprehensive client information display
- **Grid & Table Views**: Flexible data visualization options

### 📦 Product Management
- **Product Catalog**: Manage inventory with detailed product information
- **Pricing & Stock**: Track prices, stock levels, and sales history
- **Product Features**: Add and display product features as tags
- **Image Support**: Display product images from URLs or local paths
- **Status Indicators**: Real-time stock status (In Stock, Low Stock, Out of Stock, Arriving Soon)
- **Analytics**: Total products, inventory value, low stock alerts

### 🛒 Order Management
- **Create Orders**: Generate orders from clients with multiple items
- **Order Tracking**: Monitor order status (Pending, Processing, Completed, Cancelled)
- **Tax Calculation**: Automatic tax computation (20% default)
- **Order Details**: View complete order information with line items
- **Convert to Invoice**: Process orders directly into invoices

### 📄 Invoice Management
- **Auto-Generated Invoices**: Create invoices from orders
- **Status Management**: Track invoice status (Paid, Pending, Overdue)
- **PDF Generation**: Professional PDF invoices with company branding
- **Invoice Details**: View complete invoice information including client data, items, and totals
- **Search & Filter**: Find invoices quickly by number, client, or status

### ⚙️ Settings & Configuration
- **Company Profile**: Store company name, email, phone numbers, and addresses
- **Logo Management**: Upload and manage company logo for invoices
- **Data Export**: Company information can be used in PDF generation

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Recharts**: Interactive data visualizations
- **Lucide Icons**: Beautiful SVG icons
- **Shadcn/ui**: Accessible UI components

### Backend & Database
- **Firebase Authentication**: Secure user authentication
- **Firebase Firestore**: Real-time NoSQL database

### PDF Generation
- **jsPDF**: PDF document creation
- **jsPDF AutoTable**: Table generation for PDFs


## 📋 Project Structure

```
WEB_Project/
├── app/                          
│   ├── dashboard/                
│   ├── clients/                  
│   │   ├── add-client-form/     
│   │   ├── page.tsx             
│   │   └── layout.tsx           
│   ├── products/                
│   │   ├── add-product-form/    
│   │   ├── edit-product-form/   
│   │   ├── delete-product-dialog/
│   │   └── page.tsx             
│   ├── invoices/                 
│   │   ├── page.tsx             
│   │   └── layout.tsx           
│   ├── settings/                 
│   │   ├── page.tsx             
│   │   └── layout.tsx           
│   ├── login/                    
│   │   ├── page.tsx             
│   │   ├── LoginForm.tsx        
│   │   └── RegisterForm.tsx     
│   ├── context/                 
│   │   └── AuthContext.tsx      
│   ├── utils/                   
│   │   └── generateInvoice.ts   
│   ├── layout.tsx              
│   ├── page.tsx                
│   └── globals.css             
├── components/                  
│   ├── ui/                      
│   ├── Sidebar.tsx              
│   ├── TopBar.tsx               
│   ├── RevenueChart.tsx         
│   ├── InvoiceChart.tsx         
│   └── TitleMarquee.tsx         
├── lib/                          
│   ├── firebaseClient.ts        
│   ├── utils.ts                 
│   └── motion.ts                
├── services/                     
│   └── firebaseService.ts       
├── types/                       
│   └── index.ts               
├── public/                    
│   └── logo.png                 
├── .next/                       
├── next.config.ts               
├── tailwind.config.ts           
├── tsconfig.json                
├── package.json                 
└── README.md                    
```

## 📊 Data Models

### Client
```typescript
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
}
```

### Product
```typescript
interface Product {
  id: string;
  reference?: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
  features?: string[];       // Product features as tags
  image?: string;            // Image URL
  sales?: number;            // Number of sales
  originalPrice?: number;    // Original price for discounts
  status?: "In Stock" | "Low Stock" | "Out of Stock" | "Arriving Soon";
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Order
```typescript
interface Order {
  id: string;
  clientId: string;
  clientCIN: string;
  clientName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;           // e.g., 0.19 for 19%
  taxAmount: number;
  totalAmount: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
  invoiceId?: string;
}
```

### Invoice
```typescript
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
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Majdi111/Projet-web-vf.git
cd WEB_Project
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Authentication
1. Register a new account or login with existing credentials
2. Credentials are securely stored in Firebase Authentication

### Managing Clients
1. Navigate to **Clients** section
2. Click **Add Client** to create a new client
3. Fill in client details (Name, CIN, Email, Phone, Location)
4. View clients in grid or table view
5. Edit or delete clients as needed

### Managing Products
1. Go to **Products** section
2. Click **Add Product** to create new product
3. Enter product details: name, reference, price, stock, features, image URL
4. View products in grid or table view
5. Track product sales and stock status
6. Edit or delete products

### Creating Orders
1. Open **Clients** section
2. Select a client and add order items
3. System automatically calculates subtotal, tax (20%), and total
4. Save the order with status "Pending"

### Processing Orders to Invoices
1. In **Clients**, find a pending order
2. Click **Process** button
3. System generates invoice automatically
4. Order status changes to "Completed"
5. Stock and sales figures update automatically

### Managing Invoices
1. Navigate to **Invoices** section
2. View all generated invoices
3. Update invoice status (Paid, Pending, Overdue)
4. Download as PDF with company branding
5. Search and filter invoices by number, client, or status

### Company Settings
1. Go to **Settings**
2. Add company name, email, phone numbers, and addresses
3. Upload company logo (used in PDF generation)
4. Information is stored in localStorage for PDF generation

## 🎨 UI Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme provider with system preference detection
- **Smooth Animations**: Framer Motion for transitions and interactions
- **Interactive Charts**: Recharts for data visualization
- **Loading States**: Spinner animations and skeleton screens
- **Toast Notifications**: Success and error feedback
- **Modal Dialogs**: Forms and confirmations
- **Dropdown Menus**: Quick actions and status changes

## 🔐 Security

- **Firebase Authentication**: Secure user management
- **Protected Routes**: Authentication-based access control
- **Data Validation**: Input validation on forms
- **Type Safety**: TypeScript for runtime safety
- **Secure Storage**: Company data stored in localStorage with careful handling

## 🔄 Key Workflows

### Order to Invoice Workflow
1. Create Order with line items
2. Select "Process" to convert to Invoice
3. System creates Invoice with same details
4. Updates Order.invoiceId reference
5. Decreases product stock
6. Increments product sales count
7. Order status → "Completed"
8. Invoice ready for download/payment tracking

### PDF Invoice Generation
1. Click download on invoice
2. Loads company profile from localStorage
3. Fetches product references from Firestore
4. Generates professional PDF with:
   - Company header with logo and details
   - Invoice details and billing information
   - Item table with descriptions, quantities, and prices
   - Tax and total calculations
   - Footer with thank you message


## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify Firebase credentials in `lib/firebaseClient.ts`
- Check Firebase project security rules
- Ensure Firestore collections exist

### PDF Generation Issues
- Verify company logo URL is accessible
- Check localStorage for company profile data
- Ensure product references are stored correctly

### Authentication Issues
- Clear browser cache and localStorage
- Verify Firebase Authentication is enabled
- Check email/password format
```


## 📄 License

This project is proprietary software owned by MMKR Solutions.

## 🎯 Future Enhancements

- [ ] Email invoices directly to clients
- [ ] Advanced reporting and analytics
- [ ] Inventory forecasting
- [ ] Mobile application
- [ ] Automated backup system
---

**Built with ❤️ by MMKR Solutions**