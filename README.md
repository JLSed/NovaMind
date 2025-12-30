# NovaMind 🧠

**NovaMind** is a personal productivity application built on the principles of **Chronobiology** and **Energy Management**. Unlike traditional habit trackers that rely solely on how you _feel_, NovaMind compares your subjective mood with your actual output to identify your true biological peak performance windows.

## 🚀 Core Philosophy

**Output > Mood**

We often feel "unmotivated" but perform well, or feel "excited" but get distracted. NovaMind bridges this "Accuracy Gap" by logging both:

1.  **Pre-Work Prediction**: How you feel, what you slept, and your context (caffeine, environment).
2.  **Post-Work Reality**: Your actual output, focus duration, and distraction level.

By analyzing the discrepancy between these two, the AI learns your unique patterns (e.g., "You perform best on Logical tasks at 10 AM if you slept >7 hours, regardless of feeling groggy").

## ✨ Key Features

- **Bio-Metric Logging**: Track sleep duration, wake time, and waking condition to understand your biological baseline.
- **Session Tracking**:
  - **Pre-Session**: Log mood, context tags (e.g., `caffeine`, `quiet_environment`), and intended task type.
  - **Post-Session**: Rate output (High/Med/Low), calculate net focus time (minus breaks), and log distractions.
- **AI Coach (Gemini 1.5 Flash)**:
  - Uses **Context Injection** to analyze your last 30 days of logs.
  - Predicts your daily energy curve.
  - Suggests the best time for Deep Work vs. Admin tasks.
  - Identifies "Crash Zones" to avoid burnout.
- **Data-Driven Insights**: Discover patterns like "Caffeine helps me recover from <6 hours sleep" or "I crash at 2 PM on days I skip breakfast."

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev) (React Native)
- **Language**: TypeScript
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Backend/DB**: [Supabase](https://supabase.com) (PostgreSQL + Auth)
- **AI Engine**: Google Gemini 1.5 Flash (via Google Generative AI SDK)

## 🏃‍♂️ Getting Started

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file with your Supabase and Gemini API keys:

    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
    EXPO_PUBLIC_GEMINI_API_KEY=your_key
    ```

3.  **Start the App**
    ```bash
    npx expo start
    ```

## 📂 Project Structure

- `app/`: File-based routing (Expo Router).
- `components/`: Reusable UI components (NativeWind).
- `lib/`: Service integrations (Supabase, Gemini).
- `constants/`: App-wide constants and theme settings.

## 🤝 Contributing

This is a personal project focused on self-optimization. Suggestions for new metrics or AI prompt improvements are welcome!
