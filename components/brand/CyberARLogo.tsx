"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

interface CyberARLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function CyberARLogo({
  className,
  width = 180,
  height = 60,
  priority,
}: CyberARLogoProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "inline-block",
        theme === "dark" && "rounded-lg bg-white px-2 py-1.5"
      )}
    >
      <Image
        src="/logo-cyberar.png"
        alt="CYBER.AR — I Congreso de Ciberdefensa Argentina 2026"
        width={width}
        height={height}
        className={cn("h-auto", className)}
        priority={priority}
      />
    </div>
  );
}
