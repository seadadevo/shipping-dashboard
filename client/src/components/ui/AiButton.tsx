import { NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";

const AiButton = () => {
  return (
    <NavLink
      to="/ai-mode"
      className="group relative flex items-center justify-center rounded-full p-[2px] transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
      style={
        {
          // Default: Transparent or subtle border
          // We use the p-[2px] as the 'border width' container
        }
      }
    >
      {/* 1. Spinning Gradient Background (Visible on Hover) */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
        <div
          className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] group-hover:bg-[conic-gradient(from_0deg,#ea4335_0deg,#fbbc04_72deg,#34a853_144deg,#4285f4_216deg,#ea4335_360deg)] animate-spin-slow origin-center"
          style={{ animationDuration: "3s" }}
        />
      </div>

      {/* 2. Static Border (Visible when NOT hovering, optional) */}
      <div className="absolute inset-0 rounded-full border border-border group-hover:border-transparent transition-colors duration-300" />

      {/* 3. Button Content (Overlay) */}
      <div className="relative flex items-center gap-2 rounded-full bg-card px-5 py-2 transition-all duration-300 backface-hidden z-10 group-hover:bg-background">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
          {/* Red Dot Notification (as seen in image) */}
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>

        <span className="text-sm font-medium text-foreground">AI Mode</span>
      </div>
    </NavLink>
  );
};

export default AiButton;
