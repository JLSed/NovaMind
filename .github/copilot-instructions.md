# NovaMind Copilot Instructions

## 🧠 Project Philosophy & Core Logic

- **Concept**: Chronobiology & Energy Management.
- **Core Principle**: **Output > Mood**. The app compares subjective feeling (Pre-Work) vs. actual performance (Post-Work) to find patterns.
- **Goal**: Identify "Peak Performance Windows" and "Crash Zones" based on biological data (Sleep) and context (Tags).

## 🏗 Project Architecture

- **Framework**: Expo (React Native) with Expo Router (File-based routing).
- **Language**: TypeScript (Strict mode).
- **Styling**: NativeWind (Tailwind CSS) - use `className` props.
- **Backend**: Supabase (Auth & Database).
- **AI Engine**: Google Gemini 1.5 Flash (via `@google/generative-ai`).

## 📂 Key Directories & Files

- `app/`: Routes and screens.
  - `_layout.tsx`: Root layout, handles Auth state (`supabase.auth.onAuthStateChange`) and protection.
  - `(tabs)/`: Main tab navigation (Home, Session, History).
- `lib/`: Service integrations.
  - `supabase.ts`: Supabase client setup.
  - `gemini.ts`: AI logic, `SYSTEM_PROMPT`, and context injection.
- `components/`: Reusable UI components.
  - `ui/icon-symbol.tsx`: Cross-platform icon wrapper.
- `hooks/`: Custom hooks (e.g., `useColorScheme`).

## 🔄 Data Flow & Schema

- **Database**: Single table `productivity_logs`.
  - `id`: UUID
  - `user_id`: UUID (Auth)
  - `entry_date`: Date
  - `log_data`: **JSONB** (Stores all metrics).
- **JSON Structure (`log_data`)**:
  - `daily_bio_metrics`: `sleep_duration_hours`, `waking_condition`, `sleep_waketime`.
  - `sessions`: Array of work blocks.
    - `pre_session`: `subjective_mood`, `context_tags` (e.g., ["caffeine", "quiet"]), `start_time`.
    - `post_session`: `output_rating` (High/Med/Low), `net_focus_minutes` (Total - Breaks), `distraction_level`.

## 🎨 Styling Conventions

- Use **NativeWind** (`className`) for all styling.
- **Colors**: Use Slate (`bg-slate-900`, `text-slate-300`) for dark mode base.
- **Layout**: Flexbox is default. Use `flex-1`, `justify-center`, `items-center`.
- **Safe Area**: Use `SafeAreaView` from `react-native-safe-area-context` for screen containers.

## 🛠 Developer Workflow

- **Start**: `npx expo start` (Select Android/iOS/Web).
- **Reset**: `npm run reset-project` (Resets to blank state).
- **Env Vars**: Use `EXPO_PUBLIC_` prefix for client-side variables (e.g., `EXPO_PUBLIC_SUPABASE_URL`).

## 🤖 AI Integration Patterns

- **Strategy**: **Context Injection**. We do NOT fine-tune. We send `HISTORY_LOGS` (last 30 days) + `CURRENT_STATE` in every prompt.
- **Prompt Engineering**: Defined in `lib/gemini.ts`.
- **Output**: AI returns Markdown formatted text with sections: `📊 Daily Prediction`, `🕒 Recommended Flow`, `💡 Insight`.

## 🚨 Common Pitfalls

- **Auth Redirects**: Ensure `app/_layout.tsx` logic covers all protected routes.
- **JSON Data**: `log_data` is unstructured in DB; strictly validate types in TypeScript (see `LogEntry` type in `history.tsx`).
- **Icons**: Use `IconSymbol` instead of direct library imports for cross-platform consistency.

## 🚨 Instruction

-- stop changing the AI model being used in the project. it should always be "gemini-flash-latest"
-- before adding a function, constant, or component, check if there is an existing one that can be reused or extended to avoid duplication.
-- create a list of function, constant, or component that might be reusable or extendable then read the list to check if the requested prompt can use components in this list.
-- when adding constant data options, always add them to the constants/data.ts file
-- when dealing with icons make sure they are mapped correctly to SF symbols and materials icon in the components/ui/icon-symbol.tsx file
-- if you encounter a prompt that requires significant changes to the data structure, architecture, or core logic of the app, notify the user and get approval before proceeding.
-- if you encounter an unused import, variable, function, or component in the codebase, remove it to keep the code clean and efficient.
-- make sure to check if the code you are adding or modifying does not produce any TypeScript errors or warnings.
-- before finishing your response check if there are any errors or warnings in the code you provided and fix them.
-- when creating a new screen or component, ensure it follows the existing design patterns and coding conventions used throughout the project.
-- always ensure that any new code you write is compatible with both Android and iOS platforms, considering any platform-specific nuances.
-- ui components should be designed to be as reusable as possible and be placed in the components/ui directory.
