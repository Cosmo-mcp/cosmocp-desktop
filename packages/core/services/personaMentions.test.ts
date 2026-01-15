import {describe, expect, it} from "vitest";
import {extractPersonaMentions, stripPersonaMentions} from "./personaMentions";

describe("personaMentions", () => {
    it("extracts persona mentions in order", () => {
        expect(extractPersonaMentions("Hello @alpha and @beta-bot!")).toEqual(["alpha", "beta-bot"]);
    });

    it("deduplicates persona mentions", () => {
        expect(extractPersonaMentions("@alpha @alpha @beta")).toEqual(["alpha", "beta"]);
    });

    it("strips persona mentions and normalizes whitespace", () => {
        expect(stripPersonaMentions("Hi @alpha  there @beta ")).toEqual("Hi there");
    });

    it("handles empty input", () => {
        expect(extractPersonaMentions(null)).toEqual([]);
        expect(stripPersonaMentions("")).toEqual("");
    });
});
