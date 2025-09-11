type ContainerProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  isPageRoot?: boolean;
};

export default function Container({
  children,
  id,
  className = '',
  ref,
  style,
  isPageRoot = false,
}: ContainerProps) {

  if (isPageRoot) {
    return (
      <div
        id={id}
        className={`px-[20px] md:pl-[45px] md:pr-[60px] text-[#CDD8D3] ${className}`}
        ref={ref ?? null}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`px-[20px] md:pl-[45px] md:pr-[60px] text-[#CDD8D3] ${className}`}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}

type PageRootProps = {
  children: React.ReactNode;
  className?: string;
  gapSize?: "sm" | "md" | "lg";
  direction?: "row" | "column";
};

const gapSizeMap = {
  sm: "gap-y-[5px]",
  md: "gap-y-[15px]",
  lg: "gap-y-[30px]",
};

const directionMap = {
  row: "flex-row",
  column: "flex-col",
};


export const PageRoot = ({ children, className = '', gapSize = "md", direction = "column" }: PageRootProps) => {
  return (
    <div className={`flex ${directionMap[direction]} ${gapSizeMap[gapSize]} ${className}`}>
      {children}
    </div>
  );
}

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  gapSize?: "sm" | "md" | "lg";
  direction?: "row" | "column";
  paddingX?: "none" | "sm" | "md" | "lg";
  paddingY?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "p-0",
  sm: "p-[10px] md:p-[25px]",
  md: "p-[20px] md:p-[50px]",
  lg: "p-[30px] md:p-[75px]",
};

const paddingXMap = {
  none: "px-0",
  sm: "px-[10px] md:px-[25px]",
  md: "px-[20px] md:px-[50px]",
  lg: "px-[30px] md:px-[75px]",
};

const paddingYMap = {
  none: "py-0",
  sm: "py-[15px]",
  md: "py-[30px]",
  lg: "py-[45px]",
};


export const PageContainer = ({ children, className = '', gapSize = "md", direction = "column", paddingX = "md", paddingY = "sm", padding = "none" }: PageContainerProps) => {
  return (
    <div className={`flex ${directionMap[direction]} ${gapSizeMap[gapSize]} ${paddingMap[padding]} ${paddingXMap[paddingX]} ${paddingYMap[paddingY]} ${className}`}>
      {children}
    </div>
  );
}

export const Section = ({ children, className = '' }: ContainerProps) => {
  return (
    <section
      className="flex flex-col gap-y-[15px]"
    >
      {children}
    </section>
  )
}

// export const FirstContainer = ({ children, className = '' }: Props) => {
//   return (
//     <Container
//       className="gap-y-[15px]"
//       isPageRoot
//     >
//       {children}
//     </Container>
//   )
// }

// export const StandardContainer = ({ children, className = '' }: Props) => {
//   return (
//     <BaseContainer className={`px-[20px] md:px-[50px] ${className}`}>
//       {children}
//     </BaseContainer>
//   );
// }