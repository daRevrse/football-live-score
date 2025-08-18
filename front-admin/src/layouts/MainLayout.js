// src/layouts/MainLayout.js
import React from "react";
import { Outlet } from "react-router-dom";
import { styles } from "./styles";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div style={styles.appContainer}>
      <Sidebar />
      <main style={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
