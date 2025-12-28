import { IconSymbol } from "@/components/ui/icon-symbol";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WikiScreen = () => {
  return (
    <SafeAreaView
      className="flex-1 bg-slate-900"
      edges={["bottom", "left", "right"]}
    >
      <ScrollView className="p-6">
        <Text className="text-slate-400 text-lg mb-6">
          Learn how to use NovaMind to optimize your biological performance.
        </Text>

        <View className="gap-4">
          <Link href="/wiki/work-types" asChild>
            <Pressable className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-row items-center justify-between active:bg-slate-700">
              <View className="flex-row items-center gap-4">
                <View className="bg-blue-900/50 p-3 rounded-full">
                  <IconSymbol
                    name="brain.head.profile"
                    size={24}
                    color="#60a5fa"
                  />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Work Types
                  </Text>
                  <Text className="text-slate-400">
                    Creative, Logical, Admin, Learning
                  </Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#64748b" />
            </Pressable>
          </Link>

          {/* Placeholders */}
          <Pressable className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-row items-center justify-between opacity-50">
            <View className="flex-row items-center gap-4">
              <View className="bg-purple-900/50 p-3 rounded-full">
                <IconSymbol name="face.smiling" size={24} color="#c084fc" />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">
                  Mood & Energy
                </Text>
                <Text className="text-slate-400">
                  Understanding your biological state
                </Text>
              </View>
            </View>
            <Text className="text-slate-500 text-xs">Coming Soon</Text>
          </Pressable>

          <Pressable className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-row items-center justify-between opacity-50">
            <View className="flex-row items-center gap-4">
              <View className="bg-emerald-900/50 p-3 rounded-full">
                <IconSymbol name="gear" size={24} color="#34d399" />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">
                  How it Works
                </Text>
                <Text className="text-slate-400">
                  The science behind the schedule
                </Text>
              </View>
            </View>
            <Text className="text-slate-500 text-xs">Coming Soon</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WikiScreen;
