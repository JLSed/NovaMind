import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

const TAG_CATEGORIES = [
  {
    title: "Fuel (Intake & Biology)",
    tags: [
      "Caffeinated",
      "Fasted",
      "Heavy Meal",
      "Hydrated",
      "Sugar Rush",
      "Medicated",
      "Post-Workout",
      "Post-Nap",
    ],
  },
  {
    title: "Environment (Location & Vibe)",
    tags: [
      "Home Office",
      "Cafe / Public",
      "Bedroom",
      "Outdoors",
      "Quiet Zone",
      "Noisy",
      "Cold Room",
      "Warm Room",
    ],
  },
  {
    title: "Sensory (Audio & Visual)",
    tags: [
      "No Music",
      "Lyrical Music",
      "Instrumental / Lo-Fi",
      "White Noise",
      "Phone Away",
      "Notifications On",
    ],
  },
  {
    title: "Pressure (Psychological State)",
    tags: ["Deadline", "Backlog", "Passion Project", "Forced", "Blocked"],
  },
  {
    title: "Social",
    tags: ["Alone", "Co-working", "Interrupted"],
  },
];

export default function EditSessionScreen() {
  const { date, index } = useLocalSearchParams();
  const router = useRouter();
  const sessionIndex = parseInt(index as string, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullLogData, setFullLogData] = useState<any>(null);

  // Form State
  const [jobCategory, setJobCategory] = useState("");

  // Pre-Session
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [subjectiveMood, setSubjectiveMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState("5");
  const [contextTags, setContextTags] = useState<string[]>([]);

  // Post-Session
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [breakDuration, setBreakDuration] = useState("0");
  const [outputRating, setOutputRating] = useState("Medium");
  const [endMood, setEndMood] = useState("");
  const [distractionLevel, setDistractionLevel] = useState("Low");
  const [userNotes, setUserNotes] = useState("");

  // Pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [date, index]);

  const fetchSessionData = async () => {
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
      const session = data.log_data.sessions[sessionIndex];

      if (session) {
        setJobCategory(session.job_category || "");

        // Parse Times
        const datePrefix = date as string;
        let parsedStartTime = new Date();

        const parseTimeStr = (dateStr: string, timeStr: string) => {
          if (!timeStr) return null;
          // Clean invisible characters (like narrow non-breaking space)
          const cleanTime = timeStr.replace(/[\u202F\u00A0]/g, " ").trim();

          // Try standard parsing
          let d = new Date(`${dateStr} ${cleanTime}`);
          if (!isNaN(d.getTime())) return d;

          // Fallback: Manual Parse
          // Matches 8:24:36 AM or 8:24 AM or 08:24:36
          const match = cleanTime.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
          if (match) {
            let [_, hStr, mStr, sStr, period] = match;
            let h = parseInt(hStr);
            const m = parseInt(mStr);
            const s = sStr ? parseInt(sStr) : 0;

            if (period) {
              const p = period.toUpperCase();
              if (p === "PM" && h < 12) h += 12;
              if (p === "AM" && h === 12) h = 0;
            }

            const [year, month, day] = dateStr.split("-").map(Number);
            // Note: month is 0-indexed in Date constructor
            return new Date(year, month - 1, day, h, m, s);
          }
          return null;
        };

        if (session.pre_session?.start_time) {
          const d = parseTimeStr(datePrefix, session.pre_session.start_time);
          if (d) {
            setStartTime(d);
            parsedStartTime = d;
          }
        }

        if (session.post_session) {
          let endTimeSet = false;
          if (session.post_session.end_time) {
            const d = parseTimeStr(datePrefix, session.post_session.end_time);
            if (d) {
              setEndTime(d);
              endTimeSet = true;
            }
          }

          // Fallback: Calculate from start time + duration if end time parsing failed or was missing
          if (!endTimeSet && session.post_session.total_duration_minutes) {
            const endMs =
              parsedStartTime.getTime() +
              session.post_session.total_duration_minutes * 60000;
            setEndTime(new Date(endMs));
          }
        }

        setSubjectiveMood(session.pre_session?.subjective_mood || "");
        setEnergyLevel(session.pre_session?.energy_level?.toString() || "5");
        setContextTags(session.pre_session?.context_tags || []);

        setBreakDuration(
          session.post_session?.break_duration_minutes?.toString() || "0"
        );
        setOutputRating(session.post_session?.output_rating || "Medium");
        setEndMood(session.post_session?.end_mood || "");
        setDistractionLevel(session.post_session?.distraction_level || "Low");
        setUserNotes(session.post_session?.user_notes || "");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      Alert.alert("Error", "Failed to load session data");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (contextTags.includes(tag)) {
      setContextTags(contextTags.filter((t) => t !== tag));
    } else {
      setContextTags([...contextTags, tag]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Recalculate durations
      const startMs = startTime.getTime();
      const endMs = endTime.getTime();
      const totalDurationMinutes = Math.round((endMs - startMs) / 60000);
      const breakMinutes = parseInt(breakDuration) || 0;
      const netFocusMinutes = totalDurationMinutes - breakMinutes;

      const updatedSession = {
        ...fullLogData.log_data.sessions[sessionIndex],
        job_category: jobCategory,
        pre_session: {
          start_time: startTime.toLocaleTimeString(),
          subjective_mood: subjectiveMood,
          context_tags: contextTags,
          energy_level: parseInt(energyLevel),
        },
        post_session: {
          end_time: endTime.toLocaleTimeString(),
          total_duration_minutes: totalDurationMinutes,
          break_duration_minutes: breakMinutes,
          net_focus_minutes: netFocusMinutes,
          output_rating: outputRating,
          end_mood: endMood,
          distraction_level: distractionLevel,
          user_notes: userNotes,
        },
      };

      const updatedSessions = [...fullLogData.log_data.sessions];
      updatedSessions[sessionIndex] = updatedSession;

      const updatedLogData = {
        ...fullLogData.log_data,
        sessions: updatedSessions,
      };

      const { error } = await supabase
        .from("productivity_logs")
        .update({ log_data: updatedLogData })
        .eq("user_id", user.id)
        .eq("entry_date", date);

      if (error) throw error;

      Alert.alert("Success", "Session updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
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
        <Text className="text-white text-xl font-bold">Edit Session</Text>
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

      <ScrollView contentContainerClassName="p-4 pb-20">
        {/* Job Category */}
        <View className="mb-6">
          <Text className="text-slate-400 mb-2 font-bold">Job Category</Text>
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl text-lg border border-slate-700"
            value={jobCategory}
            onChangeText={setJobCategory}
            placeholder="e.g. Coding"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Time Section */}
        <View className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <Text className="text-slate-400 mb-4 font-bold">Time & Duration</Text>

          <View className="flex-row justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-slate-500 mb-1">Start Time</Text>
              <Pressable
                onPress={() => setShowStartTimePicker(true)}
                className="bg-slate-700 p-3 rounded-lg"
              >
                <Text className="text-white text-center">
                  {startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setShowStartTimePicker(false);
                    if (d) setStartTime(d);
                  }}
                />
              )}
            </View>

            <View className="flex-1 ml-2">
              <Text className="text-slate-500 mb-1">End Time</Text>
              <Pressable
                onPress={() => setShowEndTimePicker(true)}
                className="bg-slate-700 p-3 rounded-lg"
              >
                <Text className="text-white text-center">
                  {endTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Pressable>
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setShowEndTimePicker(false);
                    if (d) setEndTime(d);
                  }}
                />
              )}
            </View>
          </View>

          <View>
            <Text className="text-slate-500 mb-1">
              Break Duration (minutes)
            </Text>
            <TextInput
              className="bg-slate-700 text-white p-3 rounded-lg text-center"
              value={breakDuration}
              onChangeText={setBreakDuration}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Pre-Session Details */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-4">Pre-Session</Text>

          <Text className="text-slate-400 mb-2">Mood</Text>
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
                onPress={() => setSubjectiveMood(item.label)}
                className={`w-[48%] p-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                  subjectiveMood === item.label
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-2xl">{item.emoji}</Text>
                <Text className="text-white font-bold">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2">Energy Level</Text>
          <View className="flex-row justify-between bg-slate-800 p-2 rounded-xl border border-slate-700 mb-4">
            {[1, 3, 5, 7, 9].map((level) => (
              <Pressable
                key={level}
                onPress={() => setEnergyLevel(level.toString())}
                className={`p-3 rounded-lg ${
                  energyLevel === level.toString()
                    ? "bg-blue-600"
                    : "bg-transparent"
                }`}
              >
                <Text className="text-white font-bold">{level}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2">Context Tags</Text>
          {TAG_CATEGORIES.map((category) => (
            <View key={category.title} className="mb-4">
              <Text className="text-slate-500 text-xs font-bold mb-2 uppercase">
                {category.title}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-lg border ${
                      contextTags.includes(tag)
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        contextTags.includes(tag)
                          ? "text-white font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Post-Session Details */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-4">
            Post-Session
          </Text>

          <Text className="text-slate-400 mb-2">Output Rating</Text>
          <View className="flex-row gap-2 mb-4">
            {["Low", "Medium", "High"].map((rating) => (
              <Pressable
                key={rating}
                onPress={() => setOutputRating(rating)}
                className={`flex-1 p-3 rounded-lg items-center border ${
                  outputRating === rating
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-white font-bold">{rating}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2">End Mood</Text>
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
                onPress={() => setEndMood(item.label)}
                className={`w-[48%] p-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                  endMood === item.label
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-2xl">{item.emoji}</Text>
                <Text className="text-white font-bold">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2">Distraction Level</Text>
          <View className="flex-row gap-2 mb-4">
            {["None", "Low", "Medium", "High"].map((level) => (
              <Pressable
                key={level}
                onPress={() => setDistractionLevel(level)}
                className={`flex-1 p-3 rounded-lg items-center border ${
                  distractionLevel === level
                    ? "bg-purple-600 border-purple-600"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <Text className="text-white font-bold">{level}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-slate-400 mb-2">Notes</Text>
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl text-lg border border-slate-700 h-24"
            placeholder="Any thoughts?"
            placeholderTextColor="#64748b"
            multiline
            textAlignVertical="top"
            value={userNotes}
            onChangeText={setUserNotes}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
