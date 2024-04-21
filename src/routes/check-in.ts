import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma.js";

export async function checkIn(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/attendees/:attendeeId/check-in', {
    schema: {
      params: z.object({
        attendeeId: z.string().length(12)
      })
    }
  }, async (request, reply) => {
    const { attendeeId } = request.params

    const searchResult = await prisma.checkIn.findUnique({
      where:{
        attendeeId,
      }
    })

    if (searchResult !== null) {
      throw new Error('Attendee already checked-in!')
    }

    await prisma.checkIn.create({
      data:{
        attendeeId,
      }
    })

    return reply.status(201).send()
  })
}