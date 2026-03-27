# Ember

Ember is a mobile task manager built for people who actually want to get things done. You can create tasks, set priorities, organize them by category (Work, Personal, Fitness), schedule reminders, and track your progress over time with a simple analytics view. Everything syncs to the cloud so your tasks follow you across sessions.

Built with React Native and Expo, backed by Supabase.

---

## What's inside

- Create and manage tasks with priorities (Low / Medium / High) and categories
- Filter and sort your task list however you like
- Set reminders — the app schedules a push notification before the task is due
- Calendar view to see what's on your plate for any given day
- Backlog screen for tasks without a specific date
- Analytics tab showing completion rates by category and priority, plus a 7-day trend chart
- Auth with email/password — your tasks are tied to your account

---

## Running it locally

You'll need Node.js, npm, and the Expo CLI installed. A Supabase project is also required for the backend — without it the app will load but auth and task syncing won't work.

**1. Clone the repo and install dependencies**

```bash
git clone https://github.com/anhadh3101/ember.git
cd ember/ember-ios
npm install
```

**2. Set up your environment variables**

Create a `.env` file inside `ember-ios/` and fill in your Supabase project credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase dashboard under Project Settings → API.

**3. Start the dev server**

```bash
npx expo start
```

From there, press `i` to open in the iOS simulator, `a` for Android, or scan the QR code with the Expo Go app on your phone.

---

## Running the tests

```bash
cd ember-ios
npm test
```

This runs the full test suite (unit + integration tests) using Jest. Results are printed to the console and also saved as `junit.xml` for CI.

---

## Tech stack

- [React Native](https://reactnative.dev) + [Expo](https://expo.dev) — the app framework
- [Expo Router](https://expo.github.io/router) — file-based navigation
- [Supabase](https://supabase.com) — database and authentication
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — local push reminders
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) — swipe gestures and animations
- TypeScript throughout
