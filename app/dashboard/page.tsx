"use client"
import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { motion, animate } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, FileText, Package, DollarSign } from "lucide-react"
import { hoverCard, hoverTransition } from "@/lib/motion"
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

const revenueData = [
  { name: "Jan", revenue: 13000 },
  { name: "Feb", revenue: 15000 },
  { name: "Mar", revenue: 18000 },
  { name: "Apr", revenue: 17000 },
  { name: "May", revenue: 20000 },
  { name: "Jun", revenue: 23000 },
]

const invoiceData = [
  { name: "Paid", value: 68 },
  { name: "Pending", value: 22 },
  { name: "Overdue", value: 10 },
]

const monthlyData = [
  { month: "Jan", sales: 45, purchases: 30 },
  { month: "Feb", sales: 52, purchases: 35 },
  { month: "Mar", sales: 61, purchases: 42 },
  { month: "Apr", sales: 58, purchases: 38 },
  { month: "May", sales: 70, purchases: 45 },
  { month: "Jun", sales: 78, purchases: 50 },
]

const COLORS = ["#3c3cecff", "#fbbf24", "#c55959ff"]

const defaultStatsData = [
  { 
    title: "Total Revenue", 
    value: "0 Dt", 
    subtitle: "+0% from last month", 
    icon: DollarSign,
    color: "text-green-600",
    trend: "up"
  },
  { 
    title: "Total Clients", 
    value: "0", 
    subtitle: "+0 new this month", 
    icon: Users,
    color: "text-blue-600",
    trend: "up"
  },
  { 
    title: "Total Invoices", 
    value: "0", 
    subtitle: "+0 this month", 
    icon: FileText,
    color: "text-purple-600",
    trend: "up"
  },
  { 
    title: "Products", 
    value: "0", 
    subtitle: "-0 from last month", 
    icon: Package,
    color: "text-orange-600",
    trend: "down"
  },
]

function AnimatedCounter({ 
  value, 
  duration = 2 
}: { 
  value: string | number
  duration?: number 
}) {
  const displayRef = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    const isMonetary = typeof value === 'string' && value.includes('Dt')
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) 
      : value
    
    const controls = animate(0, numericValue, {
      duration,
      ease: "easeOut",
      onUpdate(latest) {
        const formatted = isMonetary ? latest.toFixed(2) : Math.floor(latest).toLocaleString()
        const displayValue = isMonetary ? `${formatted} Dt` : formatted
        
        
        if (displayRef.current) {
          displayRef.current.textContent = displayValue
        }
      }
    })
    
    return () => controls.stop()
  }, [value, duration])
  
  return <span ref={displayRef}>0</span>
}


function StatsCard({ card, index }: { card: typeof defaultStatsData[0], index: number }) {
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
            {card.title}
          </CardTitle>
          <motion.div
            whileHover={{ 
              rotate: 360,
              transition: { duration: 0.4, ease: "easeInOut" }
            }}
          >
            <card.icon className={`h-10 w-10 ${card.color}`} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <AnimatedCounter value={card.value} duration={2} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {card.trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            {card.subtitle}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Revenue Chart Component
function RevenueChart() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.01,
        y: -4,
        transition: { 
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1]
        }
      }}
    >
      <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <motion.div
              whileHover={{ 
                scale: 1.2,
                rotate: 15,
                transition: { duration: 0.4 }
              }}
            >
              <TrendingUp className="w-10 h-10 text-green-500" />
            </motion.div>
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="#888888"
                tick={{ fill: '#888888' }}
              />
              <YAxis 
                stroke="#888888"
                tick={{ fill: '#888888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                fill="url(#colorRevenue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}


function InvoiceStatusChart() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.01,
        y: -4,
        transition: { 
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1]
        }
      }}
    >
      <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <motion.div
              whileHover={{ 
                scale: 1.2,
                rotate: -15,
                transition: { duration: 0.4 }
              }}
            >
              <FileText className="w-10 h-10 text-blue-500" />
            </motion.div>
            Invoice Status
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={invoiceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props) => {
                  const name = props.name || '';
                  const percent = props.percent || 0;
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }}
                labelLine={{ stroke: '#888888', strokeWidth: 1 }}
              >
                {invoiceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}


function SalesVsPurchasesChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.6,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.005,
        y: -4,
        transition: { 
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1]
        }
      }}
    >
      <Card className="transition-shadow duration-300 ease-out hover:shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <motion.div
              whileHover={{ 
                scale: 1.2,
                rotate: 15,
                transition: { duration: 0.3 }
              }}
            >
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </motion.div>
            Sales vs Purchases
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis 
                dataKey="month" 
                stroke="#888888"
                tick={{ fill: '#888888' }}
              />
              <YAxis 
                stroke="#888888"
                tick={{ fill: '#888888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="purchases" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}


function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="mb-8"
    >
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Dashboard Overview
      </h1>
      <p className="text-muted-foreground">
        Welcome back! Here&apos;s what&apos;s happening with your business today.
      </p>
    </motion.div>
  )
}

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated Logo/Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative w-16 h-16"
        >
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-primary border-t-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Loading Dashboard
          </h2>
        </motion.div>

        {/* Progress Bar */}
        <motion.div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/50"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}


export default function DashboardPage() {
  // ========== STATE MANAGEMENT ==========
  
  // Dashboard statistics data (revenue, clients, invoices, products)
  const [statsData, setStatsData] = useState(defaultStatsData);
  const [loading, setLoading] = useState(() => {
    // Only show loading on first mount (after login)
    if (typeof window !== 'undefined') {
      const hasLoadedBefore = sessionStorage.getItem('dashboardLoaded');
      return !hasLoadedBefore;
    }
    return false;
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch clients
        const clientsCollection = collection(db, 'clients');
        const clientsSnapshot = await getDocs(clientsCollection);
        const clientsCount = clientsSnapshot.size;

        // Fetch invoices
        const invoicesCollection = collection(db, 'invoices');
        const invoicesSnapshot = await getDocs(invoicesCollection);
        const invoicesCount = invoicesSnapshot.size;
        
        // Calculate total revenue from PAID invoices only
        let totalRevenue = 0;
        invoicesSnapshot.docs.forEach(doc => {
          const invoice = doc.data();
          if (invoice.status === 'Paid') {
            totalRevenue += invoice.totalAmount || 0;
          }
        });

        // Fetch products
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsCount = productsSnapshot.size;

        // Update stats data with real values
        setStatsData([
          { 
            title: "Total Revenue", 
            value: `${totalRevenue.toFixed(2)} Dt`, 
            subtitle: "+12.5% from last month", 
            icon: DollarSign,
            color: "text-green-600",
            trend: "up"
          },
          { 
            title: "Total Clients", 
            value: clientsCount.toString(), 
            subtitle: "+8 new this month", 
            icon: Users,
            color: "text-blue-600",
            trend: "up"
          },
          { 
            title: "Total Invoices", 
            value: invoicesCount.toString(), 
            subtitle: "+23 this month", 
            icon: FileText,
            color: "text-purple-600",
            trend: "up"
          },
          { 
            title: "Products", 
            value: productsCount.toString(), 
            subtitle: "-2 from last month", 
            icon: Package,
            color: "text-orange-600",
            trend: "down"
          },
        ]);
        
        // Mark dashboard as loaded
        sessionStorage.setItem('dashboardLoaded', 'true');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStatsData(defaultStatsData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <DashboardHeader />
      
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((card, index) => (
          <StatsCard key={card.title} card={card} index={index} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart />
        <InvoiceStatusChart />
      </div>

      {/* Charts Row 2 */}
      <SalesVsPurchasesChart />
    </>
  )
}