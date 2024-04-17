import { fastify } from "fastify";
import {serializerCompiler, validatorCompiler} from 'fastify-type-provider-zod'
import { createEvent } from "./routes/create-event";

const app = fastify()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(createEvent)

app.listen({
  host: "0.0.0.",
  port: 3333
}).then((serverURL) => {
  console.log(`Server running at ${serverURL}`)
})