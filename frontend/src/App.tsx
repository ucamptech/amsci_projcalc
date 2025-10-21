import "./App.css";

import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import ProjectsCreate from "./pages/ProjectsCreate";
import ProjectsList from "./pages/ProjectsList";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<ProjectsList />} />
      <Route path="/projects/create" element={<ProjectsCreate />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
