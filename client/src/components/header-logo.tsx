// Logo dipakai di header/sidebar. Import dari assets agar path terbundle dan pasti jalan.
import logoSrc from "@/assets/Kingvyperslogo.jpg";

export const headerLogoSrc = logoSrc;

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClass = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
  xl: "h-16 w-16",
};

export function HeaderLogo({ className = "", size = "md" }: Props) {
  return (
    <img
      src={headerLogoSrc}
      alt="King Vypers"
      className={`rounded-full object-cover ${sizeClass[size]} ${className}`}
    />
  );
}
