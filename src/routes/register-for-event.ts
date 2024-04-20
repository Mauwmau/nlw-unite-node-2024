import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma.js";
import { customNanoId } from "../utils/generate-custom-nanoid.js";

export async function registerForEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/events/:eventId/attendees', {
    schema: {
      body: z.object({
        name: z.string(),
        email: z.string().email()
      }),
      params: z.object({
        eventId: z.string().uuid()
      }),
      response: {
        201: z.object({
          attendeeId: z.string().length(12),
          createdAt: z.string().datetime()
        })
      }
    }
  }, async (request, reply) => {
    const { name, email } = request.body
    const { eventId } = request.params
    
    const attendeAlreadyRegistered = await prisma.attendee.findUnique({
      where: {
        eventId_email: {
          eventId,
          email,
        }
      }
    })
    
    if(attendeAlreadyRegistered !== null){
      throw new Error(`Attendee with email: ${email} is already register to event with id ${eventId}`)
    }

    const [event, unavaliableIds] = await Promise.all([
      prisma.event.findUnique({
        where:{
          id: eventId,
        }, select:{
          maximumAttendees: true,
        }
      })
      ,
      prisma.attendee.findMany({
        select:{
          id: true,
        }, where: {
          eventId,
        }
      })
    ])
    
    const unavaliableIdsList = unavaliableIds.map((idObject => idObject.id))

  if(event?.maximumAttendees && unavaliableIdsList.length >= event.maximumAttendees){
    throw new Error("This event has reached it's maximum attendees limit");
  }
    let attendeeId = customNanoId()

    while(unavaliableIdsList.includes(attendeeId)){
      attendeeId = customNanoId()
    }

    const registeredAttendee = await prisma.attendee.create({
      data:{
        id: attendeeId,
        email,
        name,
        eventId,
      }
    })

    return reply.status(201).send({
      attendeeId: registeredAttendee.id,
      createdAt: new Date(registeredAttendee.createdAt).toISOString()
    })
  })
}