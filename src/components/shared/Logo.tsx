import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'glow' | 'strong-glow';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'glow',
  className = ''
}) => {
  const sizeClasses = {
    sm: { logo: 'w-7 h-7', text: 'text-base' },
    md: { logo: 'w-9 h-9', text: 'text-2xl' },
    lg: { logo: 'w-14 h-14', text: 'text-3xl' },
    xl: { logo: 'w-20 h-20', text: 'text-4xl' }
  };

  const variantStyles = {
    default: {
      shadow: ''
    },
    glow: {
      shadow: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.4)] drop-shadow-[0_0_40px_rgba(34,197,94,0.2)]'
    },
    'strong-glow': {
      shadow: 'drop-shadow-[0_0_30px_rgba(34,197,94,0.6)] drop-shadow-[0_0_60px_rgba(34,197,94,0.3)] drop-shadow-[0_0_90px_rgba(34,197,94,0.15)]'
    }
  };

  const sizes = sizeClasses[size];
  const style = variantStyles[variant];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Image */}
      <img
        src="/512x512x2.png"
        alt="Vlottr Logo"
        className={`
          ${sizes.logo}
          ${style.shadow}
          rounded-lg
          transition-all duration-300 hover:scale-110
        `}
        style={{
          filter: variant !== 'default' ? 'brightness(1.1)' : undefined
        }}
      />

      {/* Logo Text */}
      {showText && (
        <div>
          <span
            className={`${sizes.text} font-bold tracking-tight text-white`}
            style={{
              textShadow: variant !== 'default'
                ? '0 0 20px rgba(34,197,94,0.3), 0 2px 4px rgba(0,0,0,0.5)'
                : '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Vlottr
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
