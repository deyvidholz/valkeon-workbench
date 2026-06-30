import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Board, BoardCard } from '../src/shared/persistence/types'
import { RepoFileBoardStore } from '../src/main/persistence/repoFileBoardStore'
import { LocalBoardStore } from '../src/main/persistence/localBoardStore'
import { parseCardFile, serializeCard } from '../src/main/persistence/frontmatter'
import { orderBetween, orderSequence } from '../src/main/persistence/fracIndex'

let passed = 0
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve(fn()).then(() => {
    passed += 1
    console.log(`  ✓ ${name}`)
  })
}

const card = (over: Partial<BoardCard> & Pick<BoardCard, 'id' | 'code' | 'order'>): BoardCard => ({
  column: 'backlog',
  title: 'Untitled',
  body: '',
  labels: [],
  link: { branch: null, worktree: null },
  attachments: [],
  ...over
})

async function main(): Promise<void> {
  const repo = await mkdtemp(join(tmpdir(), 'valkeon-repo-'))
  const localFile = join(await mkdtemp(join(tmpdir(), 'valkeon-local-')), 'board.json')

  console.log('frontmatter')
  await check('round-trips title, body (with mermaid), labels, link, order', () => {
    const c = card({
      id: 'c21',
      code: 21,
      order: 'a3',
      column: 'in-progress',
      title: 'Add SSO with Google and Okta',
      body: 'Some **bold** text.\n\n```mermaid\ngraph TD; A-->B;\n```',
      labels: ['auth', 'ai'],
      link: { branch: 'feat/sso', worktree: '../acme.wt/sso' }
    })
    const parsed = parseCardFile('c21', serializeCard(c))
    assert.equal(parsed.id, 'c21')
    assert.equal(parsed.title, c.title)
    assert.equal(parsed.body, c.body)
    assert.deepEqual(parsed.labels, c.labels)
    assert.deepEqual(parsed.link, c.link)
    assert.equal(parsed.column, 'in-progress')
    assert.equal(parsed.order, 'a3')
    assert.equal(parsed.code, 21)
  })

  await check('survives CRLF line endings (no data loss) and keeps the id', () => {
    const c = card({
      id: 'c7',
      code: 7,
      order: 'a1',
      column: 'todo',
      title: 'Title',
      body: 'Body line',
      labels: ['x'],
      link: { branch: 'b', worktree: null }
    })
    const crlf = serializeCard(c).replace(/\n/g, '\r\n')
    const parsed = parseCardFile('fallback', crlf)
    assert.equal(parsed.id, 'c7', 'id should come from frontmatter, not the filename fallback')
    assert.equal(parsed.title, 'Title')
    assert.equal(parsed.body, 'Body line')
    assert.equal(parsed.column, 'todo')
    assert.equal(parsed.labels[0], 'x')
  })

  await check('empty title does not swallow the first body word', () => {
    const c = card({ id: 'c8', code: 8, order: 'a2', title: '', body: 'first second' })
    const parsed = parseCardFile('c8', serializeCard(c))
    assert.equal(parsed.title, '')
    assert.equal(parsed.body, 'first second')
  })

  console.log('fractional ordering')
  await check('keys stay strictly ordered when inserting between neighbors', () => {
    const [k1, k2] = orderSequence(2)
    assert.ok(k1 < k2)
    const mid = orderBetween(k1, k2)
    assert.ok(k1 < mid && mid < k2, `expected ${k1} < ${mid} < ${k2}`)
  })

  console.log('RepoFileBoardStore (.valkeon/)')
  const repoStore = new RepoFileBoardStore(repo)
  const [o1, o2] = orderSequence(2)
  const board: Board = {
    id: 'sso',
    name: 'SSO rollout',
    scope: 'feature',
    baseBranch: 'main',
    columns: [
      { id: 'backlog', name: 'Backlog' },
      { id: 'in-progress', name: 'In Progress' }
    ],
    labels: [{ id: 'auth', name: 'auth', color: '#5b9dd9' }],
    cards: []
  }

  await check('scaffolds .valkeon/.gitignore on first write', async () => {
    await repoStore.saveWorkspaces([
      { id: 'ws1', name: 'Platform', useWorktree: true, boardIds: ['sso'] }
    ])
    const gitignore = await fs.readFile(join(repo, '.valkeon', '.gitignore'), 'utf8')
    assert.ok(gitignore.includes('local/'))
  })

  await check('writes one markdown file per card', async () => {
    await repoStore.saveBoard(board)
    await repoStore.saveCard('sso', card({ id: 'c1', code: 1, order: o1, title: 'Google provider' }))
    await repoStore.saveCard('sso', card({ id: 'c2', code: 2, order: o2, title: 'Okta provider' }))
    const files = await fs.readdir(join(repo, '.valkeon', 'boards', 'sso', 'cards'))
    assert.deepEqual(files.sort(), ['1-google-provider.md', '2-okta-provider.md'])
  })

  await check('load() reconstructs workspaces + board + ordered cards', async () => {
    const data = await repoStore.load()
    assert.equal(data.workspaces.length, 1)
    assert.equal(data.workspaces[0].name, 'Platform')
    assert.equal(data.boards.length, 1)
    const b = data.boards[0]
    assert.equal(b.name, 'SSO rollout')
    assert.equal(b.cards.length, 2)
    assert.deepEqual(b.cards.map((c) => c.title), ['Google provider', 'Okta provider'])
    assert.deepEqual(b.cards.map((c) => c.id), ['c1', 'c2'])
  })

  await check('renaming a card replaces its file (no orphan)', async () => {
    await repoStore.saveCard('sso', card({ id: 'c1', code: 1, order: o1, title: 'Google OAuth' }))
    const files = await fs.readdir(join(repo, '.valkeon', 'boards', 'sso', 'cards'))
    assert.ok(files.includes('1-google-oauth.md'))
    assert.ok(!files.includes('1-google-provider.md'))
  })

  await check('deleteCard removes the file', async () => {
    await repoStore.deleteCard('sso', 'c2')
    const files = await fs.readdir(join(repo, '.valkeon', 'boards', 'sso', 'cards'))
    assert.deepEqual(files, ['1-google-oauth.md'])
  })

  console.log('LocalBoardStore (userData)')
  const localStore = new LocalBoardStore(localFile)
  await check('round-trips board + card via a single JSON blob', async () => {
    await localStore.saveBoard(board)
    await localStore.saveCard('sso', card({ id: 'c9', code: 9, order: o1, title: 'Session handling' }))
    const data = await localStore.load()
    assert.equal(data.boards.length, 1)
    assert.equal(data.boards[0].cards[0].title, 'Session handling')
    assert.equal(localStore.mode, 'local')
  })

  await rm(repo, { recursive: true, force: true })
  await rm(join(localFile, '..'), { recursive: true, force: true })
  console.log(`\n${passed} checks passed`)
}

main().catch((err) => {
  console.error('\nTEST FAILED:', err)
  process.exit(1)
})
