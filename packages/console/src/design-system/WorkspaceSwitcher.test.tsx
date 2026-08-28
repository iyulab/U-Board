import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.js';

const WORKSPACES = [
  { id: 'w1', name: 'Acme Robotics' },
  { id: 'w2', name: 'Acme Facilities' },
  { id: 'w3', name: 'Contoso Plant' },
];

function renderSwitcher(props: Partial<Parameters<typeof WorkspaceSwitcher>[0]> = {}) {
  return render(
    <WorkspaceSwitcher
      workspaces={WORKSPACES}
      activeWorkspaceId="w1"
      onSwitch={vi.fn()}
      onCreate={vi.fn().mockResolvedValue(undefined)}
      {...props}
    />
  );
}

describe('WorkspaceSwitcher', () => {
  it('shows the active workspace name on the trigger', () => {
    renderSwitcher();
    expect(screen.getByRole('button', { name: /Acme Robotics/ })).toBeInTheDocument();
  });

  it('shows a placeholder when nothing is active yet', () => {
    renderSwitcher({ activeWorkspaceId: null });
    expect(screen.getByRole('button', { name: /워크스페이스 선택/ })).toBeInTheDocument();
  });

  it('opens the panel and lists every workspace on trigger click', async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));

    expect(screen.getByRole('button', { name: 'Acme Facilities' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contoso Plant' })).toBeInTheDocument();
  });

  it('focuses the search field when opened', async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));

    expect(screen.getByLabelText('워크스페이스 검색')).toHaveFocus();
  });

  it('filters the list as the search query changes', async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
    await userEvent.type(screen.getByLabelText('워크스페이스 검색'), 'contoso');

    expect(screen.getByRole('button', { name: 'Contoso Plant' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acme Facilities' })).not.toBeInTheDocument();
  });

  it('shows an empty state when no workspace matches the query', async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
    await userEvent.type(screen.getByLabelText('워크스페이스 검색'), 'nonexistent');

    expect(screen.getByText('일치하는 워크스페이스가 없습니다')).toBeInTheDocument();
  });

  it('switches on selecting a different workspace and closes the panel', async () => {
    const onSwitch = vi.fn();
    renderSwitcher({ onSwitch });
    const trigger = screen.getByRole('button', { name: /Acme Robotics/ });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Contoso Plant' }));

    expect(onSwitch).toHaveBeenCalledWith('w3');
    expect(screen.queryByLabelText('워크스페이스 검색')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('does not call onSwitch when re-selecting the already-active workspace, but still closes and restores focus', async () => {
    const onSwitch = vi.fn();
    renderSwitcher({ onSwitch });
    const trigger = screen.getByRole('button', { name: /Acme Robotics/ });
    await userEvent.click(trigger);
    await userEvent.click(screen.getAllByRole('button', { name: 'Acme Robotics' })[1]);

    expect(onSwitch).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('워크스페이스 검색')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    renderSwitcher();
    const trigger = screen.getByRole('button', { name: /Acme Robotics/ });
    await userEvent.click(trigger);
    expect(screen.getByLabelText('워크스페이스 검색')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByLabelText('워크스페이스 검색')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when focus leaves the switcher (e.g. tabbing past it)', async () => {
    render(
      <div>
        <WorkspaceSwitcher workspaces={WORKSPACES} activeWorkspaceId="w1" onSwitch={vi.fn()} onCreate={vi.fn()} />
        <button type="button">다음 요소</button>
      </div>
    );
    await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
    expect(screen.getByLabelText('워크스페이스 검색')).toBeInTheDocument();

    screen.getByRole('button', { name: '다음 요소' }).focus();

    await waitFor(() => expect(screen.queryByLabelText('워크스페이스 검색')).not.toBeInTheDocument());
  });

  it('closes when clicking outside the switcher', async () => {
    render(
      <div>
        <WorkspaceSwitcher workspaces={WORKSPACES} activeWorkspaceId="w1" onSwitch={vi.fn()} onCreate={vi.fn()} />
        <button type="button">바깥 요소</button>
      </div>
    );
    await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
    expect(screen.getByLabelText('워크스페이스 검색')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '바깥 요소' }));

    expect(screen.queryByLabelText('워크스페이스 검색')).not.toBeInTheDocument();
  });

  describe('creating a workspace', () => {
    it('switches to a name form when "+ 새 워크스페이스" is clicked', async () => {
      renderSwitcher();
      await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));

      expect(screen.getByLabelText('워크스페이스 이름')).toBeInTheDocument();
      expect(screen.queryByLabelText('워크스페이스 검색')).not.toBeInTheDocument();
    });

    it('focuses the name field when entering create mode', async () => {
      renderSwitcher();
      await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));

      expect(screen.getByLabelText('워크스페이스 이름')).toHaveFocus();
    });

    it('calls onCreate with the trimmed name and closes on success', async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      renderSwitcher({ onCreate });
      const trigger = screen.getByRole('button', { name: /Acme Robotics/ });
      await userEvent.click(trigger);
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));
      await userEvent.type(screen.getByLabelText('워크스페이스 이름'), '  New Site  ');
      await userEvent.click(screen.getByRole('button', { name: '만들기' }));

      await waitFor(() => expect(onCreate).toHaveBeenCalledWith('New Site'));
      expect(screen.queryByLabelText('워크스페이스 이름')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('shows an inline error and stays open when onCreate rejects', async () => {
      const onCreate = vi.fn().mockRejectedValue(new Error('boom'));
      renderSwitcher({ onCreate });
      await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));
      await userEvent.type(screen.getByLabelText('워크스페이스 이름'), 'New Site');
      await userEvent.click(screen.getByRole('button', { name: '만들기' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('워크스페이스 생성에 실패했습니다.');
      expect(screen.getByLabelText('워크스페이스 이름')).toBeInTheDocument();
    });

    it('returns to the browse list via "목록으로" without calling onCreate', async () => {
      const onCreate = vi.fn();
      renderSwitcher({ onCreate });
      await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));
      await userEvent.type(screen.getByLabelText('워크스페이스 이름'), 'New Site');
      await userEvent.click(screen.getByRole('button', { name: '◂ 목록으로' }));

      expect(screen.getByLabelText('워크스페이스 검색')).toBeInTheDocument();
      expect(onCreate).not.toHaveBeenCalled();
    });

    it('disables submit while the name field is empty', async () => {
      renderSwitcher();
      await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));

      expect(screen.getByRole('button', { name: '만들기' })).toBeDisabled();
    });

    it('steps back to the list on Escape instead of closing entirely', async () => {
      renderSwitcher();
      await userEvent.click(screen.getByRole('button', { name: /Acme Robotics/ }));
      await userEvent.click(screen.getByRole('button', { name: '+ 새 워크스페이스' }));
      await userEvent.type(screen.getByLabelText('워크스페이스 이름'), 'New Site');

      await userEvent.keyboard('{Escape}');

      expect(screen.getByLabelText('워크스페이스 검색')).toBeInTheDocument();
      expect(screen.queryByLabelText('워크스페이스 이름')).not.toBeInTheDocument();
    });
  });
});
