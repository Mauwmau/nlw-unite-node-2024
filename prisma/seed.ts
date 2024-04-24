import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import { faker } from "@faker-js/faker";
import { generateSlug } from '../src/utils/generate-slug'
import { customNanoId } from '../src/utils/generate-custom-nanoid'

faker.seed(28572)

const REFERENCEDATE: string = '2024-04-01T00:00:00.000Z'
const DAYSSPACING: number = 7

interface EventParams {
  id: string
  title: string
  details: string | null
  slug: string
  maximumAttendees: number | null
}

interface AttendeeParams {
  id: string
  name: string
  email: string
  createdAt: Date
  eventId: string
}

interface CheckInParams {
  id?: number
  createdAt: Date
  attendeeId: string
}

// TODO
// -- Events: 3 hardcoded + 2 random
// -- Attedees: 5 hardcoded + ...random
// -- Check-ins: All random or some stupid rule [e.g. names starting with vowels]



// HardCoded Events to guarantee:
// An event with all fields complete
// An event without maximum attendees limit
// An envent without description
const hardCodedEvents: EventParams[] = [
  {
    id: '165546ea-4b76-4fa0-976d-75aa385b16b2',
    title: 'Evento de Teste Completinho',
    details: 'Um evento de teste contendo detalhes e número máximo de participantes ',
    slug: 'evento-de-teste-completinho',
    maximumAttendees: 120,
  },
  {
    id: 'c12ebf71-8066-45df-be6b-90119b102e67',
    title: 'Evento de Teste sem Detalhes',
    details: null,
    slug: 'evento-de-teste-sem-detalhes',
    maximumAttendees: 10,
  },
  {
    id: '9d3976b8-8b0b-421e-9755-e8dacacd2707',
    title: 'Evento de Teste sem Limite de Participantes',
    details: 'Um evento de teste onde o número máximo de participantes é nulo, permitindo inscrições ilimitadas ao evento',
    slug: 'evento-de-teste-sem-limite-de-participantes',
    maximumAttendees: null,
  },
]

function createRandomEvent(): EventParams {
  const id = faker.string.uuid()
  const title = `${faker.commerce.productAdjective()} ${faker.commerce.product()} ${faker.company.buzzVerb()}`
  const slug = generateSlug(title)
  const details = faker.helpers.arrayElement([null, faker.lorem.sentence()])
  const maximumAttendees = faker.helpers.arrayElement([null, 25, 100])
  return { id, title, slug, details, maximumAttendees }
}

function createRandomAttendee(relatedEvent: string, index?: number): AttendeeParams {
  const id = customNanoId()
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const name = [firstName, lastName].join(" ")
  const email = faker.internet.email({ firstName, lastName }).split("@").join(`_${index ? index : 0}@`)
  const createdAt = faker.date.soon({ days: DAYSSPACING, refDate: REFERENCEDATE })
  const eventId = relatedEvent
  return { id, name, email, createdAt, eventId }
}

function createRandomCheckIn(relatedAttendee: AttendeeParams, hardCodedId?: number): CheckInParams {
  const attendeeId = relatedAttendee.id

  const baseDate = relatedAttendee.createdAt
  const endDate = new Date(baseDate)
  endDate.setDate(baseDate.getDate() + DAYSSPACING - 1)

  const createdAt = faker.date.between({ from: baseDate.toISOString(), to: endDate.toISOString() })
  return hardCodedId ? { id: hardCodedId, attendeeId, createdAt } : { attendeeId, createdAt }
}

function prepareAttendees(amount: number, event: string): Prisma.AttendeeUncheckedCreateInput[] {
  const attendeeList: Prisma.AttendeeUncheckedCreateInput[] = []

  for (let index = 0; index < amount; index++) {
    const attendee = createRandomAttendee(event, index)
    const {createdAt} = createRandomCheckIn(attendee)
    const nestedCheckInCreator: Prisma.CheckInUncheckedCreateNestedOneWithoutAttendeeInput = {
      create: {
        createdAt,
      }  
    }
    const checkIn = faker.helpers.arrayElement([undefined, nestedCheckInCreator])
    attendeeList.push(checkIn ? {...attendee, checkIn} : {...attendee})
  }

  return attendeeList
}

async function seed() {

  await prisma.event.deleteMany()

  const myEvents = [...hardCodedEvents]
  for (let index = 0; index < 3; index++) {
    myEvents.push(createRandomEvent())
  }

  await prisma.event.createMany({
    data: myEvents
  })



  /* Tentando criar um objeto com a seguinte estrutura
  Esse objeto tem tipo <Prisma.AttendeeUncheckedCreateInput>
  É um objeto que descreve como criar um participante
   - O fato de ser unchecked permite que escrever o campo do relacionamento como um valor
   - Ou seja, a checagem (se um evento existe) fica por conta do dev (ainda assim o prisma lança um erro caso não exista)

  {
    id: 'VsvwSdmjAm21',
    name: 'John Doe',
    email: 'John_Doe_3@email.com',
    createdAt: '2024-04-23',
    eventId: '165546ea-4b76-4fa0-976d-75aa385b16b2',
    checkIn: {
      create: {
        createdAt: '2024-04-24'
      }
    }
  }

   Já o tipo <Prisma.CheckInUncheckedCreateNestedOneWithoutAttendeeInput> descreve o seguinte objeto
   Esse objeto fica responsavel por dizer o que deve acontecer com o relacionamento com checkIns
   - Isso porque podemons criar um checkIn juntamente à criação do participante e já estabelecer o relacionamento
   - O que facilita bastante, pois evita que seja necessario criar o participante pra depois criar o checkin
  {
    checkIn: {
      create: {
        createdAt: '2024-04-24'
      }
    }
  }
  
  prisma.model.createMany() não consegue fazer nested creates de relation ☝️🤓

  */
  let attendeesToInsert: Prisma.AttendeeUncheckedCreateInput[] = []
  attendeesToInsert = [...attendeesToInsert, ...prepareAttendees(30, '165546ea-4b76-4fa0-976d-75aa385b16b2')]
  attendeesToInsert = [...attendeesToInsert, ...prepareAttendees(10, 'c12ebf71-8066-45df-be6b-90119b102e67')]
  myEvents.forEach((event, index) =>{
    if (index >= Math.ceil( myEvents.length / 2 )) {
      const attendeesAmount = event.maximumAttendees ? Math.floor(event.maximumAttendees / 4) : 0
      attendeesToInsert = attendeesToInsert.concat(prepareAttendees(attendeesAmount, event.id))
    }
  })

  await Promise.all(attendeesToInsert.map((data)=>{
    return prisma.attendee.create({
      data,
    })
  }))

}

seed().then(() => {
  console.log("Database Seeded! 🌱")
  prisma.$disconnect()
})