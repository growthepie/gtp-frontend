import Link from "next/link";

type DescriptionProps = {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "div";
};
export const Description = ({ children, className, as = "div", ...props }: DescriptionProps) => {
  if (as === "p") {
    return (
      <p className={`text-[14px] leading-[150%] ${className}`} {...props}>
        {children}
      </p>
    );
  }

  return (
    <div className={`text-[14px] leading-[150%] ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * @param text
 * @description This function takes a string of text and returns a JSX element with links for any words that end with .com
 */
export const textToLinkedText = (text: string) => {
  // find words with .com using regex but don't include puntuation at the end of the word
  const wordsWithCom: string[] = text.match(/\b\S+\.com\b/g) || [];

  // go through each of the wordsWithCom and create a Link component for them
  const linkedText: JSX.Element[] = wordsWithCom.map((word) => {
    return (
      <Link
        href={`https://${word}`}
        key={word}
        target="_blank"
        className="underline"
      >
        {word}
      </Link>
    );
  });

  if (linkedText.length === 0) {
    return text;
  }

  // inject the words back into the text
  let result: (string | JSX.Element)[] = [];
  let textParts: string[] = text.split(/(\S+\.com)\b/g);
  for (let i = 0; i < textParts.length; i++) {
    if (!textParts[i]) continue;
    if (wordsWithCom.includes(textParts[i])) {
      let linkIndex = wordsWithCom.indexOf(textParts[i]);
      result.push(linkedText[linkIndex]);
    } else {
      result.push(textParts[i]);
    }
  }
  return result;
};
