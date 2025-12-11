import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "transform transition-all active:scale-95 font-bold rounded-2xl px-6 py-3 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-400 text-white border-b-4 border-blue-700", // Judy Hopps
    secondary: "bg-green-500 hover:bg-green-400 text-white border-b-4 border-green-700", // Jungle
    accent: "bg-orange-500 hover:bg-orange-400 text-white border-b-4 border-orange-700", // Nick Wilde
    danger: "bg-red-500 hover:bg-red-400 text-white border-b-4 border-red-700"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </button>
  );
};
