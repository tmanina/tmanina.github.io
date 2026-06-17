"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gold-500 text-gold-900 shadow-md hover:bg-gold-600 hover:shadow-lg hover:shadow-gold-500/30 hover:-translate-y-0.5",
        primary:
          "bg-gold-500 text-gold-900 shadow-md hover:bg-gold-600 hover:shadow-lg hover:shadow-gold-500/30 hover:-translate-y-0.5",
        secondary:
          "bg-sage-400 text-white shadow-md hover:bg-sage-500 hover:shadow-lg hover:shadow-sage-400/30 hover:-translate-y-0.5",
        accent:
          "bg-teal-600 text-white shadow-md hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/30 hover:-translate-y-0.5",
        destructive:
          "bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5",
        outline:
          "border-2 border-gold-500/30 text-gold-700 dark:text-gold-300 bg-transparent hover:bg-gold-500/10 hover:border-gold-500/60",
        ghost:
          "text-foreground hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-gold-600 dark:text-gold-400 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs rounded-lg",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
