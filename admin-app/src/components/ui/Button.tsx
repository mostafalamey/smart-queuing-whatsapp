/**
 * Button Component
 * 
 * Following Design Language specifications:
 * - Height: 40px (primary, secondary), 32px (small)
 * - Padding: 16px 24px (primary), 8px 16px (small)
 * - Border Radius: 8px (primary), 6px (small)
 * - Fast transitions: 150ms
 * - WCAG AA compliant contrast ratios
 */

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
  secondary:
    "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-dark active:border-primary-dark disabled:opacity-50 disabled:cursor-not-allowed",
  outline:
    "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed",
  destructive:
    "bg-error text-white hover:bg-error-600 active:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
};

const sizeStyles = {
  sm: "h-8 px-4 text-sm rounded-md",
  md: "h-10 px-6 text-sm rounded-lg",
  lg: "h-12 px-8 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
