import {
	SizeClasses,
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
} from './types/common';

type CardProps = {
	children: React.ReactNode;
	color: Color;
	shade?: Shade;

	variant: 'solid' | 'outline' | 'ghost' | 'link';
	size?: Size;
	padding?: Padding;
	className?: string;
	rounded?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
	onClick?: () => void;
};

export const Card = ({
	children,
	color,
	shade = '500',

	variant,

	size = 'xs',
	padding = 'md',
	className = '',
	rounded = 'md',
	onClick,
}: CardProps) => {
	switch (variant) {
		case 'solid':
			return (
				<div
					className={`inline-flex items-center ${
						PaddingClasses[padding]
					} rounded-md ${SizeClasses[size]} font-medium ${Background(
						color,
						shade,
					)} text-white ${className} ${RoundedClasses[rounded]}`}
				>
					{children}
				</div>
			);
		case 'outline':
			return (
				<div
					className={`inline-flex items-center ${PaddingClasses[padding]} rounded-md ${SizeClasses[size]} font-medium ${BorderClasses[color]} ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]}`}
				>
					{children}
				</div>
			);
		case 'ghost':
			return (
				<div
					className={`inline-flex items-center ${PaddingClasses[padding]} rounded-md ${SizeClasses[size]} font-medium ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]}`}
				>
					{children}
				</div>
			);
		case 'link':
			return (
				<div
					className={`inline-flex items-center ${PaddingClasses[padding]} rounded-md ${SizeClasses[size]} font-medium ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]} hover:underline cursor-pointer select-none`}
					onClick={onClick}
				>
					{children}
				</div>
			);
	}
};
