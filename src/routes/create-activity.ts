import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from "../lib/dayjs";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../error/client-error";



export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/trips/:tripId/activities', 
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                }),
                body: z.object({
                    title: z.string().min(4),
                    occurs_at: z.coerce.date(),
                }),
            },
        }, 
        async (request) => {
            const { tripId } = request.params
            const { title, occurs_at } = request.body

            const viagem = await prisma.trip.findUnique({
                where: { id: tripId }
            })

            if (!viagem) {
                throw new ClientError('Trip não encontrada')
            }

            if (dayjs(occurs_at).isBefore(viagem.starts_at)) {
                throw new ClientError('Data inválida')
            }

            if (dayjs(occurs_at).isAfter(viagem.ends_at)) {
                throw new ClientError('Data inválida')
            }

            
            const activity = await prisma.activity.create({
                data: {
                    title,
                    occurs_at,
                    trip_id: tripId,
                }
            })

            
           return { activityId: activity.id } 
    })
}