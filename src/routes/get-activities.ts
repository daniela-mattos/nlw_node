import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from "../lib/dayjs";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../error/client-error";



export async function getActivities(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/trips/:tripId/activities', 
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
                include: { activities: {
                    orderBy: {
                        occurs_at: 'asc'
                    }
                } 
            }
            })

            if (!viagem) {
                throw new ClientError('Trip não encontrada')
            }

        const differenceInDaysBetweenTripStartAndEnd = dayjs(viagem.ends_at).diff(viagem.starts_at, 'days')

        const activities = Array.from({ 
                length: differenceInDaysBetweenTripStartAndEnd + 1 
            }).map((_, index) => {
                const date = dayjs(viagem.starts_at).add(index, 'days')

                return {
                    date: date.toDate(),
                    activities: viagem.activities.filter(activity => {
                        return dayjs(activity.occurs_at).isSame(date, 'day')
                    })
                }
            })

        return { activities } 

        }
    )
}