import clsx from "clsx";
import { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]){
    return twMerge(clsx(inputs))
}


export function chatHrefConstructor(id1:string,id2:string){
    const sortId = [id1,id2].sort();
    return `${sortId[0]}--${sortId[1]}`;
}


export function toPusherKey(key : string){
    return key.replace(/:/g,"__");
}