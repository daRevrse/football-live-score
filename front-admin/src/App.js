// src/App.js
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

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<PublicMatchList />} />
            <Route path="/matches/live" element={<LiveMatches />} />
            <Route path="/matches/upcoming" element={<UpcomingMatches />} />
            <Route path="/matches/completed" element={<CompletedMatches />} />
            <Route path="/matches" element={<MatchList />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
