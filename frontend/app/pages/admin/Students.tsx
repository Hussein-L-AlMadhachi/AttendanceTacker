import { type JSX, useState, useEffect, useRef } from "react";
import { UserRoundPlus, Plus } from "lucide-react";

// layouts
import { MainLayout } from "@/layout/MainLayout";

// Components
import { EditableTable } from "@/components/EditableTable";
import { Modal } from "@/components/Modal";
import { DynamicForm, type DynamicFormTemplate } from "@/components/DynamicForm";
import { Section, Subsection } from "@/components/Section";

// Hooks
import { useValidRoute } from "@/hooks/useValidRoute";

// Globals
import { type studentData, type StudentUpdateData, adminRPC } from "@/rpc";
import { sidebar_pages } from "./sidebar_pages";



interface OptionsProps {
    onAddClick: () => void;
    onImportSuccess: () => void;
}



function Options({ onAddClick, onImportSuccess }: OptionsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isStartYearModalOpen, setIsStartYearModalOpen] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/students/import", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                onImportSuccess();
            } else {
                const result = await response.json();
                alert("خطأ في استيراد الملف: " + result.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("خطأ في استيراد الملف");
        }
    };

    const handleStartYearClick = () => {
        setIsStartYearModalOpen(true);
    };

    const handleConfirmStartYear = () => {
        setIsStartYearModalOpen(false);
        fileInputRef.current?.click();
    };


    return <>
        <div id="options" className="menu lg:menu-horizontal menu-vertical w-full justify-between">
            <div className="text-4xl text-center max-sm:py-10 max-md:w-full"> إدارة الطلاب </div>
            <ul className="menu bg-base-200 lg:menu-horizontal rounded-box gap-1 menu-vertical max-md:w-full">

                <li>
                    <button className="btn btn-lg" onClick={onAddClick}>
                        <UserRoundPlus size={18} /> إضافة طالب
                    </button>
                </li>

                <li>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                    />
                    <button className="btn btn-lg" onClick={handleStartYearClick}>
                        <Plus size={18} /> ادخال بيانات من اكسل
                    </button>
                </li>
            </ul>
        </div>

        <Modal isOpen={isStartYearModalOpen} className="w-full flex flex-col justify-center max-w-lg">
            <h3 className="font-bold text-lg mb-4 text-center">تحذير</h3>
            <p className="text-center mb-6 leading-7">
                هل أنت متأكد أنك تريد المتابعة؟
            </p>
            <div className="flex justify-center gap-3">
                <button className="btn btn-ghost" onClick={() => setIsStartYearModalOpen(false)}>
                    إلغاء
                </button>
                <button className="btn btn-warning" onClick={handleConfirmStartYear}>
                    نعم، متابعة
                </button>
            </div>
        </Modal>
    </>;
}



interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const studentFormTemplate: DynamicFormTemplate[] = [
    { title: "الاسم الكامل", key: "student_name", type: "text" }
];

function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
    const handleAddStudent = async (data: studentData) => {

        try {
            if (!data.student_name) {
                throw "يجب ملئ اسم الطالب";
            }

            await adminRPC.newStudent(data);
            onSuccess();
            onClose();
        } catch (error) {
            throw `حدث خطأ أثناء إضافة الحساب: ${error}`;
        }
    };

    return (
        <Modal isOpen={isOpen} className="w-full flex flex-col justify-center max-w-lg">
            <h3 className="font-bold text-lg mb-4 text-center">إضافة طالب جديد</h3>

            <DynamicForm
                key={isOpen ? "open" : "closed"}
                template={studentFormTemplate}
                onSubmit={handleAddStudent}
                submitLabel="حفظ"
            />

            <button className="btn btn-ghost w-2xs mt-4" onClick={onClose}>إلغاء</button>
        </Modal>
    );
}


function MainContent(): JSX.Element {

    const [data, setData] = useState<studentData[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchData = () => {
        adminRPC.fetchStudents().then((data) => setData(data));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStudent = async (id: number, data: StudentUpdateData) => {
        await adminRPC.updateStudent(id, { student_name: data.student_name });
        fetchData();
    };

    const handleDeleteStudent = async (id: number) => {
        await adminRPC.deleteStudent(id);
        fetchData();
    };

    return <>
        <Section>
            <Subsection>
                <Options onAddClick={() => setIsAddModalOpen(true)} onImportSuccess={fetchData} />
            </Subsection>
            <Subsection>
                <EditableTable
                    data={data || []}
                    headers={{ "student_number": "رقم الطالب", "student_name": "الاسم", ":edit:": "" }}
                    onDelete={handleDeleteStudent}
                    onSave={handleUpdateStudent}
                    formTemplate={studentFormTemplate}
                />
            </Subsection>
        </Section>

        <AddStudentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchData}
        />
    </>;
}


//
export function StudentsPage(): JSX.Element {
    useValidRoute(["admin"], "/login");

    return <>
        <MainLayout
            main={MainContent}
            title={"معلومات الطلاب"}
            sidebar={sidebar_pages}
        />
    </>
}
