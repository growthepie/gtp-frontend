import {
	TextSizeClasses,
	PaddingClasses,
	Background,
	BackgroundClasses,
	BorderClasses,
	type Color,
	type Size,
	type Padding,
	type Shade,
	TextColorClasses,
	RoundedClasses,
	HeightSizeClasses,
	WidthSizeClasses,
} from './types/common';

type SwitchProps = {
	children?: React.ReactNode;
	childrenLeft?: React.ReactNode;
	color?: Color;
	shade?: Shade;
	variant?: 'solid' | 'outline' | 'ghost' | 'link';
	size?: Size;
	padding?: Padding;
	className?: string;
	rounded?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
	checked?: boolean;
	onChange?: () => void;
};

const WidthHeightContainerClasses = {
	'2xs': 'w-6 h-4',
	xs: 'w-8 h-5',
	sm: 'w-10 h-6',
	md: 'w-12 h-7',
	lg: 'w-14 h-8',
	xl: 'w-16 h-9',
	'2xl': 'w-20 h-10',
	'3xl': 'w-24 h-11',
};

// const WidthHeightClasses = {
// 	'2xs': 'w-4 h-2',
// 	xs: 'w-8 h-5',
// 	sm: 'w-10 h-6',
// 	md: 'w-12 h-7',
// 	lg: 'w-14 h-8',
// 	xl: 'w-16 h-9',
// 	'2xl': 'w-20 h-10',
// 	'3xl': 'w-24 h-11',
// };

export const Switch = ({
	children,
	childrenLeft,
	color = 'gray',
	shade = '500',
	variant = 'solid',
	size = 'sm',
	padding = 'xs',
	className = '',
	rounded = 'full',
	checked,
	onChange,
}: SwitchProps) => {
	return (
		<div className="flex items-center">
			<input id="toggle" type="checkbox" className="hidden" />
			<label htmlFor="toggle" className="flex items-center cursor-pointer">
				{childrenLeft && (
					<div className="mr-2  font-medium" onClick={onChange}>
						{childrenLeft}
					</div>
				)}
				<div className="relative" onClick={onChange}>
					<div
						className={`block 
                        ${WidthHeightContainerClasses[size]}
                        rounded-full transition duration-200 ease-in-out 
                        ${RoundedClasses[rounded]} ${
							checked ? Background(color, shade) : 'bg-gray-500/50'
						}`}
					></div>
					<div
						className={`dot absolute left-1 top-1
                        ${WidthSizeClasses[size]}
                        ${HeightSizeClasses[size]} 
                        rounded-full transition duration-200 ease-in-out
                        bg-white
                        ${checked ? 'transform translate-x-full' : ''}
                        ${RoundedClasses[rounded]}`}
					></div>
				</div>
				{children && (
					<div className="ml-2 font-medium" onClick={onChange}>
						{children}
					</div>
				)}
			</label>
		</div>
	);
};
