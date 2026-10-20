import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, type ReactNode } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { AppShell } from "@/components/app/AppShell";
import { useSession } from "@/lib/session";

const AppHome = lazy(() => import("@/pages/app/Home"));
const InboxPage = lazy(() => import("@/pages/app/Inbox"));
const TasksPage = lazy(() => import("@/pages/app/Tasks"));
const NotesPage = lazy(() => import("@/pages/app/Notes"));
const EmailsPage = lazy(() => import("@/pages/app/Emails"));
const CallsPage = lazy(() => import("@/pages/app/Calls"));
const ReportsPage = lazy(() => import("@/pages/app/Reports"));
const DashboardPage = lazy(() => import("@/pages/app/Dashboard"));
const SequencesPage = lazy(() => import("@/pages/app/Sequences"));
const WorkflowsPage = lazy(() => import("@/pages/app/Workflows"));
const WorkflowBuilderPage = lazy(() => import("@/pages/app/WorkflowBuilder"));
const RecordsPage = lazy(() => import("@/pages/app/Records"));
const ListPage = lazy(() => import("@/pages/app/ListView"));
const ChatPage = lazy(() => import("@/pages/app/Chat"));
const SettingsPage = lazy(() => import("@/pages/app/Settings"));


function Fallback() {
  return (
    <div className="flex h-full items-center justify-center bg-app" aria-busy="true">
      <span className="size-5 animate-spin rounded-full border-2 border-app-mute border-r-transparent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function RequireSession({ children }: { children: ReactNode }) {
  const session = useSession();
  const [location] = useLocation();
  if (!session) return <Redirect to={`/signin?next=${encodeURIComponent(location)}`} />;
  return <>{children}</>;
}

/** Fades between app pages; keyed on the first path segment so record panels don't re-animate the table. */
function AppPage({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const key = location.split("/").slice(0, 3).join("/");
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        className="h-full"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<Fallback />}>{children}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AppRoutes() {
  return (
    <RequireSession>
      <AppShell>
        <AppPage>
          <Switch>
            <Route path="/app/home" component={AppHome} />
            <Route path="/app/inbox" component={InboxPage} />
            <Route path="/app/tasks" component={TasksPage} />
            <Route path="/app/notes/:id?" component={NotesPage} />
            <Route path="/app/emails" component={EmailsPage} />
            <Route path="/app/calls" component={CallsPage} />
            <Route path="/app/reports" component={ReportsPage} />
            <Route path="/app/reports/:id" component={DashboardPage} />
            <Route path="/app/sequences/:id?" component={SequencesPage} />
            <Route path="/app/workflows" component={WorkflowsPage} />
            <Route path="/app/workflows/:id" component={WorkflowBuilderPage} />
            <Route path="/app/lists/:id" component={ListPage} />
            <Route path="/app/chats/:id" component={ChatPage} />
            <Route path="/app/settings/:tab?" component={SettingsPage} />
            <Route path="/app/:kind/:id?" component={RecordsPage} />
            <Route>
              <Redirect to="/app/home" />
            </Route>
          </Switch>
        </AppPage>
      </AppShell>
    </RequireSession>
  );
}

