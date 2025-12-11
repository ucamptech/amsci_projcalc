import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("pc_auth_token");
  console.log("token", token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
