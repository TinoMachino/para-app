/**
 * Mock data for PARA application screens
 * Extracted from screen files to improve maintainability and declutter components.
 */

import {
  type CabildeoPositionRecord,
  type CabildeoRecord,
} from '#/lib/api/para-lexicons'

export type PolicyItem = {
  id: string
  title: string
  vote: 'For' | 'Against'
  communityVote: 'For' | 'Against' | 'Split'
  status: 'Passed' | 'Pending' | 'Rejected'
}

export type CategoryData = {
  title: string
  items: string[]
  policies?: PolicyItem[]
}

export const VOTED_POLICIES: CategoryData[] = [
  {
    title: 'Public Services',
    items: ['Universal Healthcare', 'Education Reform'],
    policies: [
      {
        id: '1',
        title: 'Universal Healthcare v2',
        vote: 'For',
        communityVote: 'For',
        status: 'Passed',
      },
      {
        id: '2',
        title: 'Education Reform Bill',
        vote: 'For',
        communityVote: 'Against',
        status: 'Pending',
      },
      {
        id: '3',
        title: 'Public Transport Expansion',
        vote: 'Against',
        communityVote: 'Against',
        status: 'Rejected',
      },
    ],
  },
  {
    title: 'Security',
    items: ['Police Funding', 'Cybersecurity Act'],
    policies: [
      {
        id: '4',
        title: 'Police Funding Increase',
        vote: 'Against',
        communityVote: 'For',
        status: 'Passed',
      },
      {
        id: '5',
        title: 'Cybersecurity Act',
        vote: 'For',
        communityVote: 'For',
        status: 'Pending',
      },
    ],
  },
  {
    title: 'Economy',
    items: ['Tax Cuts', 'Small Business Grant'],
    policies: [
      {
        id: '6',
        title: 'Tax Cuts for SMEs',
        vote: 'For',
        communityVote: 'Split',
        status: 'Pending',
      },
    ],
  },
  {
    title: 'Environment',
    items: ['Carbon Tax', 'Plastic Ban'],
    policies: [
      {
        id: '7',
        title: 'Carbon Tax Implementation',
        vote: 'Against',
        communityVote: 'For',
        status: 'Passed',
      },
    ],
  },
]

export const MATTER_CATEGORIES = [
  {
    title: 'Public Services',
    items: ['#Demand for healthcare', '#Water industry', '#Stability'],
  },
  {
    title: 'Finance',
    items: ['#TaxExemptionOnCharity', '#AutomationTax'],
  },
  {
    title: 'Economy',
    items: [
      '#EnergyEfficiency',
      '#IndustrialAutomation',
      '#Telecommunications Industry',
    ],
  },
  {
    title: 'Social Issues',
    items: ['#Private Housing', '#Poverty', '#Equality'],
  },
]

export const COMMUNITY_DATA = [
  {
    name: 'PAN',
    members: '1.2M',
    desc: 'Centro-derecha, democracia cristiana',
    color: '#003087',
    category: 'Officials',
  },
  {
    name: 'Morena',
    members: '2.8M',
    desc: 'Izquierda nacionalista, soberanía',
    color: '#8B1538',
    category: 'Officials',
  },
  {
    name: 'PRI',
    members: '890k',
    desc: 'Centro, histórico institucional',
    color: '#00923F',
    category: 'Officials',
  },
  {
    name: 'MC',
    members: '456k',
    desc: 'Liberal progresista, ciudadanía',
    color: '#FF6B00',
    category: "9th's",
  },
  {
    name: 'PRD',
    members: '234k',
    desc: 'Izquierda democrática, social',
    color: '#FFD700',
    category: 'Affiliates',
  },
  {
    name: 'PVEM',
    members: '178k',
    desc: 'Ecologista, sustentabilidad',
    color: '#228B22',
    category: 'Affiliates',
  },
  {
    name: 'PT',
    members: '145k',
    desc: 'Izquierda laborista, trabajadores',
    color: '#DC143C',
    category: "25th's",
  },
  {
    name: 'Libertarios MX',
    members: '89k',
    desc: 'Liberalismo clásico, mercado libre',
    color: '#FF9500',
    category: "9th's",
  },
  {
    name: 'Centro Radical',
    members: '67k',
    desc: 'Centrismo pragmático, reformas',
    color: '#9B59B6',
    category: "25th's",
  },
]

export const VS_MOCK_COMPARISONS = [
  {
    id: 'c1',
    party: 'p/\nIzquierda\nAuth',
    partyColor: '#F5A9B8',
    votes: 123,
    avg: -2.4,
    against: 0.3,
    neutral: 1.2,
    score: -2.4,
    barValue: 0.2,
    approvalRate: 0.75,
    voterRate: 0.45,
    status: 'APPROVE',
    statusColor: '#474652',
    voterStatus: 'VOTER',
    trendApprove: '+5%',
    trendApproveColor: '#34C759',
    trendVoter: '▼-0.15%',
    trendVoterColor: '#FF3B30',
  },
  {
    id: 'c2',
    party: 'p/\nMC',
    partyColor: '#FAD7A0',
    votes: 171,
    avg: -2.4,
    against: 2.0,
    neutral: 1.2,
    score: 0.15,
    barValue: 0.6,
    approvalRate: 0.85,
    voterRate: 0.6,
    status: 'APPROVE',
    statusColor: '#474652',
    voterStatus: 'VOTER',
    trendApprove: '+5%',
    trendApproveColor: '#34C759',
    trendVoter: '-0.15%',
    trendVoterColor: '#FF3B30',
  },
  {
    id: 'c3',
    party: 'p/\nDerecha\nLibertaria',
    partyColor: '#F9E79F',
    votes: 143,
    avg: -2.4,
    against: 0.3,
    neutral: 1.2,
    score: 0.15,
    barValue: 0.4,
    approvalRate: 0.65,
    voterRate: 0.3,
    status: 'APPROVE',
    statusColor: '#474652',
    voterStatus: 'VOTER',
    trendApprove: '+5%',
    trendApproveColor: '#34C759',
    trendVoter: '-0.15%',
    trendVoterColor: '#FF3B30',
  },
  {
    id: 'c4',
    party: 'p/\nDerecha\nAutoritaria',
    partyColor: '#AED6F1',
    votes: 563,
    avg: -2.4,
    against: 0.6,
    neutral: 1.2,
    score: 0.15,
    barValue: 0.7,
    approvalRate: 0.9,
    voterRate: 0.8,
    status: 'APPROVE',
    statusColor: '#474652',
    voterStatus: 'VOTER',
    trendApprove: '+5%',
    trendApproveColor: '#34C759',
    trendVoter: '-0.15%',
  },
]

export const DISCOURSE_INDICATORS = [
  {
    label: 'Semantic Volatility',
    baseValue: 0.74,
    trendPlus: '+12%',
    trendMinus: '+4%',
    color: '#FF3B30',
    subValue: 'High Drift',
    description: 'How quickly the meaning of words is changing in the debate.',
  },
  {
    label: 'Lexical Diversity',
    baseValue: 84.2,
    color: '#34C759',
    subValue: 'Standard Zipf',
    description: 'Richness of vocabulary used by participants.',
  },
  {
    label: 'Polarization Delta',
    baseValue: 4.2,
    trend: '+0.5',
    color: '#FF9500',
    subValue: 'Bi-modal',
    description: 'The widening gap between opposing viewpoints.',
  },
  {
    label: 'Echo Chamber Index',
    baseValue: 0.62,
    trend: '+5%',
    color: '#007AFF',
    subValue: 'Critical',
    description: 'Likelihood of users only hearing agreeing views.',
  },
]

export const DISCOURSE_COMMUNITIES = [
  {
    name: '9ths',
    keywords: ['Transparency', 'Budget', 'Water'],
    color: '#003087',
  },
  {
    name: 'Official',
    keywords: ['Protocol', 'Infrastructure', 'Policy'],
    color: '#34C759',
  },
  {
    name: 'Critics',
    keywords: ['Inflation', 'Red tape', 'Waste'],
    color: '#FF3B30',
  },
]

export const DISCOURSE_FLUX_TAGS = [
  'Fiscal Prudence',
  'Digital Sovereignty',
  'Urban Resilience',
  'Recursive Equity',
  'Heuristic Governance',
]

export const CATEGORIES = [
  'All',
  'Safety',
  'Economy',
  'Health',
  'Edu',
  'Environment',
  'Rights',
  'Infra',
]

// ─── Cabildeo Mock Data ──────────────────────────────────────────────────────

export const MOCK_CABILDEOS: CabildeoRecord[] = [
  {
    title:
      '¿Debe Jalisco priorizar la desalinización sobre la conservación de acuíferos?',
    description:
      'El Lago de Chapala ha bajado 2m en los últimos 3 años. Hay dos propuestas principales.',
    createdAt: '2026-03-15T14:00:00Z',
    author: 'did:plc:jalisco-user-1',
    community: 'p/Jalisco',
    communities: ['p/CDMX', 'p/NuevoLeon'],
    flairs: ['policy_water_management', 'matter_water_scarcity'],
    region: 'Jalisco',
    options: [
      {
        label: 'Desalinización',
        description:
          'Construir 2 plantas desalinizadoras en la costa del Pacífico.',
      },
      {
        label: 'Conservación de Acuíferos',
        description: 'Regulación estricta + restauración de humedales.',
      },
      {
        label: 'Modelo Híbrido',
        description: 'Planta piloto + moratoria inmediata de nuevos pozos.',
      },
    ],
    phase: 'voting',
    phaseDeadline: '2026-03-20T00:00:00Z',
    userContext: {
      hasDelegatedTo: 'did:plc:delegado-1',
      delegateVoteEvent: {
        optionIndex: 2,
        votedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
    },
  },
  {
    title:
      '¿Reformar el transporte público de la CDMX con sistema BRT o ampliar el Metro?',
    description:
      'La saturación del transporte público en CDMX requiere acción inmediata. Dos modelos compiten.',
    createdAt: '2026-03-10T10:00:00Z',
    author: 'did:plc:cdmx-user-1',
    community: 'p/CDMX',
    flairs: ['policy_public_transit'],
    region: 'CDMX',
    geoRestricted: true,
    options: [
      {
        label: 'Sistema BRT',
        description: 'Red de Metrobús extendida a 12 nuevas líneas.',
      },
      {
        label: 'Ampliación Metro',
        description: 'Líneas 13 y 14 del Metro subterráneo.',
      },
    ],
    phase: 'deliberating',
    phaseDeadline: '2026-03-18T00:00:00Z',
  },
  {
    title:
      '¿Debe Oaxaca prohibir la minería a cielo abierto en territorios indígenas?',
    description:
      'Comunidades indígenas exigen protección territorial. Empresas mineras argumentan desarrollo económico.',
    createdAt: '2026-02-28T08:00:00Z',
    author: 'did:plc:oaxaca-user-1',
    community: 'p/Oaxaca',
    communities: ['p/Chiapas', 'p/Guerrero'],
    flairs: ['matter_indigenous_rights', 'policy_mining_regulation'],
    region: 'Oaxaca',
    options: [
      {
        label: 'Prohibición total',
        description: 'Cero minería en territorios reconocidos.',
      },
      {
        label: 'Regulación con consulta',
        description: 'Minería solo con consentimiento comunitario.',
      },
      {
        label: 'Moratoria temporal',
        description: 'Pausa de 5 años para evaluar impacto ambiental.',
      },
    ],
    phase: 'resolved',
    outcome: {
      winningOption: 1,
      totalParticipants: 1247,
      directVoters: 982,
      delegatedVoters: 265,
      effectiveTotalPower: 1098.3,
      breakdown: [
        {optionIndex: 0, label: 'Prohibición total', effectiveVotes: 312.1},
        {
          optionIndex: 1,
          label: 'Regulación con consulta',
          effectiveVotes: 498.7,
        },
        {optionIndex: 2, label: 'Moratoria temporal', effectiveVotes: 287.5},
      ],
      communityBreakdown: [
        {community: 'p/Oaxaca', dominantOption: 0, participation: '89%'},
        {community: 'p/Chiapas', dominantOption: 1, participation: '62%'},
        {community: 'p/Guerrero', dominantOption: 1, participation: '41%'},
      ],
    },
  },
]

export const MOCK_CABILDEO_POSITIONS: CabildeoPositionRecord[] = [
  {
    cabildeo: 'at://did:plc:jalisco-user-1/com.para.civic.cabildeo/1',
    stance: 'for',
    optionIndex: 0,
    text: 'La conservación lleva décadas fallando. Chapala sigue bajando. Necesitamos una solución que no dependa de lluvias que ya no llegan.',
    createdAt: '2026-03-16T09:30:00Z',
    compassQuadrant: 'lib-left',
    constructivenessScore: 0.82,
  },
  {
    cabildeo: 'at://did:plc:jalisco-user-1/com.para.civic.cabildeo/1',
    stance: 'against',
    optionIndex: 0,
    text: 'La desalinización tiene un costo energético enorme. Es más práctico restaurar los ecosistemas existentes.',
    createdAt: '2026-03-16T10:15:00Z',
    compassQuadrant: 'auth-left',
    constructivenessScore: 0.88,
  },
  {
    cabildeo: 'at://did:plc:jalisco-user-1/com.para.civic.cabildeo/1',
    stance: 'amendment',
    optionIndex: 2,
    text: 'El modelo híbrido debería incluir un fondo comunitario para que los ejidos afectados tengan compensación directa.',
    createdAt: '2026-03-16T11:15:00Z',
    compassQuadrant: 'center',
    constructivenessScore: 0.95,
  },
  {
    cabildeo: 'at://did:plc:jalisco-user-1/com.para.civic.cabildeo/1',
    stance: 'for',
    optionIndex: 2,
    text: 'No necesitamos todo o nada. Un piloto nos dará datos reales para decidir mejor.',
    createdAt: '2026-03-16T14:00:00Z',
    compassQuadrant: 'lib-center',
    constructivenessScore: 0.75,
  },
  {
    cabildeo: 'at://did:plc:jalisco-user-1/com.para.civic.cabildeo/1',
    stance: 'against',
    optionIndex: 0,
    text: 'Eso es una estupidez monumental de los políticos que solo quieren robar presupuesto.',
    createdAt: '2026-03-16T15:00:00Z',
    compassQuadrant: 'auth-right',
    constructivenessScore: 0.15,
  },
]
