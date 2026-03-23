import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>;

const variants = {
  primary:
    "bg-[#0e639c] text-[#ffffff] hover:bg-[#1177bb]",
  secondary:
    "text-[#cccccc] hover:bg-[#2a2d2e]",
  ghost:
    "text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]",
  danger:
    "text-[#f48771] hover:bg-[#5a1d1d]"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[3px] px-2 py-1 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
