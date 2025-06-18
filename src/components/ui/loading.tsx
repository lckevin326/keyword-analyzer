import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent",
            sizeClasses[size]
          )}
        >
          <span className="sr-only">加载中...</span>
        </div>
      </div>
    )
  }
)
Loading.displayName = "Loading"

export { Loading }