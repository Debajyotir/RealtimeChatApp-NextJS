import { fetchRedis } from "@/helper/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req:Request) {
    try {
        const body = await req.json();

        const {email : emailToAdd} = addFriendValidator.parse(body.email);

        const idToAdd = await fetchRedis("get",`user:email:${emailToAdd}`) as string;

        if(!idToAdd){
            return new Response(`This Person dosen't exist.`,{status:400})
        }

        const sessions = await getServerSession(authOptions);

        if(!sessions){
            return new Response('Unauthorized',{status:401});
        }

        if(idToAdd===sessions.user.id){
            return new Response(`You can't add yourself as friend`,{status:400});
        }

        const isAlreadyAdded = await fetchRedis("sismember",`user:${idToAdd}:incoming_friend_requests`,sessions.user.id) as 0 | 1;
        if(isAlreadyAdded){
            return new Response("Already added this user",{status:400});
        }



        const isAlreadyFriends = await fetchRedis("sismember",`user:${sessions.user.id}:friends`,idToAdd) as 0 | 1;
        if(isAlreadyFriends){
            return new Response("Already friend with this user",{status:400});
        }

        await pusherServer.trigger(
            toPusherKey(`user:${idToAdd}:incoming_friend_request`),
            "incoming_friend_requests",
            {
                senderId : sessions.user.id,
                senderEmail : sessions.user.email
            }
        )

        await pusherServer.trigger(toPusherKey(`user:${idToAdd}:cnt`),"cnt",{});

        await db.sadd(`user:${idToAdd}:incoming_friend_requests`,sessions.user.id);

        return new Response("Ok",{status:200});


    } catch (error) {
        if(error instanceof z.ZodError){
            return new Response("Invalid request payload",{status:422});
        }
        return new Response("Invalid request",{status:400});
    }
    
}