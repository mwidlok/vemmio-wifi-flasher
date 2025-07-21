import type React from "react";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "esp-web-install-button": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                manifest?: string;
            };
        }
    }
}
