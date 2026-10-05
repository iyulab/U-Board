/** The wording of every email the server sends, in one place. The text is Korean, matching the
 *  console the recipient lands in; a per-installation language would replace this module's
 *  functions, not the senders that call them. All text is plain (no markup), so values that come
 *  from a workspace — its name, the inviter's name — cannot inject anything. */

export interface EmailMessage {
  subject: string;
  body: string;
}

/** What an invitation email says — everything but the recipient's own address comes from the
 *  inviting workspace. */
export interface InvitationEmail {
  email: string;
  invitationId: string;
  workspaceName: string;
  inviterName: string;
  role: 'owner' | 'member';
  /** The link that opens the invitation in the console. */
  link: string;
  expiresAt: string;
}

export function passwordResetMessage(token: string): EmailMessage {
  return {
    subject: 'U-Board 비밀번호 재설정 코드',
    body:
      `U-Board 비밀번호를 재설정하려면 아래 코드를 입력하세요.\n\n${token}\n\n` +
      `이 코드는 1시간 동안 한 번만 쓸 수 있습니다. 비밀번호 재설정을 요청하지 않았다면 이 메일을 무시하세요.`,
  };
}

/** `2026-10-12T03:04:05.000Z` → `2026-10-12 03:04 (UTC)`. The server does not know the
 *  recipient's time zone, so the time is stated in UTC rather than silently in one zone. */
function formatUtc(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} (UTC)`;
}

export function invitationMessage(input: InvitationEmail): EmailMessage {
  return {
    // Workspace-controlled text stays out of the subject header.
    subject: 'U-Board 워크스페이스 초대',
    body:
      `${input.inviterName}님이 U-Board의 "${input.workspaceName}" 워크스페이스에 ${input.role} 역할로 초대했습니다.\n\n` +
      `초대 수락:\n${input.link}\n\n` +
      `이 초대는 ${formatUtc(input.expiresAt)}까지 유효하며, 이 메일 주소로 한 번만 쓸 수 있습니다. ` +
      `예상하지 못한 초대라면 이 메일을 무시하세요.`,
  };
}
