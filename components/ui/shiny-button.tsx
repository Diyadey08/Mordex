import React from 'react';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className = '', variant = 'primary', ...props }, ref) => {
    const baseClasses = 
      "group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition-all duration-500 ease-in-out rounded-xl shadow-lg transform hover:scale-105 active:scale-95";
    
    const variantClasses = variant === 'primary'
      ? "bg-gradient-to-r from-black via-zinc-900 to-black hover:from-zinc-900 hover:via-black hover:to-zinc-900 shadow-white/10 hover:shadow-white/20 border border-white/20 hover:border-white/40"
      : "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-500 shadow-blue-500/25 hover:shadow-blue-500/40";
    
    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100";
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
        {...props}
      >
        {/* Primary shiny overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
        
        {/* Secondary shine layer for extra flashiness */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent transform skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000 ease-in-out delay-200" />
        
        {/* Animated background pulse with color */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-cyan-400/10 to-purple-500/0 animate-pulse" />
        
        {/* Magic sparkle effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-ping" />
          <div className="absolute bottom-3 right-6 w-1 h-1 bg-cyan-400 rounded-full animate-ping animation-delay-300" />
          <div className="absolute top-1/2 right-4 w-0.5 h-0.5 bg-purple-400 rounded-full animate-ping animation-delay-500" />
        </div>
        
        {/* Content */}
        <span className="relative z-10 font-semibold tracking-wide text-white group-hover:text-cyan-100 transition-colors duration-300">
          {children}
        </span>
        
        {/* Add custom styles for animation delays */}
        <style jsx>{`
          .animation-delay-300 {
            animation-delay: 300ms;
          }
          .animation-delay-500 {
            animation-delay: 500ms;
          }
        `}</style>
      </button>
    );
  }
);

ShinyButton.displayName = "ShinyButton";

export { ShinyButton };