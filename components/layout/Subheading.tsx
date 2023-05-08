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
        <h2 className={className} {...props}>
          {children}
        </h2>
        {rightIcon && rightIcon}
      </div>
    );
  }

  return (
    <h2 className={className} {...props}>
      {children}
    </h2>
  );
};

export default Subheading;
