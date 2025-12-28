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
  const [sessions, setSessions] = useState<any[]>([]);

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
        setSessions(data.log_data.sessions || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (index: number) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const updatedSessions = [...sessions];
              updatedSessions.splice(index, 1);

              const updatedLogData = {
                ...logData,
                log_data: {
                  ...logData.log_data,
                  sessions: updatedSessions,
                },
              };

              const { error } = await supabase
                .from("productivity_logs")
                .update({ log_data: updatedLogData.log_data })
                .eq("id", logData.id);

              if (error) throw error;

              setSessions(updatedSessions);
              setLogData(updatedLogData);
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
          Sessions
        </Text>

        {sessions.length === 0 ? (
          <Text className="text-slate-500 text-center mt-10">
            No sessions recorded for this day.
          </Text>
        ) : (
          sessions.map((session, index) => (
            <View
              key={index}
              className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-slate-400 text-xs mb-1 uppercase">
                    Job Category
                  </Text>
                  <Text className="text-white text-lg font-bold">
                    {session.job_category || "Uncategorized"}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/history/edit-session",
                        params: { date: date, index: index },
                      })
                    }
                    className="bg-slate-700 p-2 rounded-full"
                  >
                    <IconSymbol name="pencil" size={20} color="#60a5fa" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteSession(index)}
                    className="bg-red-900/30 p-2 rounded-full border border-red-900"
                  >
                    <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-1 uppercase">
                    Rating
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-lg self-start ${
                      session.post_session?.output_rating === "High"
                        ? "bg-green-900/50 border border-green-700"
                        : session.post_session?.output_rating === "Medium"
                        ? "bg-yellow-900/50 border border-yellow-700"
                        : "bg-red-900/50 border border-red-700"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        session.post_session?.output_rating === "High"
                          ? "text-green-400"
                          : session.post_session?.output_rating === "Medium"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {session.post_session?.output_rating || "N/A"}
                    </Text>
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-1 uppercase">
                    Focus
                  </Text>
                  <Text className="text-white font-bold text-lg">
                    {session.post_session?.net_focus_minutes || 0} min
                  </Text>
                </View>
              </View>

              {session.post_session?.user_notes ? (
                <View className="mb-4">
                  <Text className="text-slate-400 text-xs mb-1 uppercase">
                    Notes
                  </Text>
                  <Text className="text-slate-300 italic">
                    &quot;{session.post_session.user_notes}&quot;
                  </Text>
                </View>
              ) : null}

              <View className="flex-row flex-wrap gap-2">
                {session.pre_session?.context_tags?.map((tag: string) => (
                  <View
                    key={tag}
                    className="bg-slate-700 px-2 py-1 rounded border border-slate-600"
                  >
                    <Text className="text-slate-300 text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
