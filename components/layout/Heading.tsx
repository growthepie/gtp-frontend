const Heading = ({ children, className = "text-5xl", ...props }) => {
  return (
    <h1
      className={`font-bold text-pie-400 text-2xl md:text-3xl lg:text-4xl xl:text-5xl ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
};

export default Heading;
