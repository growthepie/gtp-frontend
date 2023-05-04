const Heading = ({ children, className = "text-5xl", ...props }) => {
  return (
    <h1 className={`font-bold ${className}`} {...props}>
      {children}
    </h1>
  );
};

export default Heading;
