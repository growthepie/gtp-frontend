"use client";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  return (
    <>
      <h1>Chain: {params.chain}</h1>
    </>
  );
};

export default Chain;
