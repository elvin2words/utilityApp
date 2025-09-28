
// components/NotificationCard.tsx

import React, { useState, useRef } from "react";
import { Animated as Anim, Dimensions, Modal, PanResponderGestureState, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PanGestureHandler, State, Swipeable } from "react-native-gesture-handler";

import { Notification } from "@/src/shared/schema";

import { formatTimeAgo } from "@/src/lib/utils";

import { Bell, AlertTriangle, CheckCircle,
  Info, Sparkles, } from "lucide-react-native";
  
import Animated from "react-native-reanimated";
import Toast from "react-native-toast-message"; // when swiped 


const SCREEN_WIDTH = Dimensions.get("window").width;

type NotificationCardProps = {
  notification: Notification;
  onRead?: (id: number) => void;
  onDismiss?: (id: number) => void;
};

export const NotificationCard = ({ notification, onRead, onDismiss }: NotificationCardProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const translateX = new Anim.Value(0);
  const { icon, color, priority } = getTypeIconAndColor(notification.type);
  const cardOpacity = translateX.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const handlePress = () => {
    if (!notification.read && onRead) {
      onRead(notification.id);
    }
    setModalVisible(true);
  };

  const handleDismiss = () => {
    if (priority === "high") {
      setModalVisible(true);
    } else {
      onDismiss?.(notification.id);
    }
  };

  const handleGestureEvent = Anim.event([{ nativeEvent: { translationX: translateX } }], {
    useNativeDriver: true,
  });

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.translationX > SCREEN_WIDTH * 0.3) {
      Anim.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => handleDismiss());
    } else {
      Anim.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

const handleHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX < -SCREEN_WIDTH * 0.3) {
        Anim.timing(translateX, {
          toValue: -SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onRead?.(notification.id);
        });
      } else if (nativeEvent.translationX > SCREEN_WIDTH * 0.3) {
        // Toast("success");
        Anim.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          handleDismiss();
        });
      } else {
        Anim.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };  

  const handleSwipedRightToLeft = () => {
    console.log('Swiped right to left — do something');
    // Example: mark as read, trigger vibration, etc.
    onRead?.(notification.id);
  };

  const handleSwipedLeftToRight = () => {
    console.log('Swiped left to right — do something else');
    // Example: open details, archive, etc.
    handleDismiss();
  };

  return (
    <>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        // onHandlerStateChange={onHandlerStateChange}
        onHandlerStateChange={handleHandlerStateChange}
        activeOffsetX={[-5, 5]} // Prevent accidental vertical scroll blocking
        failOffsetY={[-5, 5]} // Allow slight vertical motion before gesture fails
      >
      {/* <Swipeable 
        onSwipeableLeftOpen={handleSwipedRightToLeft}
        onSwipeableRightOpen={handleSwipedLeftToRight}
        renderLeftActions={() => (
          <View style={styles.swipeActionLeft}>
            <Text style={styles.swipeText}>Read</Text>
          </View>
        )}
        renderRightActions={() => (
          <View style={styles.swipeActionRight}>
            <Text style={styles.swipeText}>Dismiss</Text>
          </View>
        )}
      > */}
        <Anim.View
          style={[
            styles.card,
            { borderLeftColor: color },
            { transform: [{ translateX }] },
            // { opacity: notification.read ? 0.6 : 1 },
            {opacity: notification.dismissed ? 0.4 : notification.read ? 0.6 : 1,}

          ]}
        >
          <TouchableOpacity style={styles.content} onPress={handlePress}>
            <View style={styles.textSection}>
              <Text style={styles.message} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimeAgo(notification.timestamp)}
              </Text>
            </View>
            <View>{icon}</View>
          </TouchableOpacity>
        </Anim.View>
    </PanGestureHandler>
    {/* </Swipeable> */}

    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Notification Details</Text>
          <Text style={styles.modalMessage}>{notification.message}</Text>
          <Text style={styles.modalTimestamp}>{formatTimeAgo(notification.timestamp)}</Text>

          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => {
              setModalVisible(false);
              // Hook in AI suggestions panel logic here
              console.log("AI assistant invoked");
            }}
          >
            <Sparkles size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.aiButtonText}>Explore Suggestions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </>
);
};

const getTypeIconAndColor = (type: string): { icon: JSX.Element; color: string } => {
  switch (type) {
    case "new_assignment":
      return { icon: <Bell size={20} color="#3b82f6" />, color: "#3b82f6" };
    case "fault_resolved":
      return { icon: <CheckCircle size={20} color="#10b981" />, color: "#10b981" };
    case "alert":
      return { icon: <AlertTriangle size={20} color="#f59e0b" />, color: "#f59e0b" };
    case "critical":
      return { icon: <AlertTriangle size={20} color="#ef4444" />, color: "#ef4444" };
    case "status_update":
      return { icon: <Info size={20} color="#8b5cf6" />, color: "#8b5cf6" };
    default:
      return { icon: <Bell size={20} color="#9ca3af" />, color: "#9ca3af" };
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textSection: {
    flex: 1,
    paddingRight: 10,
    // alignItems: "center",
    // justifyContent: "center",
  },
  message: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827", // gray-900
  },
  timestamp: {
    fontSize: 12,
    color: "#6b7280", // gray-500
    marginTop: 4,
  },
  iconSection: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1f2937",
  },
  modalMessage: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 10,
  },
  modalTimestamp: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 20,
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  closeButton: {
    alignSelf: "center",
    // marginTop: 10,
    backgroundColor: "black",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,    
  },
  closeButtonText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  swipeActionLeft: {
    backgroundColor: "#10b981",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
  },
  swipeActionRight: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    // alignItems: "flex-end",
    paddingHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
  },
  swipeText: {
    color: "#fff",
    fontWeight: "600",
  },  
});
