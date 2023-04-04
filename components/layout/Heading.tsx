const Heading = ({ children, className = "text-5xl", ...props }) => {
  return (
    <h1 className={`font-medium text-forest-900 ${className}`} {...props}>
      {children}
    </h1>
  );
};

export default Heading;
