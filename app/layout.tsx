'use client';
import './globals.css';
import install from '@twind/with-next/app';
import config from '../twind.config';
import { useEffect } from 'react';

// activate twind - must be called at least once
// const twind = install(config);

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	useEffect(() => {
		// activate twind - must be called at least once
		install(config);
	}, []);

	return (
		<html lang="en">
			{/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
			<head />
			<body className="bg-white text-black dark:bg-black dark:text-white">
				<div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{children}
				</div>
			</body>
		</html>
	);
}

// export default install(config, RootLayout);
