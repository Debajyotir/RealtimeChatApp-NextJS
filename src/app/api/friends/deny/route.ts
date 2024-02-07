import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { z } from "zod"

export async function POST(req:Request){
    try {
        const body = await req.json();
        const {id:idToDeny} = z.object({id:z.string()}).parse(body);

        const session = await getServerSession(authOptions);

        if(!session)
            return new Response("Unauthorized",{status:401});

        const isAlreadyFriends = await fetchRedis("sismember",`user:${session.user.id}:friends`,idToDeny);

        if(isAlreadyFriends){
            return new Response("Not Friend",{status:400});
        }
        
        const hasFriendRequest = await fetchRedis("sismember",`user:${session.user.id}:incoming_friend_requests`,idToDeny);

        if(!hasFriendRequest){
            return new Response("No Friend request",{status:400});
        }
        
        if(session.user.id===idToDeny){
            return new Response("You Can't Add or remove yourself as friend",{status:400});
        }


        await Promise.all([
            pusherServer.trigger(toPusherKey(`user:${session.user.id}:denyfriends`),"deny_friend",{}),
            db.srem(`user:${session.user.id}:incoming_friend_requests`, idToDeny)
        ])

        return new Response("OK");
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response('Invalid request payload', { status: 422 });
        }
      
        return new Response('Invalid request', { status: 400 });
    }
}