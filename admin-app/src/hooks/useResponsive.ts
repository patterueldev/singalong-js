import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

interface ResponsiveInfo {
  isDesktop: boolean;
  isMobile: boolean;
  width: number;
  height: number;
}

const BREAKPOINT = 768;

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return {
    isDesktop: dimensions.width >= BREAKPOINT,
    isMobile: dimensions.width < BREAKPOINT,
    width: dimensions.width,
    height: dimensions.height,
  };
}
