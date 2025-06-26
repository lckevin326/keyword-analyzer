import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  text?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = 'md', variant = 'spinner', text, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6', 
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    }

    const textSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    }

    if (variant === 'skeleton') {
      return (
        <div
          ref={ref}
          className={cn("animate-pulse bg-muted rounded", className)}
          {...props}
        />
      )
    }

    if (variant === 'dots') {
      const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' || size === 'xl' ? 'w-3 h-3' : 'w-2.5 h-2.5'
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center space-x-1", className)}
          {...props}
        >
          <div className={cn("bg-primary rounded-full animate-bounce", dotSize)}></div>
          <div className={cn("bg-primary rounded-full animate-bounce [animation-delay:150ms]", dotSize)}></div>
          <div className={cn("bg-primary rounded-full animate-bounce [animation-delay:300ms]", dotSize)}></div>
          {text && (
            <span className={cn("ml-3 text-muted-foreground", textSizeClasses[size])}>
              {text}
            </span>
          )}
        </div>
      )
    }

    if (variant === 'pulse') {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center", className)}
          {...props}
        >
          <div className={cn("bg-primary rounded-full animate-pulse", sizeClasses[size])}>
            <span className="sr-only">{text || '加载中...'}</span>
          </div>
          {text && (
            <span className={cn("ml-3 text-muted-foreground animate-pulse", textSizeClasses[size])}>
              {text}
            </span>
          )}
        </div>
      )
    }

    // Default spinner variant
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-3 border-primary border-t-transparent drop-shadow-sm",
            sizeClasses[size]
          )}
        >
          <span className="sr-only">{text || '加载中...'}</span>
        </div>
        {text && (
          <span className={cn("ml-3 text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }
)
Loading.displayName = "Loading"

// 页面级Loading组件
const PageLoading = React.forwardRef<HTMLDivElement, { text?: string }>(
  ({ text = "加载中...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className="min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50"
        {...props}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin drop-shadow-sm"></div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm font-medium">{text}</p>
      </div>
    )
  }
)
PageLoading.displayName = "PageLoading"

// 卡片Loading组件
const CardLoading = React.forwardRef<HTMLDivElement, { rows?: number }>(
  ({ rows = 3, ...props }, ref) => {
    return (
      <div ref={ref} className="space-y-4 p-4" {...props}>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse"></div>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-3 bg-muted rounded animate-pulse"
              style={{ width: `${80 - i * 10}%` }}
            ></div>
          ))}
        </div>
      </div>
    )
  }
)
CardLoading.displayName = "CardLoading"

export { Loading, PageLoading, CardLoading }