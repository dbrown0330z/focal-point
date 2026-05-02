// Competition configuration types — stored as JSONB in competition_templates.config
// and competitions.config.

export type CompetitionType          = 'digital' | 'print'
export type JudgingPreset            = 'simple-scored' | 'salon' | 'awards-only' | 'member-vote' | 'end-of-year'
export type ScoreAggregation         = 'average' | 'sum' | 'drop-high-low'
export type AwardAllocation          = 'fixed' | 'percentage' | 'discretion'
export type AwardDecisionMethod      = 'majority' | 'consensus' | 'lead-judge'
export type AwardMode                = 'auto' | 'manual' | 'hybrid'
export type AwardType                = 'discretionary' | 'score-based'
export type PointsBasis              = 'score' | 'award' | 'custom'
export type CustomMappingType        = 'score-range' | 'placement'
export type JudgePermission          = 'score-only' | 'score-comments' | 'full'
export type ResultsVisibility        = 'members' | 'public' | 'hidden'
export type Eligibility              = 'all' | 'novice' | 'advanced' | 'custom'
export type AcceptanceMethod         = 'score-threshold' | 'percentage' | 'panel-vote'
export type AcceptanceRule           = 'majority' | 'unanimous' | 'any'
export type JudgeCommentsSetting     = 'none' | 'optional' | 'required'
export type VotingMethod             = 'star-rating' | 'single-pick' | 'top-3' | 'approval'
export type VoterEligibility         = 'active-members' | 'all-members'
export type TieHandling              = 'show-tied' | 'reopen-voting' | 'admin-decides'
export type ScoreVisibilityToMembers = 'after-publish' | 'after-judging' | 'never'
export type ScoreVisibilityToJudges  = 'own-only' | 'all' | 'none'
export type EoyQualificationSource   = 'top-scores' | 'award-winners' | 'both'
export type ImageReusePolicy         = 'once-per-type' | 'once-per-season' | 'once-ever' | 'unrestricted'
export type ImageLongEdgePreset      = '1920' | '1400' | '3840' | 'custom'

export interface ScoreRangeBand {
  id: string
  minScore: number
  maxScore: number
  points: number
}

export interface PlacementMapping {
  id: string
  placement: number
  points: number
}

export interface ClassificationBand {
  id: string
  label: string
  minScore: number
  color?: string
}

export interface AwardTier {
  id: string
  label: string
  fixedCount?: number
  percentage?: number
  points?: number
  minScore?: number
}

// ─── Recognition types (step 4 / Club Defaults API) ──────────────────────────

export interface RecognitionAward {
  id:               string
  name:             string
  description?:     string
  visualIndicator?: string    // e.g. "Gold ribbon"
  contributesToPOY: boolean
  pointsValue?:     number    // undefined = no points assigned
  isOneOff?:        boolean   // true = scoped to this competition only
}

export interface BenchmarkConfig {
  configured:         boolean
  bands?:             string[]    // e.g. ["Accepted", "Commended", "Highly commended"]
  rankQualification?: string      // e.g. "3 × Highly commended = qualifies for next rank"
}

export interface POYConfig {
  configured:              boolean
  season?:                 string    // e.g. "2024–2025"
  categoriesFactor?:       boolean
  separatePerCategory?:    boolean
  branchACounting?:        'all' | 'top_n' | 'exclude_lowest'
  branchATopN?:            number
  branchAExcludeN?:        number
  b1Counting?:             'all' | 'top_n' | 'exclude_lowest'
  b1TopN?:                 number
  b1ExcludeN?:             number
  b2Counting?:             'top_n' | 'exclude_lowest'
  b2TopN?:                 number
  b2ExcludeN?:             number
}

export interface RecognitionDefaults {
  awards:    RecognitionAward[]
  benchmark: BenchmarkConfig
  poy:       POYConfig
}

// ─── Structural config (steps 1–5, saveable as template) ─────────────────────

export interface CompetitionConfig {
  // Step 0 — Competition type
  competitionType:                CompetitionType

  // Step 1 — Basics
  name:                           string

  // Step 2 — Categories & entries
  categories:                     string[]
  maxEntriesPerMember:            number
  maxEntriesPerCategory?:         number
  imageLongEdgePreset:            ImageLongEdgePreset
  imageLongEdgeCustom?:           number
  imageFileSizeMaxMB?:            number
  imageAcceptedFormat?:           string    // e.g. 'JPEG'
  imageColorSpace?:               string    // e.g. 'sRGB'
  requireCaptureDate:             boolean
  captureDateAmount:              number
  captureDateUnit:                'years' | 'months'
  imageReusePolicy:               ImageReusePolicy
  allowWithdrawals:               boolean

  // Step 3 — Judging & scoring
  judgingPreset:                  JudgingPreset
  numberOfJudges:                 number
  customised:                     boolean
  // Scored
  scoreMin:                       number
  scoreMax:                       number
  allowDecimals:                  boolean
  scoreAggregation:               ScoreAggregation
  minimumScoreToPublish:          boolean
  minimumScoreToPublishValue:     number
  // Salon
  acceptanceMethod:               AcceptanceMethod
  acceptanceThreshold:            number
  acceptTopPercentage:            number
  acceptanceRule:                 AcceptanceRule
  // Awards-only
  judgeInstructions:              string
  awardDecisionMethod:            AwardDecisionMethod
  // Member vote
  votingMethod:                   VotingMethod
  voterEligibility:               VoterEligibility
  selfVoteBlocked:                boolean
  showVoteCountsDuringVoting:     boolean
  minimumVotesRequired:           number
  tieHandling:                    TieHandling
  // Judge experience
  blindHideName:                  boolean
  blindHideMetadata:              boolean
  judgeComments:                  JudgeCommentsSetting
  minCommentLength:               number
  viewOtherJudgesScores:          boolean
  // Score visibility
  scoreVisibilityToMembers:       ScoreVisibilityToMembers
  scoreVisibilityToJudges:        ScoreVisibilityToJudges
  // Results
  resultsVisibility:              ResultsVisibility

  // Step 4 — Awards & recognition
  awardsStepMode:                 'default' | 'override'
  benchmarkEnabled:               boolean
  benchmarkOverridden:            boolean
  awardsEnabled:                  boolean
  awardType:                      AwardType
  awardTiers:                     AwardTier[]
  oneOffAwards:                   RecognitionAward[]
  classificationBands:            ClassificationBand[]
  awardAllocation:                AwardAllocation
  awardMode:                      AwardMode
  seasonPointsEnabled:            boolean
  pointsBasis:                    PointsBasis
  customMappingType:              CustomMappingType
  scoreRangeBands:                ScoreRangeBand[]
  placementMappings:              PlacementMapping[]
  poyScoreCounting:               'all' | 'top_n' | 'exclude_lowest'
  poyTopN:                        number
  poyExcludeN:                    number
  countTowardPOY:                 boolean
  competitionWeight:              number
  acceptedImagePoints:            number
  peoplesChoiceEnabled:           boolean
  peoplesChoiceLabel:             string
  peoplesChoiceVotingMethod:      VotingMethod
  peoplesChoiceVoterEligibility:  VoterEligibility
  peoplesChoiceHideNames:         boolean

  // End of year
  eoyQualificationSource:         EoyQualificationSource
  eoyImagesPerMember:             number

  // Legacy / misc
  eligibility:                    Eligibility
  selectedClasses:                string[]
  judgeSeparateClasses:           boolean
  separateResultsByClass:         boolean
  separateAwardsPerClass:         boolean
  seasonPointsPerClass:           boolean
  judgeSeparateCategories:        boolean
  showIndividualScores:           boolean
  globalJudgePermission:          JudgePermission
}

// ─── Instance data (step 6, never saved to template) ─────────────────────────

export type ResultsRevealMode = 'meeting' | 'auto-publish'
export type PublishTiming     = 'event-start' | 'specific-time' | 'manual'
export type EventLocationMode = 'in-person' | 'online' | 'not-confirmed'
export type PublicVisibility  = 'public-same-time' | 'members-first' | 'members-only'

export interface CompetitionSchedule {
  instanceName:          string
  calendarTitle:         string    // optional alternate name shown on calendar only

  // Submission window (dates only; open at midnight, close end-of-day)
  submissionsOpenDate:   string
  submissionsCloseDate:  string

  // Judging window (dates only; internal, not shown to members)
  judgingOpenDate:       string
  judgingCloseDate:      string

  // Judge assignment
  judgeIds:              string[]
  judgeInstructions:     string
  judgeOneOff: {
    firstName:       string
    lastName:        string
    email:           string
    saveToDirectory: boolean
  } | null

  // Results reveal — two paths
  resultsRevealMode:     ResultsRevealMode

  // Path A — Meeting / event
  eventName:             string
  eventDate:             string
  eventTime:             string
  eventLocationMode:     EventLocationMode
  eventLocationVenue:    string
  publishTiming:         PublishTiming
  publishSpecificDate:   string
  publishSpecificTime:   string

  // Path B — Auto-publish
  publishAutoDate:       string
  publishAutoTime:       string

  // Layer 3 — Public visibility
  publicVisibility:           PublicVisibility
  publicVisibilityDelayHours: number
}

export const defaultSchedule: CompetitionSchedule = {
  instanceName:               '',
  calendarTitle:              '',
  submissionsOpenDate:        '',
  submissionsCloseDate:       '',
  judgingOpenDate:            '',
  judgingCloseDate:           '',
  judgeIds:                   [],
  judgeInstructions:          '',
  judgeOneOff:                null,
  resultsRevealMode:          'meeting',
  eventName:                  '',
  eventDate:                  '',
  eventTime:                  '19:00',
  eventLocationMode:          'in-person',
  eventLocationVenue:         '',
  publishTiming:              'event-start',
  publishSpecificDate:        '',
  publishSpecificTime:        '21:00',
  publishAutoDate:            '',
  publishAutoTime:            '20:00',
  publicVisibility:           'members-only',
  publicVisibilityDelayHours: 24,
}

export const defaultConfig: CompetitionConfig = {
  competitionType:               'digital',
  name:                          '',
  categories:                    ['Open', 'Nature', 'Monochrome'],
  maxEntriesPerMember:           3,
  maxEntriesPerCategory:         1,
  imageLongEdgePreset:           '1920',
  imageLongEdgeCustom:           undefined,
  imageFileSizeMaxMB:            undefined,
  imageAcceptedFormat:           'JPEG',
  imageColorSpace:               'sRGB',
  requireCaptureDate:            false,
  captureDateAmount:             2,
  captureDateUnit:               'years',
  imageReusePolicy:              'once-per-type',
  allowWithdrawals:              true,
  judgingPreset:                 'simple-scored',
  numberOfJudges:                1,
  customised:                    false,
  scoreMin:                      1,
  scoreMax:                      10,
  allowDecimals:                 true,
  scoreAggregation:              'sum',
  minimumScoreToPublish:         false,
  minimumScoreToPublishValue:    0,
  acceptanceMethod:              'score-threshold',
  acceptanceThreshold:           3,
  acceptTopPercentage:           30,
  acceptanceRule:                'majority',
  judgeInstructions:             '',
  awardDecisionMethod:           'lead-judge',
  votingMethod:                  'star-rating',
  voterEligibility:              'active-members',
  selfVoteBlocked:               true,
  showVoteCountsDuringVoting:    false,
  minimumVotesRequired:          3,
  tieHandling:                   'show-tied',
  blindHideName:                 true,
  blindHideMetadata:             false,
  judgeComments:                 'none',
  minCommentLength:              20,
  viewOtherJudgesScores:         false,
  scoreVisibilityToMembers:      'after-publish',
  scoreVisibilityToJudges:       'own-only',
  resultsVisibility:             'members',
  awardsStepMode:                'default',
  benchmarkEnabled:              true,
  benchmarkOverridden:           false,
  awardsEnabled:                 false,
  awardType:                     'discretionary',
  awardTiers: [
    { id: '1', label: 'First place',  fixedCount: 1, percentage: 5,  points: 10, minScore: 27 },
    { id: '2', label: 'Second place', fixedCount: 2, percentage: 10, points: 7,  minScore: 23 },
    { id: '3', label: 'Third place',  fixedCount: 3, percentage: 15, points: 5,  minScore: 18 },
    { id: '4', label: 'Best in show', fixedCount: 1, percentage: 5,  points: 15, minScore: 29 },
  ],
  oneOffAwards:                  [],
  classificationBands: [
    { id: '1', label: 'Excellence',       minScore: 9.5, color: '#5B82A6' },
    { id: '2', label: 'Highly Commended', minScore: 8.5, color: '#3D8A9A' },
    { id: '3', label: 'Commended',        minScore: 7.0, color: '#4A7A52' },
  ],
  awardAllocation:               'fixed',
  awardMode:                     'auto',
  seasonPointsEnabled:           false,
  pointsBasis:                   'score',
  customMappingType:             'score-range',
  scoreRangeBands: [
    { id: '1', minScore: 9,   maxScore: 10,  points: 10 },
    { id: '2', minScore: 7.5, maxScore: 8.9, points: 7  },
    { id: '3', minScore: 6,   maxScore: 7.4, points: 5  },
    { id: '4', minScore: 4,   maxScore: 5.9, points: 3  },
    { id: '5', minScore: 1,   maxScore: 3.9, points: 1  },
  ],
  placementMappings: [
    { id: '1', placement: 1, points: 10 },
    { id: '2', placement: 2, points: 7  },
    { id: '3', placement: 3, points: 5  },
    { id: '4', placement: 4, points: 3  },
    { id: '5', placement: 5, points: 2  },
  ],
  acceptedImagePoints:           1,
  poyScoreCounting:              'all',
  poyTopN:                       3,
  poyExcludeN:                   3,
  countTowardPOY:                true,
  competitionWeight:             1.0,
  peoplesChoiceEnabled:          false,
  peoplesChoiceLabel:            "People's Choice",
  peoplesChoiceVotingMethod:     'star-rating',
  peoplesChoiceVoterEligibility: 'active-members',
  peoplesChoiceHideNames:        true,
  eligibility:                   'all',
  selectedClasses:               [],
  judgeSeparateClasses:          false,
  separateResultsByClass:        false,
  separateAwardsPerClass:        false,
  seasonPointsPerClass:          false,
  judgeSeparateCategories:       true,
  showIndividualScores:          false,
  globalJudgePermission:         'score-comments',
  eoyQualificationSource:        'top-scores',
  eoyImagesPerMember:            3,
}

export const PRESET_DEFAULTS: Record<JudgingPreset, Partial<CompetitionConfig>> = {
  'simple-scored': {
    scoreMin: 1, scoreMax: 10, allowDecimals: true,
    scoreAggregation: 'sum', minimumScoreToPublish: false, minimumScoreToPublishValue: 0,
    scoreVisibilityToJudges: 'own-only',
  },
  'salon': {
    acceptanceMethod: 'score-threshold', acceptanceThreshold: 3,
    acceptTopPercentage: 30, acceptanceRule: 'majority', scoreMin: 1, scoreMax: 5,
  },
  'awards-only': { judgeInstructions: '' },
  'member-vote': {
    votingMethod: 'star-rating', voterEligibility: 'active-members',
    selfVoteBlocked: true, showVoteCountsDuringVoting: false,
    minimumVotesRequired: 3, tieHandling: 'show-tied',
  },
  'end-of-year': {},
}

export const CLUB_DEFAULTS = {
  defaultCategories:               ['Open', 'Nature', 'Monochrome'],
  defaultMaxEntriesPerMember:      3,
  defaultMaxEntriesPerCategory:    1,
  defaultImageLongEdgePreset:      '1920' as ImageLongEdgePreset,
  defaultImageFileSizeMaxMB:       undefined as number | undefined,
  defaultImageAcceptedFormat:      'JPEG',
  defaultImageColorSpace:          'sRGB',
  defaultRequireCaptureDate:       false,
  defaultCaptureDateAmount:        2,
  defaultCaptureDateUnit:          'years' as 'years' | 'months',
  defaultImageReusePolicy:         'once-per-type' as ImageReusePolicy,
  defaultAllowWithdrawals:         true,
  defaultScoreMin:                 1,
  defaultScoreMax:                 10,
  defaultAllowDecimals:            true,
  defaultScoreAggregation:         'sum' as ScoreAggregation,
  defaultMinimumScoreToPublish:    false,
  defaultMinimumScoreToPublishValue: 0,
  defaultBlindHideName:            true,
  defaultRequireComments:          false,
  defaultJudgeComments:            'none' as JudgeCommentsSetting,
  defaultMinCommentLength:         20,
  defaultBlindHideMetadata:        false,
  defaultScoreVisibilityToMembers: 'after-publish' as ScoreVisibilityToMembers,
  defaultScoreVisibilityToJudges:  'own-only' as ScoreVisibilityToJudges,
  defaultResultsVisibility:        'members' as ResultsVisibility,
  defaultAwardTiers: [
    { id: '1', label: 'First place',  fixedCount: 1, percentage: 5,  points: 10, minScore: 27 },
    { id: '2', label: 'Second place', fixedCount: 2, percentage: 10, points: 7,  minScore: 23 },
    { id: '3', label: 'Third place',  fixedCount: 3, percentage: 15, points: 5,  minScore: 18 },
    { id: '4', label: 'Best in show', fixedCount: 1, percentage: 5,  points: 15, minScore: 29 },
  ] as AwardTier[],
  defaultBenchmarkEnabled:         true,
  defaultAwardsEnabled:            false,
  defaultCountTowardPOY:           true,
  recognitionDefaults: {
    awards: [
      { id: 'lib-1', name: 'First place',  visualIndicator: 'Gold ribbon',   contributesToPOY: true,  pointsValue: 3 },
      { id: 'lib-2', name: 'Second place', visualIndicator: 'Silver ribbon', contributesToPOY: true,  pointsValue: 2 },
      { id: 'lib-3', name: 'Third place',  visualIndicator: 'Bronze ribbon', contributesToPOY: true,  pointsValue: 1 },
      { id: 'lib-4', name: 'Best in Show', description: 'Special recognition', contributesToPOY: false },
    ] as RecognitionAward[],
    benchmark: {
      configured:        true,
      bands:             [
        'Accepted — below all thresholds',
        'Commended — 7.0 or above',
        'Highly Commended — 8.5 or above',
        'Excellence — 9.5 or above',
      ],
      rankQualification: '3 × Highly Commended = qualifies for next band',
    } as BenchmarkConfig,
    poy: {
      configured:           true,
      season:               '2024–2025',
      categoriesFactor:     false,
      separatePerCategory:  false,
      branchACounting:      'all',
      branchATopN:          5,
      branchAExcludeN:      1,
      b1Counting:           'top_n',
      b1TopN:               3,
      b1ExcludeN:           1,
      b2Counting:           'top_n',
      b2TopN:               4,
      b2ExcludeN:           1,
    } as POYConfig,
  },
}

export const PRESET_CATEGORIES = [
  'Open', 'Nature', 'Monochrome', 'Landscape', 'Portrait', 'Street',
  'Macro', 'Architecture', 'Wildlife', 'Abstract', 'Travel', 'Still Life',
  'Documentary', 'Creative / Altered Reality', 'Sport',
]
