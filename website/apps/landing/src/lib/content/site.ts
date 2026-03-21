export const docsBase = '/docs';
export const aboutBase = '/about';
export const productTourHref = '/tour';

export const heroPrimaryAction = {
	label: 'Take the Product Tour',
	href: productTourHref
} as const;

export const heroSecondaryAction = {
	label: 'Read the Company',
	href: aboutBase
} as const;

export const landingSignals = [
	{
		value: '-3 to +3',
		label: 'policy voting range',
		copy: 'Policies can be voted across a full disagreement-to-support range, with quadratic voting layered on top.'
	},
	{
		value: '#POLICY||-2',
		label: 'policy + matter flairs',
		copy: 'Political expression is structured through dedicated #POLICY|| and #MATTER| tags, including vote intensity, instead of disappearing into generic posting.'
	},
	{
		value: '2nd layer',
		label: 'cross-network civic layer',
		copy: 'PARA is designed as a second-layer political social network that can sit on top of existing platforms while being built on FOSS Bluesky-style infrastructure.'
	}
] as const;

export const landingPillars = [
	{
		title: 'Insufficient democracy is a friction problem',
		copy: 'Most people can tell you what feels wrong in politics, but very little of that opinion becomes material. PARA starts from the idea that democracy fails when making yourself heard is too slow, too expensive, too opaque, or too socially risky.'
	},
	{
		title: 'Political identity should be more plural than party packages',
		copy: 'PARA began with political-compass memes and Democracy 4 because they make ideology legible. The product thesis is that people should be able to locate themselves, disagree selectively, and vote on policies without buying an entire partisan package.'
	},
	{
		title: 'Agents, anonymity, and civic infrastructure belong together',
		copy: 'Collective and individual agents, political search, AI-assisted writing, and anonymity tooling sit on top of Bluesky-derived infrastructure so the differentiated investment can go into cryptography, data, and political intelligence.'
	}
] as const;

export const landingFeatures = [
	{
		eyebrow: 'Problem',
		title: 'The real gap is between opinion and political impact',
		copy: 'PARA exists because insufficient democracy is usually a friction problem. People have opinions, anger, proposals, and local knowledge, but very little of that becomes visible, comparable, or materially useful inside representative politics.',
		points: [
			'The origin thesis is a more plural democratic future for Mexico, not just a prettier political feed',
			'The product focuses on reducing the friction between thought, expression, and political consequence'
		],
		href: aboutBase,
		cta: 'Read the company thesis'
	},
	{
		eyebrow: 'Second layer',
		title: 'A political network should sit across the networks people already use',
		copy: 'PARA does not need to replace the major social platforms to become useful. It can act as a second layer: link identities, publish across networks, and use its political tags as shared context wherever political discourse already happens.',
		points: [
			'Cross-network publishing lowers the cost of participating without throwing away existing audience and visibility',
			'Shared political tags make posts legible as civic speech instead of generic content'
		],
		href: aboutBase,
		cta: 'See why second layer matters'
	},
	{
		eyebrow: 'Flairs + voting',
		title: 'Policies and matters get their own format and their own vote',
		copy: 'PARA introduces #POLICY|| and #MATTER| so users can distinguish policy design from issue attention. Policies can be voted from -3 to +3, then weighted further through quadratic voting when intensity and tradeoffs matter.',
		points: [
			'#POLICY||-2 expresses both the subject and the degree of support or disagreement',
			'Direct policy voting becomes a live political dataset rather than a one-day electoral ritual'
		],
		href: aboutBase,
		cta: 'Read the voting model'
	},
	{
		eyebrow: 'RAQ + communities',
		title: 'RAQ and communities turn ideology into something users can locate and refine',
		copy: 'The RAQ, or Rightfully Asked Questions, helps users question themselves, place themselves politically, and generate structured data. Communities can then organize around beliefs, parties, or nonants instead of treating all politics as one undifferentiated crowd.',
		points: [
			'Intergroup antagonism becomes visible data that can improve education, comparison, and agent behavior',
			'The platform can support serious debate, memes, coordination, and even messy conflict without losing the data value'
		],
		href: aboutBase,
		cta: 'See the RAQ and community model'
	},
	{
		eyebrow: 'AI + search',
		title: 'Agents, search, classification, and generation are core utilities',
		copy: 'PARA is meant to power more than a feed. Embeddings, clustering, anomaly detection, search relevance, and political/non-political classification make the network useful for education, entertainment, moderation, and external AI services.',
		points: [
			'The API can classify political content in text and images, highlight bias, and generate text',
			'Collective and individual agents can help with education, writing, comparison, and entertainment'
		],
		href: aboutBase,
		cta: 'See the agent and API model'
	},
	{
		eyebrow: 'Trust + infra',
		title: 'Anonymity, validation, and geopolitical accountability need real infrastructure',
		copy: 'PARA aims to grant anonymity where freedom of thought needs protection, and user validation where public trust needs grounding. The economic advantage comes from building on existing Bluesky infrastructure while investing heavily in cryptographic methods, civic data, and political search.',
		points: [
			'Geographic political trends and public-opinion tooling can push parties toward coherence',
			'The main differentiated investment is anonymity technology that could also become public-sector IP'
		],
		href: aboutBase,
		cta: 'Read the infrastructure thesis'
	}
] as const;

export const developerPromises = [
	'About and schema docs that explain the democratic-friction thesis, flairs, voting, RAQ, agents, and community governance',
	'One origin for the landing page, about page, roadmap, and /docs reference',
	'Contract-facing docs for Bluesky-based civic infrastructure, classification APIs, search systems, and anonymity methods'
] as const;

export const architectureNotes = [
	'Policies and matters can be encoded as dedicated flairs, then voted on quantitatively instead of being reduced to generic posting.',
	'RAQ, intergroup antagonism, and community voting can build a political dataset that keeps personal and collective agents evolving.',
	'Bluesky-derived infrastructure keeps distribution costs lower while cryptographic anonymity and civic intelligence remain the main differentiated investments.'
] as const;
