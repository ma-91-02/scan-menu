import type { ReactNode } from "react";
import styles from "./Button.module.scss";

interface PrimaryButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  testId?: string;
  type?: "button" | "submit";
  wide?: boolean;
  onClick?: () => void;
}

export function PrimaryButton({
  children,
  className = "",
  href,
  testId,
  type = "button",
  wide = false,
  onClick,
}: PrimaryButtonProps) {
  const classNames = [
    styles.button,
    styles.primary,
    wide ? styles.wide : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a className={classNames} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button
      className={classNames}
      data-testid={testId}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
