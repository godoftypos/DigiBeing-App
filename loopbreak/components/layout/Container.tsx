import { SafeAreaView } from 'react-native';

export const Container = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return <SafeAreaView className={`${styles.container} ${className}`}>{children}</SafeAreaView>;
};

const styles = {
  container: 'flex flex-1 items-center justify-start p-6 bg-white',
};
