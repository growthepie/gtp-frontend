'use client';

import { Chart } from '@/components/charts/chart';
import { Input } from '@/components/Input';
import { useEffect, useState } from 'react';
import { quicktypeJSON } from '@/utils/quicktype';

export default function HomePage() {
	const [apiURL, setApiURL] = useState(
		// 'https://l2beat.com/api/scaling-tvl.json',
		'https://canvasjs.com/data/gallery/javascript/daily-sales-data.json',
	);

	const [apiResponse, setApiResponse] = useState<any>('');
	const [input, setInput] = useState<any>([]);

	useEffect(() => {
		setApiResponse({});
		// fetch and set apiResponse to data if there is no error and "ERROR" if there is an error
		fetch(apiURL)
			.then((response) => response.json())
			.then((data) => setApiResponse(data))
			.catch((error) => setApiResponse('ERROR'));
	}, [apiURL]);

	useEffect(() => {
		// quicktypeJSON('JSON Schema', 'L2Beat', JSON.stringify(apiResponse)).then(
		// 	(code) => {
		// 		console.log(code);
		// 	},
		// );
		console.log(apiResponse);
		// if (apiResponse.hourly && apiResponse.hourly.data) {
		// 	const data = apiResponse.hourly.data;
		// 	const input: [number, number][] = [];
		// 	for (let i = 0; i < data.length; i++) {
		// 		input.push([data[i][0], data[i][1]]);
		// 	}
		// 	setInput(input);
		// 	console.log(input);
		// 	// setInput(
		// 	// 	apiResponse.hourly.data.map((item: [number, number, number]) => [
		// 	// 		item[0],
		// 	// 		item[1],
		// 	// 	]),
		// 	// );
		// }
		if (apiResponse) {
			const input: [number, number][] = [];
			for (let i = 0; i < apiResponse.length; i++) {
				input.push([apiResponse[i].date, apiResponse[i].units]);
			}
			setInput(input);
		}
	}, [apiResponse]);

	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

	const getJSONRepresentation = (obj: any, path: string = '') => {
		if (obj === null) return <div className="text-gray-500">null</div>;
		return (
			<div className="flex flex-col gap-2">
				{Object.entries(obj).map(([key, value]) => (
					<div
						key={key}
						draggable
						className={`border border-gray-300 rounded-md p-2 inline-block ${
							value === 'object' ? '' : 'flex-row'
						}`}
						data-path={`${path}.${key}`}
					>
						{/* if value is array, make expandable */}
						<div className="flex">
							{Array.isArray(value) || typeof value === 'object' ? (
								<div
									className="cursor-pointer text-xs my-3"
									onClick={() => {
										if (expandedPaths.includes(`${path}.${key}`)) {
											setExpandedPaths(
												expandedPaths.filter((p) => p !== `${path}.${key}`),
											);
										} else {
											setExpandedPaths([...expandedPaths, `${path}.${key}`]);
										}
									}}
								>
									{expandedPaths.includes(`${path}.${key}`) ? '▼' : '▶'}
								</div>
							) : null}
							<div
								className={`m-2 font-medium ${
									value === 'object' ? '' : 'inline-block'
								}`}
							>
								{key}
							</div>

							<div
								className={`my-2 ${
									value === 'object' ? 'flex flex-col' : 'inline-block'
								} gap-2  `}
							>
								{typeof value === 'object' ? (
									expandedPaths.includes(`${path}.${key}`) ? (
										getJSONRepresentation(value, path ? `${path}.${key}` : key)
									) : (
										<div className="text-gray-500">
											{
												// if value is an object, show the number of keys
												value
													? Array.isArray(value)
														? `${value.length} elems [${
																value.length > 6
																	? value
																			.map((v) =>
																				Array.isArray(v) ? 'array' : typeof v,
																			)
																			.splice(0, 6)
																			.join(', ') + '...'
																	: value
																			.map((v) =>
																				Array.isArray(v) ? 'array' : typeof v,
																			)
																			.join(', ')
														  }]`
														: `${Object.values(value).length} props [${
																Object.values(value).length > 6
																	? Object.values(value)
																			.map((v) =>
																				Array.isArray(v) ? 'array' : typeof v,
																			)
																			.splice(0, 6)
																			.join(', ') + '...'
																	: Object.values(value)
																			.map((v) =>
																				Array.isArray(v) ? 'array' : typeof v,
																			)
																			.join(', ')
														  }]`
													: 'null'
											}
										</div>
									)
								) : (
									<div className="text-gray-500">{JSON.stringify(value)}</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		);
	};

	return (
		<>
			<div
				onClick={() => {
					// copy to clipboard
					navigator.clipboard.writeText(
						'https://l2beat.com/api/scaling-tvl.json',
					);
				}}
			>
				https://l2beat.com/api/scaling-tvl.json
			</div>
			<Input value={apiURL} onChange={(e) => setApiURL(e.target.value)} />
			<div className="text-gray-500">{apiURL}</div>
			{input.length > 0 && <Chart inputData={input} />}
			<textarea
				className="border border-gray-300 rounded-md p-2 w-full h-96"
				value={JSON.stringify(input, null, 2)}
				readOnly
			></textarea>

			<textarea
				className="border border-gray-300 rounded-md p-2 w-full h-96"
				value={JSON.stringify(apiResponse, null, 2)}
				readOnly
			></textarea>
			<div>
				{/* Show draggable labels for each level of the apiResponse JSON object. If the current key is the not an object, show the value.*/}
				{/* <div className="flex flex-col gap-2">
					{Object.entries(apiResponse).map(([key, value]) => (
						<div
							key={key}
							draggable
							className="border border-gray-300 rounded-md p-2 inline-block"
						>
							<div>{key}</div>
							<div className="flex flex-col gap-2">
								{typeof value === 'object' &&
									Object.entries(value).map(([key, value]) => (
										<div
											key={key}
											draggable
											className="border border-gray-300 rounded-md p-2 inline-block"
										>
											<div>{key}</div>
											{typeof value === 'object' &&
												Object.entries(value).map(([key, value]) => (
													<div
														key={key}
														draggable
														className="border border-gray-300 rounded-md p-2 inline-block"
													>
														{key}
													</div>
												))}
										</div>
									))}
							</div>
						</div>
					))}
				</div> */}
				{getJSONRepresentation(apiResponse)}
			</div>
		</>
	);
}
