import {
	Size,
	SizeClasses,
	SizePaddingClasses,
	Color,
	BackgroundClasses,
	TextColorClasses,
	BorderClasses,
} from './types/common';

type TextAreaProps = {
	value: string | number;
	onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	colorVariant?: Color;
	size?: Size;
	variant?: 'solid' | 'outline';
	bgColor?: Color | null;
	textColor?: Color | null;
	readOnly?: boolean;
	className?: string;
};

export const TextArea = ({
	value,
	onChange,
	colorVariant = 'gray',
	size = 'sm',
	variant = 'outline',
	bgColor = null,
	textColor = null,
	readOnly = false,
	className = '',
}: TextAreaProps) => {
	switch (variant) {
		case 'solid':
			return (
				<textarea
					className={`rounded-md p-2 ${SizeClasses[size]} ${
						SizePaddingClasses[size]
					} ${BackgroundClasses[bgColor ?? colorVariant]}
					${TextColorClasses[textColor ?? 'white']}
					${className}`}
					value={value}
					onChange={onChange}
					readOnly={readOnly}
				/>
			);
		case 'outline':
			return (
				<textarea
					className={`rounded-md p-2 ${SizeClasses[size]} ${
						SizePaddingClasses[size]
					} ${BorderClasses[bgColor ?? colorVariant]} ${
						TextColorClasses[textColor ?? colorVariant]
					} ${className}`}
					value={value}
					onChange={onChange}
					readOnly={readOnly}
				/>
			);
	}
};
