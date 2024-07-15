import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dayjs } from "../lib/dayjs";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { ClientError } from "../error/client-error";
import { env } from "../env";



export async function createInvite(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/trips/:tripId/invites',
        {
            schema: {
                params: z.object({
                    tripId: z.string().uuid(),
                }),

                body: z.object({
                    email: z.string().email(),
                })
            },
        },
        async (request) => {
            const { tripId } = request.params
            const { email } = request.body

            const viagem = await prisma.trip.findUnique({
                where: { id: tripId },
                include: { links: true }
            })

            if (!viagem) {
                throw new ClientError('Trip não encontrada')
            }

            const participant = await prisma.participant.create({
                data: {
                    email,
                    trip_id: tripId,
                }
            })

            const formattedStartDate = dayjs(viagem.starts_at).format("LL")
            const formattedEndDate = dayjs(viagem.ends_at).format("LL")

            const mail = await getMailClient()

            const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

            const message = await mail.sendMail({
                from: {
                    name: 'Equipe plan.ner',
                    address: 'oi@planner.nah'
                },
                to: participant.email,
                subject: `Confirme sua presença na viagem para ${viagem.destination} em ${formattedStartDate}!`,
                html: `<div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                          <p>Você foi convidado para a viagem à <strong>${viagem.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
                          <p></p>
                          <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
                          <p></p>
                          <p>
                            <a href="${confirmationLink}">Confirmar persença na viagem</a>
                          </p>
                          <p></p>
                          <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
                        </div>`.trim()
            })

            console.log(nodemailer.getTestMessageUrl(message))

            return { participant: participant.id }
        }
    )

}

