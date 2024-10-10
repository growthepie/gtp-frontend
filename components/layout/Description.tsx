const Description = ({ children, className = "text-5xl", as = "h2", ...props }) => {
  if (as === "p") {
    return (
      <p className={`text-[14px] pb-[30px] leading-[150%] ${className}`} {...props}>
        {children}
      </p>
    );
  }

  return (
    <div className={`text-[14px] pb-[30px] leading-[150%] ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Description;
