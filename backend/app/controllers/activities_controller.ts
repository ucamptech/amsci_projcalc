import Activity from '#models/activity'
import type { HttpContext } from '@adonisjs/core/http'

export default class ActivitiesController {
  async list({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 20
    return Activity.query().paginate(page, limit)
  }
}
