# Wish2Care Mobile

Expo (React Native) app for field workers to view and screen students at their assigned school. Companion to the `frontend/` web app (admin-facing) — both talk to the same `backend/` API and share types/schemas via `shared/`.

## Who uses this

A field worker signs in, sees the list of students at their assigned school, opens a student's "Health Passport" (screening progress, quick actions), views their 8-domain wellness report, and can edit/enter that data on-site — often with unreliable connectivity, which shapes several architecture decisions below.

---

## Tech stack, and why

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 55 / React Native 0.83 | Managed native tooling (builds, OTA-capable) without giving up native modules. |
| Dev runtime | Custom **`expo-dev-client`** build, not Expo Go | Not tied to whatever RN/SDK version Expo Go's store listing supports — this project can add any native module (e.g. NetInfo) on its own schedule. |
| Language | TypeScript, `strict: true` | Shared types with `backend/`/`frontend/` via `shared/`, catches drift at compile time. |
| Navigation | React Navigation (native-stack) + a hand-written `RootStackParamList` | Every screen's params are typed — `navigation.navigate('X', {...})` is checked at compile time, no `useNavigation<any>()`. |
| Data fetching | **TanStack Query** (`@tanstack/react-query`) | Replaces hand-rolled `useState`/`useEffect`/loading-flag boilerplate with caching, dedup, retry, and (below) offline-aware pause/resume — for free, and shared conceptually with `frontend/`, which uses the same library. |
| Forms | `react-hook-form` + `zod` (via `@hookform/resolvers`) | Validates against the **exact same** `healthRecordPartialSchema` the backend enforces — same library/schema `frontend/`'s equivalent form uses, so the two apps can't silently drift on what's valid. |
| Offline / persistence | `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` + `@react-native-community/netinfo` | See "Offline & persistence" below — this is the part that exists specifically because field connectivity is unreliable. |
| Storage | `@react-native-async-storage/async-storage` | Session token + the persisted query cache. |
| Testing | `jest-expo` + `@testing-library/react-native` | Standard Expo-native testing stack; see "Testing" below for a version-pinning gotcha specific to this monorepo. |

---

## Architecture

### Folder structure

```
mobile/
├── App.tsx                  # composition root only — wires providers together, no business logic
├── src/
│   ├── screens/<Name>/      # one folder per screen; screen-local components live here too
│   ├── components/          # only components reused across 2+ screens (Button, TextField, Logo, OfflineBanner)
│   ├── navigation/          # RootNavigator.tsx + types.ts (RootStackParamList)
│   ├── hooks/                # useAuth, useAppFonts, useOnlineStatus
│   ├── theme/                # colors.ts, typography.ts — design tokens
│   └── lib/                  # framework-agnostic utilities: api.ts (fetchApi), queryClient.ts
```

Screens, in the order a worker moves through them:

- **`SignIn`** — login form, calls `POST /auth/login` directly (no react-query — see `useAuth` below).
- **`Home`** — the student list for the worker's assigned school (`GET /students`, already scoped server-side).
- **`StudentDetail`** — "Health Passport" summary: greeting, a screening-progress ring, 4 quick actions (Doctor/Lab Test → `ComingSoon` placeholders, no backend support yet; Report → `StudentReport`; SOS → `Linking.openURL('tel:108')` directly, not a screen).
- **`StudentReport`** — the 8-domain wellness data, **read-only**. Its header has an Edit (pencil) icon — added via `RootNavigator`'s per-screen `options` callback so `StudentReport.tsx` itself stays purely a display component — that opens:
- **`HealthRecordForm`** — the editable version of the same data. Every classification field (`undernutritionClass`, `bpClass`, etc.) is a manual pick from a fixed set (`Normal`/`Caution`/`High-risk`) — nothing is computed client- or server-side. Saves via `PUT /health-records/:studentId`, the only write endpoint, which is a true partial-update despite the HTTP verb.

### Navigation

`src/navigation/types.ts` exports one `RootStackParamList` that every screen's `useNavigation`/`useRoute` call is typed against:

```ts
useNavigation<NativeStackNavigationProp<RootStackParamList, 'StudentDetail'>>()
useRoute<RouteProp<RootStackParamList, 'StudentDetail'>>()
```

No screen defines its own local param type or reaches for `useNavigation<any>()`. Adding a screen means adding one line to `RootStackParamList` — every existing `navigate()` call that should now be flagged as wrong, is.

### Data fetching

All server data goes through `useQuery`, not manual `useState`/`useEffect`:

- Query keys: `['students']` for the list, `['students', studentId]` for a single student. **`StudentDetail`, `StudentReport`, and `HealthRecordForm` all use the same `['students', studentId]` key** — navigating between them for the same student is cache-instant, no spinner, no re-fetch.
- The one `QueryClient` (plus mutation-key constants, the health-record `mutationFn`, and the persister) lives in `src/lib/queryClient.ts`, constructed once and imported into `App.tsx`.
- `useAuth`'s `logout()` calls both `queryClient.clear()` (in-memory cache) **and** `persister.removeClient()` (the AsyncStorage-persisted copy) — both are needed so a second worker signing in on a shared device never sees a flash of the previous worker's data.

### Offline & persistence

This is the part that exists because field workers are the target users, and they don't always have signal:

- `onlineManager` (react-query's own connectivity tracker) is wired to real device connectivity via `@react-native-community/netinfo` in `queryClient.ts`. That wiring is wrapped in a `try`/`catch` — NetInfo is a **native module**, so on a dev-client build that predates it being added, it degrades to "always online" (the pre-NetInfo behavior) instead of crashing the app on launch.
- `App.tsx` wraps everything in `PersistQueryClientProvider` (not plain `QueryClientProvider`), backed by AsyncStorage. This means the query cache — and any **paused** mutation — survives an app restart. When connectivity returns, its `onSuccess` calls `queryClient.resumePausedMutations()`, so a save made while offline fires automatically without the worker reopening the screen.
- Saving a health record (`HealthRecordForm/useSaveHealthRecord.ts`) uses `useMutation`, not a raw `fetchApi()` call — deliberately, unlike `frontend/`'s hand-rolled autosave — specifically so it's part of this pause/resume/persist machinery. It also does an **optimistic update**: the edit is merged into the cached student immediately (recomputing progress via the same `countCompletedDomains`/`isRecordComplete` helpers `StudentDetail` uses), so `Home`'s badge and `StudentDetail`'s ring update instantly, even while the save is still paused offline.
- Any mutation meant to survive a cold restart has to be registered **twice**: once via `queryClient.setMutationDefaults(key, { mutationFn })` at module scope (so a mutation rehydrated from AsyncStorage — with no screen mounted — can still find its function, since functions don't survive JSON persistence), and once normally inside the `useMutation()` call in the screen. See `useSaveHealthRecord.ts` for the pattern if adding a second mutation later.
- `useOnlineStatus()` + `<OfflineBanner />` (mounted once in `RootNavigator`, above the stack) give app-wide "you're offline" awareness. Per-screen save status (`HealthRecordForm/SaveStatus.tsx`) is driven by the *mutation's own* `isPaused`, not a separate online check — that reflects that specific request's state, not just general connectivity.

### Auth

`useAuth.tsx` mirrors `frontend/src/hooks/useAuth.tsx`'s shape and flow exactly (Context, `login(token, user)`, `logout()`), so the two apps share a mental model even though they share no code. Session token lives in AsyncStorage; on mount, a stored token is validated against `GET /auth/me`.

### Theming

`src/theme/colors.ts` / `typography.ts` hold the Wish2Care brand tokens (Poppins, purple/green palette). New tokens (spacing, radii) get added only once a value repeats in 2+ places — not preemptively.

---

## Why this is scalable

- **Adding a screen or domain doesn't mean re-deriving patterns.** Data fetching, navigation typing, and folder placement are all established conventions (`useQuery` + typed nav + screen-local components) — a new screen follows the existing shape instead of inventing its own.
- **The cache is shared, not per-screen.** Three screens already read the same student via one cache entry; the pattern scales to however many screens end up needing student data without adding N separate fetches.
- **Offline isn't bolted onto one feature — it's infrastructure.** `onlineManager`/`PersistQueryClientProvider` live at the `QueryClient` level, so any *future* mutation gets pause/resume/persist behavior for free by following the two-registration pattern above, not by re-solving offline handling from scratch each time.
- **A real test harness exists**, with the trickiest parts (React-version pinning, ESM package resolution, offline-state testing) already solved once — a new screen's tests are additive, not another round of infrastructure fights.
- **Form validation can't drift from the backend** — `HealthRecordForm` validates against the literal schema `shared/` exports, the same one the backend enforces server-side.

What *isn't* covered by this — see `mobile/CLAUDE.md`'s "Explicitly out of scope" section and the Known Limitations below.

---

## How to run

### Prerequisites

- Node.js v18+, npm (this is an npm-workspaces monorepo — always run `npm install` from the **repo root**, never inside `mobile/` alone).
- The backend needs to be running for the app to do anything past the login screen (student list, saving records — all of it hits the API).

### 1. Start the backend (from the repo root, separate terminal)

```bash
docker-compose up -d        # Postgres + pgAdmin
npm run dev                 # backend (:3000) + frontend web (:5173)
```

### 2. Point the mobile app at the backend

Copy `mobile/.env.example` to `mobile/.env` if you haven't, and set `EXPO_PUBLIC_API_URL`:

- **Android emulator**: `http://10.0.2.2:3000/api` (this is the default already in `.env.example`)
- **Physical device**: `http://<your-machine's-current-LAN-IP>:3000/api` — find it with `ipconfig` (Windows) and look for the WiFi adapter's IPv4 address. **This changes whenever your machine's IP changes** (new network, DHCP lease renewal) — if the app suddenly can't reach the API, check this first before anything else.
  - Phone and computer must be on the **same WiFi network**.
  - Changing `.env` requires **restarting** `npm run dev:mobile`, not just reloading the app — `EXPO_PUBLIC_*` vars are inlined into the bundle at Metro start time, not read live.

### 3. Start the mobile dev server (separate terminal, from repo root)

```bash
npm run dev:mobile
```

This is Expo's interactive CLI. Once running:
- Press `a` for a connected Android emulator, `i` for iOS Simulator (macOS only).
- On a **physical device with the dev-client already installed**, just open the app — it connects automatically if it's on the same network and was previously paired, or scan the QR code shown in the terminal.
- Useful keys while it's running: `r` reload, `m` toggle the in-app dev menu, `j` open the JS debugger — all of these need the app to currently be open and in the foreground; Android drops the connection if the app is backgrounded or the screen locks, so reopen the app fresh if these stop responding.

### When you need a native rebuild

Plain JS/TS changes hot-reload through the existing dev-client build — most of the time you'll never need this. You only need a new build when a **native** dependency changes (a new package with native code, e.g. `@react-native-community/netinfo`, or an Expo SDK upgrade):

```bash
cd mobile
npx eas-cli build --profile development --platform android
```

This is a cloud build (~10–20 min). It does **not** install anything automatically — once it finishes, EAS gives you a QR code / download link; open that on the phone and install the resulting `.apk` (it'll prompt to update the existing app, same package). Only after that's installed will the new native code actually be present on the device.

---

## Testing

```bash
npm test --workspace=mobile
```

`jest-expo` + `@testing-library/react-native`, config in `mobile/jest.config.js` / `babel.config.js` / `jest.setup.js`. Tests are colocated next to the file they cover (`Foo.tsx` → `Foo.test.tsx`), not in a separate `__tests__/` tree.

**Two non-obvious things in the Jest config exist for real reasons, found by actually running the suite — don't remove them without re-running `npm test` clean:**

1. **`react`/`react-dom`/`react-test-renderer` are pinned to an exact `19.2.0`** in `package.json` (no `^`), with a scoped `overrides["@wish2care/mobile"]` in the root `package.json` forcing it through mobile's whole dependency tree, **and** `jest.config.js`'s `moduleNameMapper` forces every consumer (including deep inside `node_modules`) onto that same copy. Reason: `jest-expo`'s installed version hard-pins an exact `react-test-renderer` patch that can trail whatever `react` patch `frontend/` pulls in — without all three of these, two different React copies end up in the test run and Jest fails with "Invalid hook call." Metro (the real app's bundler) doesn't have this problem — `metro.config.js` already special-cases this monorepo's module resolution; Jest's plain resolver doesn't.
2. **`@wish2care/shared` is mapped to its built `dist/index.js` directly** in `moduleNameMapper`, because that package is ESM-only with no `require` export condition — Jest's CJS-based resolver can't find it via plain `require()` otherwise. Metro handles this natively.

Current coverage: `useAuth`'s full lifecycle (login/logout/session-restore/token-expiry), `fetchApi`'s error branching, `useOnlineStatus`, and `HealthRecordForm` (pre-fill, save, and the offline-pause path). Not covered yet: `Home`, `StudentDetail`, `StudentReport`, `SignIn`, navigation itself.

---

## Building & deploying

`mobile/eas.json` profiles:

| Profile | Purpose |
|---|---|
| `development` | `developmentClient: true` — what you rebuild for local dev when a native dep changes. Internal distribution. |
| `preview` | Internal distribution, non-dev-client — for sharing a test build without Metro. |
| `production` | `autoIncrement: true` — store-bound build. |

Run any of them with `npx eas-cli build --profile <name> --platform <android|ios>` from `mobile/`.

---

## Known limitations

- **Never verified on a real device by an automated process** — everything in this repo's history was checked via typecheck, `jest`, and a `--web` bundle smoke test in an environment with no attached emulator. Treat on-device behavior as unverified until someone actually runs the manual checklist below.
- **Session expiry isn't handled specially.** A 401 from an expired token just surfaces as a raw error message on whatever screen triggered it, instead of redirecting to `SignIn`.
- **No crash reporting.** A production crash on a worker's device currently has no way to reach you (no Sentry/Crashlytics equivalent wired up).
- **Cold-start-while-offline edge case**: a device with no prior successful session (no persisted cache yet) that's offline on first launch will show a spinner indefinitely on data screens, since queries pause via `onlineManager` — no fallback message for that specific case yet.
- **Backend has no school-scoping on `GET /students/:id`** — any authenticated worker can fetch any student's record by ID, not just their assigned school's. This is a backend fix, not a mobile one, but the mobile app is the primary consumer of that endpoint's data.
- See `mobile/CLAUDE.md`'s "Explicitly out of scope" section for features intentionally not built (doctor/lab/teleconsult, per-student login).

### Manual on-device checklist (do this after any native rebuild)

1. Airplane mode on → `OfflineBanner` appears.
2. Edit + Save a record while offline → status shows "Offline — will save when reconnected," no error.
3. Kill the app via the OS app switcher (not just background it) while that save is pending.
4. Relaunch while still offline → session persists, the edited value is already visible from the persisted cache.
5. Airplane mode off → the paused save fires automatically, status resolves to "Saved" without reopening the screen.
6. Log out, log in as a different worker on the same device → no flash of the previous worker's cached data.
