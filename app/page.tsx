'use client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DataSelector } from '@/components/home/DataSelector';
import { DataSources } from '@/components/home/DataSources';
import MainChart from '@/components/home/MainChart';
import Popover from '@/components/Popover';
import { useLocalStorage } from 'usehooks-ts';
import {
	ArrowsRightLeftIcon,
	LinkIcon,
	TicketIcon,
	Bars3Icon,
} from '@heroicons/react/24/solid';
import { Icon } from '@iconify/react';
import styles from './page.module.css';
import { Tag } from '@/components/Tag';
import { useEffect, useMemo, useState } from 'react';
import { useMetricsData } from '@/context/MetricsProvider';
import { ReactJson } from '@/components/ReactJson';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useMediaQuery } from '@react-hook/media-query';

export default function Home() {
	const isLargeScreen = useMediaQuery('(min-width: 768px)');

	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	useEffect(() => {
		setIsSidebarOpen(isLargeScreen);
	}, [isLargeScreen]);

	const metricsData = useMetricsData();

	const [darkMode, setDarkMode] = useLocalStorage('darkMode', true);

	const [dataSources, setDataSources] = useLocalStorage<{
		[index: number]: {
			rootKey: string;
			url: string;
			data: any;
			useCorsProxy?: boolean;
		};
	}>('dataSources', {
		0: {
			rootKey: 'arbitrum',
			url: 'https://d2cfnw27176mbd.cloudfront.net/v1/chains/arbitrum.json',
			data: {},
			useCorsProxy: true,
		},
		1: {
			rootKey: 'optimism',
			url: 'https://d2cfnw27176mbd.cloudfront.net/v1/chains/optimism.json',
			data: {},
			useCorsProxy: true,
		},
		2: {
			rootKey: 'tvl',
			url: 'https://d2cfnw27176mbd.cloudfront.net/v1/metrics/tvl.json',
			data: {},
			useCorsProxy: true,
		},
		3: {
			rootKey: 'txcount',
			url: 'https://d2cfnw27176mbd.cloudfront.net/v1/metrics/txcount.json',
			data: {},
			useCorsProxy: true,
		},
	});

	const filters = [
		{
			name: 'Fundamentals',
			label: 'Fundamentals',
			icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
			sidebarIcon: (
				<Icon icon="ic:round-compare-arrows" className="h-6 w-6 mx-auto " />
			),
			options: [
				{
					label: 'Total Value Locked',
					icon: <Icon icon="ep:money" className="h-4 w-4  mx-auto" />,
					rootKey: 'metricsTvl',
				},
				{
					label: 'Transaction Count',
					icon: <Icon icon="mdi:text" className="h-4 w-4 mx-auto" />,
					rootKey: 'metricsTxCount',
				},
				{
					label: 'Market Cap',
					icon: <Icon icon="carbon:mountain" className="h-4 w-4 mx-auto" />,
					rootKey: 'metricsMarketCap',
				},
				{
					label: '24h Contract Usage',
					icon: <Icon icon="ion:time-outline" className="h-4 w-4 mx-auto" />,
					rootKey: 'metrics24hContractUsage',
				},
				{
					label: 'Fees Paid to Ethereum',
					icon: <Icon icon="ion:ticket-outline" className="h-4 w-4 mx-auto" />,
					rootKey: 'metricsFeesPaidToEthereum',
				},
				{
					label: 'Transactions per Second',
					icon: (
						<Icon
							icon="ant-design:transaction-outlined"
							className="h-4 w-4 mx-auto"
						/>
					),
					rootKey: 'metricsTransactionsPerSecond',
				},
				{
					label: 'Daily Active Addresses',
					icon: <Icon icon="bx:bx-user" className="h-4 w-4 mx-auto" />,
					rootKey: 'metricsDailyActiveAddresses',
				},
				{
					label: 'New Addresses',
					icon: <Icon icon="bx:bx-user-plus" className="h-4 w-4 mx-auto" />,
					rootKey: 'metricsNewAddresses',
				},
				{
					label: 'Total Addresses',
					icon: <Icon icon="ph:address-book" className="h-5 w-5 mx-auto" />,
					rootKey: 'metricsTotalAddresses',
				},
			],
		},
		{
			name: 'Single Chain',
			label: 'Single Chain',
			icon: <LinkIcon className="h-5 w-5" />,
			sidebarIcon: <LinkIcon className="h-5 w-5 mx-auto" />,
			options: [
				{
					label: 'Ethereum',
					rootKey: 'chainsEthereum',
				},
				{
					label: 'Arbitrum',
					rootKey: 'chainsArbitrum',
				},
				{
					label: 'Aztec V2',
					rootKey: 'chainsAztecV2',
				},
				{
					label: 'Immutable X',
					rootKey: 'chainsImmutableX',
				},
				{
					label: 'Loopring',
					rootKey: 'chainsLoopring',
				},
				{
					label: 'Optimism',
					rootKey: 'chainsOptimism',
				},
			],
		},
		{
			name: 'Blockspace',
			label: 'Blockspace',
			icon: <LinkIcon className="h-5 w-5" />,
			sidebarIcon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
			options: [],
		},
		{
			name: 'Wiki',
			label: 'Wiki',
			icon: <LinkIcon className="h-5 w-5" />,
			sidebarIcon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
			options: [],
		},
		{
			name: 'API Documentation',
			label: 'API Documentation',
			icon: <LinkIcon className="h-5 w-5" />,
			sidebarIcon: <Icon icon="bxl:react" className="h-5 w-5 mx-auto" />,
			options: [],
		},
	];

	const allChains = [
		{
			label: 'Ethereum',
			icon: '/icons/ethereum.png',
			key: 'ethereum',
		},
		{
			label: 'Arbitrum',
			icon: '/icons/arbitrum.png',
			key: 'arbitrum',
		},
		{
			label: 'Aztec V2',
			icon: '/icons/aztec.png',
			key: 'aztecv2',
		},
		{
			label: 'Immutable X',
			icon: '/icons/immutablex.png',
			key: 'immutablex',
		},
		{
			label: 'Loopring',
			icon: '/icons/loopring.png',
			key: 'loopring',
		},
		{
			label: 'Optimism',
			icon: '/icons/optimism.png',
			key: 'optimism',
		},
	];

	const [selectedFilter, setSelectedFilter] = useState({
		name: 'Fundamentals',
	});

	const [selectedFilterOption, setSelectedFilterOption] = useState({
		label: 'Total Value Locked',
		rootKey: 'metricsTvl',
	});

	const chains = useMemo(() => {
		if (metricsData?.status !== 'success') return [];

		if (selectedFilter.name === 'Fundamentals')
			return allChains.filter((chain) =>
				Object.keys(
					metricsData.data[selectedFilterOption.rootKey].data.chains,
				).includes(chain.key),
			);

		return allChains.filter((chain) =>
			Object.keys(metricsData.data[selectedFilterOption.rootKey].data).includes(
				chain.key,
			),
		);
	}, [metricsData]);

	const [selectedChains, setSelectedChains] = useState(
		allChains.map((chain) => chain.key),
	);

	if (!metricsData || metricsData.status === 'loading') {
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="overflow-y-none">
			<div className="flex py-8">
				<div>
					<Sidebar
						trigger={
							<button className="flex items-center space-x-2">
								<Bars3Icon className="h-6 w-6" />
							</button>
						}
						items={filters}
						open={isLargeScreen ? true : false}
						onOpen={() => setIsSidebarOpen(true)}
						onClose={() => setIsSidebarOpen(false)}
					>
						<div className="flex flex-col space-y-4">
							<div className="flex flex-col space-y-2">
								<div className="flex space-x-2 text-sm font-semibold items-center text-gray-600 dark:text-gray-400">
									<ArrowsRightLeftIcon className="h-4 w-4" />
									<div>Fundamentals</div>
								</div>
							</div>
						</div>
					</Sidebar>
				</div>
				{/* Chart Filter Menu */}
				{/* <div className="flex flex-col w-1/4 space-y-3">

					{filters.map((filter) => (
						<div key={filter.name} className="flex flex-col space-y-1">
							<div className="flex space-x-2 text-sm font-semibold items-center text-gray-600 dark:text-gray-400">
								{filter.icon}
								<div>{filter.label}</div>
							</div>
							<div className="flex flex-col space-y-2 text-md font-[400]">
								{metricsData.status === 'success' &&
									filter.options.map((option) => {
										if (!metricsData.rootKeys.includes(option.rootKey)) {
											return (
												<div
													key={option.label}
													className="flex space-x-2 items-center cursor-not-allowed"
												>
													<div className="text-gray-500/40">{option.label}</div>
												</div>
											);
										}

										if (
											selectedFilter.name === filter.name &&
											selectedFilterOption.rootKey === option.rootKey
										) {
											return (
												<div
													key={option.label}
													className="flex space-x-2 items-center cursor-pointer"
													onClick={() => {
														setSelectedFilter({
															name: filter.name,
														});
														setSelectedFilterOption(option);
													}}
												>
													<div className="font-bold">{option.label}</div>
												</div>
											);
										}
										return (
											<div
												key={option.label}
												className="flex space-x-2 items-center cursor-pointer"
												onClick={() => {
													setSelectedFilter({
														name: filter.name,
													});
													setSelectedFilterOption(option);
												}}
											>
												<div>{option.label}</div>
											</div>
										);
									})}
							</div>
						</div>
					))}
				</div> */}
				<div
					className={`flex flex-col px-8  ${
						isSidebarOpen
							? 'ease-in-out duration-300 transform translate-x-[10.75rem] w-[calc(100%-15.5rem)]'
							: 'ease-in-out duration-300 transform translate-x-0 w-full'
					}`}
				>
					<div className="flex space-x-2 justify-end">
						{chains.map((chain) => (
							<div
								key={chain.key}
								className={`flex items-center space-x-2 cursor-pointer py-1 px-2 rounded-full text-sm font-medium ${
									selectedChains.includes(chain.key)
										? 'bg-blue-200 dark:bg-blue-500 hover:bg-blue-100 dark:hover:bg-blue-600'
										: 'hover:bg-gray-100 dark:hover:bg-gray-900 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-100'
								}`}
								onClick={() => {
									if (selectedChains.includes(chain.key)) {
										setSelectedChains(
											selectedChains.filter((c) => c !== chain.key),
										);
									} else {
										setSelectedChains([...selectedChains, chain.key]);
									}
								}}
							>
								<div
									className={`w-4 h-4 ${
										selectedChains.includes(chain.key) ? '' : ''
									}`}
								>
									<Image
										src={chain.icon}
										alt={chain.label}
										width={16}
										height={16}
									/>
								</div>
								<div>{chain.label}</div>
							</div>
						))}
					</div>
					<div className="font-bold text-3xl mb-3 ml-2">
						{metricsData.status === 'success' &&
							(selectedFilter.name === 'Fundamentals'
								? metricsData.data[selectedFilterOption.rootKey].data
										.metric_name
								: selectedFilterOption.label)}
					</div>
					{selectedFilter &&
						selectedFilterOption &&
						metricsData.status === 'success' &&
						metricsData.data[selectedFilterOption.rootKey].data && (
							<MainChart
								data={Object.keys(
									metricsData.data[selectedFilterOption.rootKey].data.chains,
								)
									.filter((chain) => selectedChains.includes(chain))
									.map((chain) => {
										return {
											name: chain,
											// type: 'spline',
											data: metricsData.data[selectedFilterOption.rootKey].data
												.chains[chain].daily,
										};
									})}
							/>
						)}

					<div className="text-2xl font-bold my-3">Metrics Data</div>
					<ReactJson
						src={metricsData}
						theme={darkMode ? 'monokai' : 'rjv-default'}
					></ReactJson>
				</div>
				{/* <Popover
				trigger={
					<Button variant="solid" color="blue">
						Data Sources
					</Button>
				}
			>
				<div className="p-4">
					<DataSources
						dataSources={dataSources}
						setDataSources={setDataSources}
					/>
				</div>
			</Popover>
			<Popover
				trigger={
					<Button variant="solid" color="blue">
						Data Selector
					</Button>
				}
			>
				<div className="p-4">
					<DataSelector />
				</div>
			</Popover> */}
			</div>
		</div>
	);
}
