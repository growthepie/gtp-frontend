const Heading = ({ children, className = "text-5xl", as = "h2", ...props }) => {
  if (as === "h1") {
    return (
      <h1 className={`font-bold ${className}`} {...props}>
        {children}
      </h1>
    );
  }

  return (
    <h2 className={`font-bold ${className}`} {...props}>
      {children}
    </h2>
  );
};

export default Heading;
