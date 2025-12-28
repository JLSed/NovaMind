import { IconSymbol } from "@/components/ui/icon-symbol";
import { generateSchedule } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DailyLogScreen() {
  // Bio-Metrics State
  const [bedtime, setBedtime] = useState(
    new Date(new Date().setHours(23, 0, 0, 0))
  );
  const [waketime, setWaketime] = useState(
    new Date(new Date().setHours(7, 0, 0, 0))
  );
  const [mood, setMood] = useState("");
  const [physicalStates, setPhysicalStates] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWaketimePicker, setShowWaketimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch today's log on mount
  useEffect(() => {
    fetchTodayLog();
  }, []);

  const fetchTodayLog = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

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
        const metrics = existingLog.log_data.daily_bio_metrics;

        // Populate state with existing data
        if (metrics.sleep_bedtime) setBedtime(new Date(metrics.sleep_bedtime));
        if (metrics.sleep_waketime)
          setWaketime(new Date(metrics.sleep_waketime));
        if (metrics.waking_condition) setMood(metrics.waking_condition);
        if (metrics.physical_state) {
          if (Array.isArray(metrics.physical_state)) {
            setPhysicalStates(metrics.physical_state);
          } else {
            // Backward compatibility for string
            setPhysicalStates([metrics.physical_state]);
          }
        }

        setIsEditing(true);
      }
    } catch (err) {
      console.error("Unexpected error fetching log:", err);
    }
  };

  const calculateSleepDuration = () => {
    let diffMs = waketime.getTime() - bedtime.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle crossing midnight
    }
    return (diffMs / (1000 * 60 * 60)).toFixed(1);
  };

  const handleGenerateSchedule = async () => {
    if (!mood) {
      Alert.alert("Missing Info", "Please tell us how you feel.");
      return;
    }

    setLoading(true);
    setAdvice("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to save data.");
        setLoading(false);
        return;
      }

      const { data: historyLogs, error: historyError } = await supabase
        .from("productivity_logs")
        .select("log_data")
        .order("entry_date", { ascending: false })
        .limit(14);

      if (historyError) throw historyError;

      const sleepDuration = parseFloat(calculateSleepDuration());

      const dailyBioMetrics = {
        sleep_bedtime: bedtime.toISOString(),
        sleep_waketime: waketime.toISOString(),
        sleep_duration_hours: sleepDuration,
        waking_condition: mood,
        physical_state: physicalStates,
      };

      const aiResponse = await generateSchedule(
        historyLogs?.map((log) => log.log_data) || [],
        dailyBioMetrics
      );

      setAdvice(aiResponse);

      const today = new Date().toISOString().split("T")[0];

      // If editing, we need to preserve existing sessions
      let logDataToSave = {
        daily_bio_metrics: dailyBioMetrics,
        sessions: [],
      };

      if (isEditing) {
        const { data: existingLog } = await supabase
          .from("productivity_logs")
          .select("log_data")
          .eq("user_id", user.id)
          .eq("entry_date", today)
          .single();

        if (existingLog) {
          logDataToSave.sessions = existingLog.log_data.sessions || [];
        }
      }

      const { error: saveError } = await supabase
        .from("productivity_logs")
        .upsert(
          {
            user_id: user.id,
            entry_date: today,
            log_data: logDataToSave,
          },
          { onConflict: "user_id, entry_date" }
        );

      if (saveError) throw saveError;

      setIsEditing(true);
      Alert.alert(
        "Success",
        isEditing ? "Sleep data updated!" : "Schedule generated!"
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  };

  const onBedtimeChange = (event: any, selectedDate?: Date) => {
    setShowBedtimePicker(false);
    if (selectedDate) setBedtime(selectedDate);
  };

  const onWaketimeChange = (event: any, selectedDate?: Date) => {
    setShowWaketimePicker(false);
    if (selectedDate) setWaketime(selectedDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView contentContainerClassName="p-6">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-white text-3xl font-bold">
            {isEditing ? "Update Sleep Data 🌙" : "Good Morning ☀️"}
          </Text>
          <Link href="/wiki" asChild>
            <Pressable className="bg-slate-800 p-2 rounded-full border border-slate-700 active:bg-slate-700">
              <IconSymbol name="info.circle" size={24} color="#60a5fa" />
            </Pressable>
          </Link>
        </View>

        {/* Sleep Section */}
        <View className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <Text className="text-slate-400 mb-4 text-lg font-semibold">
            Sleep Cycle
          </Text>

          <View className="flex-row justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-slate-500 mb-1">Bedtime</Text>
              <Pressable
                onPress={() => setShowBedtimePicker(true)}
                className="bg-slate-700 p-3 rounded-lg"
              >
                <Text className="text-white text-center">
                  {bedtime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
              {showBedtimePicker && (
                <DateTimePicker
                  value={bedtime}
                  mode="time"
                  display="default"
                  onChange={onBedtimeChange}
                />
              )}
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-slate-500 mb-1">Wake Up</Text>
              <Pressable
                onPress={() => setShowWaketimePicker(true)}
                className="bg-slate-700 p-3 rounded-lg"
              >
                <Text className="text-white text-center">
                  {waketime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
              {showWaketimePicker && (
                <DateTimePicker
                  value={waketime}
                  mode="time"
                  display="default"
                  onChange={onWaketimeChange}
                />
              )}
            </View>
          </View>

          <Text className="text-blue-400 text-center font-bold">
            Total Sleep: {calculateSleepDuration()} hrs
          </Text>
        </View>

        {/* Mood Section */}
        <View className="mb-8">
          <Text className="text-slate-400 mb-2 text-lg">
            How do you feel mentally?
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {[
              { label: "On Fire", emoji: "🔥" },
              { label: "Focused", emoji: "🧠" },
              { label: "Anxious", emoji: "😰" },
              { label: "Bored", emoji: "😑" },
              { label: "Foggy", emoji: "☁️" },
              { label: "Resistance", emoji: "🛑" },
              { label: "Drained", emoji: "🔋" },
              { label: "Neutral", emoji: "😐" },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setMood(item.label)}
                className={`w-[48%] p-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                  mood === item.label
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-2xl">{item.emoji}</Text>
                <Text className="text-white font-bold">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2 text-lg">
            Physical State (Select all that apply)
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: "Fresh", emoji: "🌿" },
              { label: "Groggy", emoji: "😵‍💫" },
              { label: "Sleep Deprived", emoji: "😴" },
              { label: "Caffeinated", emoji: "☕" },
              { label: "Medicated", emoji: "💊" },
              { label: "Food Coma", emoji: "🍱" },
              { label: "Fasted", emoji: "🍽️" },
              { label: "Headache", emoji: "🤕" },
              { label: "Sick", emoji: "🤒" },
              { label: "Sore", emoji: "🏋️" },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  if (physicalStates.includes(item.label)) {
                    setPhysicalStates(
                      physicalStates.filter((s) => s !== item.label)
                    );
                  } else {
                    setPhysicalStates([...physicalStates, item.label]);
                  }
                }}
                className={`p-3 rounded-xl border flex-row items-center gap-2 ${
                  physicalStates.includes(item.label)
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-xl">{item.emoji}</Text>
                <Text className="text-white font-bold">{item.label}</Text>
              </Pressable>
            ))}
          </View>
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
              {isEditing ? "Update & Regenerate" : "Generate Schedule"}
            </Text>
          )}
        </Pressable>

        {/* AI Response Display */}
        {advice ? (
          <View className="mt-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
            <Text className="text-blue-400 font-bold text-xl mb-4">
              Your AI Plan
            </Text>
            <Markdown
              style={{
                body: { color: "#e2e8f0", fontSize: 16 },
                heading1: {
                  color: "#ffffff",
                  fontWeight: "bold",
                  marginBottom: 10,
                },
                heading2: {
                  color: "#93c5fd",
                  fontWeight: "bold",
                  marginTop: 20,
                  marginBottom: 10,
                },
                strong: { color: "#60a5fa", fontWeight: "bold" },
              }}
            >
              {advice}
            </Markdown>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
