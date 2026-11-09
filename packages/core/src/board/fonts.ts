// What a board's `fonts` may say — one place, so the check that refuses a font and the viewer that loads one read the same rule.

/** A board loads at most this many fonts: each is a request the viewer makes before its text is drawn in the face. */
export const MAX_FONTS = 8;

/** An inline font over this many characters is too large to carry in the board; it belongs at an `https://` address. */
export const MAX_INLINE_FONT = 300_000;

/** One family name — letters, digits, spaces, dots, hyphens, underscores — never a list, a quote, a url or a rule. */
export const FONT_FAMILY = /^[\p{L}\p{N} ._-]{1,64}$/u;

/** A font's source: an `https://` address, or an inline `data:font/…` URL in base64. */
export const FONT_SRC = /^(https:\/\/[^\s"'()<>\\]+|data:font\/(woff2|woff|ttf|otf|sfnt)(;[\w=.-]+)*;base64,[A-Za-z0-9+/=]+)$/i;
