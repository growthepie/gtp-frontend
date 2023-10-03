const Subheading = ({
  children,
  className = "",
  leftIcon,
  rightIcon,
  iconContainerClassName = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconContainerClassName?: string;
  props?: any;
}) => {
  if (leftIcon || rightIcon) {
    return (
      <div className={`flex ${iconContainerClassName}`}>
        {leftIcon && leftIcon}
        <div className={className} {...props}>
          {children}
        </div>
        {rightIcon && rightIcon}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export default Subheading;
