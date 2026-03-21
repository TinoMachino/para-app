import { getSchemaIndex } from '@parasocial/content-schema';

export function load() {
	return {
		schemas: getSchemaIndex()
	};
}
