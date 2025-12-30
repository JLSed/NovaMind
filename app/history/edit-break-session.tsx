import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BREAK_ACTIVITIES,
  BREAK_INTENTS,
  BREAK_TRIGGERS,
} from "@/constants/data";
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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditBreakSessionScreen() {
  const { date, index } = useLocalSearchParams();
  const router = useRouter();
  const sessionIndex = parseInt(index as string, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullLogData, setFullLogData] = useState<any>(null);

  // Pre-Session
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [trigger, setTrigger] = useState("");
  const [intent, setIntent] = useState("");
  const [plannedDuration, setPlannedDuration] = useState("15");

  // Post-Session
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [guiltRating, setGuiltRating] = useState("None");
  const [recoveryRating, setRecoveryRating] = useState("Medium");
  const [activities, setActivities] = useState<string[]>([]);
  const [userNotes, setUserNotes] = useState("");

  // Pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Helper: Parse time string relative to session date
  const parseTimeStr = useCallback(
    (timeStr: string) => {
      if (!timeStr) return null;
      const datePrefix = date as string;
      const cleanTime = timeStr.replace(/[\u202F\u00A0]/g, " ").trim();

      // Try standard parsing
      let d = new Date(`${datePrefix} ${cleanTime}`);
      if (!isNaN(d.getTime())) return d;

      // Fallback regex
      const match = cleanTime.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (match) {
        let [, hStr, mStr, sStr, period] = match;
        let h = parseInt(hStr);
        const m = parseInt(mStr);
        const s = sStr ? parseInt(sStr) : 0;
        if (period) {
          const p = period.toUpperCase();
          if (p === "PM" && h < 12) h += 12;
          if (p === "AM" && h === 12) h = 0;
        }
        const [year, month, day] = datePrefix.split("-").map(Number);
        return new Date(year, month - 1, day, h, m, s);
      }
      return null;
    },
    [date]
  );

  const fetchSessionData = useCallback(async () => {
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

      if (error) throw error;

      setFullLogData(data);
      const session = data.log_data.break_sessions[sessionIndex];

      if (session) {
        // Pre-Session
        const start = parseTimeStr(session.pre_session.start_time);
        if (start) setStartTime(start);

        setTrigger(session.trigger || "");
        setIntent(session.intent || "");
        setPlannedDuration(
          session.pre_session.planned_duration?.toString() || "15"
        );

        // Post-Session
        const end = parseTimeStr(session.post_session.end_time);
        if (end) setEndTime(end);

        setGuiltRating(session.post_session.guilt_rating || "None");
        setRecoveryRating(session.post_session.recovery_rating || "Medium");
        setActivities(session.activities || []);
        setUserNotes(session.post_session.user_notes || "");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      Alert.alert("Error", "Failed to load session data.");
    } finally {
      setLoading(false);
    }
  }, [date, sessionIndex, parseTimeStr]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Calculate duration
      const durationMs = endTime.getTime() - startTime.getTime();
      const totalDurationMinutes = Math.round(durationMs / 60000);

      if (totalDurationMinutes < 0) {
        Alert.alert("Error", "End time cannot be before start time.");
        setSaving(false);
        return;
      }

      const updatedSession = {
        ...fullLogData.log_data.break_sessions[sessionIndex],
        trigger,
        intent,
        activities,
        pre_session: {
          ...fullLogData.log_data.break_sessions[sessionIndex].pre_session,
          start_time: startTime.toLocaleTimeString(),
          planned_duration: parseInt(plannedDuration),
        },
        post_session: {
          ...fullLogData.log_data.break_sessions[sessionIndex].post_session,
          end_time: endTime.toLocaleTimeString(),
          total_duration_minutes: totalDurationMinutes,
          guilt_rating: guiltRating,
          recovery_rating: recoveryRating,
          user_notes: userNotes,
        },
      };

      const updatedBreakSessions = [...fullLogData.log_data.break_sessions];
      updatedBreakSessions[sessionIndex] = updatedSession;

      const updatedLogData = {
        ...fullLogData.log_data,
        break_sessions: updatedBreakSessions,
      };

      const { error } = await supabase
        .from("productivity_logs")
        .update({ log_data: updatedLogData })
        .eq("id", fullLogData.id);

      if (error) throw error;

      Alert.alert("Success", "Break session updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error saving session:", error);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivity = (activity: string) => {
    if (activities.includes(activity)) {
      setActivities(activities.filter((a) => a !== activity));
    } else {
      setActivities([...activities, activity]);
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
        <Text className="text-white text-xl font-bold">Edit Break Session</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Time Section */}
        <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
          <Text className="text-slate-400 font-bold mb-4 uppercase tracking-wider">
            Time & Duration
          </Text>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-2">Start Time</Text>
              <Pressable
                onPress={() => setShowStartTimePicker(true)}
                className="bg-slate-900 p-3 rounded-lg border border-slate-700"
              >
                <Text className="text-white font-bold text-center">
                  {startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-2">End Time</Text>
              <Pressable
                onPress={() => setShowEndTimePicker(true)}
                className="bg-slate-900 p-3 rounded-lg border border-slate-700"
              >
                <Text className="text-white font-bold text-center">
                  {endTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
            </View>
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowStartTimePicker(false);
                if (selectedDate) setStartTime(selectedDate);
              }}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowEndTimePicker(false);
                if (selectedDate) setEndTime(selectedDate);
              }}
            />
          )}
        </View>

        {/* Details Section */}
        <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
          <Text className="text-slate-400 font-bold mb-4 uppercase tracking-wider">
            Details
          </Text>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2">Trigger</Text>
            <View className="flex-row flex-wrap gap-2">
              {BREAK_TRIGGERS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTrigger(t)}
                  className={`px-3 py-2 rounded-lg border ${
                    trigger === t
                      ? "bg-teal-600 border-teal-600"
                      : "bg-slate-900 border-slate-700"
                  }`}
                >
                  <Text
                    className={
                      trigger === t ? "text-white font-bold" : "text-slate-400"
                    }
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2">Intent</Text>
            <View className="flex-row flex-wrap gap-2">
              {BREAK_INTENTS.map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setIntent(i)}
                  className={`px-3 py-2 rounded-lg border ${
                    intent === i
                      ? "bg-teal-600 border-teal-600"
                      : "bg-slate-900 border-slate-700"
                  }`}
                >
                  <Text
                    className={
                      intent === i ? "text-white font-bold" : "text-slate-400"
                    }
                  >
                    {i}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Ratings Section */}
        <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
          <Text className="text-slate-400 font-bold mb-4 uppercase tracking-wider">
            Ratings
          </Text>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2">Guilt Level</Text>
            <View className="flex-row justify-between bg-slate-900 p-1 rounded-lg border border-slate-700">
              {["None", "Low", "Medium", "High"].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setGuiltRating(r)}
                  className={`flex-1 py-2 rounded-md items-center ${
                    guiltRating === r ? "bg-teal-600" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      guiltRating === r ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-slate-400 text-xs mb-2">Recovery Level</Text>
            <View className="flex-row justify-between bg-slate-900 p-1 rounded-lg border border-slate-700">
              {["Low", "Medium", "High"].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRecoveryRating(r)}
                  className={`flex-1 py-2 rounded-md items-center ${
                    recoveryRating === r ? "bg-teal-600" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      recoveryRating === r ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Activities Section */}
        <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
          <Text className="text-slate-400 font-bold mb-4 uppercase tracking-wider">
            Activities
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BREAK_ACTIVITIES.map((activity) => (
              <Pressable
                key={activity}
                onPress={() => toggleActivity(activity)}
                className={`px-3 py-2 rounded-lg border ${
                  activities.includes(activity)
                    ? "bg-teal-600 border-teal-600"
                    : "bg-slate-900 border-slate-700"
                }`}
              >
                <Text
                  className={
                    activities.includes(activity)
                      ? "text-white font-bold"
                      : "text-slate-400"
                  }
                >
                  {activity}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
          <Text className="text-slate-400 font-bold mb-4 uppercase tracking-wider">
            Notes
          </Text>
          <TextInput
            className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 min-h-[100px]"
            multiline
            textAlignVertical="top"
            placeholder="Add notes about this break..."
            placeholderTextColor="#64748b"
            value={userNotes}
            onChangeText={setUserNotes}
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`p-4 rounded-xl items-center mb-10 ${
            saving ? "bg-slate-700" : "bg-teal-600 active:bg-teal-700"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
