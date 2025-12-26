import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-sm shadow-primary/20",
        secondary:
          "border-transparent bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80 dark:from-slate-700 dark:to-slate-700/90 dark:text-slate-200",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground hover:from-destructive/90 hover:to-red-600/90 shadow-sm shadow-red-200/30",
        success:
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-500/90 hover:to-emerald-500/90 shadow-sm shadow-green-200/30",
        info:
          "border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-500/90 hover:to-cyan-500/90 shadow-sm shadow-blue-200/30",
        warning:
          "border-transparent bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-500/90 hover:to-amber-500/90 shadow-sm shadow-yellow-200/30",
        outline: "text-foreground border-border/50",
        premium:
          "border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-sm shadow-purple-200/30",
        custom: "border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }