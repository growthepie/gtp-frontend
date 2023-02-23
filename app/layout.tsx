'use client';
import './globals.css';
import install from '@twind/with-next/app';
import config from '../twind.config';
import { useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import DarkModeSwitch from '@/components/layout/DarkModeSwitch';
import { MetricsProvider } from '@/context/MetricsProvider';

// activate twind - must be called at least once
// const twind = install(config);

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [darkMode, setDarkMode] = useLocalStorage('darkMode', true);

	useEffect(() => {
		// activate twind - must be called at least once
		install(config);
	}, []);

	return (
		<html lang="en" className={darkMode ? 'dark' : ''}>
			{/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
			<head />
			<MetricsProvider>
				<body className="bg-white text-black dark:bg-black dark:text-white">
					<div className="min-h-screen max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
						<div className="flex justify-between items-center">
							<div className="font-bold text-2xl">LOGO</div>
							<DarkModeSwitch />
						</div>
						<main>{children}</main>
					</div>
				</body>
			</MetricsProvider>
		</html>
	);
}

// export default install(config, RootLayout);
