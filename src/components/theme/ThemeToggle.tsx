"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({
  variant = "default",
  className = "",
}: {
  /** Use "inverted" on dark navy brand surfaces (landing page nav, login/signup). */
  variant?: "default" | "inverted";
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const base =
    "inline-flex items-center justify-center rounded-lg p-2 transition-colors";
  const styles =
    variant === "inverted"
      ? "text-white/70 hover:text-white hover:bg-white/10"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white";

  return (
    <button
      type='button'
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${base} ${styles} ${className}`}
    >
      {isDark ? <Sun className='w-[18px] h-[18px]' /> : <Moon className='w-[18px] h-[18px]' />}
    </button>
  );
}
