// Welcome block template definitions.
// Each template has a heading, body, and a list of user-fillable variables.
// {clubName} is always available — resolved from club_settings.club_name.

export interface WelcomeTemplateVar {
  key:         string
  label:       string
  placeholder: string
}

export interface WelcomeTemplate {
  id:      string
  label:   string
  heading: string
  body:    string
  vars:    WelcomeTemplateVar[]
}

export const WELCOME_TEMPLATES: WelcomeTemplate[] = [
  {
    id:      'community',
    label:   'Welcoming & community-first',
    heading: '{clubName} — where photographers come together.',
    body:    "Whether you're just picking up a camera or have been shooting for decades, {clubName} is a welcoming home for photographers of all levels. We meet every {meetingDay} evening at {meetingLocation} for competitions, critiques, and the kind of conversations that only happen between people who love making images.\n\nNew members are always welcome.",
    vars: [
      { key: 'meetingDay',      label: 'Meeting day',      placeholder: 'Thursday'            },
      { key: 'meetingLocation', label: 'Meeting location', placeholder: 'the Community Centre' },
    ],
  },
  {
    id:      'achievement',
    label:   'Achievement & ambition',
    heading: '{clubName} — serious photography, friendly faces.',
    body:    "Founded in {foundedYear}, {clubName} has been bringing together passionate photographers in {location}. Our monthly competitions are judged by working professionals, and our members regularly place in regional and national exhibitions.\n\nIf you want to push your photography further, you're in the right place.",
    vars: [
      { key: 'foundedYear', label: 'Year founded', placeholder: '1987'            },
      { key: 'location',    label: 'Location',     placeholder: 'Portland, Oregon' },
    ],
  },
  {
    id:      'simple',
    label:   'Short & direct',
    heading: '{clubName}',
    body:    "A photography club based in {location}. Monthly competitions, regular meetings, and a community of people who love making images. Come along and see what we're about.",
    vars: [
      { key: 'location', label: 'Location', placeholder: 'San Francisco' },
    ],
  },
]

/** Resolve a template's heading and body, substituting {vars} with values. */
export function resolveTemplate(
  template: WelcomeTemplate,
  clubName: string,
  vars: Record<string, string>,
): { heading: string; body: string } {
  const all: Record<string, string> = { clubName, ...vars }
  const fill = (s: string) =>
    Object.entries(all).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v || `{${k}}`),
      s,
    )
  return { heading: fill(template.heading), body: fill(template.body) }
}
