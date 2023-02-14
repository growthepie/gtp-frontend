import dynamic from 'next/dynamic';
import { ReactJsonViewProps } from 'react-json-view';

export const DynamicReactJson = dynamic(import('react-json-view'), {
	ssr: false,
});

export const ReactJson = ({
	src,
	name,
	onSelect,
	...props
}: ReactJsonViewProps) => {
	return (
		<DynamicReactJson
			src={src}
			name={name}
			indentWidth={2}
			collapsed={1}
			quotesOnKeys={false}
			groupArraysAfterLength={50}
			{...props}
		/>
	);
};
