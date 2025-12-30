import { IconSymbol } from "@/components/ui/icon-symbol";
import { PHYSICAL_STATE_OPTIONS, WAKING_MOOD_OPTIONS } from "@/constants/data";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditDailyLogScreen() {
  const { date } = useLocalSearchParams();
  const router = useRouter();

  // Bio-Metrics State
  const [bedtime, setBedtime] = useState(new Date());
  const [waketime, setWaketime] = useState(new Date());
  const [mood, setMood] = useState("");
  const [physicalStates, setPhysicalStates] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWaketimePicker, setShowWaketimePicker] = useState(false);
  const [fullLogData, setFullLogData] = useState<any>(null);

  const fetchLog = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("productivity_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", date)
        .single();

      if (error) {
        console.error("Error fetching log:", error);
        Alert.alert("Error", "Failed to load data.");
        return;
      }

      setFullLogData(data);

      if (data.log_data?.daily_bio_metrics) {
        const metrics = data.log_data.daily_bio_metrics;
        if (metrics.sleep_bedtime) setBedtime(new Date(metrics.sleep_bedtime));
        if (metrics.sleep_waketime)
          setWaketime(new Date(metrics.sleep_waketime));
        if (metrics.waking_condition) setMood(metrics.waking_condition);
        if (metrics.physical_state) {
          setPhysicalStates(
            Array.isArray(metrics.physical_state)
              ? metrics.physical_state
              : [metrics.physical_state]
          );
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (date) fetchLog();
  }, [date, fetchLog]);

  const calculateSleepDuration = () => {
    let diffMs = waketime.getTime() - bedtime.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle crossing midnight
    }
    return (diffMs / (1000 * 60 * 60)).toFixed(1);
  };

  const togglePhysicalState = (state: string) => {
    if (physicalStates.includes(state)) {
      setPhysicalStates(physicalStates.filter((s) => s !== state));
    } else {
      setPhysicalStates([...physicalStates, state]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch latest data to ensure we don't overwrite sessions/breaks added in the meantime
      const { data: latestLog, error: fetchError } = await supabase
        .from("productivity_logs")
        .select("log_data")
        .eq("id", fullLogData.id)
        .single();

      if (fetchError) throw fetchError;

      const sleepDuration = calculateSleepDuration();

      const updatedLogData = {
        ...latestLog.log_data, // Use latest data from DB
        daily_bio_metrics: {
          sleep_bedtime: bedtime.toISOString(),
          sleep_waketime: waketime.toISOString(),
          sleep_duration_hours: parseFloat(sleepDuration),
          waking_condition: mood,
          physical_state: physicalStates,
        },
      };

      const { error } = await supabase
        .from("productivity_logs")
        .update({ log_data: updatedLogData })
        .eq("id", fullLogData.id);

      if (error) throw error;

      Alert.alert("Success", "Daily log updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error saving:", error);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="p-4 flex-row items-center justify-between border-b border-slate-800 bg-slate-900">
        <Pressable
          onPress={() => router.back()}
          className="p-2 rounded-full bg-slate-800"
        >
          <IconSymbol name="chevron.left" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-bold">Edit Daily Log</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded-lg ${
            saving ? "bg-blue-800" : "bg-blue-600"
          }`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Sleep Section */}
        <View className="mb-8">
          <Text className="text-slate-400 mb-4 font-bold uppercase tracking-wider">
            Sleep Hygiene
          </Text>
          <View className="bg-slate-800 p-4 rounded-xl border border-slate-700">
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
                    onChange={(e, d) => {
                      setShowBedtimePicker(false);
                      if (d) setBedtime(d);
                    }}
                  />
                )}
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-slate-500 mb-1">Wake Time</Text>
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
                    onChange={(e, d) => {
                      setShowWaketimePicker(false);
                      if (d) setWaketime(d);
                    }}
                  />
                )}
              </View>
            </View>
            <Text className="text-center text-slate-400">
              Total Sleep:{" "}
              <Text className="text-blue-400 font-bold text-lg">
                {calculateSleepDuration()} hrs
              </Text>
            </Text>
          </View>
        </View>

        {/* Mood Section */}
        <View className="mb-8">
          <Text className="text-slate-400 mb-4 font-bold uppercase tracking-wider">
            Waking Mood
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WAKING_MOOD_OPTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setMood(item.label)}
                className={`w-[48%] p-3 rounded-xl border flex-col items-center justify-center gap-1 ${
                  mood === item.label
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
        </View>

        {/* Physical State Section */}
        <View className="mb-8">
          <Text className="text-slate-400 mb-4 font-bold uppercase tracking-wider">
            Physical State
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {PHYSICAL_STATE_OPTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => togglePhysicalState(item.label)}
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
      </ScrollView>
    </SafeAreaView>
  );
}
