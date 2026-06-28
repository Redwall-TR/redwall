import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/yazilim',
  useRouter: () => ({ replace: vi.fn() }),
}));

import LocaleSwitcher from './LocaleSwitcher';

describe('LocaleSwitcher', () => {
  it('tetikleyici mevcut dili gösterir; tıklayınca dil seçenekleri açılır', () => {
    render(<LocaleSwitcher locale="tr" />);

    // Tetikleyici buton (mevcut dil) — dropdown kapalı
    const trigger = screen.getByLabelText('Dil / Language');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('tr');
    expect(screen.queryByText('Türkçe')).not.toBeInTheDocument();
    expect(screen.queryByText('English')).not.toBeInTheDocument();

    // Açınca her iki dil seçeneği görünür
    fireEvent.click(trigger);
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});
