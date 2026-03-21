import { getArchitectureNotes, getSchemaIndex } from '@parasocial/content-schema';
import { primaryNav } from '$lib/content/navigation';

export function load() {
	return {
		primaryNav,
		schemaIndex: getSchemaIndex(),
		architectureNotes: getArchitectureNotes()
	};
}
