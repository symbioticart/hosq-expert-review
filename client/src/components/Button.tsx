import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "../lib/util";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLS: Record<Variant, string> = {
  primary:
    "bg-ink text-cream hover:bg-coral disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed",
  secondary:
    "bg-white border border-hairline text-ink hover:border-coral hover:text-coral disabled:border-hairline disabled:text-muted disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-ink hover:text-coral disabled:text-muted disabled:cursor-not-allowed",
  danger:
    "bg-coral text-white hover:bg-coral/90 disabled:bg-hairline disabled:text-muted disabled:cursor-not-allowed",
};

const SIZE_CLS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANT_CLS[variant], SIZE_CLS[size], fullWidth && "w-full", className)}
      {...rest}
    />
  );
});

type LinkButtonProps = CommonProps & LinkProps;

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={cn(BASE, VARIANT_CLS[variant], SIZE_CLS[size], fullWidth && "w-full", className)}
      {...rest}
    />
  );
}
