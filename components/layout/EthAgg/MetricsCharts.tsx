import React, { useMemo, useState } from 'react';
import { GTPIcon } from '../GTPIcon';
import Container from '../Container';
import { TopRowContainer } from '../TopRow';
import { TopRowParent } from '../TopRow';
import { TopRowChild } from '../TopRow';
import { HighchartsProvider, HighchartsChart, YAxis, XAxis, Tooltip, Chart, LineSeries, Series } from 'react-jsx-highcharts';
import Highcharts from 'highcharts';
import "@/app/highcharts.axis.css";
// Define the props type for MetricsChartsComponent
interface MetricsChartsProps {
  selectedBreakdownGroup: string;
}

function MetricsChartsComponent({ selectedBreakdownGroup }: MetricsChartsProps) {
  return (
    <Container className='flex flex-col gap-y-[60px] mt-[60px] w-full'>
      <EconCharts selectedBreakdownGroup={selectedBreakdownGroup} />
      <ScalingCharts selectedBreakdownGroup={selectedBreakdownGroup} />
    </Container>
  );
}

const EconCharts = ({ selectedBreakdownGroup }: MetricsChartsProps) => {
  const [selectedMode, setSelectedMode] = useState("gas_fees_usd_absolute");
  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedTimespan, setSelectedTimespan] = useState("1y");
  const [showUsd, setShowUsd] = useState(true);
  

  const timespans = useMemo(() => ({

    "1y": {
      label: "1 year",
      shortLabel: "1y",
      value: 365,
      xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
      xMax: Date.now(),
    },
    "5y": {
      label: "5 years",
      shortLabel: "5y",
      value: 1825,
      xMin: Date.now() - 1825 * 24 * 60 * 60 * 1000,
      xMax: Date.now(),
    },
    max: {
      label: "Maximum",
      shortLabel: "Max",
      value: 0,
      xMin: null,
      xMax: Date.now(),
    },
  }), []);

  if(selectedBreakdownGroup !== "Metrics") {
    return null;
  }

  return (
    <div className='flex flex-col gap-y-[15px]'>
        <div className='flex gap-x-[8px] items-center'>
            <GTPIcon icon='gtp-metrics-economics' size='lg' className='text-[#5A6462]' />
            <div className='heading-large-lg'>Data Availability Fee Markets</div>
        </div>
        <div className='pl-[45px] text-md'>More value is locked onchain and users are paying to interact with the Ethereum Ecosystem. Ethereum Mainnet is the most trusted ledger with fast-growing Layer 2s. </div>
        <TopRowContainer>
            <TopRowParent>
                <div></div>
            </TopRowParent>
            <TopRowParent>
            {Object.keys(timespans).map((timespan) => (
                <TopRowChild
                    key={timespan}
                    isSelected={selectedTimespan === timespan}
                    onClick={() => {
                        setSelectedTimespan(timespan);
                    }}
                    >
                    <span className="hidden md:block">
                        {timespans[timespan].label}
                    </span>
                    <span className="block md:hidden">
                        {timespans[timespan].shortLabel}
                    </span>
                </TopRowChild>
            ))}
            </TopRowParent>
        </TopRowContainer>
        <div className='flex gap-x-[15px] w-full'>
            <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
                <div className='flex h-[56px] px-[30px] items-start w-full'>
                    <div className='flex gap-x-[5px] items-center'>
                        <div className='heading-large-md text-nowrap'>Gross Domestic Product</div>
                        <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
                    </div>
                    <div className='flex flex-col h-full items-end pt-[5px] w-full'>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>98</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                                }}>    
                            </div>
                        </div>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: 39%</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "transparent",
                                }}>    
                            </div>
                        </div>
                       
                    </div>
                </div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart>
                        <Chart
                            
                            backgroundColor={"transparent"}
                            type="line"
                            height={309}
                            plotOptions={{
                                series: {
                                    marker: {
                                        lineColor: "white",
                                        radius: 0,
                                        symbol: "circle",
                                      },
                                },
                            }}
                            marginLeft={-5}
                            marginRight={0}
                            marginBottom={0}
                            
                        />
                        <XAxis 
                            type="datetime"
                            gridLineWidth={0}

                            //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                            //method for showiing set amount of ticks
                            labels={{
                                overflow: "allow",
                                step: 1,
                                x: 10,
                                y: -10,
                                align: "center",
                                distance: 10,
                                style: {
                                    color: "#D7DFDE",
                                    fontSize: "9px",
                                    fontFamily: "Fira Sans",
                                }
                            }}
                        />
                        <YAxis
                            gridLineWidth={1}
                            tickAmount={4}
                            gridLineColor={"#5A6462"}
                            lineColor={"#5A6462"}
                            
                            labels={{
                                overflow: "allow",
                                x: 8,
                                y: 11,
                                align: "left",
                                distance: 5,
                                style: {
                                    color: "#CDD8D3",
                                    fontSize: "9px",
                                    fontFamily: "Raleway",
                                },
                                useHTML: true,
                                formatter: function() {
                                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                                }   
                                
                            }}
                        >
                            <Series
                                type="area"
                                name="Data Availability Fee Markets"
                                marker={{
                                    enabled: false,
                                }}
                                color={{
                                    linearGradient: {
                                        x1: 0,
                                        x2: 0,
                                        y1: 0,
                                        y2: 1,
                                    },
                                    stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]
                                    
                                }}
                                data={[1, 2, 3, 4, 5]}
                            />
                        </YAxis>
                        <Tooltip />
                    </HighchartsChart>
                </HighchartsProvider>
                
                <div className='absolute bottom-0 left-0 right-0 flex items-center px-[30px]'>
                        <div className='w-full h-[22px] bg-[#1F272688] rounded-t-[15px]'></div>        
                </div>
            </div>
            <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
                <div className='flex h-[56px] px-[30px] items-start w-full'>
                    <div className='flex gap-x-[5px] items-center'>
                        <div className='heading-large-md text-nowrap'>Stablecoin Supply</div>
                        <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
                    </div>
                    <div className='flex flex-col h-full items-end pt-[5px] w-full'>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>98</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                                }}>    
                            </div>
                        </div>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: 39%</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "transparent",
                                }}>    
                            </div>
                        </div>
                       
                    </div>
                </div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart>
                        <Chart
                            
                            backgroundColor={"transparent"}
                            type="line"
                            height={309}
                            plotOptions={{
                                series: {
                                    marker: {
                                        lineColor: "white",
                                        radius: 0,
                                        symbol: "circle",
                                      },
                                },
                            }}
                            marginLeft={-5}
                            marginRight={0}
                            marginBottom={0}
                            
                        />
                        <XAxis 
                            type="datetime"
                            gridLineWidth={0}

                            //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                            //method for showiing set amount of ticks
                            labels={{
                                overflow: "allow",
                                step: 1,
                                x: 10,
                                y: -10,
                                align: "center",
                                distance: 10,
                                style: {
                                    color: "#D7DFDE",
                                    fontSize: "9px",
                                    fontFamily: "Fira Sans",
                                }
                            }}
                        />
                        <YAxis
                            gridLineWidth={1}
                            tickAmount={4}
                            gridLineColor={"#5A6462"}
                            lineColor={"#5A6462"}
                            
                            labels={{
                                overflow: "allow",
                                x: 8,
                                y: 11,
                                align: "left",
                                distance: 5,
                                style: {
                                    color: "#CDD8D3",
                                    fontSize: "9px",
                                    fontFamily: "Raleway",
                                },
                                useHTML: true,
                                formatter: function() {
                                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                                }   
                                
                            }}
                        >
                            <Series
                                type="area"
                                name="Data Availability Fee Markets"
                                marker={{
                                    enabled: false,
                                }}
                                color={{
                                    linearGradient: {
                                        x1: 0,
                                        x2: 0,
                                        y1: 0,
                                        y2: 1,
                                    },
                                    stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]
                                    
                                }}
                                data={[1, 2, 3, 4, 5]}
                            />
                        </YAxis>
                        <Tooltip />
                    </HighchartsChart>
                </HighchartsProvider>
                
                <div className='absolute bottom-0 left-0 right-0 flex items-center px-[30px]'>
                        <div className='w-full h-[22px] bg-[#1F272688] rounded-t-[15px]'></div>        
                </div>
            </div>
        </div>
    </div>
  );
}

const ScalingCharts = ({ selectedBreakdownGroup }: MetricsChartsProps) => {
    const [selectedMode, setSelectedMode] = useState("gas_fees_usd_absolute");
    const [selectedValue, setSelectedValue] = useState("absolute");
    const [selectedTimespan, setSelectedTimespan] = useState("1y");
    const [showUsd, setShowUsd] = useState(true);
    
  
    const timespans = useMemo(() => ({
  
      "1y": {
        label: "1 year",
        shortLabel: "1y",
        value: 365,
        xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "5y": {
        label: "5 years",
        shortLabel: "5y",
        value: 1825,
        xMin: Date.now() - 1825 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      max: {
        label: "Maximum",
        shortLabel: "Max",
        value: 0,
        xMin: null,
        xMax: Date.now(),
      },
    }), []);
  
    if(selectedBreakdownGroup !== "Metrics") {
      return null;
    }

    return (
      <div className='flex flex-col gap-y-[15px]'>
          <div className='flex gap-x-[8px] items-center'>
              <GTPIcon icon='gtp-ecosystem-scaling' size='lg' className='text-[#5A6462]' />
              <div className='heading-large-lg'>The Ethereum Ecosystem is Scaling</div>
          </div>
          <div className='pl-[45px] text-md'>More value is locked onchain and users are paying to interact with the Ethereum Ecosystem. Ethereum Mainnet is the most trusted ledger with fast-growing Layer 2s.</div>
          <TopRowContainer>
              <TopRowParent>
                  <div></div>
              </TopRowParent>
              <TopRowParent>
              {Object.keys(timespans).map((timespan) => (
                  <TopRowChild
                      key={timespan}
                      isSelected={selectedTimespan === timespan}
                      onClick={() => {
                          setSelectedTimespan(timespan);
                      }}
                      >
                      <span className="hidden md:block">
                          {timespans[timespan].label}
                      </span>
                      <span className="block md:hidden">
                          {timespans[timespan].shortLabel}
                      </span>
                  </TopRowChild>
              ))}
              </TopRowParent>
          </TopRowContainer>
          <div className='flex gap-x-[15px]'>
          <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
                <div className='flex h-[56px] px-[30px] items-start w-full'>
                    <div className='flex gap-x-[5px] items-center'>
                        <div className='heading-large-md text-nowrap'>Layer 2s Building on Ethereum</div>
                        <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
                    </div>
                    <div className='flex flex-col h-full items-end pt-[5px] w-full'>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>98</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                                }}>    
                            </div>
                        </div>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: 39%</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "transparent",
                                }}>    
                            </div>
                        </div>
                       
                    </div>
                </div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart>
                        <Chart
                            
                            backgroundColor={"transparent"}
                            type="line"
                            height={309}
                            plotOptions={{
                                series: {
                                    marker: {
                                        lineColor: "white",
                                        radius: 0,
                                        symbol: "circle",
                                      },
                                },
                            }}
                            marginLeft={-5}
                            marginRight={0}
                            marginBottom={0}
                            
                        />
                        <XAxis 
                            type="datetime"
                            gridLineWidth={0}

                            //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                            //method for showiing set amount of ticks
                            labels={{
                                overflow: "allow",
                                step: 1,
                                x: 10,
                                y: -10,
                                align: "center",
                                distance: 10,
                                style: {
                                    color: "#D7DFDE",
                                    fontSize: "9px",
                                    fontFamily: "Fira Sans",
                                }
                            }}
                        />
                        <YAxis
                            gridLineWidth={1}
                            tickAmount={4}
                            gridLineColor={"#5A6462"}
                            lineColor={"#5A6462"}
                            
                            labels={{
                                overflow: "allow",
                                x: 8,
                                y: 11,
                                align: "left",
                                distance: 5,
                                style: {
                                    color: "#CDD8D3",
                                    fontSize: "9px",
                                    fontFamily: "Raleway",
                                },
                                useHTML: true,
                                formatter: function() {
                                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                                }   
                                
                            }}
                        >
                            <Series
                                type="area"
                                name="Data Availability Fee Markets"
                                marker={{
                                    enabled: false,
                                }}
                                color={{
                                    linearGradient: {
                                        x1: 0,
                                        x2: 0,
                                        y1: 0,
                                        y2: 1,
                                    },
                                    stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]
                                    
                                }}
                                data={[1, 2, 3, 4, 5]}
                            />
                        </YAxis>
                        <Tooltip />
                    </HighchartsChart>
                </HighchartsProvider>
                
                <div className='absolute bottom-0 left-0 right-0 flex items-center px-[30px]'>
                        <div className='w-full h-[22px] bg-[#1F272688] rounded-t-[15px]'></div>        
                </div>
            </div>
            <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
                <div className='flex h-[56px] px-[30px] items-start w-full'>
                    <div className='flex gap-x-[5px] items-center'>
                        <div className='heading-large-md text-nowrap'>Average Daily TPS</div>
                        <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
                    </div>
                    <div className='flex flex-col h-full items-end pt-[5px] w-full'>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>98</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                                }}>    
                            </div>
                        </div>
                        <div className='flex items-center gap-x-[5px]'> 
                            <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: 39%</div>
                            <div className='w-[16px] h-[16px] rounded-full ' 
                                style={{
                                    background: "transparent",
                                }}>    
                            </div>
                        </div>
                       
                    </div>
                </div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart>
                        <Chart
                            
                            backgroundColor={"transparent"}
                            type="line"
                            height={309}
                            plotOptions={{
                                series: {
                                    marker: {
                                        lineColor: "white",
                                        radius: 0,
                                        symbol: "circle",
                                      },
                                },
                            }}
                            marginLeft={-5}
                            marginRight={0}
                            marginBottom={0}
                            
                        />
                        <XAxis 
                            type="datetime"
                            gridLineWidth={0}

                            //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                            //method for showiing set amount of ticks
                            labels={{
                                overflow: "allow",
                                step: 1,
                                x: 10,
                                y: -10,
                                align: "center",
                                distance: 10,
                                style: {
                                    color: "#D7DFDE",
                                    fontSize: "9px",
                                    fontFamily: "Fira Sans",
                                }
                            }}
                        />
                        <YAxis
                            gridLineWidth={1}
                            tickAmount={4}
                            gridLineColor={"#5A6462"}
                            lineColor={"#5A6462"}
                            
                            labels={{
                                overflow: "allow",
                                x: 8,
                                y: 11,
                                align: "left",
                                distance: 5,
                                style: {
                                    color: "#CDD8D3",
                                    fontSize: "9px",
                                    fontFamily: "Raleway",
                                },
                                useHTML: true,
                                formatter: function() {
                                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                                }   
                                
                            }}
                        >
                            <Series
                                type="area"
                                name="Data Availability Fee Markets"
                                marker={{
                                    enabled: false,
                                }}
                                color={{
                                    linearGradient: {
                                        x1: 0,
                                        x2: 0,
                                        y1: 0,
                                        y2: 1,
                                    },
                                    stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]
                                    
                                }}
                                data={[1, 2, 3, 4, 5]}
                            />
                        </YAxis>
                        <Tooltip />
                    </HighchartsChart>
                </HighchartsProvider>
                
                <div className='absolute bottom-0 left-0 right-0 flex items-center px-[30px]'>
                        <div className='w-full h-[22px] bg-[#1F272688] rounded-t-[15px]'></div>        
                </div>
            </div>
          </div>
      </div>
    );
}


const arePropsEqual = (
  prevProps: Readonly<MetricsChartsProps>,
  nextProps: Readonly<MetricsChartsProps>
) => {
   // This comparison means MetricsChartsComponent will only re-evaluate 
   // its rendering if selectedBreakdownGroup actually changes its value OR 
   // if selectedBreakdownGroup *becomes* or *stops being* "Metrics".
   
   // If it was not "Metrics" and is now "Metrics", re-render (to mount MetricsCharts properly)
   if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup === "Metrics") {
       return false;
   }
   // If it was "Metrics" and is now not "Metrics", re-render (to unmount/hide MetricsCharts)
   if (prevProps.selectedBreakdownGroup === "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
       return false;
   }

   if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
       return true; // Effectively, don't care about changes if not displaying Metrics.
   }

   return prevProps.selectedBreakdownGroup === nextProps.selectedBreakdownGroup;
};

export default React.memo(MetricsChartsComponent, arePropsEqual);