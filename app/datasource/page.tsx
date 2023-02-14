'use client';

import { useState, useEffect, useMemo } from 'react';
import DataSource from '@/components/DataSource';
import DataSelector from '@/components/DataSelector';
import _ from 'lodash';
import Popover from '@/components/Popover';
import { Card } from '@/components/Card';
import ColorPicker from '@/components/ColorPicker';
// import install from '@twind/with-next/app';
// import config from '../../twind.config';

export default function Page() {
	const [dataSources, setDataSources] = useState<{
		[index: number]: {
			rootKey: string;
			url: string;
			data: any;
			useCorsProxy?: boolean;
		};
	}>({});

	const data = useMemo(() => {
		return Object.values(dataSources).reduce((acc, dataSource) => {
			return {
				...acc,
				[dataSource.rootKey]: dataSource.data,
			};
		}, {});
	}, [dataSources]);

	const rootKeys = useMemo(() => {
		return Object.values(dataSources).map((dataSource) => dataSource.rootKey);
	}, [dataSources]);

	const getUniqueRootKey = (camelCaseKey: string): string => {
		if (rootKeys.length > 0 && rootKeys.includes(camelCaseKey)) {
			// prepend the key with 'new' if it's already in the rootKeys array
			return getUniqueRootKey(`new${_.upperFirst(camelCaseKey)}`);
		}
		return camelCaseKey;
	};

	const getCamelCaseKeyFromUrl = (url: string) => {
		// if the url ends with a slash, remove it
		if (url.endsWith('/')) {
			url = url.slice(0, -1);
		}
		// if the url is just a domain, return the domain as a valid camelCase key
		if (url.split('/').length === 2) {
			return _.camelCase(url.split('/')[1]);
		}
		// if the url is a path, return the last part of the path as a valid camelCase key
		return _.camelCase(url.split('/').pop());
	};
	const [cn, setCN] = useState('bg-red-500');

	return (
		<div className="flex">
			<Popover
				triggerText="test"
				open={false}
				onToggle={() => {}}
				onOpen={() => {}}
			>
				<div>test</div>
				<ColorPicker />
			</Popover>
			<div className="w-1/3 flex flex-col space-y-5">
				<input
					value={cn}
					onChange={(e) => {
						setCN(e.target.value);
					}}
				></input>
				<button className={cn}>Test</button>
				<div className="flex items-center justify-between">
					<div className="text-xs uppercase mb-1">Data Sources</div>
				</div>
				{Object.values(dataSources).map((dataSource, i) => (
					<Card
						key={i}
						color="blue"
						shade="500"
						variant="solid"
						className="flex flex-col space-y-3 items-stretch"
					>
						<DataSource
							initUrl="http://ip.jsontest.com/"
							rootKey={dataSource.rootKey || ''}
							onData={(url: string, data: any, useCorsProxy: boolean) => {
								setDataSources({
									...dataSources,
									[i]: {
										rootKey:
											url === dataSource.url
												? dataSource.rootKey
												: getUniqueRootKey(getCamelCaseKeyFromUrl(url)),
										url,
										data,
										useCorsProxy,
									},
								});
							}}
						/>
					</Card>
				))}

				<button
					className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
					onClick={() => {
						setDataSources({
							...dataSources,
							[Object.keys(dataSources).length]: {
								rootKey: '',
								url: '',
								data: {},
							},
						});
					}}
				>
					Add Data Source
				</button>
				<DataSelector data={data} />
			</div>
			{/* </div> */}
			<div className="w-2/3">
				<pre>{JSON.stringify(rootKeys, null, 2)}</pre>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</div>
		</div>
	);
}

// export default install(config, Page);
