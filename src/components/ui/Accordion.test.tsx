import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('cevap başta gizli, tıklayınca görünür', () => {
    render(<Accordion items={[{ soru: 'S1', cevap: 'C1' }]} />);
    expect(screen.queryByText('C1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('S1'));
    expect(screen.getByText('C1')).toBeInTheDocument();
  });
});
