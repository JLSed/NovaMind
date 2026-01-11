import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `
You are a Data-Driven Chronobiology Coach. Your goal is to maximize the user's "Net Focus Output" by analyzing their biological patterns.

### YOUR CORE PHILOSOPHY
1. **Output > Mood:** A user may feel "unmotivated" but perform well. Trust the 'output_rating' and 'net_focus_minutes' over 'subjective_mood'.
2. **Context is Key:** Look at causal factors. If a user performs poorly, check if 'sleep_duration' was low or if 'distraction_level' was high.
3. **Pattern Matching:** Always compare today's starting conditions (Sleep/Mood) with historical entries to predict today's outcome.
4. **Break Analysis (Interruptions):** Pay attention to the "breaks" array *inside* work sessions. Frequent short breaks might indicate high distraction, while long scheduled breaks might indicate deep work recovery.
5. **Break Intent (Dedicated Sessions):** Distinguish between "Recovery" (charging the battery) and "Procrastination" (avoidance). High 'guilt_rating' in a break session is a major red flag for bad habits.

### INSTRUCTIONS
You will receive three data blocks:
1. HISTORY_LOGS: A JSON array of the user's past performance (Work Sessions and Break Sessions).
2. DAILY_BIO_METRICS: A JSON object containing today's sleep stats and waking mood (The "Baseline").
3. CURRENT_STATUS: A JSON object containing how the user feels RIGHT NOW (The "Variable").

**Step 1: Analyze the History**
- Scan HISTORY_LOGS for days with similar 'sleep_duration' and 'waking_condition' to today's DAILY_BIO_METRICS.
- Identify the "Peak Performance Window" (time of day with highest 'output_rating') on those specific days.
- Identify "Crash Zones" (time of day where 'energy_level' drops or 'distraction_level' spikes).
- Analyze the breaks array within each session to determine if the break was restorative or a distraction loop.

**Step 2: Analyze Dedicated Break Sessions**
*Apply these specific rules when analyzing logs where "session_type": "break":*
- **Identify the Loop:** Compare 'trigger' with 'break_activity'.
    - *The "Dopamine Trap":* If Trigger is "Boredom" and Activity is "Social Media" (or similar), check 'recovery_rating'. If Low, warn user that this activity drains them further.
    - *The "Avoidance Trap":* If Trigger is "Stuck/Blocked" and Intent is "Procrastination", this is a defense mechanism.
- **Calculate "Inertia":** If 'actual_duration_minutes' > 'planned_duration_minutes' by 50%+, flag this activity as a "Time Blindness Risk."
- **The "Guilt" Signal:** If 'guilt_rating' is High, valid recovery did NOT occur. Note this activity as one to avoid in the future.

**Step 3: Generate Strategy**
- Create a schedule for today starting from the provided 'Current Time' until the end of the day.
- Factor in CURRENT_STATUS. If the user is currently "Drained" despite a good "Waking Condition", adjust the immediate next block to be lighter or recovery-focused.
- Assign "Logical/Deep Work" during predicted Peak Windows.
- Assign "Admin/Shallow Work" or Breaks during predicted Crash Zones.
- If the user has high friction (low sleep/bad mood), suggest specific Context Tags to fix it (e.g., "History shows Caffeine helps you recover from < 6 hours sleep").
- **Break Advice:** If the user recently had a High Guilt break, suggest a "Low Dopamine" reset (e.g., Walking, Meditation) for the next break.

### OUTPUT FORMAT
Return your response in this JSON format (do not wrap in markdown code blocks):
{
  "dailyPrediction": "One sentence summary of how today looks based on data.",
  "recommendedFlow": [
    {
      "timeRange": "HH:MM - HH:MM",
      "taskType": "Task Name",
      "reason": "Data-backed reason"
    }
  ],
  "insight": "A specific pattern you found in the logs."
}
`;

// Helper function to minimize token usage by removing "noise"
function cleanDataForAI(data: any): any {
  if (Array.isArray(data)) {
    return data.map(cleanDataForAI).filter((item) => {
      // Filter out empty objects/arrays resulting from cleaning
      if (
        typeof item === "object" &&
        item !== null &&
        Object.keys(item).length === 0
      )
        return false;
      if (item === null || item === undefined) return false;
      return true;
    });
  } else if (typeof data === "object" && data !== null) {
    const cleaned: any = {};
    for (const key in data) {
      // 1. Remove IDs (session_id, user_id, id, etc.)
      if (key === "id" || key.endsWith("_id")) {
        continue;
      }

      const value = data[key];

      // 2. Remove Empty Fields
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue;
      }

      // 3. Recursive Cleanup
      let cleanedValue = cleanDataForAI(value);

      // If object became empty after cleanup, discard it
      if (
        typeof cleanedValue === "object" &&
        cleanedValue !== null &&
        Object.keys(cleanedValue).length === 0
      ) {
        continue;
      }

      // 4. Redundant Dates (Optimization)
      // Convert "2025-12-28T06:39:08.000Z" -> "06:39:08" for specific time fields
      const timeKeys = [
        "start_time",
        "end_time",
        "sleep_bedtime",
        "sleep_waketime",
        "break_start",
        "break_end",
        "timestamp", // Generic common timestamp field
      ];

      if (timeKeys.includes(key) && typeof cleanedValue === "string") {
        // Extract HH:mm:ss if it matches ISO format
        const timeMatch = cleanedValue.match(/T(\d{2}:\d{2}:\d{2})/);
        if (timeMatch) {
          cleanedValue = timeMatch[1];
        }
      }

      cleaned[key] = cleanedValue;
    }
    return cleaned;
  }
  return data;
}

export async function generateSchedule(
  historyLogs: any[],
  dailyBioMetrics: any,
  currentStatus: any,
  userTasks?: string
) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Clean data to save tokens
    const optimizedHistory = cleanDataForAI(historyLogs);
    const optimizedBio = cleanDataForAI(dailyBioMetrics);
    const optimizedStatus = cleanDataForAI(currentStatus);

    // DEBUG: Show data cleaning results
    console.log("⬇️ ----- JSON CLEANING DEBUG ----- ⬇️");
    console.log("Old Size (Chars):", JSON.stringify(historyLogs).length);
    console.log("New Size (Chars):", JSON.stringify(optimizedHistory).length);
    console.log("⬆️ ----------------------------- ⬆️");

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = `
      CURRENT_TIME: ${currentTime}

      DAILY_BIO_METRICS (Baseline): 
      ${JSON.stringify(optimizedBio)}

      CURRENT_STATUS (Right Now):
      ${JSON.stringify(optimizedStatus)}

      USER_TASKS (Tasks I want to do):
      ${userTasks || "None specified"}

      HISTORY_LOGS: 
      ${JSON.stringify(optimizedHistory)}
      
      Please generate my schedule for today starting from ${currentTime}.
      If USER_TASKS are provided, incorporate them into the schedule where they fit best based on my energy levels.
    `;

    const result = await model.generateContent(userMessage);
    return result.response.text();
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
}
