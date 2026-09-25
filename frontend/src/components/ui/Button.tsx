import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white hover:bg-brand-bright active:bg-brand-dim shadow-subtle",
        secondary:
          "bg-base-surface2 text-text-primary border border-base-border hover:border-base-borderStrong hover:bg-[#1a1e26]",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-base-surface2",
        danger:
          "bg-status-failed/90 text-white hover:bg-status-failed",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
