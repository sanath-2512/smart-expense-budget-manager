import { createContext, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useLogout, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { setAuthToken, clearAuthToken, getAuthToken } from "./auth";
import type { LoginBody, RegisterBody, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const hasToken = !!getAuthToken();

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: hasToken,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // Handle unauthorized errors
  useEffect(() => {
    if (error && (error as any).status === 401) {
      clearAuthToken();
      queryClient.clear();
      setLocation("/");
    }
  }, [error, setLocation, queryClient]);

  const login = async (data: LoginBody) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      setAuthToken(response.token);
      queryClient.setQueryData(["/api/users/me"], response.user);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.data?.error || err?.data?.message || "Invalid credentials",
        variant: "destructive"
      });
      throw err;
    }
  };

  const register = async (data: RegisterBody) => {
    try {
      const response = await registerMutation.mutateAsync({ data });
      setAuthToken(response.token);
      queryClient.setQueryData(["/api/users/me"], response.user);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.data?.error || err?.data?.message || "Could not create account",
        variant: "destructive"
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error(err);
    } finally {
      clearAuthToken();
      queryClient.clear();
      setLocation("/");
    }
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading: isUserLoading && hasToken,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
