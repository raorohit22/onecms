# Frontend Architecture

## CMS

React + TypeScript.

State ownership:
- Server state → TanStack Query (`v5`)
- Form state → React Hook Form + Zod validation
- Local UI state → React state (or Nuqs for URL state if needed)
- URL state → router/search params (`TableQueryState`)
- Global client state → React Context (e.g., `OrganizationContext`, `AuthContext`)

UI & Design System:
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- shared package components (`@onecms/ui`)

### Frontend Hardening Standards

1. **Cache Invalidation:** All data mutations (Create/Update/Delete) must call `queryClient.invalidateQueries` in their `onSuccess` handlers to ensure the UI immediately reflects server state.
2. **Form Resets:** When rendering forms for creating or editing entities (especially in side sheets), always explicitly call `form.reset(defaultData)` in a `useEffect` to prevent stale data between edits.
3. **Data Tables:** Use the shared `<DataTable>` component for robust pagination, sorting, row selection, and bulk actions. Ensure `useTableSelection` is passed `totalItems` (number), not an array of IDs.
4. **Loading States:** All form submit buttons must visually indicate loading (`isPending`) and disable themselves to prevent double submission. Tables should use `isFetching` with `placeholderData: keepPreviousData` to prevent visual flicker during pagination.
5. **Destructive Actions:** Any deletion operation must be protected by a `<ConfirmDeleteDialog>`.
6. **Toast Feedback:** All mutations must use global `top-right` Sonner toasts (`toast.success` and `toast.error`) to provide immediate feedback to the user.

## Website

Next.js + TypeScript.

Prefer server components and server rendering for public content.
Use client components only where interactivity requires them.

Performance goals:
- minimal client JavaScript
- image optimization
- caching/revalidation
- semantic HTML
- accessible navigation
