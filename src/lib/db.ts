import { Redis } from "@upstash/redis";

const upstash_url:string = process.env.UPSTASH_REDIS_REST_URL !
const upstash_token : string = process.env.UPSTASH_REDIS_REST_TOKEN !


export const db : Redis = new Redis({
    url:upstash_url,
    token : upstash_token, 
})