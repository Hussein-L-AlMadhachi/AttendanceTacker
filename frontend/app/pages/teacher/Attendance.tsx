import type { JSX } from "react";

import { MainLayout } from "@/layout/MainLayout";
import { AttendanceTabsView } from "@/components/AttendanceTabsView";
import { useValidRoute } from "@/hooks/useValidRoute";
import { teacherRPC } from "@/rpc";
import { sidebar_pages } from "./sidebar_pages";



function MainContent(): JSX.Element {
    return <AttendanceTabsView rpc={teacherRPC} />;
}



export function TeachersAttendancePage(): JSX.Element {
    useValidRoute(["teacher"], "/login");

    return (
        <MainLayout
            main={MainContent}
            title={"حضور الطلاب"}
            sidebar={sidebar_pages}
        />
    );
}
