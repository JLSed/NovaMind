import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabase";
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

export default function HistoryDetailScreen() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logData, setLogData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
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

    if (date) fetchLog();
  }, [date]);

  const updateSession = (index: number, field: string, value: any) => {
    const updatedSessions = [...sessions];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      updatedSessions[index][parent] = {
        ...updatedSessions[index][parent],
        [child]: value,
      };
    } else {
      updatedSessions[index][field] = value;
    }
    setSessions(updatedSessions);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const updatedLogData = {
        ...logData.log_data,
        sessions: sessions,
      };

      const { error } = await supabase
        .from("productivity_logs")
        .update({ log_data: updatedLogData })
        .eq("user_id", user.id)
        .eq("entry_date", date);

      if (error) throw error;

      Alert.alert("Success", "Changes saved successfully!");
      router.back();
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
        <Text className="text-white text-xl font-bold">{date}</Text>
        <Pressable
          onPress={saveChanges}
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
              <View className="mb-4">
                <Text className="text-slate-400 text-xs mb-1 uppercase">
                  Job Category
                </Text>
                <TextInput
                  className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700"
                  value={session.job_category}
                  onChangeText={(text) =>
                    updateSession(index, "job_category", text)
                  }
                />
              </View>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-1 uppercase">
                    Rating
                  </Text>
                  <View className="flex-row bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                    {["Low", "Medium", "High"].map((rating) => (
                      <Pressable
                        key={rating}
                        onPress={() =>
                          updateSession(
                            index,
                            "post_session.output_rating",
                            rating
                          )
                        }
                        className={`flex-1 p-2 items-center ${
                          session.post_session?.output_rating === rating
                            ? rating === "High"
                              ? "bg-green-600"
                              : rating === "Medium"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                            : ""
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            session.post_session?.output_rating === rating
                              ? "text-white"
                              : "text-slate-400"
                          }`}
                        >
                          {rating}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-1 uppercase">
                    Focus (min)
                  </Text>
                  <TextInput
                    className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 text-center"
                    value={session.post_session?.net_focus_minutes?.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      updateSession(
                        index,
                        "post_session.net_focus_minutes",
                        parseInt(text) || 0
                      )
                    }
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-400 text-xs mb-1 uppercase">
                  Notes
                </Text>
                <TextInput
                  className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 h-20"
                  multiline
                  textAlignVertical="top"
                  value={session.post_session?.user_notes || ""}
                  onChangeText={(text) =>
                    updateSession(index, "post_session.user_notes", text)
                  }
                />
              </View>

              <View className="mt-4 flex-row flex-wrap gap-2">
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
