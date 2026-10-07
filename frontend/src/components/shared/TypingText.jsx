import React, { useEffect, useState } from 'react';

/**
 * Lightweight typing animation (no external dependency).
 * Types each string, pauses, deletes it, then moves to the next.
 */
const TypingText = ({
  strings = [],
  typeSpeed = 80,
  backSpeed = 40,
  backDelay = 1500,
  loop = true,
}) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduceMotion || strings.length === 0) return undefined;

    const current = strings[index % strings.length];
    const isLast = index === strings.length - 1;
    let delay = deleting ? backSpeed : typeSpeed;

    if (!deleting && text === current) {
      if (!loop && isLast) return undefined;
      delay = backDelay;
    }

    const timer = setTimeout(() => {
      if (!deleting && text === current) {
        setDeleting(true);
      } else if (deleting && text === '') {
        setDeleting(false);
        setIndex((i) => (i + 1) % strings.length);
      } else {
        setText(
          deleting
            ? current.slice(0, text.length - 1)
            : current.slice(0, text.length + 1)
        );
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, index, strings, typeSpeed, backSpeed, backDelay, loop, reduceMotion]);

  if (reduceMotion) return <span>{strings[0]}</span>;

  return (
    <span aria-label={strings.join(', ')}>
      <span aria-hidden='true'>{text}</span>
      <span aria-hidden='true' className='typing-cursor'>|</span>
      <style>{`
        .typing-cursor { animation: typing-blink 1s step-end infinite; }
        @keyframes typing-blink { 50% { opacity: 0; } }
      `}</style>
    </span>
  );
};

export default TypingText;
