import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({
  className = "",
  size = "md",
  showText = true,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-xl text-xs",
    md: "w-10 h-10 rounded-2xl text-sm",
    lg: "w-12 h-12 rounded-2xl text-base",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-base font-bold",
    md: "text-xl font-extrabold",
    lg: "text-2xl font-black",
  };

  const content = (
    <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* JobBuddy AI Logo Badge */}
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-[#57cc99] via-[#46b887] to-[#80ed99] flex items-center justify-center font-black text-[#0f0f12] shadow-lg shadow-[#57cc99]/25 group-hover:scale-105 group-hover:shadow-[#57cc99]/40 transition-all duration-300 relative overflow-hidden shrink-0`}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex items-center justify-center">
          <Bot className={`${iconSizes[size]} text-[#0f0f12] stroke-[2.5]`} />
          <Sparkles className="w-2.5 h-2.5 text-[#0f0f12] absolute -top-0.5 -right-0.5 fill-[#0f0f12]" />
        </div>
      </div>

      {showText && (
        <span
          className={`${textSizes[size]} text-white tracking-tight group-hover:text-[#57cc99] transition-colors whitespace-nowrap`}
        >
          JobBuddy <span className="text-[#57cc99]">AI</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label="JobBuddy AI Home">
        {content}
      </Link>
    );
  }

  return content;
}
