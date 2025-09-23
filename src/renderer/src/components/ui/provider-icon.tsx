import {ModelProviderType} from "@/common/models/modelProvider";
import React from "react";

type ThemeType = "light" | "dark";

type ProviderIconProps = {
    type: ModelProviderType;
    size?: number;
    theme?: string;
};

const iconMap = {
    light: {
        [ModelProviderType.OPENAI]: "providers/openai-black.webp",
        [ModelProviderType.ANTHROPIC]: "providers/anthropic-black.webp",
        [ModelProviderType.GOOGLE]: "providers/gemini.svg",
        [ModelProviderType.CUSTOM]: "providers/custom-provider.webp",
    },
    dark: {
        [ModelProviderType.OPENAI]: "providers/openai-white.webp",
        [ModelProviderType.ANTHROPIC]: "providers/anthropic-white.webp",
        [ModelProviderType.GOOGLE]: "providers/gemini.svg",
        [ModelProviderType.CUSTOM]: "providers/custom-provider.webp",
    },
};

const ProviderIcon = ({ type, size = 20, theme }: ProviderIconProps) => {
    const normalizedTheme: ThemeType = theme === "light" ? "light" : "dark";
    const iconPath = iconMap[normalizedTheme][type];

    return (
        <img
            title={type}
            src={iconPath}
            alt={`${type} icon`}
            width={size}
            height={size}
            className="mr-2 rounded-sm"
        />
    );
};

export default ProviderIcon;
