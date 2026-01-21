import { PersonaList } from "@/components/persona-list";

export default function PersonaPage() {
    return (
        <div className="flex flex-col p-2 md:p-4 h-full w-full">
            <header className="mb-2">
                <h3 className="text-2xl font-semibold">Persona</h3>
            </header>
            <PersonaList />
        </div>
    );

}