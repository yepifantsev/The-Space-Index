import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'

const workflowDir = path.resolve('.github/workflows')

async function readWorkflow(name) {
  return parse(await readFile(path.join(workflowDir, name), 'utf8'))
}

const dispatchFiles = [
  ['hourly.yml', 'night-forecast dew-point wind', 'Hourly weather'],
  ['three-hour.yml', 'space-weather transparency', '3-hour weather'],
  ['six-hour.yml', 'launches satellites news', '6-hour launches and satellites'],
  ['twelve-hour.yml', 'moon-timeline celestial-events', '12-hour moon and meteors'],
  ['daily.yml', 'visible-planets neo', 'Daily planets and NEOs'],
]

test('each externally scheduled workflow uses manual dispatch and one source group', async () => {
  for (const [file, sources, label] of dispatchFiles) {
    const workflow = await readWorkflow(file)
    assert.ok(!Object.hasOwn(workflow.on, 'schedule'))
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
  assert.equal(workflow.concurrency.group, 'pages')
  assert.equal(workflow.concurrency['cancel-in-progress'], true)
  assert.ok(workflow.jobs.build)
  assert.ok(workflow.jobs.deploy)
  assert.equal(workflow.jobs.deploy.needs, 'build')
  assert.equal(workflow.jobs.deploy.environment.name, 'github-pages')

  const restoreStep = workflow.jobs.build.steps.find((step) => step.name === 'Restore previous data')
  assert.equal(restoreStep.with['restore-keys'], 'space-data-')
  assert.ok(workflow.jobs.build.steps.some((step) => step.name === 'Remove stale generated data'))
})

test('old combined deploy workflow is removed', async () => {
  await assert.rejects(
    readWorkflow('deploy.yml'),
  )
})
