import { useEffect, useRef } from 'react';

interface UndoProviderProps {
    onUndo: () => void;
    onRedo?: () => void;
}

export default function useUndoHotkeys({ onUndo, onRedo }: UndoProviderProps) {
    const undoRef = useRef(onUndo);
    const redoRef = useRef(onRedo);

    useEffect(() => {
        undoRef.current = onUndo;
        redoRef.current = onRedo;
    }, [onUndo, onRedo]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey && redoRef.current) {
                    redoRef.current();
                } else {
                    undoRef.current();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if (redoRef.current) redoRef.current();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
