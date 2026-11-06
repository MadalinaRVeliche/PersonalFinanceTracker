import { useState, type FormEvent } from "react";
import { loginUser, registerUser, createDemoSession } from "./auth";

type LoginProps = {
  onLogin: (token: string) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await registerUser(email, password);
      }

      const result = await loginUser(email, password);
      onLogin(result.access_token);
    } catch (err) {
      if (isRegistering && err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Please check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsRegistering((current) => !current);
    setError("");
    setPassword("");
  }

  async function handleDemo() {
    setError("");
    setLoading(true);

    try {
      const token = await createDemoSession();
      onLogin(token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start the demo. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Personal Finance Tracker</h1>
        <h2>{isRegistering ? "Create account" : "Sign in"}</h2>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={isRegistering ? 8 : undefined}
          autoComplete={isRegistering ? "new-password" : "current-password"}
        />

        {isRegistering && <p>Use at least 8 characters for your password.</p>}

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? isRegistering
              ? "Creating account..."
              : "Signing in..."
            : isRegistering
              ? "Create account"
              : "Sign in"}
        </button>

        <p>
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}
        </p>

        <button type="button" onClick={toggleMode} disabled={loading}>
          {isRegistering ? "Back to sign in" : "Create an account"}
        </button>
        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="demo-button"
        >
          {loading ? "Please wait..." : "Try Demo — No Account Needed"}
        </button>
      </form>
    </main>
  );
}
