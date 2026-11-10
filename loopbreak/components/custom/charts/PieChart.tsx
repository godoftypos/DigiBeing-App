import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export interface PieChartDataItem {
  name: string;
  usage: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title: string;
}

export const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
      <Text className="text-xl font-bold text-gray-800 mb-4 text-center">{title}</Text>
      <View className="items-center">
        <RNPieChart
          data={data}
          width={screenWidth - 80}
          height={220}
          chartConfig={chartConfig}
          accessor="usage"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute
        />
      </View>
    </View>
  );
};
