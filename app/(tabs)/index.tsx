import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  useColorScheme,
} from "react-native";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

export default function TimerScreen() {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes of study time
  const [isResting, setIsResting] = useState(false); // Indicates if user is resting
  const [isRunning, setIsRunning] = useState(false); // Timer state
  const [cycle, setCycle] = useState(1); // Current cycle
  const [totalCycles, setTotalCycles] = useState(1); // Total cycles selected by user
  const [sound, setSound] = useState<Audio.Sound | null>(null); // Sound state
  const [isSoundPlaying, setIsSoundPlaying] = useState(false); // To track if sound is playing
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark/Light mode
  const colorScheme = useColorScheme(); // Detect system theme

  // Load sound
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/notification/notification.mp3") // Path to sound file
    );
    setSound(sound);
    await sound.playAsync();
    setIsSoundPlaying(true);
  }

  // Stop sound
  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsSoundPlaying(false);
    }
  };

  // Handle timer logic
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      Vibration.vibrate(500);
      playSound();
      if (isResting) {
        // After rest, start new study cycle if cycles are not complete
        setCycle((prev) => prev + 1);
        if (cycle === totalCycles) {
          setIsRunning(false); // Stop the timer when all cycles are complete
        }
      }
      setIsResting(!isResting); // Toggle between study and rest
      setTimeLeft(isResting ? 10 * 60 : 30 * 60); // 10 minutes for rest and 30 minutes for study
      triggerNotification(); // Trigger notification when time runs out
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isResting, cycle, totalCycles]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setTimeLeft(30 * 60); // Reset to 30 minutes for study
    setCycle(1);
    setTotalCycles(1);
    setIsRunning(false);
    setIsResting(false);
    stopSound();
  };

  // Trigger notification
  const triggerNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up!",
        body: isResting ? "Rest time over!" : "Study time over!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { isResting, cycle, totalCycles },
      },
      trigger: { seconds: 1 },
    });
  };

  // Set background fetch for timer tracking
  useEffect(() => {
    const startBackgroundTask = async () => {
      await BackgroundFetch.registerTaskAsync("background-timer-task", {
        minimumInterval: 60, // Check every 60 seconds
        stopOnTerminate: false,
        startOnLaunch: true,
      });
    };

    startBackgroundTask();

    return () => {
      BackgroundFetch.unregisterTaskAsync("background-timer-task");
    };
  }, []);

  // Background fetch task to run timer in the background
  TaskManager.defineTask("background-timer-task", async () => {
    if (isRunning && timeLeft > 0) {
      setTimeLeft((prev) => prev - 1); // Continue counting down
    }
    return BackgroundFetch.Result.NewData;
  });

  // Snooze notification
  const snoozeNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    setTimeLeft(5 * 60); // Set snooze for 5 minutes
    triggerNotification(); // Trigger snooze notification
  };

  // Handle notification action
  Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === "snooze") {
      snoozeNotification(); // Snooze the timer when user clicks on the snooze button
    }
  });

  // Triggering a notification with a snooze button
  const triggerNotificationWithSnooze = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up!",
        body: "Click to snooze",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { isResting, cycle, totalCycles },
        actions: [
          {
            actionId: "snooze",
            buttonTitle: "Snooze",
            isDestructive: false,
          },
        ],
      },
      trigger: { seconds: 1 },
    });
  };

  useEffect(() => {
    if (isSoundPlaying) {
      triggerNotificationWithSnooze(); // Show notification with snooze button
    }
  }, [isSoundPlaying]);

  useEffect(() => {
    setIsDarkMode(colorScheme === "dark");
  }, [colorScheme]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f8f8f8" },
      ]}
    >
      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
        {isResting ? "Rest Time" : "Study Time"}
      </Text>
      <Text style={[styles.timer, { color: isDarkMode ? "#fff" : "#000" }]}>
        {formatTime(timeLeft)}
      </Text>

      {/* Start/Pause Button */}
      <TouchableOpacity
        onPress={() => {
          setIsRunning(!isRunning);
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{isRunning ? "Pause" : "Start"}</Text>
      </TouchableOpacity>

      {/* Reset Button */}
      <TouchableOpacity
        onPress={resetTimer}
        style={[styles.button, styles.resetButton]}
      >
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>

      {/* Stop Sound Button */}
      {isSoundPlaying && (
        <TouchableOpacity
          onPress={stopSound}
          style={[styles.button, styles.stopButton]}
        >
          <Text style={styles.buttonText}>Stop Sound</Text>
        </TouchableOpacity>
      )}

      {/* Cycle Adjustments */}
      <View style={styles.cycleContainer}>
        <Text
          style={[styles.cycleText, { color: isDarkMode ? "#fff" : "#000" }]}
        >
          Cycles: {totalCycles}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => setTotalCycles((prev) => Math.max(prev - 1, 1))}
            style={styles.cycleButton}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTotalCycles((prev) => prev + 1)}
            style={styles.cycleButton}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: 200,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#ff6347",
  },
  stopButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cycleContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  cycleText: {
    fontSize: 20,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 120,
  },
  cycleButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
  },
});
