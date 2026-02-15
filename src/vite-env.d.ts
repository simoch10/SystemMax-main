/// <reference types="vite/client" />

declare module '*.tsx' {
    import React from 'react';
    const Component: React.FC<any>;
    export default Component;
}

declare module '*.jsx' {
    const Component: any;
    export default Component;
}