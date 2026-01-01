import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOOD_OPTIONS, TAG_CATEGORIES } from "@/constants/data";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [outputRating, setOutputRating] = useState("Medium");
  const [endMood, setEndMood] = useState("");
  const [distractionLevel, setDistractionLevel] = useState("Low");
  const [userNotes, setUserNotes] = useState("");
  const [breaks, setBreaks] = useState<any[]>([]);

  // Pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [activeBreakPicker, setActiveBreakPicker] = useState<{
    index: number;
    field: "break_start" | "break_end";
  } | null>(null);

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
      const session = data.log_data.sessions[sessionIndex];

      if (session) {
        setJobCategory(session.job_category || "");

        // Parse Times
        let parsedStartTime = new Date();

        if (session.pre_session?.start_time) {
          const d = parseTimeStr(session.pre_session.start_time);
          if (d) {
            setStartTime(d);
            parsedStartTime = d;
          }
        }

        if (session.post_session) {
          let endTimeSet = false;
          if (session.post_session.end_time) {
            const d = parseTimeStr(session.post_session.end_time);
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

        setOutputRating(session.post_session?.output_rating || "Medium");
        setEndMood(session.post_session?.end_mood || "");
        setDistractionLevel(session.post_session?.distraction_level || "Low");
        setUserNotes(session.post_session?.user_notes || "");
        setBreaks(session.breaks || []);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      Alert.alert("Error", "Failed to load session data");
    } finally {
      setLoading(false);
    }
  }, [date, sessionIndex, parseTimeStr]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const toggleTag = (tag: string) => {
    if (contextTags.includes(tag)) {
      setContextTags(contextTags.filter((t) => t !== tag));
    } else {
      setContextTags([...contextTags, tag]);
    }
  };

  const addBreak = () => {
    setBreaks([
      ...breaks,
      {
        break_start: new Date().toLocaleTimeString(),
        break_end: new Date().toLocaleTimeString(),
        break_description: "",
      },
    ]);
  };

  const updateBreak = (index: number, field: string, value: string) => {
    const updatedBreaks = [...breaks];
    updatedBreaks[index] = { ...updatedBreaks[index], [field]: value };
    setBreaks(updatedBreaks);
  };

  const removeBreak = (index: number) => {
    Alert.alert("Delete Break", "Are you sure you want to delete this break?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedBreaks = breaks.filter((_, i) => i !== index);
          setBreaks(updatedBreaks);
        },
      },
    ]);
  };

  const calculateTotalBreakMinutes = (breaksList: any[]) => {
    if (!breaksList || breaksList.length === 0) return 0;

    let totalMinutes = 0;

    breaksList.forEach((brk) => {
      if (brk.break_start && brk.break_end) {
        const start = parseTimeStr(brk.break_start);
        const end = parseTimeStr(brk.break_end);

        if (start && end) {
          let diffMs = end.getTime() - start.getTime();
          if (diffMs < 0) diffMs = 0;
          totalMinutes += diffMs / 60000;
        }
      }
    });

    return Math.round(totalMinutes);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleSave = async () => {
    // Validation
    for (let i = 0; i < breaks.length; i++) {
      const brk = breaks[i];
      const bStart = parseTimeStr(brk.break_start);
      const bEnd = parseTimeStr(brk.break_end);

      if (!bStart || !bEnd) {
        Alert.alert("Error", `Invalid time format in Break #${i + 1}`);
        return;
      }

      if (bStart < startTime) {
        Alert.alert(
          "Invalid Break Time",
          `Break #${i + 1} starts before the session starts.`
        );
        return;
      }

      if (bEnd > endTime) {
        Alert.alert(
          "Invalid Break Time",
          `Break #${i + 1} ends after the session ends.`
        );
        return;
      }

      if (bStart >= bEnd) {
        Alert.alert(
          "Invalid Break Time",
          `Break #${i + 1} end time must be after start time.`
        );
        return;
      }
    }

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

      // Calculate break duration from breaks array
      const breakMinutes = calculateTotalBreakMinutes(breaks);
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
        breaks: breaks,
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
            <Text className="text-slate-400 mb-4 font-bold">
              Time & Duration
            </Text>

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
                Total Break Duration (Calculated)
              </Text>
              <View className="bg-slate-700 p-3 rounded-lg">
                <Text className="text-white text-center font-bold">
                  {formatDuration(calculateTotalBreakMinutes(breaks))}
                </Text>
              </View>
            </View>
          </View>

          {/* Pre-Session Details */}
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">
              Pre-Session
            </Text>

            <Text className="text-slate-400 mb-2">Mood</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {MOOD_OPTIONS.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => setSubjectiveMood(item.label)}
                  className={`w-[48%] p-3 rounded-xl border flex-col items-center justify-center gap-1 ${
                    subjectiveMood === item.label
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

          {/* Breaks Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Breaks</Text>
              <Pressable
                onPress={addBreak}
                className="bg-blue-600 px-3 py-1 rounded-lg"
              >
                <Text className="text-white font-bold text-sm">
                  + Add Break
                </Text>
              </Pressable>
            </View>

            {breaks.map((brk, idx) => (
              <View
                key={idx}
                className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4"
              >
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-400 font-bold">
                    Break #{idx + 1}
                  </Text>
                  <Pressable onPress={() => removeBreak(idx)}>
                    <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                  </Pressable>
                </View>

                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs mb-1">Start</Text>
                    <Pressable
                      onPress={() =>
                        setActiveBreakPicker({
                          index: idx,
                          field: "break_start",
                        })
                      }
                      className="bg-slate-900 p-2 rounded-lg border border-slate-700"
                    >
                      <Text className="text-white">{brk.break_start}</Text>
                    </Pressable>
                    {activeBreakPicker?.index === idx &&
                      activeBreakPicker?.field === "break_start" && (
                        <DateTimePicker
                          value={parseTimeStr(brk.break_start) || new Date()}
                          mode="time"
                          display="default"
                          onChange={(e, d) => {
                            setActiveBreakPicker(null);
                            if (d) {
                              updateBreak(
                                idx,
                                "break_start",
                                d.toLocaleTimeString()
                              );
                            }
                          }}
                        />
                      )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs mb-1">End</Text>
                    <Pressable
                      onPress={() =>
                        setActiveBreakPicker({ index: idx, field: "break_end" })
                      }
                      className="bg-slate-900 p-2 rounded-lg border border-slate-700"
                    >
                      <Text className="text-white">{brk.break_end}</Text>
                    </Pressable>
                    {activeBreakPicker?.index === idx &&
                      activeBreakPicker?.field === "break_end" && (
                        <DateTimePicker
                          value={parseTimeStr(brk.break_end) || new Date()}
                          mode="time"
                          display="default"
                          onChange={(e, d) => {
                            setActiveBreakPicker(null);
                            if (d) {
                              updateBreak(
                                idx,
                                "break_end",
                                d.toLocaleTimeString()
                              );
                            }
                          }}
                        />
                      )}
                  </View>
                </View>

                <View>
                  <Text className="text-slate-500 text-xs mb-1">Reason</Text>
                  <TextInput
                    className="bg-slate-900 text-white p-2 rounded-lg border border-slate-700"
                    value={brk.break_description}
                    onChangeText={(text) =>
                      updateBreak(idx, "break_description", text)
                    }
                    placeholder="Why did you take a break?"
                    placeholderTextColor="#64748b"
                  />
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
              {MOOD_OPTIONS.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => setEndMood(item.label)}
                  className={`w-[48%] p-3 rounded-xl border flex-col items-center justify-center gap-1 ${
                    endMood === item.label
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
