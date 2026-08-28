import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardGrid } from './Card.js';

describe('CardGrid + Card', () => {
  it('renders as a list so items keep their list semantics and position-in-set', () => {
    render(
      <CardGrid>
        <Card>First</Card>
        <Card>Second</Card>
      </CardGrid>
    );

    const list = screen.getByRole('list');
    const items = screen.getAllByRole('listitem');
    expect(list).toContainElement(items[0]);
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('First');
    expect(items[1]).toHaveTextContent('Second');
  });

  it('renders arbitrary children inside a card', () => {
    render(
      <CardGrid>
        <Card>
          <a href="/x">A link</a>
          <button>An action</button>
        </Card>
      </CardGrid>
    );

    expect(screen.getByRole('link', { name: 'A link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'An action' })).toBeInTheDocument();
  });
});
