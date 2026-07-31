import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type PortalType = {
    children: ReactNode;
};
const Portal = ({ children }: PortalType) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        return () => setMounted(false);
    }, []);

    return mounted ? createPortal(children, document.body) : null;
};

export default Portal;
