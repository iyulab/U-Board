import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { JsonTreeExplorer } from './JsonTreeExplorer.js';

describe('JsonTreeExplorer', () => {
  it('renders each leaf field as a clickable entry showing its value', () => {
    render(<JsonTreeExplorer value={{ status: 'running', load: 73 }} onSelectPath={vi.fn()} />);
    expect(screen.getByText('status: "running"')).toBeInTheDocument();
    expect(screen.getByText('load: 73')).toBeInTheDocument();
  });

  it('calls onSelectPath with the dotted path when a nested leaf is clicked', () => {
    const onSelectPath = vi.fn();
    render(<JsonTreeExplorer value={{ metrics: { load: 73 } }} onSelectPath={onSelectPath} />);

    fireEvent.click(screen.getByText('load: 73'));

    expect(onSelectPath).toHaveBeenCalledWith('metrics.load');
  });

  it('renders array entries by index', () => {
    const onSelectPath = vi.fn();
    render(<JsonTreeExplorer value={{ items: ['a', 'b'] }} onSelectPath={onSelectPath} />);

    fireEvent.click(screen.getByText('1: "b"'));

    expect(onSelectPath).toHaveBeenCalledWith('items.1');
  });

  it('lets the author select the entire response when the root value is a primitive', () => {
    const onSelectPath = vi.fn();
    render(<JsonTreeExplorer value={42} onSelectPath={onSelectPath} />);

    fireEvent.click(screen.getByText('(전체 응답): 42'));

    expect(onSelectPath).toHaveBeenCalledWith('');
  });
});
