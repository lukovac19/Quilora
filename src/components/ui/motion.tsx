import * as React from "react";

// Lightweight motion components using CSS transitions instead of motion library
// This avoids framer-motion dependency issues while maintaining smooth animations

interface MotionDivProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  viewport?: any;
  variants?: any;
}

export const motion = {
  div: React.forwardRef<HTMLDivElement, MotionDivProps>(
    ({ initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, variants, className, style, ...props }, ref) => {
      const [isHovered, setIsHovered] = React.useState(false);
      const [isTapped, setIsTapped] = React.useState(false);

      // Combine initial, animate states with CSS transitions
      const combinedStyle: React.CSSProperties = {
        ...style,
        transition: "all 0.3s ease-in-out",
        ...(isHovered && whileHover?.scale && { transform: `scale(${whileHover.scale})` }),
        ...(isTapped && whileTap?.scale && { transform: `scale(${whileTap.scale})` }),
      };

      return (
        <div
          ref={ref}
          className={className}
          style={combinedStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsTapped(true)}
          onMouseUp={() => setIsTapped(false)}
          {...props}
        />
      );
    }
  ),

  button: React.forwardRef<HTMLButtonElement, MotionDivProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, variants, className, style, ...props }, ref) => {
      const [isHovered, setIsHovered] = React.useState(false);
      const [isTapped, setIsTapped] = React.useState(false);

      const combinedStyle: React.CSSProperties = {
        ...style,
        transition: "all 0.3s ease-in-out",
        ...(isHovered && whileHover?.scale && { transform: `scale(${whileHover.scale})` }),
        ...(isTapped && whileTap?.scale && { transform: `scale(${whileTap.scale})` }),
      };

      return (
        <button
          ref={ref}
          className={className}
          style={combinedStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsTapped(true)}
          onMouseUp={() => setIsTapped(false)}
          {...props}
        />
      );
    }
  ),

  a: React.forwardRef<HTMLAnchorElement, MotionDivProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>(
    ({ initial, animate, exit, transition, whileHover, whileTap, whileInView, viewport, variants, className, style, ...props }, ref) => {
      const [isHovered, setIsHovered] = React.useState(false);

      const combinedStyle: React.CSSProperties = {
        ...style,
        transition: "all 0.3s ease-in-out",
        ...(isHovered && whileHover?.scale && { transform: `scale(${whileHover.scale})` }),
      };

      return (
        <a
          ref={ref}
          className={className}
          style={combinedStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...props}
        />
      );
    }
  ),
};