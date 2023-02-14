'use client';
import { useState, useEffect, useMemo, ReactNode } from 'react';

type PopoverProps = {
	triggerText: string;
	children: ReactNode;
	className?: string;
	open?: boolean;
	onToggle?: () => void;
	onOpen?: () => void;
};

export default function Popover({
	triggerText,
	children,
	className = '',
	open = false,
	onToggle = () => {},
	onOpen = () => {},
}: PopoverProps) {
	const [isOpen, setIsOpen] = useState(open);

	useEffect(() => {
		setIsOpen(isOpen);
	}, [open]);

	const handleToggle = () => {
		if (isOpen) {
			handleClose();
		} else {
			handleOpen();
		}
	};

	const handleOpen = () => {
		setIsOpen(true);
		onOpen();
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	return (
		<>
			<div className={`relative ${className}`}>
				<div onClick={handleToggle}>{triggerText}</div>
				{isOpen && (
					<div className="absolute z-10">
						<div className="bg-white shadow-lg rounded-md p-4">{children}</div>
					</div>
				)}
			</div>
			{/* overlay that covers the entire screen and closes the popover when clicked */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black opacity-10"
					onClick={handleClose}
				/>
			)}
		</>
	);
}
