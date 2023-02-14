'use client';

import { Chart } from '@/components/charts/chart';
import { Input } from '@/components/Input';
import { useEffect, useMemo, useState } from 'react';
import { quicktypeJSON } from '@/utils/quicktype';
import _ from 'lodash';
import { Tag } from './Tag';
import { StatusCodeText } from '@/utils/http-status-codes';
import { re_weburl } from '@/utils/regex-weburl';
import { TextArea } from '@/components/TextArea';
import { JSONPath, JSONPathClass } from 'jsonpath-plus';

type DataSelectorProps = {
	data: any;
};

export default function DataSelector({ data }: DataSelectorProps) {
	const [search, setSearch] = useState<string>('');
	const [result, setResult] = useState<any>(null);

	const paths = useMemo(() => {
		return JSONPath({
			path: '$..*',
			json: data,
			resultType: 'path',
			flatten: false,
		}).map((path: string) => {
			let p = JSONPath.toPathArray(path);
			// console.log(p);
			return p;
		});
	}, [data]);

	const [searchPaths, setSearchPaths] = useState<string[]>([]);

	useEffect(() => {
		const res = JSONPath({ path: search, json: data });
		setResult(res);

		// const searchPaths = paths.filter((path) => {
		// 	return path.includes(search);
		// });
		// setSearchPaths(searchPaths);
	}, [search]);

	const [currentPathIndex, setCurrentPathIndex] = useState<number>(1);

	return (
		<div className="flex flex-col space-y-2">
			<div>Keys</div>
			<div className="flex flex-col space-y-1"></div>
			<Input value={search} onChange={(e) => setSearch(e.target.value)} />
			<TextArea value={JSON.stringify(result, null, 2)} readOnly />
			<div>
				{/* <pre>{JSON.stringify(flattenWithDotNotation(data), null, 2)}</pre> */}
			</div>
			{/* <pre>{JSON.stringify(dataFlattened, null, 2)}</pre>
			<pre>{JSON.stringify(arrayPaths)}</pre> */}
			<input
				type="number"
				value={currentPathIndex}
				onChange={(e) => setCurrentPathIndex(parseInt(e.target.value))}
			/>
			{currentPathIndex > 1 &&
				paths
					.filter((path) => path.length === currentPathIndex + 1)
					.map((path) => <div key={path}>{path.join('.')}</div>)}
		</div>
	);
}
