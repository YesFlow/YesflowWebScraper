import { Guid } from "guid-typescript";

export class Utils {

 public static GetUnqiueId(): string {
    return  Guid.create().toString();
 }
 
}