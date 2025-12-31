import { ScrollView } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

const content = `
# Mood & Energy

Understanding your biological state is key to optimizing your performance. NovaMind tracks both your **Subjective Mood** (how you feel) and your **Physical State** (your body's condition).

### The "Accuracy Gap"

A core philosophy of NovaMind is **Output > Mood**.

*   **The Problem:** You might feel "Unmotivated" but actually perform well once you start. Or you might feel "Excited" but get distracted easily.
*   **The Solution:** We track how you *feel* before you work, and how you *performed* after you work. The AI learns the difference.

---

### 🧠 Mental Moods

These describe your current headspace.

*   **🔥 On Fire**: High Energy, High Focus. You are in the zone.
*   **🧠 Focused**: Calm, Ready. The ideal state for Deep Work.
*   **😰 Anxious**: High Energy, Low Focus. You have energy but it's scattered.
*   **😑 Bored**: Low Energy, Low Interest. You need stimulation.
*   **☁️ Foggy**: Confused, Slow. Brain fog is present.
*   **🛑 Resistance**: Don't want to start. High friction.
*   **🔋 Drained**: Need rest. Your battery is empty.
*   **😐 Neutral**: Just normal. No strong feelings.

### 🌅 Waking Conditions

How you feel immediately after waking up sets the tone for the day.

*   **🌅 Refreshed**: Ready to take on the day.
*   **😵‍💫 Groggy**: Slow to wake up. Sleep inertia.
*   **😴 Tired**: Didn't sleep enough.
*   **😰 Anxious**: Worried about the day ahead.
*   **🤩 Excited**: Looking forward to it.
*   **😠 Grumpy**: Woke up on the wrong side of the bed.
*   **🏃 Rushed**: Running late / Overslept.

### ⚡ Physical States

Your body's condition affects your mind.

*   **⚡ Energetic**: Body feels light and ready.
*   **🥱 Fatigued**: Body feels heavy.
*   **🏋️ Sore**: Post-workout muscle soreness.
*   **😬 Tense**: Muscles are tight (stress).
*   **😌 Relaxed**: Body is loose and calm.
*   **🤤 Hungry** / **🍱 Stuffed**: Food impacts focus.
*   **💧 Hydrated** / **🌵 Dehydrated**: Water intake is critical.
*   **🤕 Headache** / **🤢 Nauseous** / **🤒 Sick**: Illness.
*   **🫨 Jittery**: Too much caffeine.

---

### 💡 AI Insight

The AI looks for correlations between these states and your output.
*   *Example:* "You perform poorly on **Logical** tasks when you are **Hungry**, but **Admin** tasks are unaffected."
*   *Example:* "You often feel **Resistance** before **Creative** work, but your output is usually **High** once you start."
`;

const MoodEnergyScreen = () => {
  return (
    <SafeAreaView
      className="flex-1 bg-slate-900"
      edges={["bottom", "left", "right"]}
    >
      <ScrollView contentContainerClassName="p-4 pb-20">
        <Markdown
          style={{
            body: { color: "#e2e8f0", fontSize: 16, lineHeight: 24 },
            heading1: {
              color: "#ffffff",
              fontWeight: "bold",
              marginBottom: 10,
              marginTop: 20,
            },
            heading2: {
              color: "#ffffff",
              fontWeight: "bold",
              marginBottom: 10,
              marginTop: 20,
            },
            heading3: {
              color: "#94a3b8",
              fontWeight: "bold",
              marginBottom: 5,
              marginTop: 15,
            },
            hr: { backgroundColor: "#334155", marginVertical: 20 },
            strong: { color: "#60a5fa", fontWeight: "bold" },
            blockquote: {
              backgroundColor: "#1e293b",
              borderColor: "#334155",
              borderLeftWidth: 4,
              padding: 10,
              color: "#e2e8f0",
            },
            code_inline: {
              backgroundColor: "#1e293b",
              color: "#e2e8f0",
              borderRadius: 4,
              paddingHorizontal: 4,
            },
          }}
        >
          {content}
        </Markdown>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoodEnergyScreen;
