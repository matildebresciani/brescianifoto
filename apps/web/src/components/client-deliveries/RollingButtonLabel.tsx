import type { CSSProperties } from 'react';

/** Shares the staggered visual label while announcing the button text only once. */
export function RollingButtonLabel({
    label,
    reservedLabel = label,
    className = 'inline-grid',
}: {
    label: string;
    reservedLabel?: string;
    className?: string;
}) {
    return (
        <>
            <span className="sr-only">{label}</span>
            <span className={`h-[1lh] overflow-hidden text-left ${className}`} aria-hidden="true">
                <span className="invisible col-start-1 row-start-1">{reservedLabel}</span>
                <span className="col-start-1 row-start-1 whitespace-nowrap">
                    {Array.from(label).map((character, index) => {
                        const style: CSSProperties & Record<string, number> = { '--roll-index': index };
                        return (
                            <span
                                key={label.slice(0, index + 1)}
                                className="delivery-button-character"
                                data-character={character}
                                style={style}
                            >
                                {character}
                            </span>
                        );
                    })}
                </span>
            </span>
        </>
    );
}
