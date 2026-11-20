import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const workflowDir = path.resolve('.github/workflows')

async function readWorkflow(name) {
  return parse(await readFile(path.join(workflowDir, name), 'utf8'))
}

const scheduleFiles = [
  ['hourly.yml', '17 * * * *', 'night-forecast dew-point-spread wind', 'Hourly weather'],
  ['three-hour.yml', '18 */3 * * *', 'space-weather atmosphere-transparency', '3-hour weather'],
  ['six-hour.yml', '19 */6 * * *', 'launches satellites news', '6-hour launches and satellites'],
  ['twelve-hour.yml', '20 */12 * * *', 'moon-timeline celestial-events', '12-hour moon and meteors'],
  ['daily.yml', '21 17 * * *', 'visible-planets neo-close-approaches', 'Daily planets and NEOs'],
]

test('each scheduled workflow has exactly one cron and one source group', async () => {
  for (const [file, cron, sources, label] of scheduleFiles) {
    const workflow = await readWorkflow(file)
    assert.deepEqual(workflow.on.schedule.map((entry) => entry.cron), [cron])
    assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'))

    const refresh = workflow.jobs.refresh
    assert.equal(refresh.uses, './.github/workflows/reusable-deploy.yml')
    assert.equal(refresh.with.source_names, sources)
    assert.equal(refresh.with.run_label, label)
  }
})

test('push and manual deploy fetch all sources', async () => {
  const workflow = await readWorkflow('deploy-on-push.yml')
  assert.ok(Object.hasOwn(workflow.on, 'push'))
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'))
  assert.equal(workflow.jobs.refresh.with.source_names, '')
  assert.equal(workflow.jobs.refresh.with.run_label, 'All sources')
})

test('reusable deploy workflow fetches and deploys Pages', async () => {
  const workflow = await readWorkflow('reusable-deploy.yml')
  assert.ok(workflow.on.workflow_call)
  assert.ok(workflow.jobs.build)
  assert.ok(workflow.jobs.deploy)
  assert.equal(workflow.jobs.deploy.needs, 'build')
  assert.equal(workflow.jobs.deploy.environment.name, 'github-pages')
})

test('old combined deploy workflow is removed', async () => {
  await assert.rejects(
    readWorkflow('deploy.yml'),
  )
})
