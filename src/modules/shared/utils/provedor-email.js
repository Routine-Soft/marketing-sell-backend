// Só interessam leads com e-mail do Gmail ou do Yahoo (inclui googlemail, ymail, rocketmail e yahoo.co.uk etc.).
export const GMAIL_YAHOO_RE = /@(gmail\.com|googlemail\.com|yahoo\.[a-z.]+|ymail\.com|rocketmail\.com)$/i

export function ehGmailOuYahoo(email) {
    return GMAIL_YAHOO_RE.test(String(email ?? '').trim())
}
