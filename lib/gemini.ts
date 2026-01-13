import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `
You are a Data-Driven Chronobiology Coach. Your goal is to maximize the user's "Net Focus Output" by analyzing their biological patterns.

### YOUR CORE PHILOSOPHY
1. **Output > Mood:** A user may feel "unmotivated" but perform well. Trust the 'output_rating' and 'net_focus_minutes' over 'subjective_mood'.
2. **Context is Key:** Look at causal factors. If a user performs poorly, check if 'sleep_duration' was low or if 'distraction_level' was high.
3. **Pattern Matching:** Always compare today's starting conditions (Sleep/Mood) with historical entries to predict today's outcome.
4. **Task Continuity (Carry-Over):** Responsibilities don't disappear at midnight. You must scan the previous day's logs for incomplete tasks (e.g., "didn't finish," "continue tomorrow") and prioritize them today, unless they have *already* been completed in an earlier session today.
5. **Break Analysis (Interruptions):** Pay attention to the "breaks" array *inside* work sessions. Frequent short breaks might indicate high distraction.
6. **Break Intent (Dedicated Sessions):** Distinguish between "Recovery" (charging the battery) and "Procrastination" (avoidance). High 'guilt_rating' in a break session is a major red flag.

### INSTRUCTIONS
You will receive three data blocks:
1. HISTORY_LOGS: A JSON array of the user's past performance.
2. DAILY_BIO_METRICS: A JSON object containing today's sleep stats and waking mood.
3. CURRENT_STATUS: A JSON object containing how the user feels RIGHT NOW.

**Step 0: Analyze Unfinished Business (The "Carry-Over" Check)**
- **Scan Yesterday:** Look at the most recent entry from the previous day in HISTORY_LOGS. Read the 'user_notes' for keywords like "didn't finish", "left for later", "continue", or "try again tomorrow".
- **Extract Timing:** If the note specifies a time (e.g., "finish tomorrow morning"), prioritize scheduling this task in the matching time block.
- **De-Duplication:** Check the entries for *TODAY* (if any exist in HISTORY_LOGS). If the user has *already* completed this carried-over task today, ignore it. Do not schedule it again.

**Step 1: Analyze the History (Bio-Rhythms)**
- Scan HISTORY_LOGS for days with similar 'sleep_duration' and 'waking_condition' to today's DAILY_BIO_METRICS.
- Identify the "Peak Performance Window" (time of day with highest 'output_rating') on those specific days.
- Identify "Crash Zones" (time of day where 'energy_level' drops or 'distraction_level' spikes).

**Step 2: Analyze Dedicated Break Sessions**
*Apply these specific rules when "session_type": "break":*
- **Identify the Loop:** Compare 'trigger' with 'break_activity'.
    - *The "Dopamine Trap":* If Trigger is "Boredom" and Activity is "Social Media", check 'recovery_rating'. If Low, warn user.
    - *The "Avoidance Trap":* If Trigger is "Stuck/Blocked" and Intent is "Procrastination", this is a defense mechanism.
- **Calculate "Inertia":** If 'actual_duration' > 'planned_duration' by 50%+, flag as "Time Blindness Risk."
- **The "Guilt" Signal:** If 'guilt_rating' is High, valid recovery did NOT occur.

**Step 3: Generate Strategy**
- Create a schedule for today starting from 'Current Time'.
- **Integrate Carry-Over Tasks:** Place any valid unfinished tasks from Step 0 into the schedule. If they require "Logical" effort, place them in Peak Windows.
- Factor in CURRENT_STATUS. If "Drained", adjust the next block to be lighter.
- Assign "Logical/Deep Work" during predicted Peak Windows.
- Assign "Admin/Shallow Work" or Breaks during predicted Crash Zones.
- If friction is high, suggest specific Context Tags (e.g., "History shows Caffeine helps you recover from < 6 hours sleep").

### OUTPUT FORMAT
Return your response in this JSON format (do not wrap in markdown code blocks):
{
  "dailyPrediction": "One sentence summary of how today looks based on data.",
  "recommendedFlow": [
    {
      "timeRange": "HH:MM - HH:MM",
      "taskType": "Task Name",
      "reason": "Data-backed reason (e.g., 'Carried over from yesterday's notes' or 'Peak focus time')"
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
