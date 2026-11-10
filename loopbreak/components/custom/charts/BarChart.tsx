import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export interface BarChartDataset {
  data: number[];
  color?: (opacity: number) => string;
  colors?: Array<(opacity: number) => string>;
}

export interface BarChartData {
  labels: string[];
  datasets: BarChartDataset[];
}

interface BarChartProps {
  data: BarChartData;
  title: string;
  yAxisSuffix?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, yAxisSuffix = "" }) => {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#3B82F6"
    },
    barPercentage: 0.7,
  };

  return (
    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
      <Text className="text-xl font-bold text-gray-800 mb-4 text-center">{title}</Text>
      <View className="items-center">
        <RNBarChart
          data={data}
          width={screenWidth - 80}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          yAxisLabel=""
          yAxisSuffix={yAxisSuffix}
          showValuesOnTopOfBars
          withInnerLines={false}
          fromZero
        />
      </View>
    </View>
  );
};
