## Dead Code Cleanup (stabilization/dead-code)

Date: 2025-10-01

Removed artifacts to reduce surface area and resolve module-not-found issues:

- Deleted `app/api/chat/gpt5-route.ts` (duplicate AI chat route; main route is `app/api/chat/route.ts`)
- Deleted `components/providers/error-provider.tsx` (unused provider)
- Deleted `components/ui/error-toast.tsx` (unused component)

Notes:
- No `NotificationProvider` or `NotificationCenter` found in codebase; messaging feature had previously been removed. Residual comments and links were pruned.
- Build now proceeds past OpenAI init by lazy-initializing the client in `app/api/chat/route.ts`.

