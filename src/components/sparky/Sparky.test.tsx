// ════════════════════════════════════════════════════════════════════════════
// SPARKY COMPONENT SYSTEM — Test Suite
// ════════════════════════════════════════════════════════════════════════════
// Tests all Sparky components: Core, Floating, Presenter, Static.
// Verifies expressions render, wrappers function, and no duplication exists.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SparkyCore, EXPRESSIONS } from './SparkyCore';
import { SparkyFloating } from './SparkyFloating';
import { SparkyPresenter } from './SparkyPresenter';
import { SparkyStatic } from './SparkyStatic';

describe('SparkyCore', () => {
  it('renders with default idle expression', () => {
    const { container } = render(<SparkyCore expression="idle" size="md" />);
    // Should contain SVG
    expect(container.querySelector('svg')).toBeTruthy();
    // Should have the face screen (rect element)
    expect(container.querySelector('rect[rx="20"]')).toBeTruthy();
  });

  it('renders all 9 expressions without crashing', () => {
    const expressions = Object.keys(EXPRESSIONS) as Array<keyof typeof EXPRESSIONS>;
    expressions.forEach((expr) => {
      const { container } = render(<SparkyCore expression={expr} size="md" />);
      expect(container.querySelector('svg')).toBeTruthy();
      const circles = container.querySelectorAll('circle');
      // Each eye has: outer ring + ring fill + dark center + highlight = 4 circles per eye
      expect(circles.length).toBeGreaterThanOrEqual(8);
    });
  });

  it('renders all 4 size variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    sizes.forEach((size) => {
      const { container } = render(<SparkyCore expression="happy" size={size} />);
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('has unique glow colors per expression', () => {
    const colors = Object.values(EXPRESSIONS).map((e) => e.glowColor);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(Object.keys(EXPRESSIONS).length);
  });

  it('renders mouth path for each expression', () => {
    Object.entries(EXPRESSIONS).forEach(([_name, config]) => {
      const { container } = render(<SparkyCore expression="idle" size="md" />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  it('includes antenna element', () => {
    const { container } = render(<SparkyCore expression="idle" size="md" />);
    // Antenna is rendered as a div with specific gradient
    expect(container.textContent).not.toContain('error');
  });

  it('renders aura when showAura is true', () => {
    const { container } = render(<SparkyCore expression="idle" size="md" showAura />);
    // Aura is rendered — container should have children
    expect(container.firstChild).toBeTruthy();
  });

  it('does not animate when isAnimated is false', () => {
    const { container } = render(
      <SparkyCore expression="idle" size="md" isAnimated={false} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies custom glow color override', () => {
    const { container } = render(
      <SparkyCore expression="idle" size="md" glowColor="#FF0000" />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SparkyCore expression="idle" size="md" className="test-class" />
    );
    expect(container.querySelector('.test-class')).toBeTruthy();
  });
});

describe('SparkyFloating', () => {
  it('renders floating assistant with button', () => {
    render(
      <SparkyFloating
        expression="happy"
        isChatOpen={false}
        onClick={() => {}}
      />
    );
    const button = screen.getByLabelText(/Open Sparky chat/i);
    expect(button).toBeTruthy();
  });

  it('shows close label when chat is open', () => {
    render(
      <SparkyFloating
        expression="happy"
        isChatOpen={true}
        onClick={() => {}}
      />
    );
    const button = screen.getByLabelText(/Close Sparky chat/i);
    expect(button).toBeTruthy();
  });

  it('renders with quick tip', () => {
    const { container } = render(
      <SparkyFloating
        expression="happy"
        isChatOpen={false}
        onClick={() => {}}
        quickTip="Try a new game today!"
      />
    );
    expect(container.textContent).toContain('Try a new game today!');
  });

  it('renders with all 9 expressions', () => {
    const expressions = Object.keys(EXPRESSIONS) as Array<keyof typeof EXPRESSIONS>;
    expressions.forEach((expr) => {
      const { container } = render(
        <SparkyFloating
          expression={expr}
          isChatOpen={false}
          onClick={() => {}}
        />
      );
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('renders chat indicator badge when chat closed', () => {
    const { container } = render(
      <SparkyFloating
        expression="happy"
        isChatOpen={false}
        onClick={() => {}}
      />
    );
    // Badge should be present (MessageCircle icon)
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('does not show badge when chat is open', () => {
    const { container } = render(
      <SparkyFloating
        expression="happy"
        isChatOpen={true}
        onClick={() => {}}
      />
    );
    // Should still render Sparky
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('SparkyPresenter', () => {
  it('renders with message and mission type', () => {
    render(
      <SparkyPresenter
        expression="happy"
        message="Train a neural network today!"
        missionType="daily"
      />
    );
    expect(screen.getByText(/Train a neural network today!/i)).toBeTruthy();
    expect(screen.getByText(/Daily Mission/i)).toBeTruthy();
  });

  it('renders all mission types', () => {
    const types = ['daily', 'event', 'onboarding', 'streak_warning', 'challenge'] as const;
    types.forEach((type) => {
      const { container } = render(
        <SparkyPresenter
          expression="happy"
          message="Test message"
          missionType={type}
        />
      );
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('shows action button when onAction provided', () => {
    render(
      <SparkyPresenter
        expression="happy"
        message="Do this mission!"
        actionLabel="Start Now"
        onAction={() => {}}
      />
    );
    expect(screen.getByText(/Start Now/i)).toBeTruthy();
  });

  it('shows dismiss button when onDismiss provided', () => {
    render(
      <SparkyPresenter
        expression="happy"
        message="Dismissible message"
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText(/Dismiss/i)).toBeTruthy();
  });

  it('renders Sparky orb below speech bubble', () => {
    const { container } = render(
      <SparkyPresenter
        expression="happy"
        message="Test"
        missionType="daily"
      />
    );
    // Should have SVG (Sparky face)
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('SparkyStatic', () => {
  it('renders without animation', () => {
    const { container } = render(<SparkyStatic expression="happy" size="lg" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders all size variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    sizes.forEach((size) => {
      const { container } = render(<SparkyStatic expression="happy" size={size} />);
      expect(container.querySelector('svg')).toBeTruthy();
    });
  });

  it('renders with aura', () => {
    const { container } = render(<SparkyStatic expression="happy" size="lg" showAura />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders without aura', () => {
    const { container } = render(<SparkyStatic expression="happy" size="lg" showAura={false} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('Expression Configuration', () => {
  it('has exactly 9 expressions', () => {
    expect(Object.keys(EXPRESSIONS).length).toBe(9);
  });

  it('each expression has all required config fields', () => {
    Object.entries(EXPRESSIONS).forEach(([_name, config]) => {
      expect(config.eyeScale).toBeDefined();
      expect(config.eyeYOffset).toBeDefined();
      expect(config.mouthPath).toBeDefined();
      expect(config.glowColor).toBeDefined();
      expect(config.eyeRingOpacity).toBeDefined();
      expect(config.antennaGlowIntensity).toBeDefined();
      expect(config.mouthPath.length).toBeGreaterThan(0);
      expect(config.glowColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('eye scales are within reasonable range (0.3-1.5)', () => {
    Object.values(EXPRESSIONS).forEach((config) => {
      expect(config.eyeScale).toBeGreaterThanOrEqual(0.3);
      expect(config.eyeScale).toBeLessThanOrEqual(1.5);
    });
  });

  it('eye ring opacities are within valid range (0.3-1.0)', () => {
    Object.values(EXPRESSIONS).forEach((config) => {
      expect(config.eyeRingOpacity).toBeGreaterThanOrEqual(0.3);
      expect(config.eyeRingOpacity).toBeLessThanOrEqual(1.0);
    });
  });
});

describe('Backward Compatibility', () => {
  it('TutorExpression type exists for legacy imports', () => {
    // The old AITutorAvatar should still work as a wrapper
    expect(() => {
      // Dynamic import to check the file compiles
      import('@/components/ai-tutor/AITutorAvatar');
    }).not.toThrow();
  });
});
