/**
 * Form Controls Components
 * 
 * Following Design Language specifications:
 * - Input Height: 40px
 * - Border Radius: 8px
 * - Focus State: 2px solid #2563EB
 * - WCAG AA compliant contrast
 */

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Label Component
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium text-gray-900 mb-2",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-1" aria-label="required">*</span>}
      </label>
    );
  }
);
Label.displayName = "Label";

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={cn(
            // Base styles
            "w-full h-10 px-4 rounded-lg border bg-white text-gray-900 text-sm",
            "placeholder:text-gray-500",
            // Focus state
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
            // Transitions
            "transition-all duration-150",
            // Error state
            error
              ? "border-error focus:ring-error"
              : "border-gray-300 hover:border-gray-400",
            // Disabled state
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              "mt-2 text-xs",
              error ? "text-error" : "text-gray-500"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Select Component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={cn(
            // Base styles
            "w-full h-10 px-4 rounded-lg border bg-white text-gray-900 text-sm",
            "appearance-none",
            "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[right_12px_center]",
            // Focus state
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
            // Transitions
            "transition-all duration-150",
            // Error state
            error
              ? "border-error focus:ring-error"
              : "border-gray-300 hover:border-gray-400",
            // Disabled state
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {helperText && (
          <p
            className={cn(
              "mt-2 text-xs",
              error ? "text-error" : "text-gray-500"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            // Base styles
            "w-full px-4 py-3 rounded-lg border bg-white text-gray-900 text-sm min-h-[100px]",
            "placeholder:text-gray-500",
            "resize-vertical",
            // Focus state
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
            // Transitions
            "transition-all duration-150",
            // Error state
            error
              ? "border-error focus:ring-error"
              : "border-gray-300 hover:border-gray-400",
            // Disabled state
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              "mt-2 text-xs",
              error ? "text-error" : "text-gray-500"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Checkbox Component
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={cn(
            "w-5 h-5 rounded border-gray-300 text-primary",
            "focus:ring-2 focus:ring-primary focus:ring-offset-0",
            "transition-all duration-150",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="ml-3 text-sm text-gray-900 select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

// Radio Component
interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center">
        <input
          type="radio"
          id={radioId}
          ref={ref}
          className={cn(
            "w-5 h-5 border-gray-300 text-primary",
            "focus:ring-2 focus:ring-primary focus:ring-offset-0",
            "transition-all duration-150",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className="ml-3 text-sm text-gray-900 select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";

// FormGroup Component
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}
