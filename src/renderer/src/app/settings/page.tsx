import {ModelSelector} from "@/components/model-selector";
import {ModeToggle} from "@/components/ModeToggle";

export default function SettingsPage() {
    return (
        <div className="flex flex-1 p-2 gap-4">
            <ModelSelector
                selectedModelId={'null'}
                className="order-1 md:order-2"
            />
            <ModeToggle/>
        </div>
    );
}
