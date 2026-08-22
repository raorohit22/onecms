# State Management Guidelines — oneCMS

## 1. State Classification Hierarchy

To avoid state synchronization bugs and memory bloat, all application state in oneCMS must be placed in its appropriate layer:

```
Server State (TanStack Query)
      │
      ▼
Client UI State (Zustand)
      │
      ▼
URL State (nuqs / React Router)
      │
      ▼
Form State (React Hook Form)
      │
      ▼
Local Component State (useState)
```

---

## 2. Decision Tree: Where Does My State Belong?

1. **Is the data fetched from or persisted to an API endpoint?**
   - **Yes** → **TanStack Query (`useQuery` / `useMutation`)**.
   - Do NOT duplicate this into Zustand or `useState`.

2. **Does the state survive page reloads and need to be shareable via link?**
   - **Yes** → **URL Query Parameters (`nuqs` / `useTableQuery`)**.
   - Examples: current page index, page size, sort column, search filter, active tab.

3. **Is the state global to the client session (cross-page UI preferences)?**
   - **Yes** → **Zustand (`useUIStore`)**.
   - Examples: dark/light theme, desktop sidebar collapse, mobile drawer open state.

4. **Is the state related to a user input form before submission?**
   - **Yes** → **React Hook Form (`useForm` + Zod)**.
   - Examples: Post editor title/slug/body fields, Category name/description.

5. **Is the state transient to a single component or modal?**
   - **Yes** → **React `useState`**.
   - Examples: Delete confirmation dialog `isOpen`, dropdown menu open state.
