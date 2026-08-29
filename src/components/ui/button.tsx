import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { clsx, type ClassValue } from "clsx"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    // Variant styles
    const variants = {
      default: "bg-pink-500 text-white hover:bg-pink-600 shadow-md",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-white/10 hover:text-white",
      glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
    }
    
    // Size styles
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8 text-base",
      icon: "h-10 w-10",
    }

    return (
      <Comp
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
