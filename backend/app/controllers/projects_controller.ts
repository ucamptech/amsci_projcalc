import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Project from '#models/project'
import Estimate from '#models/estimate'
import { randomUUID } from 'node:crypto'

export default class ProjectsController {
  async store({ request }: HttpContext) {
    // TODO : Validate
    const projectPayload = request.except(['estimates'])
    const estimatesPayload = request.only(['estimates'])

    const trx = await db.transaction()
    const project = await Project.create(
      {
        ...projectPayload,
        projectUid: projectPayload.projectUid || randomUUID(),
        isCurrent: projectPayload.isCurrent ?? true,
      },
      { client: trx }
    )
    // If marking current, unset other versions for the same projectUid
    if (project.isCurrent && project.projectUid) {
      await Project.query({ client: trx })
        .where('project_uid', project.projectUid)
        .whereNot('id', project.id)
        .update({ isCurrent: false })
    }
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
    try {
      let project = await Project.query({ client: trx })
        .where('id', params.id)
        .preload('estimates', (estimatesQuery) => {
          estimatesQuery.preload('activity')
          estimatesQuery.preload('resource')
        })
        .firstOrFail()
      project.useTransaction(trx)
      await project.merge({ ...projectPayload }).save()

      // If this version is marked current, unset others in the same group
      if (project.isCurrent && project.projectUid) {
        await Project.query({ client: trx })
          .where('project_uid', project.projectUid)
          .whereNot('id', project.id)
          .update({ isCurrent: false })
      }

      // Update or delete existing estimates
      for (const estimate of project.estimates) {
        const estimateUpdate = estimatesPayload.estimates.find((e: Estimate) => e.id === estimate.id)
        if (estimateUpdate) {
          estimate.useTransaction(trx)
          await estimate.merge(estimateUpdate).save()
        } else {
          estimate.useTransaction(trx)
          await estimate.delete()
        }
      }

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
    } catch (error) {
      await trx.rollback()
      throw error
    }
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
    return Project.query().where('is_current', true).paginate(page, limit)
  }

  async versions({ params }: HttpContext) {
    const projectUid = params.uid
    return Project.query()
      .where('project_uid', projectUid)
      .preload('estimates', (estimatesQuery) => {
        estimatesQuery.preload('activity')
        estimatesQuery.preload('resource', (resourceQuery) => {
          resourceQuery.preload('resourceType')
        })
      })
      .orderBy('created_at', 'desc')
  }

  async promote({ params }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    if (!project.projectUid) {
      project.projectUid = randomUUID()
    }

    await Project.query()
      .where('project_uid', project.projectUid)
      .update({ isCurrent: false })

    project.isCurrent = true
    await project.save()

    return project
  }
}
