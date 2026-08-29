import type { ButtonHTMLAttributes } from "react";

type ButtonTone = "primary" | "neutral";

interface BoardOpsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
}

export function BoardOpsButton({
  className = "",
  tone = "neutral",
  type = "button",
  ...props
}: BoardOpsButtonProps) {
  return (
    <button
      className={`bo-button bo-button--${tone} ${className}`.trim()}
      type={type}
      {...props}
    />
  );
}
