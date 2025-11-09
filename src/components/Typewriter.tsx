import { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
}

export default function Typewriter({ text, speed = 80, className = '' }: TypewriterProps) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let mounted = true;
    setDisplay('');
    let i = 0;
    function tick() {
      if (!mounted) return;
      if (i <= text.length) {
        setDisplay(text.slice(0, i));
        i += 1;
        setTimeout(tick, speed);
      }
    }
    tick();
    return () => {
      mounted = false;
    };
  }, [text, speed]);

  return (
    <div className={className}>
      <span>{display}</span>
      <span className="typewriter-cursor">|</span>
    </div>
  );
}
