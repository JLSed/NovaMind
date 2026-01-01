import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Sign In Error", error.message);
    } else {
      // Router will handle redirect based on auth state change in _layout
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert("Sign Up Error", error.message);
    } else {
      Alert.alert("Success", "Please check your inbox for email verification!");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900 justify-center p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <Text className="text-white text-4xl font-bold mb-8 text-center">
          NovaMind
        </Text>

        <View className="mb-4">
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl text-lg border border-slate-700"
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View className="mb-8">
          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl text-lg border border-slate-700"
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View className="space-y-4 gap-4">
          <Pressable
            onPress={signInWithEmail}
            disabled={loading}
            className="bg-blue-600 p-4 rounded-full items-center active:bg-blue-700"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Sign In</Text>
            )}
          </Pressable>

          <Pressable
            onPress={signUpWithEmail}
            disabled={loading}
            className="bg-slate-700 p-4 rounded-full items-center active:bg-slate-600"
          >
            <Text className="text-white font-bold text-lg">Sign Up</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
