"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DirectTestLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const setCookie = (name: string, value: string, days: number) => {
    if (typeof document === 'undefined') return;
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  const handleDirectLogin = () => {
    setIsLoading(true);

    console.log("Setting up test environment cookies for direct login");

    // Set all necessary cookies for authentication bypass
    setCookie('testMode', 'true', 1);
    setCookie('session', 'test-session-' + Date.now(), 1);

    // Give cookies time to be set
    setTimeout(() => {
      // Redirect directly to vendor dashboard
      console.log("Redirecting to vendor dashboard");
      window.location.href = "/vendor";
    }, 300);
  };

  return (
    <div className="mt-4 text-center">
      <Button
        onClick={handleDirectLogin}
        variant="destructive"
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700"
      >
        {isLoading ? "Bypassing Login..." : "Emergency Bypass Login"}
      </Button>
      <p className="text-xs mt-1 text-gray-500">Use only if normal login doesn't work</p>
    </div>
  );
} 