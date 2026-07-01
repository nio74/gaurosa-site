import NextLink from 'next/link';
import type { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Wrapper di next/link con prefetch DISATTIVATO di default.
 *
 * Perché: gaurosa.it è un static export (`output: 'export'`). Il prefetch dei
 * <Link> di Next fa richieste RSC del tipo `/<rotta>/__next.*.txt?_rsc=...` che in
 * un sito statico NON esistono → 404 in console (rumore che può nascondere errori
 * veri). Con prefetch off spariscono. La navigazione al click resta identica.
 *
 * Se un giorno un link specifico deve fare prefetch, basta passare `prefetch` esplicito:
 *   <Link href="/..." prefetch>...</Link>
 */
export default function Link({ prefetch = false, ...props }: LinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
