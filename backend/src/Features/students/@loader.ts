import { type RPC } from "enders-sync";
import {
    autocompleteStudent,
    deleteStudent,
    fetchStudentInfo,
    fetchStudents,
    findStudentByName,
    newStudent,
    updateStudent,
} from "./students.service.js";

export function studentsLoader(rpc: RPC) {
    rpc.add(newStudent);
    rpc.add(updateStudent);
    rpc.add(deleteStudent);
    rpc.add(fetchStudentInfo);
    rpc.add(fetchStudents);
    rpc.add(autocompleteStudent);
    rpc.add(findStudentByName);
}
