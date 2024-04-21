import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma.js";

export async function getAttendeeBadge(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/attendees/:attendeeId/badge', {
    schema: {
      params: z.object({
        attendeeId: z.string().length(12)
      }),
      response: {
        200: z.object({
          badge: z.object({
            name: z.string(),
            email: z.string().email(),
            event: z.string(),
            checkInUrl: z.string(),
          })
        })
      }
    }
  }, async (request, reply) => {
    const { attendeeId } = request.params

    const result = await prisma.attendee.findUnique({
      where:{
        id: attendeeId,
      },
      select:{
        name: true,
        email: true,
        event: {
          select:{
            title: true
          }
        }
      }
    })

    if (result === null) {
      throw new Error("Attendee not found")
    }

    const baseURL = `${request.protocol}://${request.hostname}`
    const badgeURL = new URL(`/attendees/${attendeeId}/check-in`, baseURL)

    const {name, email, event} = result

    return reply.send({
      badge:{
        name,
        email,
        event: event.title,
        checkInUrl: badgeURL.toString(),
      }
    })
  })
}