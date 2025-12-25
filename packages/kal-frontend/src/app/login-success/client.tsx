"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LoginSuccessClientProps {
  userName: string;
}

export default function LoginSuccessClient({ userName }: LoginSuccessClientProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/dashboard");
    }
  }, [countdown, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="login-success-page">
      <div className="login-success-card">
        <div className="success-icon">✓</div>
        <h1>Login Successful!</h1>
        <p className="welcome-text">
          Welcome back, <strong>{userName}</strong>
        </p>
        <p className="redirect-text">
          Redirecting to dashboard in {countdown}...
        </p>
        <button
          className="btn-primary"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}
