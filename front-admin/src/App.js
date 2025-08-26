// front-admin/src/App.js - Version mise à jour
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

// Nouvelles pages Manager
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import PlayersManagement from "./pages/manager/PlayersManagement";
import ProtectedRoute from "./components/ProtectedRoute";

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
              path="/admin/users"
              element={
                <ProtectedRoute roles={["Admin"]}>
                  <AdminUsers />
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
