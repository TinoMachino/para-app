export const docsBase = '/docs';
export const aboutBase = '/about';

export const landingHeroMetrics = [
	{
		value: '-3 to +3',
		label: 'policy vote range'
	},
	{
		value: '#POLICY||',
		label: 'structured political flairs'
	},
	{
		value: '2nd layer',
		label: 'cross-network civic context'
	}
] as const;

export const landingHeroActions = [
	{
		eyebrow: 'About',
		title: 'Read the political thesis',
		copy: 'Understand why PARA exists, how democratic friction shapes the product, and why the site is organized around a second political layer.',
		href: aboutBase
	},
	{
		eyebrow: 'Try app',
		title: 'Open the current build',
		copy: 'Launch the live PARA experience, request a build link when needed, or use the local runbook when you want full control.',
		href: '/try-app'
	},
	{
		eyebrow: 'Schemas',
		title: 'Browse the schema reference',
		copy: 'Browse the `com.para.*` reference pages and see how the technical layer maps to the app surface.',
		href: `${docsBase}/schemas`
	}
] as const;

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
		title: 'From opinion to political impact',
		problem: 'Makes political positions visible, comparable, and easier to act on.',
		copy: 'PARA starts from a simple premise: democracy stays thin when public opinion is hard to express clearly and hard to turn into civic consequence.',
		points: [
			'Built around a more plural democratic future for Mexico, not a prettier political feed',
			'Designed to reduce the friction between thought, expression, and political consequence'
		],
		href: aboutBase,
		cta: 'Read the thesis'
	},
	{
		eyebrow: 'Second layer',
		title: 'A second layer across existing networks',
		problem: 'Lowers the cost of participation without asking users to abandon their audience.',
		copy: 'PARA can link identities, publish across networks, and carry political context wherever public discussion is already happening.',
		points: [
			'Cross-network publishing preserves reach while adding civic context',
			'Shared political tags make posts legible as political speech instead of generic content'
		],
		href: aboutBase,
		cta: 'Read the second-layer model'
	},
	{
		eyebrow: 'Flairs + voting',
		title: 'Policies and matters get their own format',
		problem: 'Turns generic posting into structured political input.',
		copy: 'PARA introduces #POLICY|| and #MATTER| so users can separate policy design from issue attention, then vote with both direction and intensity.',
		points: [
			'#POLICY||-2 captures both subject and degree of support or disagreement',
			'Policy voting becomes a live political dataset rather than a one-day ritual'
		],
		href: aboutBase,
		cta: 'Read the voting model'
	},
	{
		eyebrow: 'RAQ + communities',
		title: 'RAQ turns ideology into structured context',
		problem: 'Helps people locate themselves politically instead of posting into one undifferentiated crowd.',
		copy: 'The RAQ helps users question themselves, place themselves politically, and generate structured data that communities can organize around.',
		points: [
			'Intergroup antagonism becomes visible data for education, comparison, and agent behavior',
			'Communities can support debate, memes, coordination, and conflict without losing the data value'
		],
		href: aboutBase,
		cta: 'Read the RAQ model'
	},
	{
		eyebrow: 'AI + search',
		title: 'Agents and search are core utilities',
		problem: 'Makes the network useful for reading, comparison, moderation, and external tools.',
		copy: 'PARA is meant to power more than a feed. Search, clustering, classification, and generation turn civic data into usable product utilities.',
		points: [
			'The API can classify political content, highlight bias, and generate text',
			'Collective and individual agents can support education, writing, comparison, and entertainment'
		],
		href: aboutBase,
		cta: 'Read the agent model'
	},
	{
		eyebrow: 'Trust + infra',
		title: 'Trust needs real infrastructure',
		problem: 'Balances protected participation with public trust.',
		copy: 'PARA combines anonymity where freedom of thought needs protection with validation where civic participation needs grounding.',
		points: [
			'Geographic trends and opinion tooling can push parties toward greater coherence',
			'The main differentiated investment is anonymity technology with broader public-sector value'
		],
		href: aboutBase,
		cta: 'Read the trust model'
	}
] as const;

export const surfaceChecklist = [
	'A problem statement centered on democratic friction',
	'Second-layer publishing and cross-network political context',
	'#POLICY|| and #MATTER| flairs',
	'Policy voting from -3 to +3 with RAQ flows',
	'Belief-based communities and collective agents',
	'Anonymity, validation, and fair visibility',
	'Search, API services, and schema docs under `/docs`'
] as const;

export const architectureLayers = [
	{
		eyebrow: 'Product layer',
		title: 'Visible civic product surfaces',
		copy: 'The app exposes communities, participation routes, trust settings, and communication tools that should be legible before anyone opens the schema browser.'
	},
	{
		eyebrow: 'Protocol layer',
		title: 'watx contracts underneath',
		copy: 'Lexicons, records, xrpc methods, service boundaries, and repository semantics describe how those surfaces are stored and moved through the stack.'
	},
	{
		eyebrow: 'Reference layer',
		title: 'Docs that connect both views',
		copy: 'The public site should bridge product language and protocol language so the docs read like a coherent system rather than disconnected notes.'
	}
] as const;

export const architectureNotes = [
	'Policies and matters can be encoded as dedicated flairs, then voted on quantitatively instead of being reduced to generic posting.',
	'RAQ, intergroup antagonism, and community voting can build a political dataset that keeps personal and collective agents evolving.',
	'Bluesky-derived infrastructure keeps distribution costs lower while cryptographic anonymity and civic intelligence remain the main differentiated investments.'
] as const;

export const developerPromises = [
	'About and schema docs that explain the democratic-friction thesis, flairs, voting, RAQ, agents, and community governance',
	'One origin for the landing page, about page, roadmap, and /docs reference',
	'Technical docs for Bluesky-based civic infrastructure, classification APIs, search systems, and anonymity methods'
] as const;
