import { SourceMapConsumer } from "source-map-js"
import { prisma } from "./db"

export type ResolvedFrame = {
  raw: string
  source: string | null
  line: number | null
  column: number | null
  name: string | null
  resolved: boolean
}

// frame regex: "at fnName (file.js:1:2345)" or "at file.js:1:2345"
const FRAME_RE = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/

function parseFilename(url: string): string {
  try {
    return new URL(url).pathname.split("/").pop() ?? url
  } catch {
    return url.split("/").pop() ?? url
  }
}

// Cache consumers in memory for the process lifetime
const cache = new Map<string, SourceMapConsumer>()

async function getConsumer(appId: string, release: string, filename: string): Promise<SourceMapConsumer | null> {
  const key = `${appId}:${release}:${filename}`
  if (cache.has(key)) return cache.get(key)!

  const row = await prisma.sourceMap.findUnique({
    where: { appId_release_filename: { appId, release, filename } },
    select: { content: true },
  })
  if (!row) return null

  const consumer = new SourceMapConsumer(row.content as string)
  cache.set(key, consumer)
  return consumer
}

export async function resolveStack(
  stack: string,
  appId: string,
  release: string,
): Promise<ResolvedFrame[]> {
  const lines = stack.split("\n").filter((l) => l.trim().startsWith("at "))
  const frames: ResolvedFrame[] = []

  for (const line of lines.slice(0, 10)) {
    const m = FRAME_RE.exec(line)
    if (!m) {
      frames.push({ raw: line.trim(), source: null, line: null, column: null, name: null, resolved: false })
      continue
    }

    const [, , fileUrl, lineStr, colStr] = m
    const filename = parseFilename(fileUrl!)
    const consumer = await getConsumer(appId, release, filename)

    if (!consumer) {
      frames.push({ raw: line.trim(), source: null, line: null, column: null, name: null, resolved: false })
      continue
    }

    const pos = consumer.originalPositionFor({
      line: parseInt(lineStr!, 10),
      column: parseInt(colStr!, 10),
    })

    frames.push({
      raw: line.trim(),
      source: pos.source,
      line: pos.line,
      column: pos.column,
      name: pos.name,
      resolved: pos.source != null,
    })
  }

  return frames
}
