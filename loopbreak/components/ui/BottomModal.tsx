import { Modal, Pressable, View } from "react-native";

interface BottomModalProps {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const BottomModal: React.FC<BottomModalProps> = ({ isVisible, onClose, children }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
                {/* Prevents closing when tapping inside the modal content */}
                <Pressable className="bg-white rounded-t-2xl p-6 items-center shadow-lg">
                    {/* Handle Bar */}
                    <View className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" />
                    {children}
                </Pressable>
            </Pressable>
        </Modal>
    );
};