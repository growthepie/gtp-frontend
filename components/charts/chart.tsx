'use client';

import { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';

import styles from './chart.module.scss';
import { useActiveBreakpoint } from '@/utils/use-active-breakpoint';
import merge from 'lodash/merge';

const colors = {
	blue400: '#60a5fa',
	cloudyblue: '#aaaad2',
	/** @deprecated use blue400 instead. */
	drop: '#5dadec',
	fireHighlight: '#ffcc4d',
	/** @deprecated use orange400 instead. */
	fireOrange: '#f4900c',
	orange400: '#fb923c',
	slateus100: '#dee2f1',
	slateus200: '#b5bddb',
	slateus400: '#8991ad',
	slateus450: '#8888af',
	slateus500: '#464b6f',
	slateus800: '#131827',
	slateus600: '#2d344a',
	slateus700: '#1b2236',
	white: '#ffffff',
};

const COLORS = {
	GRID: '#262e48',
	PLOT_LINE: '#6675a3',
	LABEL: '#8490b5',
	LABEL_HOVER: '#6c7696',
	TOOLTIP_BG: '#1b2135', // mignight-express but lighter
	ANNOTATION_BG: '#293350',
	// visx
	// SERIES: ["#0b7285", "#66d9e8", "#fcc419", "#ff8787", "#9c36b5", "#cc5de8", "#a61e4d"],
	// chart.js
	SERIES: ['#36a2eb', '#ff6384', '#8142ff', '#ff9f40', '#ffcd56', '#4bc0c0'],
};

// The wrapper exports only a default component that at the same time is a
// namespace for the related Props interface (HighchartsReact.Props) and
// RefObject interface (HighchartsReact.RefObject). All other interfaces
// like Options come from the Highcharts module itself.

const baseOptions: Highcharts.Options = {
	accessibility: { enabled: false },
	chart: {
		animation: false,
		backgroundColor: 'rgba(0, 0, 0, 0)',
		style: {
			fontFamily: 'Roboto Mono, monospace',
		},
		showAxes: true,
	},
	legend: {
		itemStyle: {
			color: COLORS.LABEL,
		},
		itemHoverStyle: {
			color: COLORS.LABEL_HOVER,
		},
	},
	title: undefined,
	xAxis: {
		lineWidth: 0,
		labels: { enabled: false },
		tickWidth: 0,
	},

	yAxis: {
		gridLineWidth: 0,
		title: { text: undefined },
		labels: { enabled: false },
		plotLines: [
			{
				color: colors.slateus200,
				label: {
					style: { color: colors.slateus200 },
					y: 5,
					x: 20,
				},
			},
			{
				color: colors.slateus200,
				label: {
					style: { color: colors.slateus200 },
					y: 18,
					x: 1,
				},
				width: 2,
				zIndex: 10,
			},
		],
	},
	tooltip: {
		backgroundColor: 'transparent',
		xDateFormat: '%Y-%m-%d',
		useHTML: true,
		borderWidth: 0,
		shadow: false,
	},
	credits: { enabled: false },
	plotOptions: {
		series: {
			color: {
				linearGradient: {
					x1: 0,
					y1: 0,
					x2: 1,
					y2: 0,
				},
				stops: [
					[0, '#4B90DB'],
					[1, '#50E3C2'],
				],
			},
			shadow: {
				color: '#4B90DB05',
				width: 15,
			},
			marker: {
				lineColor: 'transparent',
				fillColor: '#4B90DB',
				radius: 0,
				symbol: 'circle',
				states: {
					hover: {
						radius: 5,
						fillColor: '#4B90DB',
						lineColor: 'transparent',
					},
				},
			},
		},
	},
};

// React supports function components as a simple way to write components that
// only contain a render method without any state (the App component in this
// example).

export const Chart = ({ inputData }: { inputData: any }) => {
	const isRendering = useRef(true);
	const { lg, md, xl, xl2 } = useActiveBreakpoint();
	const width = xl2 ? 650 : xl ? 530 : lg ? 400 : md ? 570 : 280;
	const height = lg ? 320 : 200;

	console.log('inputData', inputData);

	const [options, setOptions] = useState<Highcharts.Options>({
		accessibility: { enabled: false },
		chart: {
			animation: false,
			backgroundColor: 'rgba(0, 0, 0, 0)',
			style: {
				fontFamily: 'Roboto Mono, monospace',
			},
			showAxes: false,
		},
		legend: {
			itemStyle: {
				color: COLORS.LABEL,
			},
			itemHoverStyle: {
				color: COLORS.LABEL_HOVER,
			},
		},
		title: undefined,
		series: [
			{
				type: 'line',
				data: inputData,
			},
		],
		// xAxis: {
		// 	min: inputData.length > 0 ? Math.min(...inputData[0]) : 0,
		// 	max: inputData.length > 0 ? Math.max(...inputData[0]) : 0,
		// 	type: 'datetime',
		// 	// categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		// },
		// yAxis: {
		// 	min: inputData.length > 0 ? Math.min(...inputData[1]) : 0,
		// 	max: inputData.length > 0 ? Math.max(...inputData[1]) : 0,
		// 	plotLines: [
		// 		{
		// 			value: 0,
		// 			width: 2,
		// 			color: colors.slateus200,
		// 			zIndex: 10,
		// 		},
		// 	],
		// },
		xAxis: {
			// min: inputData.length > 0 ? Math.min(...inputData[0]) : 0,
			// max: inputData.length > 0 ? Math.max(...inputData[0]) : 0,
			lineWidth: 0,
			labels: { enabled: false },
			tickWidth: 0,
			type: 'datetime',
		},

		yAxis: {
			// min: inputData.length > 0 ? Math.min(...inputData[1]) : 0,
			// max: inputData.length > 0 ? Math.max(...inputData[1]) : 0,
			gridLineWidth: 0,
			title: { text: undefined },
			labels: { enabled: false },
			plotLines: [
				{
					color: colors.slateus200,
					label: {
						style: { color: colors.slateus200 },
						y: 5,
						x: 20,
					},
				},
				{
					color: colors.slateus200,
					label: {
						style: { color: colors.slateus200 },
						y: 18,
						x: 1,
					},
					width: 2,
					zIndex: 10,
				},
			],
		},
		tooltip: {
			backgroundColor: 'transparent',
			xDateFormat: '%Y-%m-%d',
			useHTML: true,
			borderWidth: 0,
			shadow: false,
		},
		credits: { enabled: false },
		plotOptions: {
			series: {
				color: {
					linearGradient: {
						x1: 0,
						y1: 0,
						x2: 1,
						y2: 0,
					},
					stops: [
						[0, '#4B90DB'],
						[1, '#50E3C2'],
					],
				},
				shadow: {
					color: '#4B90DB05',
					width: 15,
				},
				marker: {
					lineColor: 'transparent',
					fillColor: '#4B90DB',
					radius: 0,
					symbol: 'circle',
					states: {
						hover: {
							radius: 5,
							fillColor: '#4B90DB',
							lineColor: 'transparent',
						},
					},
				},
			},
		},
		// chart: {
		// 	events: {
		// 		render: function () {
		// 			isRendering.current = false;
		// 		},
		// 	},
		// },
	});

	// const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

	// useEffect(() => {
	// 	console.log('inputData', JSON.stringify(inputData));
	// 	if (!Array.isArray(inputData) || inputData.length === 0) return;
	// 	const nextOptions: Highcharts.Options = {
	// 		// chart: {
	// 		// 	events: {
	// 		// 		redraw: function () {
	// 		// 			const yAxis0 = this.yAxis[0] as Highcharts.Axis & {
	// 		// 				plotLinesAndBands: { svgElem: { element: SVGElement } }[];
	// 		// 			};

	// 		// 			yAxis0.plotLinesAndBands.forEach(function (lineOrBand) {
	// 		// 				const svg = lineOrBand.svgElem.element;
	// 		// 				const d = svg.getAttribute('d');
	// 		// 				if (d === null) {
	// 		// 					return;
	// 		// 				}
	// 		// 				const dArr = d.split(' ');
	// 		// 				const widthReductionLeft = xl2
	// 		// 					? 500
	// 		// 					: xl
	// 		// 					? 380
	// 		// 					: lg
	// 		// 					? 250
	// 		// 					: md
	// 		// 					? 420
	// 		// 					: 230;
	// 		// 				const widthReductionRight = md ? 90 : 15;

	// 		// 				const newStartX = Number(dArr[1]) + widthReductionLeft;
	// 		// 				const newStopX = Number(dArr[4]) - widthReductionRight;
	// 		// 				dArr[1] = String(newStartX);
	// 		// 				dArr[4] = String(newStopX);

	// 		// 				svg.setAttribute('d', dArr.join(' '));
	// 		// 			});
	// 		// 		},
	// 		// 	},
	// 		// 	width: width,
	// 		// 	height: height,
	// 		// },
	// 		// xAxis: {
	// 		// 	max: Math.max(inputData[inputData.length - 1][0], 0),
	// 		// 	min: 0,
	// 		// 	minPadding: 0.03,
	// 		// },
	// 		// yAxis: {
	// 		// 	max: Math.max(inputData[inputData.length - 1][1], 0),
	// 		// 	min: 0,
	// 		// },
	// 		series: [
	// 			{
	// 				type: 'line',
	// 				data: inputData,
	// 			},
	// 		],
	// 		plotOptions: {
	// 			series: {
	// 				marker: {
	// 					enabled: false,
	// 				},
	// 			},
	// 		},
	// 	};
	// 	if (!isRendering.current) {
	// 		isRendering.current = true;
	// 		setOptions((currentOptions) => merge({}, currentOptions, nextOptions));
	// 	}
	// }, [height, inputData, width]);

	// useEffect(() => {
	// 	console.log('inputData', JSON.stringify(inputData));
	// }, [inputData]);

	return (
		<div className={`flex select-none justify-center ${styles.chart}`}>
			<HighchartsReact
				highcharts={Highcharts}
				options={options}
				// ref={chartComponentRef}
			/>
		</div>
	);
};
