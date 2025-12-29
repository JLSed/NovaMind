import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryDetailScreen() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState<any>(null);
  const [allSessions, setAllSessions] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (date) fetchLog();
    }, [date])
  );

  const fetchLog = async () => {
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
        if (error.code !== "PGRST116") {
          console.error("Error fetching log:", error);
          Alert.alert("Error", "Failed to load history.");
        }
      } else {
        setLogData(data);
        const workSessions = (data.log_data.sessions || []).map(
          (s: any, i: number) => ({
            ...s,
            type: "work",
            originalIndex: i,
          })
        );
        const breakSessions = (data.log_data.break_sessions || []).map(
          (s: any, i: number) => ({
            ...s,
            type: "break",
            originalIndex: i,
          })
        );

        const combined = [...workSessions, ...breakSessions].sort((a, b) => {
          // Helper to parse time string to minutes from midnight for comparison
          const getMinutes = (timeStr: string) => {
            if (!timeStr) return 0;
            const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
            if (!match) return 0;

            let [_, hStr, mStr, sStr, period] = match;
            let h = parseInt(hStr);
            const m = parseInt(mStr);

            if (period) {
              const p = period.toUpperCase();
              if (p === "PM" && h < 12) h += 12;
              if (p === "AM" && h === 12) h = 0;
            }

            return h * 60 + m;
          };

          return (
            getMinutes(a.pre_session.start_time) -
            getMinutes(b.pre_session.start_time)
          );
        });

        setAllSessions(combined);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (session: any) => {
    const isWork = session.type === "work";
    Alert.alert(
      `Delete ${isWork ? "Session" : "Break"}`,
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const currentSessions = logData.log_data.sessions || [];
              const currentBreaks = logData.log_data.break_sessions || [];

              let updatedSessions = [...currentSessions];
              let updatedBreaks = [...currentBreaks];

              if (isWork) {
                updatedSessions = updatedSessions.filter(
                  (s) => s.session_id !== session.session_id
                );
              } else {
                updatedBreaks = updatedBreaks.filter(
                  (s) => s.session_id !== session.session_id
                );
              }

              const updatedLogData = {
                ...logData,
                log_data: {
                  ...logData.log_data,
                  sessions: updatedSessions,
                  break_sessions: updatedBreaks,
                },
              };

              const { error } = await supabase
                .from("productivity_logs")
                .update({ log_data: updatedLogData.log_data })
                .eq("id", logData.id);

              if (error) throw error;

              // Re-fetch or update local state
              setLogData(updatedLogData);
              const workSessions = updatedSessions.map((s: any, i: number) => ({
                ...s,
                type: "work",
                originalIndex: i,
              }));
              const breakSessions = updatedBreaks.map((s: any, i: number) => ({
                ...s,
                type: "break",
                originalIndex: i,
              }));

              const getMinutes = (timeStr: string) => {
                if (!timeStr) return 0;
                const match = timeStr.match(
                  /(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i
                );
                if (!match) return 0;

                let [_, hStr, mStr, sStr, period] = match;
                let h = parseInt(hStr);
                const m = parseInt(mStr);

                if (period) {
                  const p = period.toUpperCase();
                  if (p === "PM" && h < 12) h += 12;
                  if (p === "AM" && h === 12) h = 0;
                }

                return h * 60 + m;
              };

              const combined = [...workSessions, ...breakSessions].sort(
                (a, b) => {
                  return (
                    getMinutes(a.pre_session.start_time) -
                    getMinutes(b.pre_session.start_time)
                  );
                }
              );
              setAllSessions(combined);
            } catch (error) {
              console.error("Error deleting session:", error);
              Alert.alert("Error", "Failed to delete session.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "--:--";

    // Check if the time string already contains AM/PM (12-hour format)
    const amPmMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
    if (amPmMatch) {
      const [_, h, m, ampm] = amPmMatch;
      return `${h}:${m} ${ampm.toUpperCase()}`;
    }

    // Fallback for 24-hour format
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4 font-semibold">
          Loading Session Data...
        </Text>
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
        <Text className="text-white text-xl font-bold">{date}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Daily Bio Metrics Section */}
        {logData?.log_data?.daily_bio_metrics && (
          <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">
                Daily Bio-Metrics
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/history/edit-daily-log",
                    params: { date: date },
                  })
                }
                className="bg-slate-700 p-2 rounded-full"
              >
                <IconSymbol name="pencil" size={20} color="#60a5fa" />
              </Pressable>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1 bg-slate-900/50 p-3 rounded-lg">
                <Text className="text-slate-400 text-xs uppercase mb-1">
                  Sleep
                </Text>
                <Text className="text-white font-bold text-lg">
                  {logData.log_data.daily_bio_metrics.sleep_duration_hours ||
                    "--"}{" "}
                  hrs
                </Text>
              </View>
              <View className="flex-1 bg-slate-900/50 p-3 rounded-lg">
                <Text className="text-slate-400 text-xs uppercase mb-1">
                  Mood
                </Text>
                <Text className="text-white font-bold text-lg">
                  {logData.log_data.daily_bio_metrics.waking_condition || "--"}
                </Text>
              </View>
            </View>

            {logData.log_data.daily_bio_metrics.physical_state && (
              <View>
                <Text className="text-slate-400 text-xs uppercase mb-2">
                  Physical State
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(Array.isArray(
                    logData.log_data.daily_bio_metrics.physical_state
                  )
                    ? logData.log_data.daily_bio_metrics.physical_state
                    : [logData.log_data.daily_bio_metrics.physical_state]
                  ).map((state: string, i: number) => (
                    <View
                      key={i}
                      className="bg-emerald-900/30 px-2 py-1 rounded border border-emerald-800"
                    >
                      <Text className="text-emerald-400 text-xs">{state}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <Text className="text-slate-400 font-bold mb-4 uppercase tracking-wider">
          Timeline
        </Text>

        {allSessions.length === 0 ? (
          <Text className="text-slate-500 text-center mt-10">
            No activity recorded for this day.
          </Text>
        ) : (
          allSessions.map((session, index) => {
            const isWork = session.type === "work";
            const isProcrastination =
              !isWork && session.intent === "Procrastination";

            return (
              <View key={index} className="flex-row">
                {/* Left Column: Time */}
                <View className="w-20 items-end pr-4 pt-4">
                  <Text className="text-slate-400 font-bold text-xs">
                    {formatTime(session.pre_session.start_time)}
                  </Text>
                </View>

                {/* Middle Column: Line */}
                <View className="w-px bg-slate-700 relative mx-2">
                  <View
                    className={`absolute top-5 -left-1.5 w-3 h-3 rounded-full ${
                      isWork
                        ? "bg-blue-500"
                        : isProcrastination
                        ? "bg-orange-500"
                        : "bg-emerald-500"
                    }`}
                  />
                </View>

                {/* Right Column: Card */}
                <View className="flex-1 pb-8 pl-2">
                  <View
                    className={`p-4 rounded-xl border ${
                      isWork
                        ? "bg-slate-800 border-slate-700"
                        : isProcrastination
                        ? "bg-orange-900/20 border-orange-900/50"
                        : "bg-emerald-900/20 border-emerald-900/50"
                    }`}
                  >
                    {/* Header */}
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 mr-2">
                        <Text className="text-slate-400 text-xs mb-1 uppercase">
                          {isWork ? "Work Session" : "Break"}
                        </Text>
                        <Text className="text-white text-lg font-bold flex-wrap">
                          {isWork
                            ? session.job_category || "Uncategorized"
                            : session.intent || "Unspecified"}
                        </Text>
                      </View>
                      <View className="flex-row gap-2 shrink-0">
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: isWork
                                ? "/history/edit-session"
                                : "/history/edit-break-session",
                              params: {
                                date: date,
                                index: session.originalIndex,
                              },
                            })
                          }
                          className="bg-slate-700 p-2 rounded-full"
                        >
                          <IconSymbol
                            name="pencil"
                            size={16}
                            color={isWork ? "#60a5fa" : "#34d399"}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteSession(session)}
                          className="bg-red-900/30 p-2 rounded-full border border-red-900"
                        >
                          <IconSymbol
                            name="trash.fill"
                            size={16}
                            color="#ef4444"
                          />
                        </Pressable>
                      </View>
                    </View>

                    {/* Content */}
                    {isWork ? (
                      <>
                        <View className="flex-row gap-4 mb-3">
                          <View>
                            <Text className="text-slate-500 text-[10px] uppercase mb-1">
                              Rating
                            </Text>
                            <Text
                              className={`font-bold ${
                                session.post_session?.output_rating === "High"
                                  ? "text-green-400"
                                  : session.post_session?.output_rating ===
                                    "Medium"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {session.post_session?.output_rating || "N/A"}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-slate-500 text-[10px] uppercase mb-1">
                              Focus
                            </Text>
                            <Text className="text-white font-bold">
                              {session.post_session?.net_focus_minutes || 0} m
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                          {session.pre_session?.context_tags?.map(
                            (tag: string) => (
                              <View
                                key={tag}
                                className="bg-slate-700 px-2 py-0.5 rounded"
                              >
                                <Text className="text-slate-300 text-[10px]">
                                  {tag}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="flex-row gap-4 mb-3">
                          <View>
                            <Text className="text-slate-500 text-[10px] uppercase mb-1">
                              Recovery
                            </Text>
                            <Text
                              className={`font-bold ${
                                session.post_session?.recovery_rating === "High"
                                  ? "text-green-400"
                                  : session.post_session?.recovery_rating ===
                                    "Medium"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {session.post_session?.recovery_rating || "N/A"}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-slate-500 text-[10px] uppercase mb-1">
                              Duration
                            </Text>
                            <Text className="text-white font-bold">
                              {session.post_session?.total_duration_minutes ||
                                0}{" "}
                              m
                            </Text>
                          </View>
                        </View>
                        {session.activities &&
                          session.activities.length > 0 && (
                            <View className="flex-row flex-wrap gap-2">
                              {session.activities.map((activity: string) => (
                                <View
                                  key={activity}
                                  className={`px-2 py-0.5 rounded border ${
                                    isProcrastination
                                      ? "bg-orange-900/30 border-orange-800"
                                      : "bg-teal-900/30 border-teal-800"
                                  }`}
                                >
                                  <Text
                                    className={`text-[10px] ${
                                      isProcrastination
                                        ? "text-orange-400"
                                        : "text-teal-400"
                                    }`}
                                  >
                                    {activity}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
