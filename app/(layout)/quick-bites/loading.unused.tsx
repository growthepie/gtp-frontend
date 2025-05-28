// File: app/(layout)/quick-bites/loading.tsx
import { PageContainer, Section } from "@/components/layout/Container";

export default function Loading() {
  return (
    <PageContainer>
      <Section className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div 
              key={index}
              className="h-64 bg-forest-200 dark:bg-forest-700 rounded-[15px]"
            />
          ))}
        </div>
      </Section>
    </PageContainer>
  );
}