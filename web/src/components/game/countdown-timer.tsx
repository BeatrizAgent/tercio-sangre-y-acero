"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endsAt: string;
  onExpiry?: () => void;
}

export function CountdownTimer({ endsAt, onExpiry }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endsAt).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft("00:00:00");
        if (onExpiry) onExpiry();
        return false;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
      ];

      setTimeLeft(parts.join(":"));
      return true;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, onExpiry]);

  return <span className="font-mono font-bold text-gold">{timeLeft}</span>;
}
