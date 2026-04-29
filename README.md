# ShiftCare Mobile Challenge

A React Native booking app for browsing doctors, viewing 30-minute appointment slots, and managing bookings. Built with Expo, TypeScript, and React Navigation.

## Setup & Usage

```bash
git clone <repo-url>
cd shiftcare-mobile-challenge
npm install

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run tests
npm test
```

Requires Node 18 or later, plus Xcode for iOS or Android Studio for Android.

## Tech Stack

- Expo SDK 54 with React Native 0.81.5
- TypeScript in strict mode
- React Navigation 7 (native-stack) for routing
- React Context with useReducer for booking state
- AsyncStorage for offline booking persistence
- expo-crypto for UUID generation
- Jest with jest-expo for tests

## Project Structure

```
src/
  types/          Domain types (Doctor, Slot, Booking, Schedule, ScheduleEntry)
  services/       API client and data transformation
  utils/          Slot generation, time parsing, format helpers
  hooks/          useDoctors hook
  context/        BookingsContext with reducer, provider, and useBookings hook
  navigation/     Stack navigator with typed route params
  screens/        Four screens (DoctorsList, DoctorDetail, BookingConfirmation, MyBookings)
  components/     Shared components (LoadingState, ErrorState, Avatar)
```

## Architecture Notes

The API returns a flat array of schedule entries, one row per doctor per day. `transformToDoctors` groups these by name into `Doctor` objects with nested `Schedule` arrays. From there, `generateSlots` takes a doctor and a date, matches the day of week, and produces 30-minute `Slot` objects for each availability window.

Bookings are managed with `useReducer` and a typed action union (`HYDRATE_SUCCESS`, `ADD_BOOKING`, `CANCEL_BOOKING`, etc.). I export the reducer separately so it can be unit tested without rendering the provider. On mount, the provider hydrates from AsyncStorage and persists on every state change. There's a `loading` guard that prevents the empty initial state from overwriting saved data before hydration completes.

Navigation is a single native stack with four screens. After confirming a booking, the stack resets to `[DoctorsList, MyBookings]` with `MyBookings` active so the back button goes to the doctors list instead of looping back to the confirmation screen. The "Browse Doctors" button on the empty My Bookings screen resets the stack too, to avoid stale history.

To prevent double-bookings, `slotKey()` produces a canonical string: `doctorName|date|startTime`. Before creating a booking, `addBooking` checks all existing bookings against this key and returns `{ success, error? }` rather than throwing, so the caller can act on the result synchronously.

## Assumptions & Design Decisions

**Timezone strategy** — All times are displayed as wall-clock times in the doctor's timezone rather than converting to the device's local time. These are in-person appointments, so the doctor's local time is what actually matters to the patient. This also sidesteps DST edge cases and is consistent with how platforms like HotDoc handle it. The timezone is shown on every screen that displays times so the user always has context.

**Doctor identity by name** — The API has no IDs, so doctors are keyed by name. Two doctors with the same name would collide, but I accepted that as a data limitation rather than inventing synthetic IDs that wouldn't survive a real backend integration.

**Context over Redux** — With only one shared state domain (bookings), Context + `useReducer` gives predictable state updates without Redux Toolkit's boilerplate. The reducer is a pure function and easy to test. RTK would make more sense if the app grew to need optimistic updates, server sync, or multiple state domains, and the reducer would migrate cleanly.

**Why addBooking returns a result object** — The confirmation screen needs to know immediately whether a booking succeeded so it can navigate or show an error. Reading `error` from context after `await addBooking(slot)` doesn't work because the component still holds the previous render's closure. Returning `{ success, error? }` gives the caller synchronous access to the outcome.

Slot times are stored in 24-hour format (`"09:00"`, `"13:30"`) so they sort lexicographically without Date parsing. The 12-hour formatting (`"9:00 AM"`) happens at the screen level via `formatTimeForDisplay`.

Doctor Detail shows seven days starting from today. Since the API returns a weekly recurring schedule, one week covers every availability pattern without redundancy. A calendar month view or two-week window (similar to Calendly) would be a natural next step.

I put the doctor's name in the nav header rather than as an in-screen heading to avoid doubling up, save vertical space for the slot grid, and let iOS handle truncation for long names. The back button says "Back" instead of "Doctors" because the labelled version looked cluttered next to the dynamic title.

The cancel button on My Bookings is a muted pink pill (`#fde8e8` background, `#c00` text) so it's clearly tappable without dominating the row. The doctor name should be the primary visual.

For data fetching I went with a custom `useDoctors` hook using native `fetch` instead of TanStack Query. There's only one read-only endpoint with no refetch or cache invalidation needs, so TanStack Query would add weight without much benefit at this scope. Worth adding the moment a second endpoint or mutation comes in.

Styling uses React Native's `StyleSheet` with hardcoded colours and spacing. For four screens this keeps things simple and dependency-free. A shared theme module or Unistyles would make sense once the app grows beyond this.

Booking row removal is animated with React Native's `LayoutAnimation`, which is native-driven with zero extra dependencies. `react-native-reanimated` would be overkill for a single cancel animation.

Both bookings and doctor data persist to AsyncStorage. Bookings are fully offline: created, read, and cancelled locally with no server dependency. Doctor data uses a cache-then-network strategy where `useDoctors` loads cached data first so the UI renders immediately, then fetches fresh data in the background. If the network request fails and there's cached data, the app keeps using what it has. After one successful launch the app works fine without connectivity.

Components stay inline unless they're reused. The extracted ones are `LoadingState` (three screens), `ErrorState` (two screens), and `Avatar`. Format helpers live in `src/utils/format.ts` since three screens use them. Everything else (slot cells, day pills, booking rows, doctor card rows) is inline as single-screen code; extracting them now would just add files without saving lines.

## Known Limitations

- The API doesn't consistently prefix names with "Dr." (only one entry has it). I display names as-is rather than guessing who holds the title.
- Doctor identity is by name string, so two doctors with the same name would collide.
- The 7-day picker is computed on mount. If the app stays open past midnight the day list goes stale until the user navigates away and back.
- API responses and AsyncStorage data use basic type guards instead of full schema validation. In production I'd add Zod at the boundary.

## Testing

42 tests across 2 test suites, all passing.

`src/utils/slots.test.ts` (31 tests) covers:
- Time parsing: valid inputs, whitespace handling, noon/midnight edge cases, malformed inputs
- Slot generation: correct counts, 30-minute intervals, window boundaries, remainder dropping, split schedules (Dr. Keebler's Thursday), unavailable days, malformed windows, output format
- Slot key: stability and uniqueness across doctor, time, and date

`src/context/BookingsContext.test.ts` (11 tests) covers:
- All six reducer action types
- Immutability (ADD_BOOKING doesn't mutate the source array)
- Idempotency (cancelling a non-existent booking is a no-op)
- State preservation (HYDRATE_FAILURE keeps existing bookings)
- Unknown action fallthrough

I didn't cover screen rendering, navigation flows, API fetch integration, or the `useDoctors` hook. The testing libraries for component tests are installed but unused. I focused on the core logic (slot generation and state transitions) since that's where bugs are hardest to catch by hand.

## What I'd Do With More Time

**Architecture**
- `AbortController` in `useDoctors` for proper fetch cancellation instead of the mounted-ref pattern
- Zod validation at the API boundary
- A `useDoctor(name)` hook so Doctor Detail doesn't have to filter the full array
- Shared theme module (or Unistyles) once the codebase outgrows four screens
- TanStack Query once a second endpoint or mutation comes in

**Features**
- Loading skeletons instead of spinners, with card outlines matching the final layout
- Swipe-to-delete on My Bookings as an alternative to the Cancel button
- Calendar month view alongside the 7-day picker
- Separate upcoming/past sections on My Bookings, filtered by date
- Relative timezone offset next to the city name ("Sydney, Australia · 1 hour ahead of you")
- Push notifications for upcoming appointments
- Offline booking queue that syncs when connectivity returns

**Testing**
- Component tests using the already-installed `@testing-library/react-native`
- `transformToDoctors` tests covering malformed API entries

**Components**
- The slot grid cell, day pill, doctor card row, and booking row would be worth extracting if any gained a second consumer. They're inline for now since each only appears once.
