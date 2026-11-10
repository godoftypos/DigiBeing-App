import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export interface LineChartDataset {
  data: number[];
  color?: (opacity: number) => string;
  strokeWidth?: number;
}

export interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
  legend?: string[];
}

interface LineChartProps {
  data: LineChartData;
  title: string;
  yAxisSuffix?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, yAxisSuffix = "" }) => {
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
      r: "4",
      strokeWidth: "2",
      stroke: "#3B82F6"
    },
  };

  return (
    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
      <Text className="text-xl font-bold text-gray-800 mb-4 text-center">{title}</Text>
      
      {/* Legend */}
      {data.legend && (
        <View className="flex-row justify-center mb-4 space-x-6">
          <View className="flex-row items-center">
            <View className="w-4 h-1 bg-blue-500 rounded mr-2" />
            <Text className="text-sm text-gray-600">{data.legend[0]}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-1 bg-red-500 rounded mr-2" />
            <Text className="text-sm text-gray-600">{data.legend[1]}</Text>
          </View>
        </View>
      )}
      
      <View className="items-center">
        <RNLineChart
          data={data}
          width={screenWidth - 80}
          height={220}
          chartConfig={chartConfig}
          bezier
          yAxisLabel=""
          yAxisSuffix={yAxisSuffix}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
        />
      </View>
    </View>
  );
};
