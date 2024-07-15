import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from "../lib/dayjs";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../error/client-error";



export async function getParticipants(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/trips/:tripId/participants', 
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
                where: { id: tripId },
                include: { participants: {
                    select: {
                    id: true,
                    name: true,
                    email: true,
                    is_cofirmed: true,
                    }
                }
            }
        })

            if (!viagem) {
                throw new ClientError('Trip não encontrada')
            }

        

        return { participants: viagem.participants } 

        }
    )
}