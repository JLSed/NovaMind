import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOOD_OPTIONS, PHYSICAL_STATE_OPTIONS } from "@/constants/data";
import { generateSchedule } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

const SCHEDULE_STORAGE_KEY = "nova_ai_schedule";

export default function ScheduleScreen() {
  const router = useRouter();

  // Current Status State (Right Now)
  const [currentMood, setCurrentMood] = useState("");
  const [currentPhysicalStates, setCurrentPhysicalStates] = useState<string[]>(
    []
  );
  const [userTasks, setUserTasks] = useState("");

  // Data from DB (Morning Log)
  const [morningLog, setMorningLog] = useState<any>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);

  // Helper to get local date string YYYY-MM-DD
  const getLocalYYYYMMDD = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const checkMorningLog = useCallback(async () => {
    try {
      // Load saved schedule
      const savedDataString = await AsyncStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (savedDataString) {
        try {
          const savedData = JSON.parse(savedDataString);
          // Only restore if it's from today
          if (savedData.date === getLocalYYYYMMDD()) {
            setScheduleData(savedData.schedule);
          }
        } catch (e) {
          // If parsing fails, ignore or handle legacy format
          console.log("Failed to parse saved schedule", e);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = getLocalYYYYMMDD();

      const { data: existingLog, error } = await supabase
        .from("productivity_logs")
        .select("log_data")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching log:", error);
        return;
      }

      if (existingLog && existingLog.log_data?.daily_bio_metrics) {
        setMorningLog(existingLog.log_data.daily_bio_metrics);
      } else {
        // No morning log found -> Redirect to Daily Log Screen
        router.replace("/daily-log");
      }
    } catch (err) {
      console.error("Unexpected error fetching log:", err);
    }
  }, [router]);

  // Check for morning log on focus
  useFocusEffect(
    useCallback(() => {
      checkMorningLog();
    }, [checkMorningLog])
  );

  const handleGenerateSchedule = async () => {
    if (!currentMood) {
      Alert.alert("Missing Info", "Please tell us how you feel right now.");
      return;
    }

    if (!morningLog) {
      Alert.alert("Error", "Morning log missing. Please check in first.");
      router.replace("/daily-log");
      return;
    }

    setLoading(true);
    setScheduleData(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in.");
        setLoading(false);
        return;
      }

      const { data: historyLogs, error: historyError } = await supabase
        .from("productivity_logs")
        .select("log_data")
        .order("entry_date", { ascending: false })
        .limit(14);

      if (historyError) throw historyError;

      const currentStatus = {
        mood: currentMood,
        physical_state: currentPhysicalStates,
      };

      const aiResponse = await generateSchedule(
        historyLogs?.map((log) => log.log_data) || [],
        morningLog,
        currentStatus,
        userTasks
      );

      let parsedData;
      try {
        const cleanJson = aiResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        parsedData = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
        Alert.alert("Error", "Failed to parse AI response. Please try again.");
        return;
      }

      setScheduleData(parsedData);

      // Save with date to ensure freshness
      const dataToSave = {
        date: getLocalYYYYMMDD(),
        schedule: parsedData,
      };
      await AsyncStorage.setItem(
        SCHEDULE_STORAGE_KEY,
        JSON.stringify(dataToSave)
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView contentContainerClassName="p-6">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-white text-3xl font-bold">
            Schedule Generator
          </Text>
          <View className="flex-row gap-2">
            <Link href="/daily-log" asChild>
              <Pressable className="bg-slate-800 p-2 rounded-full border border-slate-700 active:bg-slate-700">
                <IconSymbol name="pencil" size={24} color="#94a3b8" />
              </Pressable>
            </Link>
            <Link href="/wiki" asChild>
              <Pressable className="bg-slate-800 p-2 rounded-full border border-slate-700 active:bg-slate-700">
                <IconSymbol name="info.circle" size={24} color="#60a5fa" />
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Current Status Section */}
        <View className="mb-8">
          <Text className="text-slate-400 mb-2 text-lg">
            How do you feel RIGHT NOW?
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {MOOD_OPTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setCurrentMood(item.label)}
                className={`w-[48%] p-3 rounded-xl border flex-col items-center justify-center gap-1 ${
                  currentMood === item.label
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">{item.emoji}</Text>
                  <Text className="text-white font-bold">{item.label}</Text>
                </View>
                <Text className="text-slate-400 text-xs text-center">
                  {item.desc}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2 text-lg">
            Current Physical State (Select all that apply)
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {PHYSICAL_STATE_OPTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  if (currentPhysicalStates.includes(item.label)) {
                    setCurrentPhysicalStates(
                      currentPhysicalStates.filter((s) => s !== item.label)
                    );
                  } else {
                    setCurrentPhysicalStates([
                      ...currentPhysicalStates,
                      item.label,
                    ]);
                  }
                }}
                className={`p-3 rounded-xl border flex-row items-center gap-2 ${
                  currentPhysicalStates.includes(item.label)
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-xl">{item.emoji}</Text>
                <Text className="text-white font-bold">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2 text-lg mt-4">
            Tasks you want to do today (Optional)
          </Text>
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700"
            placeholder="e.g., Finish report, Gym, Read book..."
            placeholderTextColor="#64748b"
            value={userTasks}
            onChangeText={setUserTasks}
            multiline
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleGenerateSchedule}
          disabled={loading}
          className={`p-4 rounded-full items-center ${
            loading ? "bg-blue-800" : "bg-blue-600 active:bg-blue-700"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Generate Schedule
            </Text>
          )}
        </Pressable>

        {/* AI Response Display */}
        {scheduleData ? (
          <View className="mt-8">
            <Text className="text-blue-400 font-bold text-xl mb-4">
              Your AI Plan
            </Text>

            {/* Recommended Flow - Timeline */}
            <View className="mb-3">
              <Text className="text-blue-300 font-bold text-lg mb-4">
                🕒 Recommended Flow
              </Text>
              <View className="">
                {scheduleData.recommendedFlow?.map(
                  (item: any, index: number) => (
                    <View key={index} className="flex-row mb-4">
                      {/* Time Column */}
                      <View className="border-r-2 border-slate-600 pr-3 pl-2 items-end pt-1">
                        <Text className="text-slate-400 font-bold text-sm">
                          {item.timeRange.split("-")[0].trim()}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          {item.timeRange.split("-")[1]?.trim()}
                        </Text>
                      </View>

                      {/* Content Column */}
                      <View className="flex-1 pl-3 pb-2">
                        <Text className="text-white font-bold text-lg">
                          {item.taskType}
                        </Text>
                        <Text className="text-slate-400 text-base mt-1">
                          {item.reason}
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            </View>

            {/* Daily Prediction */}
            <View className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
              <Text className="text-blue-400 font-bold text-lg mb-2">
                📊 Daily Prediction
              </Text>
              <Markdown
                style={{
                  body: { color: "#e2e8f0", fontSize: 16 },
                  strong: { color: "#60a5fa", fontWeight: "bold" },
                }}
              >
                {scheduleData.dailyPrediction || ""}
              </Markdown>
            </View>

            {/* Insight */}
            <View className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <Text className="text-yellow-400 font-bold text-lg mb-2">
                💡 Insight
              </Text>
              <Markdown
                style={{
                  body: { color: "#e2e8f0", fontSize: 16 },
                  strong: { color: "#60a5fa", fontWeight: "bold" },
                }}
              >
                {scheduleData.insight || ""}
              </Markdown>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
