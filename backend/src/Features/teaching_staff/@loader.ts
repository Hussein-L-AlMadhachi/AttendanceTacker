import { type RPC } from "enders-sync";
import {
    activateLockedUser,
    unlockLoginAccount,
    autocompleteTeacher,
    changeTeacherPassword,
    deleteUser,
    fetchTeachers,
    getProfile,
    registerAdmin,
    registerTeacher,
    updateUser,
} from "./teaching_staff.service.js";

export function teachingStaffLoader(rpc: RPC) {
    rpc.add(fetchTeachers);
    rpc.add(registerTeacher);
    rpc.add(registerAdmin);
    rpc.add(deleteUser);
    rpc.add(updateUser);
    rpc.add(activateLockedUser);
    rpc.add(unlockLoginAccount);
    rpc.add(getProfile);
    rpc.add(changeTeacherPassword);
    rpc.add(autocompleteTeacher);
}
