import { describe, expect, it } from 'vitest';
import {
	architectureNotes,
	developerPromises,
	docsBase,
	heroPrimaryAction,
	heroSecondaryAction,
	landingFeatures,
	landingPillars
} from './site';

describe('landing content contract', () => {
	it('keeps docs CTAs pointed at the docs surface', () => {
		expect(docsBase).toBe('/docs');
		expect(heroSecondaryAction).toEqual({
			label: 'Read the Company',
			href: '/about'
		});
	});

	it('gives the landing page a real primary action', () => {
		expect(heroPrimaryAction).toEqual({
			label: 'Take the Product Tour',
			href: '/tour'
		});
	});

	it('describes the current PARA product shape', () => {
		expect(landingPillars).toHaveLength(3);
		expect(landingFeatures).toHaveLength(6);
		expect(architectureNotes[0]).toContain('flairs');
		expect(developerPromises[0]).toContain('RAQ');
	});
});
