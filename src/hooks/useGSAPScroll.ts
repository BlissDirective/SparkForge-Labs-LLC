'use client';

// ================================================================
// SparkForge useGSAPScroll — GSAP ScrollTrigger React Wrapper
// ================================================================
// Handles GSAP registration, cleanup, and SSR safety.
// Used by: Landing page scroll journey, parallax layers, scroll animations

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ■■ Types ■■
interface ScrollAnimationConfig {
  trigger: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}

interface UseGSAPScrollReturn {
  createScrollTrigger: (
    config: ScrollAnimationConfig
  ) => ScrollTrigger | null;
  animateOnScroll: (
    target: string | Element,
    animation: gsap.TweenVars,
    triggerConfig?: Partial<ScrollAnimationConfig>
  ) => gsap.core.Tween | null;
  staggerOnScroll: (
    targets: string | Element[],
    animation: gsap.TweenVars,
    stagger: number,
    triggerConfig?: Partial<ScrollAnimationConfig>
  ) => gsap.core.Tween | null;
  parallax: (
    target: string | Element,
    speed: number,
    triggerConfig?: Partial<ScrollAnimationConfig>
  ) => gsap.core.Tween | null;
}

// ■■ Hook ■■
export function useGSAPScroll(): UseGSAPScrollReturn {
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      triggersRef.current.forEach((t) => t.kill());
      tweensRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
      tweensRef.current = [];
    };
  }, []);

  const createScrollTrigger = useCallback(
    (config: ScrollAnimationConfig) => {
      if (typeof window === 'undefined') return null;

      const trigger = ScrollTrigger.create({
        trigger: config.trigger,
        start: config.start || 'top 80%',
        end: config.end || 'bottom 20%',
        scrub: config.scrub,
        pin: config.pin,
        markers: config.markers || false,
        onEnter: config.onEnter,
        onLeave: config.onLeave,
        onEnterBack: config.onEnterBack,
        onLeaveBack: config.onLeaveBack,
      });

      triggersRef.current.push(trigger);
      return trigger;
    },
    []
  );

  const animateOnScroll = useCallback(
    (
      target: string | Element,
      animation: gsap.TweenVars,
      triggerConfig?: Partial<ScrollAnimationConfig>
    ) => {
      if (typeof window === 'undefined') return null;

      const tween = gsap.from(target, {
        ...animation,
        scrollTrigger: {
          trigger: triggerConfig?.trigger || target,
          start: triggerConfig?.start || 'top 85%',
          end: triggerConfig?.end || 'bottom 20%',
          scrub: triggerConfig?.scrub,
          toggleActions: 'play none none reverse',
        },
      });

      tweensRef.current.push(tween);
      return tween;
    },
    []
  );

  const staggerOnScroll = useCallback(
    (
      targets: string | Element[],
      animation: gsap.TweenVars,
      stagger: number,
      triggerConfig?: Partial<ScrollAnimationConfig>
    ) => {
      if (typeof window === 'undefined') return null;

      const tween = gsap.from(targets, {
        ...animation,
        stagger,
        scrollTrigger: {
          trigger:
            triggerConfig?.trigger ||
            (typeof targets === 'string' ? targets : targets[0]),
          start: triggerConfig?.start || 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      tweensRef.current.push(tween);
      return tween;
    },
    []
  );

  const parallax = useCallback(
    (
      target: string | Element,
      speed: number,
      triggerConfig?: Partial<ScrollAnimationConfig>
    ) => {
      if (typeof window === 'undefined') return null;

      const tween = gsap.to(target, {
        y: () => -ScrollTrigger.maxScroll(window) * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerConfig?.trigger || target,
          start: triggerConfig?.start || 'top top',
          end: triggerConfig?.end || 'max',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tweensRef.current.push(tween);
      return tween;
    },
    []
  );

  return { createScrollTrigger, animateOnScroll, staggerOnScroll, parallax };
}
