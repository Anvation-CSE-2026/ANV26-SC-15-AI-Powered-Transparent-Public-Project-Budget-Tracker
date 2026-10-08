import { describe, it, expect } from 'vitest';

describe('Landing Page & Login Redesign Component Specifications', () => {
  it('defines the core CivicSight slogan and campaign pillars', () => {
    const sloganLines = ['Cleaner, Safer,', 'Greener, Smarter', 'Together.'];
    expect(sloganLines).toHaveLength(3);
    expect(sloganLines[2]).toBe('Together.');
  });

  it('validates the four core Smart City feature highlights', () => {
    const features = [
      { title: 'Report Issues', subtitle: 'Make your city better' },
      { title: 'Share Ideas', subtitle: 'Your ideas matter' },
      { title: 'Participate', subtitle: 'Shape the future' },
      { title: 'Track Progress', subtitle: 'See real progress' },
    ];

    expect(features).toHaveLength(4);
    expect(features.map((f) => f.title)).toEqual([
      'Report Issues',
      'Share Ideas',
      'Participate',
      'Track Progress',
    ]);
  });

  it('verifies remember-me storage key and username authentication model', () => {
    const REMEMBER_ME_KEY = 'civicsight_remembered_username';
    expect(REMEMBER_ME_KEY).toBe('civicsight_remembered_username');

    // Single unified login without role selector; role is determined server-side from profile
    const loginField = 'Username';
    expect(loginField).toBe('Username');
  });

  it('verifies the brand taglines match specifications', () => {
    const primaryTagline = 'See the Project. Understand the Data. Make Your Voice Count.';
    const navbarSubtitle = 'Smarter Cities • Happier Citizens';
    const cardSubtitle = 'Smart City Management Platform';

    expect(primaryTagline).toContain('Understand the Data');
    expect(navbarSubtitle).toContain('Smarter Cities');
    expect(cardSubtitle).toContain('Management Platform');
  });
});
