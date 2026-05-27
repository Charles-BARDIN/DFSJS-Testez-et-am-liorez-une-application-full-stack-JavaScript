import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoie le DOM rendu et le localStorage après chaque test.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
