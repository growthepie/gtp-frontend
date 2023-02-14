'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import theme from '@twind/preset-tailwind/defaultTheme';
// lazy load colors from twind preset
// const Colors = dynamic(() => import('@twind/preset-tailwind/colors'), {
// 	ssr: false,
// });

const Shades = {
	50: '50',
	100: '100',
	200: '200',
	300: '300',
	400: '400',
	500: '500',
	600: '600',
	700: '700',
	800: '800',
	900: '900',
};

const Opacities = {
	0: '0',
	5: '5',
	10: '10',
	20: '20',
	25: '25',
	30: '30',
	40: '40',
	50: '50',
	60: '60',
	70: '70',
	75: '75',
	80: '80',
	90: '90',
	95: '95',
	100: '100',
};

export default function ColorPicker() {
	const [color, setColor] = useState('red');
	const [color2, setColor2] = useState('red');

	return (
		<div className="flex flex-col">
			<label className="block text-sm font-medium text-gray-700">
				Color Picker
			</label>
			{/* show clickable color swatches of all colors of all shades */}
			{/* {JSON.stringify(theme.colors)} */}
			<div className="flex flex-col space-y-0.5">
				<div className="flex flex-row space-x-0.5 justify-items-stretch">
					<div
						className={`border border(gray-100 hover:white}) rounded-sm p-1 h-4 w-full bg-white hover:bg-white  hover:shadow-sm cursor-pointer`}
						onClick={() => setColor(`white`)}
					></div>
				</div>

				{Object.keys(theme.colors).map((c) => {
					const color = c as keyof typeof theme.colors;
					return (
						<div className="flex flex-row space-x-0.5" key={`${color}`}>
							{/* <div>{JSON.stringify(theme.colors[color])}</div>
							<div>{typeof theme.colors[color]}</div> */}
							{typeof theme.colors[color] === 'object' &&
								Object.keys(theme.colors[color]).map((shade) => {
									return (
										<div
											className={`border border(gray-100 hover:${color}-${shade}) rounded-sm p-1 w-4 h-4 bg-${color}-${shade} hover:bg-${color}-${shade}  hover:shadow-sm cursor-pointer`}
											key={`${color}-${shade}`}
											onClick={() => setColor(`${color}-${shade}`)}
										></div>
									);
								})}
						</div>
					);
				})}
			</div>
			<div className="flex flex-col space-y-2">
				<label className="block text-sm font-medium text-gray-700">
					Color Preview
				</label>
				<div className="flex flex-row space-x-2">
					<div
						className={`border border-gray-300 rounded-md p-2 w-full bg-${color}-100 text-${color}-500`}
					>
						{color}
					</div>
					<div
						className={`border border-gray-300 rounded-md p-2 w-full bg-${color2}-100 text-${color2}-500`}
					>
						{color2}
					</div>
				</div>
			</div>
		</div>
	);
}
