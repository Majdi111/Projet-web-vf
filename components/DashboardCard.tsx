
"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { hoverCard, hoverTransition } from "@/lib/motion"

/**
 * DashboardCard Component
 * Displays a metric card with title, value, and optional subtitle.
 * Includes hover animation effect.
 */
export default function DashboardCard({ title, value, subtitle }: { title: string, value: string, subtitle?: string }) {
  return (
    <motion.div
      whileHover={hoverCard}
      transition={hoverTransition}
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}
