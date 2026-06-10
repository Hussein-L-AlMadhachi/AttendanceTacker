import type { JSX } from "react";

import { MainLayout } from "@/layout/MainLayout";
import { AttendanceTabsView } from "@/components/AttendanceTabsView";
import { useValidRoute } from "@/hooks/useValidRoute";
import { superAdminRPC } from "@/rpc";
import { sidebar_pages } from "./sidebar_pages";



function MainContent(): JSX.Element {
    return <AttendanceTabsView rpc={superAdminRPC} />;
}



export function SuperAttendancePage(): JSX.Element {
    useValidRoute(["superadmin"], "/login");

    return (
        <MainLayout
            main={MainContent}
            title={"حضور الطلاب"}
            sidebar={sidebar_pages}
        />
    );
}
