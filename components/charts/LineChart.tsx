import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/Card';

type LineChartProps = {
	series: {
		name: string;
		data: [number, number][];
	}[];
};

export default function LineChart({ data }: LineChartProps) {
	const [options, setOptions] = useState<HighchartsReact.Props['options']>({
		chart: {
			type: 'line',
		},
		title: {
			text: 'Line Chart',
		},
		xAxis: {
			type: 'datetime',
		},
		series: [
			{
				name: 'Arbitrum',
				data: [
					[1, 2],
					[2, 3],
					[3, 4],
				],
			},
			{
				name: 'Optimism',
				data: [
					[1, 2],
					[2, 3],
					[3, 4],
				],
			},
			{
				name: 'TVL',
				data: [
					[1, 2],
					[2, 3],
					[3, 4],
				],
			},
		],
		credits: {
			enabled: false,
		},
	});

	useEffect(() => {
		if (data) {
			setOptions({
				...options,
				series: [
					{
						name: 'Arbitrum',
						data: data.arbitrum,
					},
					{
						name: 'Optimism',
						data: data.optimism,
					},
					{
						name: 'TVL',
						data: data.tvl,
					},
				],
			});
		}
	}, [data]);

	return (
		<Card variant="solid" color="blue" shade="500">
			<HighchartsReact highcharts={Highcharts} options={options} />
		</Card>
	);
}
