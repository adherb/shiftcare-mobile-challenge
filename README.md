# ShiftCare Mobile Challenge

A React Native booking app that lets users browse doctors, view 30-minute appointment slots, and manage bookings. Built with Expo, TypeScript, and React Navigation.

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

**Data flow.** The API returns a flat array of schedule entries, one row per doctor per day. `transformToDoctors` groups these by name into `Doctor` objects with nested `Schedule` arrays. `generateSlots` takes a doctor and a date, matches the day of week, and produces 30-minute `Slot` objects for each availability window.

**State management.** Bookings use `useReducer` with a typed action union (`HYDRATE_SUCCESS`, `ADD_BOOKING`, `CANCEL_BOOKING`, etc.). The reducer is exported separately so it can be unit tested without rendering the provider. The provider hydrates from AsyncStorage on mount and persists on every state change, with a `loading` guard that prevents the empty initial state from overwriting saved data before hydration completes.

**Navigation.** A single native stack with four screens. After confirming a booking, the stack resets to `[DoctorsList, MyBookings]` with `MyBookings` active, so the back button returns to the doctors list rather than looping back into the confirmation screen and risking a double-tap. The "Browse Doctors" button on the empty My Bookings state also resets the stack so there's no stale history.

**Double-booking prevention.** `slotKey()` produces a canonical string of `doctorName|date|startTime`. Before creating a booking, `addBooking` checks all existing bookings against this key. The function returns `{ success, error? }` rather than throwing, so the caller can act on the result synchronously without waiting for a re-render.

## Assumptions & Design Decisions

**Timezone strategy.** All times are displayed as wall-clock times in the doctor's timezone. I chose this over device-timezone conversion because (a) these are in-person appointments where the doctor's local time is what matters, (b) it avoids an entire class of DST bugs, and (c) it matches how real booking platforms like HotDoc work. The doctor's timezone is shown on every screen that displays times so the user always has context.

**Doctor identity by name.** The API provides no IDs, so doctors are identified by their name string. Two doctors with identical names would collide. I accepted this as a data limitation rather than inventing synthetic IDs that wouldn't survive a real backend integration.

**Context over Redux.** For an app with a single shared state domain (bookings), Context with `useReducer` gives the same predictable state updates without the boilerplate of Redux Toolkit. The reducer is a pure function that's trivially testable. If the app grew to include optimistic updates, server sync, or multiple state domains, I'd reach for RTK and the reducer pattern would migrate cleanly.

**addBooking returns a result object.** The confirmation screen needs to know immediately whether a booking succeeded so it can either navigate or show an error. Reading `error` from context after `await addBooking(slot)` doesn't work because the component still holds the previous render's closure. Returning `{ success, error? }` gives the caller synchronous access to the outcome.

**12-hour display, 24-hour storage.** Slot times are stored in 24-hour format (`"09:00"`, `"13:30"`) so they sort lexicographically without needing Date parsing. Display formatting to 12-hour (`"9:00 AM"`) happens at the screen level via a shared `formatTimeForDisplay` helper.

**7-day picker.** Doctor Detail shows seven days starting from today. The API returns a weekly recurring schedule, so showing exactly one week covers every availability pattern a doctor offers without redundancy. A future enhancement would be to show two weeks (a common pattern in apps like Calendly) or a calendar month view for users planning further ahead.

**Doctor Detail header.** The doctor's name lives in the nav header rather than as an in-screen heading. This avoids visual redundancy, saves vertical space for the slot grid, and lets iOS handle truncation natively for long names. The back button reads "Back" rather than "Doctors" because the labelled version competed with the dynamic title and read as visually noisy.

**Cancel button on My Bookings.** Styled as a muted pink pill (`#fde8e8` background with `#c00` text) so the destructive action is clearly tappable without dominating the row. The doctor name should be the primary visual; cancel is secondary.

**Data fetching.** Used a custom `useDoctors` hook with native `fetch` over TanStack Query. The data layer is a single read-only endpoint with no refetch, mutation, or cache invalidation requirements. TanStack Query would add weight without delivering its core value at this scope. I'd reach for it the moment a second endpoint or any mutation entered the picture.

**Styling.** Used React Native's built-in `StyleSheet` with hardcoded design tokens (colours, spacing) inline. For a four-screen app this keeps things readable and dependency-free. In a larger codebase I'd extract a shared theme module or use Unistyles for variants and dark mode, but adding either here would be premature.

**Animations.** Used React Native's built-in `LayoutAnimation` for booking row removal -- native-driven, zero dependency. For richer gesture-based motion (swipe interactions, drag-to-reorder, parallax) I'd reach for `react-native-reanimated`, but a take-home with one cancel animation doesn't justify it.

**Components.** Components are kept inline within their screens unless the same UI appears in multiple places. Extracted components are `LoadingState` (used on three screens), `ErrorState` (used on two), and `Avatar`. Format helpers live in `src/utils/format.ts` since they're used across three screens. Other patterns -- slot cells, day pills, booking rows, doctor card rows -- are kept inline as single-screen presentational code; speculative extraction would add file overhead without saving lines.

## Known Limitations

- The API does not consistently prefix doctor names with "Dr." -- only one entry includes it. Names are displayed exactly as returned rather than guessing which practitioners hold the title. In a production app this would be normalised at the data layer with a separate `title` field.
- `useDoctors` discards stale fetch results via a mounted ref rather than aborting the request with `AbortController`. The fetch still completes in the background.
- The 7-day picker on Doctor Detail is computed on mount with empty `useMemo` deps. If the app stays open past midnight, the day list goes stale until the user navigates away and back. Production fix would recompute on `AppState` change.
- AsyncStorage hydration uses a basic `Array.isArray` guard. Corrupted data that passes this check but contains malformed booking objects would propagate into state. A schema validator like Zod would close this gap.
- The avatar colour palette is a single grey tone. With real profile photos from a backend, the Avatar component would accept an optional `uri` prop and fall back to the icon.
- The iOS 26 Liquid Glass header button styling is preserved as the platform default. Could be suppressed via `unstable_headerRightItems` with `hidesSharedBackground: true`, but the API is marked unstable and the visual matches user expectations on iOS 26.

## Testing

42 tests across 2 test suites, all passing.

`src/utils/slots.test.ts` (31 tests) covers:
- Time parsing -- valid inputs, whitespace handling, noon and midnight edge cases, malformed inputs
- Slot generation -- correct counts, 30-minute intervals, window boundaries, remainder dropping, split schedules (Dr. Keebler's Thursday), unavailable days, malformed windows, output format
- Slot key -- stability and uniqueness across doctor, time, and date

`src/context/BookingsContext.test.ts` (11 tests) covers:
- All six reducer action types
- Immutability (ADD_BOOKING doesn't mutate the source array)
- Idempotency (cancelling a non-existent booking is a no-op)
- State preservation (HYDRATE_FAILURE keeps existing bookings)
- Unknown action fallthrough

Not covered: screen rendering, navigation flows, API fetch integration, useDoctors hook behaviour. The testing libraries for component tests are installed but unused -- the focus was on testing core logic (slot generation and state transitions) where bugs are hardest to catch manually.

## What I'd Do With More Time

**Architecture**
- `AbortController` in `useDoctors` for true fetch cancellation instead of the mounted-ref pattern
- Schema validation with Zod at the API boundary
- A dedicated `useDoctor(name)` hook so Doctor Detail doesn't filter the full doctors array
- A shared theme module (or Unistyles) for design tokens once the codebase grows past four screens
- TanStack Query for data fetching once a second endpoint or mutation appears

**Features**
- Loading skeletons in place of the current spinners -- pre-rendered card outlines that match the final layout
- Swipe-to-delete on My Bookings rows as an alternative to the explicit Cancel button
- Calendar month view as an alternative to the seven-day picker
- Separate upcoming and past sections on My Bookings, filtered by current date
- Relative timezone offset displayed alongside the city ("Sydney, Australia -- 1 hour ahead of you")
- Push notifications for upcoming appointments
- Offline-first booking queue that syncs when connectivity returns

**Testing**
- Component tests for screens using the already-installed `@testing-library/react-native`
- API transform tests for `transformToDoctors` covering malformed entries

**Components**
- If the codebase grew, candidates for extraction would include the slot grid cell, day pill, doctor card row, and booking row -- currently inline as single-screen presentational code, but worth extracting if any of them gained a second consumer.
