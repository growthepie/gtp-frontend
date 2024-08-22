import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu';
import Colors from 'tailwindcss/colors';

export const AllColors = Object.keys(Colors).reduce((acc, color) => {
	if (color === 'transparent' || color === 'current' || color === 'inherit')
		return acc;

	Object.keys(Colors[color]).forEach((shade) => {
		acc.push(`${color}-${shade}`);
	});

	return acc;
}, [] as string[]);

export type Color =
	| 'black'
	| 'red'
	| 'green'
	| 'blue'
	| 'yellow'
	| 'gray'
	| 'indigo'
	| 'purple'
	| 'white';

export type Shade =
	| '50'
	| '100'
	| '200'
	| '300'
	| '400'
	| '500'
	| '600'
	| '700'
	| '800'
	| '900';

export type Size = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

export type Padding = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

export type Margin = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

export type Checked = DropdownMenuCheckboxItemProps["checked"];

export const PaddingClasses = {
	'2xs': 'p-1',
	xs: 'p-2',
	sm: 'p-4',
	md: 'p-8',
	lg: 'p-12',
};
export const Background = (color: Color, shade: Shade) => {
	return `bg-${color}-${shade}`;
};
export const BackgroundClasses = {
	black: 'bg-black',
	red: 'bg-red-500',
	green: 'bg-green-500',
	blue: 'bg-blue-500',
	yellow: 'bg-yellow-500',
	gray: 'bg-gray-500',
	indigo: 'bg-indigo-500',
	purple: 'bg-purple-500',
	white: 'bg-white',
};

export const BorderClasses = {
	black: 'border-2 border-black',
	red: 'border-2 border-red-500',
	green: 'border-2 border-green-500',
	blue: 'border-2 border-blue-500',
	yellow: 'border-2 border-yellow-500',
	gray: 'border-2 border-gray-500',
	indigo: 'border-2 border-indigo-500',
	purple: 'border-2 border-purple-500 ',
	white: 'border-2 border-white',
};

export const TextColorClasses = {
	black: 'text-black',
	red: 'text-red-500',
	green: 'text-green-500',
	blue: 'text-blue-500',
	yellow: 'text-yellow-500',
	gray: 'text-gray-500',
	indigo: 'text-indigo-500',
	purple: 'text-purple-500',
	white: 'text-white',
};

export const TextSizeClasses = {
	'2xs': 'text-[0.625rem] leading-[0.75rem] font-medium',
	xs: 'text-xs',
	sm: 'text-sm',
	md: 'text-md',
	lg: 'text-lg',
};

export const WidthSizeClasses = {
	'2xs': 'w-2',
	xs: 'w-3',
	sm: 'w-4',
	md: 'w-5',
	lg: 'w-6',
	xl: 'w-7',
	'2xl': 'w-8',
	'3xl': 'w-9',
};

export const HeightSizeClasses = {
	'2xs': 'h-2',
	xs: 'h-3',
	sm: 'h-4',
	md: 'h-5',
	lg: 'h-6',
	xl: 'h-7',
	'2xl': 'h-8',
	'3xl': 'h-9',
};

export const SizePaddingClasses = {
	'2xs': 'px-1 py-0.5',
	xs: 'px-1.5 py-[0.1875rem]',
	sm: 'px-2 py-1',
	md: 'px-2.5 py-[0.3125rem]',
	lg: 'px-3 py-1.5',
};

export const SizeMarginClasses = {
	'2xs': 'mx-1 my-0.5',
	xs: 'mx-1.5 my-[0.1875rem]',
	sm: 'mx-2 my-1',
	md: 'mx-2.5 my-[0.3125rem]',
	lg: 'mx-3 my-1.5',
};

export const RoundedClasses = {
	'2xs': 'rounded-[0.125rem]',
	xs: 'rounded-[0.1875rem]',
	sm: 'rounded-[0.25rem]',
	md: 'rounded-[0.3125rem]',
	lg: 'rounded-[0.375rem]',
	xl: 'rounded-[0.4375rem]',
	'2xl': 'rounded-[0.5rem]',
	'3xl': 'rounded-[0.5625rem]',
	full: 'rounded-full',
};
