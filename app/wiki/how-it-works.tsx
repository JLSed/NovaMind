import { ScrollView } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

const content = `
# How NovaMind Works

NovaMind is not just a habit tracker; it is a **Chronobiology Optimization Engine**. It uses AI to find your "Peak Performance Windows" and "Crash Zones."

### 🏗 Core Philosophy

**Output > Mood**
Most productivity advice is based on how you *feel*. NovaMind is based on how you *perform*. We compare your subjective feeling (Pre-Work) vs. your actual performance (Post-Work) to find patterns.

### 🔄 The Data Flow

To generate accurate insights, we use a **"Golden Data" Flow**:

#### 1. 🌅 Daily Bio-Metrics (Start of Day)
You log your sleep duration, wake time, and waking condition.
*   *Why:* This establishes your biological baseline for the day. Are you sleep-deprived? Are you jet-lagged?

#### 2. 🔮 Pre-Session Log (The Prediction)
Before you start working, you tell the app:
*   **Task Type:** (Creative, Logical, Admin, Learning)
*   **Mood:** How you feel right now.
*   **Context:** (e.g., Caffeine, Quiet Environment, Deadline)
*   *Why:* This captures your *intention* and current state.

#### 3. 🏁 Post-Session Log (The Reality Check)
After you finish, you rate:
*   **Output:** (High, Medium, Low)
*   **Focus Duration:** Actual time spent working (minus breaks).
*   **Distraction Level:** Were you focused?
*   *Why:* This validates or corrects your prediction.

---

### 🤖 AI Integration

NovaMind uses **Context Injection** to analyze your data. We do not "train" a model on your data (which is slow and expensive). Instead, we send your recent history + today's context to the AI every time you ask for advice.

#### How the AI "Thinks"
1.  **Fetch:** It grabs your last 30 days of logs.
2.  **Compare:** It looks for days in the past that look like *today* (e.g., "Days where you slept < 6 hours").
3.  **Predict:** It sees how you performed on those days.
4.  **Advise:** It generates a schedule to match your predicted energy curve.

*Example Insight:*
> "I noticed you rate your output 'High' 80% of the time when you use the 'Quiet Environment' tag, even when you feel 'Tired'."

### 🛡 Privacy & Data

*   **Personal Use:** Your data is stored in your private database.
*   **AI Processing:** Data is sent to the AI model *only* when you request an analysis. It is stateless (the AI doesn't "remember" you between sessions, it just reads the logs we send it).
`;

const HowItWorksScreen = () => {
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
            heading4: {
              color: "#cbd5e1",
              fontWeight: "bold",
              marginBottom: 5,
              marginTop: 10,
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

export default HowItWorksScreen;
