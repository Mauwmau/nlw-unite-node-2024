import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export async function getEventAttendees(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/events/:eventId/attendees', {
    schema: {
      params: z.object({
        eventId: z.string().uuid(),
      }),
      querystring: z.object({
        query: z.string().nullish(),
        pageIndex: z.string().nullish().default('0').transform(Number),
      }),
      response: {
        200: z.object({
          total: z.number().nonnegative(),
          attendees: z.array(z.object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
            createdAt: z.date(),
          }))
        })
      }
    }
  }, async (request, reply) => {
    const { eventId } = request.params
    const { query, pageIndex } = request.query

    const result = await prisma.attendee.findMany({
      where: query ? {
        eventId,
        name: {
          contains: query,
        }
      } : {
        eventId
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      take: 10,
      skip: pageIndex * 10,
      orderBy: {
        createdAt: 'desc'
      },
    })

    return reply.send({
      total: result.length,
      attendees: result
    })
  })
}