import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet } from 'react-native';

export const TabBarIcon = (props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
}) => {
  return <Feather size={22} style={styles.tabBarIcon} {...props} />;
};

export const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
});
