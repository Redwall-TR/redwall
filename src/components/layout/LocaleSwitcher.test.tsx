import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/yazilim',
  useRouter: () => ({ replace: vi.fn() }),
}));
import LocaleSwitcher from './LocaleSwitcher';

describe('LocaleSwitcher', () => {
  it('TR ve EN seçeneklerini gösterir', () => {
    render(<LocaleSwitcher locale="tr" />);
    expect(screen.getByText('TR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
});
