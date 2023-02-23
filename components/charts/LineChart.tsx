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

export default function LineChart({ series }: LineChartProps) {
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
		series: [],
		credits: {
			enabled: false,
		},
	});

	useEffect(() => {
		if (series) {
			setOptions({
				...options,
			});
		}
	}, [series]);

	return (
		<Card variant="solid" color="blue" shade="500">
			<HighchartsReact highcharts={Highcharts} options={options} />
		</Card>
	);
}
