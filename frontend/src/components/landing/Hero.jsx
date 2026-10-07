import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TypingText from '../shared/TypingText';
import HowToCheckDialog from './HowToCheckDialog';

const TYPED_PHRASES = ['mail delivery', 'domain reputation', 'public services'];

const Hero = () => {
  const navigate = useNavigate();
  const [hostname, setHostname] = useState('');
  const [howToOpen, setHowToOpen] = useState(false);

  // Send the user to the Quick Check page, which runs the check and shows the result.
  const handleCheck = () => {
    const value = hostname.trim();
    if (!value) return;
    navigate(`/quick-check?${new URLSearchParams({ hostname: value })}`);
  };

  return (
    <section>
      <div className='max-w-3xl mx-auto px-4 py-20 lg:py-28 text-center'>
        <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-ink [text-wrap:balance]'>
          Catch blacklist risk before it hits your
          <span className='block text-accent min-h-[1.1em]'>
            <TypingText
              strings={TYPED_PHRASES}
              typeSpeed={80}
              backSpeed={40}
              loop
            />
          </span>
        </h1>
        <p className='mt-6 mx-auto max-w-xl text-muted text-base md:text-lg [text-wrap:pretty]'>
          Check any domain or IP against 60 spam blacklists in one go.
        </p>

        <form
          className='mt-10 mx-auto max-w-xl flex flex-col sm:flex-row gap-3'
          onSubmit={(e) => { e.preventDefault(); handleCheck(); }}
        >
          <label htmlFor='quick-check-target' className='sr-only'>Domain or IP address</label>
          <input
            id='quick-check-target'
            className='input flex-1 !py-3'
            type='text'
            placeholder='Enter your IP here'
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
          <button
            type='submit'
            className='btn-primary !py-3 !px-6'
            disabled={!hostname.trim()}
          >
            Check now
          </button>
          <button
            type='button'
            className='btn-ghost !py-3'
            onClick={() => setHowToOpen(true)}
          >
            How to check
          </button>
        </form>
        <HowToCheckDialog open={howToOpen} onClose={() => setHowToOpen(false)} />


      </div>

    </section>
  );
};

export default Hero;
