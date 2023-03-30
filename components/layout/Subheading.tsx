const Subheading = ({ children, className = "text-lg", ...props }) => {
  return (
    <h2 className={className} {...props}>
      {children}
    </h2>
  );
};

export default Subheading;
