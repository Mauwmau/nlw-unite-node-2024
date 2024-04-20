import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export async function getEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/events/:eventId', {
    schema: {
      params: z.object({
        eventId: z.string().uuid()
      }),
      response: {
        200: z.object({
          title: z.string(),
          slug: z.string(),
          maximumAttendees: z.number().int().nullable(),
          attendeeCount: z.number().int().nonnegative(),
          details: z.string().nullable(),
        })
      }
    }
  },
    async (request, reply) => {
      const { eventId } = request.params

      const checkForEvent = await prisma.event.findUnique({
        where: {
          id: eventId
        },
        select: {
          title: true,
          slug: true,
          details: true,
          maximumAttendees: true,
          _count: {
            select: {
              attendees: true
            }
          }
        },
      })

      if (checkForEvent === null) {
        throw new Error("No event with such ID")
      }

      const { title, slug, details, maximumAttendees } = checkForEvent
      const attendeeCount = checkForEvent._count.attendees

      return reply.send({
        title,
        slug,
        maximumAttendees,
        attendeeCount,
        details
      })
    })
}