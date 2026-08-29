/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@prisma/client' {
  export class PrismaClient {
    user: any;
    competition: any;
    team: any;
    submission: any;
    vote: any;
    round: any;
  }
}
