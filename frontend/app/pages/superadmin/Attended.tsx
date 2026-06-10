import type { JSX } from "react";
import { useParams } from "wouter";

import { MainLayout } from "@/layout/MainLayout";
import { AttendanceTabsView } from "@/components/AttendanceTabsView";
import { useValidRoute } from "@/hooks/useValidRoute";
import { superAdminRPC } from "@/rpc";
import { sidebar_pages } from "./sidebar_pages";



function MainContent(): JSX.Element {
    const params = useParams<{ year: string; month: string; day: string }>();
    if (!params.year || !params.month || !params.day) {
        throw "invalid date";
    }

    return (
        <AttendanceTabsView
            rpc={superAdminRPC}
            initialDate={{
                year: parseInt(params.year),
                month: parseInt(params.month),
                day: parseInt(params.day),
            }}
        />
    );
}



export function SuperAttendedPage(): JSX.Element {
    useValidRoute(["superadmin"], "/login");

    return (
        <MainLayout
            main={MainContent}
            title={"حضور الطلاب"}
            sidebar={sidebar_pages}
        />
    );
}
