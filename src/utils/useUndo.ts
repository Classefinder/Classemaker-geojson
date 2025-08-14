import { useRef, useCallback, useState } from 'react';

export interface UndoState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useUndo<T>(initial: T) {
    const stateRef = useRef<UndoState<T>>({
        past: [],
        present: initial,
        future: [],
    });
    // Ajout d'un useState pour forcer le re-render
    const [version, setVersion] = useState(0);

    const forceUpdate = useCallback(() => setVersion(v => v + 1), []);

    const set = useCallback((newPresent: T) => {
        stateRef.current = {
            past: [...stateRef.current.past, stateRef.current.present],
            present: newPresent,
            future: [],
        };
        forceUpdate();
    }, [forceUpdate]);

    const undo = useCallback(() => {
        const { past, present, future } = stateRef.current;
        if (past.length === 0) return present;
        const previous = past[past.length - 1];
        stateRef.current = {
            past: past.slice(0, -1),
            present: previous,
            future: [present, ...future],
        };
        forceUpdate();
        return previous;
    }, [forceUpdate]);

    const redo = useCallback(() => {
        const { past, present, future } = stateRef.current;
        if (future.length === 0) return present;
        const next = future[0];
        stateRef.current = {
            past: [...past, present],
            present: next,
            future: future.slice(1),
        };
        forceUpdate();
        return next;
    }, [forceUpdate]);

    const get = useCallback(() => stateRef.current.present, [version]);

    return { set, undo, redo, get };
}
