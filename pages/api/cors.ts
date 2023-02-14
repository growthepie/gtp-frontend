// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<any>,
) {
	// Endpoint to get around CORS
	const url = req.query.url as string;
	fetch(url)
		.then((response) => {
			// replace NaN with null before parsing
			const fixed = response
				.clone()
				.text()
				.then((text) => text.replace(/NaN/g, 'null'));
			return fixed.then((fixed) => JSON.parse(fixed));
		})
		.then((response) => response)
		.then((data) => {
			res.status(200).json(data);
		});
}
