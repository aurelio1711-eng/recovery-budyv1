# Recovery Buddy - Feature Suggestions

Based on a full codebase scan of the current application.

---

## Current Feature Summary

| Feature | Status |
|---------|--------|
| Landing page with feature highlights | Shipped |
| Dashboard with progress ring + stats | Shipped |
| Category-based group browsing (6 categories) | Shipped |
| Daily check-in modal with notes + signature | Shipped |
| Weekend pass eligibility countdown (30-day) | Shipped |
| Performance review with weekly attendance | Shipped |
| Pass history tracking | Shipped |
| Custom group creation ("Other" category) | Shipped |
| Settings (program dates, data export/import) | Shipped |
| Undo last check-in (toast-based) | Shipped |
| Dark mode toggle | Shipped |
| Mobile responsive layout | Shipped |
| LocalStorage persistence | Shipped |
| Signature pad (canvas-based) | Shipped |
| NYC time zone sync | Shipped |
| Calendar heatmap view | **Shipped** (new) |
| PDF / Print progress report | **Shipped** (new) |
| Global search & filter | **Shipped** (new) |
| Bulk check-in | **Shipped** (new) |
| Push notifications & reminders | **Shipped** (new) |

---

## Suggested Features

### High Priority

1. **Streak Tracking** - Track consecutive days with at least one check-in. Display current and longest streaks on the dashboard. Motivational and commonly requested in habit/recovery apps.

2. ~~**Push Notifications / Reminders**~~ - **Implemented** — `notifications.ts` service with permission handling, daily reminders, end-of-day nudges, and configurable schedule in Settings.

3. ~~**Calendar View**~~ - **Implemented** — Monthly heatmap in `CalendarView.tsx`, added to nav and mobile tabs.

4. ~~**PDF / Print Export**~~ - **Implemented** — `PrintableReport.tsx` with CSS print styles for progress reports.

5. **Session Notes History** - Check-in notes are stored but not surfaced anywhere beyond the daily view. Add a searchable/filterable notes history page.

### Medium Priority

6. **Goal Setting per Group** - Allow users to set personal target dates for completing specific groups, with deadline reminders.

7. **Attendance Rate Analytics** - Weekly/monthly check-in frequency charts (bar or line). The data exists in `CheckInsRecord` but no visualization is provided beyond the weekly table.

8. **Multi-Profile Support** - Currently single-user. Allow multiple profiles (e.g., for counselors managing several clients, or family members tracking separate programs).

9. **Offline-First with Sync** - Data is already localStorage-only. Add optional backend sync (e.g., via Supabase or Firebase) for cross-device access and backup.

10. **Group Scheduling** - Let users assign specific days/times to groups and get reminders. The `time` field on `Group` exists but is unused in the UI.

### Low Priority

11. **Achievements / Milestones** - Unlockable badges for completing groups, hitting streaks, reaching 30/60/90 days, etc.

12. **Motivational Quotes** - Daily rotating recovery-themed quotes on the dashboard or landing page.

13. ~~**Search & Filter**~~ - **Implemented** — `SearchModal.tsx` with global search across groups, notes, and dates.

14. **Dark Mode Persistence** - Dark mode state resets on page reload. Persist the user's preference to localStorage.

15. **Keyboard Navigation** - Improve accessibility with keyboard shortcuts (e.g., `N` for new check-in, `D` for dashboard, arrow keys for category navigation).

16. **Confirmation Email / Link Sharing** - Let users email or share a read-only progress snapshot with a counselor or support person.

17. **Color-Coded Group Cards** - Visual differentiation of group cards by completion status (not started, in progress, completed) using color.

18. ~~**Bulk Check-In**~~ - **Implemented** — `BulkCheckIn.tsx` with multi-select groups, shared notes, date picker.

19. **Timezone Selector** - NYC time is hardcoded. Allow users to configure their own timezone.

20. **Data Versioning / Migration** - The `ImportValidation` schema is flat. Add version fields and migration logic for future schema changes.

---

## Architecture Notes

- **No backend** - All data lives in `localStorage`. Any sync/multi-device feature requires a server component.
- **No routing** - Navigation is manual state (`Page` type). React Router would enable URL-based deep linking and browser history.
- **No tests** - `App.test.tsx` exists but is minimal. Adding component and integration tests would de-risk new features.
- **No error tracking** - `ErrorBoundary` catches render errors but nothing is reported. Consider Sentry or similar for production.

### New Files Added

| File | Feature |
|------|---------|
| `src/components/CalendarView.tsx` | Monthly check-in heatmap calendar |
| `src/components/PrintableReport.tsx` | Print-friendly progress report |
| `src/components/SearchModal.tsx` | Global search across groups and notes |
| `src/components/BulkCheckIn.tsx` | Multi-group check-in modal |
| `src/services/notifications.ts` | Push notifications & reminder scheduling |
