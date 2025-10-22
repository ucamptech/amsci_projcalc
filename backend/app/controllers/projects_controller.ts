import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Project from '#models/project'
import Estimate from '#models/estimate'

export default class ProjectsController {
  async store({ request }: HttpContext) {
    // TODO : Validate
    const projectPayload = request.except(['estimates'])
    const estimatesPayload = request.only(['estimates'])

    const trx = await db.transaction()
    const project = await Project.create(
      {
        ...projectPayload,
      },
      { client: trx }
    )
    await project.save()
    await project.related('estimates').createMany(estimatesPayload.estimates)
    await trx.commit()

    return project
  }

  async update({ request, params }: HttpContext) {
    // TODO : Validate
    const projectPayload = request.except(['estimates'])
    const estimatesPayload = request.only(['estimates'])

    const trx = await db.transaction()

    let project = await Project.query()
      .where('id', params.id)
      .preload('estimates', (estimatesQuery) => {
        estimatesQuery.preload('activity')
        estimatesQuery.preload('resource')
      })
      .firstOrFail()
    await project.merge({ ...projectPayload }).save()

    // Update or delete existing estimates
    project.estimates.forEach(async (estimate) => {
      let estimateUpdate = estimatesPayload.estimates.find((e: Estimate) => e.id === estimate.id)
      if (estimateUpdate) {
        await estimate.merge(estimateUpdate).save()
      } else {
        await estimate.delete()
      }
    })

    // Create new estimates
    const newEstimates = estimatesPayload.estimates.filter((e: Estimate) => !e.id)
    if (newEstimates.length > 0) {
      await project.related('estimates').createMany(newEstimates)
    }

    await trx.commit()

    project = await Project.query()
      .where('id', params.id)
      .preload('estimates', (estimatesQuery) => {
        estimatesQuery.preload('activity')
        estimatesQuery.preload('resource')
      })
      .firstOrFail()

    return project
  }

  async get({ params }: HttpContext) {
    return Project.query()
      .where('id', params.id)
      .preload('estimates', (estimatesQuery) => {
        estimatesQuery.preload('activity')
        estimatesQuery.preload('resource', (resourceQuery) => {
          resourceQuery.preload('resourceType')
        })
      })
      .firstOrFail()
  }

  async list({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 20
    return Project.query().paginate(page, limit)
  }
}
