import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/contexts/AuthContext";
import { login as loginApi } from "@/lib/api/auth.api";
import {
  StatusDialog,
  type StatusModal,
} from "@/components/common/StatusDialog";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [statusModal, setStatusModal] = useState<StatusModal>(null);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatusModal({
        type: "error",
        message: "Please enter your credentials",
      });
      return;
    }

    try {
      await loginApi(email, password);
      login();
      setStatusModal({
        type: "success",
        message: "Login successful!",
        actions: [
          {
            label: "Continue",
            onClick: () => {
              navigate(redirectPath, { replace: true });
            },
          },
        ],
      });
    } catch (error) {
      // const message =
      //   error instanceof Error ? error.message : "Failed to login. Try again.";
      const message = "Failed to login. Try again.";
      console.error(error instanceof Error ? error.message : message);

      setStatusModal({
        type: "error",
        message,
      });
    }
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <img
              src="/amsci-logo-black-2.png"
              alt="AMSCI"
              className="h-12 w-auto"
              loading="lazy"
            />
          </div>
          <CardTitle className="text-center">Project Charter App</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              By continuing, you agree to our Terms & Privacy Policy.
            </p>
          </form>
        </CardContent>
      </Card>
      <StatusDialog
        modal={statusModal}
        onClose={() => {
          if (statusModal?.type === "success") {
            navigate(redirectPath, { replace: true });
          }
          setStatusModal(null);
        }}
      />
    </>
  );
}
