import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

// Customer modal for Register/Login/Set-Password.
// Used by Customer Portal: guests can browse, but must auth before booking.
// Props are intentionally flexible to match different callers.

const AuthModal = ({
  open = false,
  onClose,
  mode = "register", // "register" | "login"
  setMode, // optional
  prefill = { name: "", email: "", phone: "" },
  onAuthed, // optional callback(user)
}) => {
  const { register, login, setPassword } = useAuth();

  const [screen, setScreen] = useState("auth"); // "auth" | "set_password"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPasswordValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const effectiveMode = useMemo(() => (mode === "login" ? "login" : "register"), [mode]);
  const toggleMode = () => {
    if (typeof setMode === "function") {
      setMode(effectiveMode === "register" ? "login" : "register");
    }
  };

  useEffect(() => {
    if (!open) return;
    setScreen("auth");
    setError(null);
    setLoading(false);

    setName(prefill?.name || "");
    setEmail(prefill?.email || "");
    setPhone(prefill?.phone || "");
    setPasswordValue("");
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let ret;
      if (screen === "set_password") {
        ret = await setPassword({ email, password });
      } else if (effectiveMode === "register") {
        ret = await register({ name, email, phone, password });
      } else {
        ret = await login({ email, password });
      }

      if (typeof onAuthed === "function" && ret?.user) {
        await onAuthed(ret.user);
      }
      onClose?.();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.error || err.message || "Login/Register failed";
      setError(msg);
      if (data?.action === "set_password") {
        setScreen("set_password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const title =
    screen === "set_password"
      ? "Set a password"
      : effectiveMode === "register"
      ? "Create account"
      : "Login";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[420px] shadow-lg border border-gray-100">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-sm mb-3" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {effectiveMode === "register" && screen !== "set_password" && (
            <>
              <input
                type="text"
                placeholder="Name"
                className="w-full border rounded-xl px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full border rounded-xl px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-xl px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-xl px-3 py-2"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : screen === "set_password"
              ? "Save password"
              : effectiveMode === "register"
              ? "Register"
              : "Login"}
          </button>

          {screen !== "set_password" && typeof setMode === "function" && (
            <p className="text-sm text-center text-gray-600">
              {effectiveMode === "register" ? "Already have an account?" : "No account yet?"}{" "}
              <button type="button" onClick={toggleMode} className="text-blue-600 underline">
                {effectiveMode === "register" ? "Login" : "Register"}
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
