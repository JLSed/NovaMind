import { ScrollView, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

const content = `
These categories are not just labels; they represent **four different "engines" your brain uses**.

To make your AI accurate, you need to categorize tasks based on the **type of brain power** required, not just the topic. Here is exactly what each tag means and when to use it.

### 1. 🎨 Creative (Divergent Thinking)

This is when you need to generate *new* ideas or connect things that haven't been connected before. Your brain needs to be relaxed and "open."

* **The "Engine" Mode:** Wide Focus. You need to explore possibilities.
* **Best Biological State:** Often best when slightly tired (disinhibited) or very relaxed. High anxiety kills this mode.
* **Examples for You:**
* Designing a new UI layout in Figma.
* Brainstorming features for your NoVault thesis.
* Writing an essay or blog post.
* Planning the architecture of a new app.


* **AI Insight:** If you feel "Anxious," the AI will tell you **NOT** to do this. Anxiety narrows your focus, which makes creativity impossible.

### 2. 🧩 Logical (Convergent Thinking)

This is "Deep Work." You are following strict rules to solve a specific problem. Your brain needs to hold complex variables in short-term memory.

* **The "Engine" Mode:** Narrow Focus. High RAM usage.
* **Best Biological State:** High energy, fully rested, zero distractions.
* **Examples for You:**
* Debugging a Rust compilation error.
* Writing complex SQL queries or backend logic.
* Solving Math problems.
* Fixing a broken component in React.


* **AI Insight:** This is the most expensive fuel. The AI will learn to schedule this during your "Golden Hours" (usually morning) and never when you report "Brain Fog."

### 3. 📂 Admin (Low-Load Maintenance)

This is "Busy Work." It requires attention but very little deep thinking. It is repetitive and routine.

* **The "Engine" Mode:** Autopilot.
* **Best Biological State:** Can be done when you are "Drained," "Bored," or in a "Food Coma."
* **Examples for You:**
* Replying to emails or messages.
* Organizing your file folders.
* Updating software packages (Running \`pacman -Syu\` on Arch).
* Formatting a document (making it look pretty without changing the content).


* **AI Insight:** The AI will treat this as a "Filler." It will say: *"You are too tired to Code (Logical). Switch to Admin tasks to stay productive without burning out."*

### 4. 🧠 Learning (Encoding)

This is the act of taking *new* information and writing it to your long-term memory. This is physically exhausting for the brain.

* **The "Engine" Mode:** Absorption.
* **Best Biological State:** Fresh mind. Usually bad to do right before bed (unless it's light reading) or right after a heavy meal.
* **Examples for You:**
* Watching a Frontend Masters course on TypeScript.
* Reading the Rust documentation.
* Memorizing Japanese vocabulary/Kanji.
* Reading a textbook.


* **AI Insight:** The AI will track your "Retention." If you try to Learn while "Sleep Deprived," it might warn you: *"Your retention rate is historically low when you sleep < 6 hours. Save the tutorial for tomorrow."*

### Summary Cheat Sheet for Your App

| Tag | **Mental State** | **Key Question to Ask Yourself** |
| --- | --- | --- |
| **Creative** | 💭 Dreaming | *"Am I inventing something from scratch?"* |
| **Logical** | 📐 Solving | *"Am I fixing a problem or following strict rules?"* |
| **Admin** | 🤖 Organizing | *"Could I do this while listening to a podcast?"* |
| **Learning** | 📚 Absorbing | *"Am I trying to memorize new information?"* |
`;

const WorkTypesScreen = () => {
  return (
    <SafeAreaView
      className="flex-1 bg-slate-900"
      edges={["bottom", "left", "right"]}
    >
      <ScrollView className="p-4">
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
              color: "#93c5fd",
              fontWeight: "bold",
              marginBottom: 8,
              marginTop: 16,
              fontSize: 20,
            },
            strong: { color: "#60a5fa", fontWeight: "bold" },
            em: { color: "#cbd5e1", fontStyle: "italic" },
            table: { borderColor: "#475569", borderWidth: 1, borderRadius: 8 },
            tr: { borderColor: "#475569", borderBottomWidth: 1 },
            th: {
              backgroundColor: "#1e293b",
              padding: 10,
              color: "#ffffff",
              fontWeight: "bold",
            },
            td: { padding: 10, color: "#e2e8f0" },
            bullet_list: { marginBottom: 10 },
            list_item: { marginBottom: 5 },
          }}
        >
          {content}
        </Markdown>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkTypesScreen;
