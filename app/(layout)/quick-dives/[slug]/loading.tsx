// File: app/(layout)/quick-dives/[slug]/loading.tsx
import { PageContainer } from "@/components/layout/Container";

export default function Loading() {
  return (
    <PageContainer className="py-8">
      <div className="bg-forest-50 dark:bg-[#1F2726] rounded-[15px] overflow-hidden animate-pulse">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Content section loading */}
            <div className="flex-1">
              {[1, 2, 3].map((_, index) => (
                <div 
                  key={index} 
                  className="h-4 bg-forest-200 dark:bg-forest-700 rounded mb-4 w-full"
                  style={{ width: `${Math.random() * 30 + 70}%` }}
                />
              ))}
            </div>
            
            {/* Image section loading */}
            <div className="w-full md:w-[40%] min-h-[300px] relative">
              <div className="w-full h-full min-h-[300px] relative rounded-lg overflow-hidden bg-forest-200 dark:bg-forest-700" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Related quick dives loading */}
      <div className="mt-10">
        <div className="h-8 bg-forest-200 dark:bg-forest-700 rounded mb-6 w-64" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, index) => (
            <div 
              key={index}
              className="h-64 bg-forest-200 dark:bg-forest-700 rounded-[15px]"
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}