import { describe, it, expect, beforeEach } from 'vitest';
import { SEOOptimizer } from './seoOptimizer';

const ldJsonNodes = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

describe('SEOOptimizer.injectStructuredData', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('removes prerendered JSON-LD so only the runtime block survives', () => {
    // Simulate the prerendered HTML shipping its own JSON-LD blocks.
    const prerendered = document.createElement('script');
    prerendered.type = 'application/ld+json';
    prerendered.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] });
    document.head.appendChild(prerendered);

    const prerenderedWebApp = document.createElement('script');
    prerenderedWebApp.type = 'application/ld+json';
    prerenderedWebApp.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication' });
    document.head.appendChild(prerenderedWebApp);

    expect(ldJsonNodes()).toHaveLength(2);

    const optimizer = new SEOOptimizer();
    optimizer.injectStructuredData([
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'q' }] }
    ]);

    const nodes = ldJsonNodes();
    expect(nodes).toHaveLength(1);

    const payload = JSON.parse(nodes[0].textContent || '{}');
    const types = JSON.stringify(payload).match(/"@type":"FAQPage"/g) || [];
    expect(types).toHaveLength(1);
  });

  it('replaces its own previous block on re-injection (no accumulation)', () => {
    const optimizer = new SEOOptimizer();
    optimizer.injectStructuredData([{ '@context': 'https://schema.org', '@type': 'WebSite' }]);
    optimizer.injectStructuredData([{ '@context': 'https://schema.org', '@type': 'WebSite' }]);
    optimizer.injectStructuredData([{ '@context': 'https://schema.org', '@type': 'WebSite' }]);

    expect(ldJsonNodes()).toHaveLength(1);
  });
});
