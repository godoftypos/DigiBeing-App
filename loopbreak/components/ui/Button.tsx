import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View, ActivityIndicator } from 'react-native';

type ButtonProps = {
  title: string;
  outline?: boolean;
  loading?: boolean;
} & TouchableOpacityProps;

export const Button = forwardRef<typeof TouchableOpacity, ButtonProps>(
  ({ title, outline = false, loading = false, ...touchableProps }, ref) => {
    const baseClass = outline ? styles.buttonOutline : styles.button;
    const textClass = outline ? styles.buttonTextOutline : styles.buttonText;
    const combinedClass = `${baseClass} ${touchableProps.className ?? ''}`.trim();
    const disabled = touchableProps.disabled ?? loading;
    const indicatorColor = outline ? '#6366f1' : '#fff'; // indigo-500 or white

    return (
      <TouchableOpacity
        ref={ref as any}
        {...touchableProps}
        disabled={disabled}
        className={combinedClass}
      >
        {loading && (
          <View className="mr-2">
            <ActivityIndicator size="small" color={indicatorColor} />
          </View>
        )}
        <Text className={textClass}>{title}</Text>
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = {
  button: 'items-center bg-indigo-500 rounded-[28px] shadow-md p-4 flex-row justify-center',
  buttonText: 'text-white text-lg font-semibold text-center',
  buttonOutline:
    'items-center bg-transparent rounded-[28px] shadow-md p-4 border border-indigo-500 flex-row justify-center',
  buttonTextOutline: 'text-indigo-500 text-lg font-semibold text-center',
};
