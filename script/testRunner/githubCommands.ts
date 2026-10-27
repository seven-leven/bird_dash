// GitHub's workflow commands, which mark a problem on its file in a pull request
// (https://docs.github.com/actions/reference/workflow-commands-for-github-actions).

/** A message, escaped as a workflow command needs it. */
const escapeData = (s: string) =>
  s.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');

/** A property (file, title), escaped further: `:` and `,` separate properties. */
const escapeProp = (s: string) => escapeData(s).replaceAll(':', '%3A').replaceAll(',', '%2C');

/** `::error file=…,line=…,title=…::message`: one annotation, on a line of a file when given one. */
export function annotation(
  level: 'error' | 'warning',
  { file, line, title, message }: { file: string; line?: number; title: string; message: string },
): string {
  const at = line !== undefined && line > 0 && Number.isFinite(line) ? `,line=${line}` : '';
  return `::${level} file=${escapeProp(file)}${at},title=${escapeProp(title)}::${
    escapeData(message)
  }`;
}
