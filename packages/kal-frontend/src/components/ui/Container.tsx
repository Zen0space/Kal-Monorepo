interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Container({
  children,
  className = "",
  size = "lg",
}: ContainerProps) {
  const sizes = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
  };

  return (
    <div className={`mx-auto px-6 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}
