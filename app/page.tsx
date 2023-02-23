'use client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DataSelector } from '@/components/home/DataSelector';
import { DataSources } from '@/components/home/DataSources';
import MainChart from '@/components/home/MainChart';
import Popover from '@/components/Popover';
import { useLocalStorage } from 'usehooks-ts';
import { ArrowsRightLeftIcon, LinkIcon } from '@heroicons/react/24/solid';
import styles from './page.module.css';
import { Tag } from '@/components/Tag';
import { useMemo, useState } from 'react';
import { useMetricsData } from '@/context/MetricsProvider';
import { ReactJson } from '@/components/ReactJson';
import Image from 'next/image';

export default function Home() {
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
			icon: <ArrowsRightLeftIcon className="h-4 w-4" />,
			options: [
				{
					label: 'Total Value Locked',
					rootKey: 'metricsTvl',
				},
				{
					label: 'Transaction Count',
					rootKey: 'metricsTxCount',
				},
				{
					label: 'Market Cap',
					rootKey: 'metricsMarketCap',
				},
				{
					label: '24h Contract Usage',
					rootKey: 'metrics24hContractUsage',
				},
				{
					label: 'Fees Paid to Ethereum',
					rootKey: 'metricsFeesPaidToEthereum',
				},
				{
					label: 'Transactions per Second',
					rootKey: 'metricsTransactionsPerSecond',
				},
				{
					label: 'Daily Active Addresses',
					rootKey: 'metricsDailyActiveAddresses',
				},
				{
					label: 'New Addresses',
					rootKey: 'metricsNewAddresses',
				},
				{
					label: 'Total Addresses',
					rootKey: 'metricsTotalAddresses',
				},
			],
		},
		{
			name: 'Single Chain',
			label: 'Single Chain',
			icon: <LinkIcon className="h-4 w-4" />,
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
		<div className="flex py-8">
			{/* Chart Filter Menu */}
			<div className="flex flex-col w-1/4 space-y-3">
				{/* <div>
					{JSON.stringify(selectedFilter)}
					{JSON.stringify(selectedFilterOption)}
				</div> */}
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
			</div>
			<div className="flex flex-col w-3/4">
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
								{/* <img src={chain.icon} alt={chain.label} /> */}
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
							? metricsData.data[selectedFilterOption.rootKey].data.metric_name
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
	);
}
