import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from "../lib/dayjs";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../error/client-error";



export async function getTripDetails(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/trips/:tripId', 
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                }),
            },
        }, 
        async (request) => {
            const { tripId } = request.params
            
            const viagem = await prisma.trip.findUnique({
                select: {
                    id: true,
                    destination: true,
                    starts_at: true,
                    ends_at: true,
                    is_confirmed: true,
                },
                where: { id: tripId },
            })

            if (!viagem) {
                throw new ClientError('Trip não encontrada')
            }

        return { links: viagem } 

        }
    )
}