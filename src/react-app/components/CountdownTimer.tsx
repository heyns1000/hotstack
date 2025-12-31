import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  initialTime: number;
  onComplete: () => void;
}

export default function CountdownTimer({ initialTime, onComplete }: CountdownTimerProps) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (time <= 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [time, onComplete]);

  const minutes = String(Math.floor(time / 60)).padStart(2, '0');
  const seconds = String(time % 60).padStart(2, '0');

  return (
    <p className="text-6xl font-extrabold my-6 text-[#ffcc00] tracking-wider">
      {minutes}:{seconds}
    </p>
  );
}
