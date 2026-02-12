import React from "react";
import {ModelProviderTypeEnum} from "core/database/schema/modelProviderSchema";
import {cn} from "@/lib/utils";

type ThemeType = "light" | "dark";

type ProviderIconProps = {
    type: ModelProviderTypeEnum;
    size?: number;
    theme?: string;
    className?: string;
};

const iconMap: Record<ThemeType, Partial<Record<ModelProviderTypeEnum, string>>> = {
    light: {
        [ModelProviderTypeEnum.OPENAI]: "providers/openai-black.webp",
        [ModelProviderTypeEnum.ANTHROPIC]: "providers/anthropic-black.webp",
        [ModelProviderTypeEnum.GOOGLE]: "providers/gemini.svg",
        [ModelProviderTypeEnum.OLLAMA]: "providers/ollama-light.webp",
        [ModelProviderTypeEnum.CUSTOM]: "providers/custom-provider.webp",
    },
    dark: {
        [ModelProviderTypeEnum.OPENAI]: "providers/openai-white.webp",
        [ModelProviderTypeEnum.ANTHROPIC]: "providers/anthropic-white.webp",
        [ModelProviderTypeEnum.GOOGLE]: "providers/gemini.svg",
        [ModelProviderTypeEnum.OLLAMA]: "providers/ollama-dark.webp",
        [ModelProviderTypeEnum.CUSTOM]: "providers/custom-provider.webp",
    },
};

const ProviderIcon = ({ type, size = 20, theme, className }: ProviderIconProps) => {
    const normalizedTheme: ThemeType = theme === "light" ? "light" : "dark";
    const iconPath =
        iconMap[normalizedTheme][type] ??
        iconMap[normalizedTheme][ModelProviderTypeEnum.CUSTOM];

    return (
        <img
            title={type}
            src={iconPath}
            alt={`${type} icon`}
            width={size}
            height={size}
            className={cn("mr-2 rounded-sm", className)}
        />
    );
};

export default ProviderIcon;
