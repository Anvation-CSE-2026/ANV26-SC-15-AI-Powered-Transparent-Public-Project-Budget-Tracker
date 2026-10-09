import React from 'react';
import { HeroBackground } from '../../components/landing/HeroBackground';
import { TopNavigation } from '../../components/landing/TopNavigation';
import { HeroMessage } from '../../components/landing/HeroMessage';
import { FeatureHighlights } from '../../components/landing/FeatureHighlights';
import { LoginCard } from '../../components/auth/LoginCard';

export const LoginPage: React.FC = () => {
  return (
    <HeroBackground>
      <TopNavigation />

      <main
        role="main"
        className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-4 sm:py-6"
      >
        <div className="w-full max-w-7xl mx-auto relative flex items-center justify-center">
          <div className="relative z-10 w-full flex justify-center">
            <LoginCard />
          </div>

          <div className="hidden lg:block absolute right-2 xl:right-8 top-1/2 -translate-y-1/2">
            <HeroMessage />
          </div>
        </div>
      </main>

      <FeatureHighlights />
    </HeroBackground>
  );
};
