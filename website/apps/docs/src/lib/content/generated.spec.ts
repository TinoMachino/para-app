import { describe, expect, it } from 'vitest';
import {
	getArchitectureNotes,
	getPlanMilestones,
	getSchemaDocument,
	getSchemaIndex
} from '@parasocial/content-schema';
import { primaryNav } from './navigation';

describe('generated docs content', () => {
	it('exposes at least one schema and one roadmap note', () => {
		expect(getSchemaIndex().length).toBeGreaterThan(0);
		expect(getPlanMilestones().length).toBeGreaterThan(0);
		expect(getArchitectureNotes().length).toBeGreaterThan(0);
	});

	it('resolves a published schema document by id', () => {
		const firstSchema = getSchemaIndex()[0];
		expect(firstSchema).toBeDefined();
		if (!firstSchema) {
			return;
		}

		const document = getSchemaDocument(firstSchema.id);

		expect(document?.id).toBe(firstSchema.id);
		expect(document?.fields.length).toBeGreaterThan(0);
	});

	it('does not expose a standalone germ page in navigation', () => {
		expect(primaryNav.find((item) => item.href.includes('germ'))).toBeUndefined();
	});
});
