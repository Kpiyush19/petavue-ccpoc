import { escapeHtml } from '../utils/escapeHtml';

/**
 * Parse a unified diff string and render it as a GitHub-style diff view.
 */
export default function DiffView({ diff }) {
  if (!diff) return null;

  const lines = diff.split('\n');
  const hunks = [];
  let filePath = '';
  let currentHunk = null;

  for (const line of lines) {
    if (line.startsWith('--- ')) {
      filePath = line.slice(4).replace(/^a\//, '');
      continue;
    }
    if (line.startsWith('+++ ')) continue;

    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentHunk = { oldStart: parseInt(hunkMatch[1]), newStart: parseInt(hunkMatch[2]), lines: [] };
      hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('-')) {
      currentHunk.lines.push({ type: 'removed', text: line.slice(1) });
    } else if (line.startsWith('+')) {
      currentHunk.lines.push({ type: 'added', text: line.slice(1) });
    } else if (line.startsWith(' ') || line === '') {
      currentHunk.lines.push({ type: 'context', text: line.startsWith(' ') ? line.slice(1) : line });
    }
  }

  for (const hunk of hunks) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;
    for (const l of hunk.lines) {
      if (l.type === 'context') {
        l.oldNum = oldLine++;
        l.newNum = newLine++;
      } else if (l.type === 'removed') {
        l.oldNum = oldLine++;
        l.newNum = null;
      } else if (l.type === 'added') {
        l.oldNum = null;
        l.newNum = newLine++;
      }
    }
  }

  return (
    <div className="diff-view">
      <div className="diff-view__header">{filePath}</div>
      {hunks.map((hunk, hi) => (
        <div key={hi} className="diff-view__hunk">
          {hunk.lines.map((l, li) => (
            <div
              key={li}
              className={`diff-view__line ${l.type === 'removed' ? 'diff-view__line--removed' : l.type === 'added' ? 'diff-view__line--added' : 'diff-view__line--context'}`}
            >
              <span className="diff-view__gutter diff-view__gutter--old">
                {l.oldNum ?? ''}
              </span>
              <span className="diff-view__gutter diff-view__gutter--new">
                {l.newNum ?? ''}
              </span>
              <span className="diff-view__marker">
                {l.type === 'removed' ? '-' : l.type === 'added' ? '+' : ' '}
              </span>
              <span
                className="diff-view__text"
                dangerouslySetInnerHTML={{ __html: escapeHtml(l.text) || '&nbsp;' }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
