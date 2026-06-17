import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

  const variants = {
    primary: "bg-ink text-parchment hover:bg-ink/90",
    secondary: "bg-paper text-ink border border-line hover:border-ink/40",
    danger: "bg-rose text-white hover:bg-rose/90",
    ghost: "text-ink hover:bg-ink/5",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-sm border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-2 focus:outline-offset-1 focus:outline-brass transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium uppercase tracking-wide text-muted mb-1.5", className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-paper border border-line rounded-sm",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "bg-ink/5 text-ink",
    success: "bg-sage/10 text-sage",
    warning: "bg-brass/10 text-brass-dark",
    danger: "bg-rose/10 text-rose",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
