// 'use client';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { useEffect, useState, ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { useMediaQuery } from '@react-hook/media-query';

type SidebarItems = {
	name: string;
	label: string;
	icon: ReactNode;
	sidebarIcon: ReactNode;
	options: {
		name: string;
		label: string;
		icon: ReactNode;
		rootKey?: string;
	}[];
}[];

type SidebarProps = {
	items: SidebarItems;
	trigger: ReactNode;
	className?: string;
	open?: boolean;
	onToggle?: () => void;
	onOpen?: () => void;
	onClose?: () => void;
};

export default function Sidebar({
	items,
	trigger,
	className = '',
	open = false,
	onToggle = () => {},
	onOpen = () => {},
	onClose = () => {},
}: SidebarProps) {
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
		onClose();
	};

	return (
		<div className="">
			{/* trigger that opens the sidebar when clicked */}

			{/* sliding sidebar menu */}

			<div className="flex h-full">
				<div className="w-8 bg-white dark:bg-black z-20" />
				<div className="overflow-y-auto">
					<div className="flex flex-col">
						<div className="text-slate-400 dark:bg-black dark:text-slate-400 z-20">
							<div onClick={handleToggle} className="w-6 mx-auto">
								{trigger}
							</div>
						</div>
						{items.map((item) => (
							<>
								<div key={item.name} className="flex items-center">
									<div className="w-[2.25rem] pl-[0.5rem] p-3 bg-white dark:bg-black z-20">
										<div className="text-white bg-slate-400 dark:text-black dark:bg-slate-400 rounded-md w-6 mx-auto">
											{item.sidebarIcon}
										</div>
									</div>
									<div
										className={`-left-[6.5rem] absolute ${
											isOpen
												? 'ease-in-out duration-300 transform translate-x-[10.75rem]'
												: 'ease-in-out duration-300 transform translate-x-0'
										} w-[10.75rem] bg-white dark:bg-black z-10 `}
									>
										<div className="text-sm font-medium py-3 px-2 w-[10.75rem] z-10 bg-white dark:bg-black">
											{item.label}
										</div>
									</div>
								</div>
								{item.options.map((option) => (
									<div key={option.name} className="flex items-center">
										<div className="w-[2.25rem] p-3 bg-white text-slate-400 dark:bg-black dark:text-slate-400 z-20 rounded-l-full">
											{option.icon != null ? (
												option.icon
											) : (
												<Icon icon="bxl:react" className="h-4 w-4 mx-auto" />
											)}
										</div>

										<div
											className={`-left-[6.5rem] absolute ${
												isOpen
													? 'ease-in-out duration-300 transform translate-x-[10.75rem]'
													: 'ease-in-out duration-300 transform translate-x-0'
											} w-[10.75rem] bg-white dark:bg-black z-10 `}
										>
											<div className="text-sm font-medium py-3 px-2  w-[10.75rem] z-10 bg-white dark:bg-black">
												{option.label}
											</div>
										</div>
									</div>
								))}
							</>
						))}
					</div>
				</div>
				<div className="w-1 flex ml-3">
					<div
						className={`flex-1 bg-gray-100 dark:bg-gray-100 ${
							isOpen
								? 'ease-in-out duration-300 transform translate-x-[10rem]'
								: 'ease-in-out duration-300 transform translate-x-0'
						}`}
					></div>
				</div>
			</div>
		</div>
	);
}
