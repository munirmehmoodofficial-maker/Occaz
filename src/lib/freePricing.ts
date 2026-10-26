/**
 * Free-vs-paid helpers.
 *
 * A listing is FREE when the user must not be asked for money:
 *
 *  - Events: every ticket tier is priced at 0, or there are no ticket tiers
 *    at all and the event's top-level price is 0.
 *  - Opportunities: the fee type is "free" (or the fee amount is 0).
 *
 * Why this is a shared helper: the booking modal, the checkout page and the
 * detail pages all need to agree on "is this free?". Previously each one had
 * its own slightly different check, so a free event that happened to have a
 * ticket tier was still treated as paid and the attendee was pushed through
 * a payment flow.
 */

export type TicketTierLike = {
  id?: string;
  name?: string;
  price?: number | null;
};

/**
 * True when the event costs nothing — no card, no manual payment proof,
 * no service fee.
 */
export function isEventFree(
  event: {
    price?: number | null;
    ticketTypes?: TicketTierLike[] | null;
  } | null
  | undefined,
): boolean {
  if (!event) return true;

  const tiers = event.ticketTypes ?? [];
  if (tiers.length > 0) {
    // Every tier must be free for the event to be free.
    return tiers.every((t) => Number(t?.price ?? 0) === 0);
  }

  // No tiers — fall back to the event's top-level price.
  return Number(event.price ?? 0) === 0;
}

/**
 * True when the opportunity costs nothing to apply for.
 */
export function isOpportunityFree(
  opp: {
    feeType?: string | null;
    price?: number | null;
  } | null
  | undefined,
): boolean {
  if (!opp) return true;
  if (opp.feeType && opp.feeType !== "free") {
    // A paid fee type with a 0 amount is still free in practice.
    return Number(opp.price ?? 0) === 0;
  }
  return Number(opp.price ?? 0) === 0;
}

/**
 * Service fee in PKR. Free listings never get a service fee.
 */
export function serviceFeeFor(subtotal: number, isFree: boolean): number {
  if (isFree) return 0;
  return Math.round(subtotal * 0.05);
}
