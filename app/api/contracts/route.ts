const baseId = "appZWDvjvDmVnOici";
const table = "tblU8WV0sxYUz6Kcp";

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
async function sendRow(dataToInsert: ContractSubmission) {
  const url = `https://api.airtable.com/v0/${baseId}/${table}`;

  const body = {
    records: [
      {
        fields: dataToInsert,
      },
    ],
  };

  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => data);
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
