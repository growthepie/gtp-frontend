'use client';

import { Switch } from '@/components/Switch';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { SunIcon } from '@heroicons/react/24/outline';
import { MoonIcon } from '@heroicons/react/24/solid';

export default function DarkModeSwitch() {
	const [darkMode, setDarkMode] = useLocalStorage('darkMode', true);

	const handleToggle = () => {
		setDarkMode(!darkMode);
	};

	return (
		<div className="flex justify-between">
			<Switch
				checked={darkMode}
				onChange={() => {
					setDarkMode(!darkMode);
				}}
				childrenLeft={
					darkMode ? (
						<MoonIcon className="h-5 w-5" />
					) : (
						<SunIcon className="h-5 w-5" />
					)
				}
			></Switch>
		</div>
	);
}
