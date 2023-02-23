'use client';

import { Chart } from '@/components/charts/chart';
import { Input } from '@/components/Input';
import { useEffect, useState } from 'react';
import { quicktypeJSON } from '@/utils/quicktype';
import _ from 'lodash';
import { Tag } from './Tag';
import { StatusCodeText } from '@/utils/http-status-codes';
import { re_weburl } from '@/utils/regex-weburl';
import { TextArea } from '@/components/TextArea';
import { ReactJson } from '@/components/ReactJson';
import { OnSelectProps } from 'react-json-view';

type DataSourceProps = {
	initUrl?: string;
	rootKey: string;
	useCorsProxy?: boolean;
	onData: (url: string, data: any, wasCorsProxyUsed: boolean) => void;
};

export default function DataSource({
	initUrl = '',
	rootKey = '',
	useCorsProxy = false,
	onData,
}: DataSourceProps) {
	// const [input, setInput] = useState<any>([]);

	const [url, setUrl] = useState(initUrl);
	const [responseCode, setResponseCode] = useState<number | string | null>(
		null,
	);
	const [responseContentType, setResponseContentType] = useState<any>('');
	const [responseError, setResponseError] = useState<any>('');

	const [data, setData] = useState<any>(null);
	const [wasCorsProxyUsed, setWasCorsProxyUsed] = useState(false);

	const [showReponseTextArea, setShowResponseTextArea] = useState(false);

	const fetchData = (url: string, useCorsProxy: boolean) => {
		if (!url) return;
		setData(null);
		setResponseCode(null);
		setResponseContentType('');
		setResponseError('');

		if (re_weburl.test(url)) {
			fetch(
				useCorsProxy
					? `http://localhost:3000/api/cors?url=${encodeURI(url)}`
					: url,
			)
				.then((res) => {
					if (res.ok) {
						setResponseCode(res.status);
						setResponseContentType(res.headers.get('content-type'));
						setResponseError(res.statusText);

						if (useCorsProxy) {
							setWasCorsProxyUsed(true);
						}

						return res.json();
					}
					return res.text().then((text) => {
						throw new Error(text);
					});
				})
				.then((data) => setData(data))
				.catch((error: any) => {
					setData({ error: error.message });
					setResponseError(error.message);
					setResponseCode('Error');
					console.error('Error:', error);

					// try again with cors proxy
					if (!useCorsProxy) fetchData(url, true);
				});
		} else {
			setData({ error: 'Invalid URL' });
			setResponseCode('Error');
			setResponseError('Invalid URL');
		}
	};

	useEffect(() => {
		fetchData(url, useCorsProxy);
	}, [url, useCorsProxy]);

	useEffect(() => {
		if (!data) {
			return;
		}
		console.log(data);
		// setRootKey(getValidJsonRootKeyFromUrl(url));
		onData(url, data, wasCorsProxyUsed);
	}, [data, url]);

	return (
		<div className="flex flex-col space-y-1">
			{/* <pre>{JSON.stringify(rootKeys)}</pre> */}
			<div className="flex flex-col space-y-0.5">
				<div className="flex items-center justify-between">
					<label className="block text-xs font-medium text-gray-700">URL</label>
					<div className="text-xs font-bold">{`{ ${rootKey}: ... }`}</div>
				</div>
				<Input
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					colorVariant="blue"
					textColor={re_weburl.test(url) ? 'black' : 'red'}
					variant="outline"
					size="xs"
				/>
			</div>

			<div className="flex flex-col space-y-1 py-0.5">
				{/* <label className="block text-sm font-medium text-gray-700">
					Response Status & Content Type
				</label> */}
				<div className="flex flex-row space-x-1 h-6">
					{/* if responseCode is 200, show a green tag, otherwise show a red tag */}
					{responseCode && (
						<>
							{responseCode == 200 ? (
								<>
									<Tag
										color="green"
										variant="outline"
										className="transition-all duration-150"
										size="xs"
										rounded="sm"
									>
										{responseCode} {StatusCodeText(responseCode)}
									</Tag>
									<Tag color="gray" variant="ghost" size="xs" rounded="sm">
										{responseContentType}
									</Tag>
								</>
							) : (
								<Tag color="red" variant="solid" size="xs" rounded="sm">
									{responseCode}
								</Tag>
							)}
						</>
					)}
				</div>
			</div>

			{/* <div className="flex flex-col space-y-2">
				<label className="block text-sm font-medium text-gray-700">
					Response Encoding
				</label>
				<div className="border border-gray-300 rounded-md p-2 w-full bg-gray-100 text-gray-500">
					{responseContentType}
				</div>
			</div> */}

			<div className="flex flex-col space-y-1">
				{/* <label className="block text-sm font-medium text-gray-700">
					Response Data */}
				{/* <div
					className="inline-block text-xs text-gray-500 cursor-pointer ml-1"
					onClick={() => setShowResponseTextArea(!showReponseTextArea)}
				>
					(click to toggle)
				</div> */}
				{/* </label> */}

				{/* <Tag
					color="gray"
					variant="link"
					size="2xs"
					onClick={() => setShowResponseTextArea(!showReponseTextArea)}
				>
					{_.size(response)} root items or properties
				</Tag>
				{showReponseTextArea && (
					<TextArea
						size="xs"
						value={JSON.stringify(response, null, 2)}
						readOnly
						className="h-40"
					/>
				)} */}
				<div className="min-h-8 max-h-96 overflow-y-auto border border-gray-300 rounded-md p-2 w-full bg-gray-100 text-gray-500">
					<ReactJson
						src={data}
						name={rootKey}
						onSelect={(select: OnSelectProps) => console.log(select)}
					/>
				</div>
			</div>
		</div>
	);
}
