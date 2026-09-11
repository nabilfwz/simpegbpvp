import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#003399] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-[#003399] text-white shadow-md hover:bg-[#002266] border border-[#002266]",
        destructive:
          "bg-rose-700 text-white shadow-md hover:bg-rose-800 border border-rose-900",
        outline:
          "border-2 border-slate-300 bg-white text-slate-800 shadow-xs hover:bg-slate-100 hover:border-slate-400 hover:text-slate-950",
        secondary:
          "bg-slate-800 text-white shadow-sm hover:bg-slate-900 border border-slate-900",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold",
        link:
          "text-[#003399] underline-offset-4 hover:underline font-bold",
        success:
          "bg-emerald-700 text-white shadow-md hover:bg-emerald-800 border border-emerald-900",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
