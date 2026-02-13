import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
