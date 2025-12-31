import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LogEntry = {
  id: string;
  entry_date: string;
  log_data: {
    daily_bio_metrics: {
      sleep_duration_hours: number;
      waking_condition: string;
      physical_state?: string | string[];
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
    break_sessions?: {
      session_id: string;
      type: string;
      post_session?: {
        total_duration_minutes: number;
      };
    }[];
  };
};

type MonthGroup = {
  monthName: string;
  monthIndex: number;
  logs: LogEntry[];
};

type YearGroup = {
  year: string;
  months: MonthGroup[];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function HistoryScreen() {
  const [groupedLogs, setGroupedLogs] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("productivity_logs")
        .select("*")
        .order("entry_date", { ascending: false });

      if (error) throw error;

      const logs = (data as LogEntry[]) || [];
      const grouped = groupLogs(logs);
      setGroupedLogs(grouped);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  const groupLogs = (logs: LogEntry[]): YearGroup[] => {
    const groups: YearGroup[] = [];

    logs.forEach((log) => {
      const [year, monthStr] = log.entry_date.split("-");
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthName = MONTH_NAMES[monthIndex];

      let yearGroup = groups.find((g) => g.year === year);
      if (!yearGroup) {
        yearGroup = { year, months: [] };
        groups.push(yearGroup);
      }

      let monthGroup = yearGroup.months.find((m) => m.monthName === monthName);
      if (!monthGroup) {
        monthGroup = { monthName, monthIndex, logs: [] };
        yearGroup.months.push(monthGroup);
      }

      monthGroup.logs.push(log);
    });

    return groups;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900 p-4">
      <Text className="text-white text-3xl font-bold mb-6">History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {groupedLogs.length === 0 ? (
            <Text className="text-slate-500 text-center mt-10">
              No logs found yet.
            </Text>
          ) : (
            groupedLogs.map((yearGroup) => (
              <YearSection key={yearGroup.year} yearGroup={yearGroup} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function YearSection({ yearGroup }: { yearGroup: YearGroup }) {
  const [expanded, setExpanded] = useState(true);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View className="mb-4">
      <Pressable
        onPress={toggle}
        className="flex-row items-center justify-between bg-slate-800 p-3 rounded-lg mb-2"
      >
        <Text className="text-white text-xl font-bold">{yearGroup.year}</Text>
        <IconSymbol
          name={expanded ? "chevron.up" : "chevron.down"}
          size={20}
          color="#94a3b8"
        />
      </Pressable>
      {expanded && (
        <View className="pl-2">
          {yearGroup.months.map((monthGroup) => (
            <MonthSection
              key={monthGroup.monthName}
              monthGroup={monthGroup}
              year={yearGroup.year}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function MonthSection({
  monthGroup,
  year,
}: {
  monthGroup: MonthGroup;
  year: string;
}) {
  const [expanded, setExpanded] = useState(true);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View className="mb-2">
      <Pressable
        onPress={toggle}
        className="flex-row items-center justify-between bg-slate-800/50 p-2 rounded-lg mb-2 border border-slate-700"
      >
        <Text className="text-blue-400 text-lg font-semibold">
          {monthGroup.monthName}
        </Text>
        <IconSymbol
          name={expanded ? "chevron.up" : "chevron.down"}
          size={18}
          color="#60a5fa"
        />
      </Pressable>
      {expanded && (
        <View>
          {monthGroup.logs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </View>
      )}
    </View>
  );
}

function LogCard({ log }: { log: LogEntry }) {
  const router = useRouter();
  const bio = log.log_data.daily_bio_metrics;
  const day = log.entry_date.split("-")[2];

  // Calculate total focus time
  const totalFocus =
    log.log_data.sessions?.reduce(
      (acc, session) => acc + (session.post_session?.net_focus_minutes || 0),
      0
    ) || 0;

  // Calculate total break time
  const totalBreakFromWork =
    log.log_data.sessions?.reduce(
      (acc, session) =>
        acc + (session.post_session?.break_duration_minutes || 0),
      0
    ) || 0;

  const totalBreakSessions =
    log.log_data.break_sessions?.reduce(
      (acc, session) =>
        acc + (session.post_session?.total_duration_minutes || 0),
      0
    ) || 0;

  const totalBreak = totalBreakFromWork + totalBreakSessions;

  // Normalize physical state to array
  const physicalStates = Array.isArray(bio.physical_state)
    ? bio.physical_state
    : bio.physical_state
    ? [bio.physical_state]
    : [];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/history/[date]",
          params: { date: log.entry_date },
        })
      }
      className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700 active:bg-slate-700"
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white font-bold text-lg">Day {day}</Text>
        <View className="flex-row items-center gap-2">
          <View className="items-end">
            <Text className="text-blue-400 font-bold">
              {formatDuration(totalFocus)} focus
            </Text>
            {totalBreak > 0 && (
              <Text className="text-teal-400 font-bold text-xs">
                {formatDuration(totalBreak)} break
              </Text>
            )}
          </View>
          <IconSymbol name="chevron.right" size={20} color="#94a3b8" />
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-2">
        <View className="bg-slate-700 px-3 py-1 rounded-full">
          <Text className="text-slate-300 text-xs">
            😴 {bio.sleep_duration_hours}h
          </Text>
        </View>
        <View className="bg-slate-700 px-3 py-1 rounded-full">
          <Text className="text-slate-300 text-xs">
            Mood: {bio.waking_condition}
          </Text>
        </View>
      </View>

      {physicalStates.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-1">
          {physicalStates.map((state, index) => (
            <View
              key={index}
              className="bg-slate-700/50 px-2 py-1 rounded-md border border-slate-600"
            >
              <Text className="text-slate-400 text-xs">{state}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
