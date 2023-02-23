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
} from './types/common';

type ButtonProps = {
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

export const Button = ({
	children,
	color,
	shade = '500',
	variant,
	size = 'xs',
	padding = 'xs',
	className = '',
	rounded = 'md',
	onClick,
}: ButtonProps) => {
	switch (variant) {
		case 'solid':
			return (
				<button
					className={`inline-flex items-center ${
						PaddingClasses[padding]
					} rounded-md ${TextSizeClasses[size]} font-medium ${Background(
						color,
						shade,
					)} text-white ${className} ${RoundedClasses[rounded]}`}
					onClick={onClick}
				>
					{children}
				</button>
			);
		case 'outline':
			return (
				<button
					className={`inline-flex items-center ${PaddingClasses[padding]} rounded-md ${TextSizeClasses[size]} font-medium ${BorderClasses[color]} ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]}`}
					onClick={onClick}
				>
					{children}
				</button>
			);
		case 'ghost':
			return (
				<button
					className={`inline-flex items-center ${PaddingClasses[padding]} rounded-md ${TextSizeClasses[size]} font-medium ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]}`}
					onClick={onClick}
				>
					{children}
				</button>
			);
		case 'link':
			return (
				<button
					className={`inline-flex items-center ${PaddingClasses[padding]} rounded-md ${TextSizeClasses[size]} font-medium ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]} hover:underline cursor-pointer select-none`}
					onClick={onClick}
				>
					{children}
				</button>
			);
	}
};
