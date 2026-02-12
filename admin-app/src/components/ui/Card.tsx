/**
 * Unified Card Component
 * 
 * Following the Design Language specifications:
 * - Background: #FFFFFF
 * - Border: 1px solid #E2E8F0
 * - Border Radius: 12px
 * - Shadow: 0 1px 3px rgba(0,0,0,0.1)
 * - Padding: 24px
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  interactive?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const paddingVariants = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  padding = "md",
  hover = false,
  interactive = false,
}: CardProps) {
  return (
    <div
      className={cn(
        // Base styles per design specs
        "bg-white rounded-xl border border-gray-300 shadow-sm",
        // Padding
        paddingVariants[padding],
        // Interactive states
        hover && "transition-shadow duration-150 hover:shadow-md",
        interactive && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  action,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-4",
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  as: Component = "h3",
}: CardTitleProps) {
  const sizeClasses = {
    h1: "text-2xl font-semibold text-gray-900",
    h2: "text-xl font-semibold text-gray-900",
    h3: "text-base font-semibold text-gray-900",
    h4: "text-sm font-semibold text-gray-900",
  };

  return (
    <Component className={cn(sizeClasses[Component], className)}>
      {children}
    </Component>
  );
}

export function CardDescription({
  children,
  className,
}: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-gray-700 mt-1", className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-4 mt-4 border-t border-gray-300",
        className
      )}
    >
      {children}
    </div>
  );
}
