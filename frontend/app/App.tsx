import { Route, Switch } from "wouter";
import type { JSX } from "react";


import { LoginPage } from "@/pages/LoginPage";
import { QrAttendPage } from "@/pages/QrAttendPage";

import { TeachersPage } from "@/pages/admin/Teachers";
import { StudentsPage } from "@/pages/admin/Students";

import { TeachersAttendancePage } from "./pages/teacher/Attendance";
import { TeachersAttendedPage } from "./pages/teacher/Attended";

import { SuperTeachersPage } from "@/pages/superadmin/Teachers";
import { SuperStudentsPage } from "@/pages/superadmin/Students";
import { SuperAttendancePage } from "@/pages/superadmin/Attendance";
import { SuperAttendedPage } from "@/pages/superadmin/Attended";




export default function App(): JSX.Element {
    return <>
        <Switch>
            <Route path="/" component={LoginPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/a/qr-attend" component={QrAttendPage} />

            <Route path="/admin/teachers" component={TeachersPage} />
            <Route path="/admin/students" component={StudentsPage} />

            <Route path="/teacher/attendance" component={TeachersAttendancePage} />
            <Route path="/teacher/attended/:year/:month/:day" component={TeachersAttendedPage} />

            <Route path="/superadmin/teachers" component={SuperTeachersPage} />
            <Route path="/superadmin/students" component={SuperStudentsPage} />
            <Route path="/superadmin/attendance" component={SuperAttendancePage} />
            <Route path="/superadmin/attended/:year/:month/:day" component={SuperAttendedPage} />

            {/* Default route in a switch */}
            <Route><div className="w-full h-screen flex justify-center items-center">404: No such page!</div></Route>
        </Switch>
    </>;
}
