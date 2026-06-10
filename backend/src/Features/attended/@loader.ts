import { type RPC } from "enders-sync";
import {
    fetchAttendanceDates,
    fetchAttendedStudents,
    markGuestAttended,
    markStudentAttended,
    removeAttended,
} from "./attended.service.js";


export function attendedLoader(rpc: RPC) {
    rpc.add(fetchAttendanceDates);
    rpc.add(fetchAttendedStudents);
    rpc.add(markStudentAttended);
    rpc.add(markGuestAttended);
    rpc.add(removeAttended);
}
