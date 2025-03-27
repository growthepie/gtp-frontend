import * as Highcharts from 'highcharts';

declare module 'highcharts' {
    interface Options {
        plotOptions?: {
            series?: {
                borderRadius?: number;
            };
        };
    }
}

declare module 'highcharts-rounded-corners' {
    const HighchartsRoundedCorners: typeof Highcharts;
    export = HighchartsRoundedCorners;
} 