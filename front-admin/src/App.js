import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import PublicMatchList from "./components/PublicMatchList";
import MatchList from "./components/MatchList";
import TeamList from "./components/TeamList";
import Profile from "./pages/auth/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminUsers from "./pages/admin/AdminUsers";
import LiveMatches from "./components/LiveMatches";
import UpcomingMatches from "./components/UpcomingMatches";
import CompletedMatches from "./components/CompletedMatches";

import ProtectedRoute from "./components/ProtectedRoute";
import { TeamStats } from "./pages/manager/TeamStats";
import { TeamMatches } from "./pages/manager/TeamMatches";
import { TeamEdit } from "./pages/manager/TeamEdit";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminSettings } from "./pages/admin/AdminSettings";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import PlayersManagement from "./pages/manager/PlayersManagement";
import { ReporterDashboard } from "./pages/reporter/ReporterDashboard";
import { ReporterMatches } from "./pages/reporter/ReporterMatches";
import { EventsManagement } from "./pages/reporter/EventsManagement";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Routes publiques */}
            <Route path="/" element={<PublicMatchList />} />
            <Route path="/matches/live" element={<LiveMatches />} />
            <Route path="/matches/upcoming" element={<UpcomingMatches />} />
            <Route path="/matches/completed" element={<CompletedMatches />} />
            <Route path="/matches" element={<MatchList />} />
            <Route path="/admin/matches" element={<MatchList />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/admin/teams" element={<TeamList />} />
            <Route path="/profile" element={<Profile />} />

            {/* Routes Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Routes Manager */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute roles={["Manager", "Admin"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/players"
              element={
                <ProtectedRoute roles={["Manager", "Admin"]}>
                  <PlayersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/team/edit"
              element={
                <ProtectedRoute roles={["Manager", "Admin"]}>
                  <TeamEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/stats"
              element={
                <ProtectedRoute roles={["Manager", "Admin"]}>
                  <TeamStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/matches"
              element={
                <ProtectedRoute roles={["Manager", "Admin"]}>
                  <TeamMatches />
                </ProtectedRoute>
              }
            />

            {/* Routes Reporter */}
            <Route
              path="/reporter/dashboard"
              element={
                <ProtectedRoute roles={["Reporter", "Admin"]}>
                  <ReporterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporter/matches"
              element={
                <ProtectedRoute roles={["Reporter", "Admin"]}>
                  <ReporterMatches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporter/events"
              element={
                <ProtectedRoute roles={["Reporter", "Admin"]}>
                  <EventsManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Routes d'authentification */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
