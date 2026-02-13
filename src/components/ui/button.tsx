import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/15 hover:shadow-lg hover:shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 border-0",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-600/15 hover:shadow-lg hover:shadow-red-600/25 hover:from-red-600 hover:to-rose-700 border-0",
        outline:
          "border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 text-slate-700",
        secondary:
          "bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 shadow-sm border border-slate-200/60",
        ghost:
          "hover:bg-slate-100/80 hover:text-slate-900 text-slate-600",
        link:
          "text-blue-600 underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
