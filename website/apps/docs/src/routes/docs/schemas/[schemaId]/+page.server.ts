import { error } from '@sveltejs/kit';
import { getSchemaDocument, getSchemaIndex } from '@parasocial/content-schema';

export function entries() {
	return getSchemaIndex().map((schema) => ({ schemaId: schema.id }));
}

export function load({ params }) {
	const schema = getSchemaDocument(params.schemaId);

	if (!schema) {
		error(404, `Unknown schema: ${params.schemaId}`);
	}

	return {
		schema
	};
}
