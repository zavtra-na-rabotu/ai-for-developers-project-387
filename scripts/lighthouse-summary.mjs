import fs from 'node:fs';
import path from 'node:path';

const reportDir = process.argv[2] ?? 'lighthouse-report';
const manifestPath = path.join(reportDir, 'manifest.json');
const summaryPath = path.join(reportDir, 'summary.md');

fs.mkdirSync(reportDir, { recursive: true });

const thresholds = {
  performance: 0.9,
  accessibility: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
};

const categoryLabels = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
  pwa: 'PWA',
};

const ignoredAuditModes = new Set(['notApplicable', 'informative', 'manual']);

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function readJsonReport(entry) {
  if (!entry.jsonPath || !fs.existsSync(entry.jsonPath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(entry.jsonPath, 'utf8'));
}

function percent(score) {
  if (typeof score !== 'number') {
    return 'n/a';
  }

  return `${Math.round(score * 100)}%`;
}

function categoryStatus(key, score) {
  const threshold = thresholds[key] ?? 0.9;

  if (typeof score !== 'number') {
    return 'review';
  }

  return score >= threshold ? 'ok' : 'needs work';
}

function tableRows(entries) {
  if (entries.length === 0) {
    return ['| URL | Performance | Accessibility | Best Practices | SEO |', '| --- | --- | --- | --- | --- |'];
  }

  return [
    '| URL | Performance | Accessibility | Best Practices | SEO |',
    '| --- | --- | --- | --- | --- |',
    ...entries.map((entry) => {
      const summary = entry.summary ?? {};

      return [
        entry.url,
        formatCategory('performance', summary.performance),
        formatCategory('accessibility', summary.accessibility),
        formatCategory('best-practices', summary['best-practices']),
        formatCategory('seo', summary.seo),
      ].join(' | ').replace(/^/, '| ').replace(/$/, ' |');
    }),
  ];
}

function formatCategory(key, score) {
  return `${percent(score)} (${categoryStatus(key, score)})`;
}

function auditPriority(audit) {
  if (typeof audit.score === 'number') {
    return audit.score;
  }

  return 1;
}

function collectActionItems(entries) {
  const items = [];

  for (const entry of entries) {
    const report = readJsonReport(entry);
    if (!report?.categories || !report?.audits) {
      continue;
    }

    for (const [categoryKey, category] of Object.entries(report.categories)) {
      const threshold = thresholds[categoryKey];
      if (typeof threshold !== 'number' || category.score >= threshold) {
        continue;
      }

      const failedAudits = category.auditRefs
        .map((ref) => report.audits[ref.id])
        .filter((audit) => {
          if (!audit || ignoredAuditModes.has(audit.scoreDisplayMode)) {
            return false;
          }

          return typeof audit.score === 'number' && audit.score < 0.9;
        })
        .sort((left, right) => auditPriority(left) - auditPriority(right))
        .slice(0, 5);

      if (failedAudits.length === 0) {
        items.push(`- [ ] Review ${categoryLabels[categoryKey] ?? categoryKey} on ${entry.url}.`);
        continue;
      }

      for (const audit of failedAudits) {
        const display = audit.displayValue ? ` (${audit.displayValue})` : '';
        items.push(
          `- [ ] ${entry.url}: ${categoryLabels[categoryKey] ?? categoryKey} - ${audit.title}${display}.`,
        );
      }
    }
  }

  return items;
}

function buildSummary(entries) {
  const generatedAt = new Date().toISOString();
  const actionItems = collectActionItems(entries);

  return [
    '# Lighthouse morning report',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '## Reviewed pages',
    '',
    ...tableRows(entries),
    '',
    '## Fixes to consider',
    '',
    actionItems.length > 0
      ? actionItems.join('\n')
      : 'No Lighthouse fixes crossed the configured review thresholds.',
    '',
    '## Morning review',
    '',
    '- Open this workflow run summary first.',
    '- Download the Lighthouse artifact and open the HTML reports for details.',
    '- Record accepted work in `docs/lighthouse-action-items.md` or create focused issues.',
    '',
  ].join('\n');
}

const manifest = readManifest();
const representativeRuns = manifest
  .filter((entry) => entry.isRepresentativeRun !== false)
  .sort((left, right) => left.url.localeCompare(right.url));

fs.writeFileSync(summaryPath, buildSummary(representativeRuns));
