// The one way a test fakes the network (docs/TESTING.md, rule 4). `fetch` answers from a
// table of routes, by URL path, and records every URL asked; leaving the `using` block puts
// the real `fetch` back.
//
//   using fetch = fakeFetch({ '/collections.json': json([birds]), '/lists/birds.json': status(500) });
//   using fetch = fakeFetch({ '/stats.json': inTurn(fails('offline'), json(stats)) });

/** A failed request, with whatever it fails with (an Error, or anything thrown). */
export class Failure {
  readonly reason: unknown;
  constructor(reason: unknown) {
    this.reason = reason;
  }
}

/** What a route answers with: a response, one still coming, or a failure. */
export type Answer = Response | Promise<Response> | Failure;

/** A route: an answer, or a function that gives one each time it is asked. */
export type Route = Answer | (() => Answer);

/** A response carrying `body` as JSON. */
export const json = (body: unknown): Response => new Response(JSON.stringify(body));

/** An HTTP error, by status. */
export const status = (code: number): Response => new Response('', { status: code });

/** A request that fails outright (offline, say), with `reason`. */
export const fails = (reason: unknown): Failure => new Failure(reason);

/** A route that answers each time with the next of `answers`; past the last, a 404. */
export function inTurn(...answers: Answer[]): () => Answer {
  return () => answers.shift() ?? status(404);
}

export interface FakeFetch extends Disposable {
  /** Every URL asked, in order. */
  calls: string[];
}

/** Fake `fetch` with `routes`, by URL path; a path with no route answers 404. */
export function fakeFetch(routes: Record<string, Route>): FakeFetch {
  const real = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = ((input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push(url);
    const route = routes[url] ?? status(404);
    const answer = typeof route === 'function' ? route() : route;
    // A Response can be read once; a route asked twice gets a fresh copy.
    return answer instanceof Failure
      ? Promise.reject(answer.reason)
      : Promise.resolve(answer).then((response) => response.clone());
  }) as typeof fetch;
  return {
    calls,
    [Symbol.dispose]: () => {
      globalThis.fetch = real;
    },
  };
}
