"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let prefersDark = false;
    try {
      const savedTheme = localStorage.getItem("theme");
      prefersDark =
        savedTheme === "dark" ||
        (savedTheme !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch {}

    document.documentElement.classList.toggle("dark", prefersDark);
    const frame = requestAnimationFrame(() => setDark(prefersDark));
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className="p-2 rounded-lg text-purple-200 hover:text-white hover:bg-purple-700/50 dark:hover:bg-purple-800/50 transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
