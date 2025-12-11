/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";

import { Navigate, Route, Routes } from "react-router-dom";
import {
  ProtectedRoute,
  PublicRoute,
} from "@/components/layouts/ProtectedRoute";

import { AuthLayout } from "@/components/layouts/AuthLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreateProject } from "@/pages/CreateProject";
import { Dashboard } from "./pages/Dashboard";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DashboardLayoutWithNotes } from "@/components/layouts/DashboardLayoutWithNotes";
import { Login } from "@/pages/auth/Login";
import { Projects } from "@/pages/Projects";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          }
        />
        {/* <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout><Register /></AuthLayout>
            </PublicRoute>
          }
        /> */}

        {/* Protected dashboard routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/projects" replace />
              {/* <DashboardLayout>
                <Dashboard />
              </DashboardLayout> */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <DashboardLayoutWithNotes>
                <Projects />
              </DashboardLayoutWithNotes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <DashboardLayoutWithNotes>
                <CreateProject />
              </DashboardLayoutWithNotes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/create"
          element={
            <ProtectedRoute>
              <DashboardLayoutWithNotes>
                <CreateProject />
              </DashboardLayoutWithNotes>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to projects */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
