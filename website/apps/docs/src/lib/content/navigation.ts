type StaticHref = '/docs' | '/docs/product' | '/docs/schemas' | '/docs/roadmap';

export const primaryNav = [
	{ href: '/docs', label: 'Guide' },
	{ href: '/docs/product', label: 'Product' },
	{ href: '/docs/schemas', label: 'Schemas' }
] satisfies Array<{ href: StaticHref; label: string }>;
