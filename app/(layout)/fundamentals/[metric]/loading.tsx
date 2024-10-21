import ShowLoading from "@/components/layout/ShowLoading";

export default async function Loading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <ShowLoading dataLoading={[true, true]} dataValidating={[true, true]} />
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Loading Fundamentals</h2>
        <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the data...</p>
      </div>
    </div>
  );
}
