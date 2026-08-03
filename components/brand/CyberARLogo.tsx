import Image from "next/image";
import { cn } from "@/lib/utils";

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
  return (
    <Image
      src="/logo-cyberar.png"
      alt="CYBER.AR"
      width={width}
      height={height}
      className={cn("h-auto", className)}
      priority={priority}
    />
  );
}
