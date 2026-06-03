import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "portail-dashboard-dark";

type ThemeContextValue = {
  isDark: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDarkState] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, isDark ? "1" : "0");
    } catch {
      /* ignore quota / private mode */
    }
  }, [isDark]);

  const setDarkMode = useCallback((dark: boolean) => {
    setIsDarkState(dark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkState((d) => !d);
  }, []);

  const value = useMemo(
    () => ({ isDark, setDarkMode, toggleDarkMode }),
    [isDark, setDarkMode, toggleDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
