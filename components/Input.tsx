import {
	Size,
	SizeClasses,
	SizePaddingClasses,
	Color,
	BackgroundClasses,
	TextColorClasses,
	BorderClasses,
} from './types/common';

type InputProps = {
	value: string | number;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	colorVariant?: Color;
	size?: Size;
	variant?: 'solid' | 'outline';
	bgColor?: Color | null;
	textColor?: Color | null;
};

export const Input = ({
	value,
	onChange,
	colorVariant = 'gray',
	size = 'sm',
	variant = 'outline',
	bgColor = null,
	textColor = null,
}: InputProps) => {
	switch (variant) {
		case 'solid':
			return (
				<input
					className={`rounded-md p-2 ${SizeClasses[size]} ${
						SizePaddingClasses[size]
					} ${BackgroundClasses[bgColor ?? colorVariant]}
					${TextColorClasses[textColor ?? 'white']}
					`}
					type="text"
					value={value}
					onChange={onChange}
				/>
			);
		case 'outline':
			return (
				<input
					className={`rounded-md p-2 ${SizeClasses[size]} ${
						SizePaddingClasses[size]
					} ${BorderClasses[bgColor ?? colorVariant]} ${
						TextColorClasses[textColor ?? colorVariant]
					}`}
					type="text"
					value={value}
					onChange={onChange}
				/>
			);
	}
};
