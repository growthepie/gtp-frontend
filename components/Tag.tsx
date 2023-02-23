import {
	TextSizeClasses,
	SizePaddingClasses,
	BackgroundClasses,
	BorderClasses,
	type Color,
	type Size,
	TextColorClasses,
	RoundedClasses,
} from './types/common';

type TagProps = {
	children: React.ReactNode;
	color: Color;
	variant: 'solid' | 'outline' | 'ghost' | 'link';
	size?: Size;
	className?: string;
	rounded?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
	onClick?: () => void;
};

export const Tag = ({
	children,
	color,
	variant,
	size = 'xs',
	className = '',
	rounded = 'md',
	onClick,
}: TagProps) => {
	switch (variant) {
		case 'solid':
			return (
				<div
					className={`inline-flex items-center ${SizePaddingClasses[size]} ${RoundedClasses[rounded]} ${TextSizeClasses[size]} font-medium ${BackgroundClasses[color]} text-white ${className} ${RoundedClasses[rounded]}`}
					onClick={onClick}
				>
					{children}
				</div>
			);
		case 'outline':
			return (
				<div
					className={`inline-flex items-center ${SizePaddingClasses[size]} ${RoundedClasses[rounded]} ${TextSizeClasses[size]} font-medium ${BorderClasses[color]} ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]}`}
					onClick={onClick}
				>
					{children}
				</div>
			);
		case 'ghost':
			return (
				<div
					className={`inline-flex items-center ${SizePaddingClasses[size]} ${RoundedClasses[rounded]} ${TextSizeClasses[size]} font-medium ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]}`}
					onClick={onClick}
				>
					{children}
				</div>
			);
		case 'link':
			return (
				<div
					className={`inline-flex items-center ${SizePaddingClasses[size]} ${RoundedClasses[rounded]} ${TextSizeClasses[size]} font-medium ${TextColorClasses[color]} ${className} ${RoundedClasses[rounded]} hover:underline cursor-pointer select-none`}
					onClick={onClick}
				>
					{children}
				</div>
			);
	}
};
