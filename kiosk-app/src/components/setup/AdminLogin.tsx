import React, { useState } from "react";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AdminLoginProps {
  onLoginSuccess: (user: {
    id: string;
    email: string;
    organizationId: string;
    organizationName: string;
  }) => void;
  onCancel?: () => void;
}

/**
 * Admin Login component for kiosk setup wizard
 * Authenticates admin and fetches their organization info
 */
export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Login failed - no user returned");
      }

      // Get user's organization membership (using auth_user_id like admin-app)
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select(
          `
          organization_id,
          role,
          organization:organizations(id, name)
        `,
        )
        .eq("auth_user_id", authData.user.id)
        .in("role", ["admin", "manager"]) // Only admin/manager can configure kiosks
        .single();

      if (memberError || !memberData) {
        throw new Error(
          "You do not have permission to configure kiosks. Admin or Manager role required.",
        );
      }

      // Type the organization data from the join
      const org = memberData.organization as unknown as {
        id: string;
        name: string;
      } | null;
      if (!org) {
        throw new Error("Organization not found for your membership.");
      }

      onLoginSuccess({
        id: authData.user.id,
        email: authData.user.email || email,
        organizationId: org.id,
        organizationName: org.name,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kiosk Setup</h1>
          <p className="text-slate-600 mt-2">
            Sign in with admin credentials to configure this kiosk
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
        >
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="admin@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Only administrators and managers can configure kiosks
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
