import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../error/client-error";



export async function createLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/trips/:tripId/links', 
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                }),
                body: z.object({
                    title: z.string().min(4),
                    url: z.string().url(),
                }),
            },
        }, 
        async (request) => {
            const { tripId } = request.params
            const { title, url } = request.body

            const viagem = await prisma.trip.findUnique({
                where: { id: tripId }
            })

            if (!viagem) {
                throw new ClientError('Trip não encontrada')
            }
            
            const link = await prisma.link.create({
                data: {
                    title,
                    url,
                    trip_id: tripId,
                }
            })

            
           return { linkId: link.id } 
    })
}