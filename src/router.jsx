import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";

function BubbleError() {
  throw useRouteError();
}

import AuthGuard from "./pages/auth/AuthGuard";
import LoginPage from "./pages/auth/LoginPage";
import LoginAs from "./pages/auth/LoginAs";
import PetavueGuard from "./components/PetavueGuard";
import HomeGuard from "./components/HomeGuard";
import { MOCK_ENABLED } from "./mocks";
import IndexRedirect from "./components/IndexRedirect";
import { SessionProvider } from "./contexts/SessionContext";
import LegacyRedirect from "./pages/LegacyRedirect";
import PetavueSplash from "./components/PetavueSplash";

const ClaudeAuthPage = lazy(() => import("./pages/auth/ClaudeAuthPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const SalesforceCallback = lazy(() => import("./pages/callbacks/SalesforceCallback"));
const GainsightCallback = lazy(() => import("./pages/callbacks/GainsightCallback"));
const SlackCallback = lazy(() => import("./pages/callbacks/SlackCallback"));
const HubspotCallback = lazy(() => import("./pages/callbacks/HubspotCallback"));
const LinkedinCallback = lazy(() => import("./pages/callbacks/LinkedinCallback"));
const GoogleSheetsCallback = lazy(() => import("./pages/callbacks/GoogleSheetsCallback"));
const EmailCallback = lazy(() => import("./pages/callbacks/EmailCallback"));
const GoogleAnalyticsCallback = lazy(() => import("./pages/callbacks/GoogleAnalyticsCallback"));
const GoogleAnalyticsRedirect = lazy(() => import("./pages/callbacks/GoogleAnalyticsRedirect"));

const RootLayout = lazy(() => import("./layouts/RootLayout"));
const SettingsLayout = lazy(() => import("./layouts/SettingsLayout"));
const DataHubLayout = lazy(() => import("./layouts/DataHubLayout"));
const WorkflowsLayout = lazy(() => import("./layouts/WorkflowsLayout"));
const DashboardsLayout = lazy(() => import("./layouts/DashboardsLayout"));
const SessionsLayout = lazy(() => import("./layouts/SessionsLayout"));
const HomeLayout = lazy(() => import("./pages/home/TempHome/HomeLayout"));
const HomePage = lazy(() => import("./pages/home/TempHome/HomePage"));
const SkillDetailPage = lazy(() => import("./pages/home/TempHome/SkillDetailPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const SessionsPage = lazy(() => import("./pages/SessionsPage"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const SchedulesPage = lazy(() => import("./pages/SchedulesPage"));
const DashboardsPage = lazy(() => import("./pages/DashboardsPage"));
const DashboardDetailPage = lazy(() => import("./pages/DashboardDetailPage"));
const SkillsPage = lazy(() => import("./pages/SkillsPage"));
const SkillsV2ListPage = lazy(() => import("./pages/skills-v2/SkillsV2ListPage"));
const SkillsV2RunPage = lazy(() => import("./pages/skills-v2/SkillsV2RunPage"));
const WorkflowsPage = lazy(() => import("./pages/workflows"));
const WorkflowDetailPage = lazy(() => import("./pages/WorkflowDetailPage"));
const DataHubPage = lazy(() => import("./pages/DataHubPage"));
const DictionaryPage = lazy(() => import("./pages/data-hub/DictionaryPage"));
const SyncActivityPage = lazy(() => import("./pages/data-hub/SyncActivityPage"));
const DictionaryDetailPage = lazy(() => import("./pages/DictionaryDetailPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const IntegrationsPage = lazy(() => import("./pages/settings/IntegrationsPage"));
const IntegrationDetailPage = lazy(() => import("./pages/settings/IntegrationDetailPage"));
const UserManagementPage = lazy(() => import("./pages/settings/UserManagementPage"));
const GeneralSettingsPage = lazy(() => import("./pages/settings/GeneralSettingsPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const ExperimentsPage = lazy(() => import("./pages/ExperimentsPage"));

const SuspenseWrapper = ({ children }) => {
  return <Suspense fallback={<PetavueSplash />}>{children}</Suspense>;
};

function AuthenticatedLayout() {
  return (
    <SessionProvider>
      <SuspenseWrapper>
        <RootLayout />
      </SuspenseWrapper>
    </SessionProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <BubbleError />
  },
  {
    path: "/authenticate",
    element: <LoginAs />,
    errorElement: <BubbleError />
  },
  {
    path: "/claude/oauth/authorize",
    element: (
      <SuspenseWrapper>
        <ClaudeAuthPage />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/auth/invite/accept",
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/auth/reset-password",
    element: (
      <SuspenseWrapper>
        <ResetPasswordPage />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/salesforce/callback",
    element: (
      <SuspenseWrapper>
        <SalesforceCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/gainsight/callback",
    element: (
      <SuspenseWrapper>
        <GainsightCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/slack/callback",
    element: (
      <SuspenseWrapper>
        <SlackCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/hubspot/callback",
    element: (
      <SuspenseWrapper>
        <HubspotCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/linkedin/callback",
    element: (
      <SuspenseWrapper>
        <LinkedinCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/google-sheets/callback",
    element: (
      <SuspenseWrapper>
        <GoogleSheetsCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/report/*",
    element: (
      <SuspenseWrapper>
        <EmailCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/google-analytics/callback",
    element: (
      <SuspenseWrapper>
        <GoogleAnalyticsCallback />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/google-analytics/redirect",
    element: (
      <SuspenseWrapper>
        <GoogleAnalyticsRedirect />
      </SuspenseWrapper>
    ),
    errorElement: <BubbleError />
  },
  {
    path: "/",
    element: <AuthGuard />,
    errorElement: <BubbleError />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          {
            index: true,
            element: <IndexRedirect />
          },
          {
            element: (
              <SuspenseWrapper>
                <SessionsLayout />
              </SuspenseWrapper>
            ),
            children: [
              {
                path: "sessions",
                element: (
                  <SuspenseWrapper>
                    <SessionsPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: "session/:id",
                element: (
                  <SuspenseWrapper>
                    <WorkspacePage />
                  </SuspenseWrapper>
                )
              }
            ]
          },
          {
            path: "schedules",
            element: (
              <SuspenseWrapper>
                <SchedulesPage />
              </SuspenseWrapper>
            )
          },
          {
            path: "dashboards",
            element: (
              <SuspenseWrapper>
                <DashboardsLayout />
              </SuspenseWrapper>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspenseWrapper>
                    <DashboardsPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: ":id",
                element: (
                  <SuspenseWrapper>
                    <DashboardDetailPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },
          // Frontend-only mode: /home is the dashboard workspace (clean URL, no
          // session id). Otherwise it's the flag-gated skill-library home.
          MOCK_ENABLED
            ? {
                path: "home",
                element: (
                  <SuspenseWrapper>
                    <WorkspacePage />
                  </SuspenseWrapper>
                )
              }
            : {
                element: <HomeGuard />,
                children: [
                  {
                    path: "home",
                    element: (
                      <SuspenseWrapper>
                        <HomeLayout />
                      </SuspenseWrapper>
                    ),
                    children: [
                      {
                        index: true,
                        element: (
                          <SuspenseWrapper>
                            <HomePage />
                          </SuspenseWrapper>
                        )
                      },
                      { path: "workstreams", element: <Navigate to="/home" replace /> },
                      { path: "workstreams/:workstreamId", element: <Navigate to="/home" replace /> },
                      { path: "skill", element: <Navigate to="/home" replace /> },
                      {
                        path: "skill/:id",
                        element: (
                          <SuspenseWrapper>
                            <SkillDetailPage />
                          </SuspenseWrapper>
                        )
                      }
                    ]
                  }
                ]
              },
          {
            element: <PetavueGuard />,
            children: [
              {
                path: "workflows",
                element: (
                  <SuspenseWrapper>
                    <WorkflowsLayout />
                  </SuspenseWrapper>
                ),
                children: [
                  {
                    index: true,
                    element: (
                      <SuspenseWrapper>
                        <WorkflowsPage />
                      </SuspenseWrapper>
                    )
                  },
                  {
                    path: ":id",
                    element: (
                      <SuspenseWrapper>
                        <WorkflowDetailPage />
                      </SuspenseWrapper>
                    )
                  }
                ]
              },
              {
                path: "skills",
                element: (
                  <SuspenseWrapper>
                    <SkillsPage />
                  </SuspenseWrapper>
                )
              },
              {
                path: "skills-v2",
                element: (
                  <SuspenseWrapper>
                    <SkillsV2ListPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },
          {
            path: "skills-v2/run/:sessionId",
            element: (
              <SuspenseWrapper>
                <SkillsV2RunPage />
              </SuspenseWrapper>
            )
          },
          {
            path: "data-hub",
            element: (
              <SuspenseWrapper>
                <DataHubLayout />
              </SuspenseWrapper>
            ),
            children: [
              {
                element: (
                  <SuspenseWrapper>
                    <DataHubPage />
                  </SuspenseWrapper>
                ),
                children: [
                  { index: true, element: <Navigate to="dictionary" replace /> },
                  {
                    path: "dictionary",
                    element: (
                      <SuspenseWrapper>
                        <DictionaryPage />
                      </SuspenseWrapper>
                    )
                  },
                  {
                    path: "sync-activity",
                    element: (
                      <SuspenseWrapper>
                        <SyncActivityPage />
                      </SuspenseWrapper>
                    )
                  }
                ]
              },
              {
                path: "dictionary/:id",
                element: (
                  <SuspenseWrapper>
                    <DictionaryDetailPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },
          {
            path: "settings",
            element: (
              <SuspenseWrapper>
                <SettingsLayout />
              </SuspenseWrapper>
            ),
            children: [
              {
                element: (
                  <SuspenseWrapper>
                    <SettingsPage />
                  </SuspenseWrapper>
                ),
                children: [
                  { index: true, element: <Navigate to="integrations" replace /> },
                  {
                    path: "integrations",
                    element: (
                      <SuspenseWrapper>
                        <IntegrationsPage />
                      </SuspenseWrapper>
                    )
                  },
                  {
                    path: "general",
                    element: (
                      <SuspenseWrapper>
                        <GeneralSettingsPage />
                      </SuspenseWrapper>
                    )
                  },
                  {
                    path: "users",
                    element: (
                      <SuspenseWrapper>
                        <UserManagementPage />
                      </SuspenseWrapper>
                    )
                  }
                ]
              },
              {
                path: "integrations/:slug",
                element: (
                  <SuspenseWrapper>
                    <IntegrationDetailPage />
                  </SuspenseWrapper>
                )
              }
            ]
          },
          {
            path: "my-profile",
            element: (
              <SuspenseWrapper>
                <MyProfilePage />
              </SuspenseWrapper>
            )
          },
          {
            path: "experiments",
            element: (
              <SuspenseWrapper>
                <ExperimentsPage />
              </SuspenseWrapper>
            )
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <LegacyRedirect />,
    errorElement: <BubbleError />
  }
]);
