import Container from "@/components/layout/Container";
import ActivityHeatmapPanel from "@/components/layout/ActivityHeatmap/ActivityHeatmapPanel";

const TestHeatmapPage = () => {
  return (
    <Container className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[20px] mb-[20px]" isPageRoot>
      <ActivityHeatmapPanel />
    </Container>
  );
};

export default TestHeatmapPage;
