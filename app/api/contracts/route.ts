import Airtable from "airtable";

// //connect to table
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  "appZWDvjvDmVnOici",
);

type ContractSubmission = {
  address: string;
  origin_key: string;
  sub_category_key: string;
  project_name: string;
  contract_name: string;
  twitter_handle: string;
  source: string;
};

// //send data
function sendRow(dataToInsert: ContractSubmission) {
  return base("tblU8WV0sxYUz6Kcp").create(
    [
      {
        fields: dataToInsert,
      },
    ],
    function (err, records) {
      if (err) {
        console.error(err);
        return err;
      }
      return records;
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  const formData: any = await request.formData();
  const body: any = Object.fromEntries(formData);

  const submission: ContractSubmission = {
    address: body.address,
    project_name: body.project_name,
    contract_name: body.name,
    sub_category_key: body.sub_category_key,
    origin_key: body.chain,
    source: body.source,
    twitter_handle: body.twitter_handle,
  };

  const result = await sendRow(submission);

  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}
