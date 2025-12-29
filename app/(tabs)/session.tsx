import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Types based on the JSON structure
type SessionPhase = "idle" | "pre-session" | "active" | "post-session";

const CURRENT_SESSION_KEY = "nova_current_session";

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

export default function SessionScreen() {
  const [phase, setPhase] = useState<SessionPhase>("idle");

  // Pre-Session State
  const [jobCategory, setJobCategory] = useState("");
  const [subjectiveMood, setSubjectiveMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState("5");
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  // Active Session State
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [accumulatedBreakTime, setAccumulatedBreakTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0); // For display only
  const [breaks, setBreaks] = useState<any[]>([]);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakReason, setBreakReason] = useState("");

  // Post-Session State
  const [outputRating, setOutputRating] = useState("Medium");
  const [endMood, setEndMood] = useState("");
  const [distractionLevel, setDistractionLevel] = useState("Low");
  const [userNotes, setUserNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const timerRef = useRef<any>(null);

  // Load session on mount
  useEffect(() => {
    loadCurrentSession();
  }, []);

  // Save session on change
  const saveCurrentSession = useCallback(async () => {
    try {
      const sessionData = {
        phase,
        jobCategory,
        subjectiveMood,
        energyLevel,
        contextTags,
        startTime,
        isOnBreak,
        breakStartTime,
        accumulatedBreakTime,
        outputRating,
        endMood,
        distractionLevel,
        userNotes,
        breaks,
        breakReason,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        CURRENT_SESSION_KEY,
        JSON.stringify(sessionData)
      );
    } catch (e) {
      console.error("Failed to save session", e);
    }
  }, [
    phase,
    jobCategory,
    subjectiveMood,
    energyLevel,
    contextTags,
    startTime,
    isOnBreak,
    breakStartTime,
    accumulatedBreakTime,
    outputRating,
    endMood,
    distractionLevel,
    userNotes,
    breaks,
    breakReason,
  ]);

  useEffect(() => {
    if (isLoaded && phase !== "idle") {
      saveCurrentSession();
    }
  }, [isLoaded, phase, saveCurrentSession]);

  const loadCurrentSession = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        // Restore state
        setPhase(data.phase);
        setJobCategory(data.jobCategory);
        setSubjectiveMood(data.subjectiveMood);
        setEnergyLevel(data.energyLevel);
        setContextTags(data.contextTags);
        setStartTime(data.startTime);
        setIsOnBreak(data.isOnBreak);
        setBreakStartTime(data.breakStartTime);
        setAccumulatedBreakTime(data.accumulatedBreakTime);
        setOutputRating(data.outputRating);
        setEndMood(data.endMood);
        setDistractionLevel(data.distractionLevel);
        setUserNotes(data.userNotes);
        setBreaks(data.breaks || []);
        setBreakReason(data.breakReason || "");

        // Recalculate elapsed time if active
        if (data.phase === "active" && data.startTime) {
          const now = Date.now();
          setElapsedTime(now - data.startTime);
        }
      }
    } catch (e) {
      console.error("Failed to load session", e);
    } finally {
      setIsLoaded(true);
    }
  };

  const clearCurrentSession = async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelSession = () => {
    setPhase("idle");
    clearCurrentSession();
    // Reset other state if needed, though setPhase('idle') usually hides them
    setJobCategory("");
    setSubjectiveMood("");
    setContextTags([]);
  };

  const handleDiscardSession = () => {
    Alert.alert(
      "Discard Session?",
      "Are you sure you want to discard this session? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            handleCancelSession();
            // Also reset post-session specific state
            setStartTime(null);
            setAccumulatedBreakTime(0);
            setElapsedTime(0);
            setIsOnBreak(false);
            setUserNotes("");
            setEndMood("");
          },
        },
      ]
    );
  };

  // Timer Logic
  useEffect(() => {
    if (phase === "active" && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        setElapsedTime(now - startTime);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleTag = (tag: string) => {
    if (contextTags.includes(tag)) {
      setContextTags(contextTags.filter((t) => t !== tag));
    } else {
      setContextTags([...contextTags, tag]);
    }
  };

  const handleStartSession = () => {
    if (!jobCategory || !subjectiveMood) {
      Alert.alert("Missing Info", "Please fill in the category and your mood.");
      return;
    }
    const now = Date.now();
    console.log("Starting session at:", now);
    setStartTime(now);
    setPhase("active");
  };

  const handleToggleBreak = () => {
    const now = Date.now();
    if (isOnBreak) {
      // End Break
      if (breakStartTime) {
        const breakDuration = now - breakStartTime;
        console.log("Ending break. Duration (ms):", breakDuration);
        setAccumulatedBreakTime((prev) => {
          const newTotal = prev + breakDuration;
          console.log("New accumulated break time (ms):", newTotal);
          return newTotal;
        });

        // Add to breaks list
        setBreaks((prev) => [
          ...prev,
          {
            break_start: new Date(breakStartTime).toLocaleTimeString(),
            break_end: new Date(now).toLocaleTimeString(),
            break_description: breakReason,
          },
        ]);
      }
      setBreakStartTime(null);
      setIsOnBreak(false);
      setBreakReason("");
    } else {
      // Start Break - Show Modal
      setShowBreakModal(true);
    }
  };

  const confirmStartBreak = () => {
    if (!breakReason.trim()) {
      Alert.alert("Reason Required", "Please enter a reason for your break.");
      return;
    }
    const now = Date.now();
    console.log("Starting break at:", now);
    setBreakStartTime(now);
    setIsOnBreak(true);
    setShowBreakModal(false);
  };

  const handleEndSession = () => {
    const now = Date.now();
    console.log("Ending session at:", now);
    // If ending while on break, add the final partial break
    if (isOnBreak && breakStartTime) {
      const finalBreakChunk = now - breakStartTime;
      console.log(
        "Ending session during break. Adding final chunk (ms):",
        finalBreakChunk
      );
      setAccumulatedBreakTime((prev) => prev + finalBreakChunk);

      // Add to breaks list
      setBreaks((prev) => [
        ...prev,
        {
          break_start: new Date(breakStartTime).toLocaleTimeString(),
          break_end: new Date(now).toLocaleTimeString(),
          break_description: breakReason,
        },
      ]);
    }
    setPhase("post-session");
  };

  // Helper to get local date string YYYY-MM-DD
  const getLocalYYYYMMDD = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateTotalBreakMinutes = (breaksList: any[]) => {
    if (!breaksList || breaksList.length === 0) return 0;

    let totalMinutes = 0;
    const today = new Date().toISOString().split("T")[0]; // Use today for parsing context

    breaksList.forEach((brk) => {
      if (brk.break_start && brk.break_end) {
        // Simple parsing assuming standard time format or Date string
        // Since we save as toLocaleTimeString(), we need to be careful.
        // Best effort: try to parse.
        const start = new Date(`${today} ${brk.break_start}`);
        const end = new Date(`${today} ${brk.break_end}`);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          let diffMs = end.getTime() - start.getTime();
          if (diffMs < 0) {
            // Handle crossing midnight or parsing errors where end < start
            // For now, ignore negative durations or assume next day?
            // Let's assume same day for simplicity in this context
            diffMs = 0;
          }
          totalMinutes += diffMs / 60000;
        }
      }
    });

    return Math.round(totalMinutes);
  };

  const handleSaveSession = async () => {
    console.log("Attempting to save session...");
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user logged in");
        Alert.alert("Error", "You must be logged in.");
        setLoading(false);
        return;
      }

      const endTime = Date.now();
      const totalDurationMs = startTime ? endTime - startTime : 0;
      const totalDurationMinutes = Math.round(totalDurationMs / 60000);

      // Calculate break duration from the breaks array
      const breakDurationMinutes = calculateTotalBreakMinutes(breaks);

      const netFocusMinutes = totalDurationMinutes - breakDurationMinutes;

      console.log("Session Calculations:", {
        startTime,
        endTime,
        totalDurationMs,
        accumulatedBreakTime,
        totalDurationMinutes,
        breakDurationMinutes,
        netFocusMinutes,
      });

      const newSession = {
        session_id: `sess_${Date.now()}`,
        job_category: jobCategory,
        pre_session: {
          start_time: startTime ? new Date(startTime).toLocaleTimeString() : "",
          subjective_mood: subjectiveMood,
          context_tags: contextTags,
          energy_level: parseInt(energyLevel),
        },
        breaks: breaks,
        post_session: {
          end_time: new Date(endTime).toLocaleTimeString(),
          total_duration_minutes: totalDurationMinutes,
          break_duration_minutes: breakDurationMinutes,
          net_focus_minutes: netFocusMinutes,
          output_rating: outputRating,
          end_mood: endMood,
          distraction_level: distractionLevel,
          user_notes: userNotes,
        },
      };

      console.log("New Session Object:", JSON.stringify(newSession, null, 2));

      const today = getLocalYYYYMMDD();

      // Fetch existing log
      const { data: existingLog, error: fetchError } = await supabase
        .from("productivity_logs")
        .select("log_data")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "Row not found"
        console.error("Error fetching existing log:", fetchError);
      }

      let logData = existingLog?.log_data || { sessions: [] };

      // Ensure sessions array exists
      if (!logData.sessions) logData.sessions = [];

      // Append new session
      logData.sessions.push(newSession);

      // Upsert
      const { error: saveError } = await supabase
        .from("productivity_logs")
        .upsert(
          {
            user_id: user.id,
            entry_date: today,
            log_data: logData,
          },
          { onConflict: "user_id, entry_date" }
        );

      if (saveError) {
        console.error("Error saving session to Supabase:", saveError);
        throw saveError;
      }

      console.log("Session saved successfully to Supabase");
      Alert.alert("Success", "Session saved successfully!");

      // Clear persistent storage
      await clearCurrentSession();

      // Reset State
      setPhase("idle");
      setJobCategory("");
      setSubjectiveMood("");
      setContextTags([]);
      setStartTime(null);
      setAccumulatedBreakTime(0);
      setElapsedTime(0);
      setIsOnBreak(false);
      setUserNotes("");
      setEndMood("");
    } catch (error: any) {
      console.error("Catch block error:", error);
      Alert.alert("Error", error.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950 p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-white text-3xl font-bold mb-6">
          Session Tracker
        </Text>

        {phase === "idle" && (
          <View className="items-center justify-center mt-20">
            <Pressable
              onPress={() => setPhase("pre-session")}
              className="bg-blue-600 w-48 h-48 rounded-full items-center justify-center active:bg-blue-700 shadow-lg shadow-blue-900"
            >
              <IconSymbol name="play.fill" size={60} color="white" />
              <Text className="text-white text-xl font-bold mt-2">
                Start Session
              </Text>
            </Pressable>
            <Text className="text-slate-400 mt-6 text-center px-10">
              Ready to focus? Or maybe just relax? Track your activity to
              understand your patterns.
            </Text>
          </View>
        )}

        {phase === "pre-session" && (
          <View>
            <Text className="text-xl text-white font-semibold mb-4">
              Pre-Session Check-in
            </Text>

            <View className="mb-4">
              <Text className="text-slate-400 mb-2">What are you doing?</Text>
              <TextInput
                className="bg-slate-900 text-white p-4 rounded-xl text-lg border border-slate-800"
                placeholder="e.g. Coding, Reading, Gaming"
                placeholderTextColor="#64748b"
                value={jobCategory}
                onChangeText={setJobCategory}
              />
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 mb-2">Current Mood</Text>
              <View className="flex-row flex-wrap gap-2">
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
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <Text className="text-2xl">{item.emoji}</Text>
                    <Text className="text-white font-bold">{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 mb-2">Energy Level (1-10)</Text>
              <View className="flex-row justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
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
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 mb-4 text-lg font-semibold">
                Context Tags
              </Text>
              {TAG_CATEGORIES.map((category) => (
                <View key={category.title} className="mb-4">
                  <Text className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider">
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
                            : "bg-slate-900 border-slate-700"
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

            <Pressable
              onPress={handleStartSession}
              className="bg-green-600 p-4 rounded-xl items-center active:bg-green-700 mt-4"
            >
              <Text className="text-white font-bold text-lg">Start Timer</Text>
            </Pressable>

            <Pressable
              onPress={handleCancelSession}
              className="p-4 rounded-xl items-center mt-2"
            >
              <Text className="text-slate-400">Cancel</Text>
            </Pressable>
          </View>
        )}

        {phase === "active" && (
          <View className="items-center py-10">
            <Text className="text-slate-400 text-lg mb-2">{jobCategory}</Text>
            <Text
              className={`text-6xl font-mono font-bold mb-8 ${
                isOnBreak ? "text-yellow-500" : "text-white"
              }`}
            >
              {formatTime(elapsedTime)}
            </Text>

            {isOnBreak && (
              <View className="bg-yellow-500/20 px-4 py-2 rounded-full mb-8">
                <Text className="text-yellow-500 font-bold">ON BREAK</Text>
              </View>
            )}

            <View className="w-full flex-row gap-4 justify-center">
              <Pressable
                onPress={handleToggleBreak}
                className={`flex-1 p-4 rounded-xl items-center ${
                  isOnBreak ? "bg-blue-600" : "bg-yellow-600"
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isOnBreak ? "Resume Work" : "Take Break"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleEndSession}
                className="flex-1 bg-red-600 p-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-lg">Stop</Text>
              </Pressable>
            </View>
          </View>
        )}

        {phase === "post-session" && (
          <View>
            <Text className="text-xl text-white font-semibold mb-4">
              Session Summary
            </Text>

            <View className="bg-slate-900 p-4 rounded-xl mb-6 border border-slate-800">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400">Total Time</Text>
                <Text className="text-white font-bold">
                  {Math.round((startTime ? Date.now() - startTime : 0) / 60000)}{" "}
                  min
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400">Break Time</Text>
                <Text className="text-white font-bold">
                  {Math.round(accumulatedBreakTime / 60000)} min
                </Text>
              </View>
              <View className="h-[1px] bg-slate-700 my-2" />
              <View className="flex-row justify-between">
                <Text className="text-green-400 font-bold">Net Focus</Text>
                <Text className="text-green-400 font-bold">
                  {Math.round(
                    ((startTime ? Date.now() - startTime : 0) -
                      accumulatedBreakTime) /
                      60000
                  )}{" "}
                  min
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 mb-2">Output Rating</Text>
              <View className="flex-row gap-2">
                {["Low", "Medium", "High"].map((rating) => (
                  <Pressable
                    key={rating}
                    onPress={() => setOutputRating(rating)}
                    className={`flex-1 p-3 rounded-lg items-center border ${
                      outputRating === rating
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    <Text className="text-white font-bold">{rating}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 mb-2">End Mood</Text>
              <View className="flex-row flex-wrap gap-2">
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
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <Text className="text-2xl">{item.emoji}</Text>
                    <Text className="text-white font-bold">{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 mb-2">Distraction Level</Text>
              <View className="flex-row gap-2">
                {["None", "Low", "Medium", "High"].map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => setDistractionLevel(level)}
                    className={`flex-1 p-3 rounded-lg items-center border ${
                      distractionLevel === level
                        ? "bg-purple-600 border-purple-600"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    <Text className="text-white font-bold">{level}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 mb-2">Notes</Text>
              <TextInput
                className="bg-slate-900 text-white p-4 rounded-xl text-lg border border-slate-800 h-24"
                placeholder="Any thoughts?"
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                value={userNotes}
                onChangeText={setUserNotes}
              />
            </View>

            <Pressable
              onPress={handleSaveSession}
              disabled={loading}
              className={`p-4 rounded-xl items-center ${
                loading ? "bg-blue-800" : "bg-blue-600 active:bg-blue-700"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Save Session
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleDiscardSession}
              disabled={loading}
              className="p-4 rounded-xl items-center mt-4"
            >
              <Text className="text-red-500 font-bold text-lg">
                Discard Session
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showBreakModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBreakModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View className="bg-slate-900 w-full max-w-sm p-6 rounded-2xl border border-slate-800">
            <Text className="text-white text-xl font-bold mb-4">
              Taking a Break?
            </Text>
            <Text className="text-slate-400 mb-4">
              Why are you pausing? (e.g. Lunch, Fatigue, Distraction)
            </Text>
            <TextInput
              className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 mb-6"
              placeholder="Reason..."
              placeholderTextColor="#64748b"
              value={breakReason}
              onChangeText={setBreakReason}
              autoFocus
            />
            <View className="flex-row gap-4">
              <Pressable
                onPress={() => setShowBreakModal(false)}
                className="flex-1 p-4 rounded-xl items-center bg-slate-800"
              >
                <Text className="text-white font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmStartBreak}
                className="flex-1 p-4 rounded-xl items-center bg-blue-600"
              >
                <Text className="text-white font-bold">Start Break</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
