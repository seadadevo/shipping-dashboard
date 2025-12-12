import { NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const AiButton = () => {
  const { user } = useAuth();

  // RESTRICT ACCESS: Hide for drivers (couriers) or unauthenticated users
  if (!user || user.userType === "courier") {
    return null;
  }

  return (
    <NavLink
      to="/ai-mode"
      className="group relative flex items-center justify-center rounded-full transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95"
    >
      {/* 1. The Glowing Comet Beam (Always On) */}
      {/* Adjusted colors to match the image: Blue -> Red -> Yellow -> Green order */}
      <div className="absolute -inset-[1px] rounded-full opacity-100 overflow-hidden">
        <div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#4285F4_320deg,#EA4335_335deg,#FBBC04_350deg,#34A853_360deg)] animate-[spin_4s_linear_infinite]" />
      </div>

      {/* 2. Glow Blur Layer (Always On) */}
      <div className="absolute -inset-[1px] rounded-full opacity-60 blur-sm overflow-hidden">
        <div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#4285F4_320deg,#EA4335_335deg,#FBBC04_350deg,#34A853_360deg)] animate-[spin_4s_linear_infinite]" />
      </div>

      {/* 3. Static Track */}
      <div className="absolute inset-0 rounded-full border border-border/50 transition-colors duration-300" />

      {/* 4. Button Content */}
      <div className="relative flex items-center gap-2.5 rounded-full bg-card px-5 py-2.5 m-[1.5px] tracking-wide transition-all duration-300 backface-hidden z-10 hover:bg-background/95">
        {/* Icon Group */}
        <div className="relative flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary bg-clip-text" />
          {/* Notification Dot */}
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border-[1.5px] border-card animate-pulse shadow-sm" />
        </div>

        <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">
          المساعد الذكي
        </span>
      </div>
    </NavLink>
  );
};

export default AiButton;
