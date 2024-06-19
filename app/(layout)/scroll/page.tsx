import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";

export default function ScrollPage() {
  return (
    <>
      <HorizontalScrollContainer>
        <div className="flex gap-x-4">
          {new Array(200).fill(0).map((_, i) => (
            <div key={i} className="">a</div>
          ))}
        </div>
      </HorizontalScrollContainer>
      <VerticalScrollContainer height={200}>
        <div className="flex flex-col gap-x-4">
          {new Array(200).fill(0).map((_, i) => (
            <div key={i} className="">a</div>
          ))}
        </div>
      </VerticalScrollContainer>
    </>
  );
}