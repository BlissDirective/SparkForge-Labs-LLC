'use client';

import { createContext, useContext } from 'react';

// S3-WARN-002: Context to pass card hover state from login page to 3D portal
export const AuthHoverContext = createContext<{
  isCardHovered: boolean;
  setIsCardHovered: (hovered: boolean) => void;
}>({ isCardHovered: false, setIsCardHovered: () => {} });

export const useAuthHover = () => useContext(AuthHoverContext);
