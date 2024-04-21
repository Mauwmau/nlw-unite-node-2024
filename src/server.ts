import { fastify } from "fastify";
import {serializerCompiler, validatorCompiler} from 'fastify-type-provider-zod'
import { createEvent } from "./routes/create-event.js";
import { registerForEvent } from "./routes/register-for-event.js";
import { getEvent } from "./routes/get-event.js";
import { getEventAttendees } from "./routes/get-event-attendees.js";
import { getAttendeeBadge } from "./routes/get-attendee-badge.js";

const app = fastify()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(createEvent)
app.register(registerForEvent)
app.register(getEvent)
app.register(getEventAttendees)
app.register(getAttendeeBadge)

app.listen({
  host: "0.0.0.0",
  port: 3333
}).then((serverURL) => {
  console.log(`Server running at ${serverURL}`)
})