import fs   from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type HelpArticle = {
  slug:        string[]   // e.g. ['member', 'getting-started']
  title:       string
  description: string
  section:     string
  order:       number
  content:     string
}

export type HelpSection = {
  key:      string
  label:    string
  articles: HelpArticle[]
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'help')

function slugify(filename: string) {
  return filename.replace(/\.mdx?$/, '').replace(/^\d+-/, '')
}

export function getAllArticles(): HelpArticle[] {
  const articles: HelpArticle[] = []

  if (!fs.existsSync(CONTENT_DIR)) return articles

  const sections = fs.readdirSync(CONTENT_DIR).filter(
    d => fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  )

  for (const section of sections) {
    const sectionDir = path.join(CONTENT_DIR, section)
    const files = fs.readdirSync(sectionDir)
      .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
      .sort()

    for (const file of files) {
      const raw  = fs.readFileSync(path.join(sectionDir, file), 'utf8')
      const { data, content } = matter(raw)
      articles.push({
        slug:        [section, slugify(file)],
        title:       data.title       ?? file,
        description: data.description ?? '',
        section:     data.section     ?? section,
        order:       data.order       ?? 99,
        content,
      })
    }
  }

  return articles
}

export function getArticle(slugParts: string[]): HelpArticle | null {
  const all = getAllArticles()
  return all.find(a => a.slug.join('/') === slugParts.join('/')) ?? null
}

export function getSections(): HelpSection[] {
  const all    = getAllArticles()
  const map    = new Map<string, HelpArticle[]>()
  const labels: Record<string, string> = { member: 'Member guide', admin: 'Admin guide' }

  for (const a of all) {
    const sec = a.slug[0]
    if (!map.has(sec)) map.set(sec, [])
    map.get(sec)!.push(a)
  }

  return Array.from(map.entries()).map(([key, arts]) => ({
    key,
    label:    labels[key] ?? key,
    articles: arts.sort((a, b) => a.order - b.order),
  }))
}
