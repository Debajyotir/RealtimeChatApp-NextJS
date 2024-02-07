"use client"
import { pusherClient } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface FriendRequestProps {
    inComingFriendRequests : IncomingFriendRequests[]
    sessionId : string
}

const FriendRequest: FC<FriendRequestProps> = ({inComingFriendRequests,sessionId}) => {

    const router = useRouter();

    const [friendRequests, setFriendRequests] = useState<IncomingFriendRequests[]>(
        inComingFriendRequests
    );


    useEffect(()=>{
        pusherClient.subscribe(toPusherKey(`user:${sessionId}:incoming_friend_request`));

        const friendRequestHandler = ({senderId,senderEmail}:IncomingFriendRequests) =>{
            setFriendRequests((prev) => [...prev,{senderId,senderEmail}]);
        }

        pusherClient.bind("incoming_friend_requests",friendRequestHandler);

        return ()=>{
            pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:incoming_friend_request`));
            pusherClient.unbind("incoming_friend_requests",friendRequestHandler);

        }
    },[sessionId])

    const acceptFriend = async(senderId:string) =>{
        try {
            await axios.post("/api/friends/accept",{id:senderId});

            setFriendRequests((prev)=>(
                prev.filter((request)=> request.senderId !== senderId)
            ));

            router.refresh();
        } catch (error) {
            console.log(error);
        }
        
    }

    const denyFriend = async(senderId:string) =>{
        try {
            await axios.post("/api/friends/deny",{id:senderId});

            setFriendRequests((prev)=>(
                prev.filter((request)=> request.senderId !== senderId)
            ));

            router.refresh();
        } catch (error) {
            console.log(error);
        }
        
    }
  return(
    <>
        {friendRequests.length===0 ? (
            <p className='text-sm text-zinc-500'>Nothing to show here...</p>
        ) : (
            friendRequests.map((request)=>(
                <div key={request.senderId} className='flex gap-4 items-center'>
                    <UserPlus className='text-black' />
                    <p className='font-medium text-lg'>{request.senderEmail}</p>
                    <button aria-label='accept friend' 
                    className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md'
                    onClick={()=>acceptFriend(request.senderId)}
                    >
                        <Check className='font-semibold text-white w-3/4 h-3/4' />
                    </button>

                    <button aria-label='deny friend' 
                    className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md'
                    onClick={()=>denyFriend(request.senderId)}
                    >
                        <X className='font-semibold text-white w-3/4 h-3/4' />
                    </button>
                </div>
            ))
        )}
    </>
  )
}

export default FriendRequest