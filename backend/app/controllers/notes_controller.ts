import type { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'

export default class NotesController {
  async list({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const projectId = request.input('projectId')

    const query = Note.query()
    if (projectId) {
      query.where('projectId', projectId)
    }

    return query.paginate(page, limit)
  }

  async get({ params }: HttpContext) {
    return Note.findOrFail(params.id)
  }

  async store({ request }: HttpContext) {
    const payload = request.only(['projectId', 'title', 'body', 'tag'])
    const note = await Note.create(payload)
    return note
  }

  async update({ request, params }: HttpContext) {
    const payload = request.only(['projectId', 'title', 'body', 'tag'])
    const note = await Note.findOrFail(params.id)
    note.merge(payload)
    await note.save()
    return note
  }

  async destroy({ params, response }: HttpContext) {
    const note = await Note.findOrFail(params.id)
    await note.delete()
    return response.noContent()
  }
}
