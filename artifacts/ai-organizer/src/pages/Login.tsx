// src/pages/Login.tsx
import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { getErrorMessage } from "../lib/errorHandler";
import { validateEmail, validatePassword } from "../lib/validation";
import {
  FileText,
  Brain,
  Microscope,
  BarChart3,
  Users,
  Lock,
  ShieldCheck,
  LogIn,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Rocket,
} from "lucide-react";

type LocationState = { from?: { pathname?: string } };

export default function Login() {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const state = (location.state as LocationState | null) ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password, isSignUp) : null;
  const isFormValid = !emailError && !passwordError && email.trim() && password.trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched({ email: true, password: true });
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password, isSignUp);
    if (emailErr || passwordErr) return;
    try {
      if (isSignUp) {
        await register(email.trim(), password);
        navigate(state?.from?.pathname ?? "/", { replace: true });
      } else {
        await login(email.trim(), password);
        navigate(state?.from?.pathname ?? "/", { replace: true });
      }
    } catch (err: any) {
      setError(
        getErrorMessage(err) || (isSignUp ? "Registration failed" : "Invalid credentials")
      );
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched({ email: true, password: false });
    const emailErr = validateEmail(email);
    if (emailErr) return;
    try {
      // Will work once backend is connected
      // await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      setForgotSent(true);
    } catch (err: any) {
      setError(getErrorMessage(err) || "Failed to send reset email");
    }
  }

  const featurePoints = [
    { icon: FileText, text: t("login.feature.aiDocs") || "AI-powered document analysis" },
    { icon: Brain, text: t("login.feature.theory") || "Theory & research workspaces" },
    { icon: Microscope, text: t("login.feature.segmentation") || "Scientific segmentation engine" },
    { icon: BarChart3, text: t("login.feature.analytics") || "Analytics & insights dashboard" },
    { icon: Users, text: t("login.feature.collab") || "Collaboration & team tools" },
  ];

  const trustBadges = [
    { icon: Lock, text: t("login.trustSecurity") || "End-to-end encrypted storage" },
    { icon: ShieldCheck, text: t("login.trustGdpr") || "GDPR compliant · Your data stays yours" },
  ];

  return (
    <div className="login-page">
      {/* Card shell: split layout */}
      <div className="login-card">
        {/* LEFT: Branding panel */}
        <div className="login-brand-panel">
          {/* Decorative orbs */}
          <div className="login-orb login-orb--1" />
          <div className="login-orb login-orb--2" />
          <div className="login-orb login-orb--3" />

          {/* Logo + title */}
          <div>
            <div className="login-brand-logo">
              <div className="login-brand-icon">
                <FileText size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="login-brand-title">Think!Hub</div>
                <div className="login-brand-subtitle">
                  {t("login.platformLabel") || "Research Platform"}
                </div>
              </div>
            </div>

            <h1 className="login-headline">
              {isSignUp
                ? t("login.signupHeadline") || "Start your research journey"
                : t("login.signinHeadline") || "Welcome back"}
            </h1>
            <p className="login-subheadline">
              {isSignUp
                ? t("login.signupSubtitle") ||
                  "Create your account and unlock powerful AI-driven research tools."
                : t("login.signinSubtitle") ||
                  "Sign in to continue your research and access your documents."}
            </p>

            {/* Feature list */}
            <div className="login-features">
              {featurePoints.map((f, i) => (
                <div key={i} className="login-feature-item">
                  <div className="login-feature-icon">
                    <f.icon size={15} strokeWidth={2} />
                  </div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust badges */}
          <div className="login-trust-badges">
            {trustBadges.map((b, i) => (
              <div key={i} className="login-trust-item">
                <div className="login-trust-icon">
                  <b.icon size={12} strokeWidth={2.5} />
                </div>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Form panel */}
        <div className="login-form-panel">
          {/* Header */}
          <div className="login-form-header">
            <div>
              <h2 className="login-form-title">
                {forgotMode
                  ? t("login.forgotPassword") || "Reset password"
                  : isSignUp
                  ? t("login.createAccount") || "Create account"
                  : t("login.signIn") || "Sign in"}
              </h2>
              <p className="login-form-subtitle">
                {forgotMode
                  ? t("login.forgotPasswordSub") || "Enter your email to receive a reset link"
                  : isSignUp
                  ? t("login.createAccountSub") || "Fill in your details to get started"
                  : t("login.signInSub") || "Enter your credentials to continue"}
              </p>
            </div>
          </div>

          {forgotMode ? (
            /* ── Forgot password form ── */
            <form onSubmit={handleForgotPassword} noValidate>
              <div className="login-fields">
                <div>
                  <label className="login-label">
                    {t("login.emailLabel") || "Email address"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    className={`login-input ${emailError ? "login-input--error" : ""}`}
                  />
                  {emailError && (
                    <p className="login-field-error">
                      <AlertCircle size={12} /> {emailError}
                    </p>
                  )}
                </div>
              </div>

              {forgotSent && (
                <div className="login-success-alert">
                  {t("login.forgotPasswordSent") ||
                    "If an account with that email exists, a reset link has been sent."}
                </div>
              )}

              {error && (
                <div className="login-error-alert">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="login-actions">
                <button type="submit" className="login-submit" disabled={!email.trim()}>
                  {t("login.sendResetLink") || "Send reset link"}
                </button>
                <div className="login-switch-row">
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={() => {
                      setForgotMode(false);
                      setForgotSent(false);
                      setError(null);
                    }}
                  >
                    ← {t("login.backToSignIn") || "Back to sign in"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ── Main login/signup form ── */
            <form onSubmit={onSubmit} noValidate>
              <div className="login-fields">
                {/* Email field */}
                <div>
                  <label className="login-label">
                    {t("login.emailLabel") || "Email address"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    className={`login-input ${emailError ? "login-input--error" : ""}`}
                  />
                  {emailError && (
                    <p className="login-field-error">
                      <AlertCircle size={12} /> {emailError}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <div className="login-label-row">
                    <label className="login-label">
                      {t("login.passwordLabel") || "Password"}
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        className="login-forgot-btn"
                        onClick={() => {
                          setForgotMode(true);
                          setError(null);
                          setTouched({ email: false, password: false });
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="login-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      placeholder="••••••••"
                      className={`login-input ${passwordError ? "login-input--error" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="login-eye-btn"
                      title={
                        showPassword
                          ? t("login.hidePassword") || "Hide password"
                          : t("login.showPassword") || "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="login-field-error">
                      <AlertCircle size={12} /> {passwordError}
                    </p>
                  )}
                  {isSignUp && !passwordError && password.length > 0 && (
                    <p className="login-field-hint">
                      {t("login.passwordHint") || "At least 6 characters required"}
                    </p>
                  )}
                </div>
              </div>

              {/* Error alert */}
              {error && (
                <div className="login-error-alert">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {/* Submit + toggle */}
              <div className="login-actions">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="login-spinner" />
                      {isSignUp
                        ? t("login.creatingAccount") || "Creating account…"
                        : t("login.signingIn") || "Signing in…"}
                    </>
                  ) : (
                    <>
                      {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
                      {isSignUp
                        ? t("login.createAccount") || "Create account"
                        : t("login.signIn") || "Sign in"}
                    </>
                  )}
                </button>

              {/* Toggle sign-in / sign-up */}
                <div className="login-switch-row">
                  <span>
                    {isSignUp
                      ? t("login.alreadyHaveAccount") || "Already have an account?"
                      : t("login.noAccount") || "Don't have an account?"}
                  </span>
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={() => {
                      setIsSignUp((s) => !s);
                      setError(null);
                      setTouched({ email: false, password: false });
                    }}
                  >
                    {isSignUp
                      ? t("login.switchToSignIn") || "Sign in"
                      : t("login.switchToSignUp") || "Sign up"}
                  </button>
                </div>

                {/* Demo mode divider */}
                <div className="login-demo-divider">
                  <span className="login-demo-divider-line" />
                  <span className="login-demo-divider-text">or</span>
                  <span className="login-demo-divider-line" />
                </div>

                {/* Demo mode button */}
                <button
                  type="button"
                  className="login-demo-btn"
                  onClick={() => {
                    // Bypass auth for demo/preview
                    localStorage.setItem("demo_mode", "true");
                    navigate(state?.from?.pathname ?? "/", { replace: true });
                  }}
                >
                  <Rocket size={16} />
                  Explore Demo
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-terms">
              <span>{t("login.termsNote") || "By continuing, you agree to our"}</span>{" "}
              <button type="button" className="login-link-btn">
                {t("login.termsLink") || "Terms of Service"}
              </button>{" "}
              <span>{t("login.andWord") || "and"}</span>{" "}
              <button type="button" className="login-link-btn">
                {t("login.privacyLink") || "Privacy Policy"}
              </button>
              .
            </p>
            <p className="login-footer-version">
              {t("login.versionNote") || "v2.0 · Research Platform"}
            </p>
          </div>
        </div>
      </div>

      {/* Styles scoped to login */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes loginFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: var(--font-family, system-ui, sans-serif);
          background: ${isDark
            ? "linear-gradient(160deg, #0b0f18 0%, #111827 100%)"
            : `radial-gradient(ellipse 90% 55% at 15% -10%, rgba(99,102,241,0.10) 0%, transparent 55%),
               radial-gradient(ellipse 70% 60% at 85% 110%, rgba(124,58,237,0.08) 0%, transparent 55%),
               linear-gradient(160deg, #f5f4ff 0%, #f0f4ff 100%)`};
        }

        .login-card {
          width: 100%;
          max-width: 920px;
          display: grid;
          grid-template-columns: 5fr 6fr;
          border-radius: 24px;
          overflow: hidden;
          animation: loginFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
          background: ${isDark ? "rgba(15, 18, 28, 0.95)" : "#ffffff"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.12)"};
          box-shadow: ${isDark
            ? "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset"
            : "0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(99,102,241,0.10), 0 1px 0 rgba(255,255,255,0.9) inset"};
        }

        /* ── RESPONSIVE: Stack on mobile ── */
        @media (max-width: 720px) {
          .login-card {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
          .login-brand-panel {
            padding: 32px 24px !important;
          }
          .login-form-panel {
            padding: 32px 24px !important;
          }
          .login-headline {
            font-size: 22px !important;
          }
        }

        /* ── Brand panel ── */
        .login-brand-panel {
          background: ${isDark
            ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)"
            : "linear-gradient(145deg, #4f46e5 0%, #6366f1 45%, #7c3aed 100%)"};
          padding: 48px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          color: #ffffff;
        }
        .login-brand-panel, .login-brand-panel * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .login-orb--1 { top: -60px; right: -60px; width: 220px; height: 220px; background: rgba(255,255,255,0.07); }
        .login-orb--2 { bottom: -50px; left: -50px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); }
        .login-orb--3 { top: 50%; right: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.03); }

        .login-brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .login-brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.30);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          flex-shrink: 0;
        }
        .login-brand-title {
          font-weight: 800;
          font-size: 17px;
          letter-spacing: -0.4px;
        }
        .login-brand-subtitle {
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.2px;
          margin-top: 1px;
          opacity: 0.75;
        }
        .login-headline {
          font-size: 26px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        .login-subheadline {
          font-size: 13px;
          line-height: 1.65;
          margin-bottom: 32px;
          opacity: 0.85;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .login-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
        }
        .login-feature-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .login-trust-badges {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.12);
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .login-trust-item {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 11.5px;
          font-weight: 500;
          line-height: 1.4;
        }
        .login-trust-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Form panel ── */
        .login-form-panel {
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: ${isDark ? "rgba(15,18,28,0.95)" : "#ffffff"};
        }

        .login-form-header {
          margin-bottom: 24px;
        }
        .login-form-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.4px;
          margin: 0;
          color: ${isDark ? "#f1f5f9" : "#111827"};
        }
        .login-form-subtitle {
          font-size: 13px;
          margin: 5px 0 0 0;
          line-height: 1.5;
          color: ${isDark ? "rgba(255,255,255,0.55)" : "#6b7280"};
        }

        .login-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .login-label {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          margin-bottom: 7px;
          color: ${isDark ? "rgba(255,255,255,0.65)" : "#374151"};
        }
        .login-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .login-forgot-btn {
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 7px;
          color: ${isDark ? "#a5b4fc" : "#4f46e5"};
          transition: opacity 0.15s;
        }
        .login-forgot-btn:hover {
          text-decoration: underline;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: ${isDark ? "rgba(255,255,255,0.05)" : "#f9f8ff"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(99,102,241,0.18)"};
          color: ${colors.textPrimary};
          box-shadow: ${isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)"};
        }
        .login-input:focus {
          border-color: rgba(99,102,241,0.55) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.10) !important;
        }
        .login-input--error {
          border-color: ${colors.accentError} !important;
        }
        .login-input::placeholder {
          color: ${isDark ? "rgba(255,255,255,0.35)" : "#9ca3af"};
        }

        .login-password-wrap {
          position: relative;
        }
        .login-password-wrap .login-input {
          padding-right: 42px;
        }
        .login-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          color: ${isDark ? "rgba(255,255,255,0.45)" : "#9ca3af"};
          transition: color 0.15s;
        }
        .login-eye-btn:hover {
          color: ${colors.textPrimary};
        }

        .login-field-error {
          font-size: 11px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: ${colors.accentError};
        }
        .login-field-hint {
          font-size: 11px;
          margin-top: 4px;
          color: ${isDark ? "rgba(255,255,255,0.45)" : "#9ca3af"};
        }

        .login-error-alert {
          margin-bottom: 16px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${isDark ? "rgba(239,68,68,0.12)" : "rgba(220,38,38,0.06)"};
          border: 1px solid ${isDark ? "rgba(239,68,68,0.3)" : "rgba(220,38,38,0.2)"};
          color: ${colors.accentError};
        }
        .login-success-alert {
          margin-bottom: 16px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          background: ${isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.06)"};
          border: 1px solid ${isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.2)"};
          color: ${isDark ? "#4ade80" : "#16a34a"};
        }

        .login-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .login-submit {
          width: 100%;
          padding: 13px 20px;
          border-radius: 11px;
          border: none;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.3px;
          background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 100%);
          box-shadow: ${isDark ? "0 4px 14px rgba(91,91,214,0.35)" : "0 4px 16px rgba(91,91,214,0.28), 0 1px 3px rgba(0,0,0,0.1)"};
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: ${isDark ? "0 6px 20px rgba(91,91,214,0.45)" : "0 6px 22px rgba(91,91,214,0.38)"};
        }
        .login-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .login-spinner {
          animation: spin 1s linear infinite;
        }

        .login-switch-row {
          text-align: center;
          font-size: 13px;
          padding-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex-wrap: wrap;
          color: ${isDark ? "rgba(255,255,255,0.55)" : "#6b7280"};
        }

        .login-link-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
          font-weight: 600;
          text-decoration: none;
          padding: 0;
          transition: opacity 0.15s;
          line-height: 1.5;
          color: ${isDark ? "#a5b4fc" : "#4f46e5"};
        }
        .login-link-btn:hover {
          text-decoration: underline;
        }

        /* ── Demo button ── */
        .login-demo-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .login-demo-divider-line {
          flex: 1;
          height: 1px;
          background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
        }
        .login-demo-divider-text {
          font-size: 11px;
          color: ${isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"};
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .login-demo-btn {
          width: 100%;
          padding: 12px 20px;
          border-radius: 11px;
          border: 1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"};
          background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.04)"};
          color: ${isDark ? "rgba(255,255,255,0.75)" : "#4f46e5"};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-demo-btn:hover {
          background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.10)"};
          border-color: ${isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.3)"};
          transform: translateY(-1px);
        }

        /* ── Footer ── */
        .login-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.08)"};
          text-align: center;
        }
        .login-footer-terms {
          font-size: 11px;
          line-height: 1.7;
          margin: 0;
          letter-spacing: 0.1px;
          color: ${isDark ? "rgba(255,255,255,0.45)" : "#9ca3af"};
        }
        .login-footer-version {
          font-size: 10px;
          margin: 6px 0 0;
          opacity: 0.65;
          color: ${isDark ? "rgba(255,255,255,0.45)" : "#9ca3af"};
        }
      `}</style>
    </div>
  );
}
