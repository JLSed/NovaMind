import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LogEntry = {
  id: string;
  entry_date: string;
  log_data: {
    daily_bio_metrics: {
      sleep_duration_hours: number;
      waking_condition: string;
    };
    sessions: {
      session_id: string;
      job_category: string;
      pre_session: {
        start_time: string;
        context_tags: string[];
      };
      post_session?: {
        end_time: string;
        output_rating: string;
        net_focus_minutes: number;
        break_duration_minutes: number;
      };
    }[];
  };
};

export default function HistoryScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("productivity_logs")
        .select("*")
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: LogEntry }) => {
    const bio = item.log_data.daily_bio_metrics;

    // Calculate total focus time across all sessions for the day
    const totalFocus =
      item.log_data.sessions?.reduce(
        (acc, session) => acc + (session.post_session?.net_focus_minutes || 0),
        0
      ) || 0;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/history/[date]",
            params: { date: item.entry_date },
          })
        }
        className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700 active:bg-slate-700"
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white font-bold text-lg">
            {item.entry_date}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-blue-400 font-bold">
              {totalFocus} min focus
            </Text>
            <IconSymbol name="chevron.right" size={20} color="#94a3b8" />
          </View>
        </View>

        <View className="flex-row space-x-4 mb-2">
          <View className="bg-slate-700 px-3 py-1 rounded-full">
            <Text className="text-slate-300 text-sm">
              😴 {bio.sleep_duration_hours}h
            </Text>
          </View>
          <View className="bg-slate-700 px-3 py-1 rounded-full">
            <Text className="text-slate-300 text-sm">
              Mood: {bio.waking_condition}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-3xl font-bold mb-6">History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-slate-500 text-center mt-10">
              No logs found yet.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
