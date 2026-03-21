import { describe, expect, it } from 'vitest';
import {
	architectureNotes,
	developerPromises,
	docsBase,
	landingFeatures,
	landingPillars
} from './site';

describe('site content contract', () => {
	it('points docs CTAs to the docs route', () => {
		expect(docsBase).toBe('/docs');
	});

	it('reflects PARA and watx themes', () => {
		expect(landingPillars).toHaveLength(3);
		expect(landingFeatures).toHaveLength(6);
		expect(architectureNotes[0]).toContain('flairs');
		expect(developerPromises[0]).toContain('RAQ');
	});
});
