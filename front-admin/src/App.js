import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import MatchList from "./components/MatchList";
import TeamList from "./components/TeamList";
import PublicMatchList from "./components/PublicMatchList";

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/matches">Matchs</Link>
        <Link to="/teams">Teams</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PublicMatchList />} />
        <Route path="/matches" element={<MatchList />} />
        <Route path="/teams" element={<TeamList />} />
      </Routes>
    </Router>
  );
}
